"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentController = exports.StudentController = void 0;
const student_service_1 = require("./student.service");
const api_response_1 = require("../../utils/api-response");
class StudentController {
    async getStudents(req, res, next) {
        try {
            const instId = req.institutionId;
            const { search, classId, sectionId, status = 'active' } = req.query;
            const students = await student_service_1.studentService.listStudents(instId, {
                search: search,
                classId: classId,
                sectionId: sectionId,
                status: status,
            });
            (0, api_response_1.sendSuccess)(res, students);
        }
        catch (error) {
            next(error);
        }
    }
    async getStudentById(req, res, next) {
        try {
            const id = req.params.id;
            const instId = req.institutionId;
            const student = await student_service_1.studentService.getStudentMaster(id, instId);
            (0, api_response_1.sendSuccess)(res, student);
        }
        catch (error) {
            next(error);
        }
    }
    async promote(req, res, next) {
        try {
            const id = req.params.id;
            const { toClassId, toSectionId, academicYearId, decision = 'promoted' } = req.body;
            const actorId = req.user?.id || '44444444-4444-4444-4444-444444444401';
            const result = await student_service_1.studentService.promoteStudent(id, toClassId, toSectionId, academicYearId, decision, actorId);
            (0, api_response_1.sendSuccess)(res, result, 'Student promoted successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StudentController = StudentController;
exports.studentController = new StudentController();
