"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const api_response_1 = require("../../utils/api-response");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/hrms/staff
router.get('/staff', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query(`SELECT st.*, p.full_name, p.email, p.phone, d.name as department_name, des.name as designation_name
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE st.institution_id = $1
       ORDER BY st.employee_code ASC`, [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/hrms/designations
router.get('/designations', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query('SELECT * FROM designations WHERE institution_id = $1 ORDER BY name ASC', [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/hrms/leaves
router.get('/leaves', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query(`SELECT lr.*, p.full_name as staff_name, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN staff st ON st.id = lr.staff_id
       JOIN profiles p ON p.id = st.profile_id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.institution_id = $1
       ORDER BY lr.created_at DESC`, [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
exports.default = router;
