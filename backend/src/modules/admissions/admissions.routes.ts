import { Router } from 'express';
import { admissionsController } from './admissions.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/admissions/applicants
router.get(
  '/applicants',
  tenantMiddleware,
  admissionsController.getApplicants.bind(admissionsController)
);

// PATCH /api/v1/admissions/applicants/:id/stage
router.patch(
  '/applicants/:id/stage',
  tenantMiddleware,
  admissionsController.updateStage.bind(admissionsController)
);

// POST /api/v1/admissions/applicants/:id/approve
router.post(
  '/applicants/:id/approve',
  tenantMiddleware,
  admissionsController.approve.bind(admissionsController)
);

export default router;
