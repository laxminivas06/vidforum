import crypto from 'crypto';
import {
  DocumentsRepository,
  DocumentRecord,
  DocumentTypeRecord,
  DocumentTemplateRecord,
  DocumentVerificationRecord,
  DocumentRequestRecord,
} from './documents.repository';
import { AuditDispatcher } from '../../common/audit-dispatcher';
import { notificationService } from '../notifications/notification.service';
import { AppError } from '../../common/error-format';
import { db } from '../../config/database';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export interface ActorContext {
  id: string;
  role: string;
  institutionId: string;
  profileId?: string;
}

export class DocumentsService {
  private repo: DocumentsRepository;

  constructor(institutionId: string) {
    this.repo = new DocumentsRepository(institutionId);
  }

  // ==========================================
  // DOCUMENT TYPES (Catalog)
  // ==========================================
  async listDocumentTypes(): Promise<DocumentTypeRecord[]> {
    return this.repo.listDocumentTypes();
  }

  async getDocumentType(id: string): Promise<DocumentTypeRecord> {
    const docType = await this.repo.getDocumentTypeById(id);
    if (!docType) {
      throw new AppError('Document type not found', 404, 'NOT_FOUND');
    }
    return docType;
  }

  async createDocumentType(
    data: { code: string; name: string },
    actor: ActorContext
  ): Promise<DocumentTypeRecord> {
    const normalizedCode = data.code.toLowerCase().trim().replace(/\s+/g, '_');
    const created = await this.repo.createDocumentType({
      code: normalizedCode,
      name: data.name.trim(),
    });

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.type_created',
      resource: 'document_types',
      resourceId: created.id,
      newValue: { code: created.code, name: created.name },
    });

    return created;
  }

  // ==========================================
  // DOCUMENT UPLOAD & VAULT
  // ==========================================
  async uploadDocument(
    data: {
      documentTypeId: string;
      ownerType: 'student' | 'staff' | 'institution' | 'admission';
      ownerId: string;
      fileName: string;
      mimeType: string;
      fileSize?: number;
      storageKey?: string;
      metadata?: Record<string, any>;
    },
    actor: ActorContext
  ): Promise<DocumentRecord> {
    // 1. Verify MIME type against security whitelist
    if (!ALLOWED_MIME_TYPES.has(data.mimeType)) {
      throw new AppError(
        `Unsupported document format '${data.mimeType}'. Allowed: PDF, JPEG, PNG, DOC, DOCX`,
        400,
        'INVALID_MIME_TYPE'
      );
    }

    // 2. Verify Document Type exists
    const docType = await this.repo.getDocumentTypeById(data.documentTypeId);
    if (!docType) {
      throw new AppError('Document type does not exist', 404, 'DOCUMENT_TYPE_NOT_FOUND');
    }

    // 3. Verify Owner existence in this institution
    if (data.ownerType === 'student') {
      const studentExists = await this.repo.verifyStudentExists(data.ownerId);
      if (!studentExists) {
        throw new AppError('Target student not found in this institution', 404, 'STUDENT_NOT_FOUND');
      }
    } else if (data.ownerType === 'staff') {
      const staffExists = await this.repo.verifyStaffExists(data.ownerId);
      if (!staffExists) {
        throw new AppError('Target staff not found in this institution', 404, 'STAFF_NOT_FOUND');
      }
    }

    // 4. Generate structured canonical storage key if not provided
    const safeFileName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const canonicalStorageKey =
      data.storageKey ||
      `${actor.institutionId}/documents/${data.ownerType}/${data.ownerId}/${Date.now()}-${safeFileName}`;

    // 5. Create Document record in vault
    const document = await this.repo.createDocument({
      documentTypeId: data.documentTypeId,
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      storageKey: canonicalStorageKey,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize || 0,
      uploadedBy: actor.profileId || actor.id,
      metadata: data.metadata || {},
    });

    // 6. Audit Dispatch
    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.uploaded',
      resource: 'documents',
      resourceId: document.id,
      newValue: {
        documentTypeId: data.documentTypeId,
        documentTypeCode: docType.code,
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        fileName: data.fileName,
        storageKey: canonicalStorageKey,
      },
    });

    return document;
  }

  async getDocument(id: string, actor: ActorContext): Promise<DocumentRecord> {
    const doc = await this.repo.findDocumentById(id);
    if (!doc || doc.deletedAt) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Enforce role-based access scoping
    await this.assertDocumentAccess(doc, actor);

    return doc;
  }

  async listDocuments(
    filters: {
      ownerType?: string;
      ownerId?: string;
      documentTypeId?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
    actor: ActorContext
  ): Promise<{ documents: DocumentRecord[]; total: number }> {
    const scopedFilters = { ...filters };

    if (actor.role === 'STUDENT' || actor.role === 'Student') {
      scopedFilters.ownerType = 'student';
      scopedFilters.ownerId = actor.id;
    } else if (actor.role === 'PARENT' || actor.role === 'Parent') {
      scopedFilters.ownerType = 'student';
      if (!scopedFilters.ownerId) {
        throw new AppError('Parent must specify child studentId for documents retrieval', 400, 'STUDENT_ID_REQUIRED');
      }
      const isLinked = await this.repo.verifyParentChildLink(actor.id, scopedFilters.ownerId);
      if (!isLinked) {
        throw new AppError('Access denied: Can only view documents for linked children (Rule 9)', 403, 'RESOURCE_ACCESS_DENIED');
      }
    }

    return this.repo.listDocuments(scopedFilters);
  }

  async deleteDocument(id: string, actor: ActorContext): Promise<{ success: boolean }> {
    const doc = await this.repo.findDocumentById(id);
    if (!doc || doc.deletedAt) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    const isAdmin =
      actor.role === 'SUPER_ADMIN' ||
      actor.role === 'INSTITUTION_ADMIN' ||
      actor.role === 'Super Admin' ||
      actor.role === 'Institution Admin';

    if (!isAdmin && doc.uploadedBy !== actor.id && doc.uploadedBy !== actor.profileId) {
      throw new AppError('Access denied: Cannot delete documents uploaded by others', 403, 'RESOURCE_ACCESS_DENIED');
    }

    const deleted = await this.repo.softDeleteDocument(id);
    if (!deleted) {
      throw new AppError('Failed to delete document', 500, 'DELETE_FAILED');
    }

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.deleted',
      resource: 'documents',
      resourceId: id,
      newValue: { fileName: doc.fileName, ownerType: doc.ownerType, ownerId: doc.ownerId },
    });

    return { success: true };
  }

  // ==========================================
  // DOCUMENT VERIFICATION WORKFLOW
  // ==========================================
  async verifyDocument(
    documentId: string,
    status: 'verified' | 'rejected',
    remarks: string | undefined,
    actor: ActorContext
  ): Promise<DocumentVerificationRecord> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    const verification = await this.repo.verifyDocument(
      documentId,
      status,
      actor.profileId || actor.id,
      remarks
    );

    // Audit Dispatch
    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: status === 'verified' ? 'documents.verified' : 'documents.rejected',
      resource: 'documents',
      resourceId: documentId,
      newValue: {
        documentId,
        fileName: doc.fileName,
        status,
        remarks: remarks || null,
      },
    });

    // Notify document owner if student
    if (doc.ownerType === 'student') {
      try {
        const studentProfile = await db.query(
          `SELECT u.id as profile_id FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = $1`,
          [doc.ownerId]
        );
        const recipientUserId = studentProfile.rows[0]?.profile_id || doc.ownerId;

        await notificationService.sendNotification({
          institutionId: actor.institutionId,
          recipientUserId,
          title: `Document ${status.toUpperCase()}: ${doc.fileName}`,
          message:
            status === 'verified'
              ? `Your document '${doc.fileName}' has been verified successfully.`
              : `Your document '${doc.fileName}' was rejected. Reason: ${remarks || 'Needs resubmission'}.`,
          type: 'document_verification',
        });
      } catch (err) {
        // notification non-blocking
      }
    }

    return verification;
  }

  async getVerificationHistory(documentId: string, actor: ActorContext): Promise<DocumentVerificationRecord[]> {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc || doc.deletedAt) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }
    await this.assertDocumentAccess(doc, actor);
    return this.repo.getVerificationHistory(documentId);
  }

  // ==========================================
  // DOCUMENT TEMPLATES
  // ==========================================
  async createTemplate(
    data: {
      documentTypeId: string;
      name: string;
      templateStorageKey?: string;
      templateBody?: string;
      variables?: string[];
    },
    actor: ActorContext
  ): Promise<DocumentTemplateRecord> {
    const docType = await this.repo.getDocumentTypeById(data.documentTypeId);
    if (!docType) {
      throw new AppError('Document type not found', 404, 'DOCUMENT_TYPE_NOT_FOUND');
    }

    const storageKey =
      data.templateStorageKey ||
      `${actor.institutionId}/templates/${docType.code}/${Date.now()}-${data.name.replace(/\s+/g, '_')}`;

    const template = await this.repo.createTemplate({
      documentTypeId: data.documentTypeId,
      name: data.name,
      templateStorageKey: storageKey,
      templateBody: data.templateBody,
      variables: data.variables,
    });

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.template_created',
      resource: 'document_templates',
      resourceId: template.id,
      newValue: { name: template.name, documentTypeId: template.documentTypeId },
    });

    return template;
  }

  async listTemplates(documentTypeId?: string): Promise<DocumentTemplateRecord[]> {
    return this.repo.listTemplates(documentTypeId);
  }

  async getTemplate(id: string): Promise<DocumentTemplateRecord> {
    const template = await this.repo.findTemplateById(id);
    if (!template) {
      throw new AppError('Document template not found', 404, 'TEMPLATE_NOT_FOUND');
    }
    return template;
  }

  async updateTemplate(
    id: string,
    data: Partial<{
      name: string;
      templateStorageKey: string;
      templateBody: string;
      variables: string[];
    }>,
    actor: ActorContext
  ): Promise<DocumentTemplateRecord> {
    const updated = await this.repo.updateTemplate(id, data);
    if (!updated) {
      throw new AppError('Document template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.template_updated',
      resource: 'document_templates',
      resourceId: id,
      newValue: data,
    });

    return updated;
  }

  async deleteTemplate(id: string, actor: ActorContext): Promise<{ success: boolean }> {
    const deleted = await this.repo.deleteTemplate(id);
    if (!deleted) {
      throw new AppError('Document template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.template_deleted',
      resource: 'document_templates',
      resourceId: id,
    });

    return { success: true };
  }

  // ==========================================
  // CERTIFICATE GENERATION ENGINE (QR & Verification)
  // ==========================================
  async generateBonafideCertificate(
    studentId: string,
    purpose: string = 'General Educational Purpose',
    actor: ActorContext
  ): Promise<any> {
    const student = await this.repo.getStudentCertificateDetails(studentId);
    if (!student) {
      throw new AppError('Student not found for certificate generation', 404, 'STUDENT_NOT_FOUND');
    }

    let docType = await this.repo.getDocumentTypeByCode('bonafide');
    if (!docType) {
      docType = await this.repo.createDocumentType({ code: 'bonafide', name: 'Bonafide Certificate' });
    }

    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const certificateId = `BONA-${student.institutionCode || 'VID'}-${Date.now().toString().slice(-6)}-${randSuffix}`;
    const verificationUrl = `https://verify.vid.edu/cert/${certificateId}`;

    const qrRaw = `${certificateId}|${student.admissionNumber}|${student.id}|${student.institutionName}`;
    const qrSignature = crypto.createHash('sha256').update(qrRaw).digest('hex').slice(0, 16);
    const qrPayload = JSON.stringify({
      certId: certificateId,
      studentId: student.id,
      admissionNo: student.admissionNumber,
      institution: student.institutionName,
      issuedAt: new Date().toISOString(),
      sig: qrSignature,
    });

    const issuedDate = new Date().toISOString().split('T')[0];

    const storageKey = `${actor.institutionId}/documents/student/${student.id}/bonafide-${certificateId}.pdf`;
    const docRecord = await this.repo.createDocument({
      documentTypeId: docType.id,
      ownerType: 'student',
      ownerId: student.id,
      storageKey,
      fileName: `Bonafide_Certificate_${student.admissionNumber}.pdf`,
      mimeType: 'application/pdf',
      uploadedBy: actor.profileId || actor.id,
      metadata: {
        certificateId,
        purpose,
        verificationUrl,
        qrPayload,
        issuedDate,
        studentName: `${student.firstName} ${student.lastName}`,
        className: student.className,
        sectionName: student.sectionName,
        signature: qrSignature,
      },
    });

    await this.repo.verifyDocument(docRecord.id, 'verified', actor.profileId || actor.id, 'System issued official certificate');

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.certificate_generated',
      resource: 'documents',
      resourceId: docRecord.id,
      newValue: {
        certificateType: 'bonafide',
        certificateId,
        studentId: student.id,
        purpose,
      },
    });

    try {
      const studentProfile = await db.query(
        `SELECT u.id as profile_id FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = $1`,
        [student.id]
      );
      const recipientUserId = studentProfile.rows[0]?.profile_id || student.id;

      await notificationService.sendNotification({
        institutionId: actor.institutionId,
        recipientUserId,
        title: 'Bonafide Certificate Issued',
        message: `Your official Bonafide Certificate (${certificateId}) is now available in your document vault.`,
        type: 'certificate_issued',
      });
    } catch (e) {
      // non-blocking
    }

    return {
      certificateId,
      documentId: docRecord.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      className: student.className,
      sectionName: student.sectionName,
      institutionName: student.institutionName,
      institutionAddress: student.institutionAddress,
      purpose,
      issuedDate,
      verificationUrl,
      qrPayload,
      storageKey,
    };
  }

  async generateTransferCertificate(
    studentId: string,
    details: {
      reason?: string;
      conduct?: string;
      remarks?: string;
      promotedToClass?: string;
    },
    actor: ActorContext
  ): Promise<any> {
    const student = await this.repo.getStudentCertificateDetails(studentId);
    if (!student) {
      throw new AppError('Student not found for Transfer Certificate', 404, 'STUDENT_NOT_FOUND');
    }

    let docType = await this.repo.getDocumentTypeByCode('transfer_certificate');
    if (!docType) {
      docType = await this.repo.createDocumentType({ code: 'transfer_certificate', name: 'Transfer Certificate' });
    }

    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const certificateId = `TC-${student.institutionCode || 'VID'}-${Date.now().toString().slice(-6)}-${randSuffix}`;
    const verificationUrl = `https://verify.vid.edu/cert/${certificateId}`;

    const qrRaw = `${certificateId}|${student.admissionNumber}|${student.id}|TC|${student.institutionName}`;
    const qrSignature = crypto.createHash('sha256').update(qrRaw).digest('hex').slice(0, 16);
    const qrPayload = JSON.stringify({
      certId: certificateId,
      studentId: student.id,
      admissionNo: student.admissionNumber,
      type: 'Transfer Certificate',
      institution: student.institutionName,
      issuedAt: new Date().toISOString(),
      sig: qrSignature,
    });

    const issuedDate = new Date().toISOString().split('T')[0];

    const storageKey = `${actor.institutionId}/documents/student/${student.id}/tc-${certificateId}.pdf`;
    const docRecord = await this.repo.createDocument({
      documentTypeId: docType.id,
      ownerType: 'student',
      ownerId: student.id,
      storageKey,
      fileName: `Transfer_Certificate_${student.admissionNumber}.pdf`,
      mimeType: 'application/pdf',
      uploadedBy: actor.profileId || actor.id,
      metadata: {
        certificateId,
        reason: details.reason || 'Completion of Academic Course',
        conduct: details.conduct || 'Good',
        remarks: details.remarks || '',
        promotedToClass: details.promotedToClass || '',
        verificationUrl,
        qrPayload,
        issuedDate,
        studentName: `${student.firstName} ${student.lastName}`,
        className: student.className,
        signature: qrSignature,
      },
    });

    await this.repo.verifyDocument(docRecord.id, 'verified', actor.profileId || actor.id, 'System issued Transfer Certificate');

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.certificate_generated',
      resource: 'documents',
      resourceId: docRecord.id,
      newValue: {
        certificateType: 'transfer_certificate',
        certificateId,
        studentId: student.id,
      },
    });

    return {
      certificateId,
      documentId: docRecord.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.className,
      sectionName: student.sectionName,
      institutionName: student.institutionName,
      reason: details.reason || 'Completion of Academic Course',
      conduct: details.conduct || 'Good',
      promotedToClass: details.promotedToClass || '',
      issuedDate,
      verificationUrl,
      qrPayload,
      storageKey,
    };
  }

  // ==========================================
  // DOCUMENT REQUESTS WORKFLOW
  // ==========================================
  async requestDocument(
    data: {
      requestedForType: 'student' | 'staff';
      requestedForId: string;
      documentTypeId: string;
      remarks?: string;
    },
    actor: ActorContext
  ): Promise<DocumentRequestRecord> {
    const docType = await this.repo.getDocumentTypeById(data.documentTypeId);
    if (!docType) {
      throw new AppError('Document type not found', 404, 'DOCUMENT_TYPE_NOT_FOUND');
    }

    if (data.requestedForType === 'student') {
      const studentExists = await this.repo.verifyStudentExists(data.requestedForId);
      if (!studentExists) {
        throw new AppError('Student not found in this institution', 404, 'STUDENT_NOT_FOUND');
      }

      if ((actor.role === 'STUDENT' || actor.role === 'Student') && actor.id !== data.requestedForId) {
        throw new AppError('Students can only request documents for themselves (Rule 10)', 403, 'RESOURCE_ACCESS_DENIED');
      }

      if (actor.role === 'PARENT' || actor.role === 'Parent') {
        const isLinked = await this.repo.verifyParentChildLink(actor.id, data.requestedForId);
        if (!isLinked) {
          throw new AppError('Parents can only request documents for linked children (Rule 9)', 403, 'RESOURCE_ACCESS_DENIED');
        }
      }
    } else if (data.requestedForType === 'staff') {
      const staffExists = await this.repo.verifyStaffExists(data.requestedForId);
      if (!staffExists) {
        throw new AppError('Staff not found in this institution', 404, 'STAFF_NOT_FOUND');
      }
    }

    const request = await this.repo.createRequest({
      requestedForType: data.requestedForType,
      requestedForId: data.requestedForId,
      documentTypeId: data.documentTypeId,
      requestedBy: actor.profileId || actor.id,
      remarks: data.remarks,
    });

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.request_submitted',
      resource: 'document_requests',
      resourceId: request.id,
      newValue: {
        documentTypeId: data.documentTypeId,
        requestedForType: data.requestedForType,
        requestedForId: data.requestedForId,
      },
    });

    return request;
  }

  async listDocumentRequests(
    filters: {
      status?: string;
      requestedForType?: string;
      requestedForId?: string;
    },
    actor: ActorContext
  ): Promise<DocumentRequestRecord[]> {
    const scopedFilters = { ...filters };

    if (actor.role === 'STUDENT' || actor.role === 'Student') {
      scopedFilters.requestedForType = 'student';
      scopedFilters.requestedForId = actor.id;
    } else if (actor.role === 'PARENT' || actor.role === 'Parent') {
      scopedFilters.requestedForType = 'student';
      if (!scopedFilters.requestedForId) {
        throw new AppError('Parent must specify child studentId', 400, 'STUDENT_ID_REQUIRED');
      }
      const isLinked = await this.repo.verifyParentChildLink(actor.id, scopedFilters.requestedForId);
      if (!isLinked) {
        throw new AppError('Parents can only access requests for linked children (Rule 9)', 403, 'RESOURCE_ACCESS_DENIED');
      }
    }

    return this.repo.listRequests(scopedFilters);
  }

  async processDocumentRequest(
    requestId: string,
    status: 'verified' | 'rejected',
    remarks: string | undefined,
    issuedDocumentId: string | undefined,
    actor: ActorContext
  ): Promise<DocumentRequestRecord> {
    const req = await this.repo.findRequestById(requestId);
    if (!req) {
      throw new AppError('Document request not found', 404, 'REQUEST_NOT_FOUND');
    }

    const processed = await this.repo.updateRequestStatus(
      requestId,
      status,
      actor.profileId || actor.id,
      remarks,
      issuedDocumentId
    );

    if (!processed) {
      throw new AppError('Failed to update document request', 500, 'UPDATE_FAILED');
    }

    await AuditDispatcher.dispatch({
      actorId: actor.id,
      institutionId: actor.institutionId,
      action: 'documents.request_processed',
      resource: 'document_requests',
      resourceId: requestId,
      newValue: {
        status,
        remarks: remarks || null,
        issuedDocumentId: issuedDocumentId || null,
      },
    });

    return processed;
  }

  // ==========================================
  // ACCESS CONTROL HELPER (Rules 8, 9, 10)
  // ==========================================
  private async assertDocumentAccess(doc: DocumentRecord, actor: ActorContext): Promise<void> {
    const isAdmin =
      actor.role === 'SUPER_ADMIN' ||
      actor.role === 'Super Admin' ||
      actor.role === 'INSTITUTION_ADMIN' ||
      actor.role === 'Institution Admin' ||
      actor.role === 'ACADEMIC_COORDINATOR';

    if (isAdmin) return;

    if (actor.role === 'STUDENT' || actor.role === 'Student') {
      if (doc.ownerType !== 'student' || (doc.ownerId !== actor.id && doc.ownerId !== actor.profileId)) {
        throw new AppError('Access denied: Students can only access their own educational records (Rule 10)', 403, 'RESOURCE_ACCESS_DENIED');
      }
      return;
    }

    if (actor.role === 'PARENT' || actor.role === 'Parent') {
      if (doc.ownerType !== 'student') {
        throw new AppError('Access denied: Parents can only access student records (Rule 9)', 403, 'RESOURCE_ACCESS_DENIED');
      }
      const isLinked = await this.repo.verifyParentChildLink(actor.id, doc.ownerId);
      if (!isLinked) {
        throw new AppError('Access denied: Parents can only access records for verified linked children (Rule 9)', 403, 'RESOURCE_ACCESS_DENIED');
      }
      return;
    }

    if (actor.role === 'FACULTY' || actor.role === 'Faculty') {
      if (doc.ownerType === 'staff' && (doc.ownerId === actor.id || doc.ownerId === actor.profileId)) {
        return; // own staff document
      }
      if (doc.ownerType === 'student') {
        const canAccess = await this.repo.verifyFacultyStudentLink(actor.id, doc.ownerId);
        if (!canAccess) {
          throw new AppError('Access denied: Faculty can only access records for students in their assigned sections (Rule 8)', 403, 'RESOURCE_ACCESS_DENIED');
        }
        return;
      }
      throw new AppError('Access denied: Unauthorized document access (Rule 8)', 403, 'RESOURCE_ACCESS_DENIED');
    }
  }
}
