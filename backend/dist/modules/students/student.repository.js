"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRepository = exports.StudentRepository = void 0;
const database_1 = require("../../config/database");
class StudentRepository {
    async findStudents(institutionId, filters) {
        let query = `
      SELECT 
        s.id,
        s.admission_number as "admissionNumber",
        s.first_name as "firstName",
        s.last_name as "lastName",
        (s.first_name || ' ' || s.last_name) as name,
        s.date_of_birth as "dateOfBirth",
        s.gender,
        s.status,
        c.name as "className",
        sec.name as "sectionName",
        sah.roll_number as "rollNumber",
        COALESCE(g.full_name, 'N/A') as "guardianName",
        COALESCE(g.phone, 'N/A') as "guardianPhone"
      FROM students s
      LEFT JOIN classes c ON c.id = s.current_class_id
      LEFT JOIN sections sec ON sec.id = s.current_section_id
      LEFT JOIN student_academic_history sah ON sah.student_id = s.id AND sah.effective_to IS NULL
      LEFT JOIN student_guardians sg ON sg.student_id = s.id AND sg.is_primary_contact = true
      LEFT JOIN guardians g ON g.id = sg.guardian_id
      WHERE s.institution_id = $1
    `;
        const params = [institutionId];
        if (filters.status) {
            params.push(filters.status);
            query += ` AND s.status = $${params.length}`;
        }
        if (filters.classId) {
            params.push(filters.classId);
            query += ` AND s.current_class_id = $${params.length}`;
        }
        if (filters.sectionId) {
            params.push(filters.sectionId);
            query += ` AND s.current_section_id = $${params.length}`;
        }
        if (filters.search) {
            params.push(`%${filters.search}%`);
            query += ` AND (s.first_name ILIKE $${params.length} OR s.last_name ILIKE $${params.length} OR s.admission_number ILIKE $${params.length})`;
        }
        query += ' ORDER BY s.admission_number ASC';
        const result = await database_1.db.query(query, params);
        return result.rows;
    }
    async findStudentMasterById(id, institutionId) {
        // 1. Personal & Class info
        const studentRes = await database_1.db.query(`SELECT s.*, c.name as class_name, sec.name as section_name,
              sah.roll_number, ay.name as academic_year_name
       FROM students s
       LEFT JOIN classes c ON c.id = s.current_class_id
       LEFT JOIN sections sec ON sec.id = s.current_section_id
       LEFT JOIN student_academic_history sah ON sah.student_id = s.id AND sah.effective_to IS NULL
       LEFT JOIN academic_years ay ON ay.id = sah.academic_year_id
       WHERE (s.id::text = $1 OR s.admission_number = $1) AND s.institution_id = $2`, [id, institutionId]);
        if (studentRes.rows.length === 0) {
            return null;
        }
        const student = studentRes.rows[0];
        // 2. Guardians
        const guardiansRes = await database_1.db.query(`SELECT g.*, sg.relationship, sg.is_primary_contact
       FROM guardians g
       JOIN student_guardians sg ON sg.guardian_id = g.id
       WHERE sg.student_id = $1`, [student.id]);
        // 3. Academic History
        const historyRes = await database_1.db.query(`SELECT sah.*, c.name as class_name, sec.name as section_name, ay.name as academic_year_name
       FROM student_academic_history sah
       LEFT JOIN classes c ON c.id = sah.class_id
       LEFT JOIN sections sec ON sec.id = sah.section_id
       LEFT JOIN academic_years ay ON ay.id = sah.academic_year_id
       WHERE sah.student_id = $1
       ORDER BY sah.effective_from DESC`, [student.id]);
        // 4. Attendance Summary
        const attRes = await database_1.db.query(`SELECT 
         count(*) filter (where status = 'present') as present_days,
         count(*) as total_days,
         round(100.0 * count(*) filter (where status = 'present') / nullif(count(*), 0), 2) as attendance_percentage
       FROM attendance_records
       WHERE student_id = $1`, [student.id]);
        // 5. Fee Ledger & Invoices
        const feeRes = await database_1.db.query(`SELECT sf.total_amount, sf.balance_due,
              COALESCE(json_agg(json_build_object(
                'id', i.id,
                'invoiceNumber', i.invoice_number,
                'amount', i.total_amount,
                'status', i.status,
                'dueDate', i.due_date
              )) FILTER (WHERE i.id IS NOT NULL), '[]'::json) as invoices
       FROM student_fees sf
       LEFT JOIN invoices i ON i.student_fee_id = sf.id
       WHERE sf.student_id = $1
       GROUP BY sf.id, sf.total_amount, sf.balance_due`, [student.id]);
        return {
            profile: student,
            guardians: guardiansRes.rows,
            academicHistory: historyRes.rows,
            attendance: attRes.rows[0] || { present_days: 0, total_days: 0, attendance_percentage: 100 },
            finance: feeRes.rows[0] || { total_amount: 0, balance_due: 0, invoices: [] },
        };
    }
    async promote(studentId, toClassId, toSectionId, academicYearId, decision, actorId) {
        await database_1.db.query('SELECT promote_student($1, $2, $3, $4, $5, $6)', [studentId, toClassId, toSectionId, academicYearId, decision, actorId]);
    }
}
exports.StudentRepository = StudentRepository;
exports.studentRepository = new StudentRepository();
