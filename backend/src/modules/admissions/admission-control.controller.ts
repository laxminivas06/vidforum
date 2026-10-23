import { Request, Response, NextFunction } from 'express';
import { admissionControlRepository } from './admission-control.repository';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AdmissionControlController {
  // 1. Admission Configurations (Module 3)
  async getAdmissionConfigurations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await admissionControlRepository.listAdmissionConfigurations(
        req.institutionId!,
        req.query.academicYearId as string | undefined
      );
      sendSuccess(res, configs);
    } catch (err) { next(err); }
  }

  async saveAdmissionConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { academicConfigurationId, requiresExam, examinationName, maxMarks, passingMarks, cutoffMarks, examDate, status, displayOrder } = req.body;
      if (!academicConfigurationId) {
        sendError(res, 'academicConfigurationId is required', 400);
        return;
      }
      const config = await admissionControlRepository.upsertAdmissionConfiguration(req.institutionId!, {
        academicConfigurationId, requiresExam, examinationName, maxMarks, passingMarks, cutoffMarks, examDate, status, displayOrder
      });
      sendSuccess(res, config, 'Admission rule saved successfully');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to save admission configuration', 400);
    }
  }

  // 2. Admission Fee Policy & Custom Rates (Module 4)
  async getFeePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const academicYearId = req.query.academicYearId as string;
      if (!academicYearId) {
        sendError(res, 'academicYearId query parameter is required', 400);
        return;
      }
      const policy = await admissionControlRepository.getFeePolicy(req.institutionId!, academicYearId);
      sendSuccess(res, policy);
    } catch (err) { next(err); }
  }

  async saveFeePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { academicYearId, policyType, pricingMethod, flatAmount, effectiveFrom, effectiveTo, isActive } = req.body;
      if (!academicYearId || !policyType || !pricingMethod) {
        sendError(res, 'academicYearId, policyType, and pricingMethod are required', 400);
        return;
      }
      const policy = await admissionControlRepository.saveFeePolicy(req.institutionId!, {
        academicYearId, policyType, pricingMethod, flatAmount, effectiveFrom, effectiveTo, isActive
      });
      sendSuccess(res, policy, 'Admission fee policy saved successfully');
    } catch (err) { next(err); }
  }

  async getCustomFeeRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policyId = req.query.policyId as string;
      if (!policyId) {
        sendError(res, 'policyId is required', 400);
        return;
      }
      const rates = await admissionControlRepository.getCustomRates(req.institutionId!, policyId);
      sendSuccess(res, rates);
    } catch (err) { next(err); }
  }

  async saveCustomFeeRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { policyId, rates } = req.body;
      if (!policyId || !Array.isArray(rates)) {
        sendError(res, 'policyId and rates array are required', 400);
        return;
      }
      const saved = await admissionControlRepository.saveCustomRates(req.institutionId!, policyId, rates);
      sendSuccess(res, saved, 'Custom admission fee rates updated successfully');
    } catch (err) { next(err); }
  }

  async calculateFee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { academicConfigurationId, academicYearId } = req.query;
      if (!academicConfigurationId || !academicYearId) {
        sendError(res, 'academicConfigurationId and academicYearId required', 400);
        return;
      }
      const fee = await admissionControlRepository.calculateAdmissionFee(
        req.institutionId!,
        String(academicConfigurationId),
        String(academicYearId)
      );
      sendSuccess(res, { admissionFee: fee });
    } catch (err) { next(err); }
  }

  // 3. Temporary Admissions (Module 7 & 8)
  async getTemporaryAdmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await admissionControlRepository.listTemporaryAdmissions(req.institutionId!, {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        academicYearId: req.query.academicYearId as string | undefined,
      });
      sendSuccess(res, list);
    } catch (err) { next(err); }
  }

  async getTemporaryAdmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await admissionControlRepository.getTemporaryAdmissionById(req.institutionId!, String(req.params.id));
      if (!item) {
        sendError(res, 'Temporary admission record not found', 404);
        return;
      }
      sendSuccess(res, item);
    } catch (err) { next(err); }
  }

  async createTemporaryAdmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        studentName, 
        contactNumber, 
        parentName, 
        email, 
        dateOfBirth, 
        gender, 
        preliminaryAddress, 
        academicYearId, 
        academicConfigurationId, 
        admissionConfigId 
      } = req.body;
      if (!studentName || !contactNumber || !parentName || !academicYearId || !academicConfigurationId) {
        sendError(res, 'studentName, contactNumber, parentName, academicYearId, and academicConfigurationId are required', 400);
        return;
      }
      const record = await admissionControlRepository.createTemporaryAdmission(
        req.institutionId!,
        { 
          studentName, 
          contactNumber, 
          parentName, 
          email, 
          dateOfBirth, 
          gender, 
          preliminaryAddress, 
          academicYearId, 
          academicConfigurationId, 
          admissionConfigId 
        },
        req.user?.id
      );
      sendSuccess(res, record, 'Temporary admission created with sequential number', 201);
    } catch (err) { next(err); }
  }

  async bulkRecordExamResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { marks } = req.body;
      if (!Array.isArray(marks)) {
        sendError(res, 'marks array is required', 400);
        return;
      }
      const results = await admissionControlRepository.bulkRecordExamResults(
        req.institutionId!,
        marks,
        req.user?.id
      );
      sendSuccess(res, results, `Evaluated and recorded marks for ${results.length} applicants`);
    } catch (err) { next(err); }
  }

  async recordExamResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { examName, maxMarks, marksObtained, passingMarks, cutoffMarks, notes } = req.body;
      if (!examName || marksObtained === undefined || maxMarks === undefined || cutoffMarks === undefined) {
        sendError(res, 'examName, maxMarks, marksObtained, and cutoffMarks are required', 400);
        return;
      }
      const result = await admissionControlRepository.recordExamResult(
        req.institutionId!,
        String(req.params.id),
        {
          examName,
          maxMarks: Number(maxMarks),
          marksObtained: Number(marksObtained),
          passingMarks: Number(passingMarks || 40),
          cutoffMarks: Number(cutoffMarks),
          notes,
        },
        req.user?.id
      );
      sendSuccess(res, result, 'Exam result evaluated against cutoff marks');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to record exam result', 400);
    }
  }

  async reviewExamResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { decision, notes } = req.body;
      if (!decision || !['approved', 'rejected'].includes(decision)) {
        sendError(res, 'decision must be "approved" or "rejected"', 400);
        return;
      }
      const reviewed = await admissionControlRepository.reviewExamResult(
        req.institutionId!,
        String(req.params.id),
        decision,
        notes,
        req.user?.id
      );
      sendSuccess(res, reviewed, `Candidate examination decision: ${decision}`);
    } catch (err) { next(err); }
  }

  // 4. Permanent Admissions (Module 9, 11, 12)
  async getNextPermanentAdmissionNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const number = await admissionControlRepository.generatePermanentAdmissionNumber(req.institutionId!);
      sendSuccess(res, { permanentAdmissionNumber: number });
    } catch (err) { next(err); }
  }

  async completePermanentAdmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { temporaryAdmissionId, studentDetails, parents, academicYearId, academicConfigurationId, admissionFeeAmount, payment } = req.body;
      if (!studentDetails?.firstName || !studentDetails?.lastName || !studentDetails?.dateOfBirth || !academicYearId || !academicConfigurationId) {
        sendError(res, 'studentDetails (firstName, lastName, dateOfBirth), academicYearId, and academicConfigurationId are required', 400);
        return;
      }
      const result = await admissionControlRepository.completePermanentAdmission(
        req.institutionId!,
        {
          temporaryAdmissionId,
          studentDetails,
          parents: parents || [],
          academicYearId,
          academicConfigurationId,
          admissionFeeAmount: Number(admissionFeeAmount || 0),
          payment,
        },
        req.user?.id
      );
      sendSuccess(res, result, 'Permanent admission enrolled successfully with student master record', 201);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to complete permanent admission', 400);
    }
  }

  async listPermanentAdmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await admissionControlRepository.listPermanentAdmissions(req.institutionId!, {
        search: req.query.search as string | undefined,
        academicYearId: req.query.academicYearId as string | undefined,
      });
      sendSuccess(res, list);
    } catch (err) { next(err); }
  }

  // 5. Payments (Module 11)
  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await admissionControlRepository.listPayments(req.institutionId!, {
        search: req.query.search as string | undefined,
        paymentMode: req.query.paymentMode as string | undefined,
      });
      sendSuccess(res, payments);
    } catch (err) { next(err); }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!status || !['verified', 'failed'].includes(status)) {
        sendError(res, 'status must be "verified" or "failed"', 400);
        return;
      }
      const result = await admissionControlRepository.verifyPayment(req.institutionId!, String(req.params.id), status, req.user?.id);
      sendSuccess(res, result, `Payment marked as ${status}`);
    } catch (err) { next(err); }
  }

  // 6. Supporting Documents (Module 10)
  async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const docs = await admissionControlRepository.listDocuments(
        req.institutionId!,
        req.query.studentId as string | undefined
      );
      sendSuccess(res, docs);
    } catch (err) { next(err); }
  }

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, documentType, documentName, fileStorageKey, fileUrl, fileSize, fileMime, aadhaarNumber } = req.body;
      if (!studentId || !documentType || !documentName) {
        sendError(res, 'studentId, documentType, and documentName are required', 400);
        return;
      }
      const doc = await admissionControlRepository.uploadDocument(
        req.institutionId!,
        { studentId, documentType, documentName, fileStorageKey, fileUrl, fileSize, fileMime, aadhaarNumber },
        req.user?.id
      );
      sendSuccess(res, doc, 'Document uploaded successfully', 201);
    } catch (err) { next(err); }
  }

  async verifyDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!status || !['verified', 'rejected'].includes(status)) {
        sendError(res, 'status must be "verified" or "rejected"', 400);
        return;
      }
      const doc = await admissionControlRepository.verifyDocument(req.institutionId!, String(req.params.id), status, req.user?.id);
      sendSuccess(res, doc, `Document status updated to ${status}`);
    } catch (err) { next(err); }
  }

  // =========================================================================
  // INSTITUTE SETTINGS / SYSTEM CONFIGURATION (FOUNDATIONAL RULES)
  // =========================================================================

  async getSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await admissionControlRepository.getSystemSettings(req.institutionId!);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async saveSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const saved = await admissionControlRepository.saveSystemSettings(req.institutionId!, req.body);
      sendSuccess(res, saved, 'Institute settings saved successfully');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to save institute settings', 400);
    }
  }
}

export const admissionControlController = new AdmissionControlController();
