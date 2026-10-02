import assert from 'node:assert/strict';
import { db } from '../src/config/database';
import { attendanceService } from '../src/modules/attendance/attendance.service';
import { notificationService } from '../src/modules/notifications/notification.service';

async function runAttendanceTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 2, MODULE 3 TEST SUITE');
  console.log('   Attendance & Leave Management, Scoping & Alerts');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error('     Error:', err.message);
      failed++;
    }
  }

  // 1. Identify active test institution
  const instRes = await db.query(
    "SELECT id, name, code FROM institutions WHERE status = 'active' ORDER BY created_at ASC LIMIT 1"
  );
  assert.ok(instRes.rows.length > 0, 'At least one active institution must exist');
  const institution = instRes.rows[0];
  const instId = institution.id;
  console.log(`  🏢 Testing with Active Institution: [${institution.code}] ${institution.name} (${instId})\n`);

  const suffix = Date.now().toString().slice(-6);

  // Helper to create test profiles
  async function createTestProfile(email: string, fullName: string, roleName: string) {
    const cleanEmail = email.trim().toLowerCase();
    let userRes = await db.query('SELECT id FROM auth.users WHERE LOWER(email) = $1', [cleanEmail]);
    let profileId = userRes.rows[0]?.id;

    if (!profileId) {
      const authRes = await db.query(
        `INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, now(), now())
         RETURNING id`,
        [cleanEmail, JSON.stringify({ full_name: fullName })]
      );
      profileId = authRes.rows[0].id;
    }

    await db.query(
      `INSERT INTO profiles (id, full_name, email, default_institution_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, default_institution_id = EXCLUDED.default_institution_id`,
      [profileId, fullName, cleanEmail, instId]
    );

    const roleRes = await db.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
    if (roleRes.rows.length > 0) {
      await db.query(
        `INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
         VALUES (gen_random_uuid(), $1, $2, $3, '{}', now())
         ON CONFLICT (profile_id, role_id, institution_id) DO NOTHING`,
        [profileId, roleRes.rows[0].id, instId]
      );
    }
    return profileId;
  }

  // Setup Academic Year
  let ayRes = await db.query(
    `SELECT id FROM academic_years WHERE institution_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [instId]
  );
  let academicYearId: string;
  let createdTestAY = false;
  if (ayRes.rows.length > 0) {
    academicYearId = ayRes.rows[0].id;
  } else {
    ayRes = await db.query(
      `INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current)
       VALUES ($1, $2, '2026-06-01', '2027-04-30', false)
       RETURNING id`,
      [instId, `AY 2026-27 Att ${suffix}`]
    );
    academicYearId = ayRes.rows[0].id;
    createdTestAY = true;
  }

  // Setup Department & Classes & Sections
  const deptRes = await db.query(
    `INSERT INTO departments (institution_id, name, code, department_type)
     VALUES ($1, $2, $3, 'academic')
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `Science Dept ${suffix}`, `SCI-${suffix}`]
  );
  const departmentId = deptRes.rows[0].id;

  const classRes = await db.query(
    `INSERT INTO classes (institution_id, name, academic_year_id, department_id, sequence_order)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (institution_id, academic_year_id, department_id, name) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
     RETURNING id`,
    [instId, `Grade 10 Att ${suffix}`, academicYearId, departmentId]
  );
  const classId = classRes.rows[0].id;

  // Section A (Assigned to Faculty)
  const secARes = await db.query(
    `INSERT INTO sections (institution_id, class_id, name, capacity)
     VALUES ($1, $2, 'Section A', 30)
     ON CONFLICT (class_id, name) DO UPDATE SET capacity = EXCLUDED.capacity
     RETURNING id`,
    [instId, classId]
  );
  const sectionAId = secARes.rows[0].id;

  // Section B (Unassigned to Faculty)
  const secBRes = await db.query(
    `INSERT INTO sections (institution_id, class_id, name, capacity)
     VALUES ($1, $2, 'Section B', 30)
     ON CONFLICT (class_id, name) DO UPDATE SET capacity = EXCLUDED.capacity
     RETURNING id`,
    [instId, classId]
  );
  const sectionBId = secBRes.rows[0].id;

  // Setup Subject (Physics)
  const subRes = await db.query(
    `INSERT INTO subjects (institution_id, name, code, is_elective)
     VALUES ($1, 'Physics Att', $2, false)
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `PHY-ATT-${suffix}`]
  );
  const subjectId = subRes.rows[0].id;

  // Setup Profiles: Teacher, Admin, Parent, 4 Students
  const teacherProfileId = await createTestProfile(`teacher_att_${suffix}@vidtest.edu`, `Prof. Attend ${suffix}`, 'TEACHER');
  const adminProfileId = await createTestProfile(`admin_att_${suffix}@vidtest.edu`, `Admin Attend ${suffix}`, 'INSTITUTION_ADMIN');
  const parentProfileId = await createTestProfile(`parent_att_${suffix}@vidtest.edu`, `Parent Attend ${suffix}`, 'PARENT');

  // Staff record for Teacher
  const staffRes = await db.query(
    `INSERT INTO staff (institution_id, profile_id, department_id, employee_code, is_teaching_staff, employment_status, date_of_joining)
     VALUES ($1, $2, $3, $4, true, 'active', CURRENT_DATE)
     ON CONFLICT (institution_id, employee_code) DO UPDATE SET is_teaching_staff = true
     RETURNING id`,
    [instId, teacherProfileId, departmentId, `STAFF-ATT-${suffix}`]
  );
  const staffId = staffRes.rows[0].id;

  // Allocate Teacher to Section A (Rule 8)
  await db.query(
    `INSERT INTO faculty_assignments (institution_id, staff_id, section_id, subject_id, academic_year_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [instId, staffId, sectionAId, subjectId, academicYearId]
  );

  // Setup 4 Students in Section A
  const studentIds: string[] = [];
  const studentProfileIds: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const sProfileId = await createTestProfile(`student_att_${suffix}_${i}@vidtest.edu`, `Student ${suffix} ${i}`, 'STUDENT');
    studentProfileIds.push(sProfileId);

    const sRes = await db.query(
      `INSERT INTO students (institution_id, user_id, admission_number, roll_number, first_name, last_name, gender, date_of_birth, current_class_id, current_section_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'male', '2010-01-01', $7, $8, 'active')
       RETURNING id`,
      [instId, sProfileId, `ADM-ATT-${suffix}-${i}`, `ROLL-ATT-${suffix}-${i}`, `Student${i}`, `Test`, classId, sectionAId]
    );
    studentIds.push(sRes.rows[0].id);
  }

  // Link Parent to Student 1
  const parentDbRes = await db.query(
    `INSERT INTO parents (institution_id, profile_id, full_name, relationship)
     VALUES ($1, $2, 'Parent Attend', 'father')
     RETURNING id`,
    [instId, parentProfileId]
  );
  const parentDbId = parentDbRes.rows[0].id;

  await db.query(
    `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary_contact)
     VALUES ($1, $2, 'father', true)`,
    [studentIds[0], parentDbId]
  );

  // Entities created during tests
  let dailySessionId: string;
  let periodSessionId: string;
  let leaveRequestId: string;

  // Cleanup helper
  async function cleanup() {
    try {
      if (leaveRequestId) {
        await db.query('DELETE FROM student_leave_requests WHERE id = $1', [leaveRequestId]);
      }
      await db.query('DELETE FROM student_leave_requests WHERE institution_id = $1 AND student_id = ANY($2)', [instId, studentIds]);
      await db.query('DELETE FROM attendance_records WHERE session_id IN (SELECT id FROM attendance_sessions WHERE institution_id = $1)', [instId]);
      await db.query('DELETE FROM attendance_sessions WHERE institution_id = $1 AND section_id IN ($2, $3)', [instId, sectionAId, sectionBId]);
      await db.query('DELETE FROM staff_attendance WHERE institution_id = $1 AND staff_id = $2', [instId, staffId]);
      await db.query('DELETE FROM notifications WHERE recipient_profile_id = $1', [parentProfileId]);
      await db.query('DELETE FROM faculty_assignments WHERE staff_id = $1', [staffId]);
      await db.query('DELETE FROM student_parents WHERE student_id = ANY($1)', [studentIds]);
      await db.query('DELETE FROM parents WHERE id = $1', [parentDbId]);
      await db.query('DELETE FROM students WHERE id = ANY($1)', [studentIds]);
      await db.query('DELETE FROM staff WHERE id = $1', [staffId]);
      await db.query('DELETE FROM subjects WHERE id = $1', [subjectId]);
      await db.query('DELETE FROM sections WHERE id IN ($1, $2)', [sectionAId, sectionBId]);
      await db.query('DELETE FROM classes WHERE id = $1', [classId]);
      await db.query('DELETE FROM departments WHERE id = $1', [departmentId]);
      if (createdTestAY) {
        await db.query('DELETE FROM academic_years WHERE id = $1', [academicYearId]);
      }
      const allProfiles = [teacherProfileId, adminProfileId, parentProfileId, ...studentProfileIds];
      await db.query('DELETE FROM user_roles WHERE profile_id = ANY($1)', [allProfiles]);
      await db.query('DELETE FROM profiles WHERE id = ANY($1)', [allProfiles]);
      await db.query('DELETE FROM auth.users WHERE id = ANY($1)', [allProfiles]);
    } catch (e: any) {
      console.warn('Cleanup warning:', e.message);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Daily Attendance Session Creation & Roster Generation
    // -------------------------------------------------------------
    await test('Create daily attendance session and retrieve Section A roster', async () => {
      const session = await attendanceService.getOrCreateSession(
        instId,
        {
          sectionId: sectionAId,
          sessionDate: '2026-10-05',
          staffId,
        },
        { id: teacherProfileId, role: 'TEACHER' }
      );

      assert.ok(session.id, 'Session created');
      assert.equal(session.sectionId, sectionAId, 'Section matches Section A');
      assert.equal(session.sessionDate, '2026-10-05', 'Date matches 2026-10-05');
      assert.equal(session.subjectId, null, 'Daily session has null subjectId');
      assert.equal(session.periodNumber, null, 'Daily session has null periodNumber');
      dailySessionId = session.id;

      // Retrieve roster for this session
      const roster = await attendanceService.getSectionRoster(
        instId,
        sectionAId,
        '2026-10-05',
        dailySessionId,
        { id: teacherProfileId, role: 'TEACHER' }
      );

      assert.equal(roster.length, 4, 'Roster contains all 4 students');
      assert.equal(roster[0].status, null, 'Attendance status is unrecorded initially');
    });

    // -------------------------------------------------------------
    // Test 2: Batch Roll Call Submission (Present, Absent, Late, Excused)
    // -------------------------------------------------------------
    await test('Submit batch roll call with mixed statuses and verify session aggregates', async () => {
      const records = [
        { studentId: studentIds[0], status: 'present' },
        { studentId: studentIds[1], status: 'absent', remarks: 'Uninformed absence' },
        { studentId: studentIds[2], status: 'late', remarks: 'Arrived 15m late' },
        { studentId: studentIds[3], status: 'excused', remarks: 'Sports competition' },
      ];

      const res = await attendanceService.submitRollCall(
        instId,
        dailySessionId,
        records,
        { id: teacherProfileId, role: 'TEACHER' }
      );

      assert.equal(res.count, 4, '4 records submitted');
      assert.equal(res.absentStudentIds.length, 1, '1 student identified as absent');
      assert.equal(res.absentStudentIds[0], studentIds[1], 'Absent student is student 2');

      // Verify session aggregates
      const updatedSession = await attendanceService.getSessionById(instId, dailySessionId);
      assert.equal(updatedSession.totalRecorded, 4, 'totalRecorded is 4');
      assert.equal(updatedSession.totalPresent, 1, 'totalPresent is 1');
      assert.equal(updatedSession.totalAbsent, 1, 'totalAbsent is 1');
      assert.equal(updatedSession.totalLate, 1, 'totalLate is 1');
      assert.equal(updatedSession.totalExcused, 1, 'totalExcused is 1');
    });

    // -------------------------------------------------------------
    // Test 3: Idempotent Roll Call Update (Correct Status)
    // -------------------------------------------------------------
    await test('Idempotent Roll Call: Update existing record from absent to excused', async () => {
      // Correct student 2 to excused
      const updateRecords = [
        { studentId: studentIds[1], status: 'excused', remarks: 'Medical note submitted' },
      ];

      const res = await attendanceService.submitRollCall(
        instId,
        dailySessionId,
        updateRecords,
        { id: teacherProfileId, role: 'TEACHER' }
      );

      assert.equal(res.count, 1, '1 record updated');

      // Verify aggregate updated
      const updatedSession = await attendanceService.getSessionById(instId, dailySessionId);
      assert.equal(updatedSession.totalAbsent, 0, 'totalAbsent dropped to 0');
      assert.equal(updatedSession.totalExcused, 2, 'totalExcused increased to 2');
    });

    // -------------------------------------------------------------
    // Test 4: Period/Subject-wise Attendance Session
    // -------------------------------------------------------------
    await test('Create period/subject-wise attendance session distinct from daily session', async () => {
      const periodSession = await attendanceService.getOrCreateSession(
        instId,
        {
          sectionId: sectionAId,
          sessionDate: '2026-10-05',
          subjectId,
          periodNumber: 2,
          staffId,
        },
        { id: teacherProfileId, role: 'TEACHER' }
      );

      assert.ok(periodSession.id, 'Period session created');
      assert.notEqual(periodSession.id, dailySessionId, 'Period session is separate from daily session');
      assert.equal(periodSession.periodNumber, 2, 'Period number is 2');
      assert.equal(periodSession.subjectId, subjectId, 'Subject ID matches Physics');
      periodSessionId = periodSession.id;

      // Record period attendance for all 4 students as present
      const pRecords = studentIds.map((id) => ({ studentId: id, status: 'present' }));
      const pRes = await attendanceService.submitRollCall(
        instId,
        periodSessionId,
        pRecords,
        { id: teacherProfileId, role: 'TEACHER' }
      );
      assert.equal(pRes.count, 4, 'Recorded 4 period attendance records');
    });

    // -------------------------------------------------------------
    // Test 5: Low Attendance Threshold (< 75%) Detection
    // -------------------------------------------------------------
    await test('Student attendance summary accurately calculates percentage and detects < 75% threshold', async () => {
      // Create 4 more sessions where student 4 is absent:
      // In dailySession (1 excused) + periodSession (1 present) = 2 sessions attended out of 2 = 100%.
      // Now add 4 more sessions on dates 2026-10-06 to 2026-10-09 where student 4 is absent.
      for (let day = 6; day <= 9; day++) {
        const s = await attendanceService.getOrCreateSession(
          instId,
          {
            sectionId: sectionAId,
            sessionDate: `2026-10-0${day}`,
          },
          { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
        );
        await attendanceService.submitRollCall(
          instId,
          s.id,
          [{ studentId: studentIds[3], status: 'absent' }],
          { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
        );
      }

      // Total sessions for student 4: 2 attended (1 excused + 1 present) out of 6 sessions = 33.3% (< 75%)
      const summary = await attendanceService.getStudentAttendanceSummary(
        instId,
        studentIds[3],
        {},
        { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
      );

      assert.equal(summary.totalSessions, 6, 'Total sessions is 6');
      assert.equal(summary.absentCount, 4, 'Absent count is 4');
      assert.equal(summary.isLowAttendance, true, 'isLowAttendance must be true when < 75%');
      assert.ok(summary.percentage < 75.0, 'Percentage is below 75%');
      assert.ok(summary.warning, 'Warning message is attached');
    });

    // -------------------------------------------------------------
    // Test 6: Absent Student Notification Dispatch to Parent
    // -------------------------------------------------------------
    await test('Absent student alert automatically dispatches notification to linked parent inbox', async () => {
      // Create session on 2026-10-10 and mark Student 1 (linked to parent) absent
      const s = await attendanceService.getOrCreateSession(
        instId,
        {
          sectionId: sectionAId,
          sessionDate: '2026-10-10',
        },
        { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
      );

      await attendanceService.submitRollCall(
        instId,
        s.id,
        [{ studentId: studentIds[0], status: 'absent' }],
        { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
      );

      // Verify notification in parent inbox
      const notifications = await notificationService.getUserNotifications(instId, parentProfileId);
      const absentAlert = notifications.find(
        (n: any) => n.payload?.type === 'attendance_alert' || n.payload?.title?.includes('Absent')
      );
      assert.ok(absentAlert, 'Parent received attendance_alert notification');
      assert.ok(absentAlert.payload?.title?.includes('Absent'), 'Title mentions Absent');
    });

    // -------------------------------------------------------------
    // Test 7: Student Leave Application (by Parent) & Approval Workflow
    // -------------------------------------------------------------
    await test('Parent applies for leave for linked child and teacher approves leave', async () => {
      const leave = await attendanceService.applyStudentLeave(
        instId,
        {
          studentId: studentIds[0],
          startDate: '2026-10-12',
          endDate: '2026-10-14',
          reason: 'Family wedding event',
        },
        { id: parentProfileId, role: 'PARENT' }
      );

      assert.ok(leave.id, 'Leave request created');
      assert.equal(leave.status, 'pending', 'Status is pending initially');
      leaveRequestId = leave.id;

      // Teacher approves leave
      const approved = await attendanceService.decideStudentLeave(
        instId,
        leave.id,
        'approved',
        { id: teacherProfileId, role: 'TEACHER' },
        'Approved by Class Teacher'
      );

      assert.equal(approved.status, 'approved', 'Status transitioned to approved');
      assert.equal(approved.decidedBy, teacherProfileId, 'Decided by teacher');
    });

    // -------------------------------------------------------------
    // Test 8: Approved Leave Retroactively Excuses Recorded Absence
    // -------------------------------------------------------------
    await test('Approved leave automatically converts previously marked absent record to excused', async () => {
      // 1. Create a session on 2026-10-20 and mark Student 1 absent
      const s = await attendanceService.getOrCreateSession(
        instId,
        {
          sectionId: sectionAId,
          sessionDate: '2026-10-20',
        },
        { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
      );

      await attendanceService.submitRollCall(
        instId,
        s.id,
        [{ studentId: studentIds[0], status: 'absent' }],
        { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
      );

      // Verify recorded as absent initially
      const initialSummary = await attendanceService.getStudentAttendanceSummary(instId, studentIds[0]);
      const initialDayRec = initialSummary.history.find((h: any) => h.sessionDate === '2026-10-20');
      assert.equal(initialDayRec?.status, 'absent', 'Status is absent initially');

      // 2. Student applies for leave covering 2026-10-20 with medical note
      const medLeave = await attendanceService.applyStudentLeave(
        instId,
        {
          studentId: studentIds[0],
          startDate: '2026-10-20',
          endDate: '2026-10-20',
          reason: 'Severe fever with doctor prescription',
        },
        { id: studentProfileIds[0], role: 'STUDENT' }
      );

      // 3. Admin approves leave
      await attendanceService.decideStudentLeave(
        instId,
        medLeave.id,
        'approved',
        { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
      );

      // 4. Verify attendance record was converted to 'excused'
      const updatedSummary = await attendanceService.getStudentAttendanceSummary(instId, studentIds[0]);
      const updatedDayRec = updatedSummary.history.find((h: any) => h.sessionDate === '2026-10-20');
      assert.equal(updatedDayRec?.status, 'excused', 'Status was automatically converted from absent to excused');
    });

    // -------------------------------------------------------------
    // Test 9: Staff / Faculty Attendance Tracking
    // -------------------------------------------------------------
    await test('Record and list staff attendance for teacher with designation and department info', async () => {
      const records = [
        { staffId, attendanceDate: '2026-10-05', status: 'present' },
      ];

      const res = await attendanceService.recordStaffAttendance(
        instId,
        records,
        { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
      );

      assert.equal(res.length, 1, 'Staff attendance recorded');
      assert.equal(res[0].status, 'present', 'Status is present');

      // List staff attendance
      const list = await attendanceService.listStaffAttendance(instId, { attendanceDate: '2026-10-05' });
      assert.ok(list.length > 0, 'Staff attendance listed');
      const staffAtt = list.find((item: any) => item.staffId === staffId);
      assert.ok(staffAtt, 'Found test staff in attendance list');
      assert.equal(staffAtt.status, 'present', 'Status matches present');
    });

    // -------------------------------------------------------------
    // Test 10: Scoped Access & Rule 8 Faculty Scoping Enforcement
    // -------------------------------------------------------------
    await test('Scoped Access: Rule 8 blocks unallocated section, Rule 9/10 restrict Parent/Student', async () => {
      // 1. Rule 8: Teacher attempts to record attendance for Section B (unassigned) -> MUST FAIL (403)
      let teacherBlocked = false;
      try {
        const sB = await attendanceService.getOrCreateSession(
          instId,
          {
            sectionId: sectionBId,
            sessionDate: '2026-10-05',
          },
          { id: teacherProfileId, role: 'TEACHER' }
        );
      } catch (err: any) {
        teacherBlocked = true;
        assert.ok(err.message.includes('RESOURCE_ACCESS_DENIED'), 'Must deny unallocated section access');
      }
      assert.ok(teacherBlocked, 'Faculty must be strictly blocked from unallocated section');

      // 2. Rule 10: Student 1 attempts to view Student 2 attendance -> MUST FAIL (403)
      let studentCrossBlocked = false;
      try {
        await attendanceService.getStudentAttendanceSummary(
          instId,
          studentIds[1],
          {},
          { id: studentProfileIds[0], role: 'STUDENT' }
        );
      } catch (err: any) {
        studentCrossBlocked = true;
        assert.ok(err.message.includes('RESOURCE_ACCESS_DENIED'), 'Must deny student cross-record access');
      }
      assert.ok(studentCrossBlocked, 'Student must be blocked from other student records');

      // 3. Rule 9: Parent attempts to apply leave for Student 2 (unlinked) -> MUST FAIL (403)
      let parentUnlinkedBlocked = false;
      try {
        await attendanceService.applyStudentLeave(
          instId,
          {
            studentId: studentIds[1],
            startDate: '2026-10-25',
            endDate: '2026-10-26',
            reason: 'Unlinked test',
          },
          { id: parentProfileId, role: 'PARENT' }
        );
      } catch (err: any) {
        parentUnlinkedBlocked = true;
        assert.ok(err.message.includes('RESOURCE_ACCESS_DENIED'), 'Must deny unlinked child leave application');
      }
      assert.ok(parentUnlinkedBlocked, 'Parent must be blocked from unlinked child');

      // 4. Positive Scoped Attendance for Parent: sees linked Student 1
      const parentView = await attendanceService.getScopedAttendance(instId, {
        id: parentProfileId,
        role: 'PARENT',
      });
      assert.equal(parentView.role, 'PARENT', 'Role is PARENT');
      assert.equal(parentView.children.length, 1, 'Sees exactly 1 linked child');
      assert.equal(parentView.children[0].child.id, studentIds[0], 'Child is Student 1');
    });
  } finally {
    console.log('\n🧹 Cleaning up test artifacts...');
    await cleanup();
    console.log('   Cleanup complete.\n');
  }

  console.log('======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAttendanceTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
