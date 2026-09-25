import { Router } from 'express';
import { academicsController } from './academics.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/academics/grades
router.get(
  '/grades',
  tenantMiddleware,
  academicsController.getGrades.bind(academicsController)
);

// GET /api/v1/academics/hierarchy
router.get(
  '/hierarchy',
  tenantMiddleware,
  academicsController.getHierarchy.bind(academicsController)
);

// GET /api/v1/academics/classes
router.get(
  '/classes',
  tenantMiddleware,
  academicsController.getClasses.bind(academicsController)
);

// GET /api/v1/academics/subjects
router.get(
  '/subjects',
  tenantMiddleware,
  academicsController.getSubjects.bind(academicsController)
);

export default router;
