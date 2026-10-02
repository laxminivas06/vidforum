import { Request, Response, NextFunction } from 'express';
import { admissionsService } from './admissions.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AdmissionsController {
  async getApplicants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const applicants = await admissionsService.getApplicants(instId);
      sendSuccess(res, applicants);
    } catch (error) {
      next(error);
    }
  }

  async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const instId = req.institutionId!;
      const application = await admissionsService.getApplicationById(id, instId);
      sendSuccess(res, application);
    } catch (error) {
      next(error);
    }
  }

  async createApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const {
        applicantName,
        dateOfBirth,
        gender,
        classId,
        academicYearId,
        guardianName,
        guardianPhone,
        guardianEmail,
        stage,
      } = req.body;

      if (!applicantName || !classId || !academicYearId) {
        sendError(res, 'applicantName, classId, and academicYearId are required', 400);
        return;
      }

      const created = await admissionsService.createApplication(instId, {
        applicantName,
        dateOfBirth,
        gender,
        classId,
        academicYearId,
        guardianName,
        guardianPhone,
        guardianEmail,
        stage,
      });

      sendSuccess(res, created, 'Application submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { stage } = req.body;

      if (!stage) {
        sendError(res, 'Stage is required', 400);
        return;
      }

      const updated = await admissionsService.updateStage(id, stage);
      sendSuccess(res, updated, `Application stage updated to ${stage}`);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const instId = req.institutionId!;
      const actorId = req.user?.id;

      const result = await admissionsService.approveApplication(id, instId, actorId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const admissionsController = new AdmissionsController();
