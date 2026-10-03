import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { sendError } from '../utils/api-response';
import { AuditDispatcher } from '../common/audit-dispatcher';
import { CANONICAL_WORKSPACES } from '../modules/workspaces/workspace.registry';

export function requireWorkspace(workspaceKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      sendError(res, 'Authentication token missing or invalid', 401, 'UNAUTHORIZED');
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] || '').toString();

    // 1. Super Admin access policy
    if (user.role === 'SUPER_ADMIN') {
      const allowedForSuperAdmin = ['platform', 'dashboard', 'settings', 'campus_life'];
      if (allowedForSuperAdmin.includes(workspaceKey)) {
        next();
        return;
      }
      // Super admin is not an institution worker (PRD separation)
      await AuditDispatcher.dispatch({
        actorId: user.id,
        action: 'workspace.access.denied',
        resource: 'workspace',
        resourceId: workspaceKey,
        newValue: { reason: 'Super Admin isolated from operational workspace', attemptedWorkspace: workspaceKey },
        ipAddress: clientIp,
        userAgent,
      });

      sendError(
        res,
        `Access denied: Super Administrator is isolated from tenant-operational '${workspaceKey}' workspace.`,
        403,
        'WORKSPACE_ACCESS_DENIED'
      );
      return;
    }

    // 2. Institution Admin access policy: full grant across all 12 operational workspaces
    if (user.role === 'INSTITUTION_ADMIN') {
      if (workspaceKey === 'platform') {
        sendError(res, 'Access denied: Platform console is reserved for Super Administrators.', 403, 'WORKSPACE_ACCESS_DENIED');
        return;
      }
      next();
      return;
    }

    // 3. Role-based and database-backed scope verification for other roles (Faculty, Staff, etc.)
    try {
      const grantRes = await db.query(
        `SELECT ur.scope, u.raw_user_meta_data
         FROM profiles p
         LEFT JOIN user_roles ur ON ur.profile_id = p.id
         LEFT JOIN auth.users u ON u.id = p.id
         WHERE p.id = $1`,
        [user.id]
      );

      let grantedWorkspaces: string[] = [];

      if (grantRes.rows.length > 0) {
        const row = grantRes.rows[0];
        if (row.scope && Array.isArray(row.scope.workspaces)) {
          grantedWorkspaces = row.scope.workspaces;
        } else if (row.raw_user_meta_data && Array.isArray(row.raw_user_meta_data.workspaces)) {
          grantedWorkspaces = row.raw_user_meta_data.workspaces;
        }
      }

      // If no explicit DB scope granted, check role template defaults from CANONICAL_WORKSPACES
      if (grantedWorkspaces.length === 0) {
        const matchingWorkspaces = CANONICAL_WORKSPACES.filter((w) =>
          w.defaultRoles.includes(user.role)
        ).map((w) => w.key);
        grantedWorkspaces = matchingWorkspaces;
      }

      // Check if requested workspace is granted
      if (!grantedWorkspaces.includes(workspaceKey)) {
        await AuditDispatcher.dispatch({
          actorId: user.id,
          action: 'workspace.access.denied',
          resource: 'workspace',
          resourceId: workspaceKey,
          institutionId: user.institutionId,
          oldValue: { attemptedWorkspace: workspaceKey },
          newValue: { grantedWorkspaces, reason: 'Unauthorized workspace access' },
          ipAddress: clientIp,
          userAgent,
        });

        sendError(
          res,
          `Access denied: you do not have permission to access the '${workspaceKey}' workspace.`,
          403,
          'WORKSPACE_ACCESS_DENIED'
        );
        return;
      }

      // Granted
      next();
    } catch (err: any) {
      console.error('Workspace verification error:', err);
      sendError(res, 'Failed to verify workspace permissions: ' + err.message, 500);
    }
  };
}
