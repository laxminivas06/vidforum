"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admissions_controller_1 = require("./admissions.controller");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/admissions/applicants
router.get('/applicants', tenant_middleware_1.tenantMiddleware, admissions_controller_1.admissionsController.getApplicants.bind(admissions_controller_1.admissionsController));
// PATCH /api/v1/admissions/applicants/:id/stage
router.patch('/applicants/:id/stage', tenant_middleware_1.tenantMiddleware, admissions_controller_1.admissionsController.updateStage.bind(admissions_controller_1.admissionsController));
// POST /api/v1/admissions/applicants/:id/approve
router.post('/applicants/:id/approve', tenant_middleware_1.tenantMiddleware, admissions_controller_1.admissionsController.approve.bind(admissions_controller_1.admissionsController));
exports.default = router;
