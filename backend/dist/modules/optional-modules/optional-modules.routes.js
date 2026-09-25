"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const api_response_1 = require("../../utils/api-response");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/optional-modules/events
router.get('/events', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query('SELECT * FROM events WHERE institution_id = $1 ORDER BY start_time DESC', [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/optional-modules/transport/routes
router.get('/transport/routes', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query('SELECT * FROM transport_routes WHERE institution_id = $1 ORDER BY name ASC', [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/optional-modules/hostels
router.get('/hostels', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query('SELECT * FROM hostels WHERE institution_id = $1 ORDER BY name ASC', [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/optional-modules/library/books
router.get('/library/books', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query('SELECT * FROM library_books WHERE institution_id = $1 ORDER BY title ASC', [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/optional-modules/sports/teams
router.get('/sports/teams', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query('SELECT * FROM sports_teams WHERE institution_id = $1 ORDER BY name ASC', [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/optional-modules/inventory/assets
router.get('/inventory/assets', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query('SELECT * FROM inventory_assets WHERE institution_id = $1 ORDER BY name ASC', [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
exports.default = router;
