import { Router } from 'express';
import { documentsController } from './documents.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Global middleware for documents module
router.use(tenantMiddleware);
router.use(authMiddleware);

// ==========================================
// DOCUMENT TYPES (Catalog)
// ==========================================
router.get('/types', documentsController.listTypes);
router.post('/types', documentsController.createType);

// ==========================================
// DOCUMENT TEMPLATES
// ==========================================
router.get('/templates', documentsController.listTemplates);
router.post('/templates', documentsController.createTemplate);
router.get('/templates/:id', documentsController.getTemplate);
router.put('/templates/:id', documentsController.updateTemplate);
router.delete('/templates/:id', documentsController.deleteTemplate);

// ==========================================
// CERTIFICATE GENERATION ENGINE (QR & Hash)
// ==========================================
router.post('/generate/bonafide', documentsController.generateBonafide);
router.post('/generate/transfer-certificate', documentsController.generateTransferCertificate);

// Backward-compatible alias for existing tests/scripts
router.post('/bonafide', documentsController.generateBonafide);

// ==========================================
// DOCUMENT REQUESTS PIPELINE
// ==========================================
router.get('/requests', documentsController.listRequests);
router.post('/requests', documentsController.createRequest);
router.patch('/requests/:id/status', documentsController.processRequest);

// ==========================================
// DOCUMENT VERIFICATION WORKFLOW
// ==========================================
router.post('/:id/verify', documentsController.verify);
router.get('/:id/verification-history', documentsController.verificationHistory);

// ==========================================
// DOCUMENTS VAULT (Upload, Read, Delete)
// ==========================================
router.post('/', documentsController.upload);
router.post('/upload', documentsController.upload);
router.get('/', documentsController.list);
router.get('/:id', documentsController.getById);
router.delete('/:id', documentsController.delete);

export default router;
