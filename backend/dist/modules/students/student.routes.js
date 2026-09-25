"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("./student.controller");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/students
router.get('/', tenant_middleware_1.tenantMiddleware, student_controller_1.studentController.getStudents.bind(student_controller_1.studentController));
// GET /api/v1/students/:id (360° Master Record)
router.get('/:id', tenant_middleware_1.tenantMiddleware, student_controller_1.studentController.getStudentById.bind(student_controller_1.studentController));
// POST /api/v1/students/:id/promote
router.post('/:id/promote', tenant_middleware_1.tenantMiddleware, student_controller_1.studentController.promote.bind(student_controller_1.studentController));
exports.default = router;
