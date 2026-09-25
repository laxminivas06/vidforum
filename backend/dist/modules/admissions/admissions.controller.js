"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionsController = exports.AdmissionsController = void 0;
const admissions_service_1 = require("./admissions.service");
const api_response_1 = require("../../utils/api-response");
class AdmissionsController {
    async getApplicants(req, res, next) {
        try {
            const instId = req.institutionId;
            const applicants = await admissions_service_1.admissionsService.getApplicants(instId);
            (0, api_response_1.sendSuccess)(res, applicants);
        }
        catch (error) {
            next(error);
        }
    }
    async updateStage(req, res, next) {
        try {
            const id = req.params.id;
            const { stage } = req.body;
            if (!stage) {
                (0, api_response_1.sendError)(res, 'Stage is required', 400);
                return;
            }
            const updated = await admissions_service_1.admissionsService.updateStage(id, stage);
            (0, api_response_1.sendSuccess)(res, updated, `Application stage updated to ${stage}`);
        }
        catch (error) {
            next(error);
        }
    }
    async approve(req, res, next) {
        try {
            const id = req.params.id;
            const instId = req.institutionId;
            const result = await admissions_service_1.admissionsService.approveApplication(id, instId);
            (0, api_response_1.sendSuccess)(res, result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdmissionsController = AdmissionsController;
exports.admissionsController = new AdmissionsController();
