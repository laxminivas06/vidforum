import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { sendError } from '../utils/api-response';

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const headerTenant = req.headers['x-institution-id'] as string;
  const userTenant = req.user?.institutionId;
  const institutionId = headerTenant || userTenant || '22222222-2222-2222-2222-222222222201'; // Default to Springfield Academy

  if (!institutionId) {
    sendError(res, 'Tenant context required: X-Institution-Id header missing', 400, 'TENANT_REQUIRED');
    return;
  }

  try {
    const instCheck = await db.query(
      'SELECT id, code, name, status FROM institutions WHERE id = $1 LIMIT 1',
      [institutionId]
    );

    if (instCheck.rows.length === 0) {
      // Check if code was passed instead of uuid
      const instByCode = await db.query(
        'SELECT id, code, name, status FROM institutions WHERE code = $1 LIMIT 1',
        [institutionId]
      );

      if (instByCode.rows.length > 0) {
        req.institutionId = instByCode.rows[0].id;
        next();
        return;
      }

      sendError(res, 'Specified institution not found or inactive', 404, 'INSTITUTION_NOT_FOUND');
      return;
    }

    req.institutionId = instCheck.rows[0].id;
    next();
  } catch (err) {
    console.error('Tenant verification error:', err);
    sendError(res, 'Internal tenant verification failure', 500, 'INTERNAL_ERROR');
  }
}
