import { Router } from 'express';
import { timetableController } from './timetable.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Middleware stack for all timetable routes: authenticate user and resolve tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// ================= ROOMS =================
router.get('/rooms', timetableController.listRooms.bind(timetableController));
router.post('/rooms', timetableController.createRoom.bind(timetableController));
router.put('/rooms/:id', timetableController.updateRoom.bind(timetableController));
router.delete('/rooms/:id', timetableController.deleteRoom.bind(timetableController));

// ================= PERIODS =================
router.get('/periods', timetableController.listPeriods.bind(timetableController));
router.post('/periods', timetableController.createPeriod.bind(timetableController));
router.put('/periods/:id', timetableController.updatePeriod.bind(timetableController));
router.delete('/periods/:id', timetableController.deletePeriod.bind(timetableController));

// ================= CONFLICT CHECKING =================
router.post('/check-conflict', timetableController.checkConflict.bind(timetableController));

// ================= ENTRIES =================
router.get('/entries', timetableController.listEntries.bind(timetableController));
router.post('/entries', timetableController.createEntry.bind(timetableController));
router.delete('/entries/:id', timetableController.deleteEntry.bind(timetableController));

// ================= SUBSTITUTIONS =================
router.get('/substitutions', timetableController.listSubstitutions.bind(timetableController));
router.post('/substitutions', timetableController.createSubstitution.bind(timetableController));

// ================= SCOPED SCHEDULE =================
router.get('/my-schedule', timetableController.getScopedSchedule.bind(timetableController));
router.get('/today', timetableController.getScopedSchedule.bind(timetableController));

// ================= TIMETABLE HEADERS & PUBLISHING =================
router.get('/', timetableController.listTimetables.bind(timetableController));
router.post('/', timetableController.createTimetable.bind(timetableController));
router.get('/:id', timetableController.getTimetable.bind(timetableController));
router.delete('/:id', timetableController.deleteTimetable.bind(timetableController));
router.get('/:id/conflicts', timetableController.auditTimetableConflicts.bind(timetableController));
router.post('/:id/publish', timetableController.publishTimetable.bind(timetableController));
router.post('/:id/unpublish', timetableController.unpublishTimetable.bind(timetableController));

export default router;
