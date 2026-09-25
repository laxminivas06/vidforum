"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facultyRepository = exports.FacultyRepository = void 0;
const database_1 = require("../../config/database");
class FacultyRepository {
    async findFacultyByInstitution(institutionId) {
        const query = `
      SELECT 
        st.id,
        st.employee_code as "employeeCode",
        p.full_name as name,
        p.email,
        p.phone,
        st.employment_status as status,
        d.name as department,
        des.name as designation,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'grade', c.name,
            'section', sec.name,
            'subject', sub.name,
            'room', ('Block ' || chr(65 + (ascii(substr(sec.name, length(sec.name), 1)) % 3)) || ' - Room 20' || (ascii(substr(sec.name, length(sec.name), 1)) - 64)),
            'schedule', 'Mon/Wed/Fri 08:30 - 09:30'
          ))
          FROM faculty_assignments fa
          JOIN classes c ON c.id = (SELECT class_id FROM sections WHERE id = fa.section_id)
          JOIN sections sec ON sec.id = fa.section_id
          JOIN subjects sub ON sub.id = fa.subject_id
          WHERE fa.staff_id = st.id AND fa.effective_to IS NULL),
          '[]'::json
        ) as "assignedClasses"
      FROM staff st
      JOIN profiles p ON p.id = st.profile_id
      LEFT JOIN departments d ON d.id = st.department_id
      LEFT JOIN designations des ON des.id = st.designation_id
      WHERE st.institution_id = $1 AND st.is_teaching_staff = true
      ORDER BY st.employee_code ASC
    `;
        const res = await database_1.db.query(query, [institutionId]);
        return res.rows;
    }
    async findFacultyById(id, institutionId) {
        const res = await database_1.db.query(`SELECT st.*, p.full_name, p.email, p.phone, d.name as department_name, des.name as designation_name
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE (st.id = $1 OR st.employee_code = $1) AND st.institution_id = $2`, [id, institutionId]);
        return res.rows[0] || null;
    }
}
exports.FacultyRepository = FacultyRepository;
exports.facultyRepository = new FacultyRepository();
