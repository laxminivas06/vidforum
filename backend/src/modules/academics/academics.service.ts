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

  async getClasses(institutionId: string) {
    return await academicsRepository.listClasses(institutionId);
  }

  async getSubjects(institutionId: string) {
    return await academicsRepository.listSubjects(institutionId);
  }
}

export const academicsService = new AcademicsService();
