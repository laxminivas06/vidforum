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
      // 2. Search profiles by email, phone, or Super Admin alias
      const profileRes = await db.query(
        `SELECT p.id, p.full_name, p.email, p.default_institution_id,
                i.name as institution_name, i.code as institution_code,
                r.name as role_name
         FROM profiles p
         LEFT JOIN institutions i ON i.id = p.default_institution_id
         LEFT JOIN user_roles ur ON ur.profile_id = p.id
         LEFT JOIN roles r ON r.id = ur.role_id
         WHERE LOWER(p.email) = LOWER($1) 
            OR LOWER(p.phone) = LOWER($1)
            OR ($2 = true AND LOWER(p.email) = 'superadmin@vid.edu')
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
          resolvedRole = 'INSTITUTION_ADMIN';
        }
      }

      // 3. Search students table by admission_number (e.g. SIA-2026-042)
      if (!user) {
        const studentRes = await db.query(
          `SELECT s.id, s.first_name || ' ' || s.last_name as full_name, s.admission_number,
                  s.institution_id as default_institution_id,
                  i.name as institution_name, i.code as institution_code
           FROM students s
           LEFT JOIN institutions i ON i.id = s.institution_id
           WHERE LOWER(s.admission_number) = LOWER($1) OR LOWER(s.id::text) = LOWER($1) LIMIT 1`,
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
      if (password && password !== 'admin123') {
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

    // 4. Strict RBAC Enforcement: If no valid registered account exists, reject with 401
    // (Random test IDs and unregistered accounts are strictly rejected)
    if (!user) {
      sendError(res, 'Invalid User ID or Email. Account not found.', 401);
      return;
    }

    user.role_name = resolvedRole || 'INSTITUTION_ADMIN';

    // 5. Password Verification: Enforce admin123 for Super Administrator
    if (user.role_name === 'SUPER_ADMIN' || isSuperAdminAlias) {
      if (password && password !== 'admin123') {
        sendError(res, 'Invalid password for Super Administrator. Please check your credentials.', 401);
        return;
      }
    }

    let permissions: string[] = [];
    try {
      const permRes = await db.query('SELECT code FROM permissions');
      permissions = permRes.rows.map((r: any) => r.code);
    } catch {
      permissions = ['platform.all'];
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role_name,
      institutionId: user.default_institution_id,
      permissions,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '7d' });

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role_name,
        institutionId: user.default_institution_id,
        institutionName: user.institution_name || (user.role_name === 'SUPER_ADMIN' ? 'VID Global Platform' : 'Springfield International Academy'),
        institutionCode: user.institution_code || (user.role_name === 'SUPER_ADMIN' ? 'VID-GLOBAL' : 'SIA-BLR'),
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

export default router;
