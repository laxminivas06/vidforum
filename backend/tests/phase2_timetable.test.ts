import assert from 'node:assert/strict';
import { db } from '../src/config/database';
import { timetableService, ConflictError } from '../src/modules/timetable/timetable.service';
import { timetableController } from '../src/modules/timetable/timetable.controller';

// Helper to create mock Express Req/Res
function createMockReqRes(options: {
  user?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  institutionId?: string;
}) {
  const req: any = {
    user: options.user,
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    institutionId: options.institutionId,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    originalUrl: '/test-url',
    method: 'GET',
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
  };

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getResponseData: () => responseData,
  };
}

async function runTimetableTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 2, MODULE 1 TEST SUITE');
  console.log('   Timetable Engine, Conflict Detection & Publishing');
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

  // Helper to create test profiles and staff
  async function createTestStaff(email: string, fullName: string, empNumber: string, deptId: string) {
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

    const roleRes = await db.query("SELECT id FROM roles WHERE name = 'TEACHER' LIMIT 1");
    if (roleRes.rows.length > 0) {
      await db.query(
        `INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
         VALUES (gen_random_uuid(), $1, $2, $3, '{}', now())
         ON CONFLICT (profile_id, role_id, institution_id) DO NOTHING`,
        [profileId, roleRes.rows[0].id, instId]
      );
    }

    let staffRes = await db.query(
      `INSERT INTO staff (institution_id, profile_id, employee_code, department_id, is_teaching_staff, employment_status, date_of_joining)
       VALUES ($1, $2, $3, $4, true, 'active', CURRENT_DATE)
       ON CONFLICT (institution_id, employee_code) DO UPDATE SET is_teaching_staff = true
       RETURNING id`,
      [instId, profileId, empNumber, deptId]
    );

    const staffId = staffRes.rows[0].id;
    await db.query(
      `INSERT INTO faculty (institution_id, staff_id, qualification, specialization)
       VALUES ($1, $2, 'M.Sc Physics', 'Science')
       ON CONFLICT (staff_id) DO NOTHING`,
      [instId, staffId]
    );

    return { profileId, staffId };
  }

  // Setup test entities
  const suffix = Date.now().toString().slice(-6);

  // Academic Year
  let ayRes = await db.query(
    `SELECT id FROM academic_years WHERE institution_id = $1 AND is_current = true LIMIT 1`,
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
      [instId, `AY 2026-27 TT ${suffix}`]
    );
    academicYearId = ayRes.rows[0].id;
    createdTestAY = true;
  }

  // Department
  let deptRes = await db.query(
    `INSERT INTO departments (institution_id, name, code, department_type)
     VALUES ($1, $2, $3, 'academic')
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `Science TT ${suffix}`, `SCI-TT-${suffix}`]
  );
  const departmentId = deptRes.rows[0].id;

  // Class
  let classRes = await db.query(
    `INSERT INTO classes (institution_id, name, academic_year_id, department_id, sequence_order)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (institution_id, academic_year_id, department_id, name) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
     RETURNING id`,
    [instId, `Grade 10 TT ${suffix}`, academicYearId, departmentId]
  );
  const classId = classRes.rows[0].id;

  // Sections A & B
  let secARes = await db.query(
    `INSERT INTO sections (institution_id, class_id, name, capacity)
     VALUES ($1, $2, 'Section A', 35)
     ON CONFLICT (class_id, name) DO UPDATE SET capacity = EXCLUDED.capacity
     RETURNING id`,
    [instId, classId]
  );
  const sectionAId = secARes.rows[0].id;

  let secBRes = await db.query(
    `INSERT INTO sections (institution_id, class_id, name, capacity)
     VALUES ($1, $2, 'Section B', 35)
     ON CONFLICT (class_id, name) DO UPDATE SET capacity = EXCLUDED.capacity
     RETURNING id`,
    [instId, classId]
  );
  const sectionBId = secBRes.rows[0].id;

  // Subjects
  let sub1Res = await db.query(
    `INSERT INTO subjects (institution_id, name, code, is_elective)
     VALUES ($1, 'Physics TT', $2, false)
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `PHY-TT-${suffix}`]
  );
  const subject1Id = sub1Res.rows[0].id;

  let sub2Res = await db.query(
    `INSERT INTO subjects (institution_id, name, code, is_elective)
     VALUES ($1, 'Chemistry TT', $2, false)
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `CHE-TT-${suffix}`]
  );
  const subject2Id = sub2Res.rows[0].id;

  // Teachers T1 & T2
  const teacher1 = await createTestStaff(`t1_${suffix}@vidtest.edu`, `Prof. T1 ${suffix}`, `EMP-T1-${suffix}`, departmentId);
  const teacher2 = await createTestStaff(`t2_${suffix}@vidtest.edu`, `Prof. T2 ${suffix}`, `EMP-T2-${suffix}`, departmentId);

  // Test rooms and periods
  let roomId1: string;
  let roomId2: string;
  let period1Id: string;
  let period2Id: string;
  let breakPeriodId: string;
  let timetableId: string;
  let entry1Id: string;

  // Cleanup helper
  async function cleanup() {
    try {
      if (timetableId) {
        await db.query('DELETE FROM substitutions WHERE timetable_entry_id IN (SELECT id FROM timetable_entries WHERE timetable_id = $1)', [timetableId]);
        await db.query('DELETE FROM timetable_entries WHERE timetable_id = $1', [timetableId]);
        await db.query('DELETE FROM timetables WHERE id = $1', [timetableId]);
      }
      if (period1Id) await db.query('DELETE FROM periods WHERE id = $1', [period1Id]);
      if (period2Id) await db.query('DELETE FROM periods WHERE id = $1', [period2Id]);
      if (breakPeriodId) await db.query('DELETE FROM periods WHERE id = $1', [breakPeriodId]);
      if (roomId1) await db.query('DELETE FROM rooms WHERE id = $1', [roomId1]);
      if (roomId2) await db.query('DELETE FROM rooms WHERE id = $1', [roomId2]);
      await db.query('DELETE FROM faculty_assignments WHERE staff_id IN ($1, $2)', [teacher1.staffId, teacher2.staffId]);
      await db.query('DELETE FROM faculty WHERE staff_id IN ($1, $2)', [teacher1.staffId, teacher2.staffId]);
      await db.query('DELETE FROM staff WHERE id IN ($1, $2)', [teacher1.staffId, teacher2.staffId]);
      await db.query('DELETE FROM profiles WHERE id IN ($1, $2)', [teacher1.profileId, teacher2.profileId]);
      await db.query('DELETE FROM sections WHERE id IN ($1, $2)', [sectionAId, sectionBId]);
      await db.query('DELETE FROM classes WHERE id = $1', [classId]);
      await db.query('DELETE FROM subjects WHERE id IN ($1, $2)', [subject1Id, subject2Id]);
      await db.query('DELETE FROM departments WHERE id = $1', [departmentId]);
      if (createdTestAY) await db.query('DELETE FROM academic_years WHERE id = $1', [academicYearId]);
    } catch (e: any) {
      console.warn('Cleanup warning:', e.message);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Room & Period Configuration
    // -------------------------------------------------------------
    await test('Configure rooms and periods with sequence order and break flag', async () => {
      const room1 = await timetableService.createRoom(instId, {
        name: `Room 101-${suffix}`,
        capacity: 40,
        roomType: 'classroom',
      });
      assert.ok(room1.id, 'Room 1 created');
      roomId1 = room1.id;

      const room2 = await timetableService.createRoom(instId, {
        name: `Science Lab-${suffix}`,
        capacity: 30,
        roomType: 'lab',
      });
      assert.ok(room2.id, 'Room 2 created');
      roomId2 = room2.id;

      // Period 1
      const p1 = await timetableService.createPeriod(instId, {
        name: `Period 1-${suffix}`,
        startTime: '08:30:00',
        endTime: '09:30:00',
        isBreak: false,
        sequenceOrder: 1,
      });
      assert.ok(p1.id, 'Period 1 created');
      period1Id = p1.id;

      // Period 2
      const p2 = await timetableService.createPeriod(instId, {
        name: `Period 2-${suffix}`,
        startTime: '09:30:00',
        endTime: '10:30:00',
        isBreak: false,
        sequenceOrder: 2,
      });
      assert.ok(p2.id, 'Period 2 created');
      period2Id = p2.id;

      // Period 3 (Break)
      const pBreak = await timetableService.createPeriod(instId, {
        name: `Morning Break-${suffix}`,
        startTime: '10:30:00',
        endTime: '10:45:00',
        isBreak: true,
        sequenceOrder: 3,
      });
      assert.ok(pBreak.id, 'Break period created');
      assert.equal(pBreak.isBreak, true, 'isBreak must be true');
      breakPeriodId = pBreak.id;

      // List and verify
      const periods = await timetableService.listPeriods(instId);
      const testPeriods = periods.filter((p) => [period1Id, period2Id, breakPeriodId].includes(p.id));
      assert.equal(testPeriods.length, 3, 'All 3 test periods listed');
      assert.equal(testPeriods[0].id, period1Id, 'Periods must be sorted by sequence order');
    });

    // -------------------------------------------------------------
    // Test 2: Create Timetable Header
    // -------------------------------------------------------------
    await test('Create timetable header with draft status (is_published = false)', async () => {
      const tt = await timetableService.createTimetable(instId, {
        academicYearId,
        classId,
        sectionId: sectionAId,
        name: `Grade 10-A Timetable ${suffix}`,
      });
      assert.ok(tt.id, 'Timetable created');
      assert.equal(tt.isPublished, false, 'Timetable must start in draft status');
      timetableId = tt.id;
    });

    // -------------------------------------------------------------
    // Test 3: Create Conflict-Free Entry
    // -------------------------------------------------------------
    await test('Create valid conflict-free timetable entry for Section A, Period 1, Monday', async () => {
      const entry = await timetableService.createEntry(instId, {
        timetableId,
        sectionId: sectionAId,
        subjectId: subject1Id,
        facultyId: teacher1.staffId,
        roomId: roomId1,
        dayOfWeek: 'Monday',
        periodId: period1Id,
      });
      assert.ok(entry.id, 'Entry created');
      assert.equal(entry.dayOfWeek, 'mon', 'Day of week must be normalized to lowercase enum');
      entry1Id = entry.id;
    });

    // -------------------------------------------------------------
    // Test 4: Conflict Engine - Teacher Double-Booking Blocked
    // -------------------------------------------------------------
    await test('Conflict Engine: Blocks teacher double-booking across different sections in same period', async () => {
      // Teacher 1 is already assigned to Section A in Period 1 on Monday.
      // Attempting to assign Teacher 1 to Section B in Period 1 on Monday must be BLOCKED!
      let blocked = false;
      try {
        await timetableService.createEntry(instId, {
          timetableId,
          sectionId: sectionBId,
          subjectId: subject2Id,
          facultyId: teacher1.staffId,
          roomId: roomId2,
          dayOfWeek: 'Monday',
          periodId: period1Id,
        });
      } catch (err: any) {
        blocked = true;
        assert.ok(err instanceof ConflictError, 'Must throw ConflictError');
        assert.equal(err.code, 'CONFLICT_DETECTED', 'Must have code CONFLICT_DETECTED');
        assert.ok(
          err.conflicts.some((c: any) => c.type === 'TEACHER_DOUBLE_BOOKING'),
          'Must report TEACHER_DOUBLE_BOOKING conflict'
        );
      }
      assert.ok(blocked, 'Teacher double-booking must be blocked');
    });

    // -------------------------------------------------------------
    // Test 5: Conflict Engine - Room Double-Booking Blocked
    // -------------------------------------------------------------
    await test('Conflict Engine: Blocks room double-booking across different sections in same period', async () => {
      // Room 101 is already assigned to Section A in Period 1 on Monday.
      // Attempting to assign Teacher 2 to Section B in Room 101 in Period 1 on Monday must be BLOCKED!
      let blocked = false;
      try {
        await timetableService.createEntry(instId, {
          timetableId,
          sectionId: sectionBId,
          subjectId: subject2Id,
          facultyId: teacher2.staffId,
          roomId: roomId1, // Room 101 collision!
          dayOfWeek: 'Monday',
          periodId: period1Id,
        });
      } catch (err: any) {
        blocked = true;
        assert.ok(err instanceof ConflictError, 'Must throw ConflictError');
        assert.ok(
          err.conflicts.some((c: any) => c.type === 'ROOM_DOUBLE_BOOKING'),
          'Must report ROOM_DOUBLE_BOOKING conflict'
        );
      }
      assert.ok(blocked, 'Room double-booking must be blocked');
    });

    // -------------------------------------------------------------
    // Test 6: Conflict Engine - Section Period Double-Booking Blocked
    // -------------------------------------------------------------
    await test('Conflict Engine: Blocks section period double-booking (two subjects in same period)', async () => {
      // Section A already has Physics in Period 1 on Monday.
      // Attempting to assign Chemistry to Section A in Period 1 on Monday must be BLOCKED!
      let blocked = false;
      try {
        await timetableService.createEntry(instId, {
          timetableId,
          sectionId: sectionAId,
          subjectId: subject2Id,
          facultyId: teacher2.staffId,
          roomId: roomId2,
          dayOfWeek: 'Monday',
          periodId: period1Id, // Section A collision!
        });
      } catch (err: any) {
        blocked = true;
        assert.ok(err instanceof ConflictError, 'Must throw ConflictError');
        assert.ok(
          err.conflicts.some((c: any) => c.type === 'SECTION_DOUBLE_BOOKING'),
          'Must report SECTION_DOUBLE_BOOKING conflict'
        );
      }
      assert.ok(blocked, 'Section period double-booking must be blocked');
    });

    // -------------------------------------------------------------
    // Test 7: Conflict Engine - Break Period Overlap Blocked
    // -------------------------------------------------------------
    await test('Conflict Engine: Blocks academic class scheduling during break period', async () => {
      let blocked = false;
      try {
        await timetableService.createEntry(instId, {
          timetableId,
          sectionId: sectionAId,
          subjectId: subject2Id,
          facultyId: teacher2.staffId,
          roomId: roomId2,
          dayOfWeek: 'Monday',
          periodId: breakPeriodId, // Break period collision!
        });
      } catch (err: any) {
        blocked = true;
        assert.ok(err instanceof ConflictError, 'Must throw ConflictError');
        assert.ok(
          err.conflicts.some((c: any) => c.type === 'BREAK_PERIOD_OVERLAP'),
          'Must report BREAK_PERIOD_OVERLAP conflict'
        );
      }
      assert.ok(blocked, 'Break period scheduling must be blocked');
    });

    // -------------------------------------------------------------
    // Test 8: Publishing Engine - Clean Timetable Publishes Successfully
    // -------------------------------------------------------------
    await test('Publishing Engine: Audits conflicts and publishes conflict-free timetable', async () => {
      // Add a second clean entry for Period 2 on Monday
      await timetableService.createEntry(instId, {
        timetableId,
        sectionId: sectionAId,
        subjectId: subject2Id,
        facultyId: teacher2.staffId,
        roomId: roomId2,
        dayOfWeek: 'Monday',
        periodId: period2Id,
      });

      // Audit timetable conflicts before publish
      const audit = await timetableService.auditTimetableConflicts(instId, timetableId);
      assert.equal(audit.hasConflict, false, 'Clean timetable must have 0 conflicts');
      assert.equal(audit.conflicts.length, 0, 'Conflicts array must be empty');

      // Publish timetable
      const published = await timetableService.publishTimetable(instId, timetableId, teacher1.profileId);
      assert.equal(published?.isPublished, true, 'isPublished must be true');
      assert.ok(published?.publishedAt, 'publishedAt timestamp must be recorded');

      // Verify audit log entry was created
      const auditLog = await db.query(
        "SELECT id, action, resource_table FROM audit_logs WHERE institution_id = $1 AND action = 'timetable.published' AND resource_id = $2",
        [instId, timetableId]
      );
      assert.ok(auditLog.rows.length > 0, 'Audit log for timetable.published must be created');
    });

    // -------------------------------------------------------------
    // Test 9: Substitutions Lifecycle
    // -------------------------------------------------------------
    await test('Substitutions: Assigns substitute teacher for scheduled entry with audit log', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Assign Teacher 2 as substitute for Teacher 1 for entry1 on today
      const sub = await timetableService.createSubstitution(
        instId,
        {
          timetableEntryId: entry1Id,
          substituteDate: today,
          originalStaffId: teacher1.staffId,
          substituteStaffId: teacher2.staffId,
          reason: 'Medical leave coverage',
        },
        teacher1.profileId
      );
      assert.ok(sub.id, 'Substitution created');
      assert.equal(sub.status, 'approved', 'Status defaults to approved');

      // List substitutions
      const list = await timetableService.listSubstitutions(instId, { date: today });
      assert.ok(list.length > 0, 'Substitution must be listed');
      const found = list.find((s) => s.id === sub.id);
      assert.ok(found, 'Created substitution present in list');
      assert.equal(found.originalTeacherName, `Prof. T1 ${suffix}`);
      assert.equal(found.substituteTeacherName, `Prof. T2 ${suffix}`);
    });

    // -------------------------------------------------------------
    // Test 10: Scoped Timetable Access
    // -------------------------------------------------------------
    await test('Scoped Access: Faculty receives assigned schedule and active substitutions', async () => {
      // Teacher 1 schedule query
      const t1Schedule = await timetableService.getScopedSchedule(
        instId,
        { id: teacher1.profileId, role: 'TEACHER' },
        { dayOfWeek: 'mon' }
      );
      assert.ok(t1Schedule.entries, 'Entries returned for teacher');
      assert.equal(t1Schedule.entries.length, 1, 'Teacher 1 has 1 scheduled class');
      assert.equal(t1Schedule.entries[0].subjectName, 'Physics TT');
      assert.ok(t1Schedule.substitutions.length > 0, 'Substitutions returned for teacher');

      // Teacher 2 schedule query
      const t2Schedule = await timetableService.getScopedSchedule(
        instId,
        { id: teacher2.profileId, role: 'TEACHER' },
        { dayOfWeek: 'mon' }
      );
      assert.ok(t2Schedule.entries, 'Entries returned for teacher 2');
      assert.equal(t2Schedule.entries.length, 1, 'Teacher 2 has 1 scheduled class');
      assert.equal(t2Schedule.entries[0].subjectName, 'Chemistry TT');
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

runTimetableTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
