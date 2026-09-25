"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const api_response_1 = require("../../utils/api-response");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/documents
router.get('/', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query(`SELECT d.*, dt.name as document_type_name
       FROM documents d
       JOIN document_types dt ON dt.id = d.document_type_id
       WHERE d.institution_id = $1
       ORDER BY d.created_at DESC`, [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/documents/types
router.get('/types', async (req, res) => {
    try {
        const result = await database_1.db.query('SELECT * FROM document_types ORDER BY name ASC');
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// POST /api/v1/documents/bonafide
router.post('/bonafide', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const { studentId, purpose = 'General Purpose' } = req.body;
        const instId = req.institutionId;
        const sRes = await database_1.db.query(`SELECT s.*, c.name as class_name, sec.name as section_name, i.name as institution_name
       FROM students s
       JOIN institutions i ON i.id = s.institution_id
       LEFT JOIN classes c ON c.id = s.current_class_id
       LEFT JOIN sections sec ON sec.id = s.current_section_id
       WHERE s.id = $1 AND s.institution_id = $2`, [studentId, instId]);
        if (sRes.rows.length === 0) {
            (0, api_response_1.sendError)(res, 'Student not found', 404);
            return;
        }
        const student = sRes.rows[0];
        const certificateId = `BONA-${Date.now().toString().slice(-6)}`;
        const verificationUrl = `https://verify.vid.edu/cert/${certificateId}`;
        (0, api_response_1.sendSuccess)(res, {
            certificateId,
            studentName: `${student.first_name} ${student.last_name}`,
            admissionNumber: student.admission_number,
            className: student.class_name,
            institutionName: student.institution_name,
            purpose,
            issuedDate: new Date().toISOString().split('T')[0],
            verificationUrl,
            qrPayload: JSON.stringify({
                cert: certificateId,
                student: student.admission_number,
                inst: student.institution_id,
            }),
        }, 'Bonafide certificate generated with QR verification');
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
exports.default = router;
