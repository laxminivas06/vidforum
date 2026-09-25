import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';

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

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'Super Admin' ||
      req.user.permissions.includes('*') ||
      req.user.permissions.includes(permission)
    ) {
      next();
      return;
    }

    sendError(res, `Access denied: Missing permission '${permission}'`, 403, 'PERMISSION_DENIED');
  };
}
