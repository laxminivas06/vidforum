import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { auditRepository } from '../audit/audit.repository';
import { AuthRepository } from '../auth/auth.repository';
import { ROLE_TEMPLATES, resolveRoleTemplate, RoleTemplate } from './role-templates';

export interface ProvisionUserInput {
  name: string;
  email: string;
  userId?: string;
  roleTemplate?: string;
  workspaces?: string[];
  password?: string;
  institutionId?: string;
  staffId?: string;
  phone?: string;
  departmentId?: string;
  designationId?: string;
}

export interface ProvisionResult {
  id: string;
  staffId?: string | null;
  name: string;
  email: string;
  userId: string;
  role: string;
  roleTemplate: string;
  workspaces: string[];
  hasCredentials: boolean;
  mustChangePassword: boolean;
  initialPassword?: string;
  status: string;
  createdAt: string;
}

export interface BulkProvisionRowError {
  row: number;
  name?: string;
  email?: string;
  reason: string;
}

export interface BulkProvisionResult {
  total: number;
  successCount: number;
  failedCount: number;
  successful: ProvisionResult[];
  failed: BulkProvisionRowError[];
}

export class ProvisioningService {
  /**
   * Generates a secure random initial password meeting policy requirements:
   * 10 characters, upper, lower, digit, symbol.
   */
  public generateSecurePassword(): string {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghijkmnpqrstuvwxyz';
    const charsDigits = '23456789';
    const charsSymbols = '!@#$%&*';

    const getChar = (set: string) => set[crypto.randomInt(0, set.length)];

    const part1 = getChar(charsUpper) + getChar(charsLower) + getChar(charsDigits) + getChar(charsSymbols);
    const all = charsUpper + charsLower + charsDigits + charsSymbols;
    let part2 = '';
    for (let i = 0; i < 6; i++) {
      part2 += getChar(all);
    }

    return part1 + part2;
  }

