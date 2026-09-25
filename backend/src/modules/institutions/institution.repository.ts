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
}

export const institutionRepository = new InstitutionRepository();
