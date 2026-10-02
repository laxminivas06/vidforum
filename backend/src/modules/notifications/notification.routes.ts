import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router = Router();

// All notification endpoints require authenticated user + tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/v1/notifications
router.get('/', notificationController.getNotifications.bind(notificationController));

// GET /api/v1/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// POST /api/v1/notifications/read-all
router.post('/read-all', notificationController.markAllAsRead.bind(notificationController));

// POST /api/v1/notifications (Admin/System dispatch)
router.post('/', requirePermission('notifications.manage'), notificationController.send.bind(notificationController));

export default router;
