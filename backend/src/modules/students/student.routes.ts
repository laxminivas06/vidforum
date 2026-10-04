import { Router } from 'express';
import { studentController } from './student.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET  /api/v1/students               - list with filters
router.get('/',         tenantMiddleware, studentController.getStudents.bind(studentController));

// POST /api/v1/students               - direct enroll
router.post('/',        tenantMiddleware, studentController.createStudent.bind(studentController));

// GET  /api/v1/students/enrollment-counts
router.get('/enrollment-counts', tenantMiddleware, studentController.getEnrollmentCounts.bind(studentController));

// POST /api/v1/students/bulk-import
router.post('/bulk-import', tenantMiddleware, studentController.bulkImport.bind(studentController));

// GET  /api/v1/students/:id           - 360° master record
router.get('/:id',      tenantMiddleware, studentController.getStudentById.bind(studentController));

// PATCH /api/v1/students/:id          - update profile
router.patch('/:id',    tenantMiddleware, studentController.updateStudent.bind(studentController));

// POST /api/v1/students/:id/promote
router.post('/:id/promote', tenantMiddleware, studentController.promote.bind(studentController));

export default router;
