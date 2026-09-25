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
    },
  });
});

// Domain Routes
router.use('/auth', authRoutes);
router.use('/institutions', institutionRoutes);
router.use('/academics', academicRoutes);
router.use('/admissions', admissionsRoutes);
router.use('/students', studentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/examinations', examRoutes);
router.use('/finance', financeRoutes);
router.use('/documents', documentRoutes);
router.use('/hrms', hrmsRoutes);
router.use('/timetable', timetableRoutes);
router.use('/ai-yantra', aiYantraRoutes);
router.use('/optional-modules', optionalRoutes);

export default router;
