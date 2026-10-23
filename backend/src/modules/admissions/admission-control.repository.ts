import { db } from '../../config/database';

export interface AdmissionConfigInput {
  academicConfigurationId: string;
  requiresExam: boolean;
  examinationName?: string;
  maxMarks?: number;
  passingMarks?: number;
  cutoffMarks?: number;
  examDate?: string;
  status?: string;
  displayOrder?: number;
}

export interface AdmissionFeePolicyInput {
  academicYearId: string;
  policyType: 'fee' | 'no_fee';
  pricingMethod: 'same_for_all' | 'customized';
  flatAmount: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export interface CustomFeeRateInput {
  policyId: string;
  academicConfigurationId: string;
  amount: number;
}

export interface TemporaryAdmissionInput {
  studentName: string;
  contactNumber: string;
  parentName: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  preliminaryAddress?: string;
  academicYearId: string;
  academicConfigurationId: string;
  admissionConfigId?: string;
}

export interface ExamResultInput {
  examName: string;
  maxMarks: number;
  marksObtained: number;
  passingMarks: number;
  cutoffMarks: number;
  notes?: string;
}

export interface PermanentAdmissionInput {
  temporaryAdmissionId?: string;
  studentDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    bloodGroup?: string;
    aadhaarNumber?: string;
    photoUrl?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  parents: Array<{
    relationshipType: 'father' | 'mother' | 'guardian' | 'other';
    name: string;
    occupation?: string;
    contactNumber: string;
  }>;
  academicYearId: string;
  academicConfigurationId: string;
  admissionFeeAmount: number;
  payment?: {
    paymentMode: 'cash' | 'upi' | 'card' | 'other';
    amount: number;
    utrReferenceNumber?: string;
    gatewayReferenceId?: string;
    upiProvider?: string;
    collectedBy?: string;
    notes?: string;
  };
}

export class AdmissionControlRepository {
  // =========================================================================
  // 1. ADMISSION CONFIGURATION (MODULE 3)
  // =========================================================================

  async listAdmissionConfigurations(institutionId: string, academicYearId?: string) {
    const res = await db.query(
      `SELECT 
        adm.id,
        adm.institution_id,
        adm.academic_configuration_id,
        adm.requires_exam,
        adm.examination_name,
        adm.max_marks,
        adm.passing_marks,
        adm.cutoff_marks,
        adm.exam_date,
        adm.status,
        adm.display_order,
        ac.academic_year_id,
        ay.name as academic_year_name,
        c.name as class_name,
        c.sequence_order as class_sequence,
        b.code as board_code,
        b.name as board_name,
        COALESCE(s.code, 'NONE') as stream_code,
        COALESCE(s.name, 'No Stream') as stream_name
       FROM admission_configurations adm
       JOIN academic_configurations ac ON ac.id = adm.academic_configuration_id
       JOIN academic_years ay ON ay.id = ac.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams s ON s.id = ac.stream_id
       WHERE adm.institution_id = $1
         AND ($2::uuid IS NULL OR ac.academic_year_id = $2::uuid)
       ORDER BY c.sequence_order ASC, b.code ASC, s.name ASC NULLS FIRST`,
      [institutionId, academicYearId || null]
    );
    return res.rows;
  }

  async upsertAdmissionConfiguration(institutionId: string, data: AdmissionConfigInput) {
    const maxMarks = data.maxMarks !== undefined ? data.maxMarks : 100;
    const passingMarks = data.passingMarks !== undefined ? data.passingMarks : 40;
    const cutoffMarks = data.cutoffMarks !== undefined ? data.cutoffMarks : 60;

    if (passingMarks > maxMarks) {
      throw new Error('passingMarks cannot be greater than maxMarks');
    }
    if (cutoffMarks > maxMarks) {
      throw new Error('cutoffMarks cannot be greater than maxMarks');
    }

    const res = await db.query(
      `INSERT INTO admission_configurations (
        institution_id, academic_configuration_id, requires_exam, examination_name,
        max_marks, passing_marks, cutoff_marks, exam_date, status, display_order, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'active'), COALESCE($10, 1), now())
       ON CONFLICT (institution_id, academic_configuration_id) DO UPDATE SET
        requires_exam = EXCLUDED.requires_exam,
        examination_name = EXCLUDED.examination_name,
        max_marks = EXCLUDED.max_marks,
        passing_marks = EXCLUDED.passing_marks,
        cutoff_marks = EXCLUDED.cutoff_marks,
        exam_date = EXCLUDED.exam_date,
        status = EXCLUDED.status,
        display_order = EXCLUDED.display_order,
        updated_at = now()
       RETURNING *`,
      [
        institutionId,
        data.academicConfigurationId,
        data.requiresExam,
        data.examinationName || null,
        maxMarks,
        passingMarks,
        cutoffMarks,
        data.examDate || null,
        data.status,
        data.displayOrder,
      ]
    );
    return res.rows[0];
  }

  // =========================================================================
  // 2. ADMISSION FEES POLICY & CUSTOM RATES (MODULE 4)
  // =========================================================================

  async getFeePolicy(institutionId: string, academicYearId: string) {
    const res = await db.query(
      `SELECT * FROM admission_fee_policies 
       WHERE institution_id = $1 AND academic_year_id = $2`,
      [institutionId, academicYearId]
    );
    return res.rows[0] || null;
  }

  async saveFeePolicy(institutionId: string, data: AdmissionFeePolicyInput) {
    const res = await db.query(
      `INSERT INTO admission_fee_policies (
        institution_id, academic_year_id, policy_type, pricing_method, flat_amount,
        effective_from, effective_to, is_active, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, true), now())
       ON CONFLICT (institution_id, academic_year_id) DO UPDATE SET
        policy_type = EXCLUDED.policy_type,
        pricing_method = EXCLUDED.pricing_method,
        flat_amount = EXCLUDED.flat_amount,
        effective_from = EXCLUDED.effective_from,
        effective_to = EXCLUDED.effective_to,
        is_active = EXCLUDED.is_active,
        updated_at = now()
       RETURNING *`,
      [
        institutionId,
        data.academicYearId,
        data.policyType,
        data.pricingMethod,
        data.flatAmount || 0,
        data.effectiveFrom || null,
        data.effectiveTo || null,
        data.isActive,
      ]
    );
    return res.rows[0];
  }

