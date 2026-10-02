import { Router } from 'express';
import { facultyController } from './faculty.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { resourceGuard } from '../../middleware/resource-guard.middleware';

const router = Router();

// GET /api/v1/faculty
router.get(
  '/',
  tenantMiddleware,
  facultyController.getFaculty.bind(facultyController)
);

// GET /api/v1/faculty/me
router.get(
  '/me',
  tenantMiddleware,
  facultyController.getMyProfile.bind(facultyController)
);

// GET /api/v1/faculty/me/classes
router.get(
  '/me/classes',
  tenantMiddleware,
  facultyController.getMyClasses.bind(facultyController)
);

// GET /api/v1/faculty/me/subjects
router.get(
  '/me/subjects',
  tenantMiddleware,
  facultyController.getMySubjects.bind(facultyController)
);

// GET /api/v1/faculty/sections/:sectionId/students (Rule 8: Scoped access)
router.get(
  '/sections/:sectionId/students',
  tenantMiddleware,
  resourceGuard({ type: 'faculty', getResourceId: (req) => req.params.sectionId as string }),
  facultyController.getSectionStudents.bind(facultyController)
);

// GET /api/v1/faculty/:id
router.get(
  '/:id',
  tenantMiddleware,
  facultyController.getFacultyById.bind(facultyController)
);

export default router;
