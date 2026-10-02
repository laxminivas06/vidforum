import { db } from '../../config/database';
import { TenantScopedRepository } from '../../common/tenant-repository.base';

export interface NotificationRecord {
  id: string;
  institution_id: string;
  recipient_profile_id: string;
  template_id?: string | null;
  channel: string;
  status: string;
  payload: Record<string, any>;
  sent_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

export class NotificationRepository extends TenantScopedRepository<NotificationRecord> {
  constructor() {
    super('notifications');
  }

  async findForUser(institutionId: string, userId: string, unreadOnly = false, limit = 50, offset = 0) {
    let query = `
      SELECT id, institution_id, recipient_profile_id, channel, status, payload, sent_at, created_at,
             (payload->>'read_at') as read_at
      FROM notifications
      WHERE institution_id = $1 AND recipient_profile_id = $2
    `;

    if (unreadOnly) {
      query += ` AND (payload->>'read_at' IS NULL)`;
    }

    query += ` ORDER BY created_at DESC LIMIT $3 OFFSET $4`;

    const res = await db.query(query, [institutionId, userId, limit, offset]);
    return res.rows;
  }

  async getUnreadCount(institutionId: string, userId: string): Promise<number> {
    const res = await db.query(
      `SELECT count(*) FROM notifications 
       WHERE institution_id = $1 AND recipient_profile_id = $2 
         AND (payload->>'read_at' IS NULL)`,
      [institutionId, userId]
    );
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const res = await db.query(
      `UPDATE notifications
       SET payload = COALESCE(payload, '{}'::jsonb) || jsonb_build_object('read_at', now()::text)
       WHERE id = $1 AND recipient_profile_id = $2
       RETURNING id`,
      [notificationId, userId]
    );
    return res.rows.length > 0;
  }

  async markAllAsRead(institutionId: string, userId: string): Promise<number> {
    const res = await db.query(
      `UPDATE notifications
       SET payload = COALESCE(payload, '{}'::jsonb) || jsonb_build_object('read_at', now()::text)
       WHERE institution_id = $1 AND recipient_profile_id = $2 AND (payload->>'read_at' IS NULL)
       RETURNING id`,
      [institutionId, userId]
    );
    return res.rows.length;
  }

  async createNotification(data: {
    institutionId: string;
    recipientUserId: string;
    title: string;
    message: string;
    channel?: string;
    type?: string;
    metadata?: Record<string, any>;
  }) {
    const validChannels: Record<string, string> = {
      in_app: 'push',
      push: 'push',
      sms: 'sms',
      email: 'email',
      voice: 'voice',
    };
    const mappedChannel = validChannels[(data.channel || 'push').toLowerCase()] || 'push';

    const payload = {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      metadata: data.metadata || {},
    };

    const res = await db.query(
      `INSERT INTO notifications (institution_id, recipient_profile_id, channel, status, payload, sent_at)
       VALUES ($1, $2, $3::notification_channel, 'delivered'::notification_status, $4, now())
       RETURNING *`,
      [data.institutionId, data.recipientUserId, mappedChannel, JSON.stringify(payload)]
    );
    return res.rows[0];
  }
}

export const notificationRepository = new NotificationRepository();
