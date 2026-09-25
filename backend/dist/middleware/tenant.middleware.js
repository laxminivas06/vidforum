"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
const database_1 = require("../config/database");
const api_response_1 = require("../utils/api-response");
async function tenantMiddleware(req, res, next) {
    const headerTenant = req.headers['x-institution-id'];
    const userTenant = req.user?.institutionId;
    const institutionId = headerTenant || userTenant || '22222222-2222-2222-2222-222222222201'; // Default to Springfield Academy
    if (!institutionId) {
        (0, api_response_1.sendError)(res, 'Tenant context required: X-Institution-Id header missing', 400, 'TENANT_REQUIRED');
        return;
    }
    try {
        const instCheck = await database_1.db.query('SELECT id, code, name, status FROM institutions WHERE id = $1 LIMIT 1', [institutionId]);
        if (instCheck.rows.length === 0) {
            // Check if code was passed instead of uuid
            const instByCode = await database_1.db.query('SELECT id, code, name, status FROM institutions WHERE code = $1 LIMIT 1', [institutionId]);
            if (instByCode.rows.length > 0) {
                req.institutionId = instByCode.rows[0].id;
                next();
                return;
            }
            (0, api_response_1.sendError)(res, 'Specified institution not found or inactive', 404, 'INSTITUTION_NOT_FOUND');
            return;
        }
        req.institutionId = instCheck.rows[0].id;
        next();
    }
    catch (err) {
        console.error('Tenant verification error:', err);
        (0, api_response_1.sendError)(res, 'Internal tenant verification failure', 500, 'INTERNAL_ERROR');
    }
}
