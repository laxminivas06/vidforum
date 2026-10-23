import { PoolClient } from 'pg';
import { db } from '../../config/database';

const MAX_VERIFIED_TEMPLATES = 4;

export interface FaceEventInput {
  clientEventId: string;
  studentId: string | null;
  confidence: number | null;
  detectedAt: string;
}

export class FaceRepository {
  async listSections(institutionId: string) {
    const res = await db.query(
      `SELECT sec.id, sec.name AS "sectionName", c.name AS "className",
              count(s.id)::int AS "studentCount",
              count(fp.id)::int AS "enrolledCount"
       FROM sections sec
       JOIN classes c ON c.id = sec.class_id
       LEFT JOIN students s ON s.current_section_id = sec.id AND s.institution_id = sec.institution_id
                            AND s.status = 'active' AND s.deleted_at IS NULL
       LEFT JOIN face_profiles fp ON fp.student_id = s.id
       WHERE sec.institution_id = $1
       GROUP BY sec.id, sec.name, c.name
       ORDER BY c.name, sec.name`,
      [institutionId]
    );
    return res.rows;
  }

  // Section roster + face templates (latest enrollment + newest teacher-verified captures)
  async getSectionGallery(institutionId: string, sectionId: string) {
    const res = await db.query(
      `SELECT s.id, trim(s.first_name || ' ' || s.last_name) AS name, s.roll_number AS "rollNumber",
              s.admission_number AS "admissionNumber", fp.id AS "faceProfileId",
              COALESCE(
                (SELECT json_agg(t.embedding_vector ORDER BY t.kind, t.created_at DESC)
                 FROM (SELECT fe.embedding_vector, fe.kind, fe.created_at
                       FROM face_embeddings fe
                       WHERE fe.face_profile_id = fp.id
                       ORDER BY fe.created_at DESC
                       LIMIT ${1 + MAX_VERIFIED_TEMPLATES}) t),
                '[]'::json) AS templates
       FROM students s
       LEFT JOIN face_profiles fp ON fp.student_id = s.id AND fp.institution_id = s.institution_id
       WHERE s.institution_id = $1 AND s.current_section_id = $2
         AND s.status = 'active' AND s.deleted_at IS NULL
       ORDER BY NULLIF(regexp_replace(s.roll_number, '\\D', '', 'g'), '')::int NULLS LAST, s.first_name`,
      [institutionId, sectionId]
    );
    return res.rows;
  }

  async findStudentsInInstitution(institutionId: string, studentIds: string[]) {
    const res = await db.query(
      `SELECT id, current_section_id AS "sectionId" FROM students
       WHERE institution_id = $1 AND id = ANY($2::uuid[]) AND deleted_at IS NULL`,
      [institutionId, studentIds]
    );
    return res.rows as Array<{ id: string; sectionId: string | null }>;
  }

  async upsertEnrollments(
    institutionId: string,
    items: Array<{ studentId: string; embedding: number[]; quality: number | null; photoKey: string | null }>,
    modelVersion: string,
    actorId: string | null
  ) {
    return db.transaction(async (client) => {
      for (const item of items) {
        const profileRes = await client.query(
          `INSERT INTO face_profiles (institution_id, student_id, registered_by, reference_photo_storage_key)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (student_id) DO UPDATE
             SET registered_by = EXCLUDED.registered_by,
                 reference_photo_storage_key = COALESCE(EXCLUDED.reference_photo_storage_key, face_profiles.reference_photo_storage_key),
                 updated_at = now()
           WHERE face_profiles.institution_id = EXCLUDED.institution_id
           RETURNING id`,
          [institutionId, item.studentId, actorId, item.photoKey]
        );
        if (profileRes.rows.length === 0) throw new Error('Face profile belongs to another institution');
        const profileId = profileRes.rows[0].id;

        // Re-enrollment resets every template, including learned ones
        await client.query('DELETE FROM face_embeddings WHERE face_profile_id = $1', [profileId]);
        await client.query(
          `INSERT INTO face_embeddings (face_profile_id, embedding_vector, model_version, quality, kind)
           VALUES ($1, $2, $3, $4, 'enrolled')`,
          [profileId, item.embedding, modelVersion, item.quality]
        );
      }
      return items.length;
    });
  }

