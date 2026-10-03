import { Request, Response, NextFunction } from 'express';
import { academicsService } from './academics.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AcademicsController {
  // =========================================================================
  // ACADEMIC YEARS
  // =========================================================================

  async getAcademicYears(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const years = await academicsService.getAcademicYears(instId);
      sendSuccess(res, years);
    } catch (error) {
      next(error);
    }
  }

  async getAcademicYearById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const id = req.params.id as string;
      const year = await academicsService.getAcademicYearById(instId, id);
      if (!year) {
        sendError(res, 'Academic year not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, year);
    } catch (error) {
      next(error);
    }
  }

  async createAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { name, startDate, endDate, isCurrent, status } = req.body;

      if (!name || !startDate || !endDate) {
        sendError(res, 'Name, startDate, and endDate are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const created = await academicsService.createAcademicYear(
        instId,
        { name, startDate, endDate, isCurrent, status },
        actorId
      );
      sendSuccess(res, created, 'Academic year created successfully', 201);
    } catch (error: any) {
      if (error?.code === '23505') {
        sendError(res, `Academic year "${req.body.name}" already exists`, 409, 'DUPLICATE_YEAR');
        return;
      }
      next(error);
    }
  }

  async updateAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;
      const { name, startDate, endDate, isCurrent, status } = req.body;

      const updated = await academicsService.updateAcademicYear(
        instId,
        id,
        { name, startDate, endDate, isCurrent, status },
        actorId
      );
      sendSuccess(res, updated, 'Academic year updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async setCurrentAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const updated = await academicsService.setCurrentAcademicYear(instId, id, actorId);
      sendSuccess(res, updated, 'Academic year set as current');
    } catch (error) {
      next(error);
    }
  }

  async closeAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const closed = await academicsService.closeAcademicYear(instId, id, actorId);
      sendSuccess(res, closed, 'Academic year closed successfully');
    } catch (error) {
      next(error);
    }
  }

  async cloneAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;
      const { name, startDate, endDate, cloneClasses, cloneSubjects, cloneTextbooks } = req.body;

      if (!name || !startDate || !endDate) {
        sendError(res, 'New year name, startDate, and endDate are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const cloned = await academicsService.cloneAcademicYear(
        instId,
        id,
        { name, startDate, endDate, cloneClasses, cloneSubjects, cloneTextbooks },
        actorId
      );
      sendSuccess(res, cloned, 'Academic year cloned successfully', 201);
    } catch (error: any) {
      if (error?.code === '23505') {
        sendError(res, `Academic year "${req.body.name}" already exists`, 409, 'DUPLICATE_YEAR');
        return;
      }
      next(error);
    }
  }

  // =========================================================================
  // GRADES, CLASSES & SECTIONS
  // =========================================================================

  async getGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string | undefined;
      const grades = await academicsService.getAcademicGrades(instId, academicYearId);
      sendSuccess(res, grades);
    } catch (error) {
      next(error);
    }
  }

  async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string | undefined;
      const classes = await academicsService.getClasses(instId, academicYearId);
      sendSuccess(res, classes);
    } catch (error) {
      next(error);
    }
  }

  async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { name, academicYearId, departmentId, sequenceOrder } = req.body;

      if (!name || !academicYearId || !departmentId) {
        sendError(res, 'Name, academicYearId, and departmentId are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const created = await academicsService.createClass(
        instId,
        { name, academicYearId, departmentId, sequenceOrder },
        actorId
      );
      sendSuccess(res, created, 'Class created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;
      const { name, departmentId, sequenceOrder } = req.body;

      const updated = await academicsService.updateClass(
        instId,
        id,
        { name, departmentId, sequenceOrder },
        actorId
      );
      sendSuccess(res, updated, 'Class updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const deleted = await academicsService.deleteClass(instId, id, actorId);
      sendSuccess(res, deleted, 'Class deleted successfully');
    } catch (error: any) {
      if (error?.statusCode === 409 || error?.code === 'CLASS_IN_USE') {
        sendError(res, error.message, 409, 'CLASS_IN_USE');
        return;
      }
      next(error);
    }
  }

  async generateClassMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { academicYearId, departmentId, gradeNames, sectionNames, defaultCapacity } = req.body;

      if (!academicYearId || !departmentId || !Array.isArray(gradeNames) || !Array.isArray(sectionNames)) {
        sendError(res, 'academicYearId, departmentId, gradeNames, and sectionNames are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await academicsService.generateClassMatrix(
        instId,
        { academicYearId, departmentId, gradeNames, sectionNames, defaultCapacity },
        actorId
      );
      sendSuccess(res, result, 'Grade x Section class matrix generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getClassSections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = req.params.classId as string;
      const sections = await academicsService.getClassSections(classId);
      sendSuccess(res, sections);
    } catch (error) {
      next(error);
    }
  }

  async createSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const classId = req.params.classId as string;
      const { name, capacity, classTeacherStaffId } = req.body;

      if (!name) {
        sendError(res, 'Section name is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const created = await academicsService.createSection(
        instId,
        classId,
        { name, capacity, classTeacherStaffId },
        actorId
      );
      sendSuccess(res, created, 'Section created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;
      const { name, capacity, classTeacherStaffId } = req.body;

      const updated = await academicsService.updateSection(
        instId,
        id,
        { name, capacity, classTeacherStaffId },
        actorId
      );
      sendSuccess(res, updated, 'Section updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const deleted = await academicsService.deleteSection(instId, id, actorId);
      sendSuccess(res, deleted, 'Section deleted successfully');
    } catch (error: any) {
      if (error?.statusCode === 409 || error?.code === 'SECTION_IN_USE') {
        sendError(res, error.message, 409, 'SECTION_IN_USE');
        return;
      }
      next(error);
    }
  }

  // =========================================================================
  // SUBJECTS MASTER
  // =========================================================================

  async getSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const subjects = await academicsService.getSubjects(instId);
      sendSuccess(res, subjects);
    } catch (error) {
      next(error);
    }
  }

  async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { name, code, isElective, credits, departmentId } = req.body;

      if (!name || !code) {
        sendError(res, 'Subject name and code are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const created = await academicsService.createSubject(
        instId,
        { name, code, isElective, credits, departmentId },
        actorId
      );
      sendSuccess(res, created, 'Subject created successfully', 201);
    } catch (error: any) {
      if (error?.statusCode === 409 || error?.code === 'DUPLICATE_SUBJECT_CODE') {
        sendError(res, error.message, 409, 'DUPLICATE_SUBJECT_CODE');
        return;
      }
      next(error);
    }
  }

  async updateSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;
      const { name, code, isElective, credits, departmentId, isActive } = req.body;

      const updated = await academicsService.updateSubject(
        instId,
        id,
        { name, code, isElective, credits, departmentId, isActive },
        actorId
      );
      sendSuccess(res, updated, 'Subject updated successfully');
    } catch (error: any) {
      if (error?.statusCode === 409 || error?.code === 'DUPLICATE_SUBJECT_CODE') {
        sendError(res, error.message, 409, 'DUPLICATE_SUBJECT_CODE');
        return;
      }
      next(error);
    }
  }

  async deleteSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const deleted = await academicsService.deleteSubject(instId, id, actorId);
      sendSuccess(res, deleted, 'Subject deleted successfully');
    } catch (error: any) {
      if (error?.statusCode === 409 || error?.code === 'SUBJECT_IN_USE') {
        sendError(res, error.message, 409, 'SUBJECT_IN_USE');
        return;
      }
      next(error);
    }
  }

  // =========================================================================
  // GRADE -> SUBJECT MAPPING
  // =========================================================================

  async getClassSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = req.params.classId as string;
      const subjects = await academicsService.getClassSubjects(classId);
      sendSuccess(res, subjects);
    } catch (error) {
      next(error);
    }
  }

  async getGradeSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const classId = req.params.classId as string;
      const mapped = await academicsService.getGradeSubjects(instId, classId);
      sendSuccess(res, mapped);
    } catch (error) {
      next(error);
    }
  }

  async mapSubjectToGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const classId = req.params.classId as string;
      const { subjectId, periodsPerWeek, maxMarks, passMarks, isMandatory } = req.body;

      if (!subjectId) {
        sendError(res, 'subjectId is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await academicsService.mapSubjectToGrade(
        instId,
        { classId, subjectId, periodsPerWeek, maxMarks, passMarks, isMandatory },
        actorId
      );
      sendSuccess(res, result, 'Subject mapped to grade successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async removeSubjectFromGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const classId = req.params.classId as string;
      const subjectId = req.params.subjectId as string;

      const result = await academicsService.removeSubjectFromGrade(instId, classId, subjectId, actorId);
      sendSuccess(res, result, 'Subject removed from grade');
    } catch (error) {
      next(error);
    }
  }

  async copySubjectMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const classId = req.params.classId as string;
      const { targetClassIds } = req.body;

      if (!Array.isArray(targetClassIds) || targetClassIds.length === 0) {
        sendError(res, 'targetClassIds array is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await academicsService.copySubjectMatrix(instId, classId, targetClassIds, actorId);
      sendSuccess(res, result, 'Subject matrix copied successfully');
    } catch (error) {
      next(error);
    }
  }

  async linkSubjectToClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = req.params.classId as string;
      const { subjectId, isMandatory } = req.body;
      const result = await academicsService.linkSubjectToClass(classId, subjectId, isMandatory);
      sendSuccess(res, result, 'Subject linked to class');
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // EXAM ESTIMATED SCHEDULE (A2)
  // =========================================================================

  async getExamEstimates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string;
      const classId = req.query.classId as string | undefined;

      if (!academicYearId) {
        sendError(res, 'academicYearId query parameter is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const estimates = await academicsService.getExamEstimates(instId, academicYearId, classId);
      sendSuccess(res, estimates);
    } catch (error) {
      next(error);
    }
  }

  async createExamEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { academicYearId, classId, termName, startDate, endDate, description, status } = req.body;

      if (!academicYearId || !termName || !startDate || !endDate) {
        sendError(res, 'academicYearId, termName, startDate, and endDate are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const created = await academicsService.createExamEstimate(
        instId,
        { academicYearId, classId, termName, startDate, endDate, description, status },
        actorId
      );
      sendSuccess(res, created, 'Exam estimated schedule created successfully', 201);
    } catch (error: any) {
      if (error?.statusCode === 400) {
        sendError(res, error.message, 400, 'DATE_VALIDATION_ERROR');
        return;
      }
      next(error);
    }
  }

  async updateExamEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;
      const { termName, startDate, endDate, classId, description, status } = req.body;

      const updated = await academicsService.updateExamEstimate(
        instId,
        id,
        { termName, startDate, endDate, classId, description, status },
        actorId
      );
      sendSuccess(res, updated, 'Exam estimated schedule updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteExamEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const deleted = await academicsService.deleteExamEstimate(instId, id, actorId);
      sendSuccess(res, deleted, 'Exam estimated schedule deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // YEAR SCHEDULE & WORKING DAYS
  // =========================================================================

  async getCalendarConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string;

      if (!academicYearId) {
        sendError(res, 'academicYearId query parameter is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const config = await academicsService.getCalendarConfig(instId, academicYearId);
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  async saveCalendarConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { academicYearId, workingDaysOfWeek } = req.body;

      if (!academicYearId || !Array.isArray(workingDaysOfWeek)) {
        sendError(res, 'academicYearId and workingDaysOfWeek array are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const saved = await academicsService.saveCalendarConfig(instId, academicYearId, workingDaysOfWeek, actorId);
      sendSuccess(res, saved, 'Calendar working week configuration saved');
    } catch (error) {
      next(error);
    }
  }

  async getCalendarDays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string;

      if (!academicYearId) {
        sendError(res, 'academicYearId query parameter is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const days = await academicsService.getCalendarDays(instId, academicYearId);
      sendSuccess(res, days);
    } catch (error) {
      next(error);
    }
  }

  async createCalendarDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { academicYearId, date, dayType, description, isWorkingDay } = req.body;

      if (!academicYearId || !date || !dayType) {
        sendError(res, 'academicYearId, date, and dayType are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const created = await academicsService.createCalendarDay(
        instId,
        { academicYearId, date, dayType, description, isWorkingDay },
        actorId
      );
      sendSuccess(res, created, 'Calendar schedule day configured successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteCalendarDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const deleted = await academicsService.deleteCalendarDay(instId, id, actorId);
      sendSuccess(res, deleted, 'Calendar schedule day removed');
    } catch (error) {
      next(error);
    }
  }

  async checkWorkingDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string;
      const date = req.query.date as string;

      if (!academicYearId || !date) {
        sendError(res, 'academicYearId and date query parameters are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const status = await academicsService.isWorkingDay(instId, academicYearId, date);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }

  async getWorkingDaysCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (!academicYearId) {
        sendError(res, 'academicYearId query parameter is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const count = await academicsService.getWorkingDaysCount(instId, academicYearId, startDate, endDate);
      sendSuccess(res, count);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // PREFERRED TEXTBOOKS (A1)
  // =========================================================================

  async getTextbooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string;
      const classId = req.query.classId as string | undefined;
      const subjectId = req.query.subjectId as string | undefined;

      if (!academicYearId) {
        sendError(res, 'academicYearId query parameter is required', 400, 'VALIDATION_ERROR');
        return;
      }

      const books = await academicsService.getTextbooks(instId, academicYearId, classId, subjectId);
      sendSuccess(res, books);
    } catch (error) {
      next(error);
    }
  }

  async createTextbook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const { academicYearId, classId, subjectId, title, author, publisher, edition, isbn, price, isMandatory, notes } = req.body;

      if (!academicYearId || !classId || !subjectId || !title || !author || !publisher) {
        sendError(res, 'academicYearId, classId, subjectId, title, author, and publisher are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const created = await academicsService.createTextbook(
        instId,
        { academicYearId, classId, subjectId, title, author, publisher, edition, isbn, price, isMandatory, notes },
        actorId
      );
      sendSuccess(res, created, 'Preferred textbook added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTextbook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;
      const { title, author, publisher, edition, isbn, price, isMandatory, notes } = req.body;

      const updated = await academicsService.updateTextbook(
        instId,
        id,
        { title, author, publisher, edition, isbn, price, isMandatory, notes },
        actorId
      );
      sendSuccess(res, updated, 'Preferred textbook updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteTextbook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const actorId = (req as any).user?.id || 'system';
      const id = req.params.id as string;

      const deleted = await academicsService.deleteTextbook(instId, id, actorId);
      sendSuccess(res, deleted, 'Preferred textbook removed');
    } catch (error) {
      next(error);
    }
  }

  async getBooklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const academicYearId = req.query.academicYearId as string;
      const classId = req.query.classId as string;

      if (!academicYearId || !classId) {
        sendError(res, 'academicYearId and classId query parameters are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const booklist = await academicsService.getBooklist(instId, academicYearId, classId);
      sendSuccess(res, booklist);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // DEPARTMENTS & ALLOCATIONS (PRESERVED)
  // =========================================================================

  async getHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const hierarchy = await academicsService.getHierarchy(instId);
      sendSuccess(res, hierarchy);
    } catch (error) {
      next(error);
    }
  }

  async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const type = req.query.type as string | undefined;
      const depts = await academicsService.getDepartments(instId, type);
      sendSuccess(res, depts);
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name, code, departmentType } = req.body;
      const created = await academicsService.createDepartment(instId, { name, code, departmentType });
      sendSuccess(res, created, 'Department created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAllocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const allocations = await academicsService.getAllocations(instId);
      sendSuccess(res, allocations);
    } catch (error) {
      next(error);
    }
  }

  async createAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { staffId, sectionId, subjectId, academicYearId } = req.body;
      const created = await academicsService.createAllocation(instId, { staffId, sectionId, subjectId, academicYearId });
      sendSuccess(res, created, 'Faculty allocation created', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const academicsController = new AcademicsController();
