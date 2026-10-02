import { Request, Response } from 'express';
import { timetableService, ConflictError } from './timetable.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class TimetableController {
  // ================= ROOMS =================
  async listRooms(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const rooms = await timetableService.listRooms(instId);
      sendSuccess(res, rooms, 'Rooms retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name, capacity, roomType } = req.body;
      const room = await timetableService.createRoom(instId, { name, capacity, roomType });
      sendSuccess(res, room, 'Room created successfully', 201);
    } catch (error: any) {
      if (error.code === '23505') {
        sendError(res, `Room with name "${req.body.name}" already exists`, 409, 'DUPLICATE_ENTITY');
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const updated = await timetableService.updateRoom(instId, id, req.body);
      if (!updated) {
        sendError(res, 'Room not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, updated, 'Room updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const deleted = await timetableService.deleteRoom(instId, id);
      if (!deleted) {
        sendError(res, 'Room not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, { deleted: true }, 'Room deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= PERIODS =================
  async listPeriods(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const periods = await timetableService.listPeriods(instId);
      sendSuccess(res, periods, 'Periods retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createPeriod(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name, startTime, endTime, isBreak, sequenceOrder } = req.body;
      const period = await timetableService.createPeriod(instId, {
        name,
        startTime,
        endTime,
        isBreak,
        sequenceOrder: Number(sequenceOrder),
      });
      sendSuccess(res, period, 'Period created successfully', 201);
    } catch (error: any) {
      if (error.code === '23505') {
        sendError(res, `Period with name "${req.body.name}" already exists`, 409, 'DUPLICATE_ENTITY');
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  async updatePeriod(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const updated = await timetableService.updatePeriod(instId, id, req.body);
      if (!updated) {
        sendError(res, 'Period not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, updated, 'Period updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async deletePeriod(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const deleted = await timetableService.deletePeriod(instId, id);
      if (!deleted) {
        sendError(res, 'Period not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, { deleted: true }, 'Period deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= TIMETABLES =================
  async listTimetables(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { academicYearId, classId, sectionId, isPublished } = req.query;
      const timetables = await timetableService.listTimetables(instId, {
        academicYearId: academicYearId as string,
        classId: classId as string,
        sectionId: sectionId as string,
        isPublished: isPublished !== undefined ? isPublished === 'true' : undefined,
      });
      sendSuccess(res, timetables, 'Timetables retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getTimetable(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const timetable = await timetableService.getTimetable(instId, id);
      if (!timetable) {
        sendError(res, 'Timetable not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, timetable, 'Timetable retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createTimetable(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { academicYearId, classId, sectionId, name } = req.body;
      const timetable = await timetableService.createTimetable(instId, {
        academicYearId,
        classId,
        sectionId,
        name,
      });
      sendSuccess(res, timetable, 'Timetable created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async deleteTimetable(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const deleted = await timetableService.deleteTimetable(instId, id);
      if (!deleted) {
        sendError(res, 'Timetable not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, { deleted: true }, 'Timetable deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= CONFLICT CHECKING =================
  async checkConflict(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { timetableId, sectionId, facultyId, roomId, dayOfWeek, periodId, excludeEntryId } = req.body;
      const result = await timetableService.checkCandidateConflict(instId, {
        timetableId,
        sectionId,
        facultyId,
        roomId,
        dayOfWeek,
        periodId,
        excludeEntryId,
      });
      sendSuccess(res, result, 'Conflict check completed');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async auditTimetableConflicts(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const result = await timetableService.auditTimetableConflicts(instId, id);
      sendSuccess(res, result, 'Timetable conflict audit completed');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ================= ENTRIES =================
  async listEntries(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { timetableId, sectionId, facultyId, roomId, dayOfWeek, periodId } = req.query;
      const entries = await timetableService.listEntries(instId, {
        timetableId: timetableId as string,
        sectionId: sectionId as string,
        facultyId: facultyId as string,
        roomId: roomId as string,
        dayOfWeek: dayOfWeek as string,
        periodId: periodId as string,
      });
      sendSuccess(res, entries, 'Timetable entries retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createEntry(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { timetableId, sectionId, subjectId, facultyId, roomId, dayOfWeek, periodId } = req.body;
      const entry = await timetableService.createEntry(instId, {
        timetableId,
        sectionId,
        subjectId,
        facultyId,
        roomId,
        dayOfWeek,
        periodId,
      });
      sendSuccess(res, entry, 'Timetable entry created successfully', 201);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          message: error.message,
          error: {
            code: error.code,
            conflicts: error.conflicts,
          },
        });
        return;
      }
      if (error.code === '23P01') {
        // Exclusion constraint violation
        res.status(409).json({
          success: false,
          message: 'Teacher cannot be assigned twice in the same period',
          error: { code: 'TEACHER_DOUBLE_BOOKING' },
        });
        return;
      }
      if (error.code === '23505') {
        // Section duplicate period
        res.status(409).json({
          success: false,
          message: 'Section cannot have two subjects in the same period',
          error: { code: 'SECTION_DOUBLE_BOOKING' },
        });
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  async deleteEntry(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const deleted = await timetableService.deleteEntry(instId, id);
      if (!deleted) {
        sendError(res, 'Timetable entry not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, { deleted: true }, 'Timetable entry deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= PUBLISHING =================
  async publishTimetable(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const actorId = req.user?.id || 'system';

      const published = await timetableService.publishTimetable(instId, id, actorId);
      sendSuccess(res, published, 'Timetable published successfully');
    } catch (error: any) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          message: error.message,
          error: {
            code: error.code,
            conflicts: error.conflicts,
          },
        });
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  async unpublishTimetable(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const actorId = req.user?.id || 'system';

      const unpublished = await timetableService.unpublishTimetable(instId, id, actorId);
      sendSuccess(res, unpublished, 'Timetable unpublished successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ================= SUBSTITUTIONS =================
  async listSubstitutions(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { date, staffId } = req.query;
      const substitutions = await timetableService.listSubstitutions(instId, {
        date: date as string,
        staffId: staffId as string,
      });
      sendSuccess(res, substitutions, 'Substitutions retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createSubstitution(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const { timetableEntryId, substituteDate, originalStaffId, substituteStaffId, reason } = req.body;
      const sub = await timetableService.createSubstitution(
        instId,
        {
          timetableEntryId,
          substituteDate,
          originalStaffId,
          substituteStaffId,
          reason,
        },
        actorId
      );
      sendSuccess(res, sub, 'Substitution created successfully', 201);
    } catch (error: any) {
      if (error.code === '23505') {
        sendError(res, 'A substitution already exists for this entry on this date', 409, 'DUPLICATE_ENTITY');
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  // ================= SCOPED SCHEDULE =================
  async getScopedSchedule(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const user = req.user!;
      const { date, dayOfWeek } = req.query;
      const schedule = await timetableService.getScopedSchedule(instId, user, {
        date: date as string,
        dayOfWeek: dayOfWeek as string,
      });
      sendSuccess(res, schedule, 'Schedule retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
}

export const timetableController = new TimetableController();
