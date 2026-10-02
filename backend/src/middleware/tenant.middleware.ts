import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { sendError } from '../utils/api-response';
import { AuditDispatcher } from '../common/audit-dispatcher';

/**
 * Tenant Resolver Middleware (Section 6, Rule 6, ADR-014)
 * Resolves institution_id from the verified token, never from client-supplied input.
 * Super Admin is the only cross-tenant role.
 * Cross-tenant attempt by non-super-admin returns 403 + security audit event.
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  const headerTenant = req.headers['x-institution-id'] as string;

  // 1. If user is unauthenticated, tenant cannot be resolved securely
  if (!user) {
    sendError(res, 'Authentication required before resolving tenant context', 401, 'UNAUTHORIZED');
    return;
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.role === 'Super Admin';

  // 2. Cross-tenant attempt detection (Section 6, Rule 6):
  // Non-super-admin cannot override their token's assigned institution context.
  if (!isSuperAdmin && headerTenant && headerTenant !== user.institutionId) {
    await AuditDispatcher.dispatch({
      actorId: user.id,
      action: 'security.cross_tenant_attempt',
      resource: 'tenants',
      institutionId: user.institutionId,
      ipAddress: req.ip || (req.socket.remoteAddress as string),
      userAgent: req.headers['user-agent'] as string,
      newValue: {
        attemptedInstitutionId: headerTenant,
        assignedInstitutionId: user.institutionId,
        path: req.originalUrl,
        method: req.method,
      },
    });

    sendError(
      res,
      'Cross-tenant access prohibited: your token is not authorized for this institution context',
      403,
      'CROSS_TENANT_ACCESS_DENIED'
    );
    return;
  }

  // 3. Resolve target institution ID
  let targetInstitutionId = isSuperAdmin ? (headerTenant || user.institutionId) : user.institutionId;

  // If super admin didn't specify an institution, they operate globally
  if (isSuperAdmin && !targetInstitutionId) {
    req.institutionId = undefined;
    next();
    return;
  }

  if (!targetInstitutionId) {
    sendError(res, 'Tenant context missing: user has no assigned institution', 403, 'TENANT_REQUIRED');
    return;
  }

  try {
    const instCheck = await db.query(
      'SELECT id, code, name, status FROM institutions WHERE id::text = $1 OR code = $1 LIMIT 1',
      [targetInstitutionId]
    );

    if (instCheck.rows.length === 0) {
      sendError(res, 'Specified institution not found or inactive', 404, 'INSTITUTION_NOT_FOUND');
      return;
    }

    const inst = instCheck.rows[0];
    if (inst.status === 'suspended' && !isSuperAdmin) {
      sendError(res, 'Institution is suspended. Access is restricted to platform administrators.', 403, 'INSTITUTION_SUSPENDED');
      return;
    }

    req.institutionId = inst.id;
    next();
  } catch (err) {
    console.error('Tenant verification error:', err);
    sendError(res, 'Internal tenant verification failure', 500, 'INTERNAL_ERROR');
  }
}
