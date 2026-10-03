import { Request, Response } from 'express';
import { z } from 'zod';
import { HrmsService } from './hrms.service';
import { sendSuccess, sendError } from '../../utils/api-response';

const hrmsService = new HrmsService();

// Validation Schemas
const onboardStaffSchema = z.object({
  profileId: z.string().uuid('profileId must be a valid UUID'),
  employeeCode: z.string().min(1, 'employeeCode is required'),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  isTeachingStaff: z.boolean().optional(),
  dateOfJoining: z.string().optional(),
  payrollReference: z.string().optional().nullable(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
});

const updateStaffSchema = z.object({
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  employmentStatus: z.enum(['active', 'on_leave', 'suspended', 'resigned', 'terminated']).optional(),
  payrollReference: z.string().optional().nullable(),
  isTeachingStaff: z.boolean().optional(),
});

const createDesignationSchema = z.object({
  name: z.string().min(1, 'Designation name is required'),
});

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required'),
  departmentType: z.string().optional().default('academic'),
});

const checkDuplicateSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  excludeStaffId: z.string().optional(),
});

const createLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Leave type name is required'),
  maxDaysPerYear: z.number().int().positive().optional().nullable(),
});

const applyLeaveSchema = z.object({
  staffId: z.string().uuid('staffId must be a valid UUID'),
  leaveTypeId: z.string().uuid('leaveTypeId must be a valid UUID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format'),
  reason: z.string().optional().nullable(),
});

const actionLeaveSchema = z.object({
  action: z.enum(['approved', 'rejected']),
  remarks: z.string().optional().nullable(),
});

const markAttendanceSchema = z.object({
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'attendanceDate must be in YYYY-MM-DD format'),
  records: z.array(
    z.object({
      staffId: z.string().uuid(),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      remarks: z.string().optional().nullable(),
    })
  ).min(1, 'At least one attendance record is required'),
});

export class HrmsController {
  // ==========================================
  // 1. DESIGNATIONS
  // ==========================================

