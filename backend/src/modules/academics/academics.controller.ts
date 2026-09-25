import { Request, Response, NextFunction } from 'express';
import { academicsService } from './academics.service';
import { sendSuccess } from '../../utils/api-response';

export class AcademicsController {
  async getGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const grades = await academicsService.getAcademicGrades(instId);
      sendSuccess(res, grades);
    } catch (error) {
      next(error);
    }
  }

  async getHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const hierarchy = await academicsService.getHierarchy(instId);
      sendSuccess(res, hierarchy);
    } catch (error) {
      next(error);
    }
  }

  async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const classes = await academicsService.getClasses(instId);
      sendSuccess(res, classes);
    } catch (error) {
      next(error);
    }
  }

  async getSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const subjects = await academicsService.getSubjects(instId);
      sendSuccess(res, subjects);
    } catch (error) {
      next(error);
    }
  }
}

export const academicsController = new AcademicsController();
