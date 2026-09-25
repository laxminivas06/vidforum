"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicsRepository = exports.AcademicsRepository = void 0;
const database_1 = require("../../config/database");
class AcademicsRepository {
    async getClassesByInstitution(institutionId) {
        const res = await database_1.db.query(`SELECT c.id, c.name, c.sequence_order, ay.name as academic_year
       FROM classes c
       JOIN academic_years ay ON ay.id = c.academic_year_id
       WHERE c.institution_id = $1
       ORDER BY c.sequence_order ASC`, [institutionId]);
        return res.rows;
    }
    async getSectionsByClass(classId) {
        const res = await database_1.db.query(`SELECT s.id, s.name, s.capacity, 
              COALESCE(p.full_name, 'Unassigned') as "classTeacher",
              (SELECT count(*) FROM students WHERE current_section_id = s.id AND status = 'active') as enrolled
       FROM sections s
       LEFT JOIN staff st ON st.id = s.class_teacher_staff_id
       LEFT JOIN profiles p ON p.id = st.profile_id
       WHERE s.class_id = $1
       ORDER BY s.name ASC`, [classId]);
        return res.rows;
    }
    async getSubjectsByClass(classId) {
        const res = await database_1.db.query(`SELECT sub.id, sub.name, sub.code, sub.is_elective,
              cs.is_mandatory
       FROM class_subjects cs
       JOIN subjects sub ON sub.id = cs.subject_id
       WHERE cs.class_id = $1
       ORDER BY sub.name ASC`, [classId]);
        return res.rows;
    }
    async getHierarchy(institutionId) {
        const [years, depts, classes, subjects] = await Promise.all([
            database_1.db.query('SELECT * FROM academic_years WHERE institution_id = $1 ORDER BY start_date DESC', [institutionId]),
            database_1.db.query('SELECT * FROM departments WHERE institution_id = $1 ORDER BY name ASC', [institutionId]),
            database_1.db.query('SELECT * FROM classes WHERE institution_id = $1 ORDER BY sequence_order ASC', [institutionId]),
            database_1.db.query('SELECT * FROM subjects WHERE institution_id = $1 ORDER BY name ASC', [institutionId]),
        ]);
        return {
            academicYears: years.rows,
            departments: depts.rows,
            classes: classes.rows,
            subjects: subjects.rows,
        };
    }
    async listClasses(institutionId) {
        const res = await database_1.db.query(`SELECT c.*, d.name as department_name, ay.name as academic_year_name
       FROM classes c
       JOIN departments d ON d.id = c.department_id
       JOIN academic_years ay ON ay.id = c.academic_year_id
       WHERE c.institution_id = $1
       ORDER BY c.sequence_order ASC`, [institutionId]);
        return res.rows;
    }
    async listSubjects(institutionId) {
        const res = await database_1.db.query('SELECT * FROM subjects WHERE institution_id = $1 ORDER BY name ASC', [institutionId]);
        return res.rows;
    }
}
exports.AcademicsRepository = AcademicsRepository;
exports.academicsRepository = new AcademicsRepository();
