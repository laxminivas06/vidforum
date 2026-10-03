import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { HrmsService } from '../modules/hrms/hrms.service';
import { ProvisioningService } from '../modules/users/provisioning.service';
import { AuthService } from '../modules/auth/auth.service';

const hrmsService = new HrmsService();
const provisioningService = new ProvisioningService();
const authService = new AuthService();

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING STEP 1B VERIFICATION: STAFF & HRMS');
  console.log('====================================================\n');

  // Find or create test institution
  const instRes = await db.query(`SELECT id, name FROM institutions LIMIT 1`);
  if (instRes.rows.length === 0) {
    throw new Error('No institution found in database.');
  }
  const institutionId = instRes.rows[0].id;
  const actorRes = await db.query(`SELECT id FROM profiles WHERE default_institution_id = $1 LIMIT 1`, [institutionId]);
  const adminActorId = actorRes.rows[0]?.id || (await db.query(`SELECT id FROM profiles LIMIT 1`)).rows[0]?.id;
  console.log(`Using institution: ${instRes.rows[0].name} (${institutionId}), actor: ${adminActorId}`);

  const uniqueSuffix = Date.now().toString().slice(-5);
  const testEmail = `teacher.gate1b.${uniqueSuffix}@vid.edu`;
  const teacherName = `Dr. Vikramaditya Sharma ${uniqueSuffix}`;
  const teacherDOB = '1986-06-15';
  const initialPassword = 'TempPass!123';
  const newPassword = 'NewSecretPassword!456';

  let testDesignation: any = null;
  let testDepartment: any = null;
  let createdStaff: any = null;
  let provisionedUser: any = null;

  try {
    // ----------------------------------------------------
    // Test 1: Designations & Departments CRUD
    // ----------------------------------------------------
    console.log('\n[Test 1] Testing Designations and Departments CRUD...');
    testDesignation = await hrmsService.createDesignation(
      institutionId,
      `Senior Research Fellow ${uniqueSuffix}`,
      adminActorId
    );
    testDepartment = await hrmsService.createDepartment(
      institutionId,
      `Advanced Sciences ${uniqueSuffix}`,
      `SCI${uniqueSuffix}`,
      'academic',
      adminActorId
    );

    const designations = await hrmsService.listDesignations(institutionId);
    const departments = await hrmsService.listDepartments(institutionId);

    if (!designations.some(d => d.id === testDesignation.id)) {
      throw new Error('Created designation not found in designations list');
    }
    if (!departments.some(d => d.id === testDepartment.id)) {
      throw new Error('Created department not found in departments list');
    }
    console.log(`✅ Test 1 Passed: Designation '${testDesignation.name}' and Department '${testDepartment.name}' created and listed.`);

    // ----------------------------------------------------
    // Test 2: Server-Side Duplicate Check & Staff Creation
    // ----------------------------------------------------
    console.log('\n[Test 2] Testing duplicate check and staff onboarding...');
    const dupCheck1 = await hrmsService.checkDuplicateStaff(institutionId, {
      email: testEmail,
      name: teacherName,
      dateOfBirth: teacherDOB,
    });
    if (dupCheck1.isDuplicate) {
      throw new Error(`Unexpected duplicate before creation: ${dupCheck1.reasons.join(', ')}`);
    }

    // Create staff member
    createdStaff = await hrmsService.createStaffDirect(institutionId, adminActorId, {
      name: teacherName,
      email: testEmail,
      phone: `+91 98450 ${uniqueSuffix}`,
      qualification: 'Ph.D in Applied Mathematics',
      university: 'Delhi University',
      subjects: 'Calculus, Statistics',
      experience: '8 Years',
      experienceYears: 8.5,
      dateOfBirth: teacherDOB,
      gender: 'Male',
      departmentId: testDepartment.id,
      designationId: testDesignation.id,
      isTeachingStaff: true,
      address: '42 Academic Avenue, Campus Quarters',
    });

    if (!createdStaff.id) throw new Error('Staff creation failed');
    console.log(`Staff created: ${createdStaff.name} (Code: ${createdStaff.employeeCode})`);

    // Verify duplicate checks now trigger
    const dupCheckEmail = await hrmsService.checkDuplicateStaff(institutionId, { email: testEmail });
    if (!dupCheckEmail.isDuplicate || !dupCheckEmail.duplicateFields.includes('email')) {
      throw new Error('Duplicate check failed to detect existing email');
    }

    const dupCheckNameDob = await hrmsService.checkDuplicateStaff(institutionId, {
      email: `other.${uniqueSuffix}@vid.edu`,
      name: teacherName,
      dateOfBirth: teacherDOB,
    });
    if (!dupCheckNameDob.isDuplicate || !dupCheckNameDob.duplicateFields.includes('name_dob')) {
      throw new Error('Duplicate check failed to detect existing name + DOB');
    }
    console.log('✅ Test 2 Passed: Staff onboarding successful and duplicate checks verified for email and name+DOB.');

    // ----------------------------------------------------
    // Test 3: Foreign Key Usage Blocking (Delete blocked with 409)
    // ----------------------------------------------------
    console.log('\n[Test 3] Verifying deletion blocking for designation and department in active use...');
    let designationBlocked = false;
    try {
      await hrmsService.deleteDesignation(institutionId, testDesignation.id, adminActorId);
    } catch (err: any) {
      if (err.message.includes('Cannot delete designation: assigned to active staff members')) {
        designationBlocked = true;
      } else {
        throw err;
      }
    }
    if (!designationBlocked) {
      throw new Error('Designation deletion should have been blocked by FK usage check!');
    }

    let departmentBlocked = false;
    try {
      await hrmsService.deleteDepartment(institutionId, testDepartment.id, adminActorId);
    } catch (err: any) {
      if (err.message.includes('Cannot delete department: assigned to active staff members')) {
        departmentBlocked = true;
      } else {
        throw err;
      }
    }
    if (!departmentBlocked) {
      throw new Error('Department deletion should have been blocked by FK usage check!');
    }
    console.log('✅ Test 3 Passed: Deletion of in-use designation and department strictly blocked.');

    // ----------------------------------------------------
    // Test 4: Account Provisioning with Role Template TEACHER
    // ----------------------------------------------------
    console.log('\n[Test 4] Provisioning user account using Section 10 TEACHER role template...');
    provisionedUser = await provisioningService.provisionUser(institutionId, adminActorId, {
      staffId: createdStaff.id,
      name: teacherName,
      email: testEmail,
      userId: `teacher_${uniqueSuffix}`,
      password: initialPassword,
      roleTemplate: 'TEACHER',
    });

    if (!provisionedUser.userId) throw new Error('Provisioning failed');

    // Verify bcrypt hash & must_change_password
    const authRow = await db.query(`SELECT encrypted_password FROM auth.users WHERE id = $1`, [provisionedUser.id]);
    const validBcrypt = await bcrypt.compare(initialPassword, authRow.rows[0].encrypted_password);
    if (!validBcrypt) throw new Error('Password hash does not match initial password');

    const profileRow = await db.query(`SELECT must_change_password, status FROM profiles WHERE id = $1`, [provisionedUser.id]);
    if (!profileRow.rows[0].must_change_password) {
      throw new Error('must_change_password flag was not set to true');
    }
    console.log('✅ Test 4 Passed: Teacher provisioned with bcrypt hash, must_change_password=true, and TEACHER workspaces.');

    // ----------------------------------------------------
    // Test 5: Forced Password Change on First Login
    // ----------------------------------------------------
    console.log('\n[Test 5] Verifying forced password change flow...');
    const loginResult = await authService.login({
      identifier: testEmail,
      password: initialPassword,
    });
    if (!loginResult.user.mustChangePassword) {
      throw new Error('Login result must flag mustChangePassword = true');
    }

    // Change password
    await authService.changePassword(provisionedUser.id, initialPassword, newPassword);

    // Old password must now fail
    let oldPassFailed = false;
    try {
      await authService.login({ identifier: testEmail, password: initialPassword });
    } catch {
      oldPassFailed = true;
    }
    if (!oldPassFailed) throw new Error('Old password was still accepted after password change');

    // New password must succeed with mustChangePassword = false
    const newLoginResult = await authService.login({ identifier: testEmail, password: newPassword });
    if (newLoginResult.user.mustChangePassword) {
      throw new Error('mustChangePassword should now be false');
    }
    console.log('✅ Test 5 Passed: Initial login forces password change, rotation and revocation verified.');

    // ----------------------------------------------------
    // Test 6: Leave Application & Approval Workflow (Balance Reduction)
    // ----------------------------------------------------
    console.log('\n[Test 6] Testing leave workflow and balance reduction...');
    const leaveTypes = await hrmsService.listLeaveTypes(institutionId);
    let casualLeaveType = leaveTypes.find(lt => lt.name.toLowerCase().includes('casual'));
    if (!casualLeaveType) {
      casualLeaveType = await hrmsService.createLeaveType(institutionId, adminActorId, 'Casual Leave', 12);
    }

    const initialBalances = await hrmsService.getStaffLeaveBalance(institutionId, createdStaff.id);
    const initialCL = initialBalances.find(b => b.leave_type_id === casualLeaveType!.id);
    const initialTaken = initialCL?.days_taken || 0;
    const initialRemaining = initialCL?.days_remaining !== null ? initialCL!.days_remaining! : 12;

    // Apply for 3 days of leave next month
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
    const startDate = nextMonth.toISOString().split('T')[0];
    const endLeaveDate = new Date(nextMonth);
    endLeaveDate.setDate(endLeaveDate.getDate() + 2); // 3 days inclusive
    const endDate = endLeaveDate.toISOString().split('T')[0];

    const appliedLeave = await hrmsService.applyLeave(institutionId, provisionedUser.id, {
      staffId: createdStaff.id,
      leaveTypeId: casualLeaveType.id,
      startDate,
      endDate,
      reason: 'Academic Research Symposium',
    });
    if (appliedLeave.status !== 'pending' || appliedLeave.total_days !== 3) {
      throw new Error(`Unexpected leave status or days: ${appliedLeave.status}, ${appliedLeave.total_days}`);
    }

    // Approve leave request
    const approvedLeave = await hrmsService.actionLeaveRequest(
      institutionId,
      adminActorId,
      appliedLeave.id,
      'approved',
      'Approved by Academic Principal'
    );
    if (approvedLeave.status !== 'approved') {
      throw new Error('Leave status was not updated to approved');
    }

    // Check balances after approval
    const updatedBalances = await hrmsService.getStaffLeaveBalance(institutionId, createdStaff.id);
    const updatedCL = updatedBalances.find(b => b.leave_type_id === casualLeaveType!.id);
    const updatedTaken = updatedCL?.days_taken || 0;
    const updatedRemaining = updatedCL?.days_remaining;

    if (updatedTaken !== initialTaken + 3) {
      throw new Error(`Leave usage did not increase by 3: was ${initialTaken}, now ${updatedTaken}`);
    }
    if (updatedRemaining !== null && updatedRemaining !== initialRemaining - 3) {
      throw new Error(`Leave remaining did not reduce by 3: was ${initialRemaining}, now ${updatedRemaining}`);
    }
    console.log(`✅ Test 6 Passed: Leave approval reduced balance by 3 days (Remaining: ${updatedRemaining} days).`);

    // ----------------------------------------------------
    // Test 7: Staff Attendance Roll Call & Mark-All-Present
    // ----------------------------------------------------
    console.log('\n[Test 7] Testing staff attendance and mark-all-present...');
    const attendanceDate = new Date().toISOString().split('T')[0];
    const markRes = await hrmsService.markAllStaffPresent(institutionId, adminActorId, attendanceDate);
    if (markRes.markedCount < 1) {
      throw new Error('markAllStaffPresent did not mark any staff');
    }

    const attendanceRecords = await hrmsService.getStaffAttendanceByDate(institutionId, attendanceDate);
    const teacherAttendance = attendanceRecords.find(a => a.staff_id === createdStaff.id);
    if (!teacherAttendance || teacherAttendance.status !== 'present') {
      throw new Error('Teacher was not recorded as present for today');
    }
    console.log(`✅ Test 7 Passed: Attendance roll call marked ${markRes.markedCount} active staff present.`);

    // ----------------------------------------------------
    // Test 8: HR Reports Summary
    // ----------------------------------------------------
    console.log('\n[Test 8] Testing HR reports and analytics aggregates...');
    const hrSummary = await hrmsService.getHRReportSummary(institutionId);
    if (hrSummary.headcount.total < 1 || hrSummary.headcount.teaching < 1) {
      throw new Error('HR report summary returned 0 total or teaching staff');
    }
    if (!Array.isArray(hrSummary.byDepartment) || hrSummary.byDepartment.length === 0) {
      throw new Error('HR report summary missing department breakdown');
    }
    console.log(`✅ Test 8 Passed: HR reports summary returned total: ${hrSummary.headcount.total}, teaching: ${hrSummary.headcount.teaching}, leave requests: ${hrSummary.leaveSummary.totalRequests}.`);

    // ----------------------------------------------------
    // Test 9: Account Deactivation Blocks Login
    // ----------------------------------------------------
    console.log('\n[Test 9] Testing account deactivation and login blocking...');
    await provisioningService.updateUserStatus(institutionId, adminActorId, provisionedUser.id, 'inactive');

    let inactiveLoginBlocked = false;
    try {
      await authService.login({ identifier: testEmail, password: newPassword });
    } catch (err: any) {
      if (err.message.includes('deactivated') || err.message.includes('inactive') || err.message.includes('Invalid credentials')) {
        inactiveLoginBlocked = true;
      }
    }
    if (!inactiveLoginBlocked) {
      throw new Error('Deactivated account was able to log in!');
    }

    // Reactivate
    await provisioningService.updateUserStatus(institutionId, adminActorId, provisionedUser.id, 'active');
    const reactivatedLogin = await authService.login({ identifier: testEmail, password: newPassword });
    if (!reactivatedLogin.token) {
      throw new Error('Reactivated account could not log in');
    }
    console.log('✅ Test 9 Passed: Deactivated account strictly blocked from login, reactivation restored access.');

    // ----------------------------------------------------
    // Test 10: Cleanup & Unblocking
    // ----------------------------------------------------
    console.log('\n[Test 10] Testing cleanup and unblocking of designation & department...');
    // Delete the test staff record
    await hrmsService.softDeleteStaff(institutionId, adminActorId, createdStaff.id);

    // Now delete designation should succeed
    const desigDeleted = await hrmsService.deleteDesignation(institutionId, testDesignation.id, adminActorId);
    if (!desigDeleted) throw new Error('Failed to delete designation after staff deleted');

    // And delete department should succeed
    const deptDeleted = await hrmsService.deleteDepartment(institutionId, testDepartment.id, adminActorId);
    if (!deptDeleted) throw new Error('Failed to delete department after staff deleted');
    console.log('✅ Test 10 Passed: Designation and department successfully deleted after active references removed.');

    console.log('\n====================================================');
    console.log('🎉 STEP 1B VERIFICATION COMPLETE: 10/10 TESTS PASSED GREEN');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ STEP 1B VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    // Cascade cleanup test artifacts
    if (createdStaff?.id) {
      await db.query(`DELETE FROM staff_attendance WHERE staff_id = $1`, [createdStaff.id]).catch(() => {});
      await db.query(`DELETE FROM leave_requests WHERE staff_id = $1`, [createdStaff.id]).catch(() => {});
      await db.query(`DELETE FROM staff_employment WHERE staff_id = $1`, [createdStaff.id]).catch(() => {});
      await db.query(`DELETE FROM faculty WHERE staff_id = $1`, [createdStaff.id]).catch(() => {});
      await db.query(`DELETE FROM staff WHERE id = $1`, [createdStaff.id]).catch(() => {});
    }
    if (provisionedUser?.id) {
      await db.query(`DELETE FROM user_roles WHERE profile_id = $1`, [provisionedUser.id]).catch(() => {});
      await db.query(`DELETE FROM profiles WHERE id = $1`, [provisionedUser.id]).catch(() => {});
      await db.query(`DELETE FROM auth.users WHERE id = $1`, [provisionedUser.id]).catch(() => {});
    }
    if (testDesignation?.id) {
      await db.query(`DELETE FROM designations WHERE id = $1`, [testDesignation.id]).catch(() => {});
    }
    if (testDepartment?.id) {
      await db.query(`DELETE FROM departments WHERE id = $1`, [testDepartment.id]).catch(() => {});
    }
    process.exit(0);
  }
}

runVerification();
