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

    const isUuid = (val?: string | null) =>
      val ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) : false;

    let safeActorId: string | null = null;
    if (isUuid(event.actorId)) {
      try {
        const actorCheck = await db.query('SELECT 1 FROM profiles WHERE id = $1', [event.actorId]);
        if (actorCheck.rows.length > 0) {
          safeActorId = event.actorId;
        }
      } catch {
        safeActorId = null;
      }
    }

    const safeInstitutionId = isUuid(event.institutionId) ? event.institutionId : null;
    const safeResourceId = isUuid(event.resourceId) ? event.resourceId : null;

    const auditNewValue = {
      ...(event.newValue || {}),
      ...(safeActorId ? {} : { rawActorId: event.actorId }),
    };

    try {
      await db.query(
        `INSERT INTO audit_logs (
          id,
          actor_id,
          action,
          resource_table,
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
          safeActorId,
          event.action,
          event.resource,
          safeResourceId,
          event.oldValue ? JSON.stringify(event.oldValue) : null,
          Object.keys(auditNewValue).length > 0 ? JSON.stringify(auditNewValue) : null,
          safeInstitutionId,
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
