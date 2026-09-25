import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';
import { sendSuccess } from '../../utils/api-response';

export class FinanceController {
  async getRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const records = await financeService.getFeeRecords(instId);
      sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId, studentId, amount, method = 'upi' } = req.body;
      const receivedBy = req.user?.id || '44444444-4444-4444-4444-444444444401';

      const result = await financeService.processPayment(
        invoiceId,
        studentId,
        amount,
        method,
        receivedBy
      );

      sendSuccess(res, result, 'Payment collected and receipt generated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const summary = await financeService.getCollectionSummary(instId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
