import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { sendSuccess, sendError } from '../../utils/api-response';
import { authMiddleware } from '../../middleware/auth.middleware';
import { AuthRepository } from './auth.repository';
import { AuthRateLimiter } from './auth-rate-limiter';
import { AuditDispatcher } from '../../common/audit-dispatcher';

const router = Router();

const PASSWORD_DENYLIST = [
  'admin123',
  'password',
  '12345678',
  '123456789',
  'qwerty',
  'qwertyuiop',
  'admin',
  'pass1234',
  'password123',
  'vid12345',
];

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, userId, identifier, password } = req.body;
  const loginIdentifier = (identifier || email || userId || '').toString().trim();

  if (!loginIdentifier) {
    sendError(res, 'User ID or Email is required', 400);
    return;
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    sendError(res, 'Password is required', 400);
    return;
  }

  const suppliedPassword = password.trim();
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = (req.headers['user-agent'] || '').toString();

  try {
    // 1. Check rate limit / lockout
    const lockoutStatus = await AuthRateLimiter.isLocked(clientIp, loginIdentifier);
    if (lockoutStatus.locked) {
      sendError(
        res,
        `Account or IP is temporarily locked due to excessive failed attempts. Please try again after ${Math.ceil(lockoutStatus.remainingSeconds / 60)} minute(s).`,
        429,
        'ACCOUNT_LOCKED'
      );
      return;
    }

    // 2. Find login subject across auth.users & profiles via single clean query
    const subject = await AuthRepository.findLoginSubject(loginIdentifier);

    // 3. If subject doesn't exist, record failure and reject
    if (!subject) {
      const failRecord = await AuthRateLimiter.recordFailure(clientIp, loginIdentifier);

      if (failRecord.locked) {
        await AuditDispatcher.dispatch({
          actorId: '00000000-0000-0000-0000-000000000000',
          action: 'auth.login.lockout',
          resource: 'auth',
          newValue: { identifier: loginIdentifier, attempts: failRecord.attempts, ipAddress: clientIp },
          ipAddress: clientIp,
          userAgent,
        });

        sendError(
          res,
          'Account has been locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.',
          429,
          'ACCOUNT_LOCKED'
        );
        return;
      }

      await AuditDispatcher.dispatch({
        actorId: '00000000-0000-0000-0000-000000000000',
        action: 'auth.login.failure',
        resource: 'auth',
        newValue: { identifier: loginIdentifier, reason: 'Subject not found', attempts: failRecord.attempts },
        ipAddress: clientIp,
        userAgent,
      });

      sendError(res, 'Invalid email/user ID or password', 401);
      return;
    }

    // 4. Check account status
    if (subject.status === 'inactive' || subject.status === 'suspended') {
      sendError(res, 'Account is deactivated or suspended. Please contact your institutional administrator.', 403, 'ACCOUNT_DEACTIVATED');
      return;
    }

    // 5. Check if profile itself is locked in database
    const dbLockout = await AuthRateLimiter.isLocked(clientIp, loginIdentifier, subject.id);
    if (dbLockout.locked) {
      sendError(
        res,
        `Account is temporarily locked due to excessive failed attempts. Please try again after ${Math.ceil(dbLockout.remainingSeconds / 60)} minute(s).`,
        429,
        'ACCOUNT_LOCKED'
      );
      return;
    }

    // 6. Strict Password Verification using bcrypt only
    let isPasswordValid = false;
    if (subject.encryptedPassword) {
      try {
        isPasswordValid = bcrypt.compareSync(suppliedPassword, subject.encryptedPassword);
      } catch (err) {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      const failRecord = await AuthRateLimiter.recordFailure(clientIp, loginIdentifier, subject.id);

      if (failRecord.locked) {
        await AuditDispatcher.dispatch({
          actorId: subject.id,
          action: 'auth.login.lockout',
          resource: 'auth',
          institutionId: subject.defaultInstitutionId,
          newValue: { attempts: failRecord.attempts, ipAddress: clientIp },
          ipAddress: clientIp,
          userAgent,
        });

        sendError(
          res,
          'Account has been locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.',
          429,
          'ACCOUNT_LOCKED'
        );
        return;
      }

      await AuditDispatcher.dispatch({
        actorId: subject.id,
        action: 'auth.login.failure',
        resource: 'auth',
        institutionId: subject.defaultInstitutionId,
        newValue: { reason: 'Invalid password', attempts: failRecord.attempts },
        ipAddress: clientIp,
        userAgent,
      });

      sendError(res, 'Invalid email/user ID or password', 401);
      return;
    }

    // 7. Successful login: reset failure counter
    await AuthRateLimiter.reset(clientIp, loginIdentifier, subject.id);

    // 8. Resolve permissions
    const permissions = await AuthRepository.getUserPermissions(subject.id, subject.roleName);

    // 9. Resolve assigned workspaces
    const assignedWorkspaces: string[] =
      (subject.scope && Array.isArray((subject.scope as any).workspaces))
        ? (subject.scope as any).workspaces
        : (subject.rawUserMetaData?.workspaces && Array.isArray(subject.rawUserMetaData.workspaces))
        ? subject.rawUserMetaData.workspaces
        : (subject.roleName === 'SUPER_ADMIN'
          ? ['platform']
          : subject.roleName === 'FACULTY'
          ? ['faculty', 'academics', 'attendance', 'examinations', 'timetable']
          : []);

    // 10. Issue short-lived access token (15 minutes per ADR-017 / Section 15)
    const tokenPayload = {
      id: subject.id,
      email: subject.email,
      fullName: subject.fullName,
      role: subject.roleName,
      institutionId: subject.defaultInstitutionId,
      assignedWorkspaces,
      permissions,
      mustChangePassword: subject.mustChangePassword,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '15m' });

    // 11. Issue refresh token
    const refreshToken = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    try {
      const safeIp = (clientIp === '::1' || clientIp === 'localhost') ? '127.0.0.1' : clientIp;
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, ip_address, device_info, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [subject.id, tokenHash, safeIp, userAgent.substring(0, 200), expiresAt.toISOString()]
      );
    } catch (refErr) {
      console.warn('Refresh token persistence warning:', (refErr as any)?.message);
    }

    // 12. Dispatch audit log for successful login
    await AuditDispatcher.dispatch({
      actorId: subject.id,
      action: 'auth.login.success',
      resource: 'auth',
      institutionId: subject.defaultInstitutionId,
      newValue: {
        role: subject.roleName,
        mustChangePassword: subject.mustChangePassword,
        workspaces: assignedWorkspaces,
      },
      ipAddress: clientIp,
      userAgent,
    });

    sendSuccess(res, {
      token,
      refreshToken,
      user: {
        id: subject.id,
        name: subject.fullName,
        email: subject.email,
        role: subject.roleName,
        institutionId: subject.defaultInstitutionId,
        institutionName: subject.institutionName || (subject.roleName === 'SUPER_ADMIN' ? 'VID Global Platform' : 'Partner Institution'),
        institutionCode: subject.institutionCode || (subject.roleName === 'SUPER_ADMIN' ? 'VID-GLOBAL' : 'INST'),
        assignedWorkspaces,
        permissions,
        mustChangePassword: subject.mustChangePassword,
      },
    }, 'Authentication successful');
  } catch (error: any) {
    console.error('Login error:', error);
    sendError(res, 'Authentication failed: ' + error.message, 500);
  }
});

