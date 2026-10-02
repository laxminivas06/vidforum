import { db } from '../../config/database';

export interface AttendanceSessionData {
  id: string;
  institutionId: string;
  sectionId: string;
  subjectId?: string | null;
  staffId?: string | null;
  sessionDate: string;
  periodNumber?: number | null;
  createdAt: string;
  className?: string;
  sectionName?: string;
  subjectName?: string | null;
  teacherName?: string | null;
  totalStudents?: number;
  totalRecorded?: number;
  totalPresent?: number;
  totalAbsent?: number;
  totalLate?: number;
  totalExcused?: number;
}

export interface AttendanceRecordData {
  id: string;
  institutionId: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  source: 'manual' | 'ai_face' | 'cctv';
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  isFinal: boolean;
  remarks?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface StudentLeaveRequestData {
  id: string;
  institutionId: string;
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
  requestedBy: string;
  requesterName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decidedBy?: string | null;
  deciderName?: string | null;
  decidedAt?: string | null;
  decisionNotes?: string | null;
  createdAt: string;
}

export class AttendanceRepository {
  // ================= SESSIONS =================
  async getOrCreateSession(
    institutionId: string,
    data: {
      sectionId: string;
      sessionDate: string;
      subjectId?: string | null;
      staffId?: string | null;
      periodNumber?: number | null;
    }
  ): Promise<AttendanceSessionData> {
    const subjectId = data.subjectId || null;
    const periodNumber = data.periodNumber || null;
    const staffId = data.staffId || null;

    // Check if matching session exists
    let existingQuery = `
      SELECT id FROM attendance_sessions
      WHERE institution_id = $1 AND section_id = $2 AND session_date = $3
    `;
    const existingParams: any[] = [institutionId, data.sectionId, data.sessionDate];

    if (subjectId) {
      existingParams.push(subjectId);
      existingQuery += ` AND subject_id = $${existingParams.length}`;
    } else {
      existingQuery += ` AND subject_id IS NULL`;
    }

    if (periodNumber) {
      existingParams.push(periodNumber);
      existingQuery += ` AND period_number = $${existingParams.length}`;
    } else {
      existingQuery += ` AND period_number IS NULL`;
    }

    const checkRes = await db.query(existingQuery, existingParams);
    if (checkRes.rows.length > 0) {
      const session = await this.getSessionById(institutionId, checkRes.rows[0].id);
      return session!;
    }

    // Insert new session
    const insertRes = await db.query(
      `INSERT INTO attendance_sessions (institution_id, section_id, session_date, subject_id, staff_id, period_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [institutionId, data.sectionId, data.sessionDate, subjectId, staffId, periodNumber]
    );

    const session = await this.getSessionById(institutionId, insertRes.rows[0].id);
    return session!;
  }

  async getSessionById(institutionId: string, sessionId: string): Promise<AttendanceSessionData | null> {
    const res = await db.query(
      `SELECT 
         ases.id,
         ases.institution_id as "institutionId",
         ases.section_id as "sectionId",
         ases.subject_id as "subjectId",
         ases.staff_id as "staffId",
         ases.session_date::text as "sessionDate",
         ases.period_number as "periodNumber",
         ases.created_at as "createdAt",
         c.name as "className",
         sec.name as "sectionName",
         sub.name as "subjectName",
         p.full_name as "teacherName",
         (SELECT count(*) FROM students WHERE current_section_id = ases.section_id AND status = 'active')::int as "totalStudents",
         (SELECT count(*) FROM attendance_records WHERE session_id = ases.id)::int as "totalRecorded",
         (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'present')::int as "totalPresent",
         (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'absent')::int as "totalAbsent",
         (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'late')::int as "totalLate",
         (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'excused')::int as "totalExcused"
       FROM attendance_sessions ases
       JOIN sections sec ON sec.id = ases.section_id
       JOIN classes c ON c.id = sec.class_id
       LEFT JOIN subjects sub ON sub.id = ases.subject_id
       LEFT JOIN staff st ON st.id = ases.staff_id
       LEFT JOIN profiles p ON p.id = st.profile_id
       WHERE ases.institution_id = $1 AND ases.id = $2`,
      [institutionId, sessionId]
    );

    return res.rows[0] || null;
  }

  async listSessions(
    institutionId: string,
    filters?: {
      sectionId?: string;
      sessionDate?: string;
      startDate?: string;
      endDate?: string;
      subjectId?: string;
      staffId?: string;
    }
  ): Promise<AttendanceSessionData[]> {
    let query = `
      SELECT 
        ases.id,
        ases.institution_id as "institutionId",
        ases.section_id as "sectionId",
        ases.subject_id as "subjectId",
        ases.staff_id as "staffId",
        ases.session_date::text as "sessionDate",
        ases.period_number as "periodNumber",
        ases.created_at as "createdAt",
        c.name as "className",
        sec.name as "sectionName",
        sub.name as "subjectName",
        p.full_name as "teacherName",
        (SELECT count(*) FROM students WHERE current_section_id = ases.section_id AND status = 'active')::int as "totalStudents",
        (SELECT count(*) FROM attendance_records WHERE session_id = ases.id)::int as "totalRecorded",
        (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'present')::int as "totalPresent",
        (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'absent')::int as "totalAbsent",
        (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'late')::int as "totalLate",
        (SELECT count(*) FROM attendance_records WHERE session_id = ases.id AND status = 'excused')::int as "totalExcused"
      FROM attendance_sessions ases
      JOIN sections sec ON sec.id = ases.section_id
      JOIN classes c ON c.id = sec.class_id
      LEFT JOIN subjects sub ON sub.id = ases.subject_id
      LEFT JOIN staff st ON st.id = ases.staff_id
      LEFT JOIN profiles p ON p.id = st.profile_id
      WHERE ases.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.sectionId) {
      params.push(filters.sectionId);
      query += ` AND ases.section_id = $${params.length}`;
    }
    if (filters?.sessionDate) {
      params.push(filters.sessionDate);
      query += ` AND ases.session_date = $${params.length}`;
    }
    if (filters?.startDate) {
      params.push(filters.startDate);
      query += ` AND ases.session_date >= $${params.length}`;
    }
    if (filters?.endDate) {
      params.push(filters.endDate);
      query += ` AND ases.session_date <= $${params.length}`;
    }
    if (filters?.subjectId) {
      params.push(filters.subjectId);
      query += ` AND ases.subject_id = $${params.length}`;
    }
    if (filters?.staffId) {
      params.push(filters.staffId);
      query += ` AND ases.staff_id = $${params.length}`;
    }

    query += ' ORDER BY ases.session_date DESC, ases.period_number ASC NULLS FIRST';
    const res = await db.query(query, params);
    return res.rows;
  }

