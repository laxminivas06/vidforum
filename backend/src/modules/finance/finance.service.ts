import { financeRepository } from './finance.repository';
import { AuditDispatcher } from '../../common/audit-dispatcher';

export class FinanceService {
  // Categories & Groups
  async listFeeCategories(institutionId: string) {
    return financeRepository.listFeeCategories(institutionId);
  }

  async createFeeCategory(institutionId: string, name: string) {
    if (!name || !name.trim()) throw new Error('Category name is required');
    return financeRepository.createFeeCategory(institutionId, name);
  }

  async listFeeGroups(institutionId: string) {
    return financeRepository.listFeeGroups(institutionId);
  }

  async createFeeGroup(institutionId: string, name: string) {
    if (!name || !name.trim()) throw new Error('Fee group name is required');
    return financeRepository.createFeeGroup(institutionId, name);
  }

  // Structures
  async listFeeStructures(institutionId: string, filters?: { academicYearId?: string; classId?: string; feeGroupId?: string }) {
    return financeRepository.listFeeStructures(institutionId, filters);
  }

  async getFeeStructure(institutionId: string, id: string) {
    return financeRepository.getFeeStructureById(institutionId, id);
  }

  async createFeeStructure(institutionId: string, data: {
    name: string;
    feeGroupId: string;
    academicYearId: string;
    classId?: string | null;
    items: Array<{ feeCategoryId: string; amount: number }>;
  }, actorId: string) {
    if (!data.name || !data.feeGroupId || !data.academicYearId) {
      throw new Error('Name, feeGroupId, and academicYearId are required');
    }
    if (!data.items || data.items.length === 0) {
      throw new Error('At least one fee component item is required in a fee structure');
    }

    const structure = await financeRepository.createFeeStructure(institutionId, data);

    await AuditDispatcher.dispatch({
      actorId,
      action: 'finance.fee_structure_created',
      resource: 'fee_structures',
      resourceId: structure.id,
      institutionId,
      newValue: { name: structure.name, totalAmount: structure.totalAmount },
    });

    return structure;
  }

  // Discounts & Scholarships
  async listDiscounts(institutionId: string) {
    return financeRepository.listDiscounts(institutionId);
  }

  async createDiscount(institutionId: string, data: { name: string; discountType: string; value: number }) {
    if (!data.name || data.value === undefined) throw new Error('Discount name and value are required');
    return financeRepository.createDiscount(institutionId, data);
  }

  async listScholarships(institutionId: string) {
    return financeRepository.listScholarships(institutionId);
  }

  async createScholarship(institutionId: string, data: { name: string; sponsor?: string; value: number }) {
    if (!data.name || data.value === undefined) throw new Error('Scholarship name and value are required');
    return financeRepository.createScholarship(institutionId, data);
  }

  // Student Fee Assignment
  async assignFeeToStudent(institutionId: string, data: {
    studentId: string;
    feeStructureId: string;
    academicYearId: string;
    discountId?: string | null;
    scholarshipId?: string | null;
    approvedBy?: string | null;
    dueDate?: string | null;
  }, actorId: string) {
    if (!data.studentId || !data.feeStructureId || !data.academicYearId) {
      throw new Error('studentId, feeStructureId, and academicYearId are required');
    }

    const result = await financeRepository.assignFeeToStudent(institutionId, data);

    await AuditDispatcher.dispatch({
      actorId,
      action: 'finance.fee_assigned',
      resource: 'student_fees',
      resourceId: result.studentFee.id,
      institutionId,
      newValue: {
        studentId: data.studentId,
        invoiceNumber: result.invoice.invoiceNumber,
        netAmount: result.netAmount,
      },
    });

    return result;
  }

  async listStudentFees(institutionId: string, filters?: { studentId?: string; academicYearId?: string; classId?: string; sectionId?: string; status?: string }) {
    return financeRepository.listStudentFees(institutionId, filters);
  }

  async getStudentFeeLedger(institutionId: string, studentId: string) {
    return financeRepository.getStudentFeeLedger(institutionId, studentId);
  }

  // Invoices
  async listInvoices(institutionId: string, filters?: { studentId?: string; status?: string; studentFeeId?: string }) {
    return financeRepository.listInvoices(institutionId, filters);
  }

  async getInvoice(institutionId: string, id: string) {
    return financeRepository.getInvoiceById(institutionId, id);
  }

