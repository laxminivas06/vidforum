"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = exports.StudentService = void 0;
const student_repository_1 = require("./student.repository");
class StudentService {
    async listStudents(institutionId, filters) {
        return await student_repository_1.studentRepository.findStudents(institutionId, filters);
    }
    async getStudentMaster(studentId, institutionId) {
        const student = await student_repository_1.studentRepository.findStudentMasterById(studentId, institutionId);
        if (!student) {
            throw new Error('Student not found');
        }
        return student;
    }
    async promoteStudent(studentId, toClassId, toSectionId, academicYearId, decision, actorId) {
        await student_repository_1.studentRepository.promote(studentId, toClassId, toSectionId, academicYearId, decision, actorId);
        return { studentId, status: 'PROMOTED' };
    }
}
exports.StudentService = StudentService;
exports.studentService = new StudentService();
