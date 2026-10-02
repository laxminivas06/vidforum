import { Request, Response, NextFunction } from 'express';
import { academicsService } from './academics.service';
import { sendSuccess } from '../../utils/api-response';

export class AcademicsController {
  async getGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const grades = await academicsService.getAcademicGrades(instId);
      sendSuccess(res, grades);
    } catch (error) {
      next(error);
    }
  }

  async getHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const hierarchy = await academicsService.getHierarchy(instId);
      sendSuccess(res, hierarchy);
    } catch (error) {
      next(error);
    }
  }

  async getAcademicYears(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const years = await academicsService.getAcademicYears(instId);
      sendSuccess(res, years);
    } catch (error) {
      next(error);
    }
  }

  async createAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name, startDate, endDate, isCurrent } = req.body;
      const created = await academicsService.createAcademicYear(instId, { name, startDate, endDate, isCurrent });
      sendSuccess(res, created, 'Academic year created', 201);
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

  async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const classes = await academicsService.getHierarchy(instId);
      sendSuccess(res, classes.classes);
    } catch (error) {
      next(error);
    }
  }

  async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name, academicYearId, departmentId, sequenceOrder } = req.body;
      const created = await academicsService.createClass(instId, { name, academicYearId, departmentId, sequenceOrder });
      sendSuccess(res, created, 'Class created', 201);
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
      const classId = req.params.classId as string;
      const { name, capacity, classTeacherStaffId } = req.body;
      const created = await academicsService.createSection(instId, classId, { name, capacity, classTeacherStaffId });
      sendSuccess(res, created, 'Section created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getClassSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = req.params.classId as string;
      const subjects = await academicsService.getClassSubjects(classId);
      sendSuccess(res, subjects);
    } catch (error) {
      next(error);
    }
  }

  async getSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const hierarchy = await academicsService.getHierarchy(instId);
      sendSuccess(res, hierarchy.subjects);
    } catch (error) {
      next(error);
    }
  }

  async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instId = req.institutionId!;
      const { name, code, isElective } = req.body;
      const created = await academicsService.createSubject(instId, { name, code, isElective });
      sendSuccess(res, created, 'Subject created', 201);
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
