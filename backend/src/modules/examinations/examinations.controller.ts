import { Request, Response } from 'express';
import { examinationsService } from './examinations.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class ExaminationsController {
  // ================= EXAM TYPES =================
  async createExamType(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const type = await examinationsService.createExamType(instId, req.body, caller);
      sendSuccess(res, type, 'Exam type created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async listExamTypes(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const types = await examinationsService.listExamTypes(instId);
      sendSuccess(res, types);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // ================= EXAMS =================
  async createExam(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const exam = await examinationsService.createExam(instId, req.body, caller);
      sendSuccess(res, exam, 'Exam created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async getExamById(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const exam = await examinationsService.getExamById(instId, String(req.params.id));
      if (!exam) {
        sendError(res, 'Exam not found', 404);
        return;
      }
      sendSuccess(res, exam);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  async listExams(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const { classId, academicYearId, status, isPublished } = req.query;
      const exams = await examinationsService.listExams(instId, {
        classId: classId as string,
        academicYearId: academicYearId as string,
        status: status as string,
        isPublished: isPublished !== undefined ? isPublished === 'true' : undefined,
      });
      sendSuccess(res, exams);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  async updateExamStatus(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const updated = await examinationsService.updateExamStatus(
        instId,
        String(req.params.id),
        req.body.status,
        caller
      );
      if (!updated) {
        sendError(res, 'Exam not found', 404);
        return;
      }
      sendSuccess(res, updated, 'Exam status updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  // ================= EXAM SUBJECTS =================
  async addExamSubject(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const examId = String(req.params.id || req.body.examId);
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const subject = await examinationsService.addExamSubject(
        instId,
        {
          examId,
          subjectId: req.body.subjectId,
          maxMarks: req.body.maxMarks,
          passMarks: req.body.passMarks,
        },
        caller
      );
      sendSuccess(res, subject, 'Exam subject added successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async listExamSubjects(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const examId = String(req.params.id || req.query.examId);
      const subjects = await examinationsService.listExamSubjects(instId, examId);
      sendSuccess(res, subjects);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // ================= EXAM SCHEDULES =================
  async createExamSchedule(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const schedule = await examinationsService.createExamSchedule(instId, req.body, caller);
      sendSuccess(res, schedule, 'Exam schedule created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async listExamSchedules(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const examId = String(req.params.id || req.query.examId);
      const schedules = await examinationsService.listExamSchedules(instId, examId);
      sendSuccess(res, schedules);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  // ================= ROOMS & SEATING =================
  async createExamRoom(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const room = await examinationsService.createExamRoom(instId, req.body);
      sendSuccess(res, room, 'Exam room created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async allocateSeating(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const allocations = await examinationsService.allocateSeating(
        instId,
        String(req.params.id),
        req.body.allocations || []
      );
      sendSuccess(res, allocations, 'Seating allocated successfully');
    } catch (err: any) {
      const status = err.message.includes('EXAM_ROOM_CAPACITY_EXCEEDED') ? 409 : 400;
      sendError(res, err.message, status);
    }
  }

  async assignInvigilator(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const invigilator = await examinationsService.assignInvigilator(
        instId,
        String(req.params.id),
        req.body.staffId
      );
      sendSuccess(res, invigilator, 'Invigilator assigned successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  // ================= GRADE SCALES =================
  async createGradeScale(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const scale = await examinationsService.createGradeScale(instId, req.body);
      sendSuccess(res, scale, 'Grade scale created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async listGradeScales(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const scales = await examinationsService.listGradeScales(instId);
      sendSuccess(res, scales);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  async addGradeTier(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const tier = await examinationsService.addGradeTier(instId, String(req.params.id), req.body);
      sendSuccess(res, tier, 'Grade tier added successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  // ================= MARKS ENTRY & VERIFICATION =================
  async submitMarksBatch(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const { examSubjectId, records } = req.body;
      const marks = await examinationsService.submitMarksBatch(instId, examSubjectId, records, caller);
      sendSuccess(res, marks, 'Marks recorded successfully', 201);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  async listMarks(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const { examSubjectId, examId, studentId, classId } = req.query;
      const marks = await examinationsService.listMarks(
        instId,
        {
          examSubjectId: examSubjectId as string,
          examId: examId as string,
          studentId: studentId as string,
          classId: classId as string,
        },
        caller
      );
      sendSuccess(res, marks);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 500;
      sendError(res, err.message, status);
    }
  }

  async verifyMarks(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const caller = { id: req.user.id, role: req.user.role };
      const { examSubjectId } = req.body;
      const result = await examinationsService.verifyMarks(instId, examSubjectId, caller);
      sendSuccess(res, result, 'Marks verified successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  // ================= EXCEL IMPORT PIPELINE (EXIT GATE PRE-COMMIT VALIDATION) =================
  async validateExcelImport(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const { examSubjectId, rows } = req.body;
      const report = await examinationsService.validateExcelImport(instId, examSubjectId, rows || [], caller);
      sendSuccess(res, report, 'Import sheet validated');
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
      sendError(res, err.message, status);
    }
  }

  async commitExcelImport(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const { examSubjectId, rows } = req.body;
      const marks = await examinationsService.commitExcelImport(instId, examSubjectId, rows || [], caller);
      sendSuccess(res, marks, 'Excel import committed successfully', 201);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED')
        ? 403
        : err.message.includes('CANNOT_COMMIT_INVALID_DATA')
        ? 400
        : 500;
      sendError(res, err.message, status);
    }
  }

  // ================= RESULTS & REPORT CARDS =================
  async calculateResults(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const reportCards = await examinationsService.calculateResults(instId, String(req.params.id), caller);
      sendSuccess(res, reportCards, 'Results calculated and report cards generated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async publishExamResults(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const published = await examinationsService.publishExamResults(instId, String(req.params.id), caller);
      sendSuccess(res, published, 'Exam results published and notifications dispatched');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  async getStudentReportCard(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const examId = String(req.params.id);
      const studentId = String(req.params.studentId);
      const reportCard = await examinationsService.getStudentReportCard(instId, examId, studentId, caller);
      sendSuccess(res, reportCard);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 404;
      sendError(res, err.message, status);
    }
  }

  async listStudentReportCards(req: Request, res: Response) {
    try {
      const instId = req.institutionId!;
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const studentId = String(req.params.studentId);
      const reportCards = await examinationsService.listStudentReportCards(instId, studentId, caller);
      sendSuccess(res, reportCards);
    } catch (err: any) {
      const status = err.message.includes('RESOURCE_ACCESS_DENIED') ? 403 : 500;
      sendError(res, err.message, status);
    }
  }
}

export const examinationsController = new ExaminationsController();
