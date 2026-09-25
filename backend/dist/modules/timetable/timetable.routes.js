"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const api_response_1 = require("../../utils/api-response");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// GET /api/v1/timetable
router.get('/', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const instId = req.institutionId;
        const { sectionId } = req.query;
        let query = `
      SELECT 
        te.id,
        te.day_of_week as "dayOfWeek",
        p.name as "periodName",
        p.start_time as "startTime",
        p.end_time as "endTime",
        sub.name as "subjectName",
        sub.code as "subjectCode",
        prof.full_name as "facultyName",
        r.name as "roomName"
      FROM timetable_entries te
      JOIN timetables t ON t.id = te.timetable_id
      JOIN periods p ON p.id = te.period_id
      JOIN subjects sub ON sub.id = te.subject_id
      LEFT JOIN staff st ON st.id = te.faculty_id
      LEFT JOIN profiles prof ON prof.id = st.profile_id
      LEFT JOIN rooms r ON r.id = te.room_id
      WHERE t.institution_id = $1
    `;
        const params = [instId];
        if (sectionId) {
            params.push(sectionId);
            query += ` AND t.section_id = $${params.length}`;
        }
        query += ' ORDER BY te.day_of_week, p.start_time';
        const result = await database_1.db.query(query, params);
        (0, api_response_1.sendSuccess)(res, result.rows);
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
// POST /api/v1/timetable/check-conflict
router.post('/check-conflict', tenant_middleware_1.tenantMiddleware, async (req, res) => {
    try {
        const { facultyId, roomId, dayOfWeek, startTime, endTime } = req.body;
        const instId = req.institutionId;
        const conflicts = [];
        // 1. Check Faculty Conflict
        if (facultyId) {
            const facConflict = await database_1.db.query(`SELECT te.id, p.name as period_name, sub.name as subject_name
         FROM timetable_entries te
         JOIN periods p ON p.id = te.period_id
         JOIN subjects sub ON sub.id = te.subject_id
         JOIN timetables t ON t.id = te.timetable_id
         WHERE t.institution_id = $1 AND te.faculty_id = $2 AND te.day_of_week = $3
           AND ((p.start_time, p.end_time) OVERLAPS ($4::time, $5::time))`, [instId, facultyId, dayOfWeek, startTime, endTime]);
            if (facConflict.rows.length > 0) {
                conflicts.push(`Teacher is already booked for ${facConflict.rows[0].subject_name} during this period`);
            }
        }
        // 2. Check Room Conflict
        if (roomId) {
            const roomConflict = await database_1.db.query(`SELECT te.id, r.name as room_name
         FROM timetable_entries te
         JOIN periods p ON p.id = te.period_id
         JOIN rooms r ON r.id = te.room_id
         JOIN timetables t ON t.id = te.timetable_id
         WHERE t.institution_id = $1 AND te.room_id = $2 AND te.day_of_week = $3
           AND ((p.start_time, p.end_time) OVERLAPS ($4::time, $5::time))`, [instId, roomId, dayOfWeek, startTime, endTime]);
            if (roomConflict.rows.length > 0) {
                conflicts.push(`Room is already allocated during this period`);
            }
        }
        (0, api_response_1.sendSuccess)(res, {
            hasConflict: conflicts.length > 0,
            conflicts,
        });
    }
    catch (error) {
        (0, api_response_1.sendError)(res, error.message, 500);
    }
});
exports.default = router;