  // ================= ROSTER & ROLL CALL =================
  async getSectionRosterForSession(
    institutionId: string,
    sectionId: string,
    sessionDate: string,
    sessionId?: string | null
  ) {
    const query = `
      SELECT 
        s.id as "studentId",
        s.admission_number as "admissionNumber",
        s.roll_number as "rollNumber",
        (s.first_name || ' ' || s.last_name) as "studentName",
        s.gender,
        ar.id as "recordId",
        ar.status as "status",
        ar.remarks as "remarks",
        ar.is_final as "isFinal",
        slr.id as "approvedLeaveId",
        slr.reason as "approvedLeaveReason"
      FROM students s
      LEFT JOIN attendance_records ar 
        ON ar.student_id = s.id 
        ${sessionId ? 'AND ar.session_id = $3' : 'AND ar.session_id IS NULL'}
      LEFT JOIN student_leave_requests slr
        ON slr.student_id = s.id
        AND slr.status = 'approved'
        AND $2 BETWEEN slr.start_date AND slr.end_date
      WHERE s.institution_id = $1
        AND s.current_section_id = $4
        AND s.status = 'active'
      ORDER BY s.roll_number ASC NULLS LAST, s.first_name ASC
    `;

    const params: any[] = [institutionId, sessionDate];
    if (sessionId) params.push(sessionId);
    params.push(sectionId);

    const res = await db.query(query, params);
    return res.rows;
  }

