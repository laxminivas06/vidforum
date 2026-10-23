import { Router } from 'express';
import { admissionsController } from './admissions.controller';
import { admissionControlController } from './admission-control.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Enquiries
router.get('/enquiries',                  tenantMiddleware, admissionsController.getEnquiries.bind(admissionsController));
router.post('/enquiries',                 tenantMiddleware, admissionsController.createEnquiry.bind(admissionsController));
router.post('/enquiries/:id/convert',     tenantMiddleware, admissionsController.convertEnquiry.bind(admissionsController));

// Pipeline stats
router.get('/pipeline/stats',             tenantMiddleware, admissionsController.getPipelineStats.bind(admissionsController));

// Applications
router.post('/applications',              tenantMiddleware, admissionsController.createApplication.bind(admissionsController));
router.get('/applications/:id',           tenantMiddleware, admissionsController.getApplicationById.bind(admissionsController));

// Applicants (pipeline view)
router.get('/applicants',                 tenantMiddleware, admissionsController.getApplicants.bind(admissionsController));
router.get('/applicants/:id',             tenantMiddleware, admissionsController.getApplicationById.bind(admissionsController));
router.patch('/applicants/:id/stage',     tenantMiddleware, admissionsController.updateStage.bind(admissionsController));
router.post('/applicants/bulk',            tenantMiddleware, admissionsController.bulkImport.bind(admissionsController));
router.post('/applications/bulk',          tenantMiddleware, admissionsController.bulkImport.bind(admissionsController));
router.post('/applicants/:id/approve',    tenantMiddleware, admissionsController.approve.bind(admissionsController));

// Documents
router.get('/documents',                  tenantMiddleware, admissionsController.getDocuments.bind(admissionsController));
router.patch('/documents/:id/status',     tenantMiddleware, admissionsController.updateDocumentStatus.bind(admissionsController));
router.post('/applications/:id/documents',tenantMiddleware, admissionsController.addDocument.bind(admissionsController));

// Enrolled Students
router.get('/enrolled',                   tenantMiddleware, admissionsController.getEnrolled.bind(admissionsController));

// =========================================================================
// ADMISSION CONFIGURATION & EXAM RULES (MODULE 3)
// =========================================================================
router.get('/configurations',             tenantMiddleware, admissionControlController.getAdmissionConfigurations.bind(admissionControlController));
router.post('/configurations',            tenantMiddleware, admissionControlController.saveAdmissionConfiguration.bind(admissionControlController));

// =========================================================================
// ADMISSION FEES (MODULE 4)
// =========================================================================
router.get('/fees/policy',                tenantMiddleware, admissionControlController.getFeePolicy.bind(admissionControlController));
router.post('/fees/policy',               tenantMiddleware, admissionControlController.saveFeePolicy.bind(admissionControlController));
router.get('/fees/custom-rates',          tenantMiddleware, admissionControlController.getCustomFeeRates.bind(admissionControlController));
router.post('/fees/custom-rates',         tenantMiddleware, admissionControlController.saveCustomFeeRates.bind(admissionControlController));
router.get('/fees/calculate',             tenantMiddleware, admissionControlController.calculateFee.bind(admissionControlController));

// =========================================================================
// TEMPORARY ADMISSIONS & EXAM RESULTS (MODULE 6, 7, 8)
// =========================================================================
router.get('/temporary',                  tenantMiddleware, admissionControlController.getTemporaryAdmissions.bind(admissionControlController));
router.post('/temporary',                 tenantMiddleware, admissionControlController.createTemporaryAdmission.bind(admissionControlController));
router.get('/temporary/:id',              tenantMiddleware, admissionControlController.getTemporaryAdmissionById.bind(admissionControlController));
router.post('/temporary/:id/result',       tenantMiddleware, admissionControlController.recordExamResult.bind(admissionControlController));
router.post('/temporary/bulk-marks',       tenantMiddleware, admissionControlController.bulkRecordExamResults.bind(admissionControlController));
router.post('/temporary/:id/review',       tenantMiddleware, admissionControlController.reviewExamResult.bind(admissionControlController));

// =========================================================================
// PERMANENT ADMISSION WORKFLOW (MODULE 9, 11, 12)
// =========================================================================
router.get('/permanent/next-number',      tenantMiddleware, admissionControlController.getNextPermanentAdmissionNumber.bind(admissionControlController));
router.post('/permanent/complete',        tenantMiddleware, admissionControlController.completePermanentAdmission.bind(admissionControlController));
router.get('/permanent',                 tenantMiddleware, admissionControlController.listPermanentAdmissions.bind(admissionControlController));

// =========================================================================
// PAYMENTS & AUDIT TRAIL (MODULE 11)
// =========================================================================
router.get('/payments',                   tenantMiddleware, admissionControlController.listPayments.bind(admissionControlController));
router.patch('/payments/:id/verify',      tenantMiddleware, admissionControlController.verifyPayment.bind(admissionControlController));

// =========================================================================
// SUPPORTING DOCUMENTS (MODULE 10)
// =========================================================================
router.get('/supporting-documents',       tenantMiddleware, admissionControlController.listDocuments.bind(admissionControlController));
router.post('/supporting-documents',      tenantMiddleware, admissionControlController.uploadDocument.bind(admissionControlController));
router.patch('/supporting-documents/:id/verify', tenantMiddleware, admissionControlController.verifyDocument.bind(admissionControlController));

// =========================================================================
// INSTITUTE SETTINGS / SYSTEM CONFIGURATION (FOUNDATIONAL RULES)
// =========================================================================
router.get('/system-settings',             tenantMiddleware, admissionControlController.getSystemSettings.bind(admissionControlController));
router.post('/system-settings',            tenantMiddleware, admissionControlController.saveSystemSettings.bind(admissionControlController));

export default router;
