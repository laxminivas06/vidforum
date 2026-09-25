import { facultyRepository } from './faculty.repository';

export class FacultyService {
  async getFacultyList(institutionId: string) {
    const raw = await facultyRepository.findFacultyByInstitution(institutionId);

    return raw.map((row: any) => ({
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

  async getFacultyMember(id: string, institutionId: string) {
    const member = await facultyRepository.findFacultyById(id, institutionId);
    if (!member) {
      throw new Error('Faculty member not found');
    }
    return member;
  }
}

export const facultyService = new FacultyService();
