"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facultyController = exports.FacultyController = void 0;
const faculty_service_1 = require("./faculty.service");
const api_response_1 = require("../../utils/api-response");
class FacultyController {
    async getFaculty(req, res, next) {
        try {
            const instId = req.institutionId;
            const faculty = await faculty_service_1.facultyService.getFacultyList(instId);
            (0, api_response_1.sendSuccess)(res, faculty);
        }
        catch (error) {
            next(error);
        }
    }
    async getFacultyById(req, res, next) {
        try {
            const id = req.params.id;
            const instId = req.institutionId;
            const member = await faculty_service_1.facultyService.getFacultyMember(id, instId);
            (0, api_response_1.sendSuccess)(res, member);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FacultyController = FacultyController;
exports.facultyController = new FacultyController();
