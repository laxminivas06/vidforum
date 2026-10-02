import { attendanceRepository } from './attendance.repository';
import { AuditDispatcher } from '../../common/audit-dispatcher';
import { notificationService } from '../notifications/notification.service';
import { db } from '../../config/database';

export class AttendanceService {
  // ================= SESSIONS =================
  async getOrCreateSession(
    institutionId: string,
    data: {
      sectionId: string;
      sessionDate: string;
      subjectId?: string | null;
      staffId?: string | null;
      periodNumber?: number | null;
    },
    caller?: { id: string; role: string }
  ) {
    if (!data.sectionId) throw new Error('sectionId is required');
    if (!data.sessionDate) throw new Error('sessionDate is required');

    // Rule 8: If caller is TEACHER, verify they are assigned to this section
    if (caller && (caller.role === 'TEACHER' || caller.role === 'FACULTY')) {
      const hasAccess = await attendanceRepository.verifyFacultySectionAccess(institutionId, caller.id, data.sectionId);
      if (!hasAccess) {
        throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only manage attendance for assigned sections');
      }
    }

    const session = await attendanceRepository.getOrCreateSession(institutionId, data);

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'attendance.session_created',
        resource: 'attendance_sessions',
        resourceId: session.id,
        institutionId,
        newValue: {
          sectionId: data.sectionId,
          sessionDate: data.sessionDate,
          subjectId: data.subjectId,
          periodNumber: data.periodNumber,
        },
      });
    }

    return session;
  }

  async getSessionById(institutionId: string, sessionId: string) {
    const session = await attendanceRepository.getSessionById(institutionId, sessionId);
    if (!session) throw new Error('Attendance session not found');
    return session;
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
  ) {
    return attendanceRepository.listSessions(institutionId, filters);
  }

  // ================= ROSTER & ROLL CALL =================
  async getSectionRoster(
    institutionId: string,
    sectionId: string,
    sessionDate: string,
    sessionId?: string | null,
    caller?: { id: string; role: string }
  ) {
    if (!sectionId) throw new Error('sectionId is required');
    if (!sessionDate) throw new Error('sessionDate is required');

    // Rule 8: If caller is TEACHER, verify section allocation
    if (caller && (caller.role === 'TEACHER' || caller.role === 'FACULTY')) {
      const hasAccess = await attendanceRepository.verifyFacultySectionAccess(institutionId, caller.id, sectionId);
      if (!hasAccess) {
        throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only view roster for assigned sections');
      }
    }

    return attendanceRepository.getSectionRosterForSession(institutionId, sectionId, sessionDate, sessionId);
  }

  async submitRollCall(
    institutionId: string,
    sessionId: string,
    records: Array<{ studentId: string; status: string; remarks?: string }>,
    caller: { id: string; role: string }
  ) {
    if (!sessionId) throw new Error('sessionId is required');
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('Attendance records array cannot be empty');
    }

    const session = await attendanceRepository.getSessionById(institutionId, sessionId);
    if (!session) throw new Error('Attendance session not found');

    // Rule 8: If caller is TEACHER, verify section allocation
    if (caller.role === 'TEACHER' || caller.role === 'FACULTY') {
      const hasAccess = await attendanceRepository.verifyFacultySectionAccess(institutionId, caller.id, session.sectionId);
      if (!hasAccess) {
        throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only submit roll-call for assigned sections');
      }
    }

    const result = await attendanceRepository.recordRollCall(institutionId, sessionId, records, caller.id);

    // Audit event dispatch
    await AuditDispatcher.dispatch({
      actorId: caller.id,
      action: 'attendance.roll_call_submitted',
      resource: 'attendance_sessions',
      resourceId: sessionId,
      institutionId,
      newValue: {
        count: result.count,
        sessionDate: result.sessionDate,
        absentCount: result.absentStudentIds.length,
      },
    });

    // Notifications for Absent Students (notify parent)
    if (result.absentStudentIds.length > 0) {
      for (const studentId of result.absentStudentIds) {
        try {
          const parentRes = await db.query(
            `SELECT p.profile_id, s.first_name, s.last_name
             FROM student_parents sp
             JOIN parents p ON p.id = sp.parent_id
             JOIN students s ON s.id = sp.student_id
             WHERE sp.student_id = $1 AND p.profile_id IS NOT NULL`,
            [studentId]
          );

          for (const parent of parentRes.rows) {
            await notificationService.sendNotification({
              institutionId,
              recipientUserId: parent.profile_id,
              title: 'Attendance Alert: Student Absent',
              message: `Your child ${parent.first_name} ${parent.last_name} was marked absent on ${result.sessionDate}.`,
              type: 'attendance_alert',
              metadata: {
                studentId,
                sessionId,
                sessionDate: result.sessionDate,
              },
            });
          }
        } catch (e: any) {
          console.warn('Failed to send absent notification for student', studentId, e.message);
        }
      }
    }

    return result;
  }

  // ================= STUDENT ATTENDANCE STATS =================
  async getStudentAttendanceSummary(
    institutionId: string,
    studentId: string,
    filters?: { startDate?: string; endDate?: string; subjectId?: string },
    caller?: { id: string; role: string }
  ) {
    if (!studentId) throw new Error('studentId is required');

    // Scoping checks
    if (caller) {
      if (caller.role === 'STUDENT') {
        const check = await db.query('SELECT id FROM students WHERE id = $1 AND user_id = $2 AND institution_id = $3', [studentId, caller.id, institutionId]);
        if (check.rows.length === 0) {
          throw new Error('RESOURCE_ACCESS_DENIED: Student can only view own attendance');
        }
      } else if (caller.role === 'PARENT') {
        const check = await db.query(
          `SELECT 1 FROM student_parents sp
           JOIN parents p ON p.id = sp.parent_id
           WHERE sp.student_id = $1 AND p.profile_id = $2 AND p.institution_id = $3`,
          [studentId, caller.id, institutionId]
        );
        if (check.rows.length === 0) {
          throw new Error('RESOURCE_ACCESS_DENIED: Parent can only view linked children attendance');
        }
      }
    }

    const summary = await attendanceRepository.getStudentAttendanceSummary(institutionId, studentId, filters);

    // If attendance is critically low (< 75%), notify if caller is student or parent
    if (summary.isLowAttendance && summary.totalSessions >= 5) {
      summary.warning = `Attendance is ${summary.percentage}%, which is below the mandatory 75% minimum threshold.`;
    }

    return summary;
  }

  async getScopedAttendance(institutionId: string, caller: { id: string; role: string }) {
    if (caller.role === 'STUDENT') {
      const studentRes = await db.query('SELECT id FROM students WHERE user_id = $1 AND institution_id = $2', [caller.id, institutionId]);
      if (studentRes.rows.length === 0) throw new Error('Student master record not found for user');
      const studentId = studentRes.rows[0].id;
      const summary = await attendanceRepository.getStudentAttendanceSummary(institutionId, studentId);
      return { role: 'STUDENT', studentId, summary };
    }

    if (caller.role === 'PARENT') {
      const childrenRes = await db.query(
        `SELECT s.id, s.first_name as "firstName", s.last_name as "lastName", s.admission_number as "admissionNumber",
                c.name as "className", sec.name as "sectionName"
         FROM student_parents sp
         JOIN parents p ON p.id = sp.parent_id
         JOIN students s ON s.id = sp.student_id
         LEFT JOIN classes c ON c.id = s.current_class_id
         LEFT JOIN sections sec ON sec.id = s.current_section_id
         WHERE p.profile_id = $1 AND p.institution_id = $2 AND s.status = 'active'`,
        [caller.id, institutionId]
      );

      const childrenSummaries = [];
      for (const child of childrenRes.rows) {
        const summary = await attendanceRepository.getStudentAttendanceSummary(institutionId, child.id);
        childrenSummaries.push({
          child,
          summary,
        });
      }
      return { role: 'PARENT', children: childrenSummaries };
    }

    if (caller.role === 'TEACHER' || caller.role === 'FACULTY') {
      // Return sections assigned to this teacher
      const sectionsRes = await db.query(
        `SELECT DISTINCT sec.id as "sectionId", sec.name as "sectionName", c.name as "className"
         FROM faculty_assignments fa
         JOIN staff s ON s.id = fa.staff_id
         JOIN sections sec ON sec.id = fa.section_id
         JOIN classes c ON c.id = sec.class_id
         WHERE s.profile_id = $1 AND s.institution_id = $2
         UNION
         SELECT DISTINCT sec.id as "sectionId", sec.name as "sectionName", c.name as "className"
         FROM sections sec
         JOIN staff s ON s.id = sec.class_teacher_staff_id
         JOIN classes c ON c.id = sec.class_id
         WHERE s.profile_id = $1 AND s.institution_id = $2`,
        [caller.id, institutionId]
      );

      return { role: 'TEACHER', assignedSections: sectionsRes.rows };
    }

    // Default admin view
    const stats = await attendanceRepository.getInstitutionAttendanceStats(institutionId);
    return { role: caller.role, institutionStats: stats };
  }

  // ================= STUDENT LEAVE REQUESTS =================
  async applyStudentLeave(
    institutionId: string,
    data: {
      studentId: string;
      startDate: string;
      endDate: string;
      reason: string;
    },
    caller: { id: string; role: string }
  ) {
    if (!data.studentId) throw new Error('studentId is required');
    if (!data.startDate) throw new Error('startDate is required');
    if (!data.endDate) throw new Error('endDate is required');
    if (!data.reason || !data.reason.trim()) throw new Error('reason is required');

    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error('endDate must be greater than or equal to startDate');
    }

    // Rule 9 & 10 scoping: verify caller is either the student or linked parent
    if (caller.role === 'STUDENT') {
      const sRes = await db.query('SELECT id FROM students WHERE id = $1 AND user_id = $2 AND institution_id = $3', [data.studentId, caller.id, institutionId]);
      if (sRes.rows.length === 0) throw new Error('RESOURCE_ACCESS_DENIED: Student can only apply leave for themselves');
    } else if (caller.role === 'PARENT') {
      const pRes = await db.query(
        `SELECT 1 FROM student_parents sp
         JOIN parents p ON p.id = sp.parent_id
         WHERE sp.student_id = $1 AND p.profile_id = $2 AND p.institution_id = $3`,
        [data.studentId, caller.id, institutionId]
      );
      if (pRes.rows.length === 0) throw new Error('RESOURCE_ACCESS_DENIED: Parent can only apply leave for linked children');
    }

    const leave = await attendanceRepository.createStudentLeaveRequest(institutionId, {
      studentId: data.studentId,
      requestedBy: caller.id,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    });

    await AuditDispatcher.dispatch({
      actorId: caller.id,
      action: 'attendance.leave_applied',
      resource: 'student_leave_requests',
      resourceId: leave.id,
      institutionId,
      newValue: {
        studentId: data.studentId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      },
    });

    return leave;
  }

  async listStudentLeaves(
    institutionId: string,
    filters?: { studentId?: string; status?: string; classId?: string; sectionId?: string },
    caller?: { id: string; role: string }
  ) {
    // If student, force own studentId
    if (caller?.role === 'STUDENT') {
      const sRes = await db.query('SELECT id FROM students WHERE user_id = $1 AND institution_id = $2', [caller.id, institutionId]);
      if (sRes.rows.length === 0) return [];
      filters = { ...filters, studentId: sRes.rows[0].id };
    }

    return attendanceRepository.listStudentLeaveRequests(institutionId, filters);
  }

  async decideStudentLeave(
    institutionId: string,
    leaveId: string,
    decision: 'approved' | 'rejected',
    caller: { id: string; role: string },
    decisionNotes?: string
  ) {
    if (!['approved', 'rejected'].includes(decision)) {
      throw new Error("Decision must be either 'approved' or 'rejected'");
    }

    // Role check: Only TEACHER, INSTITUTION_ADMIN, or SUPER_ADMIN can decide leaves
    const allowedRoles = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER', 'FACULTY', 'PRINCIPAL', 'STAFF'];
    if (!allowedRoles.includes(caller.role)) {
      throw new Error('RESOURCE_ACCESS_DENIED: Only faculty or administration can decide leave requests');
    }

    const updated = await attendanceRepository.decideStudentLeaveRequest(
      institutionId,
      leaveId,
      decision,
      caller.id,
      decisionNotes
    );

    await AuditDispatcher.dispatch({
      actorId: caller.id,
      action: 'attendance.leave_decided',
      resource: 'student_leave_requests',
      resourceId: leaveId,
      institutionId,
      newValue: {
        decision,
        decidedBy: caller.id,
        decisionNotes,
      },
    });

    // Notify requester (Student/Parent) of decision
    try {
      await notificationService.sendNotification({
        institutionId,
        recipientUserId: updated.requestedBy,
        title: `Leave Request ${decision.toUpperCase()}`,
        message: `Your leave request for ${updated.startDate} to ${updated.endDate} has been ${decision}.`,
        type: 'leave_decision',
        metadata: {
          leaveId,
          decision,
          notes: decisionNotes,
        },
      });
    } catch (e: any) {
      console.warn('Failed to send leave decision notification', e.message);
    }

    return updated;
  }

  // ================= STAFF ATTENDANCE =================
  async recordStaffAttendance(
    institutionId: string,
    records: Array<{ staffId: string; attendanceDate: string; status: string }>,
    caller: { id: string; role: string }
  ) {
    // Only Admin or HR staff can record staff attendance
    const allowed = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HR_MANAGER', 'PRINCIPAL'];
    if (!allowed.includes(caller.role)) {
      throw new Error('RESOURCE_ACCESS_DENIED: Only administration can record staff attendance');
    }

    return attendanceRepository.recordStaffAttendance(institutionId, records, caller.id);
  }

  async listStaffAttendance(
    institutionId: string,
    filters?: { staffId?: string; attendanceDate?: string; startDate?: string; endDate?: string }
  ) {
    return attendanceRepository.listStaffAttendance(institutionId, filters);
  }

  // ================= INSTITUTION SUMMARY =================
  async getInstitutionSummary(institutionId: string, date?: string) {
    return attendanceRepository.getInstitutionAttendanceStats(institutionId, date);
  }
}

export const attendanceService = new AttendanceService();
