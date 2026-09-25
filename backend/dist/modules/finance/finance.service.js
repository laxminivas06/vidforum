"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeService = exports.FinanceService = void 0;
const finance_repository_1 = require("./finance.repository");
class FinanceService {
    async getFeeRecords(institutionId) {
        return await finance_repository_1.financeRepository.findFeeRecordsByInstitution(institutionId);
    }
    async processPayment(invoiceId, studentId, amount, method, receivedBy) {
        const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
        const paymentId = await finance_repository_1.financeRepository.recordPayment(invoiceId, studentId, amount, method, receivedBy, receiptNumber);
        return {
            paymentId,
            receiptNumber,
            amount,
            status: 'SUCCESS',
            paidAt: new Date().toISOString(),
        };
    }
    async getCollectionSummary(institutionId) {
        return await finance_repository_1.financeRepository.getSummary(institutionId);
    }
}
exports.FinanceService = FinanceService;
exports.financeService = new FinanceService();
