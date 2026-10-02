import { Request, Response, NextFunction } from 'express';
import { facultyService } from './faculty.service';
import { sendSuccess } from '../../utils/api-response';

export class FacultyController {
  async getFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const user = req.user;
      const isFacultyOnly = user && (user.role === 'FACULTY' || user.role === 'Faculty');

      if (isFacultyOnly) {
        const profile = await facultyService.getFacultyProfile(user.id, instId);
        sendSuccess(res, [profile]);
        return;
      }

      const faculty = await facultyService.getFacultyList(instId);
      sendSuccess(res, faculty);
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const userId = req.user!.id;
      const profile = await facultyService.getFacultyProfile(userId, instId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async getMyClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const userId = req.user!.id;
      const classes = await facultyService.getMyAssignedClasses(userId, instId);
      sendSuccess(res, classes);
    } catch (error) {
      next(error);
    }
  }

  async getMySubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const userId = req.user!.id;
      const subjects = await facultyService.getMyAssignedSubjects(userId, instId);
      sendSuccess(res, subjects);
    } catch (error) {
      next(error);
    }
  }

  async getSectionStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const sectionId = req.params.sectionId as string;
      const students = await facultyService.getSectionStudentRoster(sectionId, instId);
      sendSuccess(res, students);
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