  async getCustomRates(institutionId: string, policyId: string) {
    const res = await db.query(
      `SELECT 
        cr.id,
        cr.policy_id,
        cr.academic_configuration_id,
        cr.amount,
        c.name as class_name,
        c.sequence_order as class_sequence,
        b.code as board_code,
        COALESCE(s.name, 'General') as stream_name,
        ay.name as academic_year_name
       FROM admission_fee_custom_rates cr
       JOIN academic_configurations ac ON ac.id = cr.academic_configuration_id
       JOIN academic_years ay ON ay.id = ac.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams s ON s.id = ac.stream_id
       WHERE cr.institution_id = $1 AND cr.policy_id = $2
       ORDER BY c.sequence_order ASC, b.code ASC`,
      [institutionId, policyId]
    );
    return res.rows;
  }

  async saveCustomRates(institutionId: string, policyId: string, rates: Array<{ academicConfigurationId: string; amount: number }>) {
    return await db.transaction(async (client) => {
      const results = [];
      for (const item of rates) {
        const res = await client.query(
          `INSERT INTO admission_fee_custom_rates (institution_id, policy_id, academic_configuration_id, amount, updated_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (institution_id, policy_id, academic_configuration_id) DO UPDATE SET
            amount = EXCLUDED.amount,
            updated_at = now()
           RETURNING *`,
          [institutionId, policyId, item.academicConfigurationId, item.amount || 0]
        );
        results.push(res.rows[0]);
      }
      return results;
    });
  }

  // Authoritative admission fee calculation for an applicant
  async calculateAdmissionFee(institutionId: string, academicConfigurationId: string, academicYearId: string): Promise<number> {
    const policy = await this.getFeePolicy(institutionId, academicYearId);
    if (!policy || policy.policy_type === 'no_fee') {
      return 0.00;
    }
    if (policy.pricing_method === 'same_for_all') {
      return parseFloat(policy.flat_amount) || 0.00;
    }
    // Customized rate
    const customRate = await db.query(
      `SELECT amount FROM admission_fee_custom_rates 
       WHERE institution_id = $1 AND policy_id = $2 AND academic_configuration_id = $3`,
      [institutionId, policy.id, academicConfigurationId]
    );
    if (customRate.rows.length > 0) {
      return parseFloat(customRate.rows[0].amount) || 0.00;
    }
    return parseFloat(policy.flat_amount) || 0.00;
  }

  // =========================================================================
  // 3. TEMPORARY ADMISSIONS (MODULE 7 & 8)
  // =========================================================================

  async listTemporaryAdmissions(institutionId: string, filters?: { search?: string; status?: string; academicYearId?: string }) {
    const values: any[] = [institutionId];
    let idx = 2;
    let where = 'ta.institution_id = $1';

    if (filters?.search) {
      where += ` AND (ta.student_name ILIKE $${idx} OR ta.temporary_admission_number ILIKE $${idx} OR ta.contact_number ILIKE $${idx})`;
      values.push(`%${filters.search.trim()}%`);
      idx++;
    }
    if (filters?.status && filters.status !== 'all') {
      where += ` AND ta.status = $${idx++}`;
      values.push(filters.status);
    }
    if (filters?.academicYearId) {
      where += ` AND ta.academic_year_id = $${idx++}`;
      values.push(filters.academicYearId);
    }

    const res = await db.query(
      `SELECT 
        ta.id,
        ta.temporary_admission_number,
        ta.student_name,
        ta.contact_number,
        ta.parent_name,
        ta.email,
        ta.date_of_birth,
        ta.gender,
        ta.preliminary_address,
        ta.academic_year_id,
        ay.name as academic_year_name,
        ta.academic_configuration_id,
        c.name as class_name,
        b.code as board_code,
        COALESCE(s.name, 'General') as stream_name,
        ta.admission_config_id,
        adm.examination_name,
        adm.cutoff_marks as config_cutoff_marks,
        adm.passing_marks as config_passing_marks,
        ta.status,
        ta.created_at,
        er.id as exam_result_id,
        er.marks_obtained,
        er.max_marks,
        er.passing_marks,
        er.cutoff_marks,
        er.result_status,
        er.admin_review_status,
        er.reviewed_at
       FROM temporary_admissions ta
       JOIN academic_configurations ac ON ac.id = ta.academic_configuration_id
       JOIN academic_years ay ON ay.id = ta.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams s ON s.id = ac.stream_id
       LEFT JOIN admission_configurations adm ON adm.id = ta.admission_config_id
       LEFT JOIN admission_exam_results er ON er.temporary_admission_id = ta.id
       WHERE ${where}
       ORDER BY ta.created_at DESC`,
      values
    );
    return res.rows;
  }

  async getTemporaryAdmissionById(institutionId: string, id: string) {
    const res = await db.query(
      `SELECT 
        ta.*,
        ay.name as academic_year_name,
        c.name as class_name,
        b.code as board_code,
        b.name as board_name,
        COALESCE(s.name, 'General') as stream_name,
        adm.examination_name,
        adm.cutoff_marks,
        adm.passing_marks,
        er.marks_obtained,
        er.result_status,
        er.admin_review_status
       FROM temporary_admissions ta
       JOIN academic_configurations ac ON ac.id = ta.academic_configuration_id
       JOIN academic_years ay ON ay.id = ta.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams s ON s.id = ac.stream_id
       LEFT JOIN admission_configurations adm ON adm.id = ta.admission_config_id
       LEFT JOIN admission_exam_results er ON er.temporary_admission_id = ta.id
       WHERE ta.institution_id = $1 AND ta.id = $2`,
      [institutionId, id]
    );
    return res.rows[0] || null;
  }

