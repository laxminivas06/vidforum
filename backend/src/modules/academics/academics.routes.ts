import { Router } from 'express';
import { academicsController } from './academics.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// =========================================================================
// ACADEMIC YEARS
// =========================================================================

router.get(
  '/academic-years',
  tenantMiddleware,
  academicsController.getAcademicYears.bind(academicsController)
);

router.post(
  '/academic-years',
  tenantMiddleware,
  academicsController.createAcademicYear.bind(academicsController)
);

router.get(
  '/academic-years/:id',
  tenantMiddleware,
  academicsController.getAcademicYearById.bind(academicsController)
);

router.put(
  '/academic-years/:id',
  tenantMiddleware,
  academicsController.updateAcademicYear.bind(academicsController)
);

router.post(
  '/academic-years/:id/set-current',
  tenantMiddleware,
  academicsController.setCurrentAcademicYear.bind(academicsController)
);

router.post(
  '/academic-years/:id/close',
  tenantMiddleware,
  academicsController.closeAcademicYear.bind(academicsController)
);

router.post(
  '/academic-years/:id/clone',
  tenantMiddleware,
  academicsController.cloneAcademicYear.bind(academicsController)
);

// =========================================================================
// GRADES, CLASSES & SECTIONS MATRIX
// =========================================================================

router.get(
  '/grades',
  tenantMiddleware,
  academicsController.getGrades.bind(academicsController)
);

router.get(
  '/hierarchy',
  tenantMiddleware,
  academicsController.getHierarchy.bind(academicsController)
);

router.get(
  '/classes',
  tenantMiddleware,
  academicsController.getClasses.bind(academicsController)
);

router.post(
  '/classes',
  tenantMiddleware,
  academicsController.createClass.bind(academicsController)
);

router.put(
  '/classes/:id',
  tenantMiddleware,
  academicsController.updateClass.bind(academicsController)
);

router.delete(
  '/classes/:id',
  tenantMiddleware,
  academicsController.deleteClass.bind(academicsController)
);

router.post(
  '/classes/matrix-generate',
  tenantMiddleware,
  academicsController.generateClassMatrix.bind(academicsController)
);

router.get(
  '/classes/:classId/sections',
  tenantMiddleware,
  academicsController.getClassSections.bind(academicsController)
);

router.post(
  '/classes/:classId/sections',
  tenantMiddleware,
  academicsController.createSection.bind(academicsController)
);

router.put(
  '/sections/:id',
  tenantMiddleware,
  academicsController.updateSection.bind(academicsController)
);

router.delete(
  '/sections/:id',
  tenantMiddleware,
  academicsController.deleteSection.bind(academicsController)
);

// =========================================================================
// SUBJECTS MASTER
// =========================================================================

router.get(
  '/subjects',
  tenantMiddleware,
  academicsController.getSubjects.bind(academicsController)
);

router.post(
  '/subjects',
  tenantMiddleware,
  academicsController.createSubject.bind(academicsController)
);

router.put(
  '/subjects/:id',
  tenantMiddleware,
  academicsController.updateSubject.bind(academicsController)
);

router.delete(
  '/subjects/:id',
  tenantMiddleware,
  academicsController.deleteSubject.bind(academicsController)
);

// =========================================================================
// GRADE -> SUBJECT MAPPING
// =========================================================================

router.get(
  '/classes/:classId/subjects',
  tenantMiddleware,
  academicsController.getClassSubjects.bind(academicsController)
);

router.post(
  '/classes/:classId/subjects',
  tenantMiddleware,
  academicsController.linkSubjectToClass.bind(academicsController)
);

router.get(
  '/classes/:classId/grade-subjects',
  tenantMiddleware,
  academicsController.getGradeSubjects.bind(academicsController)
);

router.post(
  '/classes/:classId/grade-subjects',
  tenantMiddleware,
  academicsController.mapSubjectToGrade.bind(academicsController)
);

router.delete(
  '/classes/:classId/grade-subjects/:subjectId',
  tenantMiddleware,
  academicsController.removeSubjectFromGrade.bind(academicsController)
);

router.post(
  '/classes/:classId/grade-subjects/copy-to',
  tenantMiddleware,
  academicsController.copySubjectMatrix.bind(academicsController)
);

// =========================================================================
// EXAM ESTIMATED SCHEDULE (A2)
// =========================================================================

router.get(
  '/exam-estimates',
  tenantMiddleware,
  academicsController.getExamEstimates.bind(academicsController)
);

router.post(
  '/exam-estimates',
  tenantMiddleware,
  academicsController.createExamEstimate.bind(academicsController)
);

router.put(
  '/exam-estimates/:id',
  tenantMiddleware,
  academicsController.updateExamEstimate.bind(academicsController)
);

router.delete(
  '/exam-estimates/:id',
  tenantMiddleware,
  academicsController.deleteExamEstimate.bind(academicsController)
);

// =========================================================================
// YEAR SCHEDULE & WORKING DAYS
// =========================================================================

router.get(
  '/calendar-config',
  tenantMiddleware,
  academicsController.getCalendarConfig.bind(academicsController)
);

router.post(
  '/calendar-config',
  tenantMiddleware,
  academicsController.saveCalendarConfig.bind(academicsController)
);

router.get(
  '/calendar-days',
  tenantMiddleware,
  academicsController.getCalendarDays.bind(academicsController)
);

router.post(
  '/calendar-days',
  tenantMiddleware,
  academicsController.createCalendarDay.bind(academicsController)
);

router.delete(
  '/calendar-days/:id',
  tenantMiddleware,
  academicsController.deleteCalendarDay.bind(academicsController)
);

router.get(
  '/working-days/check',
  tenantMiddleware,
  academicsController.checkWorkingDay.bind(academicsController)
);

router.get(
  '/working-days/count',
  tenantMiddleware,
  academicsController.getWorkingDaysCount.bind(academicsController)
);

// =========================================================================
// PREFERRED TEXTBOOKS (A1)
// =========================================================================

router.get(
  '/textbooks/booklist',
  tenantMiddleware,
  academicsController.getBooklist.bind(academicsController)
);

router.get(
  '/textbooks',
  tenantMiddleware,
  academicsController.getTextbooks.bind(academicsController)
);

router.post(
  '/textbooks',
  tenantMiddleware,
  academicsController.createTextbook.bind(academicsController)
);

router.put(
  '/textbooks/:id',
  tenantMiddleware,
  academicsController.updateTextbook.bind(academicsController)
);

router.delete(
  '/textbooks/:id',
  tenantMiddleware,
  academicsController.deleteTextbook.bind(academicsController)
);

// =========================================================================
// DEPARTMENTS & ALLOCATIONS (PRESERVED)
// =========================================================================

router.get(
  '/departments',
  tenantMiddleware,
  academicsController.getDepartments.bind(academicsController)
);

router.post(
  '/departments',
  tenantMiddleware,
  academicsController.createDepartment.bind(academicsController)
);

router.get(
  '/allocations',
  tenantMiddleware,
  academicsController.getAllocations.bind(academicsController)
);

router.post(
  '/allocations',
  tenantMiddleware,
  academicsController.createAllocation.bind(academicsController)
);

export default router;
