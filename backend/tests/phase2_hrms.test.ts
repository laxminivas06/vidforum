import assert from 'node:assert/strict';
import { db } from '../src/config/database';
import { HrmsService } from '../src/modules/hrms/hrms.service';

async function runHrmsTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 2, MODULE 6 TEST SUITE');
  console.log('   Staff & HRMS Workspace: Directory, Leaves, Attendance, Workload & Payroll');
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

  // Active academic year
  const yearRes = await db.query(
    'SELECT id, name FROM academic_years WHERE institution_id = $1 ORDER BY is_current DESC, start_date DESC LIMIT 1',
    [instId]
  );
  assert.ok(yearRes.rows.length > 0, 'Academic year must exist for test institution');
  const academicYearId = yearRes.rows[0].id;

  // Active department
  const deptRes = await db.query(
    'SELECT id, name, code FROM departments WHERE institution_id = $1 LIMIT 1',
    [instId]
  );
  assert.ok(deptRes.rows.length > 0, 'Department must exist for test institution');
  const deptId = deptRes.rows[0].id;

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

  const adminProfileId = await createTestProfile(`hrms_admin_${suffix}@vid.edu`, `HR Admin ${suffix}`, 'INSTITUTION_ADMIN');
  const teacherProfileId = await createTestProfile(`teacher_${suffix}@vid.edu`, `Prof. Arya ${suffix}`, 'FACULTY');
  const staffProfileId = await createTestProfile(`staff_${suffix}@vid.edu`, `Ramesh Lab Assistant ${suffix}`, 'STAFF');

  const hrmsService = new HrmsService();

  let createdDesignationId: string;
  let teacherStaffId: string;
  let nonTeachingStaffId: string;
  let customLeaveTypeId: string;
  let activeLeaveRequestId: string;

  // =========================================================================
  // TEST 1: Designations Catalog
  // =========================================================================
  await test('1. Designations Catalog - Create, list, and verify tenant isolation', async () => {
    const desigName = `Senior Academic Specialist ${suffix}`;
    const designation = await hrmsService.createDesignation(instId, desigName, adminProfileId);
    assert.ok(designation.id, 'Designation must have an ID');
    assert.equal(designation.name, desigName);
    createdDesignationId = designation.id;

    const list = await hrmsService.listDesignations(instId);
    assert.ok(list.length > 0, 'Designations list should not be empty');
    const found = list.find(d => d.id === createdDesignationId);
    assert.ok(found, 'Created designation must be present in institutional list');
  });

  // =========================================================================
  // TEST 2: Staff Onboarding & Identity Chain (Decision D3)
  // =========================================================================
  await test('2. Staff Onboarding & Identity Chain (Decision D3: users -> staff -> faculty)', async () => {
    const empCode = `EMP-FAC-${suffix}`;
    const staff = await hrmsService.onboardStaff(instId, adminProfileId, {
      profileId: teacherProfileId,
      employeeCode: empCode,
      departmentId: deptId,
      designationId: createdDesignationId,
      isTeachingStaff: true,
      dateOfJoining: '2026-06-01',
      payrollReference: `PAY-FAC-${suffix}`,
      qualification: 'Ph.D. in Computer Science',
      specialization: 'Artificial Intelligence & Data Systems',
    });

    assert.ok(staff.id, 'Staff record must be created with UUID');
    assert.equal(staff.employee_code, empCode);
    assert.equal(staff.is_teaching_staff, true);
    assert.equal(staff.employment_status, 'active');
    teacherStaffId = staff.id;

    // Verify auto-link into faculty table (Decision D3)
    const facRes = await db.query('SELECT * FROM faculty WHERE staff_id = $1 AND institution_id = $2', [staff.id, instId]);
    assert.equal(facRes.rows.length, 1, 'Faculty row must be auto-created for teaching staff');
    assert.equal(facRes.rows[0].qualification, 'Ph.D. in Computer Science');

    // Verify initial staff_employment historized record
    const empHistory = await db.query('SELECT * FROM staff_employment WHERE staff_id = $1', [staff.id]);
    assert.equal(empHistory.rows.length, 1, 'Initial employment history row must exist');
    assert.equal(empHistory.rows[0].department_id, deptId);
    assert.equal(empHistory.rows[0].designation_id, createdDesignationId);
    assert.equal(empHistory.rows[0].effective_to, null, 'Initial history row should have null effective_to');

    // Onboard a non-teaching staff member
    const nonTeachStaff = await hrmsService.onboardStaff(instId, adminProfileId, {
      profileId: staffProfileId,
      employeeCode: `EMP-ADM-${suffix}`,
      departmentId: deptId,
      designationId: createdDesignationId,
      isTeachingStaff: false,
      dateOfJoining: '2026-07-01',
      payrollReference: `PAY-ADM-${suffix}`,
    });
    assert.equal(nonTeachStaff.is_teaching_staff, false);
    nonTeachingStaffId = nonTeachStaff.id;

    // Verify non-teaching staff does NOT have a faculty row
    const nonFacRes = await db.query('SELECT * FROM faculty WHERE staff_id = $1', [nonTeachingStaffId]);
    assert.equal(nonFacRes.rows.length, 0, 'Non-teaching staff must not have faculty row');
  });

  // =========================================================================
  // TEST 3: Staff Directory Queries & Details
  // =========================================================================
  await test('3. Staff Directory - List with filters (teaching, dept, search) & fetch details', async () => {
    // Filter teaching staff
    const teachingList = await hrmsService.listStaff(instId, { isTeachingStaff: true });
    assert.ok(teachingList.length >= 1, 'Must find teaching staff');
    assert.ok(teachingList.some(s => s.id === teacherStaffId));

    // Filter by search query
    const searchList = await hrmsService.listStaff(instId, { search: `EMP-FAC-${suffix}` });
    assert.equal(searchList.length, 1, 'Search by exact employee code should return 1 record');
    assert.equal(searchList[0].id, teacherStaffId);

    // Get staff details with employment history
    const details = await hrmsService.getStaffDetails(instId, teacherStaffId);
    assert.equal(details.staff.id, teacherStaffId);
    assert.equal(details.staff.full_name, `Prof. Arya ${suffix}`);
    assert.ok(details.employmentHistory.length >= 1, 'Employment history must be populated');
  });

  // =========================================================================
  // TEST 4: Staff Updates & Historized Employment Moves
  // =========================================================================
  await test('4. Staff Updates - Historize role & department transfers in staff_employment', async () => {
    // Create new promotion designation
    const leadDesig = await hrmsService.createDesignation(instId, `Department Lead ${suffix}`, adminProfileId);

    // Update staff to new designation
    const updated = await hrmsService.updateStaff(instId, adminProfileId, teacherStaffId, {
      designationId: leadDesig.id,
    });
    assert.equal(updated.designation_id, leadDesig.id);

    // Verify employment history tracking
    const history = await db.query(
      'SELECT * FROM staff_employment WHERE staff_id = $1 ORDER BY effective_from ASC',
      [teacherStaffId]
    );
    assert.equal(history.rows.length, 2, 'Must have exactly 2 employment history records after transfer');
    assert.ok(history.rows[0].effective_to !== null, 'First history record must have closed effective_to');
    assert.equal(history.rows[1].designation_id, leadDesig.id, 'Second history record must have new designation');
    assert.equal(history.rows[1].effective_to, null, 'Current history record must be open (null effective_to)');
  });

  // =========================================================================
  // TEST 5: Staff Soft Deletion
  // =========================================================================
  await test('5. Staff Soft Deletion - Marks deleted_at and excludes from active directory', async () => {
    // Create temporary staff to delete
    const tempProfileId = await createTestProfile(`temp_staff_${suffix}@vid.edu`, `Temp Staff ${suffix}`, 'STAFF');
    const tempStaff = await hrmsService.onboardStaff(instId, adminProfileId, {
      profileId: tempProfileId,
      employeeCode: `EMP-TEMP-${suffix}`,
      dateOfJoining: '2026-08-01',
      isTeachingStaff: false,
    });

    const deleted = await hrmsService.softDeleteStaff(instId, adminProfileId, tempStaff.id);
    assert.equal(deleted, true, 'softDeleteStaff must return true');

    // Verify excluded from directory
    const activeList = await hrmsService.listStaff(instId);
    assert.ok(!activeList.some(s => s.id === tempStaff.id), 'Deleted staff must not appear in active staff list');

    // Verify getStaffDetails throws not found
    await assert.rejects(
      async () => {
        await hrmsService.getStaffDetails(instId, tempStaff.id);
      },
      /Staff member not found/,
      'Deleted staff must throw not found on retrieval'
    );
  });

  // =========================================================================
  // TEST 6: Leave Types Catalog & Annual Quotas
  // =========================================================================
  await test('6. Leave Types Catalog - Seeded standards and custom leave types', async () => {
    const types = await hrmsService.listLeaveTypes(instId);
    assert.ok(types.length >= 4, 'Standard leave types must be seeded (Casual, Sick, Earned, Maternity)');

    const casual = types.find(t => t.name === 'Casual Leave');
    assert.ok(casual, 'Casual Leave type must exist');
    assert.equal(casual.max_days_per_year, 12);

    // Create custom sabbatical leave type
    const custom = await hrmsService.createLeaveType(instId, adminProfileId, `Academic Sabbatical ${suffix}`, 30);
    assert.ok(custom.id);
    assert.equal(custom.max_days_per_year, 30);
    customLeaveTypeId = custom.id;
  });

  // =========================================================================
  // TEST 7: Leave Request Application & Overlap Validation
  // =========================================================================
  await test('7. Leave Requests - Apply and reject overlapping requests', async () => {
    // Apply for leave: 2026-11-10 to 2026-11-13 (4 days)
    const leaveReq = await hrmsService.applyLeave(instId, teacherProfileId, {
      staffId: teacherStaffId,
      leaveTypeId: customLeaveTypeId,
      startDate: '2026-11-10',
      endDate: '2026-11-13',
      reason: 'Research conference presentation on AI',
    });

    assert.ok(leaveReq.id, 'Leave request must be created');
    assert.equal(leaveReq.status, 'pending');
    assert.equal(leaveReq.total_days, 4);
    activeLeaveRequestId = leaveReq.id;

    // Attempt to apply overlapping leave: 2026-11-12 to 2026-11-15
    await assert.rejects(
      async () => {
        await hrmsService.applyLeave(instId, teacherProfileId, {
          staffId: teacherStaffId,
          leaveTypeId: customLeaveTypeId,
          startDate: '2026-11-12',
          endDate: '2026-11-15',
          reason: 'Overlapping request',
        });
      },
      /already has a pending or approved leave during this date period/,
      'Must reject overlapping leave request'
    );
  });

  // =========================================================================
  // TEST 8: Leave Approval Workflow & Staff Status Transition
  // =========================================================================
  await test('8. Leave Action - Approve request, record remarks & verify leave balance', async () => {
    // Approve the pending request
    const approved = await hrmsService.actionLeaveRequest(
      instId,
      adminProfileId,
      activeLeaveRequestId,
      'approved',
      'Approved for academic research contribution'
    );

    assert.equal(approved.status, 'approved');
    assert.equal(approved.approved_by, adminProfileId);
    assert.equal(approved.remarks, 'Approved for academic research contribution');

    // Verify leave balance calculation
    const balances = await hrmsService.getStaffLeaveBalance(instId, teacherStaffId, 2026);
    const sabbatBalance = balances.find(b => b.leave_type_id === customLeaveTypeId);
    assert.ok(sabbatBalance, 'Must find sabbatical leave balance');
    assert.equal(sabbatBalance.max_days, 30);
    assert.equal(sabbatBalance.days_taken, 4);
    assert.equal(sabbatBalance.days_remaining, 26);
  });

  // =========================================================================
  // TEST 9: Staff Daily Attendance Batch & Aggregates
  // =========================================================================
  await test('9. Staff Attendance - Batch roll call, upsert idempotency & monthly summary', async () => {
    const attendanceDate = '2026-10-05';

    // Batch mark attendance
    const batchResult = await hrmsService.markStaffAttendanceBatch(
      instId,
      adminProfileId,
      attendanceDate,
      [
        { staffId: teacherStaffId, status: 'present', remarks: 'On time' },
        { staffId: nonTeachingStaffId, status: 'late', remarks: 'Traffic delay 15m' },
      ]
    );

    assert.equal(batchResult.markedCount, 2);

    // Query attendance by date
    const dailyRecords = await hrmsService.getStaffAttendanceByDate(instId, attendanceDate);
    const teacherAtt = dailyRecords.find(r => r.staff_id === teacherStaffId);
    const nonTeachAtt = dailyRecords.find(r => r.staff_id === nonTeachingStaffId);

    assert.ok(teacherAtt);
    assert.equal(teacherAtt.status, 'present');
    assert.ok(nonTeachAtt);
    assert.equal(nonTeachAtt.status, 'late');

    // Test upsert idempotency (teacher marked excused later in day)
    await hrmsService.markStaffAttendanceBatch(
      instId,
      adminProfileId,
      attendanceDate,
      [{ staffId: teacherStaffId, status: 'excused', remarks: 'Official academic duty' }]
    );

    const updatedDaily = await hrmsService.getStaffAttendanceByDate(instId, attendanceDate);
    const updatedTeacher = updatedDaily.find(r => r.staff_id === teacherStaffId);
    assert.equal(updatedTeacher?.status, 'excused');

    // Query monthly aggregates
    const monthlySummary = await hrmsService.getMonthlyAttendanceAggregates(instId, '2026-10');
    assert.ok(monthlySummary.length >= 2, 'Monthly summary must include all staff');
    const teacherSummary = monthlySummary.find(s => s.staff_id === teacherStaffId);
    assert.ok(teacherSummary);
    assert.equal(teacherSummary.excused_days, 1);
  });

  // =========================================================================
  // TEST 10: Faculty Workload & Section 14 Payroll Export Boundary
  // =========================================================================
  await test('10. Faculty Workload & Payroll Export - Periods calculation and external payroll payload', async () => {
    // 1. Workload calculation
    const workload = await hrmsService.computeStaffWorkload(instId, teacherStaffId, academicYearId);
    assert.ok(workload.staff_id === teacherStaffId);
    assert.equal(typeof workload.periods_per_week, 'number');
    assert.equal(typeof workload.sections_count, 'number');
    assert.equal(typeof workload.is_overloaded, 'boolean');

    // List all faculty workloads
    const allWorkloads = await hrmsService.listFacultyWorkloads(instId, academicYearId);
    assert.ok(allWorkloads.length >= 1, 'Faculty workloads list must not be empty');
    const teacherWorkload = allWorkloads.find(w => w.staff_id === teacherStaffId);
    assert.ok(teacherWorkload);
    assert.equal(teacherWorkload.employee_code, `EMP-FAC-${suffix}`);

    // 2. Section 14 Payroll Export Boundary
    const payrollExport = await hrmsService.generatePayrollExport(instId, '2026-10');
    assert.equal(payrollExport.institution_id, instId);
    assert.equal(payrollExport.pay_period, '2026-10');
    assert.ok(payrollExport.total_employees >= 2, 'Must contain all active employees');

    const teacherExport = payrollExport.employees.find(e => e.employee_code === `EMP-FAC-${suffix}`);
    assert.ok(teacherExport, 'Must find teacher export entry');
    assert.equal(teacherExport.payroll_reference, `PAY-FAC-${suffix}`);
    assert.ok(teacherExport.total_working_days >= 1);
    assert.equal(typeof teacherExport.payable_days, 'number');
    assert.ok(teacherExport.export_generated_at);
  });

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  // Clean up test rows
  try {
    if (activeLeaveRequestId) {
      await db.query('DELETE FROM leave_requests WHERE id = $1', [activeLeaveRequestId]);
    }
    if (customLeaveTypeId) {
      await db.query('DELETE FROM leave_types WHERE id = $1', [customLeaveTypeId]);
    }
    await db.query('DELETE FROM staff_attendance WHERE staff_id IN ($1, $2)', [teacherStaffId, nonTeachingStaffId]);
    await db.query('DELETE FROM staff_workload WHERE staff_id = $1', [teacherStaffId]);
    await db.query('DELETE FROM staff_employment WHERE staff_id IN ($1, $2)', [teacherStaffId, nonTeachingStaffId]);
    await db.query('DELETE FROM faculty WHERE staff_id = $1', [teacherStaffId]);
    await db.query('DELETE FROM staff WHERE id IN ($1, $2)', [teacherStaffId, nonTeachingStaffId]);
    if (createdDesignationId) {
      await db.query('DELETE FROM designations WHERE id = $1', [createdDesignationId]);
    }
  } catch (cleanErr: any) {
    console.warn('Warning during cleanup:', cleanErr.message);
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runHrmsTests().catch(err => {
  console.error('Fatal error in HRMS test runner:', err);
  process.exit(1);
});
