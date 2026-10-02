import { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AttendanceController {
  // ================= SESSIONS =================
  async getOrCreateSession(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };
      const session = await attendanceService.getOrCreateSession(instId, req.body, caller);
      sendSuccess(res, session, 'Attendance session retrieved/created', 201);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  async getSessionById(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const session = await attendanceService.getSessionById(instId, String(req.params.id));
      sendSuccess(res, session);
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  }

  async listSessions(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const { sectionId, sessionDate, startDate, endDate, subjectId, staffId } = req.query;
      const sessions = await attendanceService.listSessions(instId, {
        sectionId: sectionId as string,
        sessionDate: sessionDate as string,
        startDate: startDate as string,
        endDate: endDate as string,
        subjectId: subjectId as string,
        staffId: staffId as string,
      });
      sendSuccess(res, sessions);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // ================= ROSTER & ROLL CALL =================
  async getSectionRoster(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const sectionId = String(req.params.sectionId);
      const { date, sessionId } = req.query;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const roster = await attendanceService.getSectionRoster(
        instId,
        sectionId,
        (date as string) || new Date().toISOString().split('T')[0],
        sessionId as string,
        caller
      );
      sendSuccess(res, roster);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  async submitRollCall(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const sessionId = String(req.params.id);
      const { records } = req.body;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const result = await attendanceService.submitRollCall(instId, sessionId, records, caller);
      sendSuccess(res, result, 'Attendance roll-call saved successfully');
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  // ================= STUDENT ATTENDANCE STATS =================
  async getStudentSummary(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const studentId = String(req.params.studentId);
      const { startDate, endDate, subjectId } = req.query;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const summary = await attendanceService.getStudentAttendanceSummary(
        instId,
        studentId,
        {
          startDate: startDate as string,
          endDate: endDate as string,
          subjectId: subjectId as string,
        },
        caller
      );
      sendSuccess(res, summary);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  async getScopedAttendance(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const data = await attendanceService.getScopedAttendance(instId, caller);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  // ================= STUDENT LEAVE REQUESTS =================
  async applyStudentLeave(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const leave = await attendanceService.applyStudentLeave(instId, req.body, caller);
      sendSuccess(res, leave, 'Student leave request submitted', 201);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  async listStudentLeaves(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const { studentId, status, classId, sectionId } = req.query;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const leaves = await attendanceService.listStudentLeaves(
        instId,
        {
          studentId: studentId as string,
          status: status as string,
          classId: classId as string,
          sectionId: sectionId as string,
        },
        caller
      );
      sendSuccess(res, leaves);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  async decideStudentLeave(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const leaveId = String(req.params.id);
      const { decision, decisionNotes } = req.body;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const updated = await attendanceService.decideStudentLeave(
        instId,
        leaveId,
        decision,
        caller,
        decisionNotes
      );
      sendSuccess(res, updated, `Leave request ${decision} successfully`);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  // ================= STAFF ATTENDANCE =================
  async recordStaffAttendance(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const { records } = req.body;
      const caller = {
        id: req.user!.id,
        role: req.user!.role,
      };

      const results = await attendanceService.recordStaffAttendance(instId, records, caller);
      sendSuccess(res, results, 'Staff attendance recorded successfully');
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  async listStaffAttendance(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const { staffId, attendanceDate, startDate, endDate } = req.query;
      const records = await attendanceService.listStaffAttendance(instId, {
        staffId: staffId as string,
        attendanceDate: attendanceDate as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      sendSuccess(res, records);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // ================= INSTITUTION SUMMARY =================
  async getInstitutionSummary(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const { date } = req.query;
      const summary = await attendanceService.getInstitutionSummary(instId, date as string);
      sendSuccess(res, summary);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
}

export const attendanceController = new AttendanceController();
