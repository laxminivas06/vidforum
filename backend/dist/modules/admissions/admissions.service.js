"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionsService = exports.AdmissionsService = exports.STAGE_MAP_TO_DB = exports.STAGE_MAP_TO_UI = void 0;
const admissions_repository_1 = require("./admissions.repository");
exports.STAGE_MAP_TO_UI = {
    enquiry: 'INQUIRY',
    application: 'APPLIED',
    document_verification: 'DOCUMENT_VERIFICATION',
    review: 'INTERVIEW',
    approved: 'APPROVED',
    rejected: 'REJECTED',
    waitlisted: 'WAITLISTED',
};
exports.STAGE_MAP_TO_DB = {
    INQUIRY: 'enquiry',
    APPLIED: 'application',
    DOCUMENT_VERIFICATION: 'document_verification',
    INTERVIEW: 'review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    WAITLISTED: 'waitlisted',
};
class AdmissionsService {
    async getApplicants(institutionId) {
        const rawApplicants = await admissions_repository_1.admissionsRepository.findApplicantsByInstitution(institutionId);
        return rawApplicants.map((row, idx) => ({
            id: row.id,
            applicationNumber: `APP-2026-089${idx + 1}`,
            studentName: row.applicant_name,
            gradeApplying: row.grade_applying || 'Grade 10',
            parentName: row.guardian_name || 'Parent',
            parentPhone: row.guardian_phone || '+91 98000 00000',
            parentEmail: row.guardian_email || 'parent@example.com',
            stage: exports.STAGE_MAP_TO_UI[row.stage] || 'INQUIRY',
            documentsSubmitted: row.documents_submitted || [],
            feePaid: true,
            feeAmount: 2500,
            appliedDate: row.applied_date ? new Date(row.applied_date).toISOString().split('T')[0] : '2026-09-15',
            entranceScore: 90,
        }));
    }
    async updateStage(applicationId, stage) {
        const dbStage = exports.STAGE_MAP_TO_DB[stage] || stage.toLowerCase();
        const updated = await admissions_repository_1.admissionsRepository.updateApplicationStage(applicationId, dbStage);
        if (!updated) {
            throw new Error('Application not found');
        }
        return updated;
    }
    async approveApplication(applicationId, institutionId) {
        const app = await admissions_repository_1.admissionsRepository.findApplicationById(applicationId, institutionId);
        if (!app) {
            throw new Error('Application not found');
        }
        const sectionId = await admissions_repository_1.admissionsRepository.findDefaultSection(app.applying_for_class_id);
        if (!sectionId) {
            throw new Error('No section found for this class');
        }
        const currentCount = await admissions_repository_1.admissionsRepository.countStudents(institutionId);
        const nextNum = currentCount + 1;
        const admissionNumber = `SIA-2026-${String(nextNum).padStart(3, '0')}`;
        const names = app.applicant_name.trim().split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || 'Student';
        const student = await admissions_repository_1.admissionsRepository.executeApprovalTransaction(applicationId, institutionId, {
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
exports.AdmissionsService = AdmissionsService;
exports.admissionsService = new AdmissionsService();
