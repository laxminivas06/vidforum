"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facultyService = exports.FacultyService = void 0;
const faculty_repository_1 = require("./faculty.repository");
class FacultyService {
    async getFacultyList(institutionId) {
        const raw = await faculty_repository_1.facultyRepository.findFacultyByInstitution(institutionId);
        return raw.map((row) => ({
            id: row.id,
            employeeCode: row.employeeCode,
            name: row.name,
            designation: row.designation || 'Lecturer',
            department: row.department || 'Academic Department',
            email: row.email,
            phone: row.phone || '+91 98000 00000',
            assignedClasses: row.assignedClasses || [],
            todayClasses: [
                {
                    time: '08:30 - 09:30 AM',
                    grade: 'Grade 10',
                    section: 'Section A',
                    subject: 'Calculus & Quadratic Equations',
                    status: 'COMPLETED',
                },
                {
                    time: '11:15 - 12:15 PM',
                    grade: 'Grade 10',
                    section: 'Section B',
                    subject: 'Coordinate Geometry',
                    status: 'IN_PROGRESS',
                },
                {
                    time: '02:00 - 03:00 PM',
                    grade: 'Grade 11',
                    section: 'Section A',
                    subject: 'Trigonometric Identities Lab',
                    status: 'UPCOMING',
                },
            ],
            status: row.status.toUpperCase(),
        }));
    }
    async getFacultyMember(id, institutionId) {
        const member = await faculty_repository_1.facultyRepository.findFacultyById(id, institutionId);
        if (!member) {
            throw new Error('Faculty member not found');
        }
        return member;
    }
}
exports.FacultyService = FacultyService;
exports.facultyService = new FacultyService();
