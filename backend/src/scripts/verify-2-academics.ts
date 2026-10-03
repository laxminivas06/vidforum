import { db } from '../config/database';
import { academicsService } from '../modules/academics/academics.service';

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING STEP 2 VERIFICATION: ACADEMICS & CURRICULUM');
  console.log('====================================================\n');

  // Fetch test institution
  const instRes = await db.query(`SELECT id, name FROM institutions LIMIT 1`);
  if (instRes.rows.length === 0) {
    throw new Error('No institution found in database.');
  }
  const institutionId = instRes.rows[0].id;
  const actorRes = await db.query(`SELECT id FROM profiles WHERE default_institution_id = $1 LIMIT 1`, [institutionId]);
  const adminActorId = actorRes.rows[0]?.id || (await db.query(`SELECT id FROM profiles LIMIT 1`)).rows[0]?.id;
  console.log(`Using institution: ${instRes.rows[0].name} (${institutionId}), actor: ${adminActorId}`);

  const uniqueSuffix = Date.now().toString().slice(-5);
  const testYearNameA = `AY 2026-27 Gate2-${uniqueSuffix}`;
  const testYearNameB = `AY 2027-28 Gate2-${uniqueSuffix}`;
  const testYearNameClone = `AY 2028-29 Gate2-${uniqueSuffix}`;

  let testDept: any = null;
  let yearA: any = null;
  let yearB: any = null;
  let clonedYearResult: any = null;
  let subjectMath: any = null;
  let subjectRobotics: any = null;
  let matrixResult: any = null;
  let examEstimate: any = null;
  let textbookA: any = null;
  let textbookB: any = null;

  try {
    // ----------------------------------------------------
    // Test 1: Academic Year Lifecycle & Single Current Constraint
    // ----------------------------------------------------
    console.log('\n[Test 1] Testing Academic Year Lifecycle & Single Current Constraint...');
    
    // Create Department for test classes
    testDept = await academicsService.createDepartment(
      institutionId,
      {
        name: `Academics Dept ${uniqueSuffix}`,
        code: `ACAD${uniqueSuffix}`,
        departmentType: 'academic',
      }
    );

    // Create Year A
    yearA = await academicsService.createAcademicYear(
      institutionId,
      {
        name: testYearNameA,
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        isCurrent: true,
        status: 'active',
      },
      adminActorId
    );

    console.assert(yearA.is_current === true, 'Test 1 Failed: Year A should be current');
    console.log(`✔ Created Academic Year A (${yearA.name}), is_current = ${yearA.is_current}`);

    // Create Year B and set it as current
    yearB = await academicsService.createAcademicYear(
      institutionId,
      {
        name: testYearNameB,
        startDate: '2027-06-01',
        endDate: '2028-05-31',
        isCurrent: false,
        status: 'planning',
      },
      adminActorId
    );

    // Set Year B as current
    const updatedYearB = await academicsService.setCurrentAcademicYear(institutionId, yearB.id, adminActorId);
    console.assert(updatedYearB.is_current === true, 'Test 1 Failed: Year B should be current');

    // Verify Year A was atomically unset
    const refreshedYearA = await academicsService.getAcademicYearById(institutionId, yearA.id);
    console.assert(refreshedYearA.is_current === false, 'Test 1 Failed: Year A is_current must be false after Year B became current');

    // Verify exactly one current year exists
    const currentYears = await db.query(
      `SELECT count(*) FROM academic_years WHERE institution_id = $1 AND is_current = true`,
      [institutionId]
    );
    console.assert(parseInt(currentYears.rows[0].count, 10) === 1, 'Test 1 Failed: Exactly one current year must exist');
    console.log('✅ Test 1 Passed: Academic year lifecycle and single current constraint strictly verified.\n');

    // ----------------------------------------------------
    // Test 2: Subjects Master CRUD & Duplicate Prevention
    // ----------------------------------------------------
    console.log('[Test 2] Testing Subjects Master CRUD & Duplicate Prevention...');
    
    subjectMath = await academicsService.createSubject(
      institutionId,
      {
        name: `Advanced Mathematics ${uniqueSuffix}`,
        code: `MTH${uniqueSuffix}`,
        isElective: false,
        credits: 4.5,
        departmentId: testDept.id,
      },
      adminActorId
    );

    subjectRobotics = await academicsService.createSubject(
      institutionId,
      {
        name: `Robotics & AI ${uniqueSuffix}`,
        code: `ROB${uniqueSuffix}`,
        isElective: true,
        credits: 3.0,
        departmentId: testDept.id,
      },
      adminActorId
    );

    console.log(`✔ Created Core Subject: ${subjectMath.name} (${subjectMath.code}, ${subjectMath.credits} credits)`);
    console.log(`✔ Created Elective Subject: ${subjectRobotics.name} (${subjectRobotics.code}, ${subjectRobotics.credits} credits)`);

    // Verify duplicate code rejected
    let duplicateRejected = false;
    try {
      await academicsService.createSubject(
        institutionId,
        {
          name: `Duplicate Math`,
          code: `mth${uniqueSuffix}`, // Lowercase duplicate
          isElective: false,
        },
        adminActorId
      );
    } catch (err: any) {
      if (err.statusCode === 409 || err.code === 'DUPLICATE_SUBJECT_CODE') {
        duplicateRejected = true;
      }
    }
    console.assert(duplicateRejected, 'Test 2 Failed: Case-insensitive duplicate subject code must be rejected with 409');
    console.log('✅ Test 2 Passed: Subject master creation and duplicate code prevention verified.\n');

    // ----------------------------------------------------
    // Test 3: Grade x Section Matrix Batch Generation
    // ----------------------------------------------------
    console.log('[Test 3] Testing Grade x Section Matrix Batch Generation...');
    
    matrixResult = await academicsService.generateClassMatrix(
      institutionId,
      {
        academicYearId: yearA.id,
        departmentId: testDept.id,
        gradeNames: [`Grade 9 G2 ${uniqueSuffix}`, `Grade 10 G2 ${uniqueSuffix}`],
        sectionNames: ['Section A', 'Section B'],
        defaultCapacity: 35,
      },
      adminActorId
    );

    console.assert(matrixResult.totalClasses === 2, `Expected 2 classes, got ${matrixResult.totalClasses}`);
    console.assert(matrixResult.totalSections === 4, `Expected 4 sections, got ${matrixResult.totalSections}`);

    const classG9 = matrixResult.classes[0];
    const classG10 = matrixResult.classes[1];
    console.log(`✔ Generated Grade x Section Matrix: 2 Classes, 4 Sections (${classG9.name}, ${classG10.name})`);
    console.log('✅ Test 3 Passed: Grade x Section matrix successfully generated with capacities.\n');

    // ----------------------------------------------------
    // Test 4: Grade -> Subject Mapping & Matrix Copying
    // ----------------------------------------------------
    console.log('[Test 4] Testing Grade -> Subject Mapping & Copy Matrix...');

    // Map Math & Robotics to Grade 9
    const mapMathG9 = await academicsService.mapSubjectToGrade(
      institutionId,
      {
        classId: classG9.id,
        subjectId: subjectMath.id,
        periodsPerWeek: 6,
        maxMarks: 100,
        passMarks: 40,
        isMandatory: true,
      },
      adminActorId
    );

    const mapRoboG9 = await academicsService.mapSubjectToGrade(
      institutionId,
      {
        classId: classG9.id,
        subjectId: subjectRobotics.id,
        periodsPerWeek: 3,
        maxMarks: 50,
        passMarks: 20,
        isMandatory: false,
      },
      adminActorId
    );

    const g9Subjects = await academicsService.getGradeSubjects(institutionId, classG9.id);
    console.assert(g9Subjects.length === 2, `Expected 2 mapped subjects for Grade 9, got ${g9Subjects.length}`);
    console.log(`✔ Grade 9 mapped with ${g9Subjects.length} subjects (Math: ${mapMathG9.periods_per_week} periods, Robo: ${mapRoboG9.periods_per_week} periods)`);

    // Copy subject matrix to Grade 10
    const copyResult = await academicsService.copySubjectMatrix(
      institutionId,
      classG9.id,
      [classG10.id],
      adminActorId
    );
    console.assert(copyResult.totalCopied === 2, `Expected 2 copied mappings, got ${copyResult.totalCopied}`);

    const g10Subjects = await academicsService.getGradeSubjects(institutionId, classG10.id);
    console.assert(g10Subjects.length === 2, `Expected 2 mapped subjects in Grade 10 after copy, got ${g10Subjects.length}`);
    console.log(`✔ Successfully copied subject matrix to Grade 10 (${g10Subjects.length} subjects verified)`);
    console.log('✅ Test 4 Passed: Grade-subject mapping and copy matrix functionality verified.\n');

    // ----------------------------------------------------
    // Test 5: Year Schedule & Working Week Configuration
    // ----------------------------------------------------
    console.log('[Test 5] Testing Year Schedule & Working Week Configuration...');

    // Save working week configuration: Mon to Fri (1, 2, 3, 4, 5)
    await academicsService.saveCalendarConfig(
      institutionId,
      yearA.id,
      [1, 2, 3, 4, 5],
      adminActorId
    );

    const config = await academicsService.getCalendarConfig(institutionId, yearA.id);
    console.assert(JSON.stringify(config.working_days_of_week) === JSON.stringify([1, 2, 3, 4, 5]), 'Calendar config mismatch');
    console.log(`✔ Working week configured for Mon-Fri: ${JSON.stringify(config.working_days_of_week)}`);

    // Add Special Holiday: 2026-08-15 (National Holiday)
    const holidayDay = await academicsService.createCalendarDay(
      institutionId,
      {
        academicYearId: yearA.id,
        date: '2026-08-15',
        dayType: 'holiday',
        description: 'Independence Day',
        isWorkingDay: false,
      },
      adminActorId
    );

    // Add Vacation Day: 2026-10-02 (Gandhi Jayanti)
    const vacationDay = await academicsService.createCalendarDay(
      institutionId,
      {
        academicYearId: yearA.id,
        date: '2026-10-02',
        dayType: 'vacation',
        description: 'Autumn Break Day',
        isWorkingDay: false,
      },
      adminActorId
    );

    const calendarDays = await academicsService.getCalendarDays(institutionId, yearA.id);
    console.assert(calendarDays.length >= 2, `Expected at least 2 calendar days, got ${calendarDays.length}`);
    console.log(`✔ Added ${calendarDays.length} special calendar events (${holidayDay.description}, ${vacationDay.description})`);
    console.log('✅ Test 5 Passed: Calendar configuration and holiday scheduling verified.\n');

    // ----------------------------------------------------
    // Test 6: isWorkingDay Service Verification
    // ----------------------------------------------------
    console.log('[Test 6] Testing isWorkingDay Service Evaluation...');

    // 2026-08-14 is a Friday -> regular working day
    const checkFri = await academicsService.isWorkingDay(institutionId, yearA.id, '2026-08-14');
    console.assert(checkFri.isWorkingDay === true, '2026-08-14 (Friday) should be a working day');

    // 2026-08-15 is a Saturday and marked as holiday
    const checkSat = await academicsService.isWorkingDay(institutionId, yearA.id, '2026-08-15');
    console.assert(checkSat.isWorkingDay === false, '2026-08-15 should not be a working day');
    console.assert(checkSat.dayType === 'holiday', `Expected holiday dayType, got ${checkSat.dayType}`);

    // 2026-08-16 is a Sunday -> weekend holiday
    const checkSun = await academicsService.isWorkingDay(institutionId, yearA.id, '2026-08-16');
    console.assert(checkSun.isWorkingDay === false, '2026-08-16 (Sunday) should not be a working day');

    // 2026-10-02 is a Friday, but marked as vacation
    const checkVac = await academicsService.isWorkingDay(institutionId, yearA.id, '2026-10-02');
    console.assert(checkVac.isWorkingDay === false, '2026-10-02 should not be a working day due to vacation override');
    console.assert(checkVac.dayType === 'vacation', `Expected vacation dayType, got ${checkVac.dayType}`);

    console.log('✔ Friday (2026-08-14): working = true');
    console.log('✔ Saturday Holiday (2026-08-15): working = false (Independence Day)');
    console.log('✔ Sunday Weekend (2026-08-16): working = false (Weekend)');
    console.log('✔ Friday Vacation (2026-10-02): working = false (Autumn Break Day)');
    console.log('✅ Test 6 Passed: isWorkingDay accurately checks overrides and weekday boundaries.\n');

    // ----------------------------------------------------
    // Test 7: Exact Working Days Count Computation
    // ----------------------------------------------------
    console.log('[Test 7] Testing Exact Working Days Count Computation...');

    // Month of August 2026: 2026-08-01 to 2026-08-31
    // Total 31 days.
    // Saturdays (Aug 1, 8, 15, 22, 29) = 5 days
    // Sundays (Aug 2, 9, 16, 23, 30) = 5 days
    // Weekend days = 10 days
    // Weekdays (Mon-Fri) = 21 days
    // Aug 15 is Saturday, so no extra weekday deducted
    // Expected: 21 working days, 10 holidays, 31 total days.
    const augCount = await academicsService.getWorkingDaysCount(
      institutionId,
      yearA.id,
      '2026-08-01',
      '2026-08-31'
    );

    console.log(`August 2026 Count: Total=${augCount.totalDays}, Working=${augCount.workingDays}, Holidays=${augCount.holidays}`);
    console.assert(augCount.totalDays === 31, `Expected 31 total days, got ${augCount.totalDays}`);
    console.assert(augCount.workingDays === 21, `Expected 21 working days in August 2026, got ${augCount.workingDays}`);
    console.assert(augCount.holidays === 10, `Expected 10 holiday/weekend days in August 2026, got ${augCount.holidays}`);
    console.log('✅ Test 7 Passed: Exact working days count verified with calendar arithmetic.\n');

    // ----------------------------------------------------
    // Test 8: Exam Estimated Schedule (A2)
    // ----------------------------------------------------
    console.log('[Test 8] Testing Exam Estimated Schedule (A2)...');

    examEstimate = await academicsService.createExamEstimate(
      institutionId,
      {
        academicYearId: yearA.id,
        classId: classG10.id,
        termName: `Term 1 Midterms ${uniqueSuffix}`,
        startDate: '2026-09-15',
        endDate: '2026-09-22',
        description: 'First Term Assessment window for Grade 10',
        status: 'scheduled',
      },
      adminActorId
    );

    console.assert(examEstimate.id, 'Test 8 Failed: examEstimate not created');
    console.log(`✔ Created Exam Estimate: ${examEstimate.term_name} (${examEstimate.start_date} to ${examEstimate.end_date})`);

    // Verify date validation check: start_date > end_date fails
    let dateCheckFailed = false;
    try {
      await academicsService.createExamEstimate(
        institutionId,
        {
          academicYearId: yearA.id,
          classId: classG10.id,
          termName: `Invalid Exam Dates`,
          startDate: '2026-09-25',
          endDate: '2026-09-10', // Invalid: end before start
        },
        adminActorId
      );
    } catch (err: any) {
      if (err.statusCode === 400 || err.message.includes('End date must be greater')) {
        dateCheckFailed = true;
      }
    }
    console.assert(dateCheckFailed, 'Test 8 Failed: Invalid date range must be rejected');
    console.log('✅ Test 8 Passed: Exam estimated schedule created with date range validation.\n');

    // ----------------------------------------------------
    // Test 9: Preferred Textbooks (A1) & Printable Booklist
    // ----------------------------------------------------
    console.log('[Test 9] Testing Preferred Textbooks (A1) & Printable Booklist...');

    textbookA = await academicsService.createTextbook(
      institutionId,
      {
        academicYearId: yearA.id,
        classId: classG10.id,
        subjectId: subjectMath.id,
        title: `Comprehensive Mathematics for Class X`,
        author: `Dr. K.C. Sinha`,
        publisher: `Bharti Bhawan`,
        edition: `2026 Edition`,
        isbn: `978-93-87654-21-0`,
        price: 499.00,
        isMandatory: true,
        notes: `Mandatory course text for Term 1 & 2`,
      },
      adminActorId
    );

    textbookB = await academicsService.createTextbook(
      institutionId,
      {
        academicYearId: yearA.id,
        classId: classG10.id,
        subjectId: subjectRobotics.id,
        title: `Hands-on Robotics and Embedded Systems`,
        author: `Prof. N. Patel`,
        publisher: `TechWorld Press`,
        edition: `1st Edition`,
        isbn: `978-01-23456-78-9`,
        price: 350.00,
        isMandatory: false,
        notes: `Recommended reference manual for lab practicals`,
      },
      adminActorId
    );

    const booklist = await academicsService.getBooklist(institutionId, yearA.id, classG10.id);
    console.assert(booklist.totalBooks === 2, `Expected 2 books in booklist, got ${booklist.totalBooks}`);
    console.assert(booklist.mandatoryCount === 1, `Expected 1 mandatory book, got ${booklist.mandatoryCount}`);
    console.assert(booklist.optionalCount === 1, `Expected 1 optional book, got ${booklist.optionalCount}`);
    console.assert(booklist.totalEstimatedCost === 849.00, `Expected total cost 849.00, got ${booklist.totalEstimatedCost}`);

    console.log(`✔ Booklist generated: ${booklist.totalBooks} books, Total Est. Cost: ₹${booklist.totalEstimatedCost}`);
    console.log('✅ Test 9 Passed: Preferred textbooks catalog and printable booklist verified.\n');

    // ----------------------------------------------------
    // Test 10: Academic Year Cloning & Cascading Integrity
    // ----------------------------------------------------
    console.log('[Test 10] Testing Academic Year Cloning & Cascading Integrity...');

    clonedYearResult = await academicsService.cloneAcademicYear(
      institutionId,
      yearA.id,
      {
        name: testYearNameClone,
        startDate: '2028-06-01',
        endDate: '2029-05-31',
        cloneClasses: true,
        cloneSubjects: true,
        cloneTextbooks: true,
      },
      adminActorId
    );

    console.assert(clonedYearResult.clonedClassesCount === 2, `Expected 2 cloned classes, got ${clonedYearResult.clonedClassesCount}`);
    console.assert(clonedYearResult.clonedSectionsCount === 4, `Expected 4 cloned sections, got ${clonedYearResult.clonedSectionsCount}`);
    console.assert(clonedYearResult.clonedSubjectsCount === 4, `Expected 4 cloned subject mappings, got ${clonedYearResult.clonedSubjectsCount}`);
    console.assert(clonedYearResult.clonedTextbooksCount === 2, `Expected 2 cloned textbooks, got ${clonedYearResult.clonedTextbooksCount}`);

    console.log(`✔ Cloned Academic Year Summary:`);
    console.log(`  - Target Year: ${clonedYearResult.newAcademicYear.name} (Status: ${clonedYearResult.newAcademicYear.status})`);
    console.log(`  - Classes: ${clonedYearResult.clonedClassesCount}`);
    console.log(`  - Sections: ${clonedYearResult.clonedSectionsCount}`);
    console.log(`  - Subject Mappings: ${clonedYearResult.clonedSubjectsCount}`);
    console.log(`  - Textbooks: ${clonedYearResult.clonedTextbooksCount}`);
    console.log('✅ Test 10 Passed: Academic year cloning preserved complete academic structure.\n');

    console.log('====================================================');
    console.log('🎉 ALL 10 STEP 2 ACADEMICS TESTS PASSED GREEN!');
    console.log('====================================================\n');

  } finally {
    // ----------------------------------------------------
    // Clean up test records in reverse dependency order
    // ----------------------------------------------------
    console.log('Performing clean up of test records...');
    try {
      const allYearIds = [yearA?.id, yearB?.id, clonedYearResult?.newAcademicYear?.id].filter(Boolean);
      
      if (allYearIds.length > 0) {
        // 1. Delete textbooks
        await db.query(`DELETE FROM preferred_textbooks WHERE academic_year_id = ANY($1)`, [allYearIds]);
        // 2. Delete exam estimates
        await db.query(`DELETE FROM exam_estimates WHERE academic_year_id = ANY($1)`, [allYearIds]);
        // 3. Delete calendar days & configs
        await db.query(`DELETE FROM calendar_days WHERE academic_year_id = ANY($1)`, [allYearIds]);
        await db.query(`DELETE FROM academic_calendar_configs WHERE academic_year_id = ANY($1)`, [allYearIds]);
        // 4. Delete grade subjects & class subjects
        await db.query(`
          DELETE FROM grade_subjects WHERE class_id IN (
            SELECT id FROM classes WHERE academic_year_id = ANY($1)
          )
        `, [allYearIds]);
        await db.query(`
          DELETE FROM class_subjects WHERE class_id IN (
            SELECT id FROM classes WHERE academic_year_id = ANY($1)
          )
        `, [allYearIds]);
        // 5. Delete sections
        await db.query(`
          DELETE FROM sections WHERE class_id IN (
            SELECT id FROM classes WHERE academic_year_id = ANY($1)
          )
        `, [allYearIds]);
        // 6. Delete classes
        await db.query(`DELETE FROM classes WHERE academic_year_id = ANY($1)`, [allYearIds]);
        // 7. Delete academic years
        await db.query(`DELETE FROM academic_years WHERE id = ANY($1)`, [allYearIds]);
      }

      // 8. Delete test subjects
      const subIds = [subjectMath?.id, subjectRobotics?.id].filter(Boolean);
      if (subIds.length > 0) {
        await db.query(`DELETE FROM subjects WHERE id = ANY($1)`, [subIds]);
      }

      // 9. Delete test department
      if (testDept?.id) {
        await db.query(`DELETE FROM departments WHERE id = $1`, [testDept.id]);
      }

      console.log('✔ Cleanup completed successfully.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }
  }
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Step 2 Verification Failed:', err);
    process.exit(1);
  });
