import { studentRepository } from './student.repository';

export class StudentService {
  async listStudents(institutionId: string, filters: { search?: string; classId?: string; sectionId?: string; status?: string }) {
    return await studentRepository.findStudents(institutionId, filters);
  }

  async getStudentMaster(studentId: string, institutionId: string) {
    const student = await studentRepository.findStudentMasterById(studentId, institutionId);
    if (!student) {
      throw new Error('Student not found');
    }
    return student;
  }

  async promoteStudent(studentId: string, toClassId: string, toSectionId: string, academicYearId: string, decision: string, actorId: string) {
    await studentRepository.promote(studentId, toClassId, toSectionId, academicYearId, decision, actorId);
    return { studentId, status: 'PROMOTED' };
  }
}

export const studentService = new StudentService();
