import { db } from '../../config/database';
import {
  HrmsRepository,
  StaffRecord,
  DesignationRecord,
  LeaveTypeRecord,
  LeaveRequestRecord,
  StaffAttendanceRecord,
  StaffEmploymentHistory,
} from './hrms.repository';
import { AuditDispatcher } from '../../common/audit-dispatcher';
import { notificationService } from '../notifications/notification.service';

export class HrmsService {
  constructor(private repo: HrmsRepository = new HrmsRepository()) {}

  // ==========================================
  // 1. DESIGNATIONS
  // ==========================================

  async listDesignations(institutionId: string): Promise<DesignationRecord[]> {
    return this.repo.listDesignations(institutionId);
  }

  async createDesignation(institutionId: string, name: string, actorId: string): Promise<DesignationRecord> {
    if (!name || !name.trim()) {
      throw new Error('Designation name is required');
    }

    const designation = await this.repo.createDesignation(institutionId, name);

    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: 'hrms.designation_created',
      resource: 'designations',
      resourceId: designation.id,
      newValue: { name: designation.name },
    });

    return designation;
  }

  // ==========================================
  // 2. STAFF ONBOARDING & MANAGEMENT
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
    return this.repo.listStaff(institutionId, filters);
  }

  async getStaffDetails(
    institutionId: string,
    staffId: string
  ): Promise<{
    staff: StaffRecord;
    employmentHistory: StaffEmploymentHistory[];
  }> {
    const staff = await this.repo.getStaffById(institutionId, staffId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    const employmentHistory = await this.repo.getEmploymentHistory(staffId);
    return { staff, employmentHistory };
  }

  async onboardStaff(
    institutionId: string,
    actorId: string,
    data: {
      profileId: string;
      employeeCode: string;
      departmentId?: string | null;
      designationId?: string | null;
      isTeachingStaff?: boolean;
      dateOfJoining?: string;
      payrollReference?: string | null;
      qualification?: string;
      specialization?: string;
    }
  ): Promise<StaffRecord> {
    if (!data.profileId || !data.employeeCode) {
      throw new Error('profileId and employeeCode are required');
    }

    // 1. Verify profile exists in this institution
    const profileRes = await db.query(
      `SELECT id, full_name, email FROM profiles WHERE id = $1 AND (default_institution_id = $2 OR default_institution_id IS NULL)`,
      [data.profileId, institutionId]
    );
    if (profileRes.rows.length === 0) {
      throw new Error('Associated profile not found in this institution');
    }

    // 2. Verify unique employee code within institution
    const existingCode = await this.repo.findStaffByEmployeeCode(institutionId, data.employeeCode);
    if (existingCode) {
      throw new Error(`Employee code '${data.employeeCode}' already exists in this institution`);
    }

    // 3. Verify profile not already enrolled as staff
    const existingStaff = await this.repo.findStaffByProfileId(institutionId, data.profileId);
    if (existingStaff) {
      throw new Error('This profile is already registered as a staff member');
    }

    const joiningDate = data.dateOfJoining || new Date().toISOString().split('T')[0];

    // 4. Create Staff Record
    const staff = await this.repo.createStaff({
      institutionId,
      profileId: data.profileId,
      employeeCode: data.employeeCode,
      departmentId: data.departmentId,
      designationId: data.designationId,
      isTeachingStaff: data.isTeachingStaff ?? true,
      dateOfJoining: joiningDate,
      payrollReference: data.payrollReference,
    });

    // 5. Initial Employment Record
    await this.repo.recordEmploymentHistory({
      staffId: staff.id,
      departmentId: staff.department_id,
      designationId: staff.designation_id,
      effectiveFrom: joiningDate,
    });

    // 6. Auto-link to faculty if teaching staff (Decision D3)
    if (staff.is_teaching_staff) {
      await this.repo.linkFacultyRecord(
        institutionId,
        staff.id,
        data.qualification || 'Master of Education / Sciences',
        data.specialization || 'Core Academics'
      );
    }

    // 7. Audit Log
    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: 'hrms.staff_created',
      resource: 'staff',
      resourceId: staff.id,
      newValue: {
        employeeCode: staff.employee_code,
        profileId: staff.profile_id,
        isTeachingStaff: staff.is_teaching_staff,
      },
    });

    return staff;
  }

  async updateStaff(
    institutionId: string,
    actorId: string,
    staffId: string,
    data: {
      departmentId?: string | null;
      designationId?: string | null;
      employmentStatus?: 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';
      payrollReference?: string | null;
      isTeachingStaff?: boolean;
    }
  ): Promise<StaffRecord> {
    const existing = await this.repo.getStaffById(institutionId, staffId);
    if (!existing) {
      throw new Error('Staff member not found');
    }

    const deptChanged = data.departmentId !== undefined && data.departmentId !== existing.department_id;
    const desigChanged = data.designationId !== undefined && data.designationId !== existing.designation_id;

    // If role/department changed, historize in staff_employment
    if (deptChanged || desigChanged) {
      const today = new Date().toISOString().split('T')[0];
      await this.repo.closeActiveEmploymentHistory(staffId, today);
      await this.repo.recordEmploymentHistory({
        staffId,
        departmentId: data.departmentId !== undefined ? data.departmentId : existing.department_id,
        designationId: data.designationId !== undefined ? data.designationId : existing.designation_id,
        effectiveFrom: today,
      });
    }

    // If promoted to teaching staff, ensure faculty row exists (Decision D3)
    if (data.isTeachingStaff && !existing.is_teaching_staff) {
      await this.repo.linkFacultyRecord(institutionId, staffId);
    }

    const updated = await this.repo.updateStaff(institutionId, staffId, data);
    if (!updated) {
      throw new Error('Failed to update staff member');
    }

    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: 'hrms.staff_updated',
      resource: 'staff',
      resourceId: staffId,
      oldValue: {
        departmentId: existing.department_id,
        designationId: existing.designation_id,
        employmentStatus: existing.employment_status,
      },
      newValue: data,
    });

    return updated;
  }

  async softDeleteStaff(institutionId: string, actorId: string, staffId: string): Promise<boolean> {
    const existing = await this.repo.getStaffById(institutionId, staffId);
    if (!existing) {
      throw new Error('Staff member not found');
    }

    const success = await this.repo.softDeleteStaff(institutionId, staffId);

    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: 'hrms.staff_deleted',
      resource: 'staff',
      resourceId: staffId,
      oldValue: { employeeCode: existing.employee_code, employmentStatus: existing.employment_status },
    });

    return success;
  }

  // ==========================================
  // 3. LEAVE MANAGEMENT & APPROVAL WORKFLOW
  // ==========================================

  async listLeaveTypes(institutionId: string): Promise<LeaveTypeRecord[]> {
    return this.repo.listLeaveTypes(institutionId);
  }

  async createLeaveType(
    institutionId: string,
    actorId: string,
    name: string,
    maxDaysPerYear: number | null
  ): Promise<LeaveTypeRecord> {
    if (!name || !name.trim()) {
      throw new Error('Leave type name is required');
    }

    const lt = await this.repo.createLeaveType(institutionId, name, maxDaysPerYear);

    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: 'hrms.leave_type_created',
      resource: 'leave_types',
      resourceId: lt.id,
      newValue: { name: lt.name, maxDaysPerYear: lt.max_days_per_year },
    });

    return lt;
  }

  async applyLeave(
    institutionId: string,
    actorId: string,
    data: {
      staffId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason?: string | null;
    }
  ): Promise<LeaveRequestRecord> {
    // 1. Verify staff exists
    const staff = await this.repo.getStaffById(institutionId, data.staffId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // 2. Verify leave type
    const leaveType = await this.repo.getLeaveTypeById(institutionId, data.leaveTypeId);
    if (!leaveType) {
      throw new Error('Leave type not found');
    }

    // 3. Verify date validity
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid start or end date');
    }
    if (end < start) {
      throw new Error('End date must be greater than or equal to start date');
    }

    // Calculate total days (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 4. Check overlapping leaves
    const hasOverlap = await this.repo.checkOverlappingLeave(
      institutionId,
      data.staffId,
      data.startDate,
      data.endDate
    );
    if (hasOverlap) {
      throw new Error('Staff member already has a pending or approved leave during this date period');
    }

    // 5. Check quota if leave type has a max days limit
    if (leaveType.max_days_per_year !== null) {
      const year = start.getFullYear();
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const usage = await this.repo.getStaffLeaveUsageByYear(
        institutionId,
        data.staffId,
        yearStart,
        yearEnd
      );
      const currentTypeUsage = usage.find(u => u.leave_type_id === leaveType.id);
      const daysTaken = currentTypeUsage?.days_taken || 0;
      if (daysTaken + totalDays > leaveType.max_days_per_year) {
        throw new Error(
          `Requested ${totalDays} days exceeds annual leave quota (${leaveType.max_days_per_year} days max, ${daysTaken} already taken)`
        );
      }
    }

    // 6. Create request
    const request = await this.repo.createLeaveRequest({
      institutionId,
      staffId: data.staffId,
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays,
      reason: data.reason || null,
    });

    // 7. Audit Log
    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: 'hrms.leave_applied',
      resource: 'leave_requests',
      resourceId: request.id,
      newValue: {
        staffId: request.staff_id,
        leaveTypeId: request.leave_type_id,
        startDate: request.start_date,
        endDate: request.end_date,
        totalDays: request.total_days,
      },
    });

    return request;
  }

  async actionLeaveRequest(
    institutionId: string,
    actorId: string,
    requestId: string,
    action: 'approved' | 'rejected',
    remarks?: string | null
  ): Promise<LeaveRequestRecord> {
    const existing = await this.repo.getLeaveRequestById(institutionId, requestId);
    if (!existing) {
      throw new Error('Leave request not found');
    }
    if (existing.status !== 'pending') {
      throw new Error(`Cannot action leave request that is already '${existing.status}'`);
    }

    const updated = await this.repo.updateLeaveRequestAction(
      institutionId,
      requestId,
      action,
      actorId,
      remarks
    );
    if (!updated) {
      throw new Error('Failed to update leave request status');
    }

    // If approved, check if currently active date range
    if (action === 'approved') {
      const today = new Date().toISOString().split('T')[0];
      if (today >= updated.start_date && today <= updated.end_date) {
        await this.repo.updateStaff(institutionId, updated.staff_id, {
          employmentStatus: 'on_leave',
        });
      }
    }

    // Notify staff member
    const staff = await this.repo.getStaffById(institutionId, updated.staff_id);
    if (staff) {
      await notificationService.sendNotification({
        institutionId,
        recipientUserId: staff.profile_id,
        title: `Leave Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your leave request for ${updated.start_date} to ${updated.end_date} has been ${action}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        type: 'status_update',
      });
    }

    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: action === 'approved' ? 'hrms.leave_approved' : 'hrms.leave_rejected',
      resource: 'leave_requests',
      resourceId: requestId,
      oldValue: { status: 'pending' },
      newValue: { status: action, remarks, approvedBy: actorId },
    });

    return updated;
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
    return this.repo.listLeaveRequests(institutionId, filters);
  }

  async getStaffLeaveBalance(
    institutionId: string,
    staffId: string,
    year?: number
  ): Promise<Array<{
    leave_type_id: string;
    leave_type_name: string;
    max_days: number | null;
    days_taken: number;
    days_remaining: number | null;
  }>> {
    const yr = year || new Date().getFullYear();
    const yearStart = `${yr}-01-01`;
    const yearEnd = `${yr}-12-31`;

    const usage = await this.repo.getStaffLeaveUsageByYear(institutionId, staffId, yearStart, yearEnd);
    return usage.map(u => ({
      ...u,
      days_remaining: u.max_days !== null ? Math.max(0, u.max_days - u.days_taken) : null,
    }));
  }

  // ==========================================
  // 4. STAFF ATTENDANCE
  // ==========================================

  async markStaffAttendanceBatch(
    institutionId: string,
    actorId: string,
    attendanceDate: string,
    records: Array<{
      staffId: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      remarks?: string | null;
    }>
  ): Promise<{ markedCount: number; records: StaffAttendanceRecord[] }> {
    if (!attendanceDate) {
      throw new Error('attendanceDate is required');
    }
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('records array must not be empty');
    }

    const savedRecords: StaffAttendanceRecord[] = [];
    for (const r of records) {
      const saved = await this.repo.upsertStaffAttendance({
        institutionId,
        staffId: r.staffId,
        attendanceDate,
        status: r.status,
        remarks: r.remarks,
        markedBy: actorId,
      });
      savedRecords.push(saved);
    }

    await AuditDispatcher.dispatch({
      actorId,
      institutionId,
      action: 'hrms.attendance_recorded',
      resource: 'staff_attendance',
      resourceId: attendanceDate,
      newValue: {
        date: attendanceDate,
        markedCount: savedRecords.length,
      },
    });

    return { markedCount: savedRecords.length, records: savedRecords };
  }

  async getStaffAttendanceByDate(
    institutionId: string,
    attendanceDate: string
  ): Promise<StaffAttendanceRecord[]> {
    return this.repo.getStaffAttendanceByDate(institutionId, attendanceDate);
  }

  async getStaffAttendanceHistory(
    institutionId: string,
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffAttendanceRecord[]> {
    return this.repo.getStaffAttendanceHistory(institutionId, staffId, startDate, endDate);
  }

  async getMonthlyAttendanceAggregates(
    institutionId: string,
    month: string // Format: YYYY-MM
  ) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('month must be in YYYY-MM format');
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const startDate = `${month}-01`;
    // Last day of month
    const lastDay = new Date(year, m, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    return this.repo.getMonthlyAttendanceAggregates(institutionId, startDate, endDate);
  }

  // ==========================================
  // 5. FACULTY WORKLOAD
  // ==========================================

  async computeStaffWorkload(institutionId: string, staffId: string, academicYearId: string) {
    const metrics = await this.repo.computeStaffWorkload(institutionId, staffId, academicYearId);
    const saved = await this.repo.upsertStaffWorkload(
      staffId,
      academicYearId,
      metrics.periodsPerWeek,
      metrics.sectionsCount
    );
    return {
      ...saved,
      subjects_count: metrics.subjectsCount,
      is_overloaded: metrics.periodsPerWeek > 28,
    };
  }

  async listFacultyWorkloads(institutionId: string, academicYearId: string) {
    return this.repo.listFacultyWorkloads(institutionId, academicYearId);
  }

  // ==========================================
  // 6. PAYROLL EXPORT (Section 14 Boundary)
  // ==========================================

  async generatePayrollExport(institutionId: string, month: string) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('month must be in YYYY-MM format');
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, m, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    const attendanceSummary = await this.repo.getMonthlyAttendanceAggregates(
      institutionId,
      startDate,
      endDate
    );

    const exportRows = attendanceSummary.map(staff => {
      const workingDays = staff.total_marked_days || lastDay;
      const payableDays = staff.present_days + staff.late_days + staff.excused_days;
      return {
        employee_code: staff.employee_code,
        full_name: staff.staff_name,
        department: staff.department_name || 'General',
        designation: staff.designation_name || 'Staff Member',
        payroll_reference: staff.payroll_reference || `PAY-${staff.employee_code}`,
        calendar_month: month,
        total_working_days: workingDays,
        days_present: staff.present_days,
        days_absent: staff.absent_days,
        days_late: staff.late_days,
        days_excused: staff.excused_days,
        payable_days: payableDays,
        export_generated_at: new Date().toISOString(),
      };
    });

    return {
      institution_id: institutionId,
      pay_period: month,
      total_employees: exportRows.length,
      employees: exportRows,
    };
  }
}
