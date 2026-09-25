"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_controller_1 = require("./finance.controller");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/finance/records
router.get('/records', tenant_middleware_1.tenantMiddleware, finance_controller_1.financeController.getRecords.bind(finance_controller_1.financeController));
// POST /api/v1/finance/payments
router.post('/payments', tenant_middleware_1.tenantMiddleware, finance_controller_1.financeController.recordPayment.bind(finance_controller_1.financeController));
// GET /api/v1/finance/summary
router.get('/summary', tenant_middleware_1.tenantMiddleware, finance_controller_1.financeController.getSummary.bind(finance_controller_1.financeController));
exports.default = router;
