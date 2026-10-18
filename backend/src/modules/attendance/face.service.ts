import { createHash, randomBytes } from 'crypto';
import { db } from '../../config/database';
import { AuditDispatcher } from '../../common/audit-dispatcher';
import { putPrivateObject, deletePrivateObject } from '../../utils/object-storage';
import { attendanceRepository } from './attendance.repository';
import { attendanceService } from './attendance.service';
import { faceRepository, FaceEventInput } from './face.repository';

type Caller = { id: string; role: string };

const FACULTY_ROLES = ['TEACHER', 'FACULTY'];
const DEVICE_ADMIN_ROLES = ['INSTITUTION_ADMIN', 'SUPER_ADMIN']; // only admins may mint terminal API keys
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BATCH = 500;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

// Deterministic UUID from any string, so terminals without UUIDs still sync idempotently
const hashToUuid = (value: string) => {
  const h = sha256(value);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

function assertEmbedding(value: unknown): number[] {
  if (!Array.isArray(value) || value.length < 128 || value.length > 2048 || !value.every((n) => Number.isFinite(n))) {
    throw new Error('Invalid face embedding');
  }
  return value as number[];
}

function assertUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw new Error(`${field} must be a UUID`);
  return value;
}

function assertTimestamp(value: unknown, field: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new Error(`${field} must be an ISO timestamp`);
  return value;
}

function clampConfidence(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : null;
}

export class FaceAttendanceService {
  private async assertSectionAccess(institutionId: string, sectionId: string, caller: Caller) {
    if (!FACULTY_ROLES.includes(caller.role)) return;
    const ok = await attendanceRepository.verifyFacultySectionAccess(institutionId, caller.id, sectionId);
    if (!ok) throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only manage face attendance for assigned sections');
  }

  async listSections(institutionId: string, caller: Caller) {
    const sections = await faceRepository.listSections(institutionId);
    if (!FACULTY_ROLES.includes(caller.role)) return sections;
    const allowed = await Promise.all(
      sections.map((s: any) => attendanceRepository.verifyFacultySectionAccess(institutionId, caller.id, s.id))
    );
    return sections.filter((_: any, i: number) => allowed[i]);
  }

  async getGallery(institutionId: string, sectionId: string, caller: Caller) {
    assertUuid(sectionId, 'sectionId');
    await this.assertSectionAccess(institutionId, sectionId, caller);
    return faceRepository.getSectionGallery(institutionId, sectionId);
  }

  async enroll(
    institutionId: string,
    body: { modelVersion?: string; items?: Array<{ studentId: string; embedding: number[]; quality?: number; photo?: string }> },
    caller: Caller
  ) {
    const modelVersion = String(body.modelVersion || '').trim();
    if (!modelVersion) throw new Error('modelVersion is required');
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0 || items.length > 100) throw new Error('Provide between 1 and 100 enrollments per request');

    const ids = items.map((i) => assertUuid(i.studentId, 'studentId'));
    if (new Set(ids).size !== ids.length) throw new Error('Each student can only be enrolled once per request');

    const students = await faceRepository.findStudentsInInstitution(institutionId, ids);
    if (students.length !== ids.length) throw new Error('One or more students were not found in this institution');
    for (const sectionId of new Set(students.map((s) => s.sectionId).filter(Boolean) as string[])) {
      await this.assertSectionAccess(institutionId, sectionId, caller);
    }

    const embeddings = items.map((item) => assertEmbedding(item.embedding)); // validate all before any upload
    const prepared = [];
    for (const [i, item] of items.entries()) {
      const embedding = embeddings[i];
      let photoKey: string | null = null;
      if (typeof item.photo === 'string' && item.photo.length > 0) {
        const base64 = item.photo.replace(/^data:image\/jpeg;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        if (buffer.length > 200_000) throw new Error('Reference photo is too large (max 200KB)');
        photoKey = await putPrivateObject(`${institutionId}/face/${item.studentId}.jpg`, buffer, 'image/jpeg');
      }
      prepared.push({ studentId: item.studentId, embedding, quality: clampConfidence(item.quality), photoKey });
    }

    const count = await faceRepository.upsertEnrollments(institutionId, prepared, modelVersion, caller.id);

    await AuditDispatcher.dispatch({
      actorId: caller.id,
      action: 'face_attendance.enrolled',
      resource: 'face_profiles',
      resourceId: ids[0],
      institutionId,
      newValue: { count, studentIds: ids, modelVersion },
    });

    return { enrolled: count };
  }

