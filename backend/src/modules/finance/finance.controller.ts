import { Request, Response } from 'express';
import { financeService } from './finance.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class FinanceController {
  // ================= CATEGORIES & GROUPS =================
  async listFeeCategories(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const categories = await financeService.listFeeCategories(instId);
      sendSuccess(res, categories, 'Fee categories retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createFeeCategory(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name } = req.body;
      const category = await financeService.createFeeCategory(instId, name);
      sendSuccess(res, category, 'Fee category created', 201);
    } catch (error: any) {
      if (error.code === '23505') {
        sendError(res, 'Fee category with this name already exists', 409, 'DUPLICATE_ENTITY');
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  async listFeeGroups(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const groups = await financeService.listFeeGroups(instId);
      sendSuccess(res, groups, 'Fee groups retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createFeeGroup(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name } = req.body;
      const group = await financeService.createFeeGroup(instId, name);
      sendSuccess(res, group, 'Fee group created', 201);
    } catch (error: any) {
      if (error.code === '23505') {
        sendError(res, 'Fee group with this name already exists', 409, 'DUPLICATE_ENTITY');
        return;
      }
      sendError(res, error.message, 400);
    }
  }

  // ================= FEE STRUCTURES =================
  async listFeeStructures(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { academicYearId, classId, feeGroupId } = req.query;
      const structures = await financeService.listFeeStructures(instId, {
        academicYearId: academicYearId as string,
        classId: classId as string,
        feeGroupId: feeGroupId as string,
      });
      sendSuccess(res, structures, 'Fee structures retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getFeeStructure(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const structure = await financeService.getFeeStructure(instId, id);
      if (!structure) {
        sendError(res, 'Fee structure not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, structure, 'Fee structure retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createFeeStructure(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const structure = await financeService.createFeeStructure(instId, req.body, actorId);
      sendSuccess(res, structure, 'Fee structure created', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ================= DISCOUNTS & SCHOLARSHIPS =================
  async listDiscounts(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const discounts = await financeService.listDiscounts(instId);
      sendSuccess(res, discounts, 'Discounts retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createDiscount(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const discount = await financeService.createDiscount(instId, req.body);
      sendSuccess(res, discount, 'Discount created', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async listScholarships(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const scholarships = await financeService.listScholarships(instId);
      sendSuccess(res, scholarships, 'Scholarships retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async createScholarship(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const scholarship = await financeService.createScholarship(instId, req.body);
      sendSuccess(res, scholarship, 'Scholarship created', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ================= STUDENT FEES ASSIGNMENT & LEDGER =================
  async assignFeeToStudent(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const result = await financeService.assignFeeToStudent(instId, req.body, actorId);
      sendSuccess(res, result, 'Fee assigned to student successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async listStudentFees(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { studentId, academicYearId, classId, sectionId, status } = req.query;
      const fees = await financeService.listStudentFees(instId, {
        studentId: studentId as string,
        academicYearId: academicYearId as string,
        classId: classId as string,
        sectionId: sectionId as string,
        status: status as string,
      });
      sendSuccess(res, fees, 'Student fee records retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getStudentFeeLedger(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const studentId = req.params.studentId as string;
      const ledger = await financeService.getStudentFeeLedger(instId, studentId);
      sendSuccess(res, ledger, 'Student fee ledger retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= INVOICES =================
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { studentId, status, studentFeeId } = req.query;
      const invoices = await financeService.listInvoices(instId, {
        studentId: studentId as string,
        status: status as string,
        studentFeeId: studentFeeId as string,
      });
      sendSuccess(res, invoices, 'Invoices retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const invoice = await financeService.getInvoice(instId, id);
      if (!invoice) {
        sendError(res, 'Invoice not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, invoice, 'Invoice retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= PAYMENTS & RECEIPTS =================
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const { invoiceId, studentId, amount, method, receiptNumber } = req.body;

      const payment = await financeService.processPayment(
        instId,
        {
          invoiceId,
          studentId,
          amount: parseFloat(amount),
          method: method || 'cash',
          receivedBy: actorId,
          receiptNumber,
        },
        actorId
      );

      sendSuccess(res, payment, 'Payment collected and receipt generated successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async listPayments(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { studentId, invoiceId, method, status } = req.query;
      const payments = await financeService.listPayments(instId, {
        studentId: studentId as string,
        invoiceId: invoiceId as string,
        method: method as string,
        status: status as string,
      });
      sendSuccess(res, payments, 'Payments retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getReceipt(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const paymentId = req.params.paymentId as string;
      const receipt = await financeService.getReceipt(instId, paymentId);
      if (!receipt) {
        sendError(res, 'Receipt not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, receipt, 'Receipt retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= GATEWAY WEBHOOK (Idempotent) =================
  async handleGatewayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const gatewayName = (req.params.gateway || req.headers['x-gateway-name'] || 'stripe').toString();
      const eventId = (req.body.id || req.body.eventId || req.headers['x-event-id'])?.toString();
      const eventType = (req.body.type || req.body.event || req.body.eventType)?.toString();

      if (!eventId || !eventType) {
        sendError(res, 'Invalid webhook payload: eventId and eventType are required', 400);
        return;
      }

      const result = await financeService.handleGatewayWebhook({
        gatewayName,
        eventId,
        eventType,
        payload: req.body,
        institutionId: req.institutionId || req.body.institutionId,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  // ================= REFUNDS =================
  async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = req.user?.id || 'system';
      const { paymentId, amount, reason } = req.body;

      const refund = await financeService.processRefund(
        instId,
        {
          paymentId,
          amount: parseFloat(amount),
          reason,
          approvedBy: actorId,
        },
        actorId
      );

      sendSuccess(res, refund, 'Refund processed successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  // ================= SUMMARY & SCOPED ACCESS =================
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const summary = await financeService.getCollectionSummary(instId);
      sendSuccess(res, summary, 'Financial collection summary retrieved');
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }

  async getScopedFees(req: Request, res: Response): Promise<void> {
    try {
      const instId = req.institutionId!;
      const user = req.user!;
      const scopedData = await financeService.getScopedFees(instId, user);
      sendSuccess(res, scopedData, 'Scoped fee data retrieved');
    } catch (error: any) {
      if (error.message.includes('RESOURCE_ACCESS_DENIED')) {
        sendError(res, error.message, 403, 'RESOURCE_ACCESS_DENIED');
        return;
      }
      sendError(res, error.message, 500);
    }
  }
}

export const financeController = new FinanceController();
