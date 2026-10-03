import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { AuthRepository } from './auth.repository';
import { AuthRateLimiter } from './auth-rate-limiter';
import { AuditDispatcher } from '../../common/audit-dispatcher';

export const PASSWORD_DENYLIST = [
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

export class AuthService {
  async login(
    credentials: { identifier?: string; email?: string; userId?: string; password?: string },
    context: { ipAddress?: string; userAgent?: string } = {}
  ) {
    const loginIdentifier = (credentials.identifier || credentials.email || credentials.userId || '').toString().trim();
    if (!loginIdentifier) {
      throw new Error('User ID or Email is required');
    }
    if (!credentials.password || typeof credentials.password !== 'string' || !credentials.password.trim()) {
      throw new Error('Password is required');
    }

    const suppliedPassword = credentials.password.trim();
    const clientIp = context.ipAddress || '127.0.0.1';
    const userAgent = context.userAgent || 'system';

    const lockoutStatus = await AuthRateLimiter.isLocked(clientIp, loginIdentifier);
    if (lockoutStatus.locked) {
      throw new Error(`Account or IP is temporarily locked due to excessive failed attempts.`);
    }

    const subject = await AuthRepository.findLoginSubject(loginIdentifier);
    if (!subject) {
      await AuthRateLimiter.recordFailure(clientIp, loginIdentifier);
      throw new Error('Invalid email/user ID or password');
    }

    if (subject.status === 'inactive' || subject.status === 'suspended') {
      throw new Error('Account is deactivated or suspended. Please contact your institutional administrator.');
    }

    let isPasswordValid = false;
    if (subject.encryptedPassword) {
      try {
        isPasswordValid = bcrypt.compareSync(suppliedPassword, subject.encryptedPassword);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      await AuthRateLimiter.recordFailure(clientIp, loginIdentifier, subject.id);
      throw new Error('Invalid email/user ID or password');
    }

    await AuthRateLimiter.reset(clientIp, loginIdentifier, subject.id);

    const permissions = await AuthRepository.getUserPermissions(subject.id, subject.roleName);
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
    const refreshToken = crypto.randomUUID();

    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const safeIp = (clientIp === '::1' || clientIp === 'localhost') ? '127.0.0.1' : clientIp;
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, ip_address, device_info, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [subject.id, tokenHash, safeIp, userAgent.substring(0, 200), expiresAt.toISOString()]
      );
    } catch (refErr) {
      console.warn('Refresh token persistence warning:', (refErr as any)?.message);
    }

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

    return {
      token,
      refreshToken,
      user: {
        id: subject.id,
        name: subject.fullName,
        email: subject.email,
        role: subject.roleName,
        status: subject.status,
        institutionId: subject.defaultInstitutionId,
        institutionName: subject.institutionName || 'Partner Institution',
        institutionCode: subject.institutionCode || 'INST',
        assignedWorkspaces,
        permissions,
        mustChangePassword: subject.mustChangePassword,
      },
    };
  }

  async changePassword(
    userId: string,
    currentPassword?: string,
    newPassword?: string,
    context: { ipAddress?: string; userAgent?: string } = {}
  ) {
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    const cleanNew = newPassword.trim();
    if (PASSWORD_DENYLIST.includes(cleanNew.toLowerCase())) {
      throw new Error('Password is too common or easily guessable. Please choose a stronger password.');
    }

    if (currentPassword) {
      const cleanCurrent = currentPassword.trim();
      if (cleanNew === cleanCurrent) {
        throw new Error('New password cannot be identical to current password');
      }

      const userRow = await db.query(
        `SELECT encrypted_password FROM auth.users WHERE id = $1`,
        [userId]
      );
      if (userRow.rows.length === 0 || !userRow.rows[0].encrypted_password) {
        throw new Error('User account not found');
      }
      const currentValid = bcrypt.compareSync(cleanCurrent, userRow.rows[0].encrypted_password);
      if (!currentValid) {
        throw new Error('Current password verification failed');
      }
    }

    await AuthRepository.updatePassword(userId, cleanNew);

    await AuditDispatcher.dispatch({
      actorId: userId,
      action: 'auth.password.changed',
      resource: 'auth',
      newValue: { status: 'password_updated', mustChangePassword: false },
      ipAddress: context.ipAddress || '127.0.0.1',
      userAgent: context.userAgent || 'system',
    });

    return true;
  }
}

export const authService = new AuthService();