  /**
   * Single account provisioning engine.
   */
  public async provisionUser(
    input: ProvisionUserInput,
    actorId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<ProvisionResult> {
    if (!input.name || !input.name.trim()) {
      throw new Error('Name is required');
    }
    if (!input.email || !input.email.trim()) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = input.email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      throw new Error(`Invalid email address format: ${input.email}`);
    }

    const cleanName = input.name.trim();
    const cleanUserId = (input.userId && input.userId.trim()) || cleanEmail;
    const tpl: RoleTemplate = resolveRoleTemplate(input.roleTemplate);
    const assignedWorkspaces: string[] = Array.isArray(input.workspaces) && input.workspaces.length > 0
      ? input.workspaces
      : [...tpl.defaultWorkspaces];

    const initialPassword = (input.password && input.password.trim()) || this.generateSecurePassword();
    if (initialPassword.length < 8) {
      throw new Error('Initial password must be at least 8 characters long');
    }
    const hashedPassword = bcrypt.hashSync(initialPassword, 10);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Resolve institution
      let instId = input.institutionId;
      if (!instId) {
        const instRes = await client.query("SELECT id FROM institutions WHERE status = 'active' ORDER BY created_at ASC LIMIT 1");
        instId = instRes.rows[0]?.id;
      }
      if (!instId) {
        throw new Error('No active institution found for provisioning');
      }

      // 2. Resolve Role in roles table
      const roleRes = await client.query(
        `SELECT id, name FROM roles 
         WHERE LOWER(name) = LOWER($1) 
            OR LOWER(REPLACE(name, ' ', '_')) = LOWER($1)
            OR LOWER(name) = LOWER(REPLACE($1, '_', ' '))
         LIMIT 1`,
        [tpl.roleName]
      );
      const roleId = roleRes.rows[0]?.id || '33333333-3333-3333-3333-333333333302';
      const resolvedRoleName = roleRes.rows[0]?.name || tpl.roleName;

      // 3. Upsert auth.users record
      let userRes = await client.query('SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
      let profileId = userRes.rows[0]?.id;

      const userMetadata = {
        full_name: cleanName,
        user_id: cleanUserId,
        userId: cleanUserId,
        must_change_password: true,
        role_template: tpl.key,
        workspaces: assignedWorkspaces,
      };

      if (profileId) {
        await client.query(
          `UPDATE auth.users 
           SET encrypted_password = $1,
               raw_user_meta_data = (COALESCE(raw_user_meta_data, '{}'::jsonb) - 'plain_password_hint' || $2::jsonb),
               updated_at = now()
           WHERE id = $3`,
          [hashedPassword, JSON.stringify(userMetadata), profileId]
        );
      } else {
        const insertAuth = await client.query(
          `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
           RETURNING id`,
          [cleanEmail, hashedPassword, JSON.stringify(userMetadata)]
        );
        profileId = insertAuth.rows[0].id;
      }

      // 4. Upsert profiles record
      await client.query(
        `INSERT INTO profiles (id, full_name, email, phone, default_institution_id, status, must_change_password, failed_login_attempts, locked_until)
         VALUES ($1, $2, $3, $4, $5, 'active', true, 0, NULL)
         ON CONFLICT (id) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               phone = COALESCE(EXCLUDED.phone, profiles.phone),
               default_institution_id = COALESCE(EXCLUDED.default_institution_id, profiles.default_institution_id),
               must_change_password = true,
               failed_login_attempts = 0,
               locked_until = NULL,
               status = 'active',
               updated_at = now()`,
        [profileId, cleanName, cleanEmail, input.phone || null, instId]
      );

      // 5. Staff association if needed
      let linkedStaffId = input.staffId || null;
      if (linkedStaffId) {
        await client.query('UPDATE staff SET profile_id = $1 WHERE id = $2', [profileId, linkedStaffId]);
      } else if (tpl.requiresStaffRecord) {
        const staffRes = await client.query('SELECT id FROM staff WHERE profile_id = $1', [profileId]);
        if (staffRes.rowCount === 0) {
          const empCode = `${tpl.key.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
          const insStaff = await client.query(
            `INSERT INTO staff (id, institution_id, profile_id, employee_code, is_teaching_staff, employment_status, date_of_joining, department_id, designation_id)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', CURRENT_DATE, $5, $6)
             RETURNING id`,
            [
              instId,
              profileId,
              empCode,
              tpl.key === 'TEACHER',
              input.departmentId || null,
              input.designationId || null,
            ]
          );
          linkedStaffId = insStaff.rows[0]?.id;
        } else {
          linkedStaffId = staffRes.rows[0]?.id;
        }
      }

      // 6. Assign role in user_roles with permitted workspaces and template in scope
      await client.query('DELETE FROM user_roles WHERE profile_id = $1', [profileId]);
      await client.query(
        `INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, now())`,
        [
          profileId,
          roleId,
          instId,
          JSON.stringify({
            workspaces: assignedWorkspaces,
            roleTemplate: tpl.key,
          }),
        ]
      );

      // 7. Audit log creation
      await auditRepository.createLog({
        institutionId: instId,
        actorId: actorId || null,
        action: 'user.provisioned',
        resourceTable: 'profiles',
        resourceId: profileId,
        newValue: {
          profileId,
          email: cleanEmail,
          userId: cleanUserId,
          role: resolvedRoleName,
          roleTemplate: tpl.key,
          workspaces: assignedWorkspaces,
          mustChangePassword: true,
        },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });

      await client.query('COMMIT');

      return {
        id: profileId,
        staffId: linkedStaffId,
        name: cleanName,
        email: cleanEmail,
        userId: cleanUserId,
        role: resolvedRoleName,
        roleTemplate: tpl.key,
        workspaces: assignedWorkspaces,
        hasCredentials: true,
        mustChangePassword: true,
        initialPassword,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk account provisioning engine with atomic per-row error handling.
   */
  public async bulkProvisionUsers(
    users: ProvisionUserInput[],
    institutionId?: string,
    actorId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<BulkProvisionResult> {
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('users array is required and must not be empty');
    }

    const successful: ProvisionResult[] = [];
    const failed: BulkProvisionRowError[] = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < users.length; i++) {
      const rowNum = i + 1;
      const user = users[i];

      if (!user.name || !user.name.trim()) {
        failed.push({ row: rowNum, name: user.name, email: user.email, reason: 'Missing required field: Name' });
        continue;
      }
      if (!user.email || !user.email.trim()) {
        failed.push({ row: rowNum, name: user.name, email: user.email, reason: 'Missing required field: Email' });
        continue;
      }

      const cleanEmail = user.email.trim().toLowerCase();
      if (seenEmails.has(cleanEmail)) {
        failed.push({ row: rowNum, name: user.name, email: user.email, reason: `Duplicate email within batch: ${cleanEmail}` });
        continue;
      }
      seenEmails.add(cleanEmail);

      try {
        const res = await this.provisionUser(
          {
            ...user,
            institutionId: user.institutionId || institutionId,
          },
          actorId,
          ipAddress,
          userAgent
        );
        successful.push(res);
      } catch (err: any) {
        failed.push({
          row: rowNum,
          name: user.name,
          email: user.email,
          reason: err.message || 'Provisioning failed for this row',
        });
      }
    }

    // Write audit log for bulk event
    await auditRepository.createLog({
      institutionId: institutionId || null,
      actorId: actorId || null,
      action: 'user.bulk_provisioned',
      resourceTable: 'profiles',
      newValue: {
        total: users.length,
        successCount: successful.length,
        failedCount: failed.length,
      },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return {
      total: users.length,
      successCount: successful.length,
      failedCount: failed.length,
      successful,
      failed,
    };
  }

  /**
   * Edit user access: updates role, roleTemplate, and workspaces.
   */
  public async updateUserAccess(
    userId: string,
    data: { roleTemplate?: string; role?: string; workspaces?: string[] },
    actorId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null
  ) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const profileRes = await client.query('SELECT * FROM profiles WHERE id = $1', [userId]);
      if (profileRes.rowCount === 0) {
        throw new Error('User not found');
      }
      const profile = profileRes.rows[0];

      const currentRoleRes = await client.query(
        `SELECT ur.*, r.name as role_name 
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.profile_id = $1`,
        [userId]
      );
      const currentRole = currentRoleRes.rows[0];

      let targetTemplate = data.roleTemplate ? resolveRoleTemplate(data.roleTemplate) : null;
      let targetRoleName = data.role || (targetTemplate ? targetTemplate.roleName : currentRole?.role_name || 'Faculty');
      let targetWorkspaces = data.workspaces || (targetTemplate ? targetTemplate.defaultWorkspaces : currentRole?.scope?.workspaces || []);

      const roleRes = await client.query(
        `SELECT id, name FROM roles 
         WHERE LOWER(name) = LOWER($1) 
            OR LOWER(REPLACE(name, ' ', '_')) = LOWER($1)
         LIMIT 1`,
        [targetRoleName]
      );
      const newRoleId = roleRes.rows[0]?.id || currentRole?.role_id;
      const resolvedRoleName = roleRes.rows[0]?.name || targetRoleName;

      // Update user_roles
      await client.query('DELETE FROM user_roles WHERE profile_id = $1', [userId]);
      await client.query(
        `INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, now())`,
        [
          userId,
          newRoleId,
          profile.default_institution_id,
          JSON.stringify({
            workspaces: targetWorkspaces,
            roleTemplate: targetTemplate?.key || currentRole?.scope?.roleTemplate || 'CUSTOM',
          }),
        ]
      );

      // Update metadata in auth.users
      await client.query(
        `UPDATE auth.users
         SET raw_user_meta_data = jsonb_set(
               jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{workspaces}', $1::jsonb),
               '{role_template}', $2::jsonb
             ),
             updated_at = now()
         WHERE id = $3`,
        [
          JSON.stringify(targetWorkspaces),
          JSON.stringify(targetTemplate?.key || 'CUSTOM'),
          userId,
        ]
      );

      await auditRepository.createLog({
        institutionId: profile.default_institution_id,
        actorId: actorId || null,
        action: 'user.access_updated',
        resourceTable: 'user_roles',
        resourceId: userId,
        oldValue: currentRole?.scope,
        newValue: {
          role: resolvedRoleName,
          workspaces: targetWorkspaces,
          roleTemplate: targetTemplate?.key || 'CUSTOM',
        },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });

      await client.query('COMMIT');

      return {
        id: userId,
        role: resolvedRoleName,
        roleTemplate: targetTemplate?.key || 'CUSTOM',
        workspaces: targetWorkspaces,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Reset credentials: sets new password, flags must_change_password=true, revokes active tokens.
   */
  public async resetCredentials(
    userId: string,
    customPassword?: string,
    actorId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null
  ) {
    const profileRes = await db.query('SELECT * FROM profiles WHERE id = $1', [userId]);
    if (profileRes.rowCount === 0) {
      throw new Error('User not found');
    }
    const profile = profileRes.rows[0];

    const newPassword = (customPassword && customPassword.trim()) || this.generateSecurePassword();
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    const hash = bcrypt.hashSync(newPassword, 10);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Update auth.users
      await client.query(
        `UPDATE auth.users
         SET encrypted_password = $1,
             raw_user_meta_data = (COALESCE(raw_user_meta_data, '{}'::jsonb) - 'plain_password_hint' || '{"must_change_password": true}'::jsonb),
             updated_at = now()
         WHERE id = $2`,
        [hash, userId]
      );

      // Update profiles
      await client.query(
        `UPDATE profiles
         SET must_change_password = true,
             failed_login_attempts = 0,
             locked_until = NULL,
             updated_at = now()
         WHERE id = $1`,
        [userId]
      );

      // Revoke all existing refresh tokens
      await client.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);

      // Audit log
      await auditRepository.createLog({
        institutionId: profile.default_institution_id,
        actorId: actorId || null,
        action: 'user.credentials_reset',
        resourceTable: 'profiles',
        resourceId: userId,
        newValue: { must_change_password: true, resetAt: new Date().toISOString() },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });

      await client.query('COMMIT');

      return {
        id: userId,
        email: profile.email,
        initialPassword: newPassword,
        mustChangePassword: true,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Deactivate / Reactivate User Account.
   */
  public async updateUserStatus(
    userId: string,
    status: 'active' | 'inactive' | 'suspended',
    actorId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null
  ) {
    const profileRes = await db.query('SELECT * FROM profiles WHERE id = $1', [userId]);
    if (profileRes.rowCount === 0) {
      throw new Error('User not found');
    }
    const profile = profileRes.rows[0];

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE profiles
         SET status = $1,
             updated_at = now()
         WHERE id = $2`,
        [status, userId]
      );

      // If deactivated or suspended, revoke all active sessions immediately
      if (status !== 'active') {
        await client.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);
      }

      await auditRepository.createLog({
        institutionId: profile.default_institution_id,
        actorId: actorId || null,
        action: 'user.status_updated',
        resourceTable: 'profiles',
        resourceId: userId,
        oldValue: { status: profile.status },
        newValue: { status },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });

      await client.query('COMMIT');

      return {
        id: userId,
        email: profile.email,
        status: status.toUpperCase(),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves security and provisioning audit logs for a specific user.
   */
  public async getUserAudit(userId: string) {
    const query = `
      SELECT al.id, al.action, al.resource_table, al.old_value, al.new_value,
             al.ip_address, al.user_agent, al.created_at,
             p.full_name as actor_name, p.email as actor_email
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.actor_id
      WHERE al.resource_id = $1 OR al.actor_id = $1
      ORDER BY al.created_at DESC
      LIMIT 100
    `;
    const res = await db.query(query, [userId]);
    return res.rows;
  }
}

export const provisioningService = new ProvisioningService();
