"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
const api_response_1 = require("../utils/api-response");
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, api_response_1.sendError)(res, 'Authentication required', 401, 'UNAUTHORIZED');
            return;
        }
        if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'Super Admin') {
            next();
            return;
        }
        const normalizedUserRole = req.user.role.toUpperCase().replace(/\s+/g, '_');
        const hasRole = allowedRoles.some((r) => r.toUpperCase().replace(/\s+/g, '_') === normalizedUserRole);
        if (!hasRole) {
            (0, api_response_1.sendError)(res, `Access denied: Requires role [${allowedRoles.join(', ')}]`, 403, 'FORBIDDEN');
            return;
        }
        next();
    };
}
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            (0, api_response_1.sendError)(res, 'Authentication required', 401, 'UNAUTHORIZED');
            return;
        }
        if (req.user.role === 'SUPER_ADMIN' ||
            req.user.role === 'Super Admin' ||
            req.user.permissions.includes('*') ||
            req.user.permissions.includes(permission)) {
            next();
            return;
        }
        (0, api_response_1.sendError)(res, `Access denied: Missing permission '${permission}'`, 403, 'PERMISSION_DENIED');
    };
}
