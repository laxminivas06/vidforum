import { Router } from 'express';
import { hrmsController } from './hrms.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Module-level middleware
router.use(tenantMiddleware);
router.use(authMiddleware);

// ==========================================
// 1. DESIGNATIONS
// ==========================================
router.get('/designations', (req, res) => hrmsController.listDesignations(req, res));
router.post('/designations', (req, res) => hrmsController.createDesignation(req, res));

// ==========================================
// 2. STAFF DIRECTORY & ONBOARDING
// ==========================================
router.get('/staff', (req, res) => hrmsController.listStaff(req, res));
router.post('/staff', (req, res) => hrmsController.onboardStaff(req, res));
router.get('/staff/:id', (req, res) => hrmsController.getStaffDetails(req, res));
router.patch('/staff/:id', (req, res) => hrmsController.updateStaff(req, res));
router.delete('/staff/:id', (req, res) => hrmsController.deleteStaff(req, res));

// ==========================================
// 3. LEAVE MANAGEMENT & APPROVAL WORKFLOW
// ==========================================
router.get('/leaves/types', (req, res) => hrmsController.listLeaveTypes(req, res));
router.post('/leaves/types', (req, res) => hrmsController.createLeaveType(req, res));
router.get('/leaves', (req, res) => hrmsController.listLeaveRequests(req, res));
router.post('/leaves/apply', (req, res) => hrmsController.applyLeave(req, res));
router.post('/leaves/:id/action', (req, res) => hrmsController.actionLeaveRequest(req, res));
router.get('/leaves/balance/:staffId', (req, res) => hrmsController.getStaffLeaveBalance(req, res));

// ==========================================
// 4. STAFF ATTENDANCE
// ==========================================
router.post('/attendance/mark', (req, res) => hrmsController.markStaffAttendance(req, res));
router.get('/attendance', (req, res) => hrmsController.getStaffAttendance(req, res));
router.get('/attendance/summary', (req, res) => hrmsController.getMonthlyAttendanceSummary(req, res));

// ==========================================
// 5. FACULTY WORKLOAD
// ==========================================
router.get('/workload', (req, res) => hrmsController.getFacultyWorkloads(req, res));
router.post('/workload/compute/:staffId', (req, res) => hrmsController.computeStaffWorkload(req, res));

// ==========================================
// 6. PAYROLL EXPORT (Section 14 Boundary)
// ==========================================
router.get('/payroll/export', (req, res) => hrmsController.getPayrollExport(req, res));

export default router;
