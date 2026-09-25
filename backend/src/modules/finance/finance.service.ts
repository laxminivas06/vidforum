import { financeRepository } from './finance.repository';

export class FinanceService {
  async getFeeRecords(institutionId: string) {
    return await financeRepository.findFeeRecordsByInstitution(institutionId);
  }

  async processPayment(
    invoiceId: string,
    studentId: string,
    amount: number,
    method: string,
    receivedBy: string
  ) {
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const paymentId = await financeRepository.recordPayment(
      invoiceId,
      studentId,
      amount,
      method,
      receivedBy,
      receiptNumber
    );

    return {
      paymentId,
      receiptNumber,
      amount,
      status: 'SUCCESS',
      paidAt: new Date().toISOString(),
    };
  }

  async getCollectionSummary(institutionId: string) {
    return await financeRepository.getSummary(institutionId);
  }
}

export const financeService = new FinanceService();
