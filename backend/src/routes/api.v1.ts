import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import institutionRoutes from '../modules/institutions/institution.routes';
import academicRoutes from '../modules/academics/academics.routes';
import admissionsRoutes from '../modules/admissions/admissions.routes';
import studentRoutes from '../modules/students/student.routes';
import facultyRoutes from '../modules/faculty/faculty.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import examRoutes from '../modules/examinations/examinations.routes';
import financeRoutes from '../modules/finance/finance.routes';
import documentRoutes from '../modules/documents/documents.routes';
import hrmsRoutes from '../modules/hrms/hrms.routes';
import timetableRoutes from '../modules/timetable/timetable.routes';
import aiYantraRoutes from '../modules/ai-yantra/ai-yantra.routes';
import optionalRoutes from '../modules/optional-modules/optional-modules.routes';
import usersRoutes from '../modules/users/users.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import auditRoutes from '../modules/audit/audit.routes';
import workspaceRoutes from '../modules/workspaces/workspace.routes';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireWorkspace } from '../middleware/workspace.middleware';
import { db } from '../config/database';
import { sendSuccess } from '../utils/api-response';

const router = Router();

// Health Check
router.get('/health', async (_req: Request, res: Response) => {
  const dbOk = await db.testConnection();
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: {
      provider: 'Supabase PostgreSQL',
      connected: dbOk,
    },
    services: {
      auth: 'active',
      multitenancy: 'active',
      rbac: 'active',
      notifications: 'active',
      audit: 'active',
    },
  });
});

// Domain Routes
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/users', usersRoutes);
router.use('/institutions', institutionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/students', authMiddleware, studentRoutes);

// Strict Workspace Enforcement
router.use('/academics', authMiddleware, requireWorkspace('academics'), academicRoutes);
router.use('/admissions', authMiddleware, requireWorkspace('admissions'), admissionsRoutes);
router.use('/faculty', authMiddleware, requireWorkspace('faculty'), facultyRoutes);
router.use('/attendance', authMiddleware, requireWorkspace('attendance'), attendanceRoutes);
router.use('/examinations', authMiddleware, requireWorkspace('examinations'), examRoutes);
router.use('/finance', authMiddleware, requireWorkspace('finance'), financeRoutes);
router.use('/documents', authMiddleware, requireWorkspace('documents'), documentRoutes);
router.use('/hrms', authMiddleware, requireWorkspace('hrms'), hrmsRoutes);
router.use('/timetable', authMiddleware, requireWorkspace('timetable'), timetableRoutes);
router.use('/ai-yantra', aiYantraRoutes);
router.use('/optional-modules', optionalRoutes);

export default router;
