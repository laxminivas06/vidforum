import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service';
import { sendSuccess } from '../../utils/api-response';

export class StudentController {
  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { search, classId, sectionId, status = 'active' } = req.query;

      const students = await studentService.listStudents(instId, {
        search: search as string,
        classId: classId as string,
        sectionId: sectionId as string,
        status: status as string,
      });

      sendSuccess(res, students);
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const instId = req.institutionId!;

      const student = await studentService.getStudentMaster(id, instId);
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async promote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { toClassId, toSectionId, academicYearId, decision = 'promoted' } = req.body;
      const actorId = req.user?.id || '44444444-4444-4444-4444-444444444401';

      const result = await studentService.promoteStudent(
        id,
        toClassId,
        toSectionId,
        academicYearId,
        decision,
        actorId
      );

      sendSuccess(res, result, 'Student promoted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
