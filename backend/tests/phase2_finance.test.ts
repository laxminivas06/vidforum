import assert from 'node:assert/strict';
import { db } from '../src/config/database';
import { financeService } from '../src/modules/finance/finance.service';
import { studentRepository } from '../src/modules/students/student.repository';

async function runFinanceTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 2, MODULE 2 TEST SUITE');
  console.log('   Finance & Fees, Invoicing, Payments, Idempotent Webhook');
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

  // Setup test Academic Year
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
      [instId, `AY 2026-27 Fin ${suffix}`]
    );
    academicYearId = ayRes.rows[0].id;
    createdTestAY = true;
  }

  // Setup Department & Class & Section
  let deptRes = await db.query(
    `INSERT INTO departments (institution_id, name, code, department_type)
     VALUES ($1, $2, $3, 'academic')
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `Commerce Dept ${suffix}`, `COM-${suffix}`]
  );
  const departmentId = deptRes.rows[0].id;

  let classRes = await db.query(
    `INSERT INTO classes (institution_id, name, academic_year_id, department_id, sequence_order)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (institution_id, academic_year_id, department_id, name) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
     RETURNING id`,
    [instId, `Grade 11 Fin ${suffix}`, academicYearId, departmentId]
  );
  const classId = classRes.rows[0].id;

  let secRes = await db.query(
    `INSERT INTO sections (institution_id, class_id, name, capacity)
     VALUES ($1, $2, 'Section A', 30)
     ON CONFLICT (class_id, name) DO UPDATE SET capacity = EXCLUDED.capacity
     RETURNING id`,
    [instId, classId]
  );
  const sectionId = secRes.rows[0].id;

  // Setup Student Profile & Master Record
  const studentProfileId = await createTestProfile(`student_fin_${suffix}@vidtest.edu`, `Student Fin ${suffix}`, 'STUDENT');
  const parentProfileId = await createTestProfile(`parent_fin_${suffix}@vidtest.edu`, `Parent Fin ${suffix}`, 'PARENT');
  const facultyProfileId = await createTestProfile(`faculty_fin_${suffix}@vidtest.edu`, `Prof. Fin ${suffix}`, 'TEACHER');

  // Setup Application & Admission (Decision D6)
  const appRes = await db.query(
    `INSERT INTO applications (institution_id, applicant_name, date_of_birth, gender, applying_for_class_id, academic_year_id, stage)
     VALUES ($1, 'Fin Student', '2008-05-15', 'male', $2, $3, 'approved')
     RETURNING id`,
    [instId, classId, academicYearId]
  );
  const applicationId = appRes.rows[0].id;

  const admRes = await db.query(
    `INSERT INTO admissions (institution_id, application_id, approved_class_id, approved_section_id, academic_year_id, decision, admission_fee_status, decided_by)
     VALUES ($1, $2, $3, $4, $5, 'approved', 'pending', $6)
     RETURNING id`,
    [instId, applicationId, classId, sectionId, academicYearId, studentProfileId]
  );
  const admissionId = admRes.rows[0].id;

  let studentRes = await db.query(
    `INSERT INTO students (institution_id, user_id, admission_number, roll_number, first_name, last_name, gender, date_of_birth, current_class_id, current_section_id, admission_id, status)
     VALUES ($1, $2, $3, $4, 'Fin', 'Student', 'male', '2008-05-15', $5, $6, $7, 'active')
     RETURNING id`,
    [instId, studentProfileId, `ADM-FIN-${suffix}`, `ROLL-FIN-${suffix}`, classId, sectionId, admissionId]
  );
  const studentId = studentRes.rows[0].id;

  // Link Parent to Student
  const parentRes = await db.query(
    `INSERT INTO parents (institution_id, profile_id, full_name, relationship)
     VALUES ($1, $2, 'Parent Fin', 'father')
     RETURNING id`,
    [instId, parentProfileId]
  );
  const parentDbId = parentRes.rows[0].id;

  await db.query(
    `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary_contact)
     VALUES ($1, $2, 'father', true)`,
    [studentId, parentDbId]
  );

  // Entities created during tests
  let category1Id: string;
  let category2Id: string;
  let feeGroupId: string;
  let feeStructureId: string;
  let discountId: string;
  let studentFeeId: string;
  let invoiceId: string;
  let paymentId1: string;

  // Cleanup helper
  async function cleanup() {
    try {
      if (invoiceId) {
        await db.query('DELETE FROM payment_gateway_transactions WHERE payment_id IN (SELECT id FROM payments WHERE invoice_id = $1)', [invoiceId]);
        await db.query('DELETE FROM refunds WHERE payment_id IN (SELECT id FROM payments WHERE invoice_id = $1)', [invoiceId]);
        await db.query('DELETE FROM receipts WHERE payment_id IN (SELECT id FROM payments WHERE invoice_id = $1)', [invoiceId]);
        await db.query('DELETE FROM payments WHERE invoice_id = $1', [invoiceId]);
        await db.query('DELETE FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
        await db.query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
      }
      if (studentFeeId) {
        await db.query('DELETE FROM student_discounts WHERE student_id = $1', [studentId]);
        await db.query('DELETE FROM student_fees WHERE id = $1', [studentFeeId]);
      }
      if (feeStructureId) {
        await db.query('DELETE FROM fee_structure_items WHERE fee_structure_id = $1', [feeStructureId]);
        await db.query('DELETE FROM fee_structures WHERE id = $1', [feeStructureId]);
      }
      if (discountId) await db.query('DELETE FROM discounts WHERE id = $1', [discountId]);
      if (feeGroupId) await db.query('DELETE FROM fee_groups WHERE id = $1', [feeGroupId]);
      if (category1Id) await db.query('DELETE FROM fee_categories WHERE id = $1', [category1Id]);
      if (category2Id) await db.query('DELETE FROM fee_categories WHERE id = $1', [category2Id]);
      await db.query('DELETE FROM payment_webhook_events WHERE event_id LIKE $1', [`%${suffix}%`]);
      await db.query('DELETE FROM student_parents WHERE student_id = $1', [studentId]);
      await db.query('DELETE FROM students WHERE id = $1', [studentId]);
      await db.query('DELETE FROM admissions WHERE id = $1', [admissionId]);
      await db.query('DELETE FROM applications WHERE id = $1', [applicationId]);
      await db.query('DELETE FROM parents WHERE id = $1', [parentDbId]);
      await db.query('DELETE FROM sections WHERE id = $1', [sectionId]);
      await db.query('DELETE FROM classes WHERE id = $1', [classId]);
      await db.query('DELETE FROM departments WHERE id = $1', [departmentId]);
      if (createdTestAY) {
        await db.query('DELETE FROM academic_years WHERE id = $1', [academicYearId]);
      }
      await db.query('DELETE FROM user_roles WHERE profile_id IN ($1, $2, $3)', [studentProfileId, parentProfileId, facultyProfileId]);
      await db.query('DELETE FROM profiles WHERE id IN ($1, $2, $3)', [studentProfileId, parentProfileId, facultyProfileId]);
      await db.query('DELETE FROM auth.users WHERE id IN ($1, $2, $3)', [studentProfileId, parentProfileId, facultyProfileId]);
    } catch (e: any) {
      console.warn('Cleanup warning:', e.message);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Configure Fee Categories, Groups, and Structures
    // -------------------------------------------------------------
    await test('Configure fee categories, fee group, and fee structure with items', async () => {
      // 1. Fee Categories
      const cat1 = await financeService.createFeeCategory(instId, `Tuition Fee ${suffix}`);
      assert.ok(cat1.id, 'Category 1 created');
      category1Id = cat1.id;

      const cat2 = await financeService.createFeeCategory(instId, `Lab & Library ${suffix}`);
      assert.ok(cat2.id, 'Category 2 created');
      category2Id = cat2.id;

      // 2. Fee Group
      const group = await financeService.createFeeGroup(instId, `Higher Secondary Group ${suffix}`);
      assert.ok(group.id, 'Fee group created');
      feeGroupId = group.id;

      // 3. Fee Structure
      const structure = await financeService.createFeeStructure(
        instId,
        {
          name: `Grade 11 Standard Fee ${suffix}`,
          feeGroupId,
          academicYearId,
          classId,
          items: [
            { feeCategoryId: category1Id, amount: 5000 },
            { feeCategoryId: category2Id, amount: 1000 },
          ],
        },
        studentProfileId
      );

      assert.ok(structure.id, 'Fee structure created');
      assert.equal(structure.totalAmount, 6000, 'Total fee structure amount must equal 6000');
      feeStructureId = structure.id;

      // Verify audit event
      const auditRes = await db.query(
        "SELECT id FROM audit_logs WHERE institution_id = $1 AND action = 'finance.fee_structure_created' AND resource_id = $2",
        [instId, feeStructureId]
      );
      assert.ok(auditRes.rows.length > 0, 'Audit event for fee_structure_created must exist');
    });

    // -------------------------------------------------------------
    // Test 2: Configure Discounts and Scholarships
    // -------------------------------------------------------------
    await test('Configure percentage discount and flat scholarship', async () => {
      const disc = await financeService.createDiscount(instId, {
        name: `Merit Discount 10% ${suffix}`,
        discountType: 'percentage',
        value: 10,
      });
      assert.ok(disc.id, 'Discount created');
      discountId = disc.id;

      const schol = await financeService.createScholarship(instId, {
        name: `Merit Scholarship ${suffix}`,
        sponsor: 'Alumni Trust',
        value: 500,
      });
      assert.ok(schol.id, 'Scholarship created');
    });

    // -------------------------------------------------------------
    // Test 3: Fee Assignment to Student Master & Initial Invoicing
    // -------------------------------------------------------------
    await test('Assign fee structure to student with discount and generate initial invoice', async () => {
      // Gross fee is 6000, 10% discount is 600, Net fee should be 5400
      const assigned = await financeService.assignFeeToStudent(
        instId,
        {
          studentId,
          feeStructureId,
          academicYearId,
          discountId,
          dueDate: '2026-11-30',
        },
        studentProfileId
      );

      assert.ok(assigned.studentFee.id, 'Student fee assigned');
      studentFeeId = assigned.studentFee.id;
      assert.equal(assigned.grossAmount, 6000, 'Gross amount is 6000');
      assert.equal(assigned.discountAmount, 600, 'Discount is 600 (10%)');
      assert.equal(assigned.netAmount, 5400, 'Net payable amount is 5400');
      assert.equal(assigned.studentFee.balanceDue, 5400, 'Initial balance due must be 5400');

      // Initial Invoice check
      assert.ok(assigned.invoice.id, 'Invoice generated automatically');
      invoiceId = assigned.invoice.id;
      assert.equal(assigned.invoice.status, 'pending', 'Invoice status starts as pending');
      assert.equal(assigned.invoice.totalAmount, 5400, 'Invoice total matches net fee');

      // Check student discounts row created
      const discCheck = await db.query('SELECT * FROM student_discounts WHERE student_id = $1', [studentId]);
      assert.equal(discCheck.rows.length, 1, 'Student discount record must be created');
    });

    // -------------------------------------------------------------
    // Test 4: Partial Payment Flow & Atomic Receipt Generation
    // -------------------------------------------------------------
    await test('Record partial payment ($2000), update balance to $3400, set invoice partially_paid', async () => {
      const payment = await financeService.processPayment(
        instId,
        {
          invoiceId,
          studentId,
          amount: 2000,
          method: 'upi',
        },
        studentProfileId
      );

      assert.ok(payment.id, 'Payment recorded');
      paymentId1 = payment.id;
      assert.ok(payment.receiptNumber, 'Receipt number generated');
      assert.equal(payment.amount, 2000, 'Payment amount is 2000');

      // Verify invoice status and balance
      const invoice = await financeService.getInvoice(instId, invoiceId);
      assert.equal(invoice?.status, 'partially_paid', 'Invoice status must transition to partially_paid');

      // Verify student fee balance
      const fees = await financeService.listStudentFees(instId, { studentId });
      assert.equal(fees[0].balanceDue, 3400, 'Remaining balance due must be 3400');

      // Verify receipt table
      const receipt = await financeService.getReceipt(instId, payment.id);
      assert.ok(receipt, 'Receipt retrieved');
      assert.equal(receipt.receiptNumber, payment.receiptNumber, 'Receipt numbers match');
      assert.equal(receipt.amount, 2000, 'Receipt amount is 2000');
    });

    // -------------------------------------------------------------
    // Test 5: Overpayment Protection (Cannot pay more than balance)
    // -------------------------------------------------------------
    await test('Overpayment Protection: Rejects payment exceeding remaining balance due', async () => {
      // Balance due is 3400. Attempting to pay 4000 must fail!
      let rejected = false;
      try {
        await financeService.processPayment(
          instId,
          {
            invoiceId,
            studentId,
            amount: 4000,
            method: 'cash',
          },
          studentProfileId
        );
      } catch (err: any) {
        rejected = true;
        assert.ok(err.message.includes('exceeds remaining balance due'), 'Must report balance exceeded error');
      }
      assert.ok(rejected, 'Overpayment must be rejected');
    });

    // -------------------------------------------------------------
    // Test 6: Gateway Webhook Idempotency (Section 18 Exit Gate)
    // -------------------------------------------------------------
    await test('Gateway Webhook: Idempotent processing prevents duplicate payments on redelivery', async () => {
      // First webhook delivery ($400 payment)
      const eventId = `evt_test_${suffix}_001`;
      const res1 = await financeService.handleGatewayWebhook({
        gatewayName: 'stripe',
        eventId,
        eventType: 'payment.captured',
        institutionId: instId,
        payload: {
          invoiceId,
          studentId,
          amount: 400,
          method: 'online_gateway',
        },
      });

      assert.equal(res1.acknowledged, true, 'Webhook must be acknowledged');
      assert.equal(res1.duplicate, false, 'First delivery is not duplicate');

      // Verify balance reduced from 3400 to 3000
      const fees = await financeService.listStudentFees(instId, { studentId });
      assert.equal(fees[0].balanceDue, 3000, 'Balance due must be 3000 after $400 webhook payment');

      // Second webhook delivery with IDENTICAL eventId
      const res2 = await financeService.handleGatewayWebhook({
        gatewayName: 'stripe',
        eventId,
        eventType: 'payment.captured',
        institutionId: instId,
        payload: {
          invoiceId,
          studentId,
          amount: 400,
          method: 'online_gateway',
        },
      });

      assert.equal(res2.acknowledged, true, 'Second delivery must be acknowledged');
      assert.equal(res2.duplicate, true, 'Second delivery MUST be identified as duplicate (idempotent skip)');
      assert.ok(res2.message.includes('already processed'), 'Reports idempotent skip');
    });

    // -------------------------------------------------------------
    // Test 7: Gateway Failure Path Handling (Section 18 Exit Gate)
    // -------------------------------------------------------------
    await test('Gateway Webhook: Explicit failure path logs failed payment without altering balance due', async () => {
      const failEventId = `evt_fail_${suffix}_999`;
      const res = await financeService.handleGatewayWebhook({
        gatewayName: 'stripe',
        eventId: failEventId,
        eventType: 'payment.failed',
        institutionId: instId,
        payload: {
          invoiceId,
          studentId,
          amount: 500,
          method: 'online_gateway',
          failureReason: 'Insufficient funds in card',
        },
      });

      assert.equal(res.acknowledged, true, 'Failure event acknowledged');
      assert.equal(res.duplicate, false, 'First attempt is not duplicate');
      assert.equal(res.result?.status, 'failed', 'Payment status recorded as failed');

      // Verify failed payment exists in payments table
      const failedPayments = await financeService.listPayments(instId, { status: 'failed', invoiceId });
      assert.ok(failedPayments.length > 0, 'Failed payment must be recorded in ledger');
      assert.equal(failedPayments[0].status, 'failed', 'Status is failed');

      // Verify balance due remains unchanged at 3000
      const fees = await financeService.listStudentFees(instId, { studentId });
      assert.equal(fees[0].balanceDue, 3000, 'Balance due remains 3000 after failed payment');
    });

    // -------------------------------------------------------------
    // Test 8: Refund Lifecycle
    // -------------------------------------------------------------
    await test('Refund: Processes partial refund ($500), restores balance due and audits event', async () => {
      const refund = await financeService.processRefund(
        instId,
        {
          paymentId: paymentId1,
          amount: 500,
          reason: 'Concession applied post-payment',
        },
        studentProfileId
      );

      assert.ok(refund.id, 'Refund record created');
      assert.equal(refund.amount, 500, 'Refund amount is 500');

      // Verify balance due is restored by 500 (from 3000 back to 3500)
      const fees = await financeService.listStudentFees(instId, { studentId });
      assert.equal(fees[0].balanceDue, 3500, 'Balance due is restored to 3500');

      // Verify invoice status remains partially_paid
      const invoice = await financeService.getInvoice(instId, invoiceId);
      assert.equal(invoice?.status, 'partially_paid', 'Invoice status is partially_paid');

      // Verify audit event
      const auditRes = await db.query(
        "SELECT id FROM audit_logs WHERE institution_id = $1 AND action = 'finance.refund_processed' AND resource_id = $2",
        [instId, refund.id]
      );
      assert.ok(auditRes.rows.length > 0, 'Audit event for refund_processed must exist');
    });

    // -------------------------------------------------------------
    // Test 9: Full Settlement & Admission Fee Status Transition (D6)
    // -------------------------------------------------------------
    await test('Full settlement of remaining $3500 transitions invoice to paid and admission fee status to paid', async () => {
      const finalPayment = await financeService.processPayment(
        instId,
        {
          invoiceId,
          studentId,
          amount: 3500,
          method: 'card',
        },
        studentProfileId
      );

      assert.ok(finalPayment.id, 'Final payment recorded');

      // Verify invoice fully paid
      const invoice = await financeService.getInvoice(instId, invoiceId);
      assert.equal(invoice?.status, 'paid', 'Invoice status must be paid');

      // Verify student fees balance is 0
      const fees = await financeService.listStudentFees(instId, { studentId });
      assert.equal(fees[0].balanceDue, 0, 'Balance due must be 0');
      assert.equal(fees[0].status, 'PAID', 'Status enum computed as PAID');

      // Verify Decision D6: admission_fee_status transitions to 'paid'
      const admRes = await db.query('SELECT admission_fee_status FROM admissions WHERE id = $1', [admissionId]);
      assert.equal(admRes.rows[0]?.admission_fee_status, 'paid', 'Admission fee status must transition to paid');
    });

    // -------------------------------------------------------------
    // Test 10: Scoped Access (Rule 8, 9, 10)
    // -------------------------------------------------------------
    await test('Scoped Access: Student & Parent access own fees, Faculty blocked with 403', async () => {
      // 1. Student access (Rule 10)
      const studentView = await financeService.getScopedFees(instId, {
        id: studentProfileId,
        role: 'STUDENT',
      });
      assert.ok(studentView.summary, 'Student receives fee summary');
      assert.equal(studentView.studentId, studentId, 'Scoped to own student ID');

      // 2. Parent access (Rule 9)
      const parentView = await financeService.getScopedFees(instId, {
        id: parentProfileId,
        role: 'PARENT',
      });
      assert.ok(parentView.children, 'Parent receives linked children fees');
      assert.equal(parentView.children.length, 1, 'Parent sees exactly 1 linked child');
      assert.equal(parentView.children[0].child.id, studentId, 'Child matches test student');

      // 3. Faculty access blocked (Rule 8: Faculty never sees finance data)
      let facultyBlocked = false;
      try {
        await financeService.getScopedFees(instId, {
          id: facultyProfileId,
          role: 'TEACHER',
        });
      } catch (err: any) {
        facultyBlocked = true;
        assert.ok(err.message.includes('RESOURCE_ACCESS_DENIED'), 'Must deny faculty finance access');
      }
      assert.ok(facultyBlocked, 'Faculty must be strictly blocked from finance data');
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

runFinanceTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
