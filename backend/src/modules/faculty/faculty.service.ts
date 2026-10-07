import { facultyRepository } from './faculty.repository';

export class FacultyService {
  async getFacultyList(institutionId: string) {
    const raw = await facultyRepository.findFacultyByInstitution(institutionId);

    return await Promise.all(
      raw.map(async (row: any) => {
        const assigned = row.assignedClasses || [];
        const studentsCount = await facultyRepository.countStudentsTaught(row.id).catch(() => 0);
        const todayClassesRaw = await facultyRepository.findFacultyTodayClasses(row.id, institutionId).catch(() => []);

        let todayClasses = todayClassesRaw.map((tc: any, idx: number) => ({
          period: tc.period || `Period ${idx + 1}`,
          time: tc.time || '08:30 - 09:15 AM',
          gradeSection: tc.gradeSection,
          sectionId: tc.sectionId,
          subject: tc.subject,
          room: tc.room,
          status: idx === 0 ? 'IN_PROGRESS' : idx === 1 ? 'UPCOMING' : 'COMPLETED',
        }));

        if (todayClasses.length === 0 && assigned.length > 0) {
          todayClasses = assigned.slice(0, 3).map((ac: any, idx: number) => ({
            period: `Period ${idx + 1}`,
            time: idx === 0 ? '08:30 - 09:15 AM' : idx === 1 ? '09:15 - 10:00 AM' : '10:15 - 11:00 AM',
            gradeSection: `${ac.grade} - ${ac.section}`,
            sectionId: ac.section_id,
            subject: ac.subject,
            room: ac.room || 'Room 101',
            status: idx === 0 ? 'IN_PROGRESS' : 'UPCOMING',
          }));
        }

        return {
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
          assignedClasses: assigned,
          batchesCount: assigned.length,
          studentsCount: studentsCount || 0,
          todayClasses,
          status: (row.status || 'ACTIVE').toUpperCase(),
        };
      })
    );
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
    const [classes, subjects, todayClassesRaw, studentsCount] = await Promise.all([
      facultyRepository.findAssignedClasses(member.id),
      facultyRepository.findAssignedSubjects(member.id),
      facultyRepository.findFacultyTodayClasses(member.id, institutionId).catch(() => []),
      facultyRepository.countStudentsTaught(member.id).catch(() => 0),
    ]);

    let todayClasses = (todayClassesRaw || []).map((tc: any, idx: number) => ({
      period: tc.period || `Period ${idx + 1}`,
      time: tc.time || '08:30 - 09:15 AM',
      gradeSection: tc.gradeSection,
      sectionId: tc.sectionId,
      subject: tc.subject,
      room: tc.room,
      status: idx === 0 ? 'IN_PROGRESS' : idx === 1 ? 'UPCOMING' : 'COMPLETED',
    }));

    if (todayClasses.length === 0 && classes.length > 0) {
      todayClasses = classes.slice(0, 3).map((c: any, idx: number) => ({
        period: `Period ${idx + 1}`,
        time: idx === 0 ? '08:30 - 09:15 AM' : idx === 1 ? '09:15 - 10:00 AM' : '10:15 - 11:00 AM',
        gradeSection: `${c.class_name} - ${c.section_name}`,
        sectionId: c.section_id,
        subject: c.subject_name || member.subjects?.split(',')[0] || 'Core Subject',
        room: `Room ${101 + idx}`,
        status: idx === 0 ? 'IN_PROGRESS' : 'UPCOMING',
      }));
    }

    return {
      ...member,
      assignedClasses: classes,
      assignedSubjects: subjects,
      batchesCount: classes.length,
      studentsCount: studentsCount || 0,
      todayClasses,
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
