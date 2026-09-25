"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academics_controller_1 = require("./academics.controller");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/academics/grades
router.get('/grades', tenant_middleware_1.tenantMiddleware, academics_controller_1.academicsController.getGrades.bind(academics_controller_1.academicsController));
// GET /api/v1/academics/hierarchy
router.get('/hierarchy', tenant_middleware_1.tenantMiddleware, academics_controller_1.academicsController.getHierarchy.bind(academics_controller_1.academicsController));
// GET /api/v1/academics/classes
router.get('/classes', tenant_middleware_1.tenantMiddleware, academics_controller_1.academicsController.getClasses.bind(academics_controller_1.academicsController));
// GET /api/v1/academics/subjects
router.get('/subjects', tenant_middleware_1.tenantMiddleware, academics_controller_1.academicsController.getSubjects.bind(academics_controller_1.academicsController));
exports.default = router;
