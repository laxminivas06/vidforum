import { db } from '../../config/database';

export class AcademicsRepository {
  async getClassesByInstitution(institutionId: string) {
    const res = await db.query(
      `SELECT c.id, c.name, c.sequence_order, ay.name as academic_year
       FROM classes c
       JOIN academic_years ay ON ay.id = c.academic_year_id
       WHERE c.institution_id = $1
       ORDER BY c.sequence_order ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async getSectionsByClass(classId: string) {
    const res = await db.query(
      `SELECT s.id, s.name, s.capacity, 
              COALESCE(p.full_name, 'Unassigned') as "classTeacher",
              (SELECT count(*) FROM students WHERE current_section_id = s.id AND status = 'active') as enrolled
       FROM sections s
       LEFT JOIN staff st ON st.id = s.class_teacher_staff_id
       LEFT JOIN profiles p ON p.id = st.profile_id
       WHERE s.class_id = $1
       ORDER BY s.name ASC`,
      [classId]
    );
    return res.rows;
  }

  async getSubjectsByClass(classId: string) {
    const res = await db.query(
      `SELECT sub.id, sub.name, sub.code, sub.is_elective,
              cs.is_mandatory
       FROM class_subjects cs
       JOIN subjects sub ON sub.id = cs.subject_id
       WHERE cs.class_id = $1
       ORDER BY sub.name ASC`,
      [classId]
    );
    return res.rows;
  }

  async getHierarchy(institutionId: string) {
    const [years, depts, classes, subjects] = await Promise.all([
      db.query('SELECT * FROM academic_years WHERE institution_id = $1 ORDER BY start_date DESC', [institutionId]),
      db.query('SELECT * FROM departments WHERE institution_id = $1 ORDER BY name ASC', [institutionId]),
      db.query('SELECT * FROM classes WHERE institution_id = $1 ORDER BY sequence_order ASC', [institutionId]),
      db.query('SELECT * FROM subjects WHERE institution_id = $1 ORDER BY name ASC', [institutionId]),
    ]);

    return {
      academicYears: years.rows,
      departments: depts.rows,
      classes: classes.rows,
      subjects: subjects.rows,
    };
  }

  async listClasses(institutionId: string) {
    const res = await db.query(
      `SELECT c.*, d.name as department_name, ay.name as academic_year_name
       FROM classes c
       JOIN departments d ON d.id = c.department_id
       JOIN academic_years ay ON ay.id = c.academic_year_id
       WHERE c.institution_id = $1
       ORDER BY c.sequence_order ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async listAcademicYears(institutionId: string) {
    const res = await db.query(
      'SELECT * FROM academic_years WHERE institution_id = $1 ORDER BY start_date DESC',
      [institutionId]
    );
    return res.rows;
  }

  async createAcademicYear(institutionId: string, data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) {
    if (data.isCurrent) {
      await db.query('UPDATE academic_years SET is_current = false WHERE institution_id = $1', [institutionId]);
    }
    const res = await db.query(
      `INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (institution_id, name) DO UPDATE SET start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, is_current = EXCLUDED.is_current
       RETURNING *`,
      [institutionId, data.name, data.startDate, data.endDate, data.isCurrent ?? false]
    );
    return res.rows[0];
  }

  async listDepartments(institutionId: string, departmentType?: string) {
    if (departmentType) {
      const res = await db.query(
        'SELECT * FROM departments WHERE institution_id = $1 AND department_type = $2 ORDER BY name ASC',
        [institutionId, departmentType]
      );
      return res.rows;
    }
    const res = await db.query(
      'SELECT * FROM departments WHERE institution_id = $1 ORDER BY name ASC',
      [institutionId]
    );
    return res.rows;
  }

  async createDepartment(institutionId: string, data: { name: string; code: string; departmentType?: string }) {
    const res = await db.query(
      `INSERT INTO departments (institution_id, name, code, department_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name, department_type = EXCLUDED.department_type
       RETURNING *`,
      [institutionId, data.name, data.code, data.departmentType || 'academic']
    );
    return res.rows[0];
  }

  async createClass(institutionId: string, data: { name: string; academicYearId: string; departmentId: string; sequenceOrder?: number }) {
    const res = await db.query(
      `INSERT INTO classes (institution_id, name, academic_year_id, department_id, sequence_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (institution_id, academic_year_id, department_id, name) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
       RETURNING *`,
      [institutionId, data.name, data.academicYearId, data.departmentId, data.sequenceOrder || 1]
    );
    return res.rows[0];
  }

  async createSection(institutionId: string, classId: string, data: { name: string; capacity?: number; classTeacherStaffId?: string }) {
    const res = await db.query(
      `INSERT INTO sections (institution_id, class_id, name, capacity, class_teacher_staff_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (class_id, name) DO UPDATE SET capacity = EXCLUDED.capacity, class_teacher_staff_id = EXCLUDED.class_teacher_staff_id
       RETURNING *`,
      [institutionId, classId, data.name, data.capacity || 40, data.classTeacherStaffId || null]
    );
    return res.rows[0];
  }

  async createSubject(institutionId: string, data: { name: string; code: string; isElective?: boolean }) {
    const res = await db.query(
      `INSERT INTO subjects (institution_id, name, code, is_elective)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name, is_elective = EXCLUDED.is_elective
       RETURNING *`,
      [institutionId, data.name, data.code, data.isElective ?? false]
    );
    return res.rows[0];
  }

  async linkSubjectToClass(classId: string, subjectId: string, isMandatory = true) {
    const res = await db.query(
      `INSERT INTO class_subjects (class_id, subject_id, is_mandatory)
       VALUES ($1, $2, $3)
       ON CONFLICT (class_id, subject_id) DO UPDATE SET is_mandatory = EXCLUDED.is_mandatory
       RETURNING *`,
      [classId, subjectId, isMandatory]
    );
    return res.rows[0];
  }

  async listAllocations(institutionId: string) {
    const res = await db.query(
      `SELECT fa.id, fa.staff_id as "staffId", fa.section_id as "sectionId", fa.subject_id as "subjectId", fa.academic_year_id as "academicYearId",
              p.full_name as "teacherName", st.employee_code as "employeeCode",
              c.id as "classId", c.name as "className", sec.name as "sectionName", sub.name as "subjectName"
       FROM faculty_assignments fa
       JOIN staff st ON st.id = fa.staff_id
       JOIN profiles p ON p.id = st.profile_id
       JOIN sections sec ON sec.id = fa.section_id
       JOIN classes c ON c.id = sec.class_id
       JOIN subjects sub ON sub.id = fa.subject_id
       WHERE fa.institution_id = $1 AND (fa.effective_to IS NULL OR fa.effective_to >= CURRENT_DATE)
       ORDER BY c.sequence_order, sec.name, sub.name`,
      [institutionId]
    );
    return res.rows;
  }

  async createAllocation(institutionId: string, data: { staffId: string; sectionId: string; subjectId: string; academicYearId: string }) {
    const res = await db.query(
      `INSERT INTO faculty_assignments (institution_id, staff_id, section_id, subject_id, academic_year_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (staff_id, subject_id, section_id, academic_year_id) WHERE effective_to IS NULL
       DO UPDATE SET effective_to = NULL
       RETURNING *`,
      [institutionId, data.staffId, data.sectionId, data.subjectId, data.academicYearId]
    );
    return res.rows[0];
  }
}

export const academicsRepository = new AcademicsRepository();
