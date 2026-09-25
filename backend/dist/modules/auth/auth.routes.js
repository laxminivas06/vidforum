"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const api_response_1 = require("../../utils/api-response");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    const { email, password, role = 'INSTITUTION_ADMIN' } = req.body;
    if (!email) {
        (0, api_response_1.sendError)(res, 'Email is required', 400);
        return;
    }
    try {
        // Check if user exists in profiles/auth.users
        let userRes = await database_1.db.query(`SELECT p.id, p.full_name, p.email, p.default_institution_id,
              i.name as institution_name, i.code as institution_code,
              COALESCE(r.name, $2) as role_name
       FROM profiles p
       LEFT JOIN institutions i ON i.id = p.default_institution_id
       LEFT JOIN user_roles ur ON ur.profile_id = p.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE LOWER(p.email) = LOWER($1) LIMIT 1`, [email, role]);
        let user = userRes.rows[0];
        // If demo login or user not found, fallback to Springfield Admin or generate
        if (!user) {
            // Find springfield institution
            const instRes = await database_1.db.query("SELECT id, name, code FROM institutions WHERE code = 'SIA-BLR' LIMIT 1");
            const inst = instRes.rows[0];
            user = {
                id: '44444444-4444-4444-4444-444444444401',
                full_name: email.split('@')[0].toUpperCase(),
                email,
                default_institution_id: inst?.id || '22222222-2222-2222-2222-222222222201',
                institution_name: inst?.name || 'Springfield International Academy',
                institution_code: inst?.code || 'SIA-BLR',
                role_name: role,
            };
        }
        // Fetch permissions for the role
        const permRes = await database_1.db.query('SELECT code FROM permissions');
        const permissions = permRes.rows.map((r) => r.code);
        const tokenPayload = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role_name || role,
            institutionId: user.default_institution_id,
            permissions,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, env_1.env.JWT_SECRET, { expiresIn: '7d' });
        (0, api_response_1.sendSuccess)(res, {
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role_name || role,
                institutionId: user.default_institution_id,
                institutionName: user.institution_name,
                institutionCode: user.institution_code,
                permissions,
            },
        }, 'Authentication successful');
    }
    catch (error) {
        console.error('Login error:', error);
        (0, api_response_1.sendError)(res, 'Authentication failed: ' + error.message, 500);
    }
});
// GET /api/v1/auth/me
router.get('/me', auth_middleware_1.authMiddleware, async (req, res) => {
    if (!req.user) {
        (0, api_response_1.sendError)(res, 'Not authenticated', 401);
        return;
    }
    try {
        const instRes = await database_1.db.query('SELECT id, name, code, status, settings FROM institutions WHERE id = $1', [req.user.institutionId]);
        const institution = instRes.rows[0];
        (0, api_response_1.sendSuccess)(res, {
            user: req.user,
            institution,
        });
    }
    catch (err) {
        (0, api_response_1.sendError)(res, err.message, 500);
    }
});
// POST /api/v1/auth/switch-role
router.post('/switch-role', auth_middleware_1.authMiddleware, (req, res) => {
    const { newRole } = req.body;
    if (!req.user || !newRole) {
        (0, api_response_1.sendError)(res, 'New role is required', 400);
        return;
    }
    const updatedPayload = {
        ...req.user,
        role: newRole,
    };
    const token = jsonwebtoken_1.default.sign(updatedPayload, env_1.env.JWT_SECRET, { expiresIn: '7d' });
    (0, api_response_1.sendSuccess)(res, {
        token,
        role: newRole,
    }, `Switched role to ${newRole}`);
});
exports.default = router;
