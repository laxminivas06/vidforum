import { studentRepository, StudentFilters } from './student.repository';

export class StudentService {
  async listStudents(institutionId: string, filters: StudentFilters) {
    return studentRepository.findStudents(institutionId, filters);
  }

  async getStudentMaster(studentId: string, institutionId: string) {
    const student = await studentRepository.findStudentMasterById(studentId, institutionId);
    if (!student) throw new Error('Student not found');
    return student;
  }

  async createStudent(institutionId: string, data: Parameters<typeof studentRepository.createStudent>[1]) {
    return studentRepository.createStudent(institutionId, data);
  }

  async updateStudent(id: string, institutionId: string, data: any, actorId?: string) {
    return studentRepository.updateStudent(id, institutionId, data, actorId);
  }

  async promoteStudent(studentId: string, toClassId: string, toSectionId: string, academicYearId: string, decision: string, actorId: string) {
    await studentRepository.promote(studentId, toClassId, toSectionId, academicYearId, decision, actorId);
    return { studentId, decision, status: 'PROMOTED' };
  }

  async getClassEnrollmentCounts(institutionId: string) {
    return studentRepository.getClassEnrollmentCounts(institutionId);
  }

  async bulkImport(institutionId: string, rows: any[], academicYearId: string, actorId: string) {
    return studentRepository.bulkInsertStudents(institutionId, rows, academicYearId, actorId);
  }
}

export const studentService = new StudentService();