  async deleteEnrollment(institutionId: string, studentId: string, caller: Caller) {
    assertUuid(studentId, 'studentId');
    const [student] = await faceRepository.findStudentsInInstitution(institutionId, [studentId]);
    if (!student) throw new Error('Student not found');
    if (student.sectionId) await this.assertSectionAccess(institutionId, student.sectionId, caller);

    const removed = await faceRepository.deleteEnrollment(institutionId, studentId);
    if (removed?.photoKey) await deletePrivateObject(removed.photoKey);

    await AuditDispatcher.dispatch({
      actorId: caller.id,
      action: 'face_attendance.enrollment_deleted',
      resource: 'face_profiles',
      resourceId: studentId,
      institutionId,
      newValue: { studentId },
    });
    return { deleted: Boolean(removed) };
  }

  // ================= DEVICES =================
  async registerDevice(
    institutionId: string,
    body: { deviceCode?: string; deviceType?: string; roomId?: string; metadata?: object },
    caller: Caller
  ) {
    const deviceType = body.deviceType === 'terminal' ? 'terminal' : 'web';
    const deviceCode = String(body.deviceCode || '').trim();
    if (!deviceCode || deviceCode.length > 100) throw new Error('deviceCode is required (max 100 chars)');

    if (deviceType === 'web') {
      return faceRepository.registerDevice(institutionId, { deviceCode, deviceType, metadata: body.metadata });
    }

    if (!DEVICE_ADMIN_ROLES.includes(caller.role)) {
      throw new Error('RESOURCE_ACCESS_DENIED: Only administrators can register attendance terminals');
    }
    // Shown once; only the hash is stored. Re-registering the same code rotates the key.
    const apiKey = `vidt_${randomBytes(24).toString('hex')}`;
    const device = await faceRepository.registerDevice(institutionId, {
      deviceCode,
      deviceType,
      roomId: body.roomId ? assertUuid(body.roomId, 'roomId') : null,
      metadata: body.metadata,
      apiKeyHash: sha256(apiKey),
    });

    await AuditDispatcher.dispatch({
      actorId: caller.id,
      action: 'face_attendance.terminal_registered',
      resource: 'camera_devices',
      resourceId: device.id,
      institutionId,
      newValue: { deviceCode },
    });
    return { ...device, apiKey };
  }

  /** Push endpoint for dedicated terminals (ZKTeco / Hikvision / eSSL bridges). Authenticated by device key only. */
  async ingestDeviceEvents(
    apiKey: string | undefined,
    body: { events?: Array<{ eventId?: string; studentRef?: string; confidence?: number; detectedAt?: string }> }
  ) {
    if (!apiKey) throw new Error('UNAUTHORIZED: Device key missing');
    const device = await faceRepository.findTerminalByKeyHash(sha256(apiKey));
    if (!device) throw new Error('UNAUTHORIZED: Unknown or inactive device');

    const raw = Array.isArray(body.events) ? body.events : [];
    if (raw.length === 0 || raw.length > MAX_BATCH) throw new Error(`Provide between 1 and ${MAX_BATCH} events`);

    const refs = [...new Set(raw.map((e) => String(e.studentRef || '').trim()).filter(Boolean))];
    const studentMap = await faceRepository.resolveStudentsByAdmission(device.institutionId, refs);

    const events: FaceEventInput[] = raw.map((e) => {
      const detectedAt = assertTimestamp(e.detectedAt, 'detectedAt');
      const ref = String(e.studentRef || '').trim();
      return {
        clientEventId: hashToUuid(`${device.id}:${e.eventId ?? `${ref}@${detectedAt}`}`),
        studentId: studentMap.get(ref) || null,
        confidence: clampConfidence(e.confidence),
        detectedAt,
      };
    });

    const ids = await faceRepository.insertEvents(db, device.institutionId, device.id, null, events);
    return {
      accepted: ids.size,
      unknownStudentRefs: refs.filter((r) => !studentMap.has(r)),
    };
  }

  async listSectionEvents(institutionId: string, sectionId: string, from: string, to: string, caller: Caller) {
    assertUuid(sectionId, 'sectionId');
    await this.assertSectionAccess(institutionId, sectionId, caller);
    return faceRepository.listSectionEvents(
      institutionId,
      sectionId,
      assertTimestamp(from, 'from'),
      assertTimestamp(to, 'to')
    );
  }

