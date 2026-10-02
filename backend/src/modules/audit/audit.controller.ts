import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AuditController {
  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.role === 'Super Admin';
      const institutionId = isSuperAdmin ? (req.query.institutionId as string) || req.institutionId : user.institutionId;

      const actorId = req.query.actorId as string;
      const action = req.query.action as string;
      const resource = req.query.resource as string;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const logs = await auditService.getAuditLogs({
        institutionId,
        actorId,
        action,
        resource,
        limit,
        offset,
      });

      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const id = req.params.id as string;
      const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.role === 'Super Admin';
      const institutionId = isSuperAdmin ? undefined : user.institutionId;

      const log = await auditService.getAuditLogById(id, institutionId);
      if (!log) {
        sendError(res, 'Audit log record not found', 404);
        return;
      }

      sendSuccess(res, log);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
