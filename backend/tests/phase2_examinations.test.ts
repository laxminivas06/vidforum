import assert from 'node:assert/strict';
import { db } from '../src/config/database';
import { examinationsService } from '../src/modules/examinations/examinations.service';
import { notificationService } from '../src/modules/notifications/notification.service';

async function runExaminationsTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 2, MODULE 4 TEST SUITE');
  console.log('   Examinations & Gradebook, Pre-Commit Validation & Report Cards');
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
      [instId, `AY 2026-27 Exam ${suffix}`]
    );
    academicYearId = ayRes.rows[0].id;
    createdTestAY = true;
  }

  // Setup Department & Class & Section
  const deptRes = await db.query(
    `INSERT INTO departments (institution_id, name, code, department_type)
     VALUES ($1, $2, $3, 'academic')
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `Academics Dept ${suffix}`, `ACD-${suffix}`]
  );
  const departmentId = deptRes.rows[0].id;

  const classRes = await db.query(
    `INSERT INTO classes (institution_id, name, academic_year_id, department_id, sequence_order)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (institution_id, academic_year_id, department_id, name) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
     RETURNING id`,
    [instId, `Class 10 Exam ${suffix}`, academicYearId, departmentId]
  );
  const classId = classRes.rows[0].id;

  const sectionRes = await db.query(
    `INSERT INTO sections (institution_id, class_id, name)
     VALUES ($1, $2, 'Section A')
     RETURNING id`,
    [instId, classId]
  );
  const sectionId = sectionRes.rows[0].id;

  // Setup Subjects: Mathematics and Science
  const mathRes = await db.query(
    `INSERT INTO subjects (institution_id, name, code)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [instId, `Mathematics ${suffix}`, `MTH${suffix}`]
  );
  const mathSubjectId = mathRes.rows[0].id;

  const sciRes = await db.query(
    `INSERT INTO subjects (institution_id, name, code)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [instId, `Science ${suffix}`, `SCI${suffix}`]
  );
  const sciSubjectId = sciRes.rows[0].id;

  // Setup Test Staff & Faculty Profiles
  const adminProfileId = await createTestProfile(`exam.admin.${suffix}@school.edu`, `Exam Admin ${suffix}`, 'INSTITUTION_ADMIN');
  const assignedTeacherProfileId = await createTestProfile(`teacher.math.${suffix}@school.edu`, `Math Teacher ${suffix}`, 'TEACHER');
  const unassignedTeacherProfileId = await createTestProfile(`teacher.other.${suffix}@school.edu`, `Other Teacher ${suffix}`, 'TEACHER');

  // Create Staff records
  const assignedStaffRes = await db.query(
    `INSERT INTO staff (institution_id, profile_id, department_id, employee_code, is_teaching_staff, employment_status, date_of_joining)
     VALUES ($1, $2, $3, $4, true, 'active', CURRENT_DATE)
     RETURNING id`,
    [instId, assignedTeacherProfileId, departmentId, `STF-M-${suffix}`]
  );
  const assignedStaffId = assignedStaffRes.rows[0].id;

  const unassignedStaffRes = await db.query(
    `INSERT INTO staff (institution_id, profile_id, department_id, employee_code, is_teaching_staff, employment_status, date_of_joining)
     VALUES ($1, $2, $3, $4, true, 'active', CURRENT_DATE)
     RETURNING id`,
    [instId, unassignedTeacherProfileId, departmentId, `STF-O-${suffix}`]
  );
  const unassignedStaffId = unassignedStaffRes.rows[0].id;

  // Allocate assigned teacher to Section A + Math
  await db.query(
    `INSERT INTO faculty_assignments (institution_id, staff_id, section_id, subject_id, academic_year_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [instId, assignedStaffId, sectionId, mathSubjectId, academicYearId]
  );

  // Setup Test Students & Parents
  // Student 1 (Top Ranker)
  const student1ProfileId = await createTestProfile(`student.alice.${suffix}@school.edu`, `Alice Walker ${suffix}`, 'STUDENT');
  const s1AdmNo = `ADM-A-${suffix}`;
  const s1Res = await db.query(
    `INSERT INTO students (institution_id, profile_id, admission_number, first_name, last_name, date_of_birth, gender, status, current_section_id)
     VALUES ($1, $2, $3, 'Alice', 'Walker', '2012-05-15', 'female', 'active', $4)
     RETURNING id`,
    [instId, student1ProfileId, s1AdmNo, sectionId]
  );
  const student1Id = s1Res.rows[0].id;

  // Student 2 (Average Ranker)
  const student2ProfileId = await createTestProfile(`student.bob.${suffix}@school.edu`, `Bob Dylan ${suffix}`, 'STUDENT');
  const s2AdmNo = `ADM-B-${suffix}`;
  const s2Res = await db.query(
    `INSERT INTO students (institution_id, profile_id, admission_number, first_name, last_name, date_of_birth, gender, status, current_section_id)
     VALUES ($1, $2, $3, 'Bob', 'Dylan', '2012-07-20', 'male', 'active', $4)
     RETURNING id`,
    [instId, student2ProfileId, s2AdmNo, sectionId]
  );
  const student2Id = s2Res.rows[0].id;

  // Student 3 (Struggling Ranker)
  const student3ProfileId = await createTestProfile(`student.charlie.${suffix}@school.edu`, `Charlie Brown ${suffix}`, 'STUDENT');
  const s3AdmNo = `ADM-C-${suffix}`;
  const s3Res = await db.query(
    `INSERT INTO students (institution_id, profile_id, admission_number, first_name, last_name, date_of_birth, gender, status, current_section_id)
     VALUES ($1, $2, $3, 'Charlie', 'Brown', '2012-09-10', 'male', 'active', $4)
     RETURNING id`,
    [instId, student3ProfileId, s3AdmNo, sectionId]
  );
  const student3Id = s3Res.rows[0].id;

  // Parent 1 (Linked to Alice)
  const parent1ProfileId = await createTestProfile(`parent.alice.${suffix}@school.edu`, `Mr. Walker ${suffix}`, 'PARENT');
  const p1Res = await db.query(
    `INSERT INTO parents (institution_id, profile_id, full_name, relationship)
     VALUES ($1, $2, 'John Walker', 'father')
     RETURNING id`,
    [instId, parent1ProfileId]
  );
  const parent1Id = p1Res.rows[0].id;
  await db.query(
    `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary_contact)
     VALUES ($1, $2, 'father', true)
     ON CONFLICT DO NOTHING`,
    [student1Id, parent1Id]
  );

  // Parent 2 (Linked to Bob)
  const parent2ProfileId = await createTestProfile(`parent.bob.${suffix}@school.edu`, `Mr. Dylan ${suffix}`, 'PARENT');
  const p2Res = await db.query(
    `INSERT INTO parents (institution_id, profile_id, full_name, relationship)
     VALUES ($1, $2, 'Robert Dylan', 'father')
     RETURNING id`,
    [instId, parent2ProfileId]
  );
  const parent2Id = p2Res.rows[0].id;
  await db.query(
    `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary_contact)
     VALUES ($1, $2, 'father', true)
     ON CONFLICT DO NOTHING`,
    [student2Id, parent2Id]
  );

  // Global variables to carry state across tests
  let examTypeId: string;
  let gradeScaleId: string;
  let examId: string;
  let mathExamSubjectId: string;
  let sciExamSubjectId: string;
  let examRoomId: string;

  // ================= TEST 1: SETUP EXAM TYPES AND GRADE SCALES WITH TIERS =================
  await test('Setup Exam Types and Grade Scales with Tiers', async () => {
    // 1. Create Exam Type
    const type = await examinationsService.createExamType(
      instId,
      { name: `Midterm Exam ${suffix}`, weightage: 30 },
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );
    assert.ok(type.id, 'Exam type ID must be generated');
    assert.equal(type.name, `Midterm Exam ${suffix}`);
    examTypeId = type.id;

    // 2. Create Grade Scale
    const scale = await examinationsService.createGradeScale(
      instId,
      { name: `10-Point Scale ${suffix}` }
    );
    assert.ok(scale.id, 'Grade scale ID must be generated');
    gradeScaleId = scale.id;

    // 3. Add Grade Tiers
    await examinationsService.addGradeTier(instId, gradeScaleId, { label: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10.0 });
    await examinationsService.addGradeTier(instId, gradeScaleId, { label: 'A', minPercentage: 80, maxPercentage: 89.99, gradePoint: 9.0 });
    await examinationsService.addGradeTier(instId, gradeScaleId, { label: 'B', minPercentage: 70, maxPercentage: 79.99, gradePoint: 8.0 });
    await examinationsService.addGradeTier(instId, gradeScaleId, { label: 'C', minPercentage: 50, maxPercentage: 69.99, gradePoint: 6.0 });
    await examinationsService.addGradeTier(instId, gradeScaleId, { label: 'F', minPercentage: 0, maxPercentage: 49.99, gradePoint: 0.0 });

    const scales = await examinationsService.listGradeScales(instId);
    const thisScale = scales.find((s) => s.id === gradeScaleId);
    assert.ok(thisScale, 'Created grade scale should be in list');
    assert.equal(thisScale.tiers?.length, 5, 'Should have 5 tiers configured');
  });

  // ================= TEST 2: CREATE EXAM, SUBJECTS, SCHEDULES, AND ROOMS =================
  await test('Create Exam Header, Subjects, Schedules, and Rooms', async () => {
    // 1. Create Exam
    const exam = await examinationsService.createExam(
      instId,
      {
        examTypeId,
        academicYearId,
        classId,
        name: `Term 1 Examination ${suffix}`,
        status: 'scheduled',
      },
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );
    assert.ok(exam.id, 'Exam ID must be generated');
    assert.equal(exam.isPublished, false, 'New exam must not be published initially');
    examId = exam.id;

    // 2. Add Exam Subjects
    const mathSubject = await examinationsService.addExamSubject(
      instId,
      { examId, subjectId: mathSubjectId, maxMarks: 100, passMarks: 35 },
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );
    assert.ok(mathSubject.id);
    assert.equal(mathSubject.maxMarks, 100);
    assert.equal(mathSubject.passMarks, 35);
    mathExamSubjectId = mathSubject.id;

    const sciSubject = await examinationsService.addExamSubject(
      instId,
      { examId, subjectId: sciSubjectId, maxMarks: 100, passMarks: 35 },
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );
    assert.ok(sciSubject.id);
    sciExamSubjectId = sciSubject.id;

    // 3. Create Exam Schedules
    const mathSchedule = await examinationsService.createExamSchedule(
      instId,
      { examSubjectId: mathExamSubjectId, examDate: '2026-10-15', startTime: '09:30:00', endTime: '12:30:00' },
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );
    assert.ok(mathSchedule.id);
    assert.equal(mathSchedule.examDate, '2026-10-15');

    const sciSchedule = await examinationsService.createExamSchedule(
      instId,
      { examSubjectId: sciExamSubjectId, examDate: '2026-10-17', startTime: '09:30:00', endTime: '12:30:00' },
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );
    assert.ok(sciSchedule.id);

    // 4. Create Exam Room and Seating Allocation
    const room = await examinationsService.createExamRoom(instId, {
      examSubjectId: mathExamSubjectId,
      capacity: 30,
    });
    assert.ok(room.id);
    examRoomId = room.id;

    const allocations = await examinationsService.allocateSeating(instId, examRoomId, [
      { studentId: student1Id, seatNumber: 'R1-S01' },
      { studentId: student2Id, seatNumber: 'R1-S02' },
      { studentId: student3Id, seatNumber: 'R1-S03' },
    ]);
    assert.equal(allocations.length, 3, 'Should allocate seating for 3 students');

    // 5. Assign Invigilator
    const invigilator = await examinationsService.assignInvigilator(instId, examRoomId, assignedStaffId);
    assert.ok(invigilator);
  });

  // ================= TEST 3: BATCH MARKS ENTRY & AUTO-GRADE RESOLUTION =================
  await test('Batch Marks Entry & Auto-Grade Resolution', async () => {
    // Admin enters marks for Science
    const marks = await examinationsService.submitMarksBatch(
      instId,
      sciExamSubjectId,
      [
        { studentId: student1Id, marksObtained: 92, remarks: 'Excellent' },
        { studentId: student2Id, marksObtained: 72, remarks: 'Good effort' },
        { studentId: student3Id, marksObtained: 28, remarks: 'Needs remedial support' },
      ],
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );

    assert.equal(marks.length, 3, 'Should record marks for 3 students');

    // Verify marks stored and grades auto-resolved
    const list = await examinationsService.listMarks(instId, { examSubjectId: sciExamSubjectId });
    const s1Mark = list.find((m) => m.studentId === student1Id);
    const s2Mark = list.find((m) => m.studentId === student2Id);
    const s3Mark = list.find((m) => m.studentId === student3Id);

    assert.ok(s1Mark, 'Student 1 mark must exist');
    assert.equal(Number(s1Mark.marksObtained), 92);
    assert.equal(s1Mark.gradeLabel, 'A+', '92% should resolve to A+');

    assert.ok(s2Mark, 'Student 2 mark must exist');
    assert.equal(Number(s2Mark.marksObtained), 72);
    assert.equal(s2Mark.gradeLabel, 'B', '72% should resolve to B');

    assert.ok(s3Mark, 'Student 3 mark must exist');
    assert.equal(Number(s3Mark.marksObtained), 28);
    assert.equal(s3Mark.gradeLabel, 'F', '28% should resolve to F');
  });

  // ================= TEST 4: RULE 8 FACULTY SCOPE ENFORCEMENT =================
  await test('Rule 8 Faculty Scoped Access: Blocks Unassigned Subject/Class Access', async () => {
    // Unassigned teacher attempts to enter marks for Mathematics -> MUST BE BLOCKED
    await assert.rejects(
      async () => {
        await examinationsService.submitMarksBatch(
          instId,
          mathExamSubjectId,
          [{ studentId: student1Id, marksObtained: 88 }],
          { id: unassignedTeacherProfileId, role: 'FACULTY' }
        );
      },
      /RESOURCE_ACCESS_DENIED/,
      'Unallocated faculty must not be allowed to enter marks for unassigned classes/subjects'
    );

    // Unassigned teacher attempts to view marks for Mathematics -> MUST BE BLOCKED
    await assert.rejects(
      async () => {
        await examinationsService.listMarks(
          instId,
          { examSubjectId: mathExamSubjectId },
          { id: unassignedTeacherProfileId, role: 'FACULTY' }
        );
      },
      /RESOURCE_ACCESS_DENIED/,
      'Unallocated faculty must not be allowed to view marks for unassigned subjects'
    );

    // Assigned teacher enters marks for Mathematics -> MUST SUCCEED
    const successMarks = await examinationsService.submitMarksBatch(
      instId,
      mathExamSubjectId,
      [{ studentId: student1Id, marksObtained: 95 }],
      { id: assignedTeacherProfileId, role: 'FACULTY' }
    );
    assert.equal(successMarks.length, 1);
    assert.equal(Number(successMarks[0].marksObtained), 95);
  });

  // ================= TEST 5: SECTION 18 EXIT GATE: EXCEL IMPORT BLOCKS INVALID DATA =================
  await test('Section 18 Exit Gate: Excel Import Pre-Commit Validation Blocks Invalid Data', async () => {
    const invalidBatch = [
      // Error 1: Non-existent student admission number
      { admissionNumber: `FAKE-ADM-${suffix}`, marks: 85 },
      // Error 2: Marks out of valid bounds (140 > maxMarks 100)
      { admissionNumber: s2AdmNo, marks: 140 },
      // Error 3: Duplicate student in import sheet
      { admissionNumber: s1AdmNo, marks: 78 },
      { admissionNumber: s1AdmNo, marks: 80 },
    ];

    const validationReport = await examinationsService.validateExcelImport(
      instId,
      mathExamSubjectId,
      invalidBatch,
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );

    assert.equal(validationReport.summary.canCommit, false, 'canCommit must be false when invalid rows exist');
    assert.ok(validationReport.summary.errors >= 3, 'Must identify all 3 error conditions');

    // Section 18 Exit Gate: Invalid data is NEVER silently committed
    await assert.rejects(
      async () => {
        await examinationsService.commitExcelImport(
          instId,
          mathExamSubjectId,
          invalidBatch,
          { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
        );
      },
      /CANNOT_COMMIT_INVALID_DATA/,
      'Commit engine must strictly block saving invalid Excel import sheets'
    );
  });

  // ================= TEST 6: EXCEL IMPORT COMMIT ENGINE: COMMITS VALID DATA =================
  await test('Excel Import Commit Engine: Successfully Commits Valid Data', async () => {
    const validBatch = [
      { admissionNumber: s1AdmNo, marks: 98, isAbsent: false },
      { admissionNumber: s2AdmNo, marks: 82, isAbsent: false },
      { admissionNumber: s3AdmNo, marks: 0, isAbsent: true },
    ];

    const preValidation = await examinationsService.validateExcelImport(
      instId,
      mathExamSubjectId,
      validBatch,
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );

    assert.equal(preValidation.summary.canCommit, true, 'Clean batch must have canCommit = true');
    assert.equal(preValidation.summary.errors, 0, 'Clean batch must have 0 errors');
    assert.equal(preValidation.summary.valid, 3, 'All 3 rows must be validated');

    // Commit valid import
    const committedMarks = await examinationsService.commitExcelImport(
      instId,
      mathExamSubjectId,
      validBatch,
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );

    assert.equal(committedMarks.length, 3, 'Should commit 3 marks records');

    const marksList = await examinationsService.listMarks(instId, { examSubjectId: mathExamSubjectId });
    const s1Math = marksList.find((m) => m.studentId === student1Id);
    const s3Math = marksList.find((m) => m.studentId === student3Id);

    assert.equal(Number(s1Math?.marksObtained), 98);
    assert.equal(s3Math?.isAbsent, true, 'Student 3 should be marked absent');
  });

  // ================= TEST 7: MARKS VERIFICATION & APPROVAL WORKFLOW =================
  await test('Marks Verification & Approval Workflow', async () => {
    // Admin verifies marks for Mathematics
    const verifyResult = await examinationsService.verifyMarks(
      instId,
      mathExamSubjectId,
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );

    assert.ok(verifyResult.verifiedCount >= 3, 'Should verify all marks records for the subject');

    // Verify database record has verified_by and verified_at
    const marksRes = await db.query(
      `SELECT count(*) FROM marks 
       WHERE exam_subject_id = $1 AND verified_by IS NOT NULL AND verified_at IS NOT NULL`,
      [mathExamSubjectId]
    );
    assert.equal(parseInt(marksRes.rows[0].count, 10), verifyResult.verifiedCount);
  });

  // ================= TEST 8: AUTOMATED REPORT CARD & CLASS RANKING COMPUTATION =================
  await test('Automated Report Card Calculation & Class Ranking Engine', async () => {
    // Calculate results for the exam:
    // Student 1 (Alice):   Math = 98/100, Sci = 92/100 -> Total = 190/200, 95.00% -> Grade A+, Passed
    // Student 2 (Bob):     Math = 82/100, Sci = 72/100 -> Total = 154/200, 77.00% -> Grade B,  Passed
    // Student 3 (Charlie): Math = Absent, Sci = 28/100 -> Total = 28/200,  14.00% -> Grade F,  Failed
    const reportCards = await examinationsService.calculateResults(
      instId,
      examId,
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );

    assert.equal(reportCards.length, 3, 'Should generate report cards for all 3 students');

    const aliceCard = reportCards.find((c) => c.studentId === student1Id);
    const bobCard = reportCards.find((c) => c.studentId === student2Id);
    const charlieCard = reportCards.find((c) => c.studentId === student3Id);

    assert.ok(aliceCard, 'Alice report card must exist');
    assert.equal(Number(aliceCard.totalMarksObtained), 190);
    assert.equal(Number(aliceCard.totalMaxMarks), 200);
    assert.equal(Number(aliceCard.percentage), 95.0);
    assert.equal(aliceCard.grade, 'A+');
    assert.equal(aliceCard.rank, 1, 'Alice should be Rank 1');
    assert.equal(aliceCard.resultStatus, 'passed');

    assert.ok(bobCard, 'Bob report card must exist');
    assert.equal(Number(bobCard.totalMarksObtained), 154);
    assert.equal(Number(bobCard.percentage), 77.0);
    assert.equal(bobCard.grade, 'B');
    assert.equal(bobCard.rank, 2, 'Bob should be Rank 2');
    assert.equal(bobCard.resultStatus, 'passed');

    assert.ok(charlieCard, 'Charlie report card must exist');
    assert.equal(Number(charlieCard.totalMarksObtained), 28);
    assert.equal(Number(charlieCard.percentage), 14.0);
    assert.equal(charlieCard.rank, 3, 'Charlie should be Rank 3');
    assert.equal(charlieCard.resultStatus, 'failed', 'Charlie must fail due to absent/failing marks');
  });

  // ================= TEST 9: PUBLISHING ENGINE & NOTIFICATION DISPATCH =================
  await test('Publishing Engine: Locks Results and Dispatches Notifications', async () => {
    const publishResult = await examinationsService.publishExamResults(
      instId,
      examId,
      { id: adminProfileId, role: 'INSTITUTION_ADMIN' }
    );

    assert.ok(publishResult.exam?.isPublished, 'Exam should be marked is_published = true');
    assert.equal(publishResult.exam?.status, 'completed', 'Exam status should be completed');

    // Verify report_cards published_at is set in database
    const dbCards = await db.query(
      `SELECT count(*) FROM report_cards 
       WHERE exam_id = $1 AND published_at IS NOT NULL`,
      [examId]
    );
    assert.equal(parseInt(dbCards.rows[0].count, 10), 3, 'All report cards must be marked published');

    // Verify notifications were dispatched to Alice and her parent
    const studentNotifs = await notificationService.getUserNotifications(instId, student1ProfileId);
    assert.ok(
      studentNotifs.some((n: any) => n.payload?.title?.includes('Report Card') || n.payload?.message?.includes('Report Card')),
      'Student Alice must receive notification of published report card'
    );

    const parentNotifs = await notificationService.getUserNotifications(instId, parent1ProfileId);
    assert.ok(
      parentNotifs.some((n: any) => n.payload?.title?.includes('Report Card') || n.payload?.message?.includes('Report Card')),
      'Parent of Alice must receive notification of published report card'
    );
  });

  // ================= TEST 10: RULE 9 & RULE 10 SCOPED ACCESS =================
  await test('Rule 9 & Rule 10 Scoped Report Card Access (Parent/Student)', async () => {
    // 1. Student Alice accesses own report card -> SUCCESS
    const aliceSelfCard = await examinationsService.getStudentReportCard(
      instId,
      examId,
      student1Id,
      { id: student1ProfileId, role: 'STUDENT' }
    );
    assert.ok(aliceSelfCard, 'Alice should be able to view own report card');
    assert.equal(aliceSelfCard.rank, 1);
    assert.equal(aliceSelfCard.subjectMarks?.length, 2, 'Should include breakdown for both subjects');

    // 2. Student Alice attempts to access Bob report card -> BLOCKED
    await assert.rejects(
      async () => {
        await examinationsService.getStudentReportCard(
          instId,
          examId,
          student2Id,
          { id: student1ProfileId, role: 'STUDENT' }
        );
      },
      /RESOURCE_ACCESS_DENIED/,
      'Student cannot view another student report card'
    );

    // 3. Parent 1 accesses linked child Alice report card -> SUCCESS
    const parent1ChildCard = await examinationsService.getStudentReportCard(
      instId,
      examId,
      student1Id,
      { id: parent1ProfileId, role: 'PARENT' }
    );
    assert.ok(parent1ChildCard, 'Parent should be able to view linked child report card');
    assert.equal(parent1ChildCard.studentName, 'Alice Walker');

    // 4. Parent 1 attempts to access unlinked child Bob report card -> BLOCKED
    await assert.rejects(
      async () => {
        await examinationsService.getStudentReportCard(
          instId,
          examId,
          student2Id,
          { id: parent1ProfileId, role: 'PARENT' }
        );
      },
      /RESOURCE_ACCESS_DENIED/,
      'Parent cannot view report card of unlinked child'
    );
  });

  // Cleanup test artifacts
  console.log('\n🧹 Cleaning up test artifacts...');
  try {
    if (examId) {
      await db.query('DELETE FROM report_cards WHERE exam_id = $1', [examId]);
      await db.query('DELETE FROM marks WHERE exam_subject_id IN ($1, $2)', [mathExamSubjectId, sciExamSubjectId]);
      await db.query('DELETE FROM invigilators WHERE exam_room_id = $1', [examRoomId]);
      await db.query('DELETE FROM exam_room_allocations WHERE exam_room_id = $1', [examRoomId]);
      await db.query('DELETE FROM exam_rooms WHERE exam_subject_id IN ($1, $2)', [mathExamSubjectId, sciExamSubjectId]);
      await db.query('DELETE FROM exam_schedules WHERE exam_subject_id IN ($1, $2)', [mathExamSubjectId, sciExamSubjectId]);
      await db.query('DELETE FROM exam_subjects WHERE exam_id = $1', [examId]);
      await db.query('DELETE FROM exams WHERE id = $1', [examId]);
    }
    if (examTypeId) await db.query('DELETE FROM exam_types WHERE id = $1', [examTypeId]);
    if (gradeScaleId) {
      await db.query('DELETE FROM grades WHERE grade_scale_id = $1', [gradeScaleId]);
      await db.query('DELETE FROM grade_scales WHERE id = $1', [gradeScaleId]);
    }
    await db.query('DELETE FROM faculty_assignments WHERE section_id = $1', [sectionId]);
    await db.query('DELETE FROM student_parents WHERE student_id IN ($1, $2, $3)', [student1Id, student2Id, student3Id]);
    await db.query('DELETE FROM parents WHERE id IN ($1, $2)', [parent1Id, parent2Id]);
    await db.query('DELETE FROM students WHERE id IN ($1, $2, $3)', [student1Id, student2Id, student3Id]);
    await db.query('DELETE FROM sections WHERE id = $1', [sectionId]);
    await db.query('DELETE FROM subjects WHERE id IN ($1, $2)', [mathSubjectId, sciSubjectId]);
    await db.query('DELETE FROM classes WHERE id = $1', [classId]);
    await db.query('DELETE FROM departments WHERE id = $1', [departmentId]);
    if (createdTestAY) await db.query('DELETE FROM academic_years WHERE id = $1', [academicYearId]);
    await db.query('DELETE FROM staff WHERE id IN ($1, $2)', [assignedStaffId, unassignedStaffId]);
    await db.query("DELETE FROM notifications WHERE institution_id = $1 AND (payload->>'title' LIKE $2 OR payload->>'title' LIKE $3)", [
      instId,
      '%Report Card%',
      '%Examination Results%',
    ]);
    console.log('   Cleanup complete.\n');
  } catch (err: any) {
    console.warn('   Cleanup warning:', err.message);
  }

  console.log('======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runExaminationsTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
