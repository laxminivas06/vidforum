import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { db } from '../../config/database';
import { sendSuccess } from '../../utils/api-response';
import { CANONICAL_WORKSPACES, WorkspaceDefinition } from './workspace.registry';

const router = Router();

// GET /api/v1/workspaces
router.get('/', async (req: Request, res: Response) => {
  let user: any = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      user = jwt.verify(token, env.JWT_SECRET) as any;
    } catch {
      user = null;
    }
  }

  let grantedKeys = new Set<string>();

  if (user) {
    if (user.role === 'SUPER_ADMIN') {
      grantedKeys = new Set(['platform', 'dashboard', 'settings', 'campus_life']);
    } else if (user.role === 'INSTITUTION_ADMIN') {
      // All 12 operational workspaces granted
      CANONICAL_WORKSPACES.filter((w) => w.key !== 'platform').forEach((w) => grantedKeys.add(w.key));
    } else {
      // Query database user scope
      try {
        const grantRes = await db.query(
          `SELECT ur.scope, u.raw_user_meta_data
           FROM profiles p
           LEFT JOIN user_roles ur ON ur.profile_id = p.id
           LEFT JOIN auth.users u ON u.id = p.id
           WHERE p.id = $1`,
          [user.id]
        );

        if (grantRes.rows.length > 0) {
          const row = grantRes.rows[0];
          if (row.scope && Array.isArray(row.scope.workspaces)) {
            row.scope.workspaces.forEach((k: string) => grantedKeys.add(k));
          } else if (row.raw_user_meta_data && Array.isArray(row.raw_user_meta_data.workspaces)) {
            row.raw_user_meta_data.workspaces.forEach((k: string) => grantedKeys.add(k));
          }
        }

        // Fallback to role template defaults if no explicit DB scope found
        if (grantedKeys.size === 0) {
          CANONICAL_WORKSPACES.filter((w) => w.defaultRoles.includes(user.role)).forEach((w) =>
            grantedKeys.add(w.key)
          );
        }
      } catch (err) {
        console.warn('Error fetching workspace scope for user in list endpoint:', (err as any)?.message);
      }
    }
  }

  const workspaces = CANONICAL_WORKSPACES.map((w: WorkspaceDefinition) => ({
    ...w,
    granted: user ? grantedKeys.has(w.key) : true,
  }));

  sendSuccess(res, workspaces, 'Canonical platform workspaces retrieved');
});

export default router;