  async addVerifiedTemplates(
    client: PoolClient,
    institutionId: string,
    items: Array<{ studentId: string; embedding: number[] }>,
    modelVersion: string
  ) {
    for (const item of items) {
      const profileRes = await client.query(
        'SELECT id FROM face_profiles WHERE institution_id = $1 AND student_id = $2',
        [institutionId, item.studentId]
      );
      if (profileRes.rows.length === 0) continue;
      const profileId = profileRes.rows[0].id;
      await client.query(
        `INSERT INTO face_embeddings (face_profile_id, embedding_vector, model_version, kind)
         VALUES ($1, $2, $3, 'verified')`,
        [profileId, item.embedding, modelVersion]
      );
      await client.query(
        `DELETE FROM face_embeddings WHERE id IN (
           SELECT id FROM face_embeddings WHERE face_profile_id = $1 AND kind = 'verified'
           ORDER BY created_at DESC OFFSET $2)`,
        [profileId, MAX_VERIFIED_TEMPLATES]
      );
    }
  }

  async deleteEnrollment(institutionId: string, studentId: string) {
    const res = await db.query(
      'DELETE FROM face_profiles WHERE institution_id = $1 AND student_id = $2 RETURNING reference_photo_storage_key AS "photoKey"',
      [institutionId, studentId]
    );
    return res.rows[0] || null;
  }

  // ================= DEVICES =================
  async registerDevice(
    institutionId: string,
    data: { deviceCode: string; deviceType: 'web' | 'terminal'; roomId?: string | null; metadata?: object; apiKeyHash?: string | null }
  ) {
    const res = await db.query(
      `INSERT INTO camera_devices (institution_id, room_id, device_code, device_type, metadata, api_key_hash, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (institution_id, device_code) DO UPDATE
         SET metadata = EXCLUDED.metadata,
             room_id = COALESCE(EXCLUDED.room_id, camera_devices.room_id),
             api_key_hash = COALESCE(EXCLUDED.api_key_hash, camera_devices.api_key_hash),
             last_seen_at = now()
       WHERE camera_devices.device_type = EXCLUDED.device_type
       RETURNING id, device_code AS "deviceCode", device_type AS "deviceType"`,
      [institutionId, data.roomId || null, data.deviceCode, data.deviceType, data.metadata || {}, data.apiKeyHash || null]
    );
    if (res.rows.length === 0) throw new Error('Device code is already used by a device of another type');
    return res.rows[0];
  }

  async findDeviceById(institutionId: string, deviceId: string) {
    const res = await db.query(
      `SELECT id FROM camera_devices WHERE id = $1 AND institution_id = $2 AND status = 'active'`,
      [deviceId, institutionId]
    );
    return res.rows[0] || null;
  }

  async findTerminalByKeyHash(keyHash: string) {
    const res = await db.query(
      `UPDATE camera_devices SET last_seen_at = now()
       WHERE api_key_hash = $1 AND device_type = 'terminal' AND status = 'active'
       RETURNING id, institution_id AS "institutionId"`,
      [keyHash]
    );
    return res.rows[0] || null;
  }

  // ================= EVENTS =================
  // Idempotent on client_event_id so offline queues can be retried safely.
  // Returns clientEventId -> { id, inserted } (inserted=false when the event was already synced).
  async insertEvents(
    client: { query: (text: string, params?: any[]) => Promise<any> },
    institutionId: string,
    deviceId: string,
    sessionId: string | null,
    events: FaceEventInput[]
  ) {
    const ids = new Map<string, { id: string; inserted: boolean }>();
    for (const ev of events) {
      const res = await client.query(
        `INSERT INTO ai_attendance_events
           (institution_id, camera_device_id, student_id, face_profile_id, session_id, confidence, detected_at, client_event_id)
         VALUES ($1, $2, $3, (SELECT id FROM face_profiles WHERE student_id = $3 AND institution_id = $1), $4, $5, $6, $7)
         ON CONFLICT (client_event_id) DO UPDATE SET session_id = COALESCE(EXCLUDED.session_id, ai_attendance_events.session_id)
         WHERE ai_attendance_events.institution_id = EXCLUDED.institution_id
         RETURNING id, (xmax = 0) AS inserted`,
        [institutionId, deviceId, ev.studentId, sessionId, ev.confidence, ev.detectedAt, ev.clientEventId]
      );
      if (res.rows[0]) ids.set(ev.clientEventId, res.rows[0]);
    }
    return ids;
  }

