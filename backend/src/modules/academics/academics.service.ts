import { academicsRepository } from './academics.repository';

export class AcademicsService {
  async getAcademicGrades(institutionId: string) {
    const classes = await academicsRepository.getClassesByInstitution(institutionId);

    const grades = await Promise.all(
      classes.map(async (cls: any) => {
        const sections = await academicsRepository.getSectionsByClass(cls.id);
        const subjects = await academicsRepository.getSubjectsByClass(cls.id);

        return {
          id: cls.id,
          name: cls.name,
          code: `G${cls.sequence_order}`,
          curriculum: 'CBSE Standard',
          sections: sections.map((sec: any) => ({
            id: sec.id,
            name: sec.name,
            room: `Block B - Room 20${sec.name.charCodeAt(0) - 64}`,
            capacity: sec.capacity || 40,
            enrolled: parseInt(sec.enrolled || '0', 10),
            classTeacher: sec.classTeacher,
          })),
          subjects: subjects.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            code: sub.code,
            credits: 4,
            type: sub.is_elective ? 'ELECTIVE' : 'CORE',
          })),
        };
      })
    );

    return grades;
  }

  async getHierarchy(institutionId: string) {
    return await academicsRepository.getHierarchy(institutionId);
  }

  async getAcademicYears(institutionId: string) {
    return await academicsRepository.listAcademicYears(institutionId);
  }

  async createAcademicYear(institutionId: string, data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) {
    return await academicsRepository.createAcademicYear(institutionId, data);
  }

  async getDepartments(institutionId: string, departmentType?: string) {
    return await academicsRepository.listDepartments(institutionId, departmentType);
  }

  async createDepartment(institutionId: string, data: { name: string; code: string; departmentType?: string }) {
    return await academicsRepository.createDepartment(institutionId, data);
  }

  async createClass(institutionId: string, data: { name: string; academicYearId: string; departmentId: string; sequenceOrder?: number }) {
    return await academicsRepository.createClass(institutionId, data);
  }

  async getClassSections(classId: string) {
    return await academicsRepository.getSectionsByClass(classId);
  }

  async createSection(institutionId: string, classId: string, data: { name: string; capacity?: number; classTeacherStaffId?: string }) {
    return await academicsRepository.createSection(institutionId, classId, data);
  }

  async getClassSubjects(classId: string) {
    return await academicsRepository.getSubjectsByClass(classId);
  }

  async createSubject(institutionId: string, data: { name: string; code: string; isElective?: boolean }) {
    return await academicsRepository.createSubject(institutionId, data);
  }

  async linkSubjectToClass(classId: string, subjectId: string, isMandatory?: boolean) {
    return await academicsRepository.linkSubjectToClass(classId, subjectId, isMandatory);
  }

  async getAllocations(institutionId: string) {
    return await academicsRepository.listAllocations(institutionId);
  }

  async createAllocation(institutionId: string, data: { staffId: string; sectionId: string; subjectId: string; academicYearId: string }) {
    return await academicsRepository.createAllocation(institutionId, data);
  }
}

export const academicsService = new AcademicsService();
