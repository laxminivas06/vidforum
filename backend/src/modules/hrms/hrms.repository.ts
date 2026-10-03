import { db } from '../../config/database';

export interface StaffRecord {
  id: string;
  institution_id: string;
  profile_id: string;
  employee_code: string;
  department_id: string | null;
  designation_id: string | null;
  is_teaching_staff: boolean;
  employment_status: 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';
  date_of_joining: string;
  payroll_reference: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  department_name?: string;
  department_code?: string;
  designation_name?: string;
}

export interface DesignationRecord {
  id: string;
  institution_id: string;
  name: string;
  created_at: string;
  staff_count?: number;
}

export interface DepartmentRecord {
  id: string;
  institution_id: string;
  code: string;
  name: string;
  department_type: string;
  created_at: string;
  staff_count?: number;
}

export interface LeaveTypeRecord {
  id: string;
  institution_id: string;
  name: string;
  max_days_per_year: number | null;
  created_at: string;
}

export interface LeaveRequestRecord {
  id: string;
  institution_id: string;
  staff_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  remarks: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  // Joined fields
  staff_name?: string;
  employee_code?: string;
  leave_type_name?: string;
  approver_name?: string;
}

export interface StaffAttendanceRecord {
  id: string;
  institution_id: string;
  staff_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks: string | null;
  marked_by: string | null;
  created_at: string;
  // Joined fields
  staff_name?: string;
  employee_code?: string;
  department_name?: string;
}

export interface StaffEmploymentHistory {
  id: string;
  staff_id: string;
  department_id: string | null;
  designation_id: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  department_name?: string;
  designation_name?: string;
}

export class HrmsRepository {
  // ==========================================
  // 1. DESIGNATIONS
  // ==========================================

