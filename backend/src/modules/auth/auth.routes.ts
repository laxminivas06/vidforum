import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authMiddleware } from '../../middleware/auth.middleware';
import { institutionService } from '../institutions/institution.service';

const router = Router();

function normalizeRole(roleName: string): string {
  const lower = (roleName || '').toLowerCase();
  if (lower.includes('super')) return 'SUPER_ADMIN';
  if (lower.includes('institution') || lower.includes('principal') || lower.includes('director')) return 'INSTITUTION_ADMIN';
  if (lower.includes('faculty') || lower.includes('teacher') || lower.includes('instructor')) return 'FACULTY';
  if (lower.includes('student')) return 'STUDENT';
  if (lower.includes('parent') || lower.includes('guardian')) return 'PARENT';
  if (lower.includes('admission')) return 'ADMISSION_TEAM';
  if (lower.includes('finance') || lower.includes('bursar') || lower.includes('account')) return 'FINANCE_TEAM';
  if (lower.includes('exam')) return 'EXAM_TEAM';
  if (lower.includes('academic') || lower.includes('curriculum')) return 'ACADEMIC_COORDINATOR';
  return 'INSTITUTION_ADMIN';
}

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, userId, identifier, password } = req.body;
  const loginIdentifier = (identifier || email || userId || '').trim();

  if (!loginIdentifier) {
    sendError(res, 'User ID or Email is required', 400);
    return;
  }

  try {
    // 0. Check custom provisioned Institute Admins
    const customAdmin = institutionService.findAdminByIdentifier(loginIdentifier);
    if (customAdmin) {
      if (password && customAdmin.password && password !== customAdmin.password) {
        sendError(res, 'Invalid password for Institute Administrator. Please check your credentials.', 401);
        return;
      }

      const tokenPayload = {
        id: customAdmin.id,
        email: customAdmin.email,
        fullName: customAdmin.name,
        role: 'INSTITUTION_ADMIN',
        institutionId: customAdmin.institutionId,
        assignedWorkspaces: customAdmin.workspaces,
        permissions: ['institutions.read', 'admissions.read', 'academics.manage'],
      };

      const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '7d' });

      sendSuccess(res, {
        token,
        user: {
          id: customAdmin.userId || customAdmin.id,
          name: customAdmin.name,
          email: customAdmin.email,
          role: 'INSTITUTION_ADMIN',
          institutionId: customAdmin.institutionId,
          institutionName: customAdmin.institutionName,
          institutionCode: customAdmin.institutionCode,
          assignedWorkspaces: customAdmin.workspaces,
          permissions: tokenPayload.permissions,
        },
      }, 'Authentication successful');
      return;
    }
    let resolvedRole: string | null = null;
    let user: any = null;

    // 1. Check if user is Super Admin (via identifier 'superadmin', 'superadmin@vid.edu', or 'SA-001')
    const isSuperAdminAlias = ['superadmin', 'superadmin@vid.edu', 'sa-001', 'superadmin@vid.platform'].includes(loginIdentifier.toLowerCase());

    try {
      // 2. Search auth.users & profiles by email, user_id, employee_code, or phone
      const profileRes = await db.query(
        `SELECT COALESCE(p.id, u.id)::text as id,
                COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'fullName') as full_name,
                COALESCE(p.email, u.email) as email,
                COALESCE(p.default_institution_id::text, u.raw_user_meta_data->>'institutionId') as default_institution_id,
                u.encrypted_password, u.raw_user_meta_data,
                i.name as institution_name, i.code as institution_code,
                r.name as role_name, ur.scope,
                st.employee_code
         FROM auth.users u
         LEFT JOIN profiles p ON p.id = u.id OR LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
         LEFT JOIN institutions i ON i.id = p.default_institution_id
         LEFT JOIN user_roles ur ON ur.profile_id = p.id OR ur.profile_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN staff st ON st.profile_id = p.id OR st.profile_id = u.id
         WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1)) 
            OR LOWER(TRIM(COALESCE(p.email, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'user_id', ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'userId', ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(st.employee_code, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(p.phone, ''))) = LOWER(TRIM($1))
            OR ($2 = true AND LOWER(TRIM(COALESCE(u.email, p.email, ''))) = 'superadmin@vid.edu')
         ORDER BY (CASE WHEN r.name IS NOT NULL THEN 1 ELSE 2 END), u.created_at DESC
         LIMIT 1`,
        [loginIdentifier, isSuperAdminAlias]
      );

      if (profileRes.rows[0]) {
        user = profileRes.rows[0];
        if (isSuperAdminAlias || (user.email && user.email.toLowerCase().includes('superadmin'))) {
          resolvedRole = 'SUPER_ADMIN';
        } else if (user.role_name) {
          resolvedRole = normalizeRole(user.role_name);
        } else {
          resolvedRole = 'FACULTY';
        }
      }

      // 3. Fallback: Search profiles directly if auth.users row was not joined
      if (!user) {
        const directProfileRes = await db.query(
          `SELECT COALESCE(p.id, u.id)::text as id,
                  COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') as full_name,
                  COALESCE(p.email, u.email) as email,
                  p.default_institution_id::text as default_institution_id,
                  u.encrypted_password, u.raw_user_meta_data,
                  i.name as institution_name, i.code as institution_code,
                  r.name as role_name, ur.scope,
                  st.employee_code
           FROM profiles p
           LEFT JOIN auth.users u ON u.id = p.id OR LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
           LEFT JOIN institutions i ON i.id = p.default_institution_id
           LEFT JOIN user_roles ur ON ur.profile_id = p.id
           LEFT JOIN roles r ON r.id = ur.role_id
           LEFT JOIN staff st ON st.profile_id = p.id
           WHERE LOWER(TRIM(p.email)) = LOWER(TRIM($1)) 
              OR LOWER(TRIM(COALESCE(u.email, ''))) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'user_id', ''))) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'userId', ''))) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(st.employee_code, ''))) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(p.phone, ''))) = LOWER(TRIM($1))
           ORDER BY (CASE WHEN r.name IS NOT NULL THEN 1 ELSE 2 END)
           LIMIT 1`,
          [loginIdentifier]
        );
        if (directProfileRes.rows[0]) {
          user = directProfileRes.rows[0];
          resolvedRole = user.role_name ? normalizeRole(user.role_name) : 'FACULTY';
        }
      }

      // 3.5 Fallback: Search staff directly by employee_code or email
      if (!user) {
        const staffRes = await db.query(
          `SELECT st.id as staff_id, COALESCE(p.id, u.id)::text as id,
                  COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', 'Faculty Member') as full_name,
                  COALESCE(p.email, u.email) as email,
                  st.institution_id::text as default_institution_id,
                  u.encrypted_password, u.raw_user_meta_data,
                  i.name as institution_name, i.code as institution_code,
                  'FACULTY' as role_name,
                  st.employee_code
           FROM staff st
           LEFT JOIN profiles p ON p.id = st.profile_id
           LEFT JOIN auth.users u ON u.id = p.id OR LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
           LEFT JOIN institutions i ON i.id = st.institution_id
           WHERE LOWER(TRIM(st.employee_code)) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(p.email, ''))) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(u.email, ''))) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'user_id', ''))) = LOWER(TRIM($1))
              OR LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'userId', ''))) = LOWER(TRIM($1))
           LIMIT 1`,
          [loginIdentifier]
        );
        if (staffRes.rows[0]) {
          user = staffRes.rows[0];
          resolvedRole = 'FACULTY';
        }
      }

      // 4. Search students table by admission_number (e.g. SIA-2026-042)
      if (!user) {
        const studentRes = await db.query(
          `SELECT s.id, s.first_name || ' ' || s.last_name as full_name, s.admission_number,
                  s.institution_id as default_institution_id,
                  i.name as institution_name, i.code as institution_code
           FROM students s
           LEFT JOIN institutions i ON i.id = s.institution_id
           WHERE LOWER(TRIM(s.admission_number)) = LOWER(TRIM($1)) OR LOWER(TRIM(s.id::text)) = LOWER(TRIM($1)) LIMIT 1`,
          [loginIdentifier]
        );
        if (studentRes.rows[0]) {
          user = {
            ...studentRes.rows[0],
            email: `${studentRes.rows[0].admission_number.toLowerCase()}@springfield.edu`,
          };
          resolvedRole = 'STUDENT';
        }
      }
    } catch (dbErr) {
      console.warn('Database query during auth failed, checking fallbacks:', (dbErr as any)?.message);
    }

    // Fallback for Super Admin if database record is missing
    if (isSuperAdminAlias && !user) {
      const suppliedPass = (password || '').trim() || 'admin123';
      if (suppliedPass !== 'admin123') {
        sendError(res, 'Invalid password for Super Administrator. Please check your credentials.', 401);
        return;
      }
      user = {
        id: 'sa-001',
        full_name: 'VID Platform Super Admin',
        email: 'superadmin@vid.edu',
        default_institution_id: 'vid-global',
        institution_name: 'VID Global Platform',
        institution_code: 'VID-GLOBAL',
        role_name: 'SUPER_ADMIN',
      };
      resolvedRole = 'SUPER_ADMIN';
    }

    // 5. Strict RBAC Enforcement: If no valid registered account exists, reject with 401
    if (!user) {
      sendError(res, 'Invalid User ID or Email. Account not found.', 401);
      return;
    }

    user.role_name = resolvedRole || 'INSTITUTION_ADMIN';

    // 6. Password Verification:
    // Support default password 'admin123' across all accounts (Admin, Faculty, Staff).
    // Also support custom provisioned passwords via bcrypt comparison.
    // If password is blank or omitted, automatically defaults to 'admin123'.
    const suppliedPassword = (password || '').trim() || 'admin123';

    const isDefaultAdminPass = suppliedPassword === 'admin123';
    let isPasswordValid = isDefaultAdminPass;

    if (!isPasswordValid && user.encrypted_password) {
      try {
        isPasswordValid = bcrypt.compareSync(suppliedPassword, user.encrypted_password);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      sendError(res, 'Invalid password. Default password is admin123.', 401);
      return;
    }

    let permissions: string[] = [];
    if (user.role_name === 'SUPER_ADMIN') {
      permissions = ['*', 'platform.all'];
    } else {
      try {
        // Query permissions specifically granted to this user's role
        const permRes = await db.query(
          `SELECT DISTINCT p.code
           FROM permissions p
           JOIN role_permissions rp ON rp.permission_id = p.id
           JOIN user_roles ur ON ur.role_id = rp.role_id
           WHERE ur.profile_id = $1`,
          [user.id]
        );
        permissions = permRes.rows.map((r: any) => r.code);

        // Fallback to role-level permissions if user_roles had not yet joined rp
        if (permissions.length === 0 && user.role_name) {
          const rolePermRes = await db.query(
            `SELECT DISTINCT p.code
             FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             JOIN roles r ON r.id = rp.role_id
             WHERE UPPER(r.name) = UPPER($1) OR UPPER(r.name) = UPPER($2)`,
            [user.role_name, user.role_name.replace(/_/g, ' ')]
          );
          permissions = rolePermRes.rows.map((r: any) => r.code);
        }

        // Default for Institution Admin if empty: all non-platform permissions
        if (permissions.length === 0 && (user.role_name === 'INSTITUTION_ADMIN' || user.role_name === 'Institution Admin')) {
          const instPerms = await db.query(`SELECT code FROM permissions WHERE module != 'platform'`);
          permissions = instPerms.rows.map((r: any) => r.code);
        }
      } catch (pErr) {
        console.warn('Permissions resolution error:', (pErr as any)?.message);
        permissions = [];
      }
    }

    const assignedWorkspaces: string[] =
      (user?.scope && Array.isArray((user.scope as any).workspaces))
        ? (user.scope as any).workspaces
        : (user?.raw_user_meta_data?.workspaces && Array.isArray(user.raw_user_meta_data.workspaces))
        ? user.raw_user_meta_data.workspaces
        : (user.role_name === 'FACULTY' ? ['faculty', 'academics', 'attendance', 'examinations', 'timetable'] : []);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role_name,
      institutionId: user.default_institution_id,
      assignedWorkspaces,
      permissions,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '7d' });

    // Issue refresh token
    const refreshToken = require('crypto').randomUUID();
    const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    try {
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt.toISOString()]
      );
    } catch (refErr) {
      console.warn('Refresh token persistence warning:', (refErr as any)?.message);
    }

    sendSuccess(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role_name,
        institutionId: user.default_institution_id,
        institutionName: user.institution_name || (user.role_name === 'SUPER_ADMIN' ? 'VID Global Platform' : 'Springfield International Academy'),
        institutionCode: user.institution_code || (user.role_name === 'SUPER_ADMIN' ? 'VID-GLOBAL' : 'SIA-BLR'),
        assignedWorkspaces,
        permissions,
      },
    }, 'Authentication successful');
  } catch (error: any) {
    console.error('Login error:', error);
    sendError(res, 'Authentication failed: ' + error.message, 500);
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  try {
    const instRes = await db.query(
      'SELECT id, name, code, status, settings FROM institutions WHERE id = $1',
      [req.user.institutionId]
    );

    const institution = instRes.rows[0];

    sendSuccess(res, {
      user: req.user,
      institution,
    });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// POST /api/v1/auth/switch-role
router.post('/switch-role', authMiddleware, (req: Request, res: Response) => {
  const { newRole } = req.body;
  if (!req.user || !newRole) {
    sendError(res, 'New role is required', 400);
    return;
  }

  const updatedPayload = {
    ...req.user,
    role: newRole,
  };

  const token = jwt.sign(updatedPayload, env.JWT_SECRET, { expiresIn: '7d' });

  sendSuccess(res, {
    token,
    role: newRole,
  }, `Switched role to ${newRole}`);
});

// POST /api/v1/auth/refresh (Section 15: refresh token rotation)
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    sendError(res, 'Refresh token is required', 400);
    return;
  }

  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');

  try {
    const tokenRes = await db.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
              p.email, p.full_name, p.default_institution_id,
              COALESCE(r.name, 'INSTITUTION_ADMIN') as role_name
       FROM refresh_tokens rt
       JOIN profiles p ON p.id = rt.user_id
       LEFT JOIN user_roles ur ON ur.profile_id = p.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE rt.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      sendError(res, 'Invalid refresh token', 401);
      return;
    }

    const row = tokenRes.rows[0];
    if (row.revoked) {
      sendError(res, 'Refresh token has been revoked', 401);
      return;
    }

    if (new Date(row.expires_at) < new Date()) {
      sendError(res, 'Refresh token has expired', 401);
      return;
    }

    // Revoke old refresh token (rotation)
    await db.query(`UPDATE refresh_tokens SET revoked = true WHERE id = $1`, [row.id]);

    // Issue new refresh token
    const newRefreshToken = require('crypto').randomUUID();
    const newTokenHash = require('crypto').createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [row.user_id, newTokenHash, newExpiresAt.toISOString()]
    );

    // Issue new access token
    const tokenPayload = {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      role: row.role_name,
      institutionId: row.default_institution_id,
    };

    const newAccessToken = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '7d' });

    sendSuccess(res, {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully');
  } catch (err: any) {
    sendError(res, 'Token refresh failed: ' + err.message, 500);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
      await db.query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash]);
    } catch (err) {
      console.warn('Logout token revocation error:', err);
    }
  }
  sendSuccess(res, null, 'Logged out successfully');
});

export default router;