// POST /api/v1/auth/change-password
router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (!user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  if (!currentPassword || typeof currentPassword !== 'string') {
    sendError(res, 'Current password is required', 400);
    return;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    sendError(res, 'New password must be at least 8 characters long', 400);
    return;
  }

  const cleanNew = newPassword.trim();
  const cleanCurrent = currentPassword.trim();

  // Denylist check
  if (PASSWORD_DENYLIST.includes(cleanNew.toLowerCase())) {
    sendError(res, 'Password is too common or easily guessable. Please choose a stronger password.', 400);
    return;
  }

  if (cleanNew === cleanCurrent) {
    sendError(res, 'New password cannot be identical to current password', 400);
    return;
  }

  try {
    // Verify current password against auth.users
    const userRow = await db.query(
      `SELECT encrypted_password FROM auth.users WHERE id = $1`,
      [user.id]
    );

    if (userRow.rows.length === 0 || !userRow.rows[0].encrypted_password) {
      sendError(res, 'User account not found', 404);
      return;
    }

    const currentValid = bcrypt.compareSync(cleanCurrent, userRow.rows[0].encrypted_password);
    if (!currentValid) {
      sendError(res, 'Current password verification failed', 401);
      return;
    }

    // Update password, clear must_change_password and revoke tokens
    await AuthRepository.updatePassword(user.id, cleanNew);

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] || '').toString();

    await AuditDispatcher.dispatch({
      actorId: user.id,
      action: 'auth.password.changed',
      resource: 'auth',
      institutionId: user.institutionId,
      newValue: { status: 'password_updated', mustChangePassword: false },
      ipAddress: clientIp,
      userAgent,
    });

    // Issue newly updated token without mustChangePassword
    const newTokenPayload = {
      ...user,
      mustChangePassword: false,
    };
    const token = jwt.sign(newTokenPayload, env.JWT_SECRET, { expiresIn: '15m' });

    sendSuccess(res, { token }, 'Password updated successfully');
  } catch (err: any) {
    console.error('Password change error:', err);
    sendError(res, 'Failed to update password: ' + err.message, 500);
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  try {
    let institution = null;
    if (req.user.institutionId) {
      const instRes = await db.query(
        'SELECT id, name, code, status, settings FROM institutions WHERE id = $1',
        [req.user.institutionId]
      );
      institution = instRes.rows[0] || null;
    }

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

  const token = jwt.sign(updatedPayload, env.JWT_SECRET, { expiresIn: '15m' });

  sendSuccess(res, {
    token,
    role: newRole,
  }, `Switched role to ${newRole}`);
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    sendError(res, 'Refresh token is required', 400);
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  try {
    const tokenRes = await db.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
              p.email, p.full_name, p.default_institution_id, p.must_change_password,
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
    const newRefreshToken = crypto.randomUUID();
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [row.user_id, newTokenHash, newExpiresAt.toISOString()]
    );

    // Issue new access token (15m)
    const tokenPayload = {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      role: AuthRepository.normalizeRole(row.role_name),
      institutionId: row.default_institution_id,
      mustChangePassword: Boolean(row.must_change_password),
    };

    const newAccessToken = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '15m' });

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
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db.query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash]);
    } catch (err) {
      console.warn('Logout token revocation error:', err);
    }
  }
  sendSuccess(res, null, 'Logged out successfully');
});

export default router;
