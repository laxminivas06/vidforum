import { db } from '../../config/database';
import { AuditDispatcher } from '../../common/audit-dispatcher';

export interface ApplicantRow {
  id: string;
  applicant_name: string;
  date_of_birth: Date | string | null;
  gender: string | null;
  applying_for_class_id: string | null;
  academic_year_id: string | null;
  grade_applying: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  stage: string;
  applied_date: Date;
  documents_submitted: any[];
  entrance_score: number | null;
  interview_date: string | null;
  notes: string | null;
  fee_amount?: number | string | null;
  fee_status?: string | null;
}

export class AdmissionsRepository {
  // -----------------------------------------------------------------------
  // Enquiries
  // -----------------------------------------------------------------------
  async findEnquiries(institutionId: string, filters: { search?: string; status?: string }) {
    let query = `
      SELECT e.*,
             c.name AS class_name,
             ay.name AS academic_year_name
      FROM enquiries e
      LEFT JOIN classes c ON c.id = e.class_id
      LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
      WHERE e.institution_id = $1
    `;
    const params: any[] = [institutionId];
    if (filters.status) { params.push(filters.status); query += ` AND e.status = $${params.length}`; }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (e.applicant_name ILIKE $${params.length} OR e.contact_name ILIKE $${params.length} OR e.contact_phone ILIKE $${params.length})`;
    }
    query += ' ORDER BY e.created_at DESC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async createEnquiry(institutionId: string, data: {
    applicantName: string;
    dateOfBirth?: string;
    gender?: string;
    gradeApplying?: string;
    classId?: string;
    academicYearId?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    source?: string;
    notes?: string;
  }) {
    const res = await db.query(
      `INSERT INTO enquiries (
         institution_id, applicant_name, date_of_birth, gender,
         grade_applying, class_id, academic_year_id,
         contact_name, contact_phone, contact_email, source, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        institutionId, data.applicantName, data.dateOfBirth || null, data.gender || null,
        data.gradeApplying || null, data.classId || null, data.academicYearId || null,
        data.contactName, data.contactPhone, data.contactEmail || null,
        data.source || 'walk-in', data.notes || null,
      ]
    );
    return res.rows[0];
  }

  async convertEnquiryToApplication(enquiryId: string, institutionId: string, classId: string, academicYearId: string) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const enqRes = await client.query(
        'SELECT * FROM enquiries WHERE id = $1 AND institution_id = $2 FOR UPDATE',
        [enquiryId, institutionId]
      );
      const enq = enqRes.rows[0];
      if (!enq) throw new Error('Enquiry not found');

      const appRes = await client.query(
        `INSERT INTO applications (
           institution_id, applicant_name, date_of_birth, gender,
           applying_for_class_id, academic_year_id,
           guardian_name, guardian_phone, guardian_email,
           stage, enquiry_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'application',$10) RETURNING *`,
        [
          institutionId, enq.applicant_name, enq.date_of_birth, enq.gender,
          classId || enq.class_id, academicYearId || enq.academic_year_id,
          enq.contact_name, enq.contact_phone, enq.contact_email, enq.id,
        ]
      );

      await client.query(
        "UPDATE enquiries SET status = 'converted', updated_at = now() WHERE id = $1",
        [enquiryId]
      );
      await client.query('COMMIT');
      return appRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // -----------------------------------------------------------------------
  // Applications (pipeline)
  // -----------------------------------------------------------------------
  async findApplicantsByInstitution(institutionId: string, filters: { search?: string; stage?: string; classId?: string } = {}): Promise<ApplicantRow[]> {
    let query = `
      SELECT 
        a.id, a.applicant_name, a.date_of_birth, a.gender,
        a.applying_for_class_id, a.academic_year_id,
        c.name AS grade_applying,
        a.guardian_name, a.guardian_phone, a.guardian_email,
        a.stage, a.created_at AS applied_date, a.entrance_score,
        a.interview_date, a.notes,
        COALESCE(a.fee_amount, 0)::numeric AS fee_amount,
        COALESCE(a.fee_status, 'unpaid') AS fee_status,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ad.id, 'title', ad.document_type,
            'status', UPPER(ad.verification_status::text),
            'fileName', ad.storage_key,
            'uploadDate', to_char(ad.created_at, 'YYYY-MM-DD')
          )) FROM admission_documents ad WHERE ad.application_id = a.id),
          '[]'::json
        ) AS documents_submitted
      FROM applications a
      LEFT JOIN classes c ON c.id = a.applying_for_class_id
      WHERE a.institution_id = $1
    `;
    const params: any[] = [institutionId];
    if (filters.stage) { params.push(filters.stage); query += ` AND a.stage = $${params.length}`; }
    if (filters.classId) { params.push(filters.classId); query += ` AND a.applying_for_class_id = $${params.length}`; }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (a.applicant_name ILIKE $${params.length} OR a.guardian_name ILIKE $${params.length})`;
    }
    query += ' ORDER BY a.created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  }

  async findApplicationById(id: string, institutionId: string) {
    const res = await db.query(
      'SELECT a.*, c.name AS class_name FROM applications a LEFT JOIN classes c ON c.id = a.applying_for_class_id WHERE a.id = $1 AND a.institution_id = $2',
      [id, institutionId]
    );
    return res.rows[0] || null;
  }

  async createApplication(institutionId: string, data: {
    applicantName: string; dateOfBirth?: string; gender?: string;
    classId?: string; gradeApplying?: string; academicYearId?: string;
    guardianName?: string; guardianPhone?: string; guardianEmail?: string;
    stage?: string; notes?: string; entranceScore?: number; enquiryId?: string;
    feeAmount?: number | string; feeStatus?: string;
  }) {
    let academicYearId = data.academicYearId;
    if (!academicYearId) {
      const ayRes = await db.query(
        'SELECT id FROM academic_years WHERE institution_id = $1 AND is_current = true LIMIT 1',
        [institutionId]
      );
      academicYearId = ayRes.rows[0]?.id;
      if (!academicYearId) {
        const anyAy = await db.query('SELECT id FROM academic_years WHERE institution_id = $1 ORDER BY start_date DESC LIMIT 1', [institutionId]);
        academicYearId = anyAy.rows[0]?.id;
      }
    }

    let classId = data.classId;
    if (!classId && data.gradeApplying) {
      const cRes = await db.query(
        'SELECT id FROM classes WHERE institution_id = $1 AND (name ILIKE $2 OR name ILIKE $3) LIMIT 1',
        [institutionId, data.gradeApplying, `%${data.gradeApplying}%`]
      );
      classId = cRes.rows[0]?.id;
    }
    if (!classId) {
      const defaultC = await db.query('SELECT id FROM classes WHERE institution_id = $1 ORDER BY name LIMIT 1', [institutionId]);
      classId = defaultC.rows[0]?.id;
    }

    const validGenders = ['male', 'female', 'other', 'undisclosed'];
    const gender = data.gender && validGenders.includes(data.gender.toLowerCase())
      ? data.gender.toLowerCase()
      : 'male';

    const stageMap: Record<string, string> = {
      INQUIRY: 'enquiry', APPLIED: 'application',
      DOCUMENT_VERIFICATION: 'document_verification', INTERVIEW: 'review',
      APPROVED: 'approved', REJECTED: 'rejected', WAITLISTED: 'waitlisted', ENROLLED: 'enrolled',
    };
    const stage = data.stage ? (stageMap[data.stage] || data.stage.toLowerCase().replace(' ', '_')) : 'application';

    const feeAmount = data.feeAmount !== undefined && data.feeAmount !== null && !isNaN(Number(data.feeAmount))
      ? Number(data.feeAmount)
      : 0;
    const feeStatus = data.feeStatus ? data.feeStatus.toLowerCase() : 'unpaid';

    const res = await db.query(
      `INSERT INTO applications (
         institution_id, applicant_name, date_of_birth, gender,
         applying_for_class_id, academic_year_id,
         guardian_name, guardian_phone, guardian_email,
         stage, notes, entrance_score, enquiry_id,
         fee_amount, fee_status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        institutionId, data.applicantName, data.dateOfBirth || null, gender,
        classId, academicYearId,
        data.guardianName || null, data.guardianPhone || null, data.guardianEmail || null,
        stage, data.notes || null, data.entranceScore || null, data.enquiryId || null,
        feeAmount, feeStatus,
      ]
    );
    return res.rows[0];
  }

  async bulkInsertApplicants(institutionId: string, rows: any[], defaultAcademicYearId?: string, actorId?: string) {
    const results: { row: number; success: boolean; applicantName: string; id?: string; error?: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const applicantName = r.applicantName || r.studentName || `${r.firstName || ''} ${r.lastName || ''}`.trim();
        if (!applicantName) {
          throw new Error('Applicant name is required');
        }

        const app = await this.createApplication(institutionId, {
          applicantName,
          dateOfBirth: r.dateOfBirth || null,
          gender: r.gender,
          classId: r.classId,
          gradeApplying: r.gradeApplying || r.className || r.grade,
          academicYearId: r.academicYearId || defaultAcademicYearId,
          guardianName: r.guardianName || r.parentName,
          guardianPhone: r.guardianPhone || r.parentPhone,
          guardianEmail: r.guardianEmail || r.parentEmail,
          stage: r.stage || 'application',
          notes: r.notes,
          entranceScore: r.entranceScore ? parseFloat(r.entranceScore) : undefined,
          feeAmount: r.feeAmount !== undefined && r.feeAmount !== null ? Number(r.feeAmount) : 0,
          feeStatus: r.feeStatus || (r.feePaid === true ? 'paid' : 'unpaid'),
        });

        results.push({ row: i + 1, success: true, applicantName, id: app.id });
      } catch (err: any) {
        results.push({ row: i + 1, success: false, applicantName: r.applicantName || `Row ${i + 1}`, error: err.message });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    return {
      total: rows.length,
      succeeded,
      failed,
      results,
    };
  }

  async updateApplicationStage(id: string, stage: string, actorId?: string) {
    const old = await db.query('SELECT stage FROM applications WHERE id = $1', [id]);
    const res = await db.query(
      'UPDATE applications SET stage = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [stage, id]
    );
    if (res.rows.length === 0) return null;
    await AuditDispatcher.dispatch({
      actorId: actorId || '00000000-0000-0000-0000-000000000001',
      action: 'admissions.application.stage_changed',
      resource: 'admissions', resourceId: id,
      institutionId: res.rows[0].institution_id,
      oldValue: { stage: old.rows[0]?.stage },
      newValue: { stage },
    });
    return res.rows[0];
  }

  async executeApprovalTransaction(applicationId: string, institutionId: string, data: {
    sectionId: string; admissionNumber: string; firstName: string;
    lastName: string; rollNumber: string; actorId?: string;
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const appRes = await client.query(
        'SELECT * FROM applications WHERE id = $1 AND institution_id = $2 FOR UPDATE',
        [applicationId, institutionId]
      );
      const app = appRes.rows[0];
      if (!app) throw new Error('Application not found');

      const admRes = await client.query(
        `INSERT INTO admissions (
           institution_id, application_id, approved_class_id, approved_section_id,
           academic_year_id, decision, admission_fee_status, decided_by
         ) VALUES ($1,$2,$3,$4,$5,'approved','pending',$6) RETURNING id`,
        [institutionId, app.id, app.applying_for_class_id, data.sectionId, app.academic_year_id, data.actorId || null]
      );
      const admissionId = admRes.rows[0].id;

      const studentRes = await client.query(
        `INSERT INTO students (
           institution_id, admission_number, admission_id,
           first_name, last_name, date_of_birth, gender,
           current_class_id, current_section_id, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active') RETURNING *`,
        [
          institutionId, data.admissionNumber, admissionId,
          data.firstName, data.lastName,
          app.date_of_birth || '2011-01-01', app.gender || 'male',
          app.applying_for_class_id, data.sectionId,
        ]
      );
      const student = studentRes.rows[0];

      if (app.guardian_name) {
        const gRes = await client.query(
          'INSERT INTO guardians (institution_id, full_name, phone, email) VALUES ($1,$2,$3,$4) RETURNING id',
          [institutionId, app.guardian_name, app.guardian_phone, app.guardian_email]
        );
        await client.query(
          "INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary_contact) VALUES ($1,$2,'Parent',true) ON CONFLICT DO NOTHING",
          [student.id, gRes.rows[0].id]
        );
      }

      await client.query(
        `INSERT INTO student_academic_history (institution_id, student_id, academic_year_id, class_id, section_id, roll_number)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [institutionId, student.id, app.academic_year_id, app.applying_for_class_id, data.sectionId, data.rollNumber]
      );

      await client.query("UPDATE applications SET stage = 'enrolled', updated_at = now() WHERE id = $1", [app.id]);
      await client.query('COMMIT');

      await AuditDispatcher.dispatch({
        actorId: data.actorId || '00000000-0000-0000-0000-000000000001',
        action: 'admissions.application.approved',
        resource: 'admissions', resourceId: admissionId, institutionId,
        oldValue: { stage: app.stage },
        newValue: { stage: 'enrolled', admissionId, studentId: student.id, admissionNumber: data.admissionNumber },
      });
      return student;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async countStudents(institutionId: string): Promise<number> {
    const res = await db.query('SELECT count(*) FROM students WHERE institution_id = $1', [institutionId]);
    return parseInt(res.rows[0].count, 10);
  }

  async existsAdmissionNumber(institutionId: string, admissionNumber: string): Promise<boolean> {
    const res = await db.query('SELECT 1 FROM students WHERE institution_id = $1 AND admission_number = $2', [institutionId, admissionNumber]);
    return res.rows.length > 0;
  }

  async findDefaultSection(classId: string): Promise<string | null> {
    if (!classId) return null;
    const res = await db.query('SELECT id FROM sections WHERE class_id = $1 ORDER BY name ASC LIMIT 1', [classId]);
    if (res.rows[0]?.id) return res.rows[0].id;
    try {
      const newSec = await db.query(
        "INSERT INTO sections (class_id, name, capacity) VALUES ($1, 'Section A', 40) RETURNING id",
        [classId]
      );
      return newSec.rows[0]?.id || null;
    } catch {
      return null;
    }
  }

  async getAdmissionDocuments(institutionId: string, filters: { status?: string; search?: string } = {}) {
    let query = `
      SELECT 
        ad.id,
        ad.application_id,
        ad.document_type AS title,
        ad.storage_key AS file_name,
        LOWER(ad.verification_status::text) AS status,
        ad.verified_at,
        ad.created_at AS upload_date,
        a.applicant_name,
        c.name AS grade_applying,
        a.guardian_name,
        a.guardian_phone,
        a.stage AS applicant_stage
      FROM admission_documents ad
      JOIN applications a ON a.id = ad.application_id
      LEFT JOIN classes c ON c.id = a.applying_for_class_id
      WHERE a.institution_id = $1
    `;
    const params: any[] = [institutionId];
    let idx = 2;

    if (filters.status && filters.status !== 'ALL') {
      query += ` AND LOWER(ad.verification_status) = $${idx++}`;
      params.push(filters.status.toLowerCase());
    }

    if (filters.search) {
      query += ` AND (a.applicant_name ILIKE $${idx} OR ad.document_type ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    query += ` ORDER BY ad.created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map((r, i) => ({
      id: r.id,
      applicationId: r.application_id,
      applicationNumber: `APP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      title: r.title,
      fileName: r.file_name || `${r.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      status: (r.status || 'pending').toUpperCase(),
      verifiedAt: r.verified_at,
      uploadDate: r.upload_date ? new Date(r.upload_date).toISOString().split('T')[0] : '',
      applicantName: r.applicant_name,
      gradeApplying: r.grade_applying || 'N/A',
      guardianName: r.guardian_name || 'N/A',
      guardianPhone: r.guardian_phone || '',
      applicantStage: r.applicant_stage,
    }));
  }

  async updateDocumentStatus(documentId: string, institutionId: string, status: string, actorId?: string) {
    const validStatus = ['pending', 'verified', 'rejected'].includes(status.toLowerCase())
      ? status.toLowerCase()
      : 'pending';

    const verifiedAt = validStatus === 'verified' ? new Date() : null;

    let verifiedBy = null;
    if (actorId) {
      const prof = await db.query('SELECT id FROM profiles WHERE id = $1', [actorId]);
      if (prof.rows.length > 0) verifiedBy = actorId;
    }

    const res = await db.query(
      `UPDATE admission_documents ad
       SET verification_status = $1,
           verified_at = $2,
           verified_by = $3
       FROM applications a
       WHERE ad.id = $4 AND ad.application_id = a.id AND a.institution_id = $5
       RETURNING ad.*`,
      [validStatus, verifiedAt, verifiedBy, documentId, institutionId]
    );
    return res.rows[0];
  }

  async addAdmissionDocument(institutionId: string, applicationId: string, documentType: string, storageKey?: string, status: string = 'pending') {
    const validStatus = ['pending', 'verified', 'rejected'].includes(status.toLowerCase())
      ? status.toLowerCase()
      : 'pending';

    // Verify application belongs to institution
    const appCheck = await db.query('SELECT id FROM applications WHERE id = $1 AND institution_id = $2', [applicationId, institutionId]);
    if (appCheck.rows.length === 0) {
      throw new Error('Application not found for this institution');
    }

    const res = await db.query(
      `INSERT INTO admission_documents (application_id, document_type, storage_key, verification_status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        applicationId,
        documentType,
        storageKey || `admissions/doc_${Date.now()}_${documentType.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
        validStatus,
      ]
    );
    return res.rows[0];
  }

  async getEnrolledStudents(institutionId: string, filters: { search?: string; classId?: string } = {}) {
    let query = `
      SELECT 
        a.id AS application_id,
        a.applicant_name AS student_name,
        a.gender,
        a.date_of_birth,
        c.id AS class_id,
        c.name AS grade_name,
        COALESCE(s.admission_number, 'ADM-' || substring(a.id::text, 1, 8)) AS admission_number,
        COALESCE(s.id, a.id) AS student_id,
        COALESCE(s.created_at::date, a.updated_at::date, now()::date) AS enrollment_date,
        a.guardian_name,
        a.guardian_phone,
        a.guardian_email,
        COALESCE(a.fee_amount, 2500) AS fee_amount,
        COALESCE(a.fee_status, 'paid') AS fee_status,
        a.created_at AS application_date,
        a.updated_at AS enrolled_date,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ad.id, 'title', ad.document_type,
            'status', UPPER(ad.verification_status::text),
            'fileName', ad.storage_key,
            'uploadDate', to_char(ad.created_at, 'YYYY-MM-DD')
          )) FROM admission_documents ad WHERE ad.application_id = a.id),
          '[]'::json
        ) AS documents
      FROM applications a
      LEFT JOIN classes c ON c.id = a.applying_for_class_id
      LEFT JOIN LATERAL (
        SELECT s2.id, s2.admission_number, s2.created_at 
        FROM admissions adm2
        JOIN students s2 ON s2.admission_id = adm2.id
        WHERE adm2.application_id = a.id
        ORDER BY s2.created_at DESC
        LIMIT 1
      ) s ON true
      WHERE a.institution_id = $1 AND a.stage = 'enrolled'
    `;
    const params: any[] = [institutionId];
    let idx = 2;

    if (filters.classId && filters.classId !== 'ALL') {
      query += ` AND a.applying_for_class_id = $${idx++}`;
      params.push(filters.classId);
    }

    if (filters.search) {
      query += ` AND (a.applicant_name ILIKE $${idx} OR s.admission_number ILIKE $${idx} OR a.guardian_name ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    query += ` ORDER BY a.updated_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map((r, i) => ({
      id: r.application_id,
      applicationId: r.application_id,
      studentId: r.student_id || r.application_id,
      studentName: r.student_name,
      applicationNumber: `APP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      admissionNumber: r.admission_number,
      gender: r.gender || 'Not specified',
      dateOfBirth: r.date_of_birth ? new Date(r.date_of_birth).toISOString().split('T')[0] : '',
      gradeName: r.grade_name || 'Class 1',
      classId: r.class_id || '',
      enrollmentDate: r.enrollment_date ? new Date(r.enrollment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      enrolledDate: r.enrolled_date ? new Date(r.enrolled_date).toISOString().split('T')[0] : '',
      guardianName: r.guardian_name || 'N/A',
      guardianPhone: r.guardian_phone || '',
      guardianEmail: r.guardian_email || '',
      feeAmount: Number(r.fee_amount || 0),
      feePaid: r.fee_status === 'paid' || r.fee_status === 'PAID',
      feeStatus: r.fee_status || 'paid',
      documents: r.documents || [],
      documentsVerified: (r.documents || []).filter((d: any) => d.status === 'VERIFIED').length,
      totalDocuments: (r.documents || []).length,
    }));
  }

  async getPipelineStats(institutionId: string) {
    const res = await db.query(
      `SELECT stage, COUNT(*)::int AS count FROM applications WHERE institution_id = $1 GROUP BY stage`,
      [institutionId]
    );
    return res.rows;
  }
}

export const admissionsRepository = new AdmissionsRepository();
