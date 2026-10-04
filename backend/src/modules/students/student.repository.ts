import { db } from '../../config/database';
import { AuditDispatcher } from '../../common/audit-dispatcher';

export interface StudentFilters {
  search?: string;
  classId?: string;
  sectionId?: string;
  gradeId?: string;
  status?: string;
  ageMin?: number;
  ageMax?: number;
}

export class StudentRepository {
  async findStudents(institutionId: string, filters: StudentFilters) {
    let query = `
      SELECT 
        s.id,
        s.admission_number AS "admissionNumber",
        s.first_name AS "firstName",
        s.last_name AS "lastName",
        (s.first_name || ' ' || s.last_name) AS name,
        s.date_of_birth AS "dateOfBirth",
        date_part('year', age(s.date_of_birth)) AS age,
        s.gender,
        s.status::text AS status,
        s.blood_group AS "bloodGroup",
        s.nationality,
        s.photo_url AS "photoUrl",
        s.notes,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        c.id AS "classId",
        c.name AS "className",
        sec.id AS "sectionId",
        sec.name AS "sectionName",
        sah.roll_number AS "rollNumber",
        COALESCE(g.full_name, 'N/A') AS "guardianName",
        COALESCE(g.phone, 'N/A') AS "guardianPhone"
      FROM students s
      LEFT JOIN classes c ON c.id = s.current_class_id
      LEFT JOIN sections sec ON sec.id = s.current_section_id
      LEFT JOIN student_academic_history sah ON sah.student_id = s.id AND sah.effective_to IS NULL
      LEFT JOIN student_guardians sg ON sg.student_id = s.id AND sg.is_primary_contact = true
      LEFT JOIN guardians g ON g.id = sg.guardian_id
      WHERE s.institution_id = $1
    `;

    const params: any[] = [institutionId];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND s.status::text = $${params.length}`;
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
    if (filters.ageMin) {
      params.push(filters.ageMin);
      query += ` AND date_part('year', age(s.date_of_birth)) >= $${params.length}`;
    }
    if (filters.ageMax) {
      params.push(filters.ageMax);
      query += ` AND date_part('year', age(s.date_of_birth)) <= $${params.length}`;
    }

    query += ' ORDER BY s.admission_number ASC';
    const result = await db.query(query, params);
    return result.rows;
  }

  async findStudentMasterById(id: string, institutionId: string) {
    const studentRes = await db.query(
      `SELECT s.*, s.status::text as status_text,
              c.name as class_name, sec.name as section_name,
              sah.roll_number, ay.name as academic_year_name,
              date_part('year', age(s.date_of_birth)) as age
       FROM students s
       LEFT JOIN classes c ON c.id = s.current_class_id
       LEFT JOIN sections sec ON sec.id = s.current_section_id
       LEFT JOIN student_academic_history sah ON sah.student_id = s.id AND sah.effective_to IS NULL
       LEFT JOIN academic_years ay ON ay.id = sah.academic_year_id
       WHERE (s.id::text = $1 OR s.admission_number = $1) AND s.institution_id = $2`,
      [id, institutionId]
    );
    if (studentRes.rows.length === 0) return null;
    const student = studentRes.rows[0];

    const [guardiansRes, historyRes, attRes, feeRes] = await Promise.all([
      db.query(
        `SELECT g.*, sg.relationship, sg.is_primary_contact
         FROM guardians g
         JOIN student_guardians sg ON sg.guardian_id = g.id
         WHERE sg.student_id = $1`,
        [student.id]
      ),
      db.query(
        `SELECT sah.*, c.name as class_name, sec.name as section_name, ay.name as academic_year_name
         FROM student_academic_history sah
         LEFT JOIN classes c ON c.id = sah.class_id
         LEFT JOIN sections sec ON sec.id = sah.section_id
         LEFT JOIN academic_years ay ON ay.id = sah.academic_year_id
         WHERE sah.student_id = $1
         ORDER BY sah.effective_from DESC`,
        [student.id]
      ),
      db.query(
        `SELECT 
           count(*) FILTER (WHERE status = 'present') AS present_days,
           count(*) AS total_days,
           round(100.0 * count(*) FILTER (WHERE status = 'present') / nullif(count(*), 0), 2) AS attendance_percentage
         FROM attendance_records WHERE student_id = $1`,
        [student.id]
      ),
      db.query(
        `SELECT sf.total_amount, sf.balance_due FROM student_fees sf WHERE sf.student_id = $1 LIMIT 1`,
        [student.id]
      ),
    ]);

    return {
      profile: { ...student, status: student.status_text },
      guardians: guardiansRes.rows,
      academicHistory: historyRes.rows,
      attendance: attRes.rows[0] || { present_days: 0, total_days: 0, attendance_percentage: 100 },
      finance: feeRes.rows[0] || { total_amount: 0, balance_due: 0 },
    };
  }

  async createStudent(institutionId: string, data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    classId: string;
    sectionId: string;
    academicYearId: string;
    rollNumber?: string;
    bloodGroup?: string;
    nationality?: string;
    motherTongue?: string;
    religion?: string;
    previousSchool?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    notes?: string;
    admissionNumber?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianRelationship?: string;
    actorId?: string;
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Capacity check
      const capRes = await client.query(
        `SELECT capacity, COUNT(s.id)::int AS enrolled
         FROM classes c
         LEFT JOIN students s ON s.current_class_id = c.id AND s.status::text = 'active'
         WHERE c.id = $1
         GROUP BY c.id, c.capacity`,
        [data.classId]
      );
      if (capRes.rows.length > 0 && capRes.rows[0].enrolled >= capRes.rows[0].capacity) {
        throw new Error(`Class is at capacity (${capRes.rows[0].enrolled}/${capRes.rows[0].capacity}). Admin override required.`);
      }

      // Generate admission number if not provided (collision-safe)
      let admNum = data.admissionNumber;
      if (!admNum) {
        const year = new Date().getFullYear();
        for (let attempt = 0; attempt < 20; attempt++) {
          const seqRes = await client.query(`SELECT nextval('admission_number_seq') AS seq`);
          const candidate = `SIA-${year}-${String(seqRes.rows[0].seq).padStart(4, '0')}`;
          const existing = await client.query(
            `SELECT 1 FROM students WHERE institution_id = $1 AND admission_number = $2`,
            [institutionId, candidate]
          );
          if (existing.rows.length === 0) {
            admNum = candidate;
            break;
          }
        }
        if (!admNum) {
          admNum = `SIA-${year}-${Date.now().toString().slice(-4)}`;
        }
      }

      // Insert student
      const sRes = await client.query(
        `INSERT INTO students (
           institution_id, admission_number, first_name, last_name,
           date_of_birth, gender, current_class_id, current_section_id,
           blood_group, nationality, mother_tongue, religion,
           previous_school, address_line1, city, state, pincode,
           emergency_contact, emergency_phone, notes, status
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'active'
         ) RETURNING *`,
        [
          institutionId, admNum,
          data.firstName, data.lastName,
          data.dateOfBirth, data.gender,
          data.classId, data.sectionId,
          data.bloodGroup || null, data.nationality || 'Indian',
          data.motherTongue || null, data.religion || null,
          data.previousSchool || null, data.addressLine1 || null,
          data.city || null, data.state || null, data.pincode || null,
          data.emergencyContact || null, data.emergencyPhone || null,
          data.notes || null,
        ]
      );
      const student = sRes.rows[0];

      // Academic history
      await client.query(
        `INSERT INTO student_academic_history (institution_id, student_id, academic_year_id, class_id, section_id, roll_number)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [institutionId, student.id, data.academicYearId, data.classId, data.sectionId, data.rollNumber || null]
      );