  async listDesignations(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const designations = await hrmsService.listDesignations(institutionId);
      sendSuccess(res, designations, 'Designations retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createDesignation(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const parsed = createDesignationSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const designation = await hrmsService.createDesignation(institutionId, parsed.data.name, actorId);
      sendSuccess(res, designation, 'Designation created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async deleteDesignation(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const id = req.params.id as string;

      await hrmsService.deleteDesignation(institutionId, id, actorId);
      sendSuccess(res, { deleted: true }, 'Designation deleted successfully');
    } catch (error: any) {
      if (error.message.includes('Cannot delete')) {
        sendError(res, error.message, 409);
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  async listDepartments(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const departments = await hrmsService.listDepartments(institutionId);
      sendSuccess(res, departments, 'Departments retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createDepartment(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const parsed = createDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const dept = await hrmsService.createDepartment(
        institutionId,
        parsed.data.name,
        parsed.data.code,
        parsed.data.departmentType,
        actorId
      );
      sendSuccess(res, dept, 'Department created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async deleteDepartment(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const id = req.params.id as string;

      await hrmsService.deleteDepartment(institutionId, id, actorId);
      sendSuccess(res, { deleted: true }, 'Department deleted successfully');
    } catch (error: any) {
      if (error.message.includes('Cannot delete')) {
        sendError(res, error.message, 409);
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  // ==========================================
  // 2. STAFF DIRECTORY & ONBOARDING
  // ==========================================

  async listStaff(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const { departmentId, designationId, employmentStatus, isTeachingStaff, search } = req.query;

      const staff = await hrmsService.listStaff(institutionId, {
        departmentId: departmentId ? String(departmentId) : undefined,
        designationId: designationId ? String(designationId) : undefined,
        employmentStatus: employmentStatus ? String(employmentStatus) : undefined,
        isTeachingStaff: isTeachingStaff !== undefined ? isTeachingStaff === 'true' : undefined,
        search: search ? String(search) : undefined,
      });

      sendSuccess(res, staff, 'Staff directory retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getStaffDetails(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const id = req.params.id as string;

      const details = await hrmsService.getStaffDetails(institutionId, id);
      sendSuccess(res, details, 'Staff details retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async onboardStaff(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';

      const parsed = onboardStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const staff = await hrmsService.onboardStaff(institutionId, actorId, parsed.data);
      sendSuccess(res, staff, 'Staff member onboarded successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async updateStaff(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const id = req.params.id as string;

      const parsed = updateStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const updated = await hrmsService.updateStaff(institutionId, actorId, id, parsed.data);
      sendSuccess(res, updated, 'Staff member updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async deleteStaff(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const id = req.params.id as string;

      await hrmsService.softDeleteStaff(institutionId, actorId, id);
      sendSuccess(res, { deleted: true }, 'Staff member removed successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ==========================================
  // 3. LEAVE MANAGEMENT
  // ==========================================

  async listLeaveTypes(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const types = await hrmsService.listLeaveTypes(institutionId);
      sendSuccess(res, types, 'Leave types retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createLeaveType(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';

      const parsed = createLeaveTypeSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const lt = await hrmsService.createLeaveType(
        institutionId,
        actorId,
        parsed.data.name,
        parsed.data.maxDaysPerYear ?? null
      );
      sendSuccess(res, lt, 'Leave type created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async listLeaveRequests(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const { staffId, status, startDate, endDate } = req.query;

      const leaves = await hrmsService.listLeaveRequests(institutionId, {
        staffId: staffId ? String(staffId) : undefined,
        status: status ? String(status) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });

      sendSuccess(res, leaves, 'Leave requests retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async applyLeave(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';

      const parsed = applyLeaveSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const request = await hrmsService.applyLeave(institutionId, actorId, parsed.data);
      sendSuccess(res, request, 'Leave request submitted successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async actionLeaveRequest(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const id = req.params.id as string;

      const parsed = actionLeaveSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const updated = await hrmsService.actionLeaveRequest(
        institutionId,
        actorId,
        id,
        parsed.data.action,
        parsed.data.remarks
      );
      sendSuccess(res, updated, `Leave request ${parsed.data.action} successfully`);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async getStaffLeaveBalance(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const staffId = req.params.staffId as string;
      const { year } = req.query;

      const balance = await hrmsService.getStaffLeaveBalance(
        institutionId,
        staffId,
        year ? parseInt(String(year), 10) : undefined
      );
      sendSuccess(res, balance, 'Staff leave balance retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ==========================================
  // 4. STAFF ATTENDANCE
  // ==========================================

  async markStaffAttendance(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';

      const parsed = markAttendanceSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const result = await hrmsService.markStaffAttendanceBatch(
        institutionId,
        actorId,
        parsed.data.attendanceDate,
        parsed.data.records
      );
      sendSuccess(res, result, 'Staff attendance recorded successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async getStaffAttendance(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const { date, staffId, startDate, endDate } = req.query;

      if (date) {
        const records = await hrmsService.getStaffAttendanceByDate(institutionId, String(date));
        sendSuccess(res, records, 'Staff attendance retrieved successfully');
        return;
      }

      if (staffId && startDate && endDate) {
        const history = await hrmsService.getStaffAttendanceHistory(
          institutionId,
          String(staffId),
          String(startDate),
          String(endDate)
        );
        sendSuccess(res, history, 'Staff attendance history retrieved successfully');
        return;
      }

      sendError(res, 'Please provide ?date=YYYY-MM-DD or (?staffId=... & ?startDate=... & ?endDate=...)', 400);
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getMonthlyAttendanceSummary(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const { month } = req.query;

      if (!month) {
        sendError(res, 'month query parameter is required (YYYY-MM)', 400);
        return;
      }

      const summary = await hrmsService.getMonthlyAttendanceAggregates(institutionId, String(month));
      sendSuccess(res, summary, 'Monthly attendance summary retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ==========================================
  // 5. FACULTY WORKLOAD
  // ==========================================

  async getFacultyWorkloads(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const { academicYearId } = req.query;

      if (!academicYearId) {
        sendError(res, 'academicYearId query parameter is required', 400);
        return;
      }

      const workloads = await hrmsService.listFacultyWorkloads(institutionId, String(academicYearId));
      sendSuccess(res, workloads, 'Faculty workloads retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async computeStaffWorkload(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const staffId = req.params.staffId as string;
      const { academicYearId } = req.body;

      if (!academicYearId) {
        sendError(res, 'academicYearId is required in request body', 400);
        return;
      }

      const result = await hrmsService.computeStaffWorkload(
        institutionId,
        staffId,
        String(academicYearId)
      );
      sendSuccess(res, result, 'Staff workload calculated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ==========================================
  // 6. PAYROLL EXPORT (Section 14 Boundary)
  // ==========================================

  async getPayrollExport(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const { month } = req.query;

      if (!month) {
        sendError(res, 'month query parameter is required (YYYY-MM)', 400);
        return;
      }

      const exportData = await hrmsService.generatePayrollExport(institutionId, String(month));
      sendSuccess(res, exportData, 'Payroll export generated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ==========================================
  // 7. DUPLICATES, BATCH ATTENDANCE & REPORTS
  // ==========================================

  async checkDuplicateStaff(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const parsed = checkDuplicateSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0].message, 400);
        return;
      }

      const result = await hrmsService.checkDuplicateStaff(institutionId, parsed.data);
      sendSuccess(res, result, 'Duplicate check completed');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async markAllStaffPresent(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const { attendanceDate } = req.body;

      if (!attendanceDate) {
        sendError(res, 'attendanceDate is required', 400);
        return;
      }

      const result = await hrmsService.markAllStaffPresent(institutionId, actorId, String(attendanceDate));
      sendSuccess(res, result, `Marked ${result.markedCount} staff members present`);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async getHRReportSummary(req: Request, res: Response) {
    try {
      const institutionId = req.institutionId!;
      const summary = await hrmsService.getHRReportSummary(institutionId);
      sendSuccess(res, summary, 'HR reports summary retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
}

export const hrmsController = new HrmsController();