  // Payments & Receipts
  async processPayment(institutionId: string, data: {
    invoiceId: string;
    studentId: string;
    amount: number;
    method: string;
    receivedBy?: string | null;
    receiptNumber?: string;
  }, actorId: string) {
    if (!data.invoiceId || !data.studentId || !data.amount) {
      throw new Error('invoiceId, studentId, and amount are required');
    }

    const payment = await financeRepository.recordPayment(institutionId, data);

    await AuditDispatcher.dispatch({
      actorId,
      action: 'finance.payment_collected',
      resource: 'payments',
      resourceId: payment.id,
      institutionId,
      newValue: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        receiptNumber: payment.receiptNumber,
        method: data.method,
      },
    });

    return payment;
  }

  async listPayments(institutionId: string, filters?: { studentId?: string; invoiceId?: string; method?: string; status?: string }) {
    return financeRepository.listPayments(institutionId, filters);
  }

  async getReceipt(institutionId: string, paymentId: string) {
    return financeRepository.getReceiptByPaymentId(institutionId, paymentId);
  }

  // Gateway Webhooks (Idempotent per Section 9.10 & Section 18)
  async handleGatewayWebhook(data: {
    gatewayName: string;
    eventId: string;
    eventType: string;
    payload: any;
    institutionId?: string | null;
  }) {
    // 1. Idempotency Check
    const isProcessed = await financeRepository.isWebhookEventProcessed(data.gatewayName, data.eventId);
    if (isProcessed) {
      return {
        acknowledged: true,
        duplicate: true,
        message: `Webhook event ${data.eventId} already processed (idempotent skip)`,
      };
    }

    // 2. Handle Payment Succeeded
    const isSuccess = ['payment.captured', 'payment_intent.succeeded', 'charge.successful'].includes(data.eventType);
    const isFailure = ['payment.failed', 'payment_intent.payment_failed', 'charge.failed'].includes(data.eventType);

    let paymentResult = null;
    if (isSuccess && data.payload?.invoiceId && data.payload?.studentId) {
      paymentResult = await financeRepository.recordPayment(data.institutionId || data.payload.institutionId, {
        invoiceId: data.payload.invoiceId,
        studentId: data.payload.studentId,
        amount: parseFloat(data.payload.amount),
        method: data.payload.method || 'online_gateway',
        receiptNumber: `REC-GW-${data.eventId.slice(-6)}`,
      });
    } else if (isFailure && data.payload?.invoiceId && data.payload?.studentId) {
      paymentResult = await financeRepository.recordFailedGatewayPayment(data.institutionId || data.payload.institutionId, {
        invoiceId: data.payload.invoiceId,
        studentId: data.payload.studentId,
        amount: parseFloat(data.payload.amount),
        method: data.payload.method || 'online_gateway',
        gatewayName: data.gatewayName,
        gatewayReference: data.eventId,
        gatewayResponse: data.payload,
      });
    }

    // 3. Mark webhook as processed
    await financeRepository.recordWebhookEvent(data.institutionId || null, {
      gatewayName: data.gatewayName,
      eventId: data.eventId,
      eventType: data.eventType,
      payload: data.payload,
      status: isSuccess ? 'processed' : (isFailure ? 'failed_payment_recorded' : 'unhandled_event_type'),
    });

    return {
      acknowledged: true,
      duplicate: false,
      result: paymentResult,
    };
  }

  // Refunds
  async processRefund(institutionId: string, data: {
    paymentId: string;
    amount: number;
    reason: string;
    approvedBy?: string | null;
  }, actorId: string) {
    const refund = await financeRepository.processRefund(institutionId, data);

    await AuditDispatcher.dispatch({
      actorId,
      action: 'finance.refund_processed',
      resource: 'refunds',
      resourceId: refund.id,
      institutionId,
      newValue: {
        paymentId: data.paymentId,
        amount: data.amount,
        reason: data.reason,
      },
    });

    return refund;
  }

  // Analytics
  async getCollectionSummary(institutionId: string) {
    return financeRepository.getSummary(institutionId);
  }

  // Scoped Access
  async getScopedFees(institutionId: string, user: { id: string; role: string }) {
    return financeRepository.getScopedFees(institutionId, user);
  }
}

export const financeService = new FinanceService();
