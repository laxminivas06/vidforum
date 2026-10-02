import { db } from '../../config/database';

export class FacultyRepository {
  async findFacultyByInstitution(institutionId: string) {
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
    const res = await db.query(query, [institutionId]);
    return res.rows;
  }

  async findFacultyById(id: string, institutionId: string) {
    const res = await db.query(
      `SELECT st.*, p.full_name, p.email, p.phone, d.name as department_name, des.name as designation_name
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE (st.id = $1 OR st.employee_code = $1) AND st.institution_id = $2`,
      [id, institutionId]
    );
    return res.rows[0] || null;
  }

  async findFacultyByProfileId(profileId: string, institutionId: string) {
    const res = await db.query(
      `SELECT st.*, p.full_name, p.email, p.phone, d.name as department_name, des.name as designation_name
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE st.profile_id = $1 AND st.institution_id = $2`,
      [profileId, institutionId]
    );
    return res.rows[0] || null;
  }

  async findAssignedClasses(staffId: string) {
    const res = await db.query(
      `SELECT DISTINCT 
         c.id as class_id, 
         c.name as class_name, 
         sec.id as section_id, 
         sec.name as section_name,
         ay.name as academic_year
       FROM faculty_assignments fa
       JOIN sections sec ON sec.id = fa.section_id
       JOIN classes c ON c.id = sec.class_id
       JOIN academic_years ay ON ay.id = fa.academic_year_id
       WHERE fa.staff_id = $1 AND (fa.effective_to IS NULL OR fa.effective_to >= CURRENT_DATE)
       ORDER BY c.name, sec.name`,
      [staffId]
    );
    return res.rows;
  }

  async findAssignedSubjects(staffId: string) {
    const res = await db.query(
      `SELECT DISTINCT 
         sub.id as subject_id, 
         sub.name as subject_name, 
         sub.code as subject_code,
         sec.name as section_name,
         c.name as class_name
       FROM faculty_assignments fa
       JOIN subjects sub ON sub.id = fa.subject_id
       JOIN sections sec ON sec.id = fa.section_id
       JOIN classes c ON c.id = sec.class_id
       WHERE fa.staff_id = $1 AND (fa.effective_to IS NULL OR fa.effective_to >= CURRENT_DATE)
       ORDER BY sub.name`,
      [staffId]
    );
    return res.rows;
  }

  async findSectionStudents(sectionId: string, institutionId: string) {
    const res = await db.query(
      `SELECT 
         s.id,
         s.admission_number as "admissionNumber",
         s.roll_number as "rollNumber",
         s.first_name as "firstName",
         s.last_name as "lastName",
         (s.first_name || ' ' || s.last_name) as name,
         s.gender,
         s.status,
         c.name as "className",
         sec.name as "sectionName"
       FROM students s
       JOIN classes c ON c.id = s.current_class_id
       JOIN sections sec ON sec.id = s.current_section_id
       WHERE s.current_section_id = $1 AND s.institution_id = $2
       ORDER BY s.roll_number ASC, s.admission_number ASC`,
      [sectionId, institutionId]
    );
    return res.rows;
  }
}

export const facultyRepository = new FacultyRepository();
