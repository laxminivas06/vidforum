"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeController = exports.FinanceController = void 0;
const finance_service_1 = require("./finance.service");
const api_response_1 = require("../../utils/api-response");
class FinanceController {
    async getRecords(req, res, next) {
        try {
            const instId = req.institutionId;
            const records = await finance_service_1.financeService.getFeeRecords(instId);
            (0, api_response_1.sendSuccess)(res, records);
        }
        catch (error) {
            next(error);
        }
    }
    async recordPayment(req, res, next) {
        try {
            const { invoiceId, studentId, amount, method = 'upi' } = req.body;
            const receivedBy = req.user?.id || '44444444-4444-4444-4444-444444444401';
            const result = await finance_service_1.financeService.processPayment(invoiceId, studentId, amount, method, receivedBy);
            (0, api_response_1.sendSuccess)(res, result, 'Payment collected and receipt generated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getSummary(req, res, next) {
        try {
            const instId = req.institutionId;
            const summary = await finance_service_1.financeService.getCollectionSummary(instId);
            (0, api_response_1.sendSuccess)(res, summary);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FinanceController = FinanceController;
exports.financeController = new FinanceController();
