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

  async getModules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const modules = await institutionService.getModules(id);
      sendSuccess(res, modules);
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

  async createInstitution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institution = await institutionService.createInstitution(req.body);
      sendSuccess(res, institution, 'Institution provisioned successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAdmins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const admins = await institutionService.getInstitutionAdmins(id);
      sendSuccess(res, admins);
    } catch (error) {
      next(error);
    }
  }

  async addAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const admin = await institutionService.addInstitutionAdmin(id, req.body);
      sendSuccess(res, admin, 'Institute Administrator provisioned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status = 'suspended' } = req.body;
      const institution = await institutionService.updateInstitutionStatus(id, status);
      sendSuccess(res, institution, `Institution status updated to ${institution.status}`);
    } catch (error) {
      next(error);
    }
  }

  async updateAdminWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const adminId = req.params.adminId as string;
      const { workspaces = [] } = req.body;
      const result = await institutionService.updateAdminWorkspaces(id, adminId, workspaces);
      sendSuccess(res, result, 'Admin workspaces updated and persisted to Cloud DB');
    } catch (error) {
      next(error);
    }
  }
}

export const institutionController = new InstitutionController();