  // ================= SUBMIT (teacher-verified) =================
  /**
   * Nothing is written to attendance_records until the teacher reviews and submits (PRD rule 12).
   * Idempotent: replaying the same offline payload produces no duplicate events or records.
   */
  async submit(
    institutionId: string,
    body: {
      sectionId?: string;
      sessionDate?: string;
      periodNumber?: number;
      deviceId?: string;
      modelVersion?: string;
      events?: Array<{ clientEventId: string; studentId: string | null; confidence?: number; detectedAt: string }>;
      records?: Array<{ studentId: string; status: string; source?: string; clientEventId?: string; template?: number[] }>;
    },
    caller: Caller
  ) {
    const sectionId = assertUuid(body.sectionId, 'sectionId');
    const deviceId = assertUuid(body.deviceId, 'deviceId');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.sessionDate))) throw new Error('sessionDate must be YYYY-MM-DD');
    const periodNumber = Number(body.periodNumber);
    if (![1, 2].includes(periodNumber)) throw new Error('periodNumber must be 1 (morning) or 2 (afternoon)');

    const records = Array.isArray(body.records) ? body.records : [];
    const rawEvents = Array.isArray(body.events) ? body.events : [];
    if (records.length === 0) throw new Error('Attendance records array cannot be empty');
    if (records.length > MAX_BATCH || rawEvents.length > MAX_BATCH) throw new Error('Too many records in one submission');

    if (!(await faceRepository.findDeviceById(institutionId, deviceId))) throw new Error('Unknown attendance device');

    // Students who left the section after attendance was taken (e.g. queued offline) are skipped, not fatal,
    // so the rest of the class still syncs
    const roster = await faceRepository.getSectionGallery(institutionId, sectionId);
    const rosterIds = new Set(roster.map((s: any) => s.id));
    const skipped = records.filter((r) => !rosterIds.has(r.studentId)).map((r) => r.studentId);
    const kept = records.filter((r) => rosterIds.has(r.studentId));
    if (kept.length === 0) throw new Error('None of the submitted students are in this section any more');

    // Validate learned templates before writing anything
    const modelVersion = String(body.modelVersion || '').trim();
    const templates = kept
      .filter((r) => r.template && r.status === 'present' && r.source === 'ai_face')
      .map((r) => ({ studentId: r.studentId, clientEventId: r.clientEventId, embedding: assertEmbedding(r.template) }));

    const events: FaceEventInput[] = rawEvents.map((e) => ({
      clientEventId: assertUuid(e.clientEventId, 'clientEventId'),
      studentId: e.studentId && rosterIds.has(e.studentId) ? e.studentId : null,
      confidence: clampConfidence(e.confidence),
      detectedAt: assertTimestamp(e.detectedAt, 'detectedAt'),
    }));

    const session = await attendanceService.getOrCreateSession(
      institutionId,
      { sectionId, sessionDate: String(body.sessionDate), periodNumber },
      caller
    );

    const eventIds = await faceRepository.insertEvents(db, institutionId, deviceId, session.id, events);

    // Replay of an already-applied submission (offline retry, two tabs, background sync): don't rewrite the
    // records or re-send parent absence alerts
    const aiEventIds = kept.filter((r) => r.source === 'ai_face' && r.clientEventId).map((r) => eventIds.get(r.clientEventId!)?.id);
    if (aiEventIds.length > 0 && aiEventIds.every(Boolean) && Array.from(eventIds.values()).every((e) => !e.inserted)) {
      const applied = await db.query(
        'SELECT count(*)::int n FROM attendance_records WHERE session_id = $1 AND is_final = true AND ai_event_id = ANY($2::uuid[])',
        [session.id, aiEventIds]
      );
      if (applied.rows[0].n === aiEventIds.length) {
        return { sessionId: session.id, replay: true, count: kept.length, skipped, learnedTemplates: 0 };
      }
    }

    const result = await attendanceService.submitRollCall(
      institutionId,
      session.id,
      kept.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        source: r.source === 'ai_face' ? 'ai_face' : 'manual',
        aiEventId: (r.clientEventId && eventIds.get(r.clientEventId)?.id) || null,
      })),
      caller,
      { finalize: true }
    );

    // Learn teacher-verified live captures so recognition adapts to real classroom lighting.
    // Only for events new in this request, so replaying an offline submission learns nothing twice.
    const learn = templates.filter((t) => t.clientEventId && eventIds.get(t.clientEventId)?.inserted);
    if (modelVersion && learn.length > 0) {
      await db.transaction((client) => faceRepository.addVerifiedTemplates(client, institutionId, learn, modelVersion));
    }

    return { ...result, sessionId: session.id, skipped, learnedTemplates: learn.length };
  }
}

export const faceAttendanceService = new FaceAttendanceService();
