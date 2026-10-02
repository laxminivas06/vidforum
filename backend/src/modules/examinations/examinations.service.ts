import { examinationsRepository } from './examinations.repository';
import { AuditDispatcher } from '../../common/audit-dispatcher';
import { notificationService } from '../notifications/notification.service';
import { db } from '../../config/database';

export class ExaminationsService {
  // ================= EXAM TYPES =================
  async createExamType(institutionId: string, data: { name: string; weightage?: number | null }, caller?: { id: string; role: string }) {
    if (!data.name?.trim()) throw new Error('Exam type name is required');
    const type = await examinationsRepository.createExamType(institutionId, data);

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.exam_type_created',
        resource: 'exam_types',
        resourceId: type.id,
        institutionId,
        newValue: { name: data.name, weightage: data.weightage },
      });
    }

    return type;
  }

  async listExamTypes(institutionId: string) {
    return await examinationsRepository.listExamTypes(institutionId);
  }

  // ================= EXAMS =================
  async createExam(
    institutionId: string,
    data: {
      examTypeId: string;
      academicYearId: string;
      classId: string;
      name: string;
      status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    },
    caller?: { id: string; role: string }
  ) {
    if (!data.name?.trim()) throw new Error('Exam name is required');
    if (!data.examTypeId) throw new Error('Exam type is required');
    if (!data.classId) throw new Error('Class is required');
    if (!data.academicYearId) throw new Error('Academic year is required');

    const exam = await examinationsRepository.createExam(institutionId, data);

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.exam_created',
        resource: 'exams',
        resourceId: exam.id,
        institutionId,
        newValue: { name: data.name, classId: data.classId, academicYearId: data.academicYearId },
      });
    }

    return exam;
  }

  async getExamById(institutionId: string, id: string) {
    return await examinationsRepository.getExamById(institutionId, id);
  }

  async listExams(
    institutionId: string,
    filters?: { classId?: string; academicYearId?: string; status?: string; isPublished?: boolean }
  ) {
    return await examinationsRepository.listExams(institutionId, filters);
  }

  async updateExamStatus(institutionId: string, id: string, status: string, caller?: { id: string; role: string }) {
    const updated = await examinationsRepository.updateExamStatus(institutionId, id, status);
    if (caller && updated) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.exam_status_updated',
        resource: 'exams',
        resourceId: id,
        institutionId,
        newValue: { status },
      });
    }
    return updated;
  }

  // ================= EXAM SUBJECTS =================
  async addExamSubject(
    institutionId: string,
    data: { examId: string; subjectId: string; maxMarks: number; passMarks: number },
    caller?: { id: string; role: string }
  ) {
    if (Number(data.maxMarks) <= 0) throw new Error('maxMarks must be greater than zero');
    if (Number(data.passMarks) < 0 || Number(data.passMarks) > Number(data.maxMarks)) {
      throw new Error('passMarks must be between 0 and maxMarks');
    }

    const subject = await examinationsRepository.addExamSubject(institutionId, data);

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.exam_subject_added',
        resource: 'exam_subjects',
        resourceId: subject.id,
        institutionId,
        newValue: data,
      });
    }

    return subject;
  }

  async listExamSubjects(institutionId: string, examId: string) {
    return await examinationsRepository.listExamSubjects(institutionId, examId);
  }

  // ================= EXAM SCHEDULES =================
  async createExamSchedule(
    institutionId: string,
    data: { examSubjectId: string; examDate: string; startTime: string; endTime: string },
    caller?: { id: string; role: string }
  ) {
    if (!data.examDate) throw new Error('examDate is required');
    if (!data.startTime || !data.endTime) throw new Error('startTime and endTime are required');
    if (data.endTime <= data.startTime) throw new Error('endTime must be after startTime');

    const schedule = await examinationsRepository.createExamSchedule(institutionId, data);

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.schedule_created',
        resource: 'exam_schedules',
        resourceId: schedule.id,
        institutionId,
        newValue: data,
      });
    }

    return schedule;
  }

  async listExamSchedules(institutionId: string, examId: string) {
    return await examinationsRepository.listExamSchedules(institutionId, examId);
  }

  // ================= ROOMS & SEATING =================
  async createExamRoom(
    institutionId: string,
    data: { examSubjectId: string; roomId?: string | null; capacity?: number | null }
  ) {
    return await examinationsRepository.createExamRoom(institutionId, data);
  }

  async allocateSeating(
    institutionId: string,
    examRoomId: string,
    allocations: Array<{ studentId: string; seatNumber?: string | null }>
  ) {
    return await examinationsRepository.allocateSeating(institutionId, examRoomId, allocations);
  }

  async assignInvigilator(institutionId: string, examRoomId: string, staffId: string) {
    return await examinationsRepository.assignInvigilator(institutionId, examRoomId, staffId);
  }

  // ================= GRADE SCALES =================
  async createGradeScale(institutionId: string, data: { name: string }) {
    if (!data.name?.trim()) throw new Error('Grade scale name is required');
    return await examinationsRepository.createGradeScale(institutionId, data);
  }

  async listGradeScales(institutionId: string) {
    return await examinationsRepository.listGradeScales(institutionId);
  }

  async addGradeTier(
    institutionId: string,
    gradeScaleId: string,
    data: { label: string; minPercentage: number; maxPercentage: number; gradePoint?: number | null }
  ) {
    if (!data.label?.trim()) throw new Error('Grade label is required');
    if (data.maxPercentage < data.minPercentage) {
      throw new Error('maxPercentage cannot be less than minPercentage');
    }
    return await examinationsRepository.addGradeTier(institutionId, gradeScaleId, data);
  }

  // ================= MARKS ENTRY & SCOPED ACCESS =================
  async submitMarksBatch(
    institutionId: string,
    examSubjectId: string,
    records: Array<{ studentId: string; marksObtained: number; isAbsent?: boolean; remarks?: string | null }>,
    caller?: { id: string; role: string }
  ) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No marks records provided');
    }

    // Rule 8: If caller is TEACHER or FACULTY, verify allocated scope
    if (caller && (caller.role === 'TEACHER' || caller.role === 'FACULTY')) {
      const hasAccess = await examinationsRepository.verifyFacultySubjectAllocation(
        institutionId,
        caller.id,
        examSubjectId
      );
      if (!hasAccess) {
        throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only enter marks for assigned subjects and classes');
      }
    }

    const savedMarks = await examinationsRepository.upsertMarksBatch(
      institutionId,
      examSubjectId,
      records,
      caller?.id
    );

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.marks_submitted',
        resource: 'marks',
        resourceId: examSubjectId,
        institutionId,
        newValue: { count: records.length, examSubjectId },
      });
    }

    return savedMarks;
  }

  async listMarks(
    institutionId: string,
    filters: { examSubjectId?: string; examId?: string; studentId?: string; classId?: string },
    caller?: { id: string; role: string }
  ) {
    // Rule 8: Faculty scoping
    if (caller && (caller.role === 'TEACHER' || caller.role === 'FACULTY') && filters.examSubjectId) {
      const hasAccess = await examinationsRepository.verifyFacultySubjectAllocation(
        institutionId,
        caller.id,
        filters.examSubjectId
      );
      if (!hasAccess) {
        throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only view marks for assigned subjects and classes');
      }
    }

    // Rule 9: Parent scoping
    if (caller && caller.role === 'PARENT' && filters.studentId) {
      const isLinked = await examinationsRepository.verifyParentChildLink(caller.id, filters.studentId);
      if (!isLinked) {
        throw new Error('RESOURCE_ACCESS_DENIED: Parent can only access marks for their linked children');
      }
    }

    // Rule 10: Student scoping
    if (caller && caller.role === 'STUDENT' && filters.studentId) {
      if (caller.id !== filters.studentId) {
        // Also check if caller profile matches
        const studentCheck = await db.query('SELECT id FROM students WHERE profile_id = $1 AND id = $2', [
          caller.id,
          filters.studentId,
        ]);
        if (studentCheck.rows.length === 0) {
          throw new Error('RESOURCE_ACCESS_DENIED: Students can only view their own marks');
        }
      }
    }

    return await examinationsRepository.listMarks(institutionId, filters);
  }

  async verifyMarks(institutionId: string, examSubjectId: string, caller: { id: string; role: string }) {
    const count = await examinationsRepository.verifyMarks(institutionId, examSubjectId, caller.id);

    await AuditDispatcher.dispatch({
      actorId: caller.id,
      action: 'examinations.marks_verified',
      resource: 'marks',
      resourceId: examSubjectId,
      institutionId,
      newValue: { count, verifiedBy: caller.id },
    });

    return { verifiedCount: count };
  }

  // ================= EXCEL IMPORT PIPELINE (SECTION 18 EXIT GATE) =================
  async validateExcelImport(
    institutionId: string,
    examSubjectId: string,
    rows: Array<{ admissionNumber: string; marks: any; isAbsent?: boolean }>,
    caller?: { id: string; role: string }
  ) {
    // Rule 8: Faculty check
    if (caller && (caller.role === 'TEACHER' || caller.role === 'FACULTY')) {
      const hasAccess = await examinationsRepository.verifyFacultySubjectAllocation(
        institutionId,
        caller.id,
        examSubjectId
      );
      if (!hasAccess) {
        throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only import marks for assigned subjects');
      }
    }

    return await examinationsRepository.validateImportBatch(institutionId, examSubjectId, rows);
  }

  async commitExcelImport(
    institutionId: string,
    examSubjectId: string,
    rows: Array<{ admissionNumber: string; marks: any; isAbsent?: boolean }>,
    caller?: { id: string; role: string }
  ) {
    // Rule 8: Faculty check
    if (caller && (caller.role === 'TEACHER' || caller.role === 'FACULTY')) {
      const hasAccess = await examinationsRepository.verifyFacultySubjectAllocation(
        institutionId,
        caller.id,
        examSubjectId
      );
      if (!hasAccess) {
        throw new Error('RESOURCE_ACCESS_DENIED: Faculty can only import marks for assigned subjects');
      }
    }

    const savedMarks = await examinationsRepository.commitImportBatch(
      institutionId,
      examSubjectId,
      rows,
      caller?.id
    );

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.marks_imported',
        resource: 'marks',
        resourceId: examSubjectId,
        institutionId,
        newValue: { importedCount: savedMarks.length, examSubjectId },
      });
    }

    return savedMarks;
  }

  // ================= RESULTS & REPORT CARDS =================
  async calculateResults(institutionId: string, examId: string, caller?: { id: string; role: string }) {
    const reportCards = await examinationsRepository.calculateExamResults(institutionId, examId);

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.results_calculated',
        resource: 'report_cards',
        resourceId: examId,
        institutionId,
        newValue: { examId, calculatedCount: reportCards.length },
      });
    }

    return reportCards;
  }

  async publishExamResults(institutionId: string, examId: string, caller?: { id: string; role: string }) {
    // Calculate final results first if not calculated
    const reportCards = await examinationsRepository.calculateExamResults(institutionId, examId);

    // Publish exam
    const publishedExam = await examinationsRepository.publishExam(institutionId, examId);

    if (caller) {
      await AuditDispatcher.dispatch({
        actorId: caller.id,
        action: 'examinations.results_published',
        resource: 'exams',
        resourceId: examId,
        institutionId,
        newValue: { examId, publishedAt: publishedExam?.publishedAt },
      });
    }

    // Dispatch notifications to students and parents
    for (const card of reportCards) {
      // Find student profile_id
      const studentProfile = await db.query(
        'SELECT profile_id FROM students WHERE id = $1 AND institution_id = $2',
        [card.studentId, institutionId]
      );

      if (studentProfile.rows[0]?.profile_id) {
        await notificationService.sendNotification({
          institutionId,
          recipientUserId: studentProfile.rows[0].profile_id,
          channel: 'push',
          title: `Report Card: ${publishedExam?.name || 'Examination Results'} Published`,
          message: `Your results for ${publishedExam?.name || 'Exam'} are available. Percentage: ${card.percentage}%, Grade: ${card.grade || 'N/A'}, Status: ${card.resultStatus.toUpperCase()}.`,
          type: 'exam_results',
          metadata: {
            examId,
            studentId: card.studentId,
            percentage: card.percentage,
            grade: card.grade,
          },
        });
      }

      // Find linked parent profile_ids
      const parentsRes = await db.query(
        `SELECT p.profile_id 
         FROM student_parents sp 
         JOIN parents p ON p.id = sp.parent_id 
         WHERE sp.student_id = $1 AND p.profile_id IS NOT NULL`,
        [card.studentId]
      );

      for (const p of parentsRes.rows) {
        await notificationService.sendNotification({
          institutionId,
          recipientUserId: p.profile_id,
          channel: 'push',
          title: `Report Card: ${publishedExam?.name || 'Examination Results'} Published`,
          message: `Results for ${card.studentName || 'your child'} are published. Percentage: ${card.percentage}%, Grade: ${card.grade || 'N/A'}.`,
          type: 'exam_results',
          metadata: {
            examId,
            studentId: card.studentId,
            percentage: card.percentage,
            grade: card.grade,
          },
        });
      }
    }

    return {
      exam: publishedExam,
      reportCardsCount: reportCards.length,
    };
  }

  async getStudentReportCard(
    institutionId: string,
    examId: string,
    studentId: string,
    caller?: { id: string; role: string }
  ) {
    // Rule 9: Parent scoping
    if (caller && caller.role === 'PARENT') {
      const isLinked = await examinationsRepository.verifyParentChildLink(caller.id, studentId);
      if (!isLinked) {
        throw new Error('RESOURCE_ACCESS_DENIED: Parent can only access report cards for their linked children');
      }
    }

    // Rule 10: Student scoping
    if (caller && caller.role === 'STUDENT') {
      if (caller.id !== studentId) {
        const studentCheck = await db.query('SELECT id FROM students WHERE profile_id = $1 AND id = $2', [
          caller.id,
          studentId,
        ]);
        if (studentCheck.rows.length === 0) {
          throw new Error('RESOURCE_ACCESS_DENIED: Students can only access their own report card');
        }
      }
    }

    const reportCard = await examinationsRepository.getStudentReportCard(institutionId, examId, studentId);
    if (!reportCard) {
      throw new Error('Report card not found or not yet generated');
    }

    // If caller is student or parent, verify exam is published
    if (caller && (caller.role === 'STUDENT' || caller.role === 'PARENT')) {
      const exam = await examinationsRepository.getExamById(institutionId, examId);
      if (!exam?.isPublished) {
        throw new Error('RESOURCE_ACCESS_DENIED: Exam results have not been published yet');
      }
    }

    return reportCard;
  }

  async listStudentReportCards(institutionId: string, studentId: string, caller?: { id: string; role: string }) {
    // Rule 9: Parent scoping
    if (caller && caller.role === 'PARENT') {
      const isLinked = await examinationsRepository.verifyParentChildLink(caller.id, studentId);
      if (!isLinked) {
        throw new Error('RESOURCE_ACCESS_DENIED: Parent can only access report cards for their linked children');
      }
    }

    // Rule 10: Student scoping
    if (caller && caller.role === 'STUDENT') {
      if (caller.id !== studentId) {
        const studentCheck = await db.query('SELECT id FROM students WHERE profile_id = $1 AND id = $2', [
          caller.id,
          studentId,
        ]);
        if (studentCheck.rows.length === 0) {
          throw new Error('RESOURCE_ACCESS_DENIED: Students can only access their own report cards');
        }
      }
    }

    const cards = await examinationsRepository.listStudentReportCards(institutionId, studentId);

    // If student/parent, filter only published report cards
    if (caller && (caller.role === 'STUDENT' || caller.role === 'PARENT')) {
      return cards.filter((c) => c.publishedAt !== null);
    }

    return cards;
  }
}

export const examinationsService = new ExaminationsService();
