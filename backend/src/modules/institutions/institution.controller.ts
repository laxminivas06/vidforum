import { Request, Response, NextFunction } from 'express';
import { institutionService } from './institution.service';
import { sendSuccess } from '../../utils/api-response';

export class InstitutionController {
  async getInstitutions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutions = await institutionService.getAllInstitutions();
      sendSuccess(res, institutions);
    } catch (error) {
      next(error);
    }
  }

  async getInstitutionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const institution = await institutionService.getInstitutionDetails(id);
      sendSuccess(res, institution);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const stats = await institutionService.getInstitutionStats(id);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async toggleModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const moduleCode = req.params.moduleCode as string;
      const { isEnabled } = req.body;

      const result = await institutionService.toggleModule(id, moduleCode, isEnabled);
      sendSuccess(res, result, `Module ${moduleCode} updated`);
    } catch (error) {
      next(error);
    }
  }
}

export const institutionController = new InstitutionController();
