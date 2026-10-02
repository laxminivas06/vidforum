import { Request, Response } from 'express';
import { z } from 'zod';
import { DocumentsService } from './documents.service';
import { sendSuccess, sendError } from '../../utils/api-response';

const createTypeSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
});

const uploadDocumentSchema = z.object({
  documentTypeId: z.string().uuid(),
  ownerType: z.enum(['student', 'staff', 'institution', 'admission']),
  ownerId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(3),
  fileSize: z.number().int().nonnegative().optional(),
  storageKey: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const verifyDocumentSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  remarks: z.string().optional(),
});

const createTemplateSchema = z.object({
  documentTypeId: z.string().uuid(),
  name: z.string().min(2),
  templateStorageKey: z.string().optional(),
  templateBody: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(2).optional(),
  templateStorageKey: z.string().optional(),
  templateBody: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

const bonafideSchema = z.object({
  studentId: z.string().uuid(),
  purpose: z.string().optional(),
});

const transferCertSchema = z.object({
  studentId: z.string().uuid(),
  reason: z.string().optional(),
  conduct: z.string().optional(),
  remarks: z.string().optional(),
  promotedToClass: z.string().optional(),
});

const requestDocumentSchema = z.object({
  requestedForType: z.enum(['student', 'staff']),
  requestedForId: z.string().uuid(),
  documentTypeId: z.string().uuid(),
  remarks: z.string().optional(),
});

const processRequestSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  remarks: z.string().optional(),
  issuedDocumentId: z.string().uuid().optional(),
});

function paramToStr(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

export class DocumentsController {
  private getService(req: Request): DocumentsService {
    const institutionId = req.institutionId || (req.user as any)?.institution_id || req.headers['x-institution-id'];
    if (!institutionId) {
      throw new Error('Tenant context required');
    }
    return new DocumentsService(Array.isArray(institutionId) ? institutionId[0] : (institutionId as string));
  }

  private getActor(req: Request) {
    const instId = req.institutionId || (req.user as any)?.institution_id || '';
    return {
      id: req.user?.id || 'system',
      role: req.user?.role || 'ANONYMOUS',
      institutionId: Array.isArray(instId) ? instId[0] : (instId as string),
      profileId: (req.user as any)?.profile_id || req.user?.id,
    };
  }

  // ==========================================
  // DOCUMENT TYPES
  // ==========================================
  listTypes = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const types = await service.listDocumentTypes();
      sendSuccess(res, types);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  createType = async (req: Request, res: Response) => {
    try {
      const parsed = createTypeSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const created = await service.createDocumentType(parsed, actor);
      sendSuccess(res, created, 'Document type created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  // ==========================================
  // DOCUMENTS VAULT
  // ==========================================
  upload = async (req: Request, res: Response) => {
    try {
      const parsed = uploadDocumentSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const doc = await service.uploadDocument(parsed, actor);
      sendSuccess(res, doc, 'Document uploaded and registered in vault', 201);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const actor = this.getActor(req);
      const doc = await service.getDocument(paramToStr(req.params.id), actor);
      sendSuccess(res, doc);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const actor = this.getActor(req);
      const filters = {
        ownerType: paramToStr(req.query.ownerType as any),
        ownerId: paramToStr(req.query.ownerId as any),
        documentTypeId: paramToStr(req.query.documentTypeId as any),
        status: paramToStr(req.query.status as any),
        search: paramToStr(req.query.search as any),
        limit: req.query.limit ? parseInt(paramToStr(req.query.limit as any), 10) : undefined,
        offset: req.query.offset ? parseInt(paramToStr(req.query.offset as any), 10) : undefined,
      };
      const result = await service.listDocuments(filters, actor);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const actor = this.getActor(req);
      await service.deleteDocument(paramToStr(req.params.id), actor);
      sendSuccess(res, { deleted: true }, 'Document removed from vault');
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  // ==========================================
  // VERIFICATION WORKFLOW
  // ==========================================
  verify = async (req: Request, res: Response) => {
    try {
      const parsed = verifyDocumentSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const verification = await service.verifyDocument(paramToStr(req.params.id), parsed.status, parsed.remarks, actor);
      sendSuccess(res, verification, `Document marked as ${parsed.status}`);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  verificationHistory = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const actor = this.getActor(req);
      const history = await service.getVerificationHistory(paramToStr(req.params.id), actor);
      sendSuccess(res, history);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  // ==========================================
  // TEMPLATES
  // ==========================================
  createTemplate = async (req: Request, res: Response) => {
    try {
      const parsed = createTemplateSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const template = await service.createTemplate(parsed, actor);
      sendSuccess(res, template, 'Document template created', 201);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  listTemplates = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const docTypeId = paramToStr(req.query.documentTypeId as any);
      const templates = await service.listTemplates(docTypeId || undefined);
      sendSuccess(res, templates);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  getTemplate = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const template = await service.getTemplate(paramToStr(req.params.id));
      sendSuccess(res, template);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  updateTemplate = async (req: Request, res: Response) => {
    try {
      const parsed = updateTemplateSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const updated = await service.updateTemplate(paramToStr(req.params.id), parsed, actor);
      sendSuccess(res, updated, 'Document template updated');
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  deleteTemplate = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const actor = this.getActor(req);
      await service.deleteTemplate(paramToStr(req.params.id), actor);
      sendSuccess(res, { deleted: true }, 'Document template deleted');
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  // ==========================================
  // CERTIFICATE GENERATION
  // ==========================================
  generateBonafide = async (req: Request, res: Response) => {
    try {
      const parsed = bonafideSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const certificate = await service.generateBonafideCertificate(parsed.studentId, parsed.purpose, actor);
      sendSuccess(res, certificate, 'Bonafide certificate generated with QR verification');
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  generateTransferCertificate = async (req: Request, res: Response) => {
    try {
      const parsed = transferCertSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const certificate = await service.generateTransferCertificate(parsed.studentId, parsed, actor);
      sendSuccess(res, certificate, 'Transfer Certificate generated with QR verification');
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  // ==========================================
  // DOCUMENT REQUESTS
  // ==========================================
  createRequest = async (req: Request, res: Response) => {
    try {
      const parsed = requestDocumentSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const request = await service.requestDocument(parsed, actor);
      sendSuccess(res, request, 'Document request submitted successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };

  listRequests = async (req: Request, res: Response) => {
    try {
      const service = this.getService(req);
      const actor = this.getActor(req);
      const filters = {
        status: paramToStr(req.query.status as any),
        requestedForType: paramToStr(req.query.requestedForType as any),
        requestedForId: paramToStr(req.query.requestedForId as any),
      };
      const requests = await service.listDocumentRequests(filters, actor);
      sendSuccess(res, requests);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 500, err.code);
    }
  };

  processRequest = async (req: Request, res: Response) => {
    try {
      const parsed = processRequestSchema.parse(req.body);
      const service = this.getService(req);
      const actor = this.getActor(req);
      const processed = await service.processDocumentRequest(
        paramToStr(req.params.id),
        parsed.status,
        parsed.remarks,
        parsed.issuedDocumentId,
        actor
      );
      sendSuccess(res, processed, `Document request ${parsed.status}`);
    } catch (err: any) {
      sendError(res, err.message, err.statusCode || 400, err.code);
    }
  };
}

export const documentsController = new DocumentsController();
