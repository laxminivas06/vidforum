import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const institutionId = req.institutionId || user.institutionId;
      const unreadOnly = req.query.unread === 'true';
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const notifications = await notificationService.getUserNotifications(
        institutionId,
        user.id,
        unreadOnly,
        limit,
        offset
      );
      sendSuccess(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const institutionId = req.institutionId || user.institutionId;
      const count = await notificationService.getUnreadCount(institutionId, user.id);
      sendSuccess(res, count);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const id = req.params.id as string;
      const success = await notificationService.markAsRead(id, user.id);
      sendSuccess(res, { success }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const institutionId = req.institutionId || user.institutionId;
      const count = await notificationService.markAllAsRead(institutionId, user.id);
      sendSuccess(res, { count }, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = req.institutionId || req.user?.institutionId;
      if (!institutionId) {
        sendError(res, 'Tenant context required to dispatch notifications', 400);
        return;
      }

      const { recipientUserId, title, message, channel, type, metadata } = req.body;

      if (!recipientUserId || !title || !message) {
        sendError(res, 'recipientUserId, title, and message are required', 400);
        return;
      }

      const notif = await notificationService.sendNotification({
        institutionId,
        recipientUserId,
        title,
        message,
        channel,
        type,
        metadata,
      });

      sendSuccess(res, notif, 'Notification dispatched', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
