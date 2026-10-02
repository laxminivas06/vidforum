import { Router } from 'express';
import { auditController } from './audit.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requirePermission('audit.logs.read'));

// GET /api/v1/audit-logs
router.get('/', auditController.getLogs.bind(auditController));

// GET /api/v1/audit-logs/:id
router.get('/:id', auditController.getLogById.bind(auditController));

export default router;