  async resolveStudentsByAdmission(institutionId: string, refs: string[]) {
    const res = await db.query(
      `SELECT id, admission_number AS "admissionNumber" FROM students
       WHERE institution_id = $1 AND admission_number = ANY($2::text[]) AND deleted_at IS NULL`,
      [institutionId, refs]
    );
    return new Map<string, string>(res.rows.map((r: any) => [r.admissionNumber, r.id]));
  }

  // Terminal (and other device) detections for a section within a time window, for the review screen
  async listSectionEvents(institutionId: string, sectionId: string, from: string, to: string) {
    const res = await db.query(
      `SELECT DISTINCT ON (ae.student_id) ae.id, ae.student_id AS "studentId", ae.confidence,
              ae.detected_at AS "detectedAt", cd.device_code AS "deviceCode", cd.device_type AS "deviceType"
       FROM ai_attendance_events ae
       JOIN students s ON s.id = ae.student_id AND s.institution_id = ae.institution_id
       JOIN camera_devices cd ON cd.id = ae.camera_device_id
       WHERE ae.institution_id = $1 AND s.current_section_id = $2 AND cd.device_type = 'terminal'
         AND ae.detected_at >= $3 AND ae.detected_at < $4
       ORDER BY ae.student_id, ae.confidence DESC NULLS LAST`,
      [institutionId, sectionId, from, to]
    );
    return res.rows;
  }

  // =========================================================================
  // AUTOMATED MULTI-FACE GROUP ATTENDANCE (MODULES 13 - 16)
  // =========================================================================

