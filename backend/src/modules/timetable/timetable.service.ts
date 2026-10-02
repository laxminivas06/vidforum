import { timetableRepository, ConflictResult } from './timetable.repository';
import { AuditDispatcher } from '../../common/audit-dispatcher';

export class ConflictError extends Error {
  public code: string;
  public conflicts: any[];
  constructor(message: string, conflicts: any[]) {
    super(message);
    this.name = 'ConflictError';
    this.code = 'CONFLICT_DETECTED';
    this.conflicts = conflicts;
  }
}

export class TimetableService {
  // Rooms
  async listRooms(institutionId: string) {
    return timetableRepository.listRooms(institutionId);
  }

  async getRoom(institutionId: string, id: string) {
    return timetableRepository.getRoomById(institutionId, id);
  }

  async createRoom(institutionId: string, data: { name: string; capacity?: number; roomType?: string }) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Room name is required');
    }
    return timetableRepository.createRoom(institutionId, data);
  }

  async updateRoom(institutionId: string, id: string, data: Partial<{ name: string; capacity: number; roomType: string }>) {
    return timetableRepository.updateRoom(institutionId, id, data);
  }

  async deleteRoom(institutionId: string, id: string) {
    return timetableRepository.deleteRoom(institutionId, id);
  }

  // Periods
  async listPeriods(institutionId: string) {
    return timetableRepository.listPeriods(institutionId);
  }

  async getPeriod(institutionId: string, id: string) {
    return timetableRepository.getPeriodById(institutionId, id);
  }

  async createPeriod(institutionId: string, data: { name: string; startTime: string; endTime: string; isBreak?: boolean; sequenceOrder: number }) {
    if (!data.name || !data.startTime || !data.endTime) {
      throw new Error('Period name, start time, and end time are required');
    }
    if (data.startTime >= data.endTime) {
      throw new Error('Period end time must be later than start time');
    }
    return timetableRepository.createPeriod(institutionId, data);
  }

  async updatePeriod(institutionId: string, id: string, data: Partial<{ name: string; startTime: string; endTime: string; isBreak: boolean; sequenceOrder: number }>) {
    return timetableRepository.updatePeriod(institutionId, id, data);
  }

  async deletePeriod(institutionId: string, id: string) {
    return timetableRepository.deletePeriod(institutionId, id);
  }

  // Timetables
  async listTimetables(institutionId: string, filters?: { academicYearId?: string; classId?: string; sectionId?: string; isPublished?: boolean }) {
    return timetableRepository.listTimetables(institutionId, filters);
  }

  async getTimetable(institutionId: string, id: string) {
    const timetable = await timetableRepository.getTimetableById(institutionId, id);
    if (!timetable) return null;
    const entries = await timetableRepository.listEntries(institutionId, { timetableId: id });
    return {
      ...timetable,
      entries,
    };
  }

  async createTimetable(institutionId: string, data: { academicYearId: string; classId?: string | null; sectionId?: string | null; name: string }) {
    if (!data.name || !data.academicYearId) {
      throw new Error('Timetable name and academic year ID are required');
    }
    return timetableRepository.createTimetable(institutionId, data);
  }

  async deleteTimetable(institutionId: string, id: string) {
    return timetableRepository.deleteTimetable(institutionId, id);
  }

  // Conflict Checking
  async checkCandidateConflict(institutionId: string, candidate: {
    timetableId?: string;
    sectionId: string;
    facultyId: string;
    roomId?: string | null;
    dayOfWeek: string;
    periodId: string;
    excludeEntryId?: string;
  }): Promise<ConflictResult> {
    return timetableRepository.checkCandidateConflicts(institutionId, candidate);
  }

  async auditTimetableConflicts(institutionId: string, timetableId: string): Promise<ConflictResult> {
    return timetableRepository.checkTimetableConflicts(institutionId, timetableId);
  }

  // Timetable Entries
  async listEntries(institutionId: string, filters: { timetableId?: string; sectionId?: string; facultyId?: string; roomId?: string; dayOfWeek?: string; periodId?: string }) {
    return timetableRepository.listEntries(institutionId, filters);
  }

  async createEntry(institutionId: string, data: {
    timetableId: string;
    sectionId: string;
    subjectId: string;
    facultyId: string;
    roomId?: string | null;
    dayOfWeek: string;
    periodId: string;
  }) {
    // 1. Conflict detection pre-flight
    const conflictResult = await this.checkCandidateConflict(institutionId, data);
    if (conflictResult.hasConflict) {
      throw new ConflictError(
        `Scheduling conflict detected: ${conflictResult.conflicts.map((c) => c.message).join('; ')}`,
        conflictResult.conflicts
      );
    }

    // 2. Create entry
    return timetableRepository.createEntry(institutionId, data);
  }

  async deleteEntry(institutionId: string, id: string) {
    return timetableRepository.deleteEntry(institutionId, id);
  }

  // Publishing Engine
  async publishTimetable(institutionId: string, timetableId: string, actorId: string) {
    const timetable = await timetableRepository.getTimetableById(institutionId, timetableId);
    if (!timetable) {
      throw new Error('Timetable not found');
    }

    // Section 9.7 & Section 18: Conflict detection blocks publish
    const audit = await timetableRepository.checkTimetableConflicts(institutionId, timetableId);
    if (audit.hasConflict) {
      throw new ConflictError(
        `Cannot publish timetable "${timetable.name}": detected ${audit.conflicts.length} scheduling conflicts`,
        audit.conflicts
      );
    }

    const updated = await timetableRepository.setPublishStatus(institutionId, timetableId, true);

    await AuditDispatcher.dispatch({
      actorId,
      action: 'timetable.published',
      resource: 'timetables',
      resourceId: timetableId,
      institutionId,
      newValue: { isPublished: true, publishedAt: updated?.publishedAt },
    });

    return updated;
  }

  async unpublishTimetable(institutionId: string, timetableId: string, actorId: string) {
    const updated = await timetableRepository.setPublishStatus(institutionId, timetableId, false);

    await AuditDispatcher.dispatch({
      actorId,
      action: 'timetable.unpublished',
      resource: 'timetables',
      resourceId: timetableId,
      institutionId,
      newValue: { isPublished: false },
    });

    return updated;
  }

  // Substitutions
  async listSubstitutions(institutionId: string, filters?: { date?: string; staffId?: string }) {
    return timetableRepository.listSubstitutions(institutionId, filters);
  }

  async createSubstitution(institutionId: string, data: {
    timetableEntryId: string;
    substituteDate: string;
    originalStaffId: string;
    substituteStaffId: string;
    reason?: string;
  }, actorId: string) {
    if (!data.timetableEntryId || !data.substituteDate || !data.originalStaffId || !data.substituteStaffId) {
      throw new Error('timetableEntryId, substituteDate, originalStaffId, and substituteStaffId are required');
    }

    const sub = await timetableRepository.createSubstitution(institutionId, data);

    await AuditDispatcher.dispatch({
      actorId,
      action: 'timetable.substitution_created',
      resource: 'substitutions',
      resourceId: sub.id,
      institutionId,
      newValue: data,
    });

    return sub;
  }

  // Scoped Schedule
  async getScopedSchedule(institutionId: string, user: { id: string; role: string }, options: { date?: string; dayOfWeek?: string }) {
    return timetableRepository.getScopedSchedule(institutionId, user, options);
  }
}

export const timetableService = new TimetableService();
