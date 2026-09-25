"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const api_response_1 = require("../../utils/api-response");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/attendance/sessions
router.get('/sessions', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const { sectionId, date } = req.query;
        let query = `
      SELECT 
        ases.id,
        ases.session_date as "sessionDate",
        ases.period_number as "periodNumber",
        c.name as "className",
        sec.name as "sectionName",
        sub.name as "subjectName",
        p.full_name as "teacherName",
        (SELECT count(*) FROM attendance_records WHERE session_id = ases.id) as "totalRecorded",
        (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'present') as "totalPresent"
      FROM attendance_sessions ases
      JOIN sections sec ON sec.id = ases.section_id
      JOIN classes c ON c.id = sec.class_id
      LEFT JOIN subjects sub ON sub.id = ases.subject_id
      LEFT JOIN staff st ON st.id = ases.staff_id
      LEFT JOIN profiles p ON p.id = st.profile_id
      WHERE ases.institution_id = $1
    `;
        const params = [instId];
        if (sectionId) {
            params.push(sectionId);
            query += ` AND ases.section_id = $${params.length}`;
        }
        if (date) {
            params.push(date);
            query += ` AND ases.session_date = $${params.length}`;
        }
        query += ' ORDER BY ases.session_date DESC, ases.period_number ASC';
        const result = await database_1.db.query(query, params);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        console.error('Error fetching attendance sessions:', error);
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// POST /api/v1/attendance/sessions/:id/records (Bulk Roll Call)
router.post('/sessions/:id/records', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    const client = await database_1.db.getClient();
    try {
        const { id: sessionId } = req.params;
        const { records } = req.body; // Array of { studentId, status: 'present' | 'absent' | 'late' | 'excused' }
        const instId = req.institutionId;
        if (!Array.isArray(records) || records.length === 0) {
            (0, api_response_1.sendError)(res, 'Array of student attendance records is required', 400);
            return;
        }
        await client.query('BEGIN');
        for (const record of records) {
            await client.query(`INSERT INTO attendance_records (institution_id, session_id, student_id, status, source)
         VALUES ($1, $2, $3, $4, 'manual')
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET status = EXCLUDED.status, updated_at = now()`, [instId, sessionId, record.studentId, record.status.toLowerCase()]);
        }
        await client.query('COMMIT');
        (0, api_response_1.sendSuccess)(res, { count: records.length }, 'Attendance roll-call saved successfully');
    }
    catch (error) {
        await client.query('ROLLBACK');
        (0, api_response_1.sendError)(res, error.message, 500);
    }
    finally {
        client.release();
    }
});
// POST /api/v1/attendance/sessions/:id/finalize
router.post('/sessions/:id/finalize', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const verifiedBy = req.user?.id || '44444444-4444-4444-4444-444444444401';
        await database_1.db.query('SELECT finalize_attendance_session($1, $2)', [id, verifiedBy]);
        (0, api_response_1.sendSuccess)(res, { sessionId: id, isFinal: true }, 'Attendance session finalized and locked');
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// GET /api/v1/attendance/summary
router.get('/summary', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const result = await database_1.db.query(`SELECT 
         count(*) filter (where ar.status = 'present') as present,
         count(*) filter (where ar.status = 'absent') as absent,
         count(*) filter (where ar.status = 'late') as late,
         count(*) as total,
         round(100.0 * count(*) filter (where ar.status = 'present') / nullif(count(*), 0), 1) as percentage
       FROM attendance_records ar
       WHERE ar.institution_id = $1`, [instId]);
        (0, api_response_1.sendSuccess)(res, result.rows[0] || { present: 0, absent: 0, late: 0, total: 0, percentage: 95.0 });
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
exports.default = router;