  async getInstitutionGallery(institutionId: string) {
    const res = await db.query(
      `SELECT s.id, 
              trim(s.first_name || ' ' || s.last_name) AS name, 
              s.roll_number AS "rollNumber",
              s.admission_number AS "admissionNumber",
              c.id AS "classId",
              c.name AS "className", 
              sec.id AS "sectionId",
              COALESCE(sec.name, 'A') AS "sectionName",
              fp.id AS "faceProfileId",
              COALESCE(
                (SELECT json_agg(t.embedding_vector ORDER BY t.kind, t.created_at DESC)
                 FROM (SELECT fe.embedding_vector, fe.kind, fe.created_at
                       FROM face_embeddings fe
                       WHERE fe.face_profile_id = fp.id
                       ORDER BY fe.created_at DESC
                       LIMIT 5) t),
                '[]'::json) AS templates
       FROM students s
       JOIN classes c ON c.id = s.current_class_id
       LEFT JOIN sections sec ON sec.id = s.current_section_id
       JOIN face_profiles fp ON fp.student_id = s.id AND fp.institution_id = s.institution_id
       WHERE s.institution_id = $1 AND s.status = 'active' AND s.deleted_at IS NULL
       ORDER BY c.sequence_order ASC, s.first_name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async recordGroupFaceAttendance(institutionId: string, items: Array<{
    studentId: string;
    detectedAt: string;
    confidence: number;
    proofThumbnailUrl?: string;
    sessionType?: 'AM' | 'PM';
    status?: 'PRESENT' | 'NEEDS_REVIEW';
  }>) {
    const results = [];
    for (const item of items) {
      // Server-authoritative AM/PM calculation if not provided
      const now = new Date(item.detectedAt || Date.now());
      const sessionType = item.sessionType || (now.getHours() < 12 ? 'AM' : 'PM');
      const status = item.status || 'PRESENT';

      const res = await db.query(
        `INSERT INTO automated_face_attendance_records (
          institution_id, student_id, attendance_date, session_type,
          detected_at, confidence, proof_thumbnail_url, status
         ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)
         ON CONFLICT (institution_id, student_id, attendance_date, session_type) DO NOTHING
         RETURNING *`,
        [
          institutionId,
          item.studentId,
          sessionType,
          item.detectedAt || new Date().toISOString(),
          item.confidence,
          item.proofThumbnailUrl || null,
          status,
        ]
      );
      if (res.rows[0]) {
        results.push(res.rows[0]);
      }
    }
    return results;
  }

  async listLiveRecords(institutionId: string, filters?: {
    date?: string;
    sessionType?: string;
    classId?: string;
    sectionId?: string;
    status?: string;
  }) {
    const values: any[] = [institutionId];
    let idx = 2;
    let where = 'ar.institution_id = $1';

    if (filters?.date) {
      where += ` AND ar.attendance_date = $${idx++}::date`;
      values.push(filters.date);
    } else {
      where += ' AND ar.attendance_date = CURRENT_DATE';
    }

    if (filters?.sessionType && filters.sessionType !== 'all') {
      where += ` AND ar.session_type = $${idx++}`;
      values.push(filters.sessionType);
    }

    if (filters?.classId && filters.classId !== 'all') {
      where += ` AND c.id = $${idx++}`;
      values.push(filters.classId);
    }

    if (filters?.sectionId && filters.sectionId !== 'all') {
      where += ` AND sec.id = $${idx++}`;
      values.push(filters.sectionId);
    }

    if (filters?.status && filters.status !== 'all') {
      where += ` AND ar.status = $${idx++}`;
      values.push(filters.status);
    }

    const res = await db.query(
      `SELECT 
        ar.id,
        ar.institution_id,
        ar.student_id,
        trim(s.first_name || ' ' || s.last_name) as student_name,
        s.roll_number,
        s.admission_number,
        c.name as class_name,
        COALESCE(sec.name, 'A') as section_name,
        ar.attendance_date,
        ar.session_type,
        ar.detected_at,
        ar.confidence,
        ar.proof_thumbnail_url,
        ar.status
       FROM automated_face_attendance_records ar
       JOIN students s ON s.id = ar.student_id
       JOIN classes c ON c.id = s.current_class_id
       LEFT JOIN sections sec ON sec.id = s.current_section_id
       WHERE ${where}
       ORDER BY ar.detected_at DESC`,
      values
    );
    return res.rows;
  }

  async getAttendanceReports(institutionId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const totalStudentsRes = await db.query(
      `SELECT count(*)::int as count FROM students WHERE institution_id = $1 AND status = 'active' AND deleted_at IS NULL`,
      [institutionId]
    );
    const totalStudents = totalStudentsRes.rows[0]?.count || 0;

    const presentRes = await db.query(
      `SELECT count(DISTINCT student_id)::int as count 
       FROM automated_face_attendance_records 
       WHERE institution_id = $1 AND attendance_date = $2::date AND status = 'PRESENT'`,
      [institutionId, targetDate]
    );
    const presentCount = presentRes.rows[0]?.count || 0;

    const amRes = await db.query(
      `SELECT count(DISTINCT student_id)::int as count 
       FROM automated_face_attendance_records 
       WHERE institution_id = $1 AND attendance_date = $2::date AND session_type = 'AM' AND status = 'PRESENT'`,
      [institutionId, targetDate]
    );

    const pmRes = await db.query(
      `SELECT count(DISTINCT student_id)::int as count 
       FROM automated_face_attendance_records 
       WHERE institution_id = $1 AND attendance_date = $2::date AND session_type = 'PM' AND status = 'PRESENT'`,
      [institutionId, targetDate]
    );

    const classBreakdownRes = await db.query(
      `SELECT 
        c.name as class_name,
        count(DISTINCT s.id)::int as total_students,
        count(DISTINCT ar.student_id)::int as present_students
       FROM classes c
       JOIN students s ON s.current_class_id = c.id AND s.status = 'active' AND s.deleted_at IS NULL
       LEFT JOIN automated_face_attendance_records ar ON ar.student_id = s.id AND ar.attendance_date = $2::date AND ar.status = 'PRESENT'
       WHERE c.institution_id = $1
       GROUP BY c.id, c.name, c.sequence_order
       ORDER BY c.sequence_order ASC`,
      [institutionId, targetDate]
    );

    return {
      date: targetDate,
      totalStudents,
      presentCount,
      absentCount: Math.max(0, totalStudents - presentCount),
      attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0,
      amCount: amRes.rows[0]?.count || 0,
      pmCount: pmRes.rows[0]?.count || 0,
      classBreakdown: classBreakdownRes.rows,
    };
  }
}

export const faceRepository = new FaceRepository();