  async createTemporaryAdmission(institutionId: string, data: TemporaryAdmissionInput, actorId?: string) {
    return await db.transaction(async (client) => {
      // 1. Generate sequential unique temporary admission number server-side
      const year = new Date().getFullYear();
      const countRes = await client.query(
        `SELECT COUNT(*)::int as count 
         FROM temporary_admissions 
         WHERE institution_id = $1 AND temporary_admission_number LIKE 'TEMP-${year}-%'`,
        [institutionId]
      );
      const nextSeq = (countRes.rows[0]?.count || 0) + 1;
      const tempNumber = `TEMP-${year}-${String(nextSeq).padStart(4, '0')}`;

      // 2. Fetch admission configuration for this academic configuration
      let admConfigId = data.admissionConfigId;
      if (!admConfigId) {
        const admRes = await client.query(
          `SELECT id, requires_exam, examination_name, max_marks, passing_marks, cutoff_marks 
           FROM admission_configurations 
           WHERE institution_id = $1 AND academic_configuration_id = $2 LIMIT 1`,
          [institutionId, data.academicConfigurationId]
        );
        if (admRes.rows.length > 0) {
          admConfigId = admRes.rows[0].id;
        }
      }

      // 3. Insert Temporary Admission
      const res = await client.query(
        `INSERT INTO temporary_admissions (
          institution_id, temporary_admission_number, student_name, contact_number,
          parent_name, email, date_of_birth, gender, preliminary_address,
          academic_year_id, academic_configuration_id, admission_config_id,
          status, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13)
         RETURNING *`,
        [
          institutionId,
          tempNumber,
          data.studentName.trim(),
          data.contactNumber.trim(),
          data.parentName.trim(),
          data.email?.trim() || null,
          data.dateOfBirth || null,
          data.gender || null,
          data.preliminaryAddress?.trim() || null,
          data.academicYearId,
          data.academicConfigurationId,
          admConfigId || null,
          actorId || null,
        ]
      );
      return res.rows[0];
    });
  }

  async recordExamResult(institutionId: string, temporaryAdmissionId: string, data: ExamResultInput, actorId?: string) {
    return await db.transaction(async (client) => {
      // Validate marks
      if (data.marksObtained < 0 || data.marksObtained > data.maxMarks) {
        throw new Error(`marksObtained (${data.marksObtained}) must be between 0 and maxMarks (${data.maxMarks})`);
      }

      // Cutoff evaluation
      const resultStatus = data.marksObtained >= data.cutoffMarks ? 'qualified' : 'not_qualified';

      // Upsert Exam Result
      const resultRes = await client.query(
        `INSERT INTO admission_exam_results (
          institution_id, temporary_admission_id, exam_name, max_marks, marks_obtained,
          passing_marks, cutoff_marks, result_status, admin_review_status, notes, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, now())
         ON CONFLICT (institution_id, temporary_admission_id) DO UPDATE SET
          exam_name = EXCLUDED.exam_name,
          max_marks = EXCLUDED.max_marks,
          marks_obtained = EXCLUDED.marks_obtained,
          passing_marks = EXCLUDED.passing_marks,
          cutoff_marks = EXCLUDED.cutoff_marks,
          result_status = EXCLUDED.result_status,
          notes = EXCLUDED.notes,
          updated_at = now()
         RETURNING *`,
        [
          institutionId,
          temporaryAdmissionId,
          data.examName,
          data.maxMarks,
          data.marksObtained,
          data.passingMarks,
          data.cutoffMarks,
          resultStatus,
          data.notes || null,
        ]
      );

      // Update temporary admission status
      await client.query(
        `UPDATE temporary_admissions 
         SET status = $3, updated_at = now() 
         WHERE institution_id = $1 AND id = $2`,
        [institutionId, temporaryAdmissionId, resultStatus]
      );

      return resultRes.rows[0];
    });
  }

  async bulkRecordExamResults(
    institutionId: string,
    marks: Array<{ temporaryId: string; marksObtained: number }>,
    actorId?: string
  ) {
    // 1. Fetch system configuration to get passMarks and examTotalMarks
    const settings = await this.getSystemSettings(institutionId);
    const passMarks = settings.systemConfiguration.admissionInfo?.passMarks || 35;
    const maxMarks = settings.systemConfiguration.admissionInfo?.examTotalMarks || 100;

    const results = [];
    for (const item of marks) {
      if (typeof item.marksObtained !== 'number' || item.marksObtained < 0 || item.marksObtained > maxMarks) {
        continue;
      }
      // Find temporary admission by temporary_admission_number or id
      const tempRes = await db.query(
        `SELECT id, admission_config_id FROM temporary_admissions 
         WHERE institution_id = $1 AND (temporary_admission_number = $2 OR id::text = $2)`,
        [institutionId, item.temporaryId]
      );
      if (tempRes.rows.length === 0) continue;

      const tempAdmission = tempRes.rows[0];
      const resultStatus = item.marksObtained >= passMarks ? 'qualified' : 'not_qualified';

      await db.query(
        `INSERT INTO admission_exam_results (
          institution_id, temporary_admission_id, exam_name, max_marks, marks_obtained,
          passing_marks, cutoff_marks, result_status, admin_review_status, updated_at
         ) VALUES ($1, $2, 'Entrance Assessment', $3, $4, $5, $5, $6, 'pending', now())
         ON CONFLICT (institution_id, temporary_admission_id) DO UPDATE SET
          max_marks = EXCLUDED.max_marks,
          marks_obtained = EXCLUDED.marks_obtained,
          passing_marks = EXCLUDED.passing_marks,
          cutoff_marks = EXCLUDED.cutoff_marks,
          result_status = EXCLUDED.result_status,
          updated_at = now()`,
        [institutionId, tempAdmission.id, maxMarks, item.marksObtained, passMarks, resultStatus]
      );

      await db.query(
        `UPDATE temporary_admissions 
         SET status = $3, updated_at = now() 
         WHERE institution_id = $1 AND id = $2`,
        [institutionId, tempAdmission.id, resultStatus]
      );

      results.push({ temporaryId: item.temporaryId, status: resultStatus, marksObtained: item.marksObtained });
    }
    return results;
  }

