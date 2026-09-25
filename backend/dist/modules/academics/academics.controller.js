"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicsController = exports.AcademicsController = void 0;
const academics_service_1 = require("./academics.service");
const api_response_1 = require("../../utils/api-response");
class AcademicsController {
    async getGrades(req, res, next) {
        try {
            const instId = req.institutionId;
            const grades = await academics_service_1.academicsService.getAcademicGrades(instId);
            (0, api_response_1.sendSuccess)(res, grades);
        }
        catch (error) {
            next(error);
        }
    }
    async getHierarchy(req, res, next) {
        try {
            const instId = req.institutionId;
            const hierarchy = await academics_service_1.academicsService.getHierarchy(instId);
            (0, api_response_1.sendSuccess)(res, hierarchy);
        }
        catch (error) {
            next(error);
        }
    }
    async getClasses(req, res, next) {
        try {
            const instId = req.institutionId;
            const classes = await academics_service_1.academicsService.getClasses(instId);
            (0, api_response_1.sendSuccess)(res, classes);
        }
        catch (error) {
            next(error);
        }
    }
    async getSubjects(req, res, next) {
        try {
            const instId = req.institutionId;
            const subjects = await academics_service_1.academicsService.getSubjects(instId);
            (0, api_response_1.sendSuccess)(res, subjects);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AcademicsController = AcademicsController;
exports.academicsController = new AcademicsController();
