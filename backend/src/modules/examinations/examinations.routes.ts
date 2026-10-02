import { Router } from 'express';
import { examinationsController } from './examinations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// ================= EXAM TYPES =================
router.post('/types', examinationsController.createExamType.bind(examinationsController));
router.get('/types', examinationsController.listExamTypes.bind(examinationsController));

// ================= EXAMS =================
router.post('/exams', examinationsController.createExam.bind(examinationsController));
router.get('/exams', examinationsController.listExams.bind(examinationsController));
router.get('/exams/:id', examinationsController.getExamById.bind(examinationsController));
router.patch('/exams/:id/status', examinationsController.updateExamStatus.bind(examinationsController));

// ================= EXAM SUBJECTS =================
router.post('/exams/:id/subjects', examinationsController.addExamSubject.bind(examinationsController));
router.get('/exams/:id/subjects', examinationsController.listExamSubjects.bind(examinationsController));

// ================= EXAM SCHEDULES =================
router.post('/schedules', examinationsController.createExamSchedule.bind(examinationsController));
router.get('/exams/:id/schedules', examinationsController.listExamSchedules.bind(examinationsController));

// ================= ROOMS & SEATING =================
router.post('/rooms', examinationsController.createExamRoom.bind(examinationsController));
router.post('/rooms/:id/seating', examinationsController.allocateSeating.bind(examinationsController));
router.post('/rooms/:id/invigilators', examinationsController.assignInvigilator.bind(examinationsController));

// ================= GRADE SCALES =================
router.post('/grade-scales', examinationsController.createGradeScale.bind(examinationsController));
router.get('/grade-scales', examinationsController.listGradeScales.bind(examinationsController));
router.post('/grade-scales/:id/tiers', examinationsController.addGradeTier.bind(examinationsController));

// ================= MARKS ENTRY & VERIFICATION =================
router.post('/marks/batch', examinationsController.submitMarksBatch.bind(examinationsController));
router.get('/marks', examinationsController.listMarks.bind(examinationsController));
router.post('/marks/verify', examinationsController.verifyMarks.bind(examinationsController));

// ================= EXCEL IMPORT PIPELINE (SECTION 18 EXIT GATE) =================
// Both /import-excel and /marks/import-validate for compatibility
router.post('/import-excel', examinationsController.validateExcelImport.bind(examinationsController));
router.post('/marks/import-validate', examinationsController.validateExcelImport.bind(examinationsController));
router.post('/marks/import-commit', examinationsController.commitExcelImport.bind(examinationsController));

// ================= RESULTS & REPORT CARDS =================
router.post('/exams/:id/calculate-results', examinationsController.calculateResults.bind(examinationsController));
router.post('/exams/:id/publish', examinationsController.publishExamResults.bind(examinationsController));
router.get('/exams/:id/report-cards/:studentId', examinationsController.getStudentReportCard.bind(examinationsController));
router.get('/students/:studentId/report-cards', examinationsController.listStudentReportCards.bind(examinationsController));

export default router;
