import { Router } from 'express';
import { financeController } from './finance.controller';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/finance/records
router.get(
  '/records',
  tenantMiddleware,
  financeController.getRecords.bind(financeController)
);

// POST /api/v1/finance/payments
router.post(
  '/payments',
  tenantMiddleware,
  financeController.recordPayment.bind(financeController)
);

// GET /api/v1/finance/summary
router.get(
  '/summary',
  tenantMiddleware,
  financeController.getSummary.bind(financeController)
);

export default router;