  async recordRollCall(
    institutionId: string,
    sessionId: string,
    records: Array<{ studentId: string; status: string; remarks?: string }>,
    verifiedBy?: string | null
  ) {
    return await db.transaction(async (client) => {
      // 1. Verify session belongs to this institution
      const sessionRes = await client.query(
        'SELECT id, session_date::text as session_date FROM attendance_sessions WHERE id = $1 AND institution_id = $2',
        [sessionId, institutionId]
      );
      if (sessionRes.rows.length === 0) {
        throw new Error('Attendance session not found for this institution');
      }

      const session = sessionRes.rows[0];
      const validStatuses = ['present', 'absent', 'late', 'excused'];
      const updatedRecords: AttendanceRecordData[] = [];
      const absentStudentIds: string[] = [];

      for (const rec of records) {
        const cleanStatus = (rec.status || 'present').toLowerCase();
        if (!validStatuses.includes(cleanStatus)) {
          throw new Error(`Invalid attendance status: ${rec.status}`);
        }

        const upsertRes = await client.query(
          `INSERT INTO attendance_records (institution_id, session_id, student_id, status, source, verified_by, verified_at, remarks, updated_at)
           VALUES ($1, $2, $3, $4::attendance_status, 'manual', $5, now(), $6, now())
           ON CONFLICT (session_id, student_id)
           DO UPDATE SET status = EXCLUDED.status, 
                         remarks = COALESCE(EXCLUDED.remarks, attendance_records.remarks),
                         verified_by = EXCLUDED.verified_by,
                         verified_at = now(),
                         updated_at = now()
           RETURNING id, institution_id as "institutionId", session_id as "sessionId",
                     student_id as "studentId", status, source, is_final as "isFinal",
                     remarks, created_at as "createdAt", updated_at as "updatedAt"`,
          [institutionId, sessionId, rec.studentId, cleanStatus, verifiedBy || null, rec.remarks || null]
        );

        updatedRecords.push(upsertRes.rows[0]);
        if (cleanStatus === 'absent') {
          absentStudentIds.push(rec.studentId);
        }
      }

      return {
        sessionId,
        sessionDate: session.session_date,
        count: updatedRecords.length,
        records: updatedRecords,
        absentStudentIds,
      };
    });
  }

  // ================= STUDENT ATTENDANCE STATS & SUMMARY =================
  async getStudentAttendanceSummary(
    institutionId: string,
    studentId: string,
    filters?: { startDate?: string; endDate?: string; subjectId?: string }
  ) {
    let whereClauses = 'WHERE ar.institution_id = $1 AND ar.student_id = $2';
    const params: any[] = [institutionId, studentId];

    if (filters?.startDate) {
      params.push(filters.startDate);
      whereClauses += ` AND ases.session_date >= $${params.length}`;
    }
    if (filters?.endDate) {
      params.push(filters.endDate);
      whereClauses += ` AND ases.session_date <= $${params.length}`;
    }
    if (filters?.subjectId) {
      params.push(filters.subjectId);
      whereClauses += ` AND ases.subject_id = $${params.length}`;
    }

    // 1. Aggregates
    const aggRes = await db.query(
      `SELECT 
         count(*)::int as "totalSessions",
         count(*) filter (where ar.status = 'present')::int as "presentCount",
         count(*) filter (where ar.status = 'absent')::int as "absentCount",
         count(*) filter (where ar.status = 'late')::int as "lateCount",
         count(*) filter (where ar.status = 'excused')::int as "excusedCount",
         CASE 
           WHEN count(*) > 0 THEN round(100.0 * (count(*) filter (where ar.status = 'present') + count(*) filter (where ar.status = 'excused')) / count(*), 1)::float
           ELSE 100.0
         END as "percentage"
       FROM attendance_records ar
       JOIN attendance_sessions ases ON ases.id = ar.session_id
       ${whereClauses}`,
      params
    );

    const stats = aggRes.rows[0] || {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      percentage: 100.0,
    };

    // Low attendance flag per CBSE/State Board policy (rule < 75%)
    const isLowAttendance = stats.totalSessions > 0 && stats.percentage < 75.0;

    // 2. Details
    const detailsRes = await db.query(
      `SELECT 
         ar.id,
         ases.session_date::text as "sessionDate",
         ases.period_number as "periodNumber",
         sub.name as "subjectName",
         ar.status,
         ar.remarks,
         p.full_name as "teacherName"
       FROM attendance_records ar
       JOIN attendance_sessions ases ON ases.id = ar.session_id
       LEFT JOIN subjects sub ON sub.id = ases.subject_id
       LEFT JOIN staff st ON st.id = ases.staff_id
       LEFT JOIN profiles p ON p.id = st.profile_id
       ${whereClauses}
       ORDER BY ases.session_date DESC, ases.period_number ASC NULLS FIRST
       LIMIT 50`,
      params
    );

    return {
      studentId,
      ...stats,
      isLowAttendance,
      history: detailsRes.rows,
    };
  }

