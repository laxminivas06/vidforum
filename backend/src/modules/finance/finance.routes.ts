import { Router } from 'express';
import { financeController } from './finance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// ================= GATEWAY WEBHOOK (Public endpoint with signature/idempotency) =================
router.post('/webhooks/:gateway', financeController.handleGatewayWebhook.bind(financeController));
router.post('/webhook', financeController.handleGatewayWebhook.bind(financeController));

// All subsequent finance routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// ================= SUMMARY & SCOPED ACCESS =================
router.get('/summary', financeController.getSummary.bind(financeController));
router.get('/my-fees', financeController.getScopedFees.bind(financeController));
router.get('/records', financeController.listStudentFees.bind(financeController)); // UI legacy mapping

// ================= FEE CATEGORIES & GROUPS =================
router.get('/categories', financeController.listFeeCategories.bind(financeController));
router.post('/categories', financeController.createFeeCategory.bind(financeController));
router.get('/groups', financeController.listFeeGroups.bind(financeController));
router.post('/groups', financeController.createFeeGroup.bind(financeController));

// ================= FEE STRUCTURES =================
router.get('/structures', financeController.listFeeStructures.bind(financeController));
router.post('/structures', financeController.createFeeStructure.bind(financeController));
router.get('/structures/:id', financeController.getFeeStructure.bind(financeController));

// ================= DISCOUNTS & SCHOLARSHIPS =================
router.get('/discounts', financeController.listDiscounts.bind(financeController));
router.post('/discounts', financeController.createDiscount.bind(financeController));
router.get('/scholarships', financeController.listScholarships.bind(financeController));
router.post('/scholarships', financeController.createScholarship.bind(financeController));

// ================= STUDENT FEES & INVOICING =================
router.post('/assign', financeController.assignFeeToStudent.bind(financeController));
router.get('/student-fees', financeController.listStudentFees.bind(financeController));
router.get('/students/:studentId/ledger', financeController.getStudentFeeLedger.bind(financeController));

// ================= INVOICES =================
router.get('/invoices', financeController.listInvoices.bind(financeController));
router.get('/invoices/:id', financeController.getInvoice.bind(financeController));

// ================= PAYMENTS & RECEIPTS =================
router.get('/payments', financeController.listPayments.bind(financeController));
router.post('/payments', financeController.recordPayment.bind(financeController));
router.get('/payments/:paymentId/receipt', financeController.getReceipt.bind(financeController));

// ================= REFUNDS =================
router.post('/refunds', financeController.processRefund.bind(financeController));

export default router;
