import { Router } from 'express';
import { facultyController } from './faculty.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/faculty
router.get(
  '/',
  tenantMiddleware,
  facultyController.getFaculty.bind(facultyController)
);

// GET /api/v1/faculty/:id
router.get(
  '/:id',
  tenantMiddleware,
  facultyController.getFacultyById.bind(facultyController)
);

export default router;