  // ================= INSTITUTION ATTENDANCE DASHBOARD =================
  async getInstitutionAttendanceStats(institutionId: string, date?: string) {
    let whereClauses = 'WHERE ar.institution_id = $1';
    const params: any[] = [institutionId];

    if (date) {
      params.push(date);
      whereClauses += ` AND ases.session_date = $2`;
    }

    const res = await db.query(
      `SELECT 
         count(*)::int as total,
         count(*) filter (where ar.status = 'present')::int as present,
         count(*) filter (where ar.status = 'absent')::int as absent,
         count(*) filter (where ar.status = 'late')::int as late,
         count(*) filter (where ar.status = 'excused')::int as excused,
         CASE 
           WHEN count(*) > 0 THEN round(100.0 * count(*) filter (where ar.status = 'present') / count(*), 1)::float
           ELSE 100.0
         END as percentage
       FROM attendance_records ar
       JOIN attendance_sessions ases ON ases.id = ar.session_id
       ${whereClauses}`,
      params
    );

    return res.rows[0] || { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 100.0 };
  }

  // ================= STUDENT LEAVE REQUESTS =================
  async createStudentLeaveRequest(
    institutionId: string,
    data: {
      studentId: string;
      requestedBy: string;
      startDate: string;
      endDate: string;
      reason: string;
    }
  ): Promise<StudentLeaveRequestData> {
    const res = await db.query(
      `INSERT INTO student_leave_requests (institution_id, student_id, requested_by, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, institution_id as "institutionId", student_id as "studentId",
                 requested_by as "requestedBy", start_date::text as "startDate", end_date::text as "endDate",
                 reason, status, created_at as "createdAt"`,
      [institutionId, data.studentId, data.requestedBy, data.startDate, data.endDate, data.reason]
    );

    return res.rows[0];
  }

