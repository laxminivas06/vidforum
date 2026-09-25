"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionController = exports.InstitutionController = void 0;
const institution_service_1 = require("./institution.service");
const api_response_1 = require("../../utils/api-response");
class InstitutionController {
    async getInstitutions(_req, res, next) {
        try {
            const institutions = await institution_service_1.institutionService.getAllInstitutions();
            (0, api_response_1.sendSuccess)(res, institutions);
        }
        catch (error) {
            next(error);
        }
    }
    async getInstitutionById(req, res, next) {
        try {
            const id = req.params.id;
            const institution = await institution_service_1.institutionService.getInstitutionDetails(id);
            (0, api_response_1.sendSuccess)(res, institution);
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(req, res, next) {
        try {
            const id = req.params.id;
            const stats = await institution_service_1.institutionService.getInstitutionStats(id);
            (0, api_response_1.sendSuccess)(res, stats);
        }
        catch (error) {
            next(error);
        }
    }
    async toggleModule(req, res, next) {
        try {
            const id = req.params.id;
            const moduleCode = req.params.moduleCode;
            const { isEnabled } = req.body;
            const result = await institution_service_1.institutionService.toggleModule(id, moduleCode, isEnabled);
            (0, api_response_1.sendSuccess)(res, result, `Module ${moduleCode} updated`);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InstitutionController = InstitutionController;
exports.institutionController = new InstitutionController();
