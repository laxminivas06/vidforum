"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const faculty_controller_1 = require("./faculty.controller");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/faculty
router.get('/', tenant_middleware_1.tenantMiddleware, faculty_controller_1.facultyController.getFaculty.bind(faculty_controller_1.facultyController));
// GET /api/v1/faculty/:id
router.get('/:id', tenant_middleware_1.tenantMiddleware, faculty_controller_1.facultyController.getFacultyById.bind(faculty_controller_1.facultyController));
exports.default = router;
