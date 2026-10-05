import { Router } from 'express';
import { admissionsController } from './admissions.controller';
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

export default router;
