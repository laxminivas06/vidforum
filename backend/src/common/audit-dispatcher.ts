import { db } from '../config/database';

/**
 * Standard Audit Log Event Interface per Section 11 & Rule 14
 * Mandatory fields: Actor, Action, Resource, Old Value, New Value, Timestamp, Institution, IP/Device
 */
export interface AuditEventPayload {
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  institutionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditDispatcher {
  /**
   * Dispatches an immutable audit event to PostgreSQL audit_logs table
   */
  public static async dispatch(event: AuditEventPayload): Promise<void> {
    const timestamp = new Date().toISOString();

    try {
      await db.query(
        `INSERT INTO audit_logs (
          id,
          actor_id,
          action,
          resource,
          resource_id,
          old_value,
          new_value,
          institution_id,
          ip_address,
          user_agent,
          created_at
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )`,
        [
          event.actorId,
          event.action,
          event.resource,
          event.resourceId || null,
          event.oldValue ? JSON.stringify(event.oldValue) : null,
          event.newValue ? JSON.stringify(event.newValue) : null,
          event.institutionId || null,
          event.ipAddress || null,
          event.userAgent || null,
          timestamp,
        ]
      );
    } catch (err: any) {
      // In case audit table schema is not yet migrated, log with high visibility to stderr
      console.warn('[AUDIT_DISPATCH_FALLBACK]', {
        timestamp,
        actor: event.actorId,
        action: event.action,
        resource: event.resource,
        institution: event.institutionId,
        error: err?.message,
      });
    }
  }
}
