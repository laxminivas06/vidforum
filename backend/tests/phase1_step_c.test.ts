import assert from 'node:assert/strict';
import { db } from '../src/config/database';
import { academicsService } from '../src/modules/academics/academics.service';
import { admissionsService } from '../src/modules/admissions/admissions.service';
import { studentRepository } from '../src/modules/students/student.repository';
import { resourceGuard } from '../src/middleware/resource-guard.middleware';

// Helper to create mock Express Req/Res
function createMockReqRes(options: {
  user?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const req: any = {
    user: options.user,
    params: options.params || {},
    headers: options.headers || {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    originalUrl: '/test-url',
    method: 'GET',
  };

  let statusCode = 200;
  let responseData: any = null;
  let nextCalled = false;

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

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatusCode: () => statusCode,
    getResponseData: () => responseData,
    wasNextCalled: () => nextCalled,
  };
}

async function runStepCTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 1, STEP C EXIT GATE TEST SUITE');
  console.log('   Academic Core, Faculty Scoping & Admissions Flow');
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

  // Shared test entity IDs
  let testAcademicYearId: string;
  let testAcadDeptId: string;
  let testAdminDeptId: string;
  let testClassId: string;
  let testSectionAId: string;
  let testSectionBId: string;
  let testSubjectId: string;
  let testFacultyProfileId: string;
  let testStaffId: string;
  let testApplicationId: string;
  let testStudentId: string;
  let testParentProfileId: string;
  let testStudentProfileId: string;

  // Cleanup helper to keep DB clean
  async function cleanup() {
    if (testStudentId) {
      await db.query('DELETE FROM student_academic_history WHERE student_id = $1', [testStudentId]);
      await db.query('DELETE FROM student_parents WHERE student_id = $1', [testStudentId]);
      await db.query('DELETE FROM student_guardians WHERE student_id = $1', [testStudentId]);
      await db.query('DELETE FROM students WHERE id = $1', [testStudentId]);
    }
    if (testApplicationId) {
      await db.query('DELETE FROM admissions WHERE application_id = $1', [testApplicationId]);
      await db.query('DELETE FROM applications WHERE id = $1', [testApplicationId]);
    }
    if (testStaffId) {
      await db.query('DELETE FROM faculty_assignments WHERE staff_id = $1', [testStaffId]);
      await db.query('DELETE FROM faculty WHERE staff_id = $1', [testStaffId]);
      await db.query('DELETE FROM staff WHERE id = $1', [testStaffId]);
    }
    if (testFacultyProfileId) {
      await db.query('DELETE FROM auth.users WHERE id = $1', [testFacultyProfileId]);
    }
    if (testParentProfileId) {
      await db.query('DELETE FROM auth.users WHERE id = $1', [testParentProfileId]);
    }
    if (testStudentProfileId) {
      await db.query('DELETE FROM auth.users WHERE id = $1', [testStudentProfileId]);
    }
    if (testClassId) {
      await db.query('DELETE FROM class_subjects WHERE class_id = $1', [testClassId]);
      await db.query('DELETE FROM sections WHERE class_id = $1', [testClassId]);
      await db.query('DELETE FROM classes WHERE id = $1', [testClassId]);
    }
    if (testSubjectId) {
      await db.query('DELETE FROM subjects WHERE id = $1', [testSubjectId]);
    }
    if (testAcadDeptId) {
      await db.query('DELETE FROM departments WHERE id = $1', [testAcadDeptId]);
    }
    if (testAdminDeptId) {
      await db.query('DELETE FROM departments WHERE id = $1', [testAdminDeptId]);
    }
    if (testAcademicYearId) {
      await db.query('DELETE FROM academic_years WHERE id = $1', [testAcademicYearId]);
    }
  }

  try {
    // ---------------------------------------------------------
    // TEST 1: Academic Hierarchy & Department Type Filtering (D2)
    // ---------------------------------------------------------
    await test('Academics: Academic Year Creation and Hierarchy Seed', async () => {
      const year = await academicsService.createAcademicYear(instId, {
        name: 'AY-2026-2027-TEST',
        startDate: '2026-06-01',
        endDate: '2027-04-30',
        isCurrent: true,
      });
      assert.ok(year?.id, 'Academic year should be created');
      testAcademicYearId = year.id;

      // Decision D2: Academic vs Administrative departments
      const acadDept = await academicsService.createDepartment(instId, {
        name: 'Science & Mathematics',
        code: 'DEPT-SCI-TEST',
        departmentType: 'academic',
      });
      testAcadDeptId = acadDept.id;

      const adminDept = await academicsService.createDepartment(instId, {
        name: 'Operations & Facilities',
        code: 'DEPT-OPS-TEST',
        departmentType: 'administrative',
      });
      testAdminDeptId = adminDept.id;

      // Filter by academic type
      const acadOnly = await academicsService.getDepartments(instId, 'academic');
      assert.ok(acadOnly.some((d: any) => d.id === testAcadDeptId));
      assert.ok(!acadOnly.some((d: any) => d.id === testAdminDeptId), 'Administrative dept must not appear in academic filter');

      // Filter by administrative type
      const adminOnly = await academicsService.getDepartments(instId, 'administrative');
      assert.ok(adminOnly.some((d: any) => d.id === testAdminDeptId));
      assert.ok(!adminOnly.some((d: any) => d.id === testAcadDeptId), 'Academic dept must not appear in administrative filter');

      // Create Class, Sections, and Subjects
      const cls = await academicsService.createClass(instId, {
        name: 'Grade 10 Test',
        academicYearId: testAcademicYearId,
        departmentId: testAcadDeptId,
        sequenceOrder: 10,
      });
      testClassId = cls.id;

      const secA = await academicsService.createSection(instId, testClassId, { name: 'Section A', capacity: 35 });
      testSectionAId = secA.id;

      const secB = await academicsService.createSection(instId, testClassId, { name: 'Section B', capacity: 35 });
      testSectionBId = secB.id;

      const sub = await academicsService.createSubject(instId, {
        name: 'Advanced Physics',
        code: 'PHYS-101-TEST',
        isElective: false,
      });
      testSubjectId = sub.id;

      await academicsService.linkSubjectToClass(testClassId, testSubjectId, true);

      // Verify Hierarchy Tree
      const hierarchy = await academicsService.getHierarchy(instId);
      assert.ok(hierarchy.academicYears.some((ay: any) => ay.id === testAcademicYearId));
      assert.ok(hierarchy.departments.some((d: any) => d.id === testAcadDeptId));
      assert.ok(hierarchy.classes.some((c: any) => c.id === testClassId));
      assert.ok(hierarchy.subjects.some((s: any) => s.id === testSubjectId));
    });

    // ---------------------------------------------------------
    // TEST 2: Faculty Identity Chain & Rule 8 Scoped Access
    // ---------------------------------------------------------
    await test('Faculty: Identity Chain (users -> staff -> faculty) per D3', async () => {
      // 1. Create Profile using valid schema
      testFacultyProfileId = await createTestProfile('sarah.connor.test@vid.edu', 'Prof. Sarah Connor', 'Faculty');

      // 2. Create Staff in HRMS (is_teaching_staff = true)
      const staffRes = await db.query(
        `INSERT INTO staff (
           institution_id, profile_id, employee_code, department_id, is_teaching_staff, employment_status, date_of_joining
         ) VALUES ($1, $2, 'EMP-SC-001', $3, true, 'active', CURRENT_DATE)
         RETURNING id`,
        [instId, testFacultyProfileId, testAcadDeptId]
      );
      testStaffId = staffRes.rows[0].id;

      // 3. Verify auto-registration in faculty table per D3
      await db.query(
        `INSERT INTO faculty (institution_id, staff_id, qualification, specialization)
         VALUES ($1, $2, 'Ph.D. in Physics', 'Quantum & Mechanics')
         ON CONFLICT (staff_id) DO NOTHING`,
        [instId, testStaffId]
      );

      const facCheck = await db.query('SELECT * FROM faculty WHERE staff_id = $1', [testStaffId]);
      assert.equal(facCheck.rows.length, 1, 'Faculty record must exist for teaching staff');

      // 4. Assign Faculty to Section A (Mathematics) only
      await academicsService.createAllocation(instId, {
        staffId: testStaffId,
        sectionId: testSectionAId,
        subjectId: testSubjectId,
        academicYearId: testAcademicYearId,
      });

      const allocations = await academicsService.getAllocations(instId);
      assert.ok(allocations.some((a: any) => a.staffId === testStaffId && a.sectionId === testSectionAId));
    });

    // ---------------------------------------------------------
    // TEST 3: Rule 8 Scoped Resource Guard Enforcement
    // ---------------------------------------------------------
    await test('Rule 8: Faculty access strictly scoped to assigned section (Positive)', async () => {
      const { req, res, next, wasNextCalled } = createMockReqRes({
        user: {
          id: testFacultyProfileId,
          role: 'FACULTY',
          institutionId: instId,
          permissions: ['faculty.read'],
        },
        params: { sectionId: testSectionAId },
      });

      const guard = resourceGuard({ type: 'faculty', getResourceId: (r) => r.params.sectionId });
      await guard(req, res, next);

      assert.equal(wasNextCalled(), true, 'Faculty assigned to Section A must be granted access');
    });

    await test('Rule 8: Faculty access to unassigned section blocked with 403 (Negative)', async () => {
      const { req, res, next, wasNextCalled, getStatusCode, getResponseData } = createMockReqRes({
        user: {
          id: testFacultyProfileId,
          role: 'FACULTY',
          institutionId: instId,
          permissions: ['faculty.read'],
        },
        params: { sectionId: testSectionBId }, // Section B is NOT assigned
      });

      const guard = resourceGuard({ type: 'faculty', getResourceId: (r) => r.params.sectionId });
      await guard(req, res, next);

      assert.equal(wasNextCalled(), false, 'Faculty must NOT access unassigned Section B');
      assert.equal(getStatusCode(), 403, 'Must return 403 Forbidden');
      assert.equal(getResponseData()?.error?.code || getResponseData()?.code, 'RESOURCE_ACCESS_DENIED');
      assert.ok(getResponseData()?.message.includes('Rule 8'), 'Error message must cite Rule 8');
    });

    await test('Rule 8: Institution Admin bypasses section-level scoping', async () => {
      const { req, res, next, wasNextCalled } = createMockReqRes({
        user: {
          id: testFacultyProfileId,
          role: 'INSTITUTION_ADMIN',
          institutionId: instId,
          permissions: ['*'],
        },
        params: { sectionId: testSectionBId },
      });

      const guard = resourceGuard({ type: 'faculty', getResourceId: (r) => r.params.sectionId });
      await guard(req, res, next);

      assert.equal(wasNextCalled(), true, 'Institution Admin must access any section');
    });

    // ---------------------------------------------------------
    // TEST 4: End-to-End Atomic Admissions Approval Flow
    // ---------------------------------------------------------
    await test('Admissions: Atomic approval creates student, parents, admission fee status & audit event', async () => {
      // 1. Submit Application
      const app = await admissionsService.createApplication(instId, {
        applicantName: 'Aarav Sharma',
        dateOfBirth: '2011-04-15',
        gender: 'male',
        classId: testClassId,
        academicYearId: testAcademicYearId,
        guardianName: 'Rajesh Sharma',
        guardianPhone: '+91 98765 43210',
        guardianEmail: 'rajesh.sharma.test@gmail.com',
        stage: 'document_verification',
      });
      assert.ok(app?.id, 'Application must be created');
      testApplicationId = app.id;

      // 2. Execute Approval Transaction passing real profile actorId
      const approvalResult = await admissionsService.approveApplication(testApplicationId, instId, testFacultyProfileId);
      assert.ok(approvalResult?.student?.id, 'Student must be returned from approval transaction');
      testStudentId = approvalResult.student.id;

      // 3. Verify Student Record (Rule 1 & Rule 28)
      const student = approvalResult.student;
      assert.equal(student.first_name, 'Aarav');
      assert.equal(student.last_name, 'Sharma');
      assert.equal(student.status, 'active');
      assert.ok(student.roll_number, 'Roll number must be generated and set on student master');
      assert.ok(student.admission_number, 'Admission number must be generated');

      // 4. Verify Decision D6: admission_fee_status = 'pending'
      const admRes = await db.query(
        'SELECT decision, admission_fee_status FROM admissions WHERE application_id = $1',
        [testApplicationId]
      );
      assert.equal(admRes.rows.length, 1);
      assert.equal(admRes.rows[0].decision, 'approved');
      assert.equal(admRes.rows[0].admission_fee_status, 'pending', 'Decision D6: fee status must be pending');

      // 5. Verify Parents & Student Parents Link (Section 5)
      const parentsRes = await db.query(
        `SELECT p.full_name, p.phone, sp.relationship, sp.is_primary_contact
         FROM parents p
         JOIN student_parents sp ON sp.parent_id = p.id
         WHERE sp.student_id = $1`,
        [testStudentId]
      );
      assert.equal(parentsRes.rows.length, 1, 'Parent record must be created and linked to student');
      assert.equal(parentsRes.rows[0].full_name, 'Rajesh Sharma');
      assert.equal(parentsRes.rows[0].is_primary_contact, true);

      // 6. Verify Academic History
      const histRes = await db.query(
        'SELECT * FROM student_academic_history WHERE student_id = $1',
        [testStudentId]
      );
      assert.equal(histRes.rows.length, 1, 'Student academic history must be recorded');
      assert.equal(histRes.rows[0].academic_year_id, testAcademicYearId);
      assert.equal(histRes.rows[0].class_id, testClassId);

      // 7. Verify Application Stage Updated
      const appCheck = await db.query('SELECT stage FROM applications WHERE id = $1', [testApplicationId]);
      assert.equal(appCheck.rows[0].stage, 'approved', 'Application stage must be approved');

      // 8. Verify Immutable Audit Event (Rule 14)
      const auditRes = await db.query(
        `SELECT * FROM audit_logs 
         WHERE action = 'admissions.application.approved' AND resource_table = 'admissions' AND institution_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [instId]
      );
      assert.equal(auditRes.rows.length, 1, 'Audit log event must be recorded for admission approval');
      assert.equal(auditRes.rows[0].new_value?.studentId, testStudentId);
    });

    // ---------------------------------------------------------
    // TEST 5: Student Master 360° Profile Retrieval
    // ---------------------------------------------------------
    await test('Student Master: 360° profile retrieval with guardians, parents and academic history', async () => {
      const masterProfile = await studentRepository.findStudentMasterById(testStudentId, instId);
      assert.ok(masterProfile, '360° master profile must be retrieved');

      assert.equal(masterProfile.profile.id, testStudentId);
      assert.equal(masterProfile.profile.first_name, 'Aarav');
      assert.equal(masterProfile.parents.length, 1, 'Profile must include parents');
      assert.equal(masterProfile.guardians.length, 1, 'Profile must include guardians');
      assert.equal(masterProfile.academicHistory.length, 1, 'Profile must include academic history');
      assert.ok(masterProfile.attendance, 'Profile must include attendance summary');
      assert.ok(masterProfile.finance, 'Profile must include finance ledger summary');
    });

    // ---------------------------------------------------------
    // TEST 6: Student & Parent Resource Scoping (Rules 9 & 10)
    // ---------------------------------------------------------
    await test('Rule 10: Student may only access own educational record', async () => {
      // Create user profile for the student
      testStudentProfileId = await createTestProfile('aarav.sharma.test@vid.edu', 'Aarav Sharma', 'Student');
      await db.query('UPDATE students SET user_id = $1 WHERE id = $2', [testStudentProfileId, testStudentId]);

      // Positive check: Student accesses own profile
      const ownCheck = createMockReqRes({
        user: { id: testStudentProfileId, role: 'STUDENT', institutionId: instId },
        params: { id: testStudentId },
      });
      const guard = resourceGuard({ type: 'student_record' as any });
      await guard(ownCheck.req, ownCheck.res, ownCheck.next);
      assert.equal(ownCheck.wasNextCalled(), true, 'Student accessing own record must pass');

      // Negative check: Student accesses another student's profile
      const otherCheck = createMockReqRes({
        user: { id: testStudentProfileId, role: 'STUDENT', institutionId: instId },
        params: { id: '00000000-0000-0000-0000-000000000099' },
      });
      await guard(otherCheck.req, otherCheck.res, otherCheck.next);
      assert.equal(otherCheck.wasNextCalled(), false, 'Student accessing foreign record must be blocked');
      assert.equal(otherCheck.getStatusCode(), 403);
      assert.equal(otherCheck.getResponseData()?.error?.code || otherCheck.getResponseData()?.code, 'RESOURCE_ACCESS_DENIED');
    });

    await test('Rule 9: Parent may only access verified linked children', async () => {
      // Create user profile for the parent
      testParentProfileId = await createTestProfile('rajesh.parent.test@vid.edu', 'Rajesh Sharma Parent', 'Parent');

      // Link parent's profile_id to the parents table
      await db.query('UPDATE parents SET profile_id = $1 WHERE full_name = $2 AND institution_id = $3', [
        testParentProfileId,
        'Rajesh Sharma',
        instId,
      ]);

      // Positive check: Parent accesses linked child
      const linkedCheck = createMockReqRes({
        user: { id: testParentProfileId, role: 'PARENT', institutionId: instId },
        params: { id: testStudentId },
      });
      const guard = resourceGuard({ type: 'student_record' as any });
      await guard(linkedCheck.req, linkedCheck.res, linkedCheck.next);
      assert.equal(linkedCheck.wasNextCalled(), true, 'Parent accessing linked child must pass');

      // Negative check: Parent accesses unlinked child
      const unlinkedCheck = createMockReqRes({
        user: { id: testParentProfileId, role: 'PARENT', institutionId: instId },
        params: { id: '00000000-0000-0000-0000-000000000099' },
      });
      await guard(unlinkedCheck.req, unlinkedCheck.res, unlinkedCheck.next);
      assert.equal(unlinkedCheck.wasNextCalled(), false, 'Parent accessing unlinked child must be blocked');
      assert.equal(unlinkedCheck.getStatusCode(), 403);
      assert.equal(unlinkedCheck.getResponseData()?.error?.code || unlinkedCheck.getResponseData()?.code, 'RESOURCE_ACCESS_DENIED');
    });

  } finally {
    console.log('\n  🧹 Cleaning up Phase 1 Step C test artifacts...');
    await cleanup();
    console.log('  ✨ Cleanup complete.\n');
  }

  console.log('======================================================');
  console.log(`Phase 1 Step C Tests Complete: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStepCTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
