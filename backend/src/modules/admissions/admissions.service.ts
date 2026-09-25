import { admissionsRepository } from './admissions.repository';

export const STAGE_MAP_TO_UI: Record<string, string> = {
  enquiry: 'INQUIRY',
  application: 'APPLIED',
  document_verification: 'DOCUMENT_VERIFICATION',
  review: 'INTERVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  waitlisted: 'WAITLISTED',
};

export const STAGE_MAP_TO_DB: Record<string, string> = {
  INQUIRY: 'enquiry',
  APPLIED: 'application',
  DOCUMENT_VERIFICATION: 'document_verification',
  INTERVIEW: 'review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
};

export class AdmissionsService {
  async getApplicants(institutionId: string) {
    const rawApplicants = await admissionsRepository.findApplicantsByInstitution(institutionId);

    return rawApplicants.map((row, idx) => ({
      id: row.id,
      applicationNumber: `APP-2026-089${idx + 1}`,
      studentName: row.applicant_name,
      gradeApplying: row.grade_applying || 'Grade 10',
      parentName: row.guardian_name || 'Parent',
      parentPhone: row.guardian_phone || '+91 98000 00000',
      parentEmail: row.guardian_email || 'parent@example.com',
      stage: STAGE_MAP_TO_UI[row.stage] || 'INQUIRY',
      documentsSubmitted: row.documents_submitted || [],
      feePaid: true,
      feeAmount: 2500,
      appliedDate: row.applied_date ? new Date(row.applied_date).toISOString().split('T')[0] : '2026-09-15',
      entranceScore: 90,
    }));
  }

  async updateStage(applicationId: string, stage: string) {
    const dbStage = STAGE_MAP_TO_DB[stage] || stage.toLowerCase();
    const updated = await admissionsRepository.updateApplicationStage(applicationId, dbStage);
    if (!updated) {
      throw new Error('Application not found');
    }
    return updated;
  }

  async approveApplication(applicationId: string, institutionId: string) {
    const app = await admissionsRepository.findApplicationById(applicationId, institutionId);
    if (!app) {
      throw new Error('Application not found');
    }

    const sectionId = await admissionsRepository.findDefaultSection(app.applying_for_class_id);
    if (!sectionId) {
      throw new Error('No section found for this class');
    }

    const currentCount = await admissionsRepository.countStudents(institutionId);
    const nextNum = currentCount + 1;
    const admissionNumber = `SIA-2026-${String(nextNum).padStart(3, '0')}`;

    const names = app.applicant_name.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Student';

    const student = await admissionsRepository.executeApprovalTransaction(applicationId, institutionId, {
      sectionId,
      admissionNumber,
      firstName,
      lastName,
      rollNumber: `10A-${String(nextNum).padStart(2, '0')}`,
    });

    return {
      student,
      admissionNumber,
      message: 'Student admitted and master profile initialized successfully',
    };
  }
}

export const admissionsService = new AdmissionsService();
