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

      const result = await admissionsService.approveApplication(id, instId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const admissionsController = new AdmissionsController();
