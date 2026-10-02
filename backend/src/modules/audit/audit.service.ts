import { auditRepository } from './audit.repository';

export class AuditService {
  async getAuditLogs(options: {
    institutionId?: string;
    actorId?: string;
    action?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  }) {
    return await auditRepository.findLogs(options);
  }

  async getAuditLogById(id: string, institutionId?: string) {
    return await auditRepository.findLogById(id, institutionId);
  }
}

export const auditService = new AuditService();
