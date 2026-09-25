import { Router } from 'express';
import { studentController } from './student.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/students
router.get(
  '/',
  tenantMiddleware,
  studentController.getStudents.bind(studentController)
);

// GET /api/v1/students/:id (360° Master Record)
router.get(
  '/:id',
  tenantMiddleware,
  studentController.getStudentById.bind(studentController)
);

// POST /api/v1/students/:id/promote
router.post(
  '/:id/promote',
  tenantMiddleware,
  studentController.promote.bind(studentController)
);

export default router;