  async reviewExamResult(institutionId: string, temporaryAdmissionId: string, decision: 'approved' | 'rejected', notes?: string, actorId?: string) {
    return await db.transaction(async (client) => {
      const res = await client.query(
        `UPDATE admission_exam_results 
         SET admin_review_status = $3, reviewed_by = $4, reviewed_at = now(), notes = COALESCE($5, notes), updated_at = now()
         WHERE institution_id = $1 AND temporary_admission_id = $2
         RETURNING *`,
        [institutionId, temporaryAdmissionId, decision, actorId || null, notes || null]
      );

      const newTempStatus = decision === 'approved' ? 'approved' : 'rejected';
      await client.query(
        `UPDATE temporary_admissions 
         SET status = $3, updated_at = now() 
         WHERE institution_id = $1 AND id = $2`,
        [institutionId, temporaryAdmissionId, newTempStatus]
      );

      return res.rows[0];
    });
  }

  // =========================================================================
  // 4. PERMANENT ADMISSIONS & PAYMENTS (MODULE 9, 11, 12)
  // =========================================================================

  async generatePermanentAdmissionNumber(institutionId: string): Promise<string> {
    const year = new Date().getFullYear();
    const countRes = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM permanent_admissions 
       WHERE institution_id = $1 AND permanent_admission_number LIKE 'ADM-${year}-%'`,
      [institutionId]
    );
    const nextSeq = (countRes.rows[0]?.count || 0) + 1;
    return `ADM-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  async completePermanentAdmission(institutionId: string, data: PermanentAdmissionInput, actorId?: string) {
    return await db.transaction(async (client) => {
      // 1. Generate unique permanent admission number on server inside transaction (race-condition safe)
      const year = new Date().getFullYear();
      const countRes = await client.query(
        `SELECT COUNT(*)::int as count 
         FROM permanent_admissions 
         WHERE institution_id = $1 AND permanent_admission_number LIKE 'ADM-${year}-%'`,
        [institutionId]
      );
      const nextSeq = (countRes.rows[0]?.count || 0) + 1;
      const permNumber = `ADM-${year}-${String(nextSeq).padStart(4, '0')}`;

      // 2. Resolve Class and Section from academic_configuration
      const configRes = await client.query(
        `SELECT class_id, academic_year_id FROM academic_configurations WHERE institution_id = $1 AND id = $2`,
        [institutionId, data.academicConfigurationId]
      );
      if (configRes.rows.length === 0) {
        throw new Error('Invalid academic configuration specified');
      }
      const classId = configRes.rows[0].class_id;

      // Find first section in class
      const secRes = await client.query(
        `SELECT id FROM sections WHERE institution_id = $1 AND class_id = $2 ORDER BY name ASC LIMIT 1`,
        [institutionId, classId]
      );
      const sectionId = secRes.rows[0]?.id || null;

      // Validate actorId against users foreign key to prevent constraint violation
      let validActorId: string | null = null;
      if (actorId) {
        const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [actorId]);
        if (userCheck.rows.length > 0) validActorId = actorId;
      }

      // 3. Create single master Student Record (Rule 1 & PRD)
      const studentRes = await client.query(
        `INSERT INTO students (
          institution_id, admission_number, first_name, last_name, date_of_birth, gender,
          blood_group, aadhaar_number, photo_url, address_line1, city, state, pincode,
          current_class_id, current_section_id, status, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', $16)
         RETURNING *`,
        [
          institutionId,
          permNumber,
          data.studentDetails.firstName.trim(),
          data.studentDetails.lastName.trim(),
          data.studentDetails.dateOfBirth,
          data.studentDetails.gender,
          data.studentDetails.bloodGroup || null,
          data.studentDetails.aadhaarNumber || null,
          data.studentDetails.photoUrl || null,
          data.studentDetails.addressLine1 || null,
          data.studentDetails.city || null,
          data.studentDetails.state || null,
          data.studentDetails.pincode || null,
          classId,
          sectionId,
          validActorId,
        ]
      );
      const newStudent = studentRes.rows[0];

      // 4. Save Parent / Guardian Records with De-duplication
      if (data.parents && data.parents.length > 0) {
        for (const p of data.parents) {
          const gRes = await client.query(
            `INSERT INTO guardians (institution_id, full_name, phone, occupation)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [institutionId, p.name.trim(), p.contactNumber.trim(), p.occupation || null]
          );
          const guardianId = gRes.rows[0].id;
          await client.query(
            `INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary_contact)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (student_id, guardian_id) DO NOTHING`,
            [newStudent.id, guardianId, p.relationshipType, p.relationshipType === 'father']
          );
        }
      }

      // 5. Build immutable Fee Policy Snapshot
      const feePolicy = await this.getFeePolicy(institutionId, data.academicYearId);
      const feeSnapshot = {
        calculatedAt: new Date().toISOString(),
        admissionFeeAmount: data.admissionFeeAmount,
        policyType: feePolicy?.policy_type || 'fee',
        pricingMethod: feePolicy?.pricing_method || 'same_for_all',
        flatAmount: feePolicy?.flat_amount || 0,
      };

      // 6. Record Permanent Admission Entry
      const feePaymentStatus = data.admissionFeeAmount <= 0 
        ? 'not_applicable' 
        : data.payment ? 'verified' : 'pending';

      const permRes = await client.query(
        `INSERT INTO permanent_admissions (
          institution_id, permanent_admission_number, temporary_admission_id, student_id,
          academic_year_id, academic_configuration_id, admission_fee_amount,
          fee_payment_status, enrollment_status, fee_snapshot, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9, $10)
         RETURNING *`,
        [
          institutionId,
          permNumber,
          data.temporaryAdmissionId || null,
          newStudent.id,
          data.academicYearId,
          data.academicConfigurationId,
          data.admissionFeeAmount,
          feePaymentStatus,
          JSON.stringify(feeSnapshot),
          actorId || null,
        ]
      );
      const permAdmission = permRes.rows[0];

      // 7. Record Payment if fee > 0 and payment provided
      let paymentRecord = null;
      if (data.admissionFeeAmount > 0 && data.payment) {
        const auditTrail = [{
          timestamp: new Date().toISOString(),
          actor: actorId || 'system',
          action: 'PAYMENT_COLLECTED',
          mode: data.payment.paymentMode,
          amount: data.payment.amount,
        }];

        const payStatus = data.payment.paymentMode === 'upi' ? 'pending_verification' : 'verified';

        const payRes = await client.query(
          `INSERT INTO admission_payments (
            institution_id, permanent_admission_id, student_id, amount, payment_mode,
            payment_status, utr_reference_number, gateway_reference_id, upi_provider,
            collected_by, collected_datetime, notes, audit_trail
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), $11, $12)
           RETURNING *`,
          [
            institutionId,
            permAdmission.id,
            newStudent.id,
            data.payment.amount,
            data.payment.paymentMode,
            payStatus,
            data.payment.utrReferenceNumber || null,
            data.payment.gatewayReferenceId || null,
            data.payment.upiProvider || null,
            data.payment.collectedBy || actorId || null,
            data.payment.notes || null,
            JSON.stringify(auditTrail),
          ]
        );
        paymentRecord = payRes.rows[0];
      }

      // 8. If converted from Temporary Admission, update its status
      if (data.temporaryAdmissionId) {
        await client.query(
          `UPDATE temporary_admissions 
           SET status = 'converted_to_permanent', updated_at = now() 
           WHERE institution_id = $1 AND id = $2`,
          [institutionId, data.temporaryAdmissionId]
        );
      }

      return {
        permanentAdmission: permAdmission,
        student: newStudent,
        payment: paymentRecord,
      };
    });
  }

  async listPermanentAdmissions(institutionId: string, filters?: { search?: string; academicYearId?: string }) {
    const values: any[] = [institutionId];
    let idx = 2;
    let where = 'pa.institution_id = $1';

    if (filters?.search) {
      where += ` AND (pa.permanent_admission_number ILIKE $${idx} OR s.first_name ILIKE $${idx} OR s.last_name ILIKE $${idx})`;
      values.push(`%${filters.search.trim()}%`);
      idx++;
    }
    if (filters?.academicYearId) {
      where += ` AND pa.academic_year_id = $${idx++}`;
      values.push(filters.academicYearId);
    }

    const res = await db.query(
      `SELECT 
        pa.id,
        pa.permanent_admission_number,
        pa.temporary_admission_id,
        ta.temporary_admission_number,
        pa.student_id,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.date_of_birth,
        s.gender,
        s.photo_url,
        s.aadhaar_number,
        c.name as class_name,
        b.code as board_code,
        COALESCE(st.name, 'General') as stream_name,
        ay.name as academic_year_name,
        pa.admission_fee_amount,
        pa.fee_payment_status,
        pa.enrollment_status,
        pa.created_at,
        p.id as payment_id,
        p.amount as payment_amount,
        p.payment_mode,
        p.payment_status,
        p.utr_reference_number
       FROM permanent_admissions pa
       JOIN students s ON s.id = pa.student_id
       JOIN academic_configurations ac ON ac.id = pa.academic_configuration_id
       JOIN academic_years ay ON ay.id = pa.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams st ON st.id = ac.stream_id
       LEFT JOIN temporary_admissions ta ON ta.id = pa.temporary_admission_id
       LEFT JOIN admission_payments p ON p.permanent_admission_id = pa.id
       WHERE ${where}
       ORDER BY pa.created_at DESC`,
      values
    );
    return res.rows;
  }

  // =========================================================================
  // 5. PAYMENTS & AUDIT (MODULE 11)
  // =========================================================================

  async listPayments(institutionId: string, filters?: { search?: string; paymentMode?: string }) {
    const values: any[] = [institutionId];
    let idx = 2;
    let where = 'p.institution_id = $1';

    if (filters?.search) {
      where += ` AND (p.utr_reference_number ILIKE $${idx} OR s.first_name ILIKE $${idx} OR s.last_name ILIKE $${idx} OR pa.permanent_admission_number ILIKE $${idx})`;
      values.push(`%${filters.search.trim()}%`);
      idx++;
    }
    if (filters?.paymentMode && filters.paymentMode !== 'all') {
      where += ` AND p.payment_mode = $${idx++}`;
      values.push(filters.paymentMode);
    }

    const res = await db.query(
      `SELECT 
        p.id,
        p.permanent_admission_id,
        pa.permanent_admission_number,
        p.student_id,
        (s.first_name || ' ' || s.last_name) as student_name,
        p.amount,
        p.payment_mode,
        p.payment_status,
        p.utr_reference_number,
        p.gateway_reference_id,
        p.payment_date,
        p.payment_time,
        p.upi_provider,
        p.collected_by,
        p.collected_datetime,
        p.notes,
        p.audit_trail,
        p.created_at
       FROM admission_payments p
       JOIN permanent_admissions pa ON pa.id = p.permanent_admission_id
       JOIN students s ON s.id = p.student_id
       WHERE ${where}
       ORDER BY p.created_at DESC`,
      values
    );
    return res.rows;
  }

  async verifyPayment(institutionId: string, paymentId: string, status: 'verified' | 'failed', actorId?: string) {
    return await db.transaction(async (client) => {
      const payRes = await client.query(
        `SELECT * FROM admission_payments WHERE institution_id = $1 AND id = $2`,
        [institutionId, paymentId]
      );
      if (payRes.rows.length === 0) throw new Error('Payment record not found');
      const payment = payRes.rows[0];

      const auditTrail = payment.audit_trail || [];
      auditTrail.push({
        timestamp: new Date().toISOString(),
        actor: actorId || 'system',
        action: `PAYMENT_${status.toUpperCase()}`,
      });

      const updated = await client.query(
        `UPDATE admission_payments 
         SET payment_status = $3, audit_trail = $4, updated_at = now()
         WHERE institution_id = $1 AND id = $2
         RETURNING *`,
        [institutionId, paymentId, status, JSON.stringify(auditTrail)]
      );

      // Update permanent admission fee status
      const newAdmStatus = status === 'verified' ? 'verified' : 'pending';
      await client.query(
        `UPDATE permanent_admissions 
         SET fee_payment_status = $3, updated_at = now() 
         WHERE institution_id = $1 AND id = $2`,
        [institutionId, payment.permanent_admission_id, newAdmStatus]
      );

      return updated.rows[0];
    });
  }

  // =========================================================================
  // 6. SUPPORTING DOCUMENTS (MODULE 10)
  // =========================================================================

  async listDocuments(institutionId: string, studentId?: string) {
    const values: any[] = [institutionId];
    let where = 'd.institution_id = $1';

    if (studentId) {
      where += ' AND d.student_id = $2';
      values.push(studentId);
    }

    const res = await db.query(
      `SELECT 
        d.id,
        d.institution_id,
        d.student_id,
        (s.first_name || ' ' || s.last_name) as student_name,
        s.admission_number,
        d.document_type,
        d.document_name,
        d.file_storage_key,
        d.file_url,
        d.file_size,
        d.file_mime,
        d.aadhaar_last4,
        d.verification_status,
        d.uploaded_by,
        d.verified_by,
        d.verified_at,
        d.audit_trail,
        d.created_at
       FROM student_supporting_documents d
       JOIN students s ON s.id = d.student_id
       WHERE ${where}
       ORDER BY d.created_at DESC`,
      values
    );
    return res.rows;
  }

  async uploadDocument(institutionId: string, data: {
    studentId: string;
    documentType: string;
    documentName: string;
    fileStorageKey?: string;
    fileUrl?: string;
    fileSize?: number;
    fileMime?: string;
    aadhaarNumber?: string;
  }, actorId?: string) {
    // Privacy Safeguard: Mask Aadhaar - store only last 4 digits
    let aadhaarLast4: string | null = null;
    if (data.aadhaarNumber) {
      const clean = data.aadhaarNumber.replace(/\D/g, '');
      if (clean.length >= 4) {
        aadhaarLast4 = clean.slice(-4);
      }
    }

    const auditTrail = [{
      timestamp: new Date().toISOString(),
      actor: actorId || 'system',
      action: 'DOCUMENT_UPLOADED',
      type: data.documentType,
    }];

    const res = await db.query(
      `INSERT INTO student_supporting_documents (
        institution_id, student_id, document_type, document_name, file_storage_key,
        file_url, file_size, file_mime, aadhaar_last4, verification_status,
        uploaded_by, audit_trail
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11)
       RETURNING *`,
      [
        institutionId,
        data.studentId,
        data.documentType,
        data.documentName,
        data.fileStorageKey || null,
        data.fileUrl || null,
        data.fileSize || 0,
        data.fileMime || null,
        aadhaarLast4,
        actorId || null,
        JSON.stringify(auditTrail),
      ]
    );
    return res.rows[0];
  }

  async verifyDocument(institutionId: string, documentId: string, status: 'verified' | 'rejected', actorId?: string) {
    const docRes = await db.query(
      `SELECT * FROM student_supporting_documents WHERE institution_id = $1 AND id = $2`,
      [institutionId, documentId]
    );
    if (docRes.rows.length === 0) throw new Error('Document not found');
    const doc = docRes.rows[0];

    const auditTrail = doc.audit_trail || [];
    auditTrail.push({
      timestamp: new Date().toISOString(),
      actor: actorId || 'system',
      action: `DOCUMENT_${status.toUpperCase()}`,
    });

    const res = await db.query(
      `UPDATE student_supporting_documents 
       SET verification_status = $3, verified_by = $4, verified_at = now(), audit_trail = $5, updated_at = now()
       WHERE institution_id = $1 AND id = $2
       RETURNING *`,
      [institutionId, documentId, status, actorId || null, JSON.stringify(auditTrail)]
    );
    return res.rows[0];
  }

  // =========================================================================
  // INSTITUTE SETTINGS / SYSTEM CONFIGURATION (FOUNDATIONAL RULES)
  // =========================================================================

  async getSystemSettings(institutionId: string) {
    // 1. Fetch available grades
    const gradesRes = await db.query(
      `SELECT id, name, sequence_order as sequence
       FROM classes
       WHERE institution_id = $1
       ORDER BY sequence_order ASC`,
      [institutionId]
    );
    const availableGrades = gradesRes.rows;

    // 2. Fetch current settings JSONB from institution
    const instRes = await db.query(
      `SELECT settings FROM institutions WHERE id = $1`,
      [institutionId]
    );
    const instRow = instRes.rows[0];
    const systemConfig = instRow?.settings?.systemConfiguration || {};

    // 3. Fallback / initialize defaults if not yet fully configured
    let admissionInfo = systemConfig.admissionInfo;
    if (!admissionInfo) {
      const examCheck = await db.query(
        `SELECT requires_exam, max_marks, passing_marks 
         FROM admission_configurations 
         WHERE institution_id = $1 
         ORDER BY (requires_exam = true) DESC LIMIT 1`,
        [institutionId]
      );
      if (examCheck.rows.length > 0 && examCheck.rows[0].requires_exam) {
        admissionInfo = {
          hasExamination: true,
          examTotalMarks: Number(examCheck.rows[0].max_marks) || 100,
          passMarks: Number(examCheck.rows[0].passing_marks) || 35,
        };
      } else {
        admissionInfo = {
          hasExamination: false,
          examTotalMarks: 100,
          passMarks: 35,
        };
      }
    }

    let admissionFees = systemConfig.admissionFees;
    if (!admissionFees) {
      const policyRes = await db.query(
        `SELECT id, policy_type, pricing_method, flat_amount
         FROM admission_fee_policies
         WHERE institution_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [institutionId]
      );
      if (policyRes.rows.length > 0) {
        const pol = policyRes.rows[0];
        const isCustom = pol.pricing_method === 'customized';
        let customRates: Array<{ gradeId: string; gradeName: string; amount: number }> = [];
        if (isCustom) {
          const ratesRes = await db.query(
            `SELECT DISTINCT c.id as "gradeId", c.name as "gradeName", r.amount
             FROM admission_fee_custom_rates r
             JOIN academic_configurations ac ON ac.id = r.academic_configuration_id
             JOIN classes c ON c.id = ac.class_id
             WHERE r.institution_id = $1 AND r.policy_id = $2
             ORDER BY c.sequence_order ASC`,
            [institutionId, pol.id]
          );
          customRates = ratesRes.rows.map((row: any) => ({
            gradeId: row.gradeId,
            gradeName: row.gradeName,
            amount: Number(row.amount) || 0,
          }));
        }
        admissionFees = {
          isApplicable: pol.policy_type === 'fee',
          pricingMethod: isCustom ? 'CUSTOM' : 'SAME_FOR_ALL',
          baseAmount: Number(pol.flat_amount) || 5000,
          customGradeFees: customRates,
        };
      } else {
        admissionFees = {
          isApplicable: true,
          pricingMethod: 'SAME_FOR_ALL',
          baseAmount: 5000,
          customGradeFees: [],
        };
      }
    }

    let academicFees = systemConfig.academicFees;
    if (!academicFees) {
      const structRes = await db.query(
        `SELECT DISTINCT c.id as "gradeId", c.name as "gradeName", c.sequence_order, afs.tuition_fee
         FROM academic_fee_structures afs
         JOIN academic_configurations ac ON ac.id = afs.academic_configuration_id
         JOIN classes c ON c.id = ac.class_id
         WHERE afs.institution_id = $1
         ORDER BY c.sequence_order ASC`,
        [institutionId]
      );
      if (structRes.rows.length > 0) {
        const distinctAmounts = new Set(structRes.rows.map((r: any) => Number(r.tuition_fee)));
        if (distinctAmounts.size === 1) {
          academicFees = {
            pricingMethod: 'SAME_FOR_ALL',
            baseAmount: Number(structRes.rows[0].tuition_fee) || 35000,
            customGradeFees: [],
          };
        } else {
          academicFees = {
            pricingMethod: 'CUSTOM',
            baseAmount: null,
            customGradeFees: structRes.rows.map((r: any) => ({
              gradeId: r.gradeId,
              gradeName: r.gradeName,
              amount: Number(r.tuition_fee) || 0,
            })),
          };
        }
      } else {
        academicFees = {
          pricingMethod: 'SAME_FOR_ALL',
          baseAmount: 35000,
          customGradeFees: [],
        };
      }
    }

    let paymentSettings = systemConfig.paymentSettings;
    if (!paymentSettings) {
      paymentSettings = {
        isConfigured: false,
        accountName: '',
        upiId: '',
        qrCodes: [],
      };
    }

    return {
      systemConfiguration: {
        admissionInfo,
        admissionFees,
        academicFees,
        paymentSettings,
      },
      availableGrades,
    };
  }

  async saveSystemSettings(institutionId: string, payload: {
    section?: 'admissionInfo' | 'admissionFees' | 'academicFees' | 'paymentSettings';
    admissionInfo?: any;
    admissionFees?: any;
    academicFees?: any;
    paymentSettings?: any;
  }) {
    // 1. Fetch current settings JSONB
    const instRes = await db.query(
      `SELECT settings FROM institutions WHERE id = $1`,
      [institutionId]
    );
    if (instRes.rows.length === 0) throw new Error('Institution not found');

    const currentSettings = instRes.rows[0].settings || {};
    const systemConfig = currentSettings.systemConfiguration || {};

    // Get active academic year for relational sync
    const yearRes = await db.query(
      `SELECT id FROM academic_years 
       WHERE institution_id = $1 
       ORDER BY (is_current = true) DESC, start_date DESC 
       LIMIT 1`,
      [institutionId]
    );
    const activeYearId = yearRes.rows[0]?.id;

    // --- 2. Process admissionInfo if present or specified ---
    if (payload.section === 'admissionInfo' || payload.admissionInfo) {
      const data = payload.admissionInfo || payload;
      const hasExamination = Boolean(data.hasExamination);
      let examTotalMarks = 100;
      let passMarks = 35;

      if (hasExamination) {
        examTotalMarks = Number(data.examTotalMarks);
        passMarks = Number(data.passMarks);
        if (isNaN(examTotalMarks) || examTotalMarks <= 0) {
          throw new Error('Exam Total Marks must be a positive number');
        }
        if (isNaN(passMarks) || passMarks <= 0) {
          throw new Error('Pass Marks must be a positive number');
        }
        if (passMarks > examTotalMarks) {
          throw new Error('Pass Marks cannot be greater than Exam Total Marks');
        }
      }

      systemConfig.admissionInfo = {
        hasExamination,
        examTotalMarks,
        passMarks,
      };

      // Relational sync to admission_configurations
      await db.query(
        `UPDATE admission_configurations
         SET requires_exam = $2,
             max_marks = $3,
             passing_marks = $4,
             cutoff_marks = $4,
             updated_at = now()
         WHERE institution_id = $1`,
        [institutionId, hasExamination, examTotalMarks, passMarks]
      );
    }

    // --- 3. Process admissionFees if present or specified ---
    if (payload.section === 'admissionFees' || payload.admissionFees) {
      const data = payload.admissionFees || payload;
      const isApplicable = Boolean(data.isApplicable);
      const pricingMethod = data.pricingMethod === 'CUSTOM' ? 'CUSTOM' : 'SAME_FOR_ALL';
      let baseAmount = null;
      let customGradeFees: Array<{ gradeId: string; gradeName: string; amount: number }> = [];

      if (isApplicable) {
        if (pricingMethod === 'SAME_FOR_ALL') {
          baseAmount = Number(data.baseAmount || 0);
          if (isNaN(baseAmount) || baseAmount < 0) {
            throw new Error('Admission Fee Amount must be a valid non-negative number');
          }
        } else {
          if (!Array.isArray(data.customGradeFees)) {
            throw new Error('customGradeFees must be an array of grade-based fees');
          }
          customGradeFees = data.customGradeFees.map((item: any) => ({
            gradeId: String(item.gradeId),
            gradeName: String(item.gradeName || ''),
            amount: Math.max(0, Number(item.amount) || 0),
          }));
        }
      }

      systemConfig.admissionFees = {
        isApplicable,
        pricingMethod,
        baseAmount,
        customGradeFees,
      };

      // Relational sync to admission_fee_policies & custom rates
      if (activeYearId) {
        const policyRes = await db.query(
          `INSERT INTO admission_fee_policies (
            institution_id, academic_year_id, policy_type, pricing_method, flat_amount, is_active, updated_at
           ) VALUES ($1, $2, $3, $4, $5, true, now())
           ON CONFLICT (institution_id, academic_year_id) DO UPDATE SET
            policy_type = EXCLUDED.policy_type,
            pricing_method = EXCLUDED.pricing_method,
            flat_amount = EXCLUDED.flat_amount,
            updated_at = now()
           RETURNING id`,
          [
            institutionId,
            activeYearId,
            isApplicable ? 'fee' : 'no_fee',
            pricingMethod === 'CUSTOM' ? 'customized' : 'same_for_all',
            isApplicable && pricingMethod === 'SAME_FOR_ALL' ? (baseAmount || 0) : 0,
          ]
        );
        const policyId = policyRes.rows[0]?.id;

        if (policyId && isApplicable && pricingMethod === 'CUSTOM') {
          for (const item of customGradeFees) {
            const configsRes = await db.query(
              `SELECT id FROM academic_configurations 
               WHERE institution_id = $1 AND academic_year_id = $2 AND class_id = $3`,
              [institutionId, activeYearId, item.gradeId]
            );
            for (const cfg of configsRes.rows) {
              await db.query(
                `INSERT INTO admission_fee_custom_rates (
                  institution_id, policy_id, academic_configuration_id, amount, updated_at
                 ) VALUES ($1, $2, $3, $4, now())
                 ON CONFLICT (institution_id, policy_id, academic_configuration_id) DO UPDATE SET
                  amount = EXCLUDED.amount,
                  updated_at = now()`,
                [institutionId, policyId, cfg.id, item.amount]
              );
            }
          }
        }
      }
    }

    // --- 4. Process academicFees if present or specified ---
    if (payload.section === 'academicFees' || payload.academicFees) {
      const data = payload.academicFees || payload;
      const pricingMethod = data.pricingMethod === 'CUSTOM' ? 'CUSTOM' : 'SAME_FOR_ALL';
      let baseAmount = null;
      let customGradeFees: Array<{ gradeId: string; gradeName: string; amount: number }> = [];

      if (pricingMethod === 'SAME_FOR_ALL') {
        baseAmount = Number(data.baseAmount || 0);
        if (isNaN(baseAmount) || baseAmount < 0) {
          throw new Error('Base Academic Fee Amount must be a valid non-negative number');
        }
      } else {
        if (!Array.isArray(data.customGradeFees)) {
          throw new Error('customGradeFees must be an array of grade-based fees');
        }
        customGradeFees = data.customGradeFees.map((item: any) => ({
          gradeId: String(item.gradeId),
          gradeName: String(item.gradeName || ''),
          amount: Math.max(0, Number(item.amount) || 0),
        }));
      }

      systemConfig.academicFees = {
        pricingMethod,
        baseAmount,
        customGradeFees,
      };

      // Relational sync to academic_fee_structures
      if (activeYearId) {
        if (pricingMethod === 'SAME_FOR_ALL') {
          const allConfigs = await db.query(
            `SELECT id FROM academic_configurations 
             WHERE institution_id = $1 AND academic_year_id = $2`,
            [institutionId, activeYearId]
          );
          for (const cfg of allConfigs.rows) {
            await db.query(
              `INSERT INTO academic_fee_structures (
                institution_id, academic_year_id, academic_configuration_id, tuition_fee, other_fees, total_fee, status, updated_at
               ) VALUES ($1, $2, $3, $4, 0, $4, 'active', now())
               ON CONFLICT (institution_id, academic_year_id, academic_configuration_id) DO UPDATE SET
                tuition_fee = EXCLUDED.tuition_fee,
                total_fee = EXCLUDED.tuition_fee + academic_fee_structures.other_fees,
                updated_at = now()`,
              [institutionId, activeYearId, cfg.id, baseAmount || 0]
            );
          }
        } else {
          for (const item of customGradeFees) {
            const gradeConfigs = await db.query(
              `SELECT id FROM academic_configurations 
               WHERE institution_id = $1 AND academic_year_id = $2 AND class_id = $3`,
              [institutionId, activeYearId, item.gradeId]
            );
            for (const cfg of gradeConfigs.rows) {
              await db.query(
                `INSERT INTO academic_fee_structures (
                  institution_id, academic_year_id, academic_configuration_id, tuition_fee, other_fees, total_fee, status, updated_at
                 ) VALUES ($1, $2, $3, $4, 0, $4, 'active', now())
                 ON CONFLICT (institution_id, academic_year_id, academic_configuration_id) DO UPDATE SET
                  tuition_fee = EXCLUDED.tuition_fee,
                  total_fee = EXCLUDED.tuition_fee + academic_fee_structures.other_fees,
                  updated_at = now()`,
                [institutionId, activeYearId, cfg.id, item.amount]
              );
            }
          }
        }
      }
    }

    // --- 5. Process paymentSettings if present or specified ---
    if (payload.section === 'paymentSettings' || payload.paymentSettings) {
      const data = payload.paymentSettings || payload;
      const qrCodes = Array.isArray(data.qrCodes)
        ? data.qrCodes.map((qr: any, idx: number) => ({
            id: qr.id || `qr_${Date.now()}_${idx}`,
            provider: qr.provider || 'Unified UPI',
            upiId: qr.upiId || data.upiId || '',
            qrImageUrl: qr.qrImageUrl || '',
            isDefault: Boolean(qr.isDefault),
          }))
        : [];

      systemConfig.paymentSettings = {
        isConfigured: qrCodes.length > 0 && Boolean(data.isConfigured !== false),
        accountName: data.accountName || '',
        upiId: data.upiId || '',
        qrCodes,
        updatedAt: new Date().toISOString(),
      };
    }

    // 6. Update settings JSONB in database
    currentSettings.systemConfiguration = systemConfig;
    await db.query(
      `UPDATE institutions 
       SET settings = $2::jsonb, updated_at = now() 
       WHERE id = $1`,
      [institutionId, JSON.stringify(currentSettings)]
    );

    return systemConfig;
  }
}

export const admissionControlRepository = new AdmissionControlRepository();
