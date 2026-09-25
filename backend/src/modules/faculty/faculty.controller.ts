import { Request, Response, NextFunction } from 'express';
import { facultyService } from './faculty.service';
import { sendSuccess } from '../../utils/api-response';

export class FacultyController {
  async getFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const faculty = await facultyService.getFacultyList(instId);
      sendSuccess(res, faculty);
    } catch (error) {
      next(error);
    }
  }

  async getFacultyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const instId = req.institutionId!;
      const member = await facultyService.getFacultyMember(id, instId);
      sendSuccess(res, member);
    } catch (error) {
      next(error);
    }
  }
}

export const facultyController = new FacultyController();
