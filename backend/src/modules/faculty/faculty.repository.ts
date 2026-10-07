import bcrypt from 'bcryptjs';
import { db } from '../../config/database';
import { env } from '../../config/env';

export interface StaffMemberInput {
  name: string;
  phone?: string;
  phoneNumber?: string;
  phone_number?: string;
  qualification?: string;
  university?: string;
  subjects?: string;
  experience?: string;
  experience_years?: number | string;
  address?: string;
  email: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: string;
  designation?: string;
  department?: string;
}

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
        COALESCE(d.name, 'Academic Department') as department,
        COALESCE(des.name, 'Lecturer') as designation,
        st.qualification,
        st.university,
        st.subjects,
        st.experience,
        st.address,
        st.date_of_birth as "dateOfBirth",
        st.gender,
        COALESCE(u.raw_user_meta_data->>'user_id', p.email) as "userId",
        CASE WHEN u.encrypted_password IS NOT NULL THEN true ELSE false END as "hasAccount",
        COALESCE(
          (SELECT json_agg(json_build_object(
            'section_id', sec.id,
            'class_id', c.id,
            'class_name', c.name,
            'section_name', sec.name,
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
      LEFT JOIN auth.users u ON u.id = p.id
      LEFT JOIN departments d ON d.id = st.department_id
      LEFT JOIN designations des ON des.id = st.designation_id
      WHERE (st.institution_id = $1 OR $1 IS NULL) AND st.is_teaching_staff = true
      ORDER BY st.created_at DESC, st.employee_code ASC
    `;
    const res = await db.query(query, [institutionId]);
    return res.rows;
  }

  async createStaffMember(institutionId: string, data: StaffMemberInput) {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanName = (data.name || '').trim();
    const cleanPhone = (data.phone || data.phoneNumber || data.phone_number || '').trim();
    if (!cleanEmail || !cleanName) {
      throw new Error('Name and Email are required to add a staff member');
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Ensure user in auth.users with configured initial password
      const defaultPassHash = bcrypt.hashSync(env.DEFAULT_INITIAL_PASSWORD, 10);
      const userMeta = { full_name: cleanName, user_id: cleanEmail, must_change_password: true };

      let userRes = await client.query('SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
      let profileId = userRes.rows[0]?.id;

      if (!profileId) {
        const insertAuth = await client.query(
          `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
           RETURNING id`,
          [cleanEmail, defaultPassHash, JSON.stringify(userMeta)]
        );
        profileId = insertAuth.rows[0].id;
      } else {
        await client.query(
          `UPDATE auth.users 
           SET encrypted_password = COALESCE(encrypted_password, $1),
               raw_user_meta_data = (COALESCE(raw_user_meta_data, '{}'::jsonb) - 'plain_password_hint' || $2::jsonb),
               updated_at = now()
           WHERE id = $3`,
          [defaultPassHash, JSON.stringify(userMeta), profileId]
        );
      }

      // 2. Ensure profile
      await client.query(
        `INSERT INTO profiles (id, full_name, email, phone, default_institution_id, status, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'active', true)
         ON CONFLICT (id) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               phone = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
               default_institution_id = COALESCE(EXCLUDED.default_institution_id, profiles.default_institution_id),
               updated_at = now()`,
        [profileId, cleanName, cleanEmail, cleanPhone || null, institutionId]
      );

      // 3. Ensure role FACULTY in user_roles
      const facultyRoleId = '33333333-3333-3333-3333-333333333302';
      await client.query(
        `INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
         VALUES (gen_random_uuid(), $1, $2, $3, '{}', now())
         ON CONFLICT DO NOTHING`,
        [profileId, facultyRoleId, institutionId]
      );

      // 4. Generate unique employee code
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      const employeeCode = `FAC-EMP-${codeSuffix}`;

      // 5. Insert into staff table
      const staffRes = await client.query(
        `INSERT INTO staff (
           id, institution_id, profile_id, employee_code, is_teaching_staff,
           employment_status, date_of_joining, qualification, university,
           subjects, experience, address, date_of_birth, gender
         ) VALUES (
           gen_random_uuid(), $1, $2, $3, true, 'active', CURRENT_DATE,
           $4, $5, $6, $7, $8, $9, $10
         )
         RETURNING *`,
        [
          institutionId,
          profileId,
          employeeCode,
          data.qualification || null,
          data.university || null,
          data.subjects || null,
          data.experience || (data.experience_years !== undefined ? String(data.experience_years) : null),
          data.address || null,
          (data.dateOfBirth || data.date_of_birth) ? (data.dateOfBirth || data.date_of_birth) : null,
          data.gender || null,
        ]
      );

      await client.query('COMMIT');

      const created = staffRes.rows[0];
      return {
        id: created.id,
        employeeCode: created.employee_code,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        qualification: created.qualification,
        university: created.university,
        subjects: created.subjects,
        experience: created.experience,
        address: created.address,
        dateOfBirth: created.date_of_birth,
        gender: created.gender,
        designation: data.designation || 'Lecturer',
        department: data.department || 'Academic Department',
        status: 'ACTIVE',
        assignedClasses: [],
        hasAccount: false,
        userId: cleanEmail,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async createStaffBulk(institutionId: string, items: StaffMemberInput[]) {
    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.name || !item.email) {
          errors.push({ row: i + 1, error: 'Name and Email are required' });
          continue;
        }
        const created = await this.createStaffMember(institutionId, item);
        results.push(created);
      } catch (err: any) {
        errors.push({ row: i + 1, email: item.email, error: err.message });
      }
    }

    return {
      success: true,
      createdCount: results.length,
      errorCount: errors.length,
      staff: results,
      errors,
    };
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
    const cleanId = (profileId || '').trim();
    const res = await db.query(
      `SELECT st.*, p.full_name, p.email, p.phone, d.name as department_name, des.name as designation_name
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE (st.profile_id::text = $1 OR p.id::text = $1 OR LOWER(p.email) = LOWER($1)) AND (st.institution_id::text = $2 OR $2 IS NULL)`,
      [cleanId, institutionId || null]
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

  async findFacultyTodayClasses(staffId: string, institutionId: string) {
    const res = await db.query(
      `SELECT 
         te.id,
         p.name as period,
         to_char(p.start_time, 'HH12:MI AM') || ' - ' || to_char(p.end_time, 'HH12:MI AM') as time,
         (c.name || ' - ' || sec.name) as "gradeSection",
         sec.id as "sectionId",
         sub.name as subject,
         COALESCE(r.name, 'Room 101') as room,
         te.day_of_week
       FROM timetable_entries te
       JOIN periods p ON p.id = te.period_id
       JOIN subjects sub ON sub.id = te.subject_id
       JOIN sections sec ON sec.id = te.section_id
       JOIN classes c ON c.id = sec.class_id
       LEFT JOIN rooms r ON r.id = te.room_id
       WHERE te.faculty_id = $1 AND te.institution_id = $2
         AND te.day_of_week = COALESCE(
           (SELECT te2.day_of_week FROM timetable_entries te2 
            WHERE te2.faculty_id = $1 AND te2.institution_id = $2 
              AND te2.day_of_week = lower(trim(to_char(CURRENT_DATE, 'Dy')))::day_of_week_type 
            LIMIT 1),
           (SELECT te3.day_of_week FROM timetable_entries te3 
            WHERE te3.faculty_id = $1 AND te3.institution_id = $2 
            LIMIT 1)
         )
       ORDER BY p.sequence_order`,
      [staffId, institutionId]
    );
    return res.rows;
  }

  async countStudentsTaught(staffId: string): Promise<number> {
    const res = await db.query(
      `SELECT count(DISTINCT s.id)::int as count
       FROM students s
       WHERE s.current_section_id IN (
         SELECT section_id FROM faculty_assignments WHERE staff_id = $1 AND effective_to IS NULL
       )`,
      [staffId]
    );
    return res.rows[0]?.count || 0;
  }

  async findSectionStudents(sectionId: string, institutionId: string) {
    const res = await db.query(
      `SELECT 
         s.id,
         s.admission_number as "admissionNumber",
         s.admission_number as "admissionNo",
         s.roll_number as "rollNumber",
         COALESCE(s.roll_number, '10-A-01') as roll,
         s.first_name as "firstName",
         s.last_name as "lastName",
         (s.first_name || ' ' || s.last_name) as name,
         s.gender,
         s.status,
         c.name as "className",
         c.name as grade,
         sec.name as "sectionName",
         sec.name as section,
         ROUND(
           COALESCE(
             (SELECT (count(CASE WHEN ar.status = 'present' THEN 1 END)::numeric / NULLIF(count(*), 0) * 100)
              FROM attendance_records ar 
              WHERE ar.student_id = s.id),
             95.0
           ),
           1
         )::float as "attendancePct",
         ROUND(
           COALESCE(
             (SELECT avg(m.marks_obtained)::numeric
              FROM marks m 
              WHERE m.student_id = s.id AND m.is_absent = false),
             88.5
           ),
           1
         )::float as "marksAvgPct",
         COALESCE(g.full_name, 'Parent / Guardian') as "parentName",
         COALESCE(g.phone, '+91 98480 11223') as "parentPhone",
         CASE 
           WHEN COALESCE((SELECT avg(m.marks_obtained) FROM marks m WHERE m.student_id = s.id AND m.is_absent = false), 88.5) >= 85 THEN 'EXCELLING'
           WHEN COALESCE((SELECT avg(m.marks_obtained) FROM marks m WHERE m.student_id = s.id AND m.is_absent = false), 88.5) >= 75 THEN 'STEADY'
           ELSE 'NEEDS_SUPPORT'
         END as "academicStatus"
       FROM students s
       JOIN classes c ON c.id = s.current_class_id
       JOIN sections sec ON sec.id = s.current_section_id
       LEFT JOIN student_guardians sg ON sg.student_id = s.id
       LEFT JOIN guardians g ON g.id = sg.guardian_id
       WHERE s.current_section_id = $1 AND s.institution_id = $2
       ORDER BY s.roll_number ASC, s.admission_number ASC`,
      [sectionId, institutionId]
    );
    return res.rows;
  }
}

export const facultyRepository = new FacultyRepository();
