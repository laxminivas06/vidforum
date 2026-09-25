"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicsService = exports.AcademicsService = void 0;
const academics_repository_1 = require("./academics.repository");
class AcademicsService {
    async getAcademicGrades(institutionId) {
        const classes = await academics_repository_1.academicsRepository.getClassesByInstitution(institutionId);
        const grades = await Promise.all(classes.map(async (cls) => {
            const sections = await academics_repository_1.academicsRepository.getSectionsByClass(cls.id);
            const subjects = await academics_repository_1.academicsRepository.getSubjectsByClass(cls.id);
            return {
                id: cls.id,
                name: cls.name,
                code: `G${cls.sequence_order}`,
                curriculum: 'CBSE Standard',
                sections: sections.map((sec) => ({
                    id: sec.id,
                    name: sec.name,
                    room: `Block B - Room 20${sec.name.charCodeAt(0) - 64}`,
                    capacity: sec.capacity || 40,
                    enrolled: parseInt(sec.enrolled || '0', 10),
                    classTeacher: sec.classTeacher,
                })),
                subjects: subjects.map((sub) => ({
                    id: sub.id,
                    name: sub.name,
                    code: sub.code,
                    credits: 4,
                    type: sub.is_elective ? 'ELECTIVE' : 'CORE',
                })),
            };
        }));
        return grades;
    }
    async getHierarchy(institutionId) {
        return await academics_repository_1.academicsRepository.getHierarchy(institutionId);
    }
    async getClasses(institutionId) {
        return await academics_repository_1.academicsRepository.listClasses(institutionId);
    }
    async getSubjects(institutionId) {
        return await academics_repository_1.academicsRepository.listSubjects(institutionId);
    }
}
exports.AcademicsService = AcademicsService;
exports.academicsService = new AcademicsService();