  async listStudentLeaveRequests(
    institutionId: string,
    filters?: {
      studentId?: string;
      status?: string;
      classId?: string;
      sectionId?: string;
    }
  ): Promise<StudentLeaveRequestData[]> {
    let query = `
      SELECT 
        slr.id,
        slr.institution_id as "institutionId",
        slr.student_id as "studentId",
        slr.requested_by as "requestedBy",
        slr.start_date::text as "startDate",
        slr.end_date::text as "endDate",
        slr.reason,
        slr.status,
        slr.decided_by as "decidedBy",
        slr.decided_at as "decidedAt",
        slr.decision_notes as "decisionNotes",
        slr.created_at as "createdAt",
        (s.first_name || ' ' || s.last_name) as "studentName",
        s.admission_number as "admissionNumber",
        c.name as "className",
        sec.name as "sectionName",
        p_req.full_name as "requesterName",
        p_dec.full_name as "deciderName"
      FROM student_leave_requests slr
      JOIN students s ON s.id = slr.student_id
      LEFT JOIN classes c ON c.id = s.current_class_id
      LEFT JOIN sections sec ON sec.id = s.current_section_id
      JOIN profiles p_req ON p_req.id = slr.requested_by
      LEFT JOIN profiles p_dec ON p_dec.id = slr.decided_by
      WHERE slr.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.studentId) {
      params.push(filters.studentId);
      query += ` AND slr.student_id = $${params.length}`;
    }
    if (filters?.status) {
      params.push(filters.status.toLowerCase());
      query += ` AND slr.status = $${params.length}::leave_request_status`;
    }
    if (filters?.classId) {
      params.push(filters.classId);
      query += ` AND s.current_class_id = $${params.length}`;
    }
    if (filters?.sectionId) {
      params.push(filters.sectionId);
      query += ` AND s.current_section_id = $${params.length}`;
    }

    query += ' ORDER BY slr.created_at DESC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async decideStudentLeaveRequest(
    institutionId: string,
    leaveId: string,
    decision: 'approved' | 'rejected',
    decidedBy: string,
    decisionNotes?: string
  ): Promise<StudentLeaveRequestData> {
    return await db.transaction(async (client) => {
      const getRes = await client.query(
        'SELECT * FROM student_leave_requests WHERE id = $1 AND institution_id = $2 FOR UPDATE',
        [leaveId, institutionId]
      );
      if (getRes.rows.length === 0) {
        throw new Error('Leave request not found');
      }

      const leave = getRes.rows[0];
      if (leave.status !== 'pending') {
        throw new Error(`Cannot decide leave request that is already ${leave.status}`);
      }

      const updateRes = await client.query(
        `UPDATE student_leave_requests
         SET status = $1::leave_request_status, decided_by = $2, decided_at = now(), decision_notes = $3, updated_at = now()
         WHERE id = $4
         RETURNING id, institution_id as "institutionId", student_id as "studentId",
                   requested_by as "requestedBy", start_date::text as "startDate", end_date::text as "endDate",
                   reason, status, decided_by as "decidedBy", decided_at as "decidedAt",
                   decision_notes as "decisionNotes", created_at as "createdAt"`,
        [decision, decidedBy, decisionNotes || null, leaveId]
      );

      // If approved, automatically update any attendance records on these dates marked 'absent' to 'excused'
      if (decision === 'approved') {
        await client.query(
          `UPDATE attendance_records ar
           SET status = 'excused'::attendance_status, 
               remarks = COALESCE(ar.remarks, 'Leave approved: ' || $1),
               updated_at = now()
           FROM attendance_sessions ases
           WHERE ar.session_id = ases.id
             AND ar.student_id = $2
             AND ar.institution_id = $3
             AND ases.session_date BETWEEN $4 AND $5
             AND ar.status = 'absent'::attendance_status`,
          [leave.reason, leave.student_id, institutionId, leave.start_date, leave.end_date]
        );
      }

      return updateRes.rows[0];
    });
  }

  // ================= STAFF ATTENDANCE =================
  async recordStaffAttendance(
    institutionId: string,
    records: Array<{ staffId: string; attendanceDate: string; status: string }>,
    markedBy?: string | null
  ) {
    return await db.transaction(async (client) => {
      const results: any[] = [];
      for (const rec of records) {
        const cleanStatus = (rec.status || 'present').toLowerCase();
        const res = await client.query(
          `INSERT INTO staff_attendance (institution_id, staff_id, attendance_date, status, marked_by)
           VALUES ($1, $2, $3, $4::attendance_status, $5)
           ON CONFLICT (staff_id, attendance_date)
           DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by
           RETURNING id, institution_id as "institutionId", staff_id as "staffId",
                     attendance_date::text as "attendanceDate", status, marked_by as "markedBy", created_at as "createdAt"`,
          [institutionId, rec.staffId, rec.attendanceDate, cleanStatus, markedBy || null]
        );
        results.push(res.rows[0]);
      }
      return results;
    });
  }

  async listStaffAttendance(
    institutionId: string,
    filters?: { staffId?: string; attendanceDate?: string; startDate?: string; endDate?: string }
  ) {
    let query = `
      SELECT 
        sa.id,
        sa.institution_id as "institutionId",
        sa.staff_id as "staffId",
        sa.attendance_date::text as "attendanceDate",
        sa.status,
        sa.marked_by as "markedBy",
        sa.created_at as "createdAt",
        p.full_name as "staffName",
        p.email as "staffEmail",
        d.name as "designationName",
        dept.name as "departmentName"
      FROM staff_attendance sa
      JOIN staff s ON s.id = sa.staff_id
      JOIN profiles p ON p.id = s.profile_id
      LEFT JOIN designations d ON d.id = s.designation_id
      LEFT JOIN departments dept ON dept.id = s.department_id
      WHERE sa.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.staffId) {
      params.push(filters.staffId);
      query += ` AND sa.staff_id = $${params.length}`;
    }
    if (filters?.attendanceDate) {
      params.push(filters.attendanceDate);
      query += ` AND sa.attendance_date = $${params.length}`;
    }
    if (filters?.startDate) {
      params.push(filters.startDate);
      query += ` AND sa.attendance_date >= $${params.length}`;
    }
    if (filters?.endDate) {
      params.push(filters.endDate);
      query += ` AND sa.attendance_date <= $${params.length}`;
    }

    query += ' ORDER BY sa.attendance_date DESC, p.full_name ASC';
    const res = await db.query(query, params);
    return res.rows;
  }

  // ================= RULE 8 FACULTY SCOPE VERIFICATION =================
  async verifyFacultySectionAccess(institutionId: string, facultyProfileId: string, sectionId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM faculty_assignments fa
       JOIN staff s ON s.id = fa.staff_id
       WHERE s.profile_id = $1 
         AND s.institution_id = $2
         AND fa.section_id = $3
       UNION
       SELECT 1 FROM sections sec
       JOIN staff s ON s.id = sec.class_teacher_staff_id
       WHERE s.profile_id = $1
         AND s.institution_id = $2
         AND sec.id = $3
       LIMIT 1`,
      [facultyProfileId, institutionId, sectionId]
    );

    return res.rows.length > 0;
  }
}

export const attendanceRepository = new AttendanceRepository();
