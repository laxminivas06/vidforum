import { academicsRepository } from './academics.repository';
import { AuditDispatcher } from '../../common/audit-dispatcher';

export class AcademicsService {
  // =========================================================================
  // ACADEMIC YEARS
  // =========================================================================

  async getAcademicYears(institutionId: string) {
    return await academicsRepository.listAcademicYears(institutionId);
  }

  async getAcademicYearById(institutionId: string, id: string) {
    return await academicsRepository.getAcademicYearById(institutionId, id);
  }

  async createAcademicYear(institutionId: string, data: {
    name: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
    status?: 'planning' | 'active' | 'closed';
  }, actorId = 'system') {
    const created = await academicsRepository.createAcademicYear(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.year.create',
      resource: 'academic_years',
      resourceId: created.id,
      institutionId,
      newValue: created,
    });
    return created;
  }

  async updateAcademicYear(institutionId: string, id: string, data: {
    name?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    status?: 'planning' | 'active' | 'closed';
  }, actorId = 'system') {
    const oldVal = await academicsRepository.getAcademicYearById(institutionId, id);
    const updated = await academicsRepository.updateAcademicYear(institutionId, id, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.year.update',
      resource: 'academic_years',
      resourceId: id,
      institutionId,
      oldValue: oldVal,
      newValue: updated,
    });
    return updated;
  }

  async setCurrentAcademicYear(institutionId: string, id: string, actorId = 'system') {
    const updated = await academicsRepository.setCurrentAcademicYear(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.year.set_current',
      resource: 'academic_years',
      resourceId: id,
      institutionId,
      newValue: { isCurrent: true, id },
    });
    return updated;
  }

  async closeAcademicYear(institutionId: string, id: string, actorId = 'system') {
    const closed = await academicsRepository.closeAcademicYear(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.year.close',
      resource: 'academic_years',
      resourceId: id,
      institutionId,
      newValue: { status: 'closed', isCurrent: false },
    });
    return closed;
  }

  async cloneAcademicYear(institutionId: string, sourceYearId: string, data: {
    name: string;
    startDate: string;
    endDate: string;
    cloneClasses?: boolean;
    cloneSubjects?: boolean;
    cloneTextbooks?: boolean;
  }, actorId = 'system') {
    const res = await academicsRepository.cloneAcademicYear(institutionId, sourceYearId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.year.clone',
      resource: 'academic_years',
      resourceId: res.newAcademicYear.id,
      institutionId,
      newValue: {
        sourceYearId,
        newYearId: res.newAcademicYear.id,
        clonedClassesCount: res.clonedClassesCount,
        clonedSectionsCount: res.clonedSectionsCount,
        clonedSubjectsCount: res.clonedSubjectsCount,
        clonedTextbooksCount: res.clonedTextbooksCount,
      },
    });
    return res;
  }

  // =========================================================================
  // GRADES, CLASSES & SECTIONS
  // =========================================================================

  async getAcademicGrades(institutionId: string, academicYearId?: string) {
    const classes = await academicsRepository.getClassesByInstitution(institutionId, academicYearId);

    const grades = await Promise.all(
      classes.map(async (cls: any) => {
        const sections = await academicsRepository.getSectionsByClass(cls.id);
        const subjects = await academicsRepository.getSubjectsByClass(cls.id);

        return {
          id: cls.id,
          name: cls.name,
          code: `G${cls.sequence_order}`,
          curriculum: 'CBSE Standard',
          sequenceOrder: cls.sequence_order,
          departmentId: cls.department_id,
          departmentName: cls.department_name,
          academicYearId: cls.academic_year_id,
          sections: sections.map((sec: any) => ({
            id: sec.id,
            name: sec.name,
            room: `Block B - Room 20${sec.name.charCodeAt(0) - 64}`,
            capacity: sec.capacity || 40,
            enrolled: parseInt(sec.enrolled || '0', 10),
            classTeacher: sec.classTeacher,
            classTeacherStaffId: sec.class_teacher_staff_id,
          })),
          subjects: subjects.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            code: sub.code,
            credits: sub.credits || 4,
            type: sub.is_elective ? 'ELECTIVE' : 'CORE',
            periodsPerWeek: sub.periods_per_week,
            maxMarks: sub.max_marks,
            passMarks: sub.pass_marks,
            isMandatory: sub.is_mandatory,
          })),
        };
      })
    );

    return grades;
  }

  async getClasses(institutionId: string, academicYearId?: string) {
    return await academicsRepository.getClassesByInstitution(institutionId, academicYearId);
  }

  async createClass(institutionId: string, data: {
    name: string;
    academicYearId: string;
    departmentId: string;
    sequenceOrder?: number;
  }, actorId = 'system') {
    const created = await academicsRepository.createClass(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.class.create',
      resource: 'classes',
      resourceId: created.id,
      institutionId,
      newValue: created,
    });
    return created;
  }

  async updateClass(institutionId: string, id: string, data: {
    name?: string;
    departmentId?: string;
    sequenceOrder?: number;
  }, actorId = 'system') {
    const updated = await academicsRepository.updateClass(institutionId, id, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.class.update',
      resource: 'classes',
      resourceId: id,
      institutionId,
      newValue: updated,
    });
    return updated;
  }

  async deleteClass(institutionId: string, id: string, actorId = 'system') {
    const deleted = await academicsRepository.deleteClass(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.class.delete',
      resource: 'classes',
      resourceId: id,
      institutionId,
      oldValue: deleted,
    });
    return deleted;
  }

  async generateClassMatrix(institutionId: string, data: {
    academicYearId: string;
    departmentId: string;
    gradeNames: string[];
    sectionNames: string[];
    defaultCapacity?: number;
  }, actorId = 'system') {
    const res = await academicsRepository.generateClassMatrix(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.class.generate_matrix',
      resource: 'classes',
      institutionId,
      newValue: {
        academicYearId: data.academicYearId,
        totalClasses: res.totalClasses,
        totalSections: res.totalSections,
      },
    });
    return res;
  }

  async getClassSections(classId: string) {
    return await academicsRepository.getSectionsByClass(classId);
  }

  async createSection(institutionId: string, classId: string, data: {
    name: string;
    capacity?: number;
    classTeacherStaffId?: string;
  }, actorId = 'system') {
    const created = await academicsRepository.createSection(institutionId, classId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.section.create',
      resource: 'sections',
      resourceId: created.id,
      institutionId,
      newValue: created,
    });
    return created;
  }

  async updateSection(institutionId: string, id: string, data: {
    name?: string;
    capacity?: number;
    classTeacherStaffId?: string | null;
  }, actorId = 'system') {
    const updated = await academicsRepository.updateSection(institutionId, id, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.section.update',
      resource: 'sections',
      resourceId: id,
      institutionId,
      newValue: updated,
    });
    return updated;
  }

  async deleteSection(institutionId: string, id: string, actorId = 'system') {
    const deleted = await academicsRepository.deleteSection(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.section.delete',
      resource: 'sections',
      resourceId: id,
      institutionId,
      oldValue: deleted,
    });
    return deleted;
  }

  // =========================================================================
  // SUBJECTS MASTER
  // =========================================================================

  async getSubjects(institutionId: string) {
    return await academicsRepository.listSubjects(institutionId);
  }

  async createSubject(institutionId: string, data: {
    name: string;
    code: string;
    isElective?: boolean;
    credits?: number;
    departmentId?: string;
  }, actorId = 'system') {
    const created = await academicsRepository.createSubject(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.subject.create',
      resource: 'subjects',
      resourceId: created.id,
      institutionId,
      newValue: created,
    });
    return created;
  }

  async updateSubject(institutionId: string, id: string, data: {
    name?: string;
    code?: string;
    isElective?: boolean;
    credits?: number;
    departmentId?: string | null;
    isActive?: boolean;
  }, actorId = 'system') {
    const updated = await academicsRepository.updateSubject(institutionId, id, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.subject.update',
      resource: 'subjects',
      resourceId: id,
      institutionId,
      newValue: updated,
    });
    return updated;
  }

  async deleteSubject(institutionId: string, id: string, actorId = 'system') {
    const deleted = await academicsRepository.deleteSubject(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.subject.delete',
      resource: 'subjects',
      resourceId: id,
      institutionId,
      oldValue: deleted,
    });
    return deleted;
  }

  // =========================================================================
  // GRADE -> SUBJECT MAPPING
  // =========================================================================

  async getClassSubjects(classId: string) {
    return await academicsRepository.getSubjectsByClass(classId);
  }

  async getGradeSubjects(institutionId: string, classId: string) {
    return await academicsRepository.getGradeSubjects(institutionId, classId);
  }

  async mapSubjectToGrade(institutionId: string, data: {
    classId: string;
    subjectId: string;
    periodsPerWeek?: number;
    maxMarks?: number;
    passMarks?: number;
    isMandatory?: boolean;
  }, actorId = 'system') {
    const res = await academicsRepository.mapSubjectToGrade(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.grade_subject.map',
      resource: 'grade_subjects',
      institutionId,
      newValue: data,
    });
    return res;
  }

  async removeSubjectFromGrade(institutionId: string, classId: string, subjectId: string, actorId = 'system') {
    const res = await academicsRepository.removeSubjectFromGrade(institutionId, classId, subjectId);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.grade_subject.remove',
      resource: 'grade_subjects',
      institutionId,
      oldValue: { classId, subjectId },
    });
    return res;
  }

  async copySubjectMatrix(institutionId: string, sourceClassId: string, targetClassIds: string[], actorId = 'system') {
    const res = await academicsRepository.copySubjectMatrix(institutionId, sourceClassId, targetClassIds);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.grade_subject.copy_matrix',
      resource: 'grade_subjects',
      institutionId,
      newValue: { sourceClassId, targetClassIds, count: res.totalCopied },
    });
    return res;
  }

  async linkSubjectToClass(classId: string, subjectId: string, isMandatory?: boolean) {
    return await academicsRepository.linkSubjectToClass(classId, subjectId, isMandatory);
  }

  // =========================================================================
  // EXAM ESTIMATED SCHEDULE (A2)
  // =========================================================================

  async getExamEstimates(institutionId: string, academicYearId: string, classId?: string) {
    return await academicsRepository.listExamEstimates(institutionId, academicYearId, classId);
  }

  async createExamEstimate(institutionId: string, data: {
    academicYearId: string;
    classId?: string;
    termName: string;
    startDate: string;
    endDate: string;
    description?: string;
    status?: 'draft' | 'scheduled' | 'completed';
  }, actorId = 'system') {
    const created = await academicsRepository.createExamEstimate(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.exam_estimate.create',
      resource: 'exam_estimates',
      resourceId: created.id,
      institutionId,
      newValue: created,
    });
    return created;
  }

  async updateExamEstimate(institutionId: string, id: string, data: {
    termName?: string;
    startDate?: string;
    endDate?: string;
    classId?: string | null;
    description?: string;
    status?: 'draft' | 'scheduled' | 'completed';
  }, actorId = 'system') {
    const updated = await academicsRepository.updateExamEstimate(institutionId, id, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.exam_estimate.update',
      resource: 'exam_estimates',
      resourceId: id,
      institutionId,
      newValue: updated,
    });
    return updated;
  }

  async deleteExamEstimate(institutionId: string, id: string, actorId = 'system') {
    const deleted = await academicsRepository.deleteExamEstimate(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.exam_estimate.delete',
      resource: 'exam_estimates',
      resourceId: id,
      institutionId,
      oldValue: deleted,
    });
    return deleted;
  }

  // =========================================================================
  // YEAR SCHEDULE & WORKING DAYS
  // =========================================================================

  async getCalendarConfig(institutionId: string, academicYearId: string) {
    return await academicsRepository.getCalendarConfig(institutionId, academicYearId);
  }

  async saveCalendarConfig(institutionId: string, academicYearId: string, workingDaysOfWeek: number[], actorId = 'system') {
    const saved = await academicsRepository.saveCalendarConfig(institutionId, academicYearId, workingDaysOfWeek);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.calendar_config.save',
      resource: 'academic_calendar_configs',
      institutionId,
      newValue: saved,
    });
    return saved;
  }

  async getCalendarDays(institutionId: string, academicYearId: string) {
    return await academicsRepository.listCalendarDays(institutionId, academicYearId);
  }

  async createCalendarDay(institutionId: string, data: {
    academicYearId: string;
    date: string;
    dayType: 'working' | 'holiday' | 'vacation' | 'event' | 'exam';
    description?: string;
    isWorkingDay?: boolean;
  }, actorId = 'system') {
    const created = await academicsRepository.createCalendarDay(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.calendar_day.create',
      resource: 'calendar_days',
      resourceId: created.id,
      institutionId,
      newValue: created,
    });
    return created;
  }

  async deleteCalendarDay(institutionId: string, id: string, actorId = 'system') {
    const deleted = await academicsRepository.deleteCalendarDay(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.calendar_day.delete',
      resource: 'calendar_days',
      resourceId: id,
      institutionId,
      oldValue: deleted,
    });
    return deleted;
  }

  async isWorkingDay(institutionId: string, academicYearId: string, date: string) {
    return await academicsRepository.isWorkingDay(institutionId, academicYearId, date);
  }

  async getWorkingDaysCount(institutionId: string, academicYearId: string, startDate?: string, endDate?: string) {
    return await academicsRepository.getWorkingDaysCount(institutionId, academicYearId, startDate, endDate);
  }

  // =========================================================================
  // PREFERRED TEXTBOOKS (A1)
  // =========================================================================

  async getTextbooks(institutionId: string, academicYearId: string, classId?: string, subjectId?: string) {
    return await academicsRepository.listTextbooks(institutionId, academicYearId, classId, subjectId);
  }

  async createTextbook(institutionId: string, data: {
    academicYearId: string;
    classId: string;
    subjectId: string;
    title: string;
    author: string;
    publisher: string;
    edition?: string;
    isbn?: string;
    price?: number;
    isMandatory?: boolean;
    notes?: string;
  }, actorId = 'system') {
    const created = await academicsRepository.createTextbook(institutionId, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.textbook.create',
      resource: 'preferred_textbooks',
      resourceId: created.id,
      institutionId,
      newValue: created,
    });
    return created;
  }

  async updateTextbook(institutionId: string, id: string, data: {
    title?: string;
    author?: string;
    publisher?: string;
    edition?: string;
    isbn?: string;
    price?: number;
    isMandatory?: boolean;
    notes?: string;
  }, actorId = 'system') {
    const updated = await academicsRepository.updateTextbook(institutionId, id, data);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.textbook.update',
      resource: 'preferred_textbooks',
      resourceId: id,
      institutionId,
      newValue: updated,
    });
    return updated;
  }

  async deleteTextbook(institutionId: string, id: string, actorId = 'system') {
    const deleted = await academicsRepository.deleteTextbook(institutionId, id);
    await AuditDispatcher.dispatch({
      actorId,
      action: 'academics.textbook.delete',
      resource: 'preferred_textbooks',
      resourceId: id,
      institutionId,
      oldValue: deleted,
    });
    return deleted;
  }

  async getBooklist(institutionId: string, academicYearId: string, classId: string) {
    return await academicsRepository.getBooklist(institutionId, academicYearId, classId);
  }

  // =========================================================================
  // DEPARTMENTS & ALLOCATIONS (PRESERVED)
  // =========================================================================

  async getDepartments(institutionId: string, departmentType?: string) {
    return await academicsRepository.listDepartments(institutionId, departmentType);
  }

  async createDepartment(institutionId: string, data: { name: string; code: string; departmentType?: string }) {
    return await academicsRepository.createDepartment(institutionId, data);
  }

  async getHierarchy(institutionId: string) {
    return await academicsRepository.getHierarchy(institutionId);
  }

  async getAllocations(institutionId: string) {
    return await academicsRepository.listAllocations(institutionId);
  }

  async createAllocation(institutionId: string, data: { staffId: string; sectionId: string; subjectId: string; academicYearId: string }) {
    return await academicsRepository.createAllocation(institutionId, data);
  }
}

export const academicsService = new AcademicsService();
