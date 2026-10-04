import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class StudentController {
  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const q = req.query;
      const students = await studentService.listStudents(instId, {
        search: q.search as string | undefined,
        classId: q.classId as string | undefined,
        sectionId: q.sectionId as string | undefined,
        status: (q.status as string) || 'active',
        ageMin: q.ageMin ? Number(q.ageMin) : undefined,
        ageMax: q.ageMax ? Number(q.ageMax) : undefined,
      });
      sendSuccess(res, students);
    } catch (error) { next(error); }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.getStudentMaster(req.params.id as string, req.institutionId!);
      sendSuccess(res, student);
    } catch (error) { next(error); }
  }

  async createStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = req.user?.id;
      const {
        firstName, lastName, dateOfBirth, gender,
        classId, sectionId, academicYearId, rollNumber,
        bloodGroup, nationality, motherTongue, religion,
        previousSchool, addressLine1, city, state, pincode,
        emergencyContact, emergencyPhone, notes,
        admissionNumber, guardianName, guardianPhone, guardianEmail, guardianRelationship,
      } = req.body;

      if (!firstName || !lastName || !dateOfBirth || !gender || !classId || !sectionId || !academicYearId) {
        sendError(res, 'firstName, lastName, dateOfBirth, gender, classId, sectionId, academicYearId are required', 400);
        return;
      }

      const student = await studentService.createStudent(instId, {
        firstName, lastName, dateOfBirth, gender,
        classId, sectionId, academicYearId, rollNumber,
        bloodGroup, nationality, motherTongue, religion,
        previousSchool, addressLine1, city, state, pincode,
        emergencyContact, emergencyPhone, notes,
        admissionNumber, guardianName, guardianPhone, guardianEmail, guardianRelationship,
        actorId,
      });

      sendSuccess(res, student, 'Student enrolled successfully', 201);
    } catch (error: any) {
      if (error.message?.includes('capacity')) {
        sendError(res, error.message, 409, 'CAPACITY_EXCEEDED');
        return;
      }
      next(error);
    }
  }

  async updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const instId = req.institutionId!;
      const actorId = req.user?.id;
      const student = await studentService.updateStudent(id, instId, req.body, actorId);
      sendSuccess(res, student, 'Student updated successfully');
    } catch (error) { next(error); }
  }

  async promote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toClassId, toSectionId, academicYearId, decision = 'promoted' } = req.body;
      if (!toClassId || !toSectionId || !academicYearId) {
        sendError(res, 'toClassId, toSectionId, academicYearId are required', 400);
        return;
      }
      const actorId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const result = await studentService.promoteStudent(req.params.id as string, toClassId, toSectionId, academicYearId, decision, actorId);
      sendSuccess(res, result, 'Student promoted successfully');
    } catch (error) { next(error); }
  }

  async getEnrollmentCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counts = await studentService.getClassEnrollmentCounts(req.institutionId!);
      sendSuccess(res, counts);
    } catch (error) { next(error); }
  }

  async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const { rows, academicYearId } = req.body;
      if (!Array.isArray(rows) || !academicYearId) {
        sendError(res, 'rows (array) and academicYearId are required', 400);
        return;
      }
      const results = await studentService.bulkImport(instId, rows, academicYearId, actorId);
      const successCount = results.filter(r => r.success).length;
      sendSuccess(res, { total: rows.length, success: successCount, failed: rows.length - successCount, results }, `Imported ${successCount}/${rows.length} students`);
    } catch (error) { next(error); }
  }
}

export const studentController = new StudentController();