      // Guardian
      if (data.guardianName) {
        const gRes = await client.query(
          `INSERT INTO guardians (institution_id, full_name, phone, email) VALUES ($1,$2,$3,$4) RETURNING id`,
          [institutionId, data.guardianName, data.guardianPhone || null, data.guardianEmail || null]
        );
        await client.query(
          `INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary_contact)
           VALUES ($1,$2,$3,true) ON CONFLICT DO NOTHING`,
          [student.id, gRes.rows[0].id, data.guardianRelationship || 'Parent']
        );
      }

      await client.query('COMMIT');

      await AuditDispatcher.dispatch({
        actorId: data.actorId || '00000000-0000-0000-0000-000000000001',
        action: 'students.student.created',
        resource: 'students',
        resourceId: student.id,
        institutionId,
        newValue: { admissionNumber: admNum, classId: data.classId },
      });

      return student;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStudent(id: string, institutionId: string, data: Partial<{
    firstName: string; lastName: string; dateOfBirth: string; gender: string;
    bloodGroup: string; nationality: string; motherTongue: string; religion: string;
    previousSchool: string; addressLine1: string; city: string; state: string;
    pincode: string; emergencyContact: string; emergencyPhone: string; notes: string;
    status: string;
  }>, actorId?: string) {
    const fields: string[] = [];
    const params: any[] = [];

    const map: Record<string, string> = {
      firstName: 'first_name', lastName: 'last_name', dateOfBirth: 'date_of_birth',
      gender: 'gender', bloodGroup: 'blood_group', nationality: 'nationality',
      motherTongue: 'mother_tongue', religion: 'religion', previousSchool: 'previous_school',
      addressLine1: 'address_line1', city: 'city', state: 'state', pincode: 'pincode',
      emergencyContact: 'emergency_contact', emergencyPhone: 'emergency_phone',
      notes: 'notes', status: 'status',
    };

    for (const [k, col] of Object.entries(map)) {
      if ((data as any)[k] !== undefined) {
        params.push((data as any)[k]);
        fields.push(`${col} = $${params.length}`);
      }
    }
    params.push(new Date().toISOString());
    fields.push(`updated_at = $${params.length}`);
    params.push(id); params.push(institutionId);

    const res = await db.query(
      `UPDATE students SET ${fields.join(', ')} WHERE id = $${params.length - 1} AND institution_id = $${params.length} RETURNING *`,
      params
    );
    if (res.rows.length === 0) throw new Error('Student not found');

    await AuditDispatcher.dispatch({
      actorId: actorId || '00000000-0000-0000-0000-000000000001',
      action: 'students.student.updated',
      resource: 'students', resourceId: id, institutionId,
      newValue: data,
    });
    return res.rows[0];
  }

  async promote(studentId: string, toClassId: string, toSectionId: string, academicYearId: string, decision: string, actorId: string) {
    await db.query(
      'SELECT promote_student($1, $2, $3, $4, $5, $6)',
      [studentId, toClassId, toSectionId, academicYearId, decision, actorId]
    );
  }

  async countStudents(institutionId: string): Promise<number> {
    const res = await db.query('SELECT count(*) FROM students WHERE institution_id = $1', [institutionId]);
    return parseInt(res.rows[0].count, 10);
  }

  async getClassEnrollmentCounts(institutionId: string) {
    const res = await db.query(
      `SELECT * FROM class_enrollment_counts WHERE institution_id = $1 ORDER BY class_name`,
      [institutionId]
    );
    return res.rows;
  }

  async bulkInsertStudents(institutionId: string, rows: any[], academicYearId: string, actorId: string) {
    const results: { row: number; success: boolean; admissionNumber?: string; error?: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const student = await this.createStudent(institutionId, { ...rows[i], academicYearId, actorId });
        results.push({ row: i + 1, success: true, admissionNumber: student.admission_number });
      } catch (err: any) {
        results.push({ row: i + 1, success: false, error: err.message });
      }
    }
    return results;
  }
}

export const studentRepository = new StudentRepository();
