import { Router } from 'express';
import { admissionsController } from './admissions.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// POST /api/v1/admissions/applications
router.post(
  '/applications',
  tenantMiddleware,
  admissionsController.createApplication.bind(admissionsController)
);

// GET /api/v1/admissions/applications/:id
router.get(
  '/applications/:id',
  tenantMiddleware,
  admissionsController.getApplicationById.bind(admissionsController)
);

// GET /api/v1/admissions/applicants
router.get(
  '/applicants',
  tenantMiddleware,
  admissionsController.getApplicants.bind(admissionsController)
);

// GET /api/v1/admissions/applicants/:id
router.get(
  '/applicants/:id',
  tenantMiddleware,
  admissionsController.getApplicationById.bind(admissionsController)
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
