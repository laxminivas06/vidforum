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
      phone: row.phone || '',
      qualification: row.qualification || '',
      university: row.university || '',
      subjects: row.subjects || '',
      experience: row.experience || '',
      address: row.address || '',
      dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth).toISOString().split('T')[0] : '',
      gender: row.gender || '',
      userId: row.userId || row.email,
      hasAccount: !!row.hasAccount,
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
      status: (row.status || 'ACTIVE').toUpperCase(),
    }));
  }

  async addStaffMember(institutionId: string, data: any) {
    return await facultyRepository.createStaffMember(institutionId, data);
  }

  async addStaffBulk(institutionId: string, items: any[]) {
    return await facultyRepository.createStaffBulk(institutionId, items);
  }

  async getFacultyMember(id: string, institutionId: string) {
    const member = await facultyRepository.findFacultyById(id, institutionId);
    if (!member) {
      throw new Error('Faculty member not found');
    }
    return member;
  }

  async getFacultyProfile(profileId: string, institutionId: string) {
    const member = await facultyRepository.findFacultyByProfileId(profileId, institutionId);
    if (!member) {
      throw new Error('Faculty profile not found');
    }
    const [classes, subjects] = await Promise.all([
      facultyRepository.findAssignedClasses(member.id),
      facultyRepository.findAssignedSubjects(member.id),
    ]);
    return {
      ...member,
      assignedClasses: classes,
      assignedSubjects: subjects,
    };
  }

  async getMyAssignedClasses(profileId: string, institutionId: string) {
    const member = await facultyRepository.findFacultyByProfileId(profileId, institutionId);
    if (!member) {
      throw new Error('Faculty profile not found');
    }
    return await facultyRepository.findAssignedClasses(member.id);
  }

  async getMyAssignedSubjects(profileId: string, institutionId: string) {
    const member = await facultyRepository.findFacultyByProfileId(profileId, institutionId);
    if (!member) {
      throw new Error('Faculty profile not found');
    }
    return await facultyRepository.findAssignedSubjects(member.id);
  }

  async getSectionStudentRoster(sectionId: string, institutionId: string) {
    return await facultyRepository.findSectionStudents(sectionId, institutionId);
  }
}

export const facultyService = new FacultyService();
