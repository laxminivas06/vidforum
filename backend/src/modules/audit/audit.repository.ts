import { db } from '../../config/database';
import { TenantScopedRepository } from '../../common/tenant-repository.base';

export interface AuditRecord {
  id: string;
  institution_id: string;
  actor_id: string;
  action: string;
  resource_table: string;
  resource_id?: string | null;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export class AuditRepository extends TenantScopedRepository<AuditRecord> {
  constructor() {
    super('audit_logs');
  }

  async findLogs(options: {
    institutionId?: string;
    actorId?: string;
    action?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(options.limit || 50, 200);
    const offset = options.offset || 0;
    const conditions: string[] = [];
    const values: any[] = [];
    let pIdx = 1;

    if (options.institutionId) {
      conditions.push(`(al.institution_id = $${pIdx} OR al.institution_id IS NULL)`);
      values.push(options.institutionId);
      pIdx++;
    }

    if (options.actorId) {
      conditions.push(`al.actor_id = $${pIdx}`);
      values.push(options.actorId);
      pIdx++;
    }

    if (options.action) {
      conditions.push(`al.action ILIKE $${pIdx}`);
      values.push(`%${options.action}%`);
      pIdx++;
    }

    if (options.resource) {
      conditions.push(`al.resource_table ILIKE $${pIdx}`);
      values.push(`%${options.resource}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT al.id, al.institution_id, al.actor_id, al.action,
             al.resource_table as resource,
             al.resource_id, al.old_value, al.new_value, al.ip_address,
             al.user_agent, al.created_at,
             p.full_name as actor_name, p.email as actor_email,
             i.name as institution_name
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.actor_id
      LEFT JOIN institutions i ON i.id = al.institution_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    values.push(limit, offset);

    const countQuery = `
      SELECT count(*) FROM audit_logs al
      ${whereClause}
    `;

    const [rowsRes, countRes] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, pIdx - 1)),
    ]);

    return {
      items: rowsRes.rows,
      total: parseInt(countRes.rows[0]?.count || '0', 10),
      limit,
      offset,
    };
  }

  async findLogById(id: string, institutionId?: string) {
    let query = `
      SELECT al.*, p.full_name as actor_name, p.email as actor_email, i.name as institution_name
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.actor_id
      LEFT JOIN institutions i ON i.id = al.institution_id
      WHERE al.id = $1
    `;
    const params: any[] = [id];

    if (institutionId) {
      query += ` AND (al.institution_id = $2 OR al.institution_id IS NULL)`;
      params.push(institutionId);
    }

    const res = await db.query(query, params);
    return res.rows[0] || null;
  }

  async createLog(data: {
    institutionId?: string | null;
    actorId?: string | null;
    action: string;
    resourceTable: string;
    resourceId?: string | null;
    oldValue?: Record<string, any> | null;
    newValue?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const rawIp = data.ipAddress;
    const ip = rawIp && rawIp !== '::1' && !rawIp.includes('localhost') ? rawIp : null;
    const res = await db.query(
      `INSERT INTO audit_logs (id, institution_id, actor_id, action, resource_table, resource_id, old_value, new_value, ip_address, user_agent, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8::inet, $9, now())
       RETURNING *`,
      [
        data.institutionId || null,
        data.actorId || null,
        data.action,
        data.resourceTable,
        data.resourceId || null,
        data.oldValue ? JSON.stringify(data.oldValue) : null,
        data.newValue ? JSON.stringify(data.newValue) : null,
        ip,
        data.userAgent || null,
      ]
    );
    return res.rows[0];
  }
}

export const auditRepository = new AuditRepository();
