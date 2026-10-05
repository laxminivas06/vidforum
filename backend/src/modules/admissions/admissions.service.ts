import { admissionsRepository } from './admissions.repository';
import { db } from '../../config/database';

export const STAGE_MAP_TO_UI: Record<string, string> = {
  enquiry: 'INQUIRY', application: 'APPLIED',
  document_verification: 'DOCUMENT_VERIFICATION', review: 'INTERVIEW',
  approved: 'APPROVED', rejected: 'REJECTED', waitlisted: 'WAITLISTED', enrolled: 'ENROLLED',
};

export const STAGE_MAP_TO_DB: Record<string, string> = {
  INQUIRY: 'enquiry', APPLIED: 'application',
  DOCUMENT_VERIFICATION: 'document_verification', INTERVIEW: 'review',
  APPROVED: 'approved', REJECTED: 'rejected', WAITLISTED: 'waitlisted', ENROLLED: 'enrolled',
};

export class AdmissionsService {
  // Enquiries
  async getEnquiries(institutionId: string, filters: { search?: string; status?: string } = {}) {
    return admissionsRepository.findEnquiries(institutionId, filters);
  }

  async createEnquiry(institutionId: string, data: Parameters<typeof admissionsRepository.createEnquiry>[1]) {
    return admissionsRepository.createEnquiry(institutionId, data);
  }

  async convertToApplication(enquiryId: string, institutionId: string, classId: string, academicYearId: string) {
    const app = await admissionsRepository.convertEnquiryToApplication(enquiryId, institutionId, classId, academicYearId);
    return app;
  }

  // Applications / Pipeline
  async getApplicants(institutionId: string, filters: { search?: string; stage?: string; classId?: string } = {}) {
    const rawApplicants = await admissionsRepository.findApplicantsByInstitution(institutionId, filters);
    return rawApplicants.map((row, idx) => ({
      id: row.id,
      applicationNumber: `APP-${new Date().getFullYear()}-${String(idx + 1).padStart(4, '0')}`,
      studentName: row.applicant_name,
      gradeApplying: row.grade_applying || 'N/A',
      classId: row.applying_for_class_id || '',
      academicYearId: row.academic_year_id || '',
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : '',
      gender: row.gender || '',
      parentName: row.guardian_name || 'N/A',
      parentPhone: row.guardian_phone || '',
      parentEmail: row.guardian_email || '',
      stage: STAGE_MAP_TO_UI[row.stage] || 'INQUIRY',
      documentsSubmitted: row.documents_submitted || [],
      appliedDate: row.applied_date ? new Date(row.applied_date).toISOString().split('T')[0] : '',
      entranceScore: row.entrance_score,
      interviewDate: row.interview_date,
      notes: row.notes,
      feeAmount: Number(row.fee_amount || 0),
      feePaid: row.fee_status === 'paid' || row.fee_status === 'PAID',
      feeStatus: row.fee_status || 'unpaid',
    }));
  }

  async getApplicationById(applicationId: string, institutionId: string) {
    const app = await admissionsRepository.findApplicationById(applicationId, institutionId);
    if (!app) throw new Error('Application not found');
    return app;
  }

  async createApplication(institutionId: string, data: Parameters<typeof admissionsRepository.createApplication>[1]) {
    return admissionsRepository.createApplication(institutionId, data);
  }

  async bulkImport(institutionId: string, rows: any[], defaultAcademicYearId?: string, actorId?: string) {
    const report = await admissionsRepository.bulkInsertApplicants(institutionId, rows, defaultAcademicYearId, actorId);
    for (let i = 0; i < report.results.length; i++) {
      const res = report.results[i];
      const r = rows[i];
      if (res && res.success && res.id && (r.stage === 'enrolled' || r.directEnroll === true || r.isDirectEnroll === true)) {
        try {
          await this.approveApplication(res.id, institutionId, actorId);
        } catch (err: any) {
          console.warn(`Direct enroll error for row ${i + 1}:`, err.message);
        }
      }
    }
    return report;
  }

  async updateStage(applicationId: string, stage: string, actorId?: string) {
    const dbStage = STAGE_MAP_TO_DB[stage] || stage.toLowerCase().replace(' ', '_');
    const updated = await admissionsRepository.updateApplicationStage(applicationId, dbStage, actorId);
    if (!updated) throw new Error('Application not found');
    return updated;
  }

  async approveApplication(applicationId: string, institutionId: string, actorId?: string) {
    const app = await admissionsRepository.findApplicationById(applicationId, institutionId);
    if (!app) throw new Error('Application not found');

    let classId = app.applying_for_class_id;
    if (!classId) {
      const defaultC = await db.query(
        'SELECT id FROM classes WHERE institution_id = $1 ORDER BY sequence_order ASC, name ASC LIMIT 1',
        [institutionId]
      );
      classId = defaultC.rows[0]?.id;
      if (classId) {
        await db.query('UPDATE applications SET applying_for_class_id = $1 WHERE id = $2', [classId, applicationId]);
        app.applying_for_class_id = classId;
      }
    }

    const sectionId = await admissionsRepository.findDefaultSection(classId);
    if (!sectionId) throw new Error('No classroom section could be assigned for this grade/class');

    const count = await admissionsRepository.countStudents(institutionId);
    const year = new Date().getFullYear();
    let admissionNumber = `SIA-${year}-${String(count + 1).padStart(4, '0')}`;
    let suffix = count + 1;
    while (await admissionsRepository.existsAdmissionNumber(institutionId, admissionNumber)) {
      suffix++;
      admissionNumber = `SIA-${year}-${String(suffix).padStart(4, '0')}`;
    }
    const names = (app.applicant_name || 'New Student').trim().split(' ');

    const student = await admissionsRepository.executeApprovalTransaction(applicationId, institutionId, {
      sectionId,
      admissionNumber,
      firstName: names[0] || 'Student',
      lastName: names.slice(1).join(' ') || 'Enrolled',
      rollNumber: `${count + 1}`,
      actorId,
    });

    return { student, admissionNumber, message: 'Student admitted and master profile initialized successfully' };
  }

  async getPipelineStats(institutionId: string) {
    return admissionsRepository.getPipelineStats(institutionId);
  }

  async getAdmissionDocuments(institutionId: string, filters: { status?: string; search?: string } = {}) {
    return admissionsRepository.getAdmissionDocuments(institutionId, filters);
  }

  async updateDocumentStatus(documentId: string, institutionId: string, status: string, actorId?: string) {
    return admissionsRepository.updateDocumentStatus(documentId, institutionId, status, actorId);
  }

  async addAdmissionDocument(institutionId: string, applicationId: string, data: { documentType: string; storageKey?: string; status?: string }) {
    return admissionsRepository.addAdmissionDocument(institutionId, applicationId, data.documentType, data.storageKey, data.status);
  }

  async getEnrolledStudents(institutionId: string, filters: { search?: string; classId?: string } = {}) {
    return admissionsRepository.getEnrolledStudents(institutionId, filters);
  }
}

export const admissionsService = new AdmissionsService();
