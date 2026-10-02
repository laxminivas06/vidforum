import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Require valid authentication and tenant context for all attendance routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// ================= SESSIONS =================
router.post('/sessions', attendanceController.getOrCreateSession.bind(attendanceController));
router.get('/sessions', attendanceController.listSessions.bind(attendanceController));
router.get('/sessions/:id', attendanceController.getSessionById.bind(attendanceController));

// ================= ROSTER & ROLL CALL =================
router.get('/sections/:sectionId/roster', attendanceController.getSectionRoster.bind(attendanceController));
router.post('/sessions/:id/records', attendanceController.submitRollCall.bind(attendanceController));

// ================= STUDENT ATTENDANCE STATS & SCOPED ACCESS =================
router.get('/students/:studentId/summary', attendanceController.getStudentSummary.bind(attendanceController));
router.get('/my-attendance', attendanceController.getScopedAttendance.bind(attendanceController));

// ================= STUDENT LEAVE REQUESTS =================
router.post('/leaves', attendanceController.applyStudentLeave.bind(attendanceController));
router.get('/leaves', attendanceController.listStudentLeaves.bind(attendanceController));
router.post('/leaves/:id/decide', attendanceController.decideStudentLeave.bind(attendanceController));

// ================= STAFF ATTENDANCE =================
router.post('/staff', attendanceController.recordStaffAttendance.bind(attendanceController));
router.get('/staff', attendanceController.listStaffAttendance.bind(attendanceController));

// ================= INSTITUTION SUMMARY DASHBOARD =================
router.get('/summary', attendanceController.getInstitutionSummary.bind(attendanceController));

export default router;
