import { db } from '../../config/database';
import bcrypt from 'bcryptjs';

export interface LoginSubject {
  id: string;
  email: string;
  fullName: string;
  encryptedPassword?: string | null;
  rawUserMetaData?: Record<string, any> | null;
  status: string;
  defaultInstitutionId?: string | null;
  institutionName?: string | null;
  institutionCode?: string | null;
  roleName: string;
  scope?: Record<string, any> | null;
  employeeCode?: string | null;
  staffId?: string | null;
  designationId?: string | null;
  mustChangePassword: boolean;
}

export class AuthRepository {
  public static normalizeRole(roleName?: string | null): string {
    const lower = (roleName || '').toLowerCase().trim();
    if (lower.includes('super')) return 'SUPER_ADMIN';
    if (lower.includes('institution') || lower.includes('principal') || lower.includes('director')) return 'INSTITUTION_ADMIN';
    if (lower.includes('faculty') || lower.includes('teacher') || lower.includes('instructor')) return 'FACULTY';
    if (lower.includes('student')) return 'STUDENT';
    if (lower.includes('parent') || lower.includes('guardian')) return 'PARENT';
    if (lower.includes('admission')) return 'ADMISSION_TEAM';
    if (lower.includes('finance') || lower.includes('bursar') || lower.includes('account')) return 'FINANCE_TEAM';
    if (lower.includes('exam')) return 'EXAM_TEAM';
    if (lower.includes('academic') || lower.includes('curriculum')) return 'ACADEMIC_COORDINATOR';
    if (lower.includes('hr')) return 'HR_STAFF';
    return 'INSTITUTION_ADMIN';
  }

  /**
   * Finds login subject matching email, login_id, user_id, or employee_code case-insensitively.
   * Does NOT query student table (students have no ERP workspace login per Rule 1).
   */
  public static async findLoginSubject(identifier: string): Promise<LoginSubject | null> {
    const cleanId = (identifier || '').trim();
    if (!cleanId) return null;

    const isSuperAdminAlias = ['superadmin', 'superadmin@vid.edu', 'sa-001', 'superadmin@vid.platform'].includes(cleanId.toLowerCase());

    const res = await db.query(
      `SELECT 
         u.id::text as id,
         COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'fullName', 'VID User') as full_name,
         COALESCE(p.email, u.email) as email,
         u.encrypted_password,
         u.raw_user_meta_data,
         COALESCE(p.status, 'active') as status,
         COALESCE(p.default_institution_id::text, u.raw_user_meta_data->>'institutionId') as default_institution_id,
         i.name as institution_name,
         i.code as institution_code,
         r.name as role_name,
         ur.scope,
         st.employee_code,
         st.id::text as staff_id,
         st.designation_id::text as designation_id,
         COALESCE(p.must_change_password, (u.raw_user_meta_data->>'must_change_password')::boolean, false) as must_change_password
       FROM auth.users u
       LEFT JOIN profiles p ON p.id = u.id
       LEFT JOIN institutions i ON i.id = p.default_institution_id
       LEFT JOIN user_roles ur ON ur.profile_id = p.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN staff st ON st.profile_id = p.id
       WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(p.email, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'login_id', ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'user_id', ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'userId', ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(st.employee_code, ''))) = LOWER(TRIM($1))
          OR ($2 = true AND LOWER(TRIM(COALESCE(u.email, p.email, ''))) = 'superadmin@vid.edu')
       ORDER BY (CASE WHEN r.name IS NOT NULL THEN 1 ELSE 2 END), u.created_at DESC
       LIMIT 1`,
      [cleanId, isSuperAdminAlias]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const resolvedRole = isSuperAdminAlias || (row.email && row.email.toLowerCase().includes('superadmin'))
      ? 'SUPER_ADMIN'
      : this.normalizeRole(row.role_name);

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      encryptedPassword: row.encrypted_password,
      rawUserMetaData: row.raw_user_meta_data,
      status: row.status,
      defaultInstitutionId: row.default_institution_id,
      institutionName: row.institution_name,
      institutionCode: row.institution_code,
      roleName: resolvedRole,
      scope: row.scope,
      employeeCode: row.employee_code,
      staffId: row.staff_id,
      designationId: row.designation_id,
      mustChangePassword: Boolean(row.must_change_password),
    };
  }

  /**
   * Fetches permissions granted to the user.
   */
  public static async getUserPermissions(userId: string, roleName: string): Promise<string[]> {
    if (roleName === 'SUPER_ADMIN') {
      return ['*', 'platform.all'];
    }

    try {
      const permRes = await db.query(
        `SELECT DISTINCT p.code
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.profile_id = $1`,
        [userId]
      );
      if (permRes.rows.length > 0) {
        return permRes.rows.map((r: any) => r.code);
      }

      // Fallback by role name
      const rolePermRes = await db.query(
        `SELECT DISTINCT p.code
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         WHERE UPPER(r.name) = UPPER($1) OR UPPER(r.name) = UPPER($2)`,
        [roleName, roleName.replace(/_/g, ' ')]
      );
      if (rolePermRes.rows.length > 0) {
        return rolePermRes.rows.map((r: any) => r.code);
      }

      if (roleName === 'INSTITUTION_ADMIN') {
        const instPerms = await db.query(`SELECT code FROM permissions WHERE module != 'platform'`);
        return instPerms.rows.map((r: any) => r.code);
      }
    } catch (err) {
      console.warn('Error fetching user permissions:', (err as any)?.message);
    }
    return [];
  }

  /**
   * Updates password, clears must_change_password and any plain_password_hint.
   */
  public static async updatePassword(userId: string, newPlainPassword: string): Promise<void> {
    const hash = bcrypt.hashSync(newPlainPassword, 10);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Update auth.users
      await client.query(
        `UPDATE auth.users
         SET encrypted_password = $1,
             raw_user_meta_data = (COALESCE(raw_user_meta_data, '{}'::jsonb) - 'plain_password_hint' || '{"must_change_password": false}'::jsonb),
             updated_at = now()
         WHERE id = $2`,
        [hash, userId]
      );

      // Update profiles
      await client.query(
        `UPDATE profiles
         SET must_change_password = false,
             failed_login_attempts = 0,
             locked_until = NULL,
             updated_at = now()
         WHERE id = $1`,
        [userId]
      );

      // Revoke all existing refresh tokens for security
      await client.query(
        `UPDATE refresh_tokens
         SET revoked = true
         WHERE user_id = $1`,
        [userId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Revokes all refresh tokens for a user (e.g. on logout or security reset).
   */
  public static async revokeAllRefreshTokens(userId: string): Promise<void> {
    await db.query(`UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, [userId]);
  }
}
