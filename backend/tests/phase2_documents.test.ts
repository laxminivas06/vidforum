import assert from 'node:assert/strict';
import { db } from '../src/config/database';
import { DocumentsService } from '../src/modules/documents/documents.service';

async function runDocumentsTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 2, MODULE 5 TEST SUITE');
  console.log('   Documents Management, Verification, Templates & QR Certificates');
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

  // Set up actors & test entities
  const adminProfileId = await createTestProfile(`doc.admin.${suffix}@vid.edu`, `Doc Admin ${suffix}`, 'Institution Admin');
  const studentProfileId = await createTestProfile(`doc.student.${suffix}@vid.edu`, `Doc Student ${suffix}`, 'Student');
  const parentProfileId = await createTestProfile(`doc.parent.${suffix}@vid.edu`, `Doc Parent ${suffix}`, 'Parent');
  const facultyProfileId = await createTestProfile(`doc.faculty.${suffix}@vid.edu`, `Doc Faculty ${suffix}`, 'Faculty');
  const otherStudentProfileId = await createTestProfile(`doc.otherstu.${suffix}@vid.edu`, `Doc Other Stu ${suffix}`, 'Student');

  // Academic setup: Year, Department, Class, Section, Subjects
  let academicYearId: string;
  let createdTestAY = false;
  const ayCheck = await db.query(
    'SELECT id FROM academic_years WHERE institution_id = $1 AND is_current = true LIMIT 1',
    [instId]
  );
  if (ayCheck.rows.length > 0) {
    academicYearId = ayCheck.rows[0].id;
  } else {
    const ayRes = await db.query(
      `INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current)
       VALUES ($1, $2, '2026-06-01', '2027-05-31', false)
       RETURNING id`,
      [instId, `AY-Doc-${suffix}`]
    );
    academicYearId = ayRes.rows[0].id;
    createdTestAY = true;
  }

  const deptRes = await db.query(
    `INSERT INTO departments (institution_id, name, code, department_type)
     VALUES ($1, $2, $3, 'academic')
     ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [instId, `Dept-Doc-${suffix}`, `DD${suffix}`]
  );
  const departmentId = deptRes.rows[0].id;

  const classRes = await db.query(
    `INSERT INTO classes (institution_id, name, academic_year_id, department_id, sequence_order)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (institution_id, academic_year_id, department_id, name) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
     RETURNING id`,
    [instId, `Class-Doc-${suffix}`, academicYearId, departmentId]
  );
  const classId = classRes.rows[0].id;

  const secRes = await db.query(
    `INSERT INTO sections (institution_id, class_id, name)
     VALUES ($1, $2, 'A')
     RETURNING id`,
    [instId, classId]
  );
  const sectionId = secRes.rows[0].id;

  // Student 1 (linked to studentProfileId)
  const student1Res = await db.query(
    `INSERT INTO students (
      institution_id, user_id, admission_number, roll_number, first_name, last_name,
      date_of_birth, gender, status, current_class_id, current_section_id
    ) VALUES ($1, $2, $3, '01', 'Aarav', 'Sharma', '2012-05-15', 'male', 'active', $4, $5)
    RETURNING id`,
    [instId, studentProfileId, `ADM-DOC-${suffix}-1`, classId, sectionId]
  );
  const student1Id = student1Res.rows[0].id;

  // Student 2 (unlinked student)
  const student2Res = await db.query(
    `INSERT INTO students (
      institution_id, user_id, admission_number, roll_number, first_name, last_name,
      date_of_birth, gender, status, current_class_id, current_section_id
    ) VALUES ($1, $2, $3, '02', 'Rohan', 'Verma', '2012-08-20', 'male', 'active', $4, $5)
    RETURNING id`,
    [instId, otherStudentProfileId, `ADM-DOC-${suffix}-2`, classId, sectionId]
  );
  const student2Id = student2Res.rows[0].id;

  // Parent linked to Student 1
  const parentRes = await db.query(
    `INSERT INTO parents (institution_id, profile_id, full_name, email, phone)
     VALUES ($1, $2, $3, $4, '9876543210')
     RETURNING id`,
    [instId, parentProfileId, `Parent Sharma ${suffix}`, `doc.parent.${suffix}@vid.edu`]
  );
  const parentId = parentRes.rows[0].id;

  await db.query(
    `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary_contact)
     VALUES ($1, $2, 'Father', true)`,
    [student1Id, parentId]
  );

  // Subject setup
  const subRes = await db.query(
    `INSERT INTO subjects (institution_id, name, code)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [instId, `Doc Subject ${suffix}`, `SUB-D-${suffix}`]
  );
  const subjectId = subRes.rows[0].id;

  // Staff & Faculty setup (Allocated to Class/Section)
  const staffRes = await db.query(
    `INSERT INTO staff (institution_id, profile_id, department_id, employee_code, is_teaching_staff, employment_status, date_of_joining)
     VALUES ($1, $2, $3, $4, true, 'active', CURRENT_DATE)
     RETURNING id`,
    [instId, facultyProfileId, departmentId, `STF-DOC-${suffix}`]
  );
  const staffId = staffRes.rows[0].id;

  await db.query(
    `INSERT INTO faculty_assignments (institution_id, staff_id, section_id, subject_id, academic_year_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [instId, staffId, sectionId, subjectId, academicYearId]
  );

  // Context objects
  const adminActor = { id: adminProfileId, role: 'INSTITUTION_ADMIN', institutionId: instId, profileId: adminProfileId };
  const studentActor = { id: student1Id, role: 'STUDENT', institutionId: instId, profileId: studentProfileId };
  const parentActor = { id: parentProfileId, role: 'PARENT', institutionId: instId, profileId: parentProfileId };
  const facultyActor = { id: facultyProfileId, role: 'FACULTY', institutionId: instId, profileId: facultyProfileId };

  const service = new DocumentsService(instId);

  // Track created artifacts for testing
  let birthCertTypeId: string;
  let customTypeId: string;
  let uploadedDocId: string;
  let rejectedDocId: string;
  let templateId: string;
  let generatedCertDocId: string;
  let requestId: string;

  // =========================================================================
  // TEST 1: Document Types Catalog (List & Create)
  // =========================================================================
  await test('Document Types Catalog: Retrieves standard catalog and creates custom type', async () => {
    const types = await service.listDocumentTypes();
    assert.ok(types.length >= 5, 'Must contain at least 5 standard document types');
    
    const birthCert = types.find(t => t.code === 'birth_certificate');
    assert.ok(birthCert, 'Standard birth_certificate type must exist');
    birthCertTypeId = birthCert.id;

    // Create custom document type
    const customType = await service.createDocumentType(
      { code: `medical_fitness_${suffix}`, name: 'Medical Fitness Certificate' },
      adminActor
    );
    assert.ok(customType.id, 'Created custom type must have an ID');
    assert.equal(customType.name, 'Medical Fitness Certificate');
    customTypeId = customType.id;
  });

  // =========================================================================
  // TEST 2: Document Upload & MIME Whitelist Enforcement
  // =========================================================================
  await test('Document Upload: Registers valid document in vault with canonical storage key and enforces MIME whitelist', async () => {
    // 1. Valid PDF upload
    const doc = await service.uploadDocument(
      {
        documentTypeId: birthCertTypeId,
        ownerType: 'student',
        ownerId: student1Id,
        fileName: 'Aarav_Birth_Certificate.pdf',
        mimeType: 'application/pdf',
        fileSize: 1048576, // 1 MB
        metadata: { originalSource: 'State Vital Statistics', issuanceYear: 2012 },
      },
      adminActor
    );

    assert.ok(doc.id, 'Document must be created in vault with ID');
    assert.equal(doc.ownerType, 'student');
    assert.equal(doc.ownerId, student1Id);
    assert.equal(doc.fileSize, 1048576);
    assert.ok(doc.storageKey.includes(instId), 'Storage key must include institution ID for tenant isolation');
    assert.ok(doc.storageKey.includes('student'), 'Storage key must structure owner type');
    uploadedDocId = doc.id;

    // 2. Invalid MIME type rejection
    await assert.rejects(
      async () => {
        await service.uploadDocument(
          {
            documentTypeId: birthCertTypeId,
            ownerType: 'student',
            ownerId: student1Id,
            fileName: 'malicious_executable.exe',
            mimeType: 'application/x-msdownload',
          },
          adminActor
        );
      },
      /Unsupported document format/i,
      'Should reject disallowed MIME types'
    );
  });

  // =========================================================================
  // TEST 3: Initial Verification State (Pending)
  // =========================================================================
  await test('Initial Verification State: Newly uploaded document automatically enters pending status', async () => {
    const doc = await service.getDocument(uploadedDocId, adminActor);
    assert.equal(doc.verificationStatus, 'pending', 'Initial status must be pending');

    const history = await service.getVerificationHistory(uploadedDocId, adminActor);
    assert.ok(history.length >= 1, 'Verification history must record initial status');
    assert.equal(history[0].status, 'pending');
  });

  // =========================================================================
  // TEST 4: Verification Workflow (Verified & Rejected with Remarks)
  // =========================================================================
  await test('Verification Workflow: Supports approving (verified) and rejecting documents with audit details', async () => {
    // 1. Approve uploadedDocId
    const verifiedResult = await service.verifyDocument(
      uploadedDocId,
      'verified',
      'Original seal and registrar signature inspected and confirmed',
      adminActor
    );
    assert.equal(verifiedResult.status, 'verified');
    assert.ok(verifiedResult.remarks?.includes('Original seal'));

    const updatedDoc = await service.getDocument(uploadedDocId, adminActor);
    assert.equal(updatedDoc.verificationStatus, 'verified');

    // 2. Upload another document and reject it
    const doc2 = await service.uploadDocument(
      {
        documentTypeId: customTypeId,
        ownerType: 'student',
        ownerId: student1Id,
        fileName: 'Unclear_Medical_Report.jpg',
        mimeType: 'image/jpeg',
        fileSize: 450000,
      },
      adminActor
    );
    rejectedDocId = doc2.id;

    const rejectedResult = await service.verifyDocument(
      rejectedDocId,
      'rejected',
      'Image is blurry and clinic registration number is missing',
      adminActor
    );
    assert.equal(rejectedResult.status, 'rejected');

    const updatedDoc2 = await service.getDocument(rejectedDocId, adminActor);
    assert.equal(updatedDoc2.verificationStatus, 'rejected');
  });

  // =========================================================================
  // TEST 5: Document Soft Deletion
  // =========================================================================
  await test('Document Soft Deletion: Soft-deletes document and excludes it from active listing', async () => {
    const deleteRes = await service.deleteDocument(rejectedDocId, adminActor);
    assert.equal(deleteRes.success, true);

    // Active listing should not contain the deleted document
    const listRes = await service.listDocuments({ ownerId: student1Id }, adminActor);
    const foundDeleted = listRes.documents.some(d => d.id === rejectedDocId);
    assert.equal(foundDeleted, false, 'Soft-deleted document must be excluded from active listing');

    // Direct get should return 404
    await assert.rejects(
      async () => {
        await service.getDocument(rejectedDocId, adminActor);
      },
      /Document not found/i,
      'Soft-deleted document must return 404 on direct lookup'
    );
  });

  // =========================================================================
  // TEST 6: Document Templates Engine (CRUD)
  // =========================================================================
  await test('Document Templates Engine: Full lifecycle for certificate templates with dynamic variables', async () => {
    const template = await service.createTemplate(
      {
        documentTypeId: birthCertTypeId,
        name: `Bonafide Certificate Template ${suffix}`,
        templateBody: 'This is to certify that {{student_name}} of class {{class_name}} is a bonafide student.',
        variables: ['{{student_name}}', '{{class_name}}', '{{admission_number}}'],
      },
      adminActor
    );
    assert.ok(template.id);
    assert.equal(template.name, `Bonafide Certificate Template ${suffix}`);
    assert.ok(template.variables.includes('{{student_name}}'));
    templateId = template.id;

    // List templates
    const list = await service.listTemplates(birthCertTypeId);
    assert.ok(list.some(t => t.id === templateId));

    // Update template
    const updated = await service.updateTemplate(
      templateId,
      {
        name: `Updated Bonafide Template ${suffix}`,
        variables: ['{{student_name}}', '{{class_name}}', '{{admission_number}}', '{{academic_year}}'],
      },
      adminActor
    );
    assert.equal(updated.name, `Updated Bonafide Template ${suffix}`);
    assert.equal(updated.variables.length, 4);

    // Clean up template
    const delRes = await service.deleteTemplate(templateId, adminActor);
    assert.equal(delRes.success, true);
  });

  // =========================================================================
  // TEST 7: Official Bonafide Certificate Generation with QR & Verification URL
  // =========================================================================
  await test('Certificate Generation: Generates Bonafide Certificate with QR payload, verification URL, and automatic vault registration', async () => {
    const cert = await service.generateBonafideCertificate(
      student1Id,
      'Passport Application & Visa Processing',
      adminActor
    );

    assert.ok(cert.certificateId.startsWith(`BONA-${institution.code}`), 'Certificate ID must follow authoritative format');
    assert.equal(cert.studentName, 'Aarav Sharma');
    assert.equal(cert.admissionNumber, `ADM-DOC-${suffix}-1`);
    assert.equal(cert.purpose, 'Passport Application & Visa Processing');
    assert.ok(cert.verificationUrl.includes(cert.certificateId), 'Verification URL must embed unique certificate ID');

    // Parse and verify cryptographic QR payload
    const qrData = JSON.parse(cert.qrPayload);
    assert.equal(qrData.certId, cert.certificateId);
    assert.equal(qrData.admissionNo, `ADM-DOC-${suffix}-1`);
    assert.ok(qrData.sig && qrData.sig.length > 8, 'QR payload must contain tamper-evident cryptographic signature');

    // Verify it was automatically deposited into student's document vault as verified
    assert.ok(cert.documentId);
    generatedCertDocId = cert.documentId;

    const vaultDoc = await service.getDocument(cert.documentId, adminActor);
    assert.equal(vaultDoc.ownerType, 'student');
    assert.equal(vaultDoc.ownerId, student1Id);
    assert.equal(vaultDoc.verificationStatus, 'verified', 'Generated certificate must be auto-verified');
    assert.equal(vaultDoc.metadata.certificateId, cert.certificateId);
  });

  // =========================================================================
  // TEST 8: Official Transfer Certificate (TC) Generation
  // =========================================================================
  await test('Certificate Generation: Generates Transfer Certificate with conduct, reason, and verified vault record', async () => {
    const tc = await service.generateTransferCertificate(
      student1Id,
      {
        reason: 'Relocation of family to another state',
        conduct: 'Exemplary',
        remarks: 'Cleared all institutional dues and library books',
        promotedToClass: 'Class 6',
      },
      adminActor
    );

    assert.ok(tc.certificateId.startsWith(`TC-${institution.code}`));
    assert.equal(tc.studentName, 'Aarav Sharma');
    assert.equal(tc.reason, 'Relocation of family to another state');
    assert.equal(tc.conduct, 'Exemplary');
    assert.ok(tc.verificationUrl.includes(tc.certificateId));

    const qrData = JSON.parse(tc.qrPayload);
    assert.equal(qrData.type, 'Transfer Certificate');

    const vaultDoc = await service.getDocument(tc.documentId, adminActor);
    assert.equal(vaultDoc.verificationStatus, 'verified');
    assert.equal(vaultDoc.metadata.conduct, 'Exemplary');
  });

  // =========================================================================
  // TEST 9: Document Requests Pipeline
  // =========================================================================
  await test('Document Requests Pipeline: Student requests document, Admin reviews and approves with issued document reference', async () => {
    // 1. Student requests Transfer Certificate
    const req = await service.requestDocument(
      {
        requestedForType: 'student',
        requestedForId: student1Id,
        documentTypeId: birthCertTypeId,
        remarks: 'Need official attested copy for passport renewal',
      },
      studentActor
    );
    assert.ok(req.id);
    assert.equal(req.status, 'pending');
    requestId = req.id;

    // 2. Admin lists requests
    const pendingRequests = await service.listDocumentRequests({ status: 'pending' }, adminActor);
    assert.ok(pendingRequests.some(r => r.id === requestId));

    // 3. Admin processes request (approve and link issued document)
    const processed = await service.processDocumentRequest(
      requestId,
      'verified',
      'Attested and issued from central records',
      uploadedDocId,
      adminActor
    );
    assert.equal(processed.status, 'verified');
    assert.equal(processed.issuedDocumentId, uploadedDocId);
    assert.ok(processed.remarks?.includes('Attested and issued'));
  });

  // =========================================================================
  // TEST 10: Scoped Access Control (Rules 1, 2, 8, 9, 10)
  // =========================================================================
  await test('Scoped Access: Student & Parent scoped to own/child records; unassigned Faculty blocked (Rule 8/9/10)', async () => {
    // 1. Student 1 accesses own document -> ALLOWED
    const studentDoc = await service.getDocument(uploadedDocId, studentActor);
    assert.equal(studentDoc.id, uploadedDocId);

    // 2. Student 1 attempts to access Student 2's document -> BLOCKED (Rule 10)
    const s2Doc = await service.uploadDocument(
      {
        documentTypeId: birthCertTypeId,
        ownerType: 'student',
        ownerId: student2Id,
        fileName: 'Student2_Birth_Certificate.pdf',
        mimeType: 'application/pdf',
      },
      adminActor
    );

    await assert.rejects(
      async () => {
        await service.getDocument(s2Doc.id, studentActor);
      },
      /Rule 10/i,
      'Student must be blocked from accessing other students documents (Rule 10)'
    );

    // 3. Parent of Student 1 accesses Student 1 document -> ALLOWED (Rule 9)
    const parentDoc = await service.getDocument(uploadedDocId, parentActor);
    assert.equal(parentDoc.id, uploadedDocId);

    // 4. Parent attempts to access Student 2 document -> BLOCKED (Rule 9)
    await assert.rejects(
      async () => {
        await service.getDocument(s2Doc.id, parentActor);
      },
      /Rule 9/i,
      'Parent must be blocked from accessing unlinked children documents (Rule 9)'
    );

    // 5. Faculty allocated to Student 1 class/section accesses Student 1 document -> ALLOWED (Rule 8)
    const facDoc = await service.getDocument(uploadedDocId, facultyActor);
    assert.equal(facDoc.id, uploadedDocId);

    // 6. Unassigned faculty attempting to access Student 1 document -> BLOCKED (Rule 8)
    const otherFacultyProfileId = await createTestProfile(`doc.unassigned.${suffix}@vid.edu`, `Unassigned Fac ${suffix}`, 'Faculty');
    const unassignedFacultyActor = { id: otherFacultyProfileId, role: 'FACULTY', institutionId: instId, profileId: otherFacultyProfileId };

    await assert.rejects(
      async () => {
        await service.getDocument(uploadedDocId, unassignedFacultyActor);
      },
      /Rule 8/i,
      'Unassigned faculty must be blocked from accessing student documents (Rule 8)'
    );

    // 7. Cross-Tenant Isolation: Another institution cannot access document
    const otherInstService = new DocumentsService('00000000-0000-0000-0000-000000000001');
    const crossTenantActor = { id: 'alien-admin', role: 'INSTITUTION_ADMIN', institutionId: '00000000-0000-0000-0000-000000000001' };

    await assert.rejects(
      async () => {
        await otherInstService.getDocument(uploadedDocId, crossTenantActor);
      },
      /Document not found/i,
      'Cross-tenant document access must be completely isolated and return 404'
    );
  });

  // ==========================================
  // CLEANUP
  // ==========================================
  console.log('\n🧹 Cleaning up test artifacts...');
  try {
    await db.query(`DELETE FROM document_verifications WHERE document_id IN (SELECT id FROM documents WHERE institution_id = $1 AND (file_name LIKE '%${suffix}%' OR metadata::text LIKE '%${suffix}%' OR owner_id IN ($2, $3)))`, [instId, student1Id, student2Id]);
    await db.query(`DELETE FROM document_requests WHERE institution_id = $1 AND (requested_by = $2 OR requested_for_id IN ($3, $4))`, [instId, studentProfileId, student1Id, student2Id]);
    await db.query(`DELETE FROM document_templates WHERE institution_id = $1 AND name LIKE '%${suffix}%'`, [instId]);
    await db.query(`DELETE FROM documents WHERE institution_id = $1 AND (file_name LIKE '%${suffix}%' OR metadata::text LIKE '%${suffix}%' OR owner_id IN ($2, $3))`, [instId, student1Id, student2Id]);
    await db.query(`DELETE FROM document_types WHERE code LIKE '%${suffix}%'`);
    await db.query(`DELETE FROM student_parents WHERE student_id IN ($1, $2)`, [student1Id, student2Id]);
    await db.query(`DELETE FROM parents WHERE id = $1`, [parentId]);
    await db.query(`DELETE FROM faculty_assignments WHERE academic_year_id = $1`, [academicYearId]);
    await db.query(`DELETE FROM subjects WHERE id = $1`, [subjectId]);
    await db.query(`DELETE FROM staff WHERE id = $1`, [staffId]);
    await db.query(`DELETE FROM students WHERE id IN ($1, $2)`, [student1Id, student2Id]);
    await db.query(`DELETE FROM sections WHERE id = $1`, [sectionId]);
    await db.query(`DELETE FROM classes WHERE id = $1`, [classId]);
    await db.query(`DELETE FROM departments WHERE id = $1`, [departmentId]);
    if (createdTestAY) {
      await db.query(`DELETE FROM academic_years WHERE id = $1`, [academicYearId]);
    }
    await db.query(`DELETE FROM user_roles WHERE profile_id IN ($1, $2, $3, $4, $5)`, [
      adminProfileId, studentProfileId, parentProfileId, facultyProfileId, otherStudentProfileId
    ]);
    console.log('   Cleanup complete.');
  } catch (err: any) {
    console.warn('   Cleanup warning:', err.message);
  }

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDocumentsTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
