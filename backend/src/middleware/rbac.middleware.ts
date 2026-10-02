import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';

/**
 * RBAC Role Check Middleware (Section 7, Rule 7, Rule 26)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'Super Admin') {
      next();
      return;
    }

    const normalizedUserRole = req.user.role.toUpperCase().replace(/\s+/g, '_');
    const hasRole = allowedRoles.some((r) => r.toUpperCase().replace(/\s+/g, '_') === normalizedUserRole);

    if (!hasRole) {
      sendError(res, `Access denied: Requires role [${allowedRoles.join(', ')}]`, 403, 'FORBIDDEN');
      return;
    }

    next();
  };
}

/**
 * Permission Middleware (Section 7, Rule 7, Rule 26)
 * Checks canonical permission code format: <module>.<resource>.<action>
 * Super Admin or '*' automatically grants access.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    const permissions = req.user.permissions || [];

    if (
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'Super Admin' ||
      permissions.includes('*') ||
      permissions.includes('platform.all') ||
      permissions.includes(permission)
    ) {
      next();
      return;
    }

    // Check wildcard module matching e.g. 'academics.*'
    const [mod] = permission.split('.');
    if (permissions.includes(`${mod}.*`)) {
      next();
      return;
    }

    sendError(res, `Access denied: Missing required permission '${permission}'`, 403, 'PERMISSION_DENIED');
  };
}

/**
 * Check if user has ANY of the specified permissions
 */
export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    const userPerms = req.user.permissions || [];

    if (
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'Super Admin' ||
      userPerms.includes('*') ||
      userPerms.includes('platform.all')
    ) {
      next();
      return;
    }

    const hasAny = permissions.some((p) => {
      const [mod] = p.split('.');
      return userPerms.includes(p) || userPerms.includes(`${mod}.*`);
    });

    if (!hasAny) {
      sendError(res, `Access denied: Requires at least one of permissions [${permissions.join(', ')}]`, 403, 'PERMISSION_DENIED');
      return;
    }

    next();
  };
}
