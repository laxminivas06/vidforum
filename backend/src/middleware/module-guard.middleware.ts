import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { sendError } from '../utils/api-response';

/**
 * Optional-Module Toggle Guard (Section 12, Rules 4, 5, 27)
 * Enforces that requests to an optional module endpoint are blocked with 403 if the module is disabled for the tenant.
 */
export function requireModuleEnabled(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Super Admin operating across platform bypasses module toggles
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'Super Admin') {
      next();
      return;
    }

    const institutionId = req.institutionId || req.user?.institutionId;
    if (!institutionId) {
      sendError(res, 'Tenant context required to evaluate module status', 400, 'TENANT_REQUIRED');
      return;
    }

    try {
      const resModule = await db.query(
        `SELECT enabled FROM institution_modules WHERE institution_id = $1 AND module_key = $2 LIMIT 1`,
        [institutionId, moduleKey]
      );

      // If record exists and enabled is false, reject with 403
      if (resModule.rows.length > 0 && resModule.rows[0].enabled === false) {
        sendError(
          res,
          `Module '${moduleKey}' is currently disabled for this institution`,
          403,
          'MODULE_DISABLED'
        );
        return;
      }

      next();
    } catch (err) {
      console.error(`Module toggle verification failed for '${moduleKey}':`, err);
      // In case of transient failure, do not silently block core functionality
      next();
    }
  };
}
