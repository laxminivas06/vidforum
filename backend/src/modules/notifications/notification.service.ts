import { notificationRepository } from './notification.repository';

export class NotificationService {
  async getUserNotifications(institutionId: string, userId: string, unreadOnly = false, limit = 50, offset = 0) {
    return await notificationRepository.findForUser(institutionId, userId, unreadOnly, limit, offset);
  }

  async getUnreadCount(institutionId: string, userId: string) {
    const count = await notificationRepository.getUnreadCount(institutionId, userId);
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    return await notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(institutionId: string, userId: string) {
    return await notificationRepository.markAllAsRead(institutionId, userId);
  }

  async sendNotification(data: {
    institutionId: string;
    recipientUserId: string;
    title: string;
    message: string;
    channel?: string;
    type?: string;
    metadata?: Record<string, any>;
  }) {
    return await notificationRepository.createNotification(data);
  }
}

export const notificationService = new NotificationService();
