"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const institution_routes_1 = __importDefault(require("../modules/institutions/institution.routes"));
const academics_routes_1 = __importDefault(require("../modules/academics/academics.routes"));
const admissions_routes_1 = __importDefault(require("../modules/admissions/admissions.routes"));
const student_routes_1 = __importDefault(require("../modules/students/student.routes"));
const faculty_routes_1 = __importDefault(require("../modules/faculty/faculty.routes"));
const attendance_routes_1 = __importDefault(require("../modules/attendance/attendance.routes"));
const examinations_routes_1 = __importDefault(require("../modules/examinations/examinations.routes"));
const finance_routes_1 = __importDefault(require("../modules/finance/finance.routes"));
const documents_routes_1 = __importDefault(require("../modules/documents/documents.routes"));
const hrms_routes_1 = __importDefault(require("../modules/hrms/hrms.routes"));
const timetable_routes_1 = __importDefault(require("../modules/timetable/timetable.routes"));
const ai_yantra_routes_1 = __importDefault(require("../modules/ai-yantra/ai-yantra.routes"));
const optional_modules_routes_1 = __importDefault(require("../modules/optional-modules/optional-modules.routes"));
const database_1 = require("../config/database");
const api_response_1 = require("../utils/api-response");
const router = (0, express_1.Router)();
// Health Check
router.get('/health', async (_req, res) => {
    const dbOk = await database_1.db.testConnection();
    (0, api_response_1.sendSuccess)(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: {
            provider: 'Supabase PostgreSQL',
            connected: dbOk,
        },
        services: {
            auth: 'active',
            multitenancy: 'active',
            rbac: 'active',
        },
    });
});
// Domain Routes
router.use('/auth', auth_routes_1.default);
router.use('/institutions', institution_routes_1.default);
router.use('/academics', academics_routes_1.default);
router.use('/admissions', admissions_routes_1.default);
router.use('/students', student_routes_1.default);
router.use('/faculty', faculty_routes_1.default);
router.use('/attendance', attendance_routes_1.default);
router.use('/examinations', examinations_routes_1.default);
router.use('/finance', finance_routes_1.default);
router.use('/documents', documents_routes_1.default);
router.use('/hrms', hrms_routes_1.default);
router.use('/timetable', timetable_routes_1.default);
router.use('/ai-yantra', ai_yantra_routes_1.default);
router.use('/optional-modules', optional_modules_routes_1.default);
exports.default = router;