  async listDesignations(institutionId: string): Promise<DesignationRecord[]> {
    const res = await db.query(
      `SELECT des.*, COUNT(st.id)::int as staff_count 
       FROM designations des
       LEFT JOIN staff st ON st.designation_id = des.id AND st.deleted_at IS NULL
       WHERE des.institution_id = $1 
       GROUP BY des.id
       ORDER BY des.name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async findDesignationByName(institutionId: string, name: string): Promise<DesignationRecord | null> {
    const res = await db.query(
      `SELECT * FROM designations 
       WHERE institution_id = $1 AND LOWER(name) = LOWER($2) 
       LIMIT 1`,
      [institutionId, name.trim()]
    );
    return res.rows[0] || null;
  }

  async createDesignation(institutionId: string, name: string): Promise<DesignationRecord> {
    const res = await db.query(
      `INSERT INTO designations (institution_id, name)
       VALUES ($1, $2)
       ON CONFLICT (institution_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [institutionId, name.trim()]
    );
    return res.rows[0];
  }

  async isDesignationInUse(institutionId: string, designationId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM staff 
       WHERE institution_id = $1 AND designation_id = $2 AND deleted_at IS NULL 
       LIMIT 1`,
      [institutionId, designationId]
    );
    return res.rows.length > 0;
  }

  async deleteDesignation(institutionId: string, designationId: string): Promise<boolean> {
    const inUse = await this.isDesignationInUse(institutionId, designationId);
    if (inUse) {
      throw new Error('Cannot delete designation: assigned to active staff members');
    }
    const res = await db.query(
      `DELETE FROM designations WHERE institution_id = $1 AND id = $2 RETURNING id`,
      [institutionId, designationId]
    );
    return (res.rowCount || 0) > 0;
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  async listDepartments(institutionId: string): Promise<DepartmentRecord[]> {
    const res = await db.query(
      `SELECT d.*, COUNT(st.id)::int as staff_count 
       FROM departments d
       LEFT JOIN staff st ON st.department_id = d.id AND st.deleted_at IS NULL
       WHERE d.institution_id = $1 
       GROUP BY d.id
       ORDER BY d.name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createDepartment(
    institutionId: string,
    name: string,
    code: string,
    departmentType = 'academic'
  ): Promise<DepartmentRecord> {
    const res = await db.query(
      `INSERT INTO departments (institution_id, code, name, department_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (institution_id, code) DO UPDATE 
         SET name = EXCLUDED.name, department_type = EXCLUDED.department_type
       RETURNING *`,
      [institutionId, code.trim().toUpperCase(), name.trim(), departmentType]
    );
    return res.rows[0];
  }

  async isDepartmentInUse(institutionId: string, departmentId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM staff 
       WHERE institution_id = $1 AND department_id = $2 AND deleted_at IS NULL 
       LIMIT 1`,
      [institutionId, departmentId]
    );
    return res.rows.length > 0;
  }

  async deleteDepartment(institutionId: string, departmentId: string): Promise<boolean> {
    const inUse = await this.isDepartmentInUse(institutionId, departmentId);
    if (inUse) {
      throw new Error('Cannot delete department: assigned to active staff members');
    }
    const res = await db.query(
      `DELETE FROM departments WHERE institution_id = $1 AND id = $2 RETURNING id`,
      [institutionId, departmentId]
    );
    return (res.rowCount || 0) > 0;
  }

  // ==========================================
  // 2. STAFF DIRECTORY & ONBOARDING
  // ==========================================

  async listStaff(
    institutionId: string,
    filters: {
      departmentId?: string;
      designationId?: string;
      employmentStatus?: string;
      isTeachingStaff?: boolean;
      search?: string;
    } = {}
  ): Promise<StaffRecord[]> {
    const conditions: string[] = ['st.institution_id = $1', 'st.deleted_at IS NULL'];
    const params: any[] = [institutionId];
    let pIdx = 2;

    if (filters.departmentId) {
      conditions.push(`st.department_id = $${pIdx++}`);
      params.push(filters.departmentId);
    }
    if (filters.designationId) {
      conditions.push(`st.designation_id = $${pIdx++}`);
      params.push(filters.designationId);
    }
    if (filters.employmentStatus) {
      conditions.push(`st.employment_status = $${pIdx++}`);
      params.push(filters.employmentStatus);
    }
    if (filters.isTeachingStaff !== undefined) {
      conditions.push(`st.is_teaching_staff = $${pIdx++}`);
      params.push(filters.isTeachingStaff);
    }
    if (filters.search) {
      conditions.push(
        `(p.full_name ILIKE $${pIdx} OR p.email ILIKE $${pIdx} OR st.employee_code ILIKE $${pIdx})`
      );
      params.push(`%${filters.search}%`);
      pIdx++;
    }

    const query = `
      SELECT 
        st.*,
        p.full_name,
        p.email,
        p.phone,
        p.avatar_url,
        d.name as department_name,
        d.code as department_code,
        des.name as designation_name
      FROM staff st
      JOIN profiles p ON p.id = st.profile_id
      LEFT JOIN departments d ON d.id = st.department_id
      LEFT JOIN designations des ON des.id = st.designation_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY st.employee_code ASC
    `;

    const res = await db.query(query, params);
    return res.rows;
  }

  async getStaffById(institutionId: string, staffId: string): Promise<StaffRecord | null> {
    const res = await db.query(
      `SELECT 
        st.*,
        p.full_name,
        p.email,
        p.phone,
        p.avatar_url,
        d.name as department_name,
        d.code as department_code,
        des.name as designation_name
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE st.institution_id = $1 AND st.id = $2 AND st.deleted_at IS NULL`,
      [institutionId, staffId]
    );
    return res.rows[0] || null;
  }

  async findStaffByEmployeeCode(institutionId: string, employeeCode: string): Promise<StaffRecord | null> {
    const res = await db.query(
      `SELECT * FROM staff 
       WHERE institution_id = $1 AND employee_code = $2 AND deleted_at IS NULL`,
      [institutionId, employeeCode.trim()]
    );
    return res.rows[0] || null;
  }

  async findStaffByProfileId(institutionId: string, profileId: string): Promise<StaffRecord | null> {
    const res = await db.query(
      `SELECT * FROM staff 
       WHERE institution_id = $1 AND profile_id = $2 AND deleted_at IS NULL`,
      [institutionId, profileId]
    );
    return res.rows[0] || null;
  }

  async createStaff(data: {
    institutionId: string;
    profileId: string;
    employeeCode: string;
    departmentId?: string | null;
    designationId?: string | null;
    isTeachingStaff?: boolean;
    dateOfJoining: string;
    payrollReference?: string | null;
  }): Promise<StaffRecord> {
    const res = await db.query(
      `INSERT INTO staff (
        institution_id, profile_id, employee_code, department_id, designation_id,
        is_teaching_staff, employment_status, date_of_joining, payroll_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
      RETURNING *`,
      [
        data.institutionId,
        data.profileId,
        data.employeeCode.trim(),
        data.departmentId || null,
        data.designationId || null,
        data.isTeachingStaff ?? true,
        data.dateOfJoining,
        data.payrollReference || null,
      ]
    );
    return res.rows[0];
  }

  async updateStaff(
    institutionId: string,
    staffId: string,
    data: {
      departmentId?: string | null;
      designationId?: string | null;
      employmentStatus?: 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';
      payrollReference?: string | null;
      isTeachingStaff?: boolean;
    }
  ): Promise<StaffRecord | null> {
    const updates: string[] = ['updated_at = now()'];
    const params: any[] = [institutionId, staffId];
    let pIdx = 3;

    if (data.departmentId !== undefined) {
      updates.push(`department_id = $${pIdx++}`);
      params.push(data.departmentId);
    }
    if (data.designationId !== undefined) {
      updates.push(`designation_id = $${pIdx++}`);
      params.push(data.designationId);
    }
    if (data.employmentStatus !== undefined) {
      updates.push(`employment_status = $${pIdx++}`);
      params.push(data.employmentStatus);
    }
    if (data.payrollReference !== undefined) {
      updates.push(`payroll_reference = $${pIdx++}`);
      params.push(data.payrollReference);
    }
    if (data.isTeachingStaff !== undefined) {
      updates.push(`is_teaching_staff = $${pIdx++}`);
      params.push(data.isTeachingStaff);
    }

    const query = `
      UPDATE staff
      SET ${updates.join(', ')}
      WHERE institution_id = $1 AND id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await db.query(query, params);
    return res.rows[0] || null;
  }

  async softDeleteStaff(institutionId: string, staffId: string): Promise<boolean> {
    const res = await db.query(
      `UPDATE staff 
       SET deleted_at = now(), updated_at = now(), employment_status = 'terminated'
       WHERE institution_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [institutionId, staffId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async recordEmploymentHistory(data: {
    staffId: string;
    departmentId?: string | null;
    designationId?: string | null;
    effectiveFrom: string;
    effectiveTo?: string | null;
  }): Promise<StaffEmploymentHistory> {
    const res = await db.query(
      `INSERT INTO staff_employment (
        staff_id, department_id, designation_id, effective_from, effective_to
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.staffId,
        data.departmentId || null,
        data.designationId || null,
        data.effectiveFrom,
        data.effectiveTo || null,
      ]
    );
    return res.rows[0];
  }

  async closeActiveEmploymentHistory(staffId: string, effectiveToDate: string): Promise<void> {
    await db.query(
      `UPDATE staff_employment
       SET effective_to = $2
       WHERE staff_id = $1 AND effective_to IS NULL`,
      [staffId, effectiveToDate]
    );
  }

  async getEmploymentHistory(staffId: string): Promise<StaffEmploymentHistory[]> {
    const res = await db.query(
      `SELECT 
        se.*,
        d.name as department_name,
        des.name as designation_name
       FROM staff_employment se
       LEFT JOIN departments d ON d.id = se.department_id
       LEFT JOIN designations des ON des.id = se.designation_id
       WHERE se.staff_id = $1
       ORDER BY se.effective_from DESC, se.created_at DESC`,
      [staffId]
    );
    return res.rows;
  }

  async linkFacultyRecord(
    institutionId: string,
    staffId: string,
    qualification = 'Master of Education / Sciences',
    specialization = 'Core Academics'
  ): Promise<void> {
    await db.query(
      `INSERT INTO faculty (institution_id, staff_id, qualification, specialization)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (staff_id) DO NOTHING`,
      [institutionId, staffId, qualification, specialization]
    );
  }

  // ==========================================
  // 3. LEAVE MANAGEMENT
  // ==========================================

  async listLeaveTypes(institutionId: string): Promise<LeaveTypeRecord[]> {
    const res = await db.query(
      `SELECT * FROM leave_types 
       WHERE institution_id = $1 
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async getLeaveTypeById(institutionId: string, leaveTypeId: string): Promise<LeaveTypeRecord | null> {
    const res = await db.query(
      `SELECT * FROM leave_types 
       WHERE institution_id = $1 AND id = $2`,
      [institutionId, leaveTypeId]
    );
    return res.rows[0] || null;
  }

  async createLeaveType(
    institutionId: string,
    name: string,
    maxDaysPerYear: number | null
  ): Promise<LeaveTypeRecord> {
    const res = await db.query(
      `INSERT INTO leave_types (institution_id, name, max_days_per_year)
       VALUES ($1, $2, $3)
       ON CONFLICT (institution_id, name) DO UPDATE SET max_days_per_year = EXCLUDED.max_days_per_year
       RETURNING *`,
      [institutionId, name.trim(), maxDaysPerYear]
    );
    return res.rows[0];
  }

  async createLeaveRequest(data: {
    institutionId: string;
    staffId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string | null;
  }): Promise<LeaveRequestRecord> {
    const res = await db.query(
      `INSERT INTO leave_requests (
        institution_id, staff_id, leave_type_id, start_date, end_date, total_days, reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        data.institutionId,
        data.staffId,
        data.leaveTypeId,
        data.startDate,
        data.endDate,
        data.totalDays,
        data.reason,
      ]
    );
    return res.rows[0];
  }

  async getLeaveRequestById(institutionId: string, requestId: string): Promise<LeaveRequestRecord | null> {
    const res = await db.query(
      `SELECT 
        lr.*,
        p.full_name as staff_name,
        st.employee_code,
        lt.name as leave_type_name,
        ap.full_name as approver_name
       FROM leave_requests lr
       JOIN staff st ON st.id = lr.staff_id
       JOIN profiles p ON p.id = st.profile_id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       LEFT JOIN profiles ap ON ap.id = lr.approved_by
       WHERE lr.institution_id = $1 AND lr.id = $2`,
      [institutionId, requestId]
    );
    return res.rows[0] || null;
  }

  async listLeaveRequests(
    institutionId: string,
    filters: {
      staffId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<LeaveRequestRecord[]> {
    const conditions: string[] = ['lr.institution_id = $1'];
    const params: any[] = [institutionId];
    let pIdx = 2;

    if (filters.staffId) {
      conditions.push(`lr.staff_id = $${pIdx++}`);
      params.push(filters.staffId);
    }
    if (filters.status) {
      conditions.push(`lr.status = $${pIdx++}`);
      params.push(filters.status);
    }
    if (filters.startDate) {
      conditions.push(`lr.start_date >= $${pIdx++}`);
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`lr.end_date <= $${pIdx++}`);
      params.push(filters.endDate);
    }

    const query = `
      SELECT 
        lr.*,
        p.full_name as staff_name,
        st.employee_code,
        lt.name as leave_type_name,
        ap.full_name as approver_name
      FROM leave_requests lr
      JOIN staff st ON st.id = lr.staff_id
      JOIN profiles p ON p.id = st.profile_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      LEFT JOIN profiles ap ON ap.id = lr.approved_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY lr.created_at DESC
    `;

    const res = await db.query(query, params);
    return res.rows;
  }

  async checkOverlappingLeave(
    institutionId: string,
    staffId: string,
    startDate: string,
    endDate: string,
    excludeRequestId?: string
  ): Promise<boolean> {
    let query = `
      SELECT id FROM leave_requests
      WHERE institution_id = $1 AND staff_id = $2 AND status IN ('pending', 'approved')
        AND NOT (end_date < $3 OR start_date > $4)
    `;
    const params: any[] = [institutionId, staffId, startDate, endDate];
    if (excludeRequestId) {
      query += ` AND id != $5`;
      params.push(excludeRequestId);
    }
    const res = await db.query(query, params);
    return res.rows.length > 0;
  }

  async updateLeaveRequestAction(
    institutionId: string,
    requestId: string,
    status: 'approved' | 'rejected' | 'cancelled',
    approvedBy: string,
    remarks?: string | null
  ): Promise<LeaveRequestRecord | null> {
    const res = await db.query(
      `UPDATE leave_requests
       SET status = $3, approved_by = $4, approved_at = now(), remarks = $5
       WHERE institution_id = $1 AND id = $2 AND status = 'pending'
       RETURNING *`,
      [institutionId, requestId, status, approvedBy, remarks || null]
    );
    return res.rows[0] || null;
  }

  async getStaffLeaveUsageByYear(
    institutionId: string,
    staffId: string,
    yearStart: string,
    yearEnd: string
  ): Promise<Array<{ leave_type_id: string; leave_type_name: string; max_days: number | null; days_taken: number }>> {
    const query = `
      SELECT 
        lt.id as leave_type_id,
        lt.name as leave_type_name,
        lt.max_days_per_year as max_days,
        COALESCE(SUM(lr.total_days), 0)::integer as days_taken
      FROM leave_types lt
      LEFT JOIN leave_requests lr ON lr.leave_type_id = lt.id 
        AND lr.staff_id = $2 
        AND lr.status = 'approved'
        AND lr.start_date >= $3 
        AND lr.end_date <= $4
      WHERE lt.institution_id = $1
      GROUP BY lt.id, lt.name, lt.max_days_per_year
      ORDER BY lt.name ASC
    `;
    const res = await db.query(query, [institutionId, staffId, yearStart, yearEnd]);
    return res.rows;
  }

  // ==========================================
  // 4. STAFF ATTENDANCE
  // ==========================================

  async upsertStaffAttendance(data: {
    institutionId: string;
    staffId: string;
    attendanceDate: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string | null;
    markedBy?: string | null;
  }): Promise<StaffAttendanceRecord> {
    const res = await db.query(
      `INSERT INTO staff_attendance (
        institution_id, staff_id, attendance_date, status, remarks, marked_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (staff_id, attendance_date) DO UPDATE
        SET status = EXCLUDED.status,
            remarks = EXCLUDED.remarks,
            marked_by = EXCLUDED.marked_by
      RETURNING *`,
      [
        data.institutionId,
        data.staffId,
        data.attendanceDate,
        data.status,
        data.remarks || null,
        data.markedBy || null,
      ]
    );
    return res.rows[0];
  }

  async getStaffAttendanceByDate(
    institutionId: string,
    attendanceDate: string
  ): Promise<StaffAttendanceRecord[]> {
    const res = await db.query(
      `SELECT 
        st.id as staff_id,
        st.employee_code,
        p.full_name as staff_name,
        d.name as department_name,
        des.name as designation_name,
        COALESCE(sa.id, gen_random_uuid()) as id,
        st.institution_id,
        $2 as attendance_date,
        COALESCE(sa.status, 'absent') as status,
        sa.remarks,
        sa.marked_by,
        COALESCE(sa.created_at, now()) as created_at
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       LEFT JOIN staff_attendance sa ON sa.staff_id = st.id AND sa.attendance_date = $2
       WHERE st.institution_id = $1 AND st.deleted_at IS NULL
       ORDER BY st.employee_code ASC`,
      [institutionId, attendanceDate]
    );
    return res.rows;
  }

  async getStaffAttendanceHistory(
    institutionId: string,
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffAttendanceRecord[]> {
    const res = await db.query(
      `SELECT 
        sa.*,
        p.full_name as staff_name,
        st.employee_code
       FROM staff_attendance sa
       JOIN staff st ON st.id = sa.staff_id
       JOIN profiles p ON p.id = st.profile_id
       WHERE sa.institution_id = $1 AND sa.staff_id = $2
         AND sa.attendance_date >= $3 AND sa.attendance_date <= $4
       ORDER BY sa.attendance_date DESC`,
      [institutionId, staffId, startDate, endDate]
    );
    return res.rows;
  }

  async getMonthlyAttendanceAggregates(
    institutionId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    staff_id: string;
    employee_code: string;
    staff_name: string;
    department_name: string | null;
    designation_name: string | null;
    payroll_reference: string | null;
    present_days: number;
    absent_days: number;
    late_days: number;
    excused_days: number;
    total_marked_days: number;
  }>> {
    const query = `
      SELECT 
        st.id as staff_id,
        st.employee_code,
        p.full_name as staff_name,
        d.name as department_name,
        des.name as designation_name,
        st.payroll_reference,
        COUNT(CASE WHEN sa.status = 'present' THEN 1 END)::integer as present_days,
        COUNT(CASE WHEN sa.status = 'absent' THEN 1 END)::integer as absent_days,
        COUNT(CASE WHEN sa.status = 'late' THEN 1 END)::integer as late_days,
        COUNT(CASE WHEN sa.status = 'excused' THEN 1 END)::integer as excused_days,
        COUNT(sa.id)::integer as total_marked_days
      FROM staff st
      JOIN profiles p ON p.id = st.profile_id
      LEFT JOIN departments d ON d.id = st.department_id
      LEFT JOIN designations des ON des.id = st.designation_id
      LEFT JOIN staff_attendance sa ON sa.staff_id = st.id 
        AND sa.attendance_date >= $2 AND sa.attendance_date <= $3
      WHERE st.institution_id = $1 AND st.deleted_at IS NULL
      GROUP BY st.id, st.employee_code, p.full_name, d.name, des.name, st.payroll_reference
      ORDER BY st.employee_code ASC
    `;
    const res = await db.query(query, [institutionId, startDate, endDate]);
    return res.rows;
  }

  // ==========================================
  // 5. FACULTY WORKLOAD
  // ==========================================

  async computeStaffWorkload(
    institutionId: string,
    staffId: string,
    academicYearId: string
  ): Promise<{ periodsPerWeek: number; sectionsCount: number; subjectsCount: number }> {
    // 1. Count distinct sections and subjects from faculty_assignments
    const assignRes = await db.query(
      `SELECT 
        COUNT(DISTINCT section_id)::integer as sections_count,
        COUNT(DISTINCT subject_id)::integer as subjects_count
       FROM faculty_assignments
       WHERE institution_id = $1 AND staff_id = $2 AND academic_year_id = $3
         AND effective_to IS NULL`,
      [institutionId, staffId, academicYearId]
    );

    const sectionsCount = assignRes.rows[0]?.sections_count || 0;
    const subjectsCount = assignRes.rows[0]?.subjects_count || 0;

    // 2. Count periods per week from timetable_entries
    // Look up faculty record for this staff
    const facRes = await db.query(
      `SELECT id FROM faculty WHERE institution_id = $1 AND staff_id = $2 LIMIT 1`,
      [institutionId, staffId]
    );
    const facultyId = facRes.rows[0]?.id;

    let periodsPerWeek = 0;
    if (facultyId) {
      const periodRes = await db.query(
        `SELECT COUNT(te.id)::integer as period_count
         FROM timetable_entries te
         JOIN timetables t ON t.id = te.timetable_id
         WHERE te.institution_id = $1 AND te.faculty_id = $2 AND t.academic_year_id = $3`,
        [institutionId, facultyId, academicYearId]
      );
      periodsPerWeek = periodRes.rows[0]?.period_count || 0;
    }

    return { periodsPerWeek, sectionsCount, subjectsCount };
  }

  async upsertStaffWorkload(
    staffId: string,
    academicYearId: string,
    periodsPerWeek: number,
    sectionsCount: number
  ): Promise<{ staff_id: string; academic_year_id: string; periods_per_week: number; sections_count: number }> {
    const res = await db.query(
      `INSERT INTO staff_workload (
        staff_id, academic_year_id, periods_per_week, sections_count, computed_at
      ) VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (staff_id, academic_year_id) DO UPDATE
        SET periods_per_week = EXCLUDED.periods_per_week,
            sections_count = EXCLUDED.sections_count,
            computed_at = now()
      RETURNING *`,
      [staffId, academicYearId, periodsPerWeek, sectionsCount]
    );
    return res.rows[0];
  }

  async listFacultyWorkloads(
    institutionId: string,
    academicYearId: string
  ): Promise<Array<{
    staff_id: string;
    employee_code: string;
    staff_name: string;
    department_name: string | null;
    designation_name: string | null;
    qualification: string | null;
    specialization: string | null;
    periods_per_week: number;
    sections_count: number;
    is_overloaded: boolean;
  }>> {
    const query = `
      SELECT 
        st.id as staff_id,
        st.employee_code,
        p.full_name as staff_name,
        d.name as department_name,
        des.name as designation_name,
        f.qualification,
        f.specialization,
        COALESCE(sw.periods_per_week, 0)::integer as periods_per_week,
        COALESCE(sw.sections_count, 0)::integer as sections_count
      FROM staff st
      JOIN profiles p ON p.id = st.profile_id
      LEFT JOIN faculty f ON f.staff_id = st.id
      LEFT JOIN departments d ON d.id = st.department_id
      LEFT JOIN designations des ON des.id = st.designation_id
      LEFT JOIN staff_workload sw ON sw.staff_id = st.id AND sw.academic_year_id = $2
      WHERE st.institution_id = $1 AND st.is_teaching_staff = true AND st.deleted_at IS NULL
      ORDER BY st.employee_code ASC
    `;
    const res = await db.query(query, [institutionId, academicYearId]);
    return res.rows.map(r => ({
      ...r,
      is_overloaded: r.periods_per_week > 28, // Standard threshold: > 28 periods/week is overloaded
    }));
  }

  // ==========================================
  // 6. DUPLICATE CHECK & HR REPORTS
  // ==========================================

  async checkDuplicateStaff(
    institutionId: string,
    data: { email: string; name?: string; dateOfBirth?: string; phone?: string; excludeStaffId?: string }
  ): Promise<{ isDuplicate: boolean; duplicateFields: string[]; reasons: string[] }> {
    const reasons: string[] = [];
    const duplicateFields: string[] = [];

    // 1. Check duplicate email in staff profiles
    if (data.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      let query = `
        SELECT st.id, p.full_name, p.email 
        FROM staff st
        JOIN profiles p ON p.id = st.profile_id
        WHERE st.institution_id = $1 AND LOWER(p.email) = $2 AND st.deleted_at IS NULL
      `;
      const params: any[] = [institutionId, cleanEmail];
      if (data.excludeStaffId) {
        query += ` AND st.id != $3`;
        params.push(data.excludeStaffId);
      }
      const res = await db.query(query, params);
      if (res.rows.length > 0) {
        duplicateFields.push('email');
        reasons.push(`A staff member with email '${cleanEmail}' already exists (${res.rows[0].full_name}).`);
      }
    }

    // 2. Check duplicate name + date_of_birth
    if (data.name && data.dateOfBirth) {
      const cleanName = data.name.trim().toLowerCase();
      let query = `
        SELECT st.id, p.full_name, st.date_of_birth 
        FROM staff st
        JOIN profiles p ON p.id = st.profile_id
        WHERE st.institution_id = $1 AND LOWER(p.full_name) = $2 AND st.date_of_birth = $3 AND st.deleted_at IS NULL
      `;
      const params: any[] = [institutionId, cleanName, data.dateOfBirth];
      if (data.excludeStaffId) {
        query += ` AND st.id != $4`;
        params.push(data.excludeStaffId);
      }
      const res = await db.query(query, params);
      if (res.rows.length > 0) {
        duplicateFields.push('name_dob');
        reasons.push(`A staff member with name '${data.name}' and DOB '${data.dateOfBirth}' already exists.`);
      }
    }

    // 3. Check duplicate phone if provided
    if (data.phone && data.phone.trim()) {
      const cleanPhone = data.phone.trim();
      let query = `
        SELECT st.id, p.full_name, p.phone 
        FROM staff st
        JOIN profiles p ON p.id = st.profile_id
        WHERE st.institution_id = $1 AND p.phone = $2 AND st.deleted_at IS NULL
      `;
      const params: any[] = [institutionId, cleanPhone];
      if (data.excludeStaffId) {
        query += ` AND st.id != $3`;
        params.push(data.excludeStaffId);
      }
      const res = await db.query(query, params);
      if (res.rows.length > 0) {
        duplicateFields.push('phone');
        reasons.push(`A staff member with phone number '${cleanPhone}' already exists (${res.rows[0].full_name}).`);
      }
    }

    return {
      isDuplicate: duplicateFields.length > 0,
      duplicateFields,
      reasons,
    };
  }

  async markAllStaffPresent(
    institutionId: string,
    actorId: string,
    attendanceDate: string
  ): Promise<{ markedCount: number }> {
    const activeStaff = await db.query(
      `SELECT id FROM staff 
       WHERE institution_id = $1 AND employment_status = 'active' AND deleted_at IS NULL`,
      [institutionId]
    );

    let count = 0;
    for (const row of activeStaff.rows) {
      await this.upsertStaffAttendance({
        institutionId,
        staffId: row.id,
        attendanceDate,
        status: 'present',
        remarks: 'Batch marked present',
        markedBy: actorId,
      });
      count++;
    }
    return { markedCount: count };
  }

  async getHRReportSummary(institutionId: string): Promise<{
    headcount: {
      total: number;
      active: number;
      onLeave: number;
      teaching: number;
      nonTeaching: number;
    };
    byDepartment: Array<{ name: string; count: number }>;
    byDesignation: Array<{ name: string; count: number }>;
    experienceDistribution: {
      under2Years: number;
      twoToFiveYears: number;
      fiveToTenYears: number;
      over10Years: number;
    };
    leaveSummary: {
      totalRequests: number;
      pendingRequests: number;
      approvedRequests: number;
      rejectedRequests: number;
    };
  }> {
    // 1. Staff metrics
    const staffRes = await db.query(
      `SELECT 
         count(*)::int as total,
         count(*) FILTER (WHERE employment_status = 'active')::int as active,
         count(*) FILTER (WHERE employment_status = 'on_leave')::int as on_leave,
         count(*) FILTER (WHERE is_teaching_staff = true OR staff_type = 'teaching')::int as teaching,
         count(*) FILTER (WHERE is_teaching_staff = false OR staff_type = 'non_teaching')::int as non_teaching,
         count(*) FILTER (WHERE COALESCE(experience_years, 0) < 2)::int as under_2,
         count(*) FILTER (WHERE COALESCE(experience_years, 0) >= 2 AND COALESCE(experience_years, 0) < 5)::int as two_to_five,
         count(*) FILTER (WHERE COALESCE(experience_years, 0) >= 5 AND COALESCE(experience_years, 0) <= 10)::int as five_to_ten,
         count(*) FILTER (WHERE COALESCE(experience_years, 0) > 10)::int as over_10
       FROM staff
       WHERE institution_id = $1 AND deleted_at IS NULL`,
      [institutionId]
    );
    const s = staffRes.rows[0] || {};

    // 2. By Department
    const deptRes = await db.query(
      `SELECT COALESCE(d.name, 'Unassigned') as name, count(st.id)::int as count
       FROM staff st
       LEFT JOIN departments d ON d.id = st.department_id
       WHERE st.institution_id = $1 AND st.deleted_at IS NULL
       GROUP BY d.name
       ORDER BY count DESC`,
      [institutionId]
    );

    // 3. By Designation
    const desigRes = await db.query(
      `SELECT COALESCE(des.name, 'Unassigned') as name, count(st.id)::int as count
       FROM staff st
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE st.institution_id = $1 AND st.deleted_at IS NULL
       GROUP BY des.name
       ORDER BY count DESC`,
      [institutionId]
    );

    // 4. Leave summary
    const leaveRes = await db.query(
      `SELECT 
         count(*)::int as total,
         count(*) FILTER (WHERE status = 'pending')::int as pending,
         count(*) FILTER (WHERE status = 'approved')::int as approved,
         count(*) FILTER (WHERE status = 'rejected')::int as rejected
       FROM leave_requests
       WHERE institution_id = $1`,
      [institutionId]
    );
    const l = leaveRes.rows[0] || {};

    return {
      headcount: {
        total: s.total || 0,
        active: s.active || 0,
        onLeave: s.on_leave || 0,
        teaching: s.teaching || 0,
        nonTeaching: s.non_teaching || 0,
      },
      byDepartment: deptRes.rows,
      byDesignation: desigRes.rows,
      experienceDistribution: {
        under2Years: s.under_2 || 0,
        twoToFiveYears: s.two_to_five || 0,
        fiveToTenYears: s.five_to_ten || 0,
        over10Years: s.over_10 || 0,
      },
      leaveSummary: {
        totalRequests: l.total || 0,
        pendingRequests: l.pending || 0,
        approvedRequests: l.approved || 0,
        rejectedRequests: l.rejected || 0,
      },
    };
  }
}
