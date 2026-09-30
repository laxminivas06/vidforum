import { db } from '../../config/database';

export class InstitutionRepository {
  async findAll() {
    const query = `
      SELECT 
        i.id,
        i.code,
        i.name,
        i.status,
        i.address,
        i.contact_email as "contactEmail",
        i.contact_phone as "contactPhone",
        i.settings,
        i.created_at as "createdAt",
        COALESCE(p.code, 'ENTERPRISE') as plan,
        COALESCE(s_count.total, 0) as "studentsCount",
        COALESCE(f_count.total, 0) as "facultyCount"
      FROM institutions i
      LEFT JOIN subscription_plans p ON p.id = i.plan_id
      LEFT JOIN (
        SELECT institution_id, count(*) as total 
        FROM students 
        WHERE status = 'active' 
        GROUP BY institution_id
      ) s_count ON s_count.institution_id = i.id
      LEFT JOIN (
        SELECT institution_id, count(*) as total 
        FROM staff 
        WHERE employment_status = 'active' AND is_teaching_staff = true 
        GROUP BY institution_id
      ) f_count ON f_count.institution_id = i.id
      ORDER BY i.created_at ASC
    `;
    const res = await db.query(query);
    return res.rows;
  }

  async findByIdOrCode(idOrCode: string) {
    const res = await db.query(
      `SELECT i.*, p.code as plan_code, p.name as plan_name 
       FROM institutions i 
       LEFT JOIN subscription_plans p ON p.id = i.plan_id 
       WHERE i.id = $1 OR i.code = $1`,
      [idOrCode]
    );
    return res.rows[0] || null;
  }

  async create(data: {
    name: string;
    code: string;
    domain: string;
    plan?: string;
    region?: string;
    boardAffiliation?: string;
    contactEmail?: string;
    contactPhone?: string;
  }) {
    let planId: string = '11111111-1111-1111-1111-111111111103';
    const planUpper = (data.plan || 'ENTERPRISE').toUpperCase();
    if (planUpper === 'BASIC') {
      planId = '11111111-1111-1111-1111-111111111101';
    } else if (planUpper === 'PRO') {
      planId = '11111111-1111-1111-1111-111111111102';
    }

    const settings = {
      domain: data.domain,
      boardAffiliation: data.boardAffiliation || 'State Board',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    };
    const query = `
      INSERT INTO institutions (code, name, status, plan_id, address, contact_email, contact_phone, settings)
      VALUES ($1, $2, 'active', $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const res = await db.query(query, [
      data.code.trim().toUpperCase(),
      data.name.trim(),
      planId,
      data.region || 'India',
      data.contactEmail?.trim() || null,
      data.contactPhone?.trim() || null,
      JSON.stringify(settings),
    ]);
    return res.rows[0];
  }

  async createAdmin(data: {
    userId: string;
    name?: string;
    email: string;
    institutionId: string;
    workspaces: string[];
  }) {
    const adminRoleId = '33333333-3333-3333-3333-333333333301';
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const cleanEmail = data.email.trim().toLowerCase();
      const displayName = data.name?.trim() || data.userId.trim();

      let userRes = await client.query('SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
      let profileId = userRes.rows[0]?.id;

      if (!profileId) {
        const insertAuth = await client.query(`
          INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, now(), now())
          RETURNING id
        `, [cleanEmail, JSON.stringify({ full_name: displayName })]);
        profileId = insertAuth.rows[0].id;
      }

      await client.query(`
        INSERT INTO profiles (id, full_name, email, default_institution_id, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (id) DO UPDATE
          SET full_name = EXCLUDED.full_name, default_institution_id = EXCLUDED.default_institution_id, updated_at = now()
      `, [profileId, displayName, cleanEmail, data.institutionId]);

      await client.query(`
        DELETE FROM user_roles WHERE profile_id = $1 AND role_id = $2
      `, [profileId, adminRoleId]);

      await client.query(`
        INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, now())
      `, [profileId, adminRoleId, data.institutionId, JSON.stringify({ workspaces: data.workspaces })]);

      await client.query('COMMIT');
      return { profileId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAdmins(institutionId: string) {
    const res = await db.query(`
      SELECT 
        p.id,
        p.email as "userId",
        p.full_name as name,
        p.email,
        ur.institution_id as "institutionId",
        i.name as "institutionName",
        i.code as "institutionCode",
        COALESCE(ur.scope->'workspaces', '[]'::jsonb) as workspaces,
        p.created_at as "createdAt"
      FROM profiles p
      JOIN user_roles ur ON ur.profile_id = p.id
      LEFT JOIN institutions i ON i.id = ur.institution_id
      WHERE ur.institution_id = $1 OR i.code = $1
      ORDER BY p.created_at DESC
    `, [institutionId]);
    return res.rows;
  }

  async findModules(institutionId: string) {
    const res = await db.query(
      'SELECT module_code, is_enabled, config FROM module_configurations WHERE institution_id = $1',
      [institutionId]
    );
    return res.rows;
  }

  async getStats(institutionId: string) {
    const [studentsRes, staffRes, attendanceRes, feesRes] = await Promise.all([
      db.query("SELECT count(*) FROM students WHERE institution_id = $1 AND status = 'active'", [institutionId]),
      db.query("SELECT count(*) FROM staff WHERE institution_id = $1 AND employment_status = 'active'", [institutionId]),
      db.query(`
        SELECT 
          round(100.0 * count(*) filter (where status = 'present') / nullif(count(*), 0), 1) as rate
        FROM attendance_records
        WHERE institution_id = $1
      `, [institutionId]),
      db.query(`
        SELECT 
          COALESCE(sum(total_amount), 0) as total,
          COALESCE(sum(balance_due), 0) as pending
        FROM student_fees
        WHERE institution_id = $1
      `, [institutionId]),
    ]);

    return {
      totalStudents: parseInt(studentsRes.rows[0].count, 10),
      totalStaff: parseInt(staffRes.rows[0].count, 10),
      attendanceRate: parseFloat(attendanceRes.rows[0]?.rate || '94.2'),
      feesTotal: parseFloat(feesRes.rows[0]?.total || '0'),
      feesPending: parseFloat(feesRes.rows[0]?.pending || '0'),
    };
  }

  async upsertModule(institutionId: string, moduleCode: string, isEnabled: boolean) {
    const res = await db.query(
      `INSERT INTO module_configurations (institution_id, module_code, is_enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (institution_id, module_code) 
       DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_at = now()
       RETURNING *`,
      [institutionId, moduleCode, isEnabled]
    );
    return res.rows[0];
  }

  async updateStatus(idOrCode: string, status: 'active' | 'inactive' | 'suspended') {
    const res = await db.query(
      `UPDATE institutions 
       SET status = $1, updated_at = now() 
       WHERE id::text = $2 OR code = $2 
       RETURNING *`,
      [status.toLowerCase(), idOrCode]
    );
    return res.rows[0] || null;
  }
}

export const institutionRepository = new InstitutionRepository();

