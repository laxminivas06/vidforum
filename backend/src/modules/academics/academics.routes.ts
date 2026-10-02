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

// GET /api/v1/academics/academic-years
router.get(
  '/academic-years',
  tenantMiddleware,
  academicsController.getAcademicYears.bind(academicsController)
);

// POST /api/v1/academics/academic-years
router.post(
  '/academic-years',
  tenantMiddleware,
  academicsController.createAcademicYear.bind(academicsController)
);

// GET /api/v1/academics/departments
router.get(
  '/departments',
  tenantMiddleware,
  academicsController.getDepartments.bind(academicsController)
);

// POST /api/v1/academics/departments
router.post(
  '/departments',
  tenantMiddleware,
  academicsController.createDepartment.bind(academicsController)
);

// GET /api/v1/academics/classes
router.get(
  '/classes',
  tenantMiddleware,
  academicsController.getClasses.bind(academicsController)
);

// POST /api/v1/academics/classes
router.post(
  '/classes',
  tenantMiddleware,
  academicsController.createClass.bind(academicsController)
);

// GET /api/v1/academics/classes/:classId/sections
router.get(
  '/classes/:classId/sections',
  tenantMiddleware,
  academicsController.getClassSections.bind(academicsController)
);

// POST /api/v1/academics/classes/:classId/sections
router.post(
  '/classes/:classId/sections',
  tenantMiddleware,
  academicsController.createSection.bind(academicsController)
);

// GET /api/v1/academics/classes/:classId/subjects
router.get(
  '/classes/:classId/subjects',
  tenantMiddleware,
  academicsController.getClassSubjects.bind(academicsController)
);

// POST /api/v1/academics/classes/:classId/subjects
router.post(
  '/classes/:classId/subjects',
  tenantMiddleware,
  academicsController.linkSubjectToClass.bind(academicsController)
);

// GET /api/v1/academics/subjects
router.get(
  '/subjects',
  tenantMiddleware,
  academicsController.getSubjects.bind(academicsController)
);

// POST /api/v1/academics/subjects
router.post(
  '/subjects',
  tenantMiddleware,
  academicsController.createSubject.bind(academicsController)
);

// GET /api/v1/academics/allocations
router.get(
  '/allocations',
  tenantMiddleware,
  academicsController.getAllocations.bind(academicsController)
);

// POST /api/v1/academics/allocations
router.post(
  '/allocations',
  tenantMiddleware,
  academicsController.createAllocation.bind(academicsController)
);

export default router;
