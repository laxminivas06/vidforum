import { Request, Response, NextFunction } from 'express';
import { admissionsService } from './admissions.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AdmissionsController {
  // Enquiries
  async getEnquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enquiries = await admissionsService.getEnquiries(req.institutionId!, {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
      });
      sendSuccess(res, enquiries);
    } catch (error) { next(error); }
  }

  async createEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { applicantName, contactName, contactPhone, dateOfBirth, gender, gradeApplying, classId, academicYearId, contactEmail, source, notes } = req.body;
      if (!applicantName || !contactName || !contactPhone) {
        sendError(res, 'applicantName, contactName, contactPhone are required', 400);
        return;
      }
      const enquiry = await admissionsService.createEnquiry(req.institutionId!, {
        applicantName, contactName, contactPhone, dateOfBirth, gender,
        gradeApplying, classId, academicYearId, contactEmail, source, notes,
      });
      sendSuccess(res, enquiry, 'Enquiry recorded successfully', 201);
    } catch (error) { next(error); }
  }

  async convertEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { classId, academicYearId } = req.body;
      if (!classId || !academicYearId) { sendError(res, 'classId and academicYearId required', 400); return; }
      const app = await admissionsService.convertToApplication(id, req.institutionId!, classId, academicYearId);
      sendSuccess(res, app, 'Enquiry converted to application');
    } catch (error) { next(error); }
  }

  // Applications
  async getApplicants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applicants = await admissionsService.getApplicants(req.institutionId!, {
        search: req.query.search as string | undefined,
        stage: req.query.stage as string | undefined,
        classId: req.query.classId as string | undefined,
      });
      sendSuccess(res, applicants);
    } catch (error) { next(error); }
  }

  async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const application = await admissionsService.getApplicationById(req.params.id as string, req.institutionId!);
      sendSuccess(res, application);
    } catch (error) { next(error); }
  }

  async createApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { applicantName, dateOfBirth, gender, classId, gradeApplying, academicYearId, guardianName, guardianPhone, guardianEmail, stage, notes, entranceScore, enquiryId, feeAmount, feeStatus, feePaid } = req.body;
      if (!applicantName) {
        sendError(res, 'applicantName is required', 400);
        return;
      }
      const resolvedFeeStatus = feeStatus || (feePaid === true ? 'paid' : 'unpaid');
      const created = await admissionsService.createApplication(req.institutionId!, {
        applicantName, dateOfBirth, gender, classId, gradeApplying, academicYearId,
        guardianName, guardianPhone, guardianEmail, stage, notes, entranceScore, enquiryId,
        feeAmount: feeAmount !== undefined ? Number(feeAmount) : 0,
        feeStatus: resolvedFeeStatus,
      });
      sendSuccess(res, created, 'Application submitted successfully', 201);
    } catch (error) { next(error); }
  }

  async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applicants = req.body.applicants || req.body.rows || req.body;
      if (!Array.isArray(applicants) || applicants.length === 0) {
        sendError(res, 'An array of applicants is required', 400);
        return;
      }
      const defaultAcademicYearId = req.body.academicYearId;
      const report = await admissionsService.bulkImport(req.institutionId!, applicants, defaultAcademicYearId, req.user?.id);
      sendSuccess(res, report, `Bulk import processed: ${report.succeeded} succeeded, ${report.failed} failed`);
    } catch (error) { next(error); }
  }

  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stage } = req.body;
      if (!stage) { sendError(res, 'Stage is required', 400); return; }
      const actorId = req.user?.id;
      const updated = await admissionsService.updateStage(req.params.id as string, stage, actorId);
      sendSuccess(res, updated, `Application stage updated to ${stage}`);
    } catch (error) { next(error); }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await admissionsService.approveApplication(req.params.id as string, req.institutionId!, req.user?.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async getPipelineStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await admissionsService.getPipelineStats(req.institutionId!);
      sendSuccess(res, stats);
    } catch (error) { next(error); }
  }

  // Documents
  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await admissionsService.getAdmissionDocuments(req.institutionId!, {
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
      });
      sendSuccess(res, documents);
    } catch (error) { next(error); }
  }

  async updateDocumentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!status) { sendError(res, 'Status is required (pending, verified, rejected)', 400); return; }
      const doc = await admissionsService.updateDocumentStatus(req.params.id as string, req.institutionId!, status, req.user?.id);
      sendSuccess(res, doc, `Document marked as ${status}`);
    } catch (error) { next(error); }
  }

  async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, storageKey, status } = req.body;
      if (!documentType) { sendError(res, 'documentType is required', 400); return; }
      const doc = await admissionsService.addAdmissionDocument(req.institutionId!, req.params.id as string, {
        documentType,
        storageKey,
        status: status || 'pending',
      });
      sendSuccess(res, doc, 'Document attached successfully', 201);
    } catch (error) { next(error); }
  }

  // Enrolled Students
  async getEnrolled(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await admissionsService.getEnrolledStudents(req.institutionId!, {
        search: req.query.search as string | undefined,
        classId: req.query.classId as string | undefined,
      });
      sendSuccess(res, students);
    } catch (error) { next(error); }
  }
}

export const admissionsController = new AdmissionsController();
