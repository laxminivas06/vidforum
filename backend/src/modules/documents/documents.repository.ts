import { db } from '../../config/database';

export interface DocumentTypeRecord {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  institutionId: string;
  documentTypeId: string;
  documentTypeCode?: string;
  documentTypeName?: string;
  ownerType: string;
  ownerId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedByName?: string;
  metadata: Record<string, any>;
  verificationStatus?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationRemarks?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface DocumentTemplateRecord {
  id: string;
  institutionId: string;
  documentTypeId: string;
  documentTypeCode?: string;
  documentTypeName?: string;
  name: string;
  templateStorageKey: string;
  templateBody?: string;
  variables: string[];
  createdAt: string;
}

export interface DocumentVerificationRecord {
  id: string;
  documentId: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
  createdAt: string;
}

export interface DocumentRequestRecord {
  id: string;
  institutionId: string;
  requestedForType: string;
  requestedForId: string;
  requestedForName?: string;
  documentTypeId: string;
  documentTypeCode?: string;
  documentTypeName?: string;
  requestedBy?: string;
  status: 'pending' | 'verified' | 'rejected';
  remarks?: string;
  processedBy?: string;
  processedAt?: string;
  issuedDocumentId?: string;
  createdAt: string;
}

export class DocumentsRepository {
  private institutionId: string;

  constructor(institutionId: string) {
    this.institutionId = institutionId;
  }

  // ==========================================
  // DOCUMENT TYPES (Catalog)
  // ==========================================
  async listDocumentTypes(): Promise<DocumentTypeRecord[]> {
    const res = await db.query(
      `SELECT id, code, name, created_at as "createdAt"
       FROM document_types
       ORDER BY name ASC`
    );
    return res.rows;
  }

  async getDocumentTypeById(id: string): Promise<DocumentTypeRecord | null> {
    const res = await db.query(
      `SELECT id, code, name, created_at as "createdAt"
       FROM document_types
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async getDocumentTypeByCode(code: string): Promise<DocumentTypeRecord | null> {
    const res = await db.query(
      `SELECT id, code, name, created_at as "createdAt"
       FROM document_types
       WHERE code = $1`,
      [code]
    );
    return res.rows[0] || null;
  }

  async createDocumentType(data: { code: string; name: string }): Promise<DocumentTypeRecord> {
    const res = await db.query(
      `INSERT INTO document_types (code, name)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, code, name, created_at as "createdAt"`,
      [data.code, data.name]
    );
    return res.rows[0];
  }

  // ==========================================
  // DOCUMENTS (Vault)
  // ==========================================
  async createDocument(data: {
    documentTypeId: string;
    ownerType: string;
    ownerId: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    fileSize?: number;
    uploadedBy?: string;
    metadata?: Record<string, any>;
  }): Promise<DocumentRecord> {
    const res = await db.query(
      `INSERT INTO documents (
        institution_id, document_type_id, owner_type, owner_id,
        storage_key, file_name, mime_type, file_size, uploaded_by, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, institution_id as "institutionId", document_type_id as "documentTypeId",
        owner_type as "ownerType", owner_id as "ownerId", storage_key as "storageKey",
        file_name as "fileName", mime_type as "mimeType", file_size as "fileSize",
        uploaded_by as "uploadedBy", metadata, created_at as "createdAt"`,
      [
        this.institutionId,
        data.documentTypeId,
        data.ownerType,
        data.ownerId,
        data.storageKey,
        data.fileName,
        data.mimeType,
        data.fileSize || 0,
        data.uploadedBy || null,
        JSON.stringify(data.metadata || {}),
      ]
    );

    const doc = res.rows[0];

    // Create initial pending verification entry
    await db.query(
      `INSERT INTO document_verifications (document_id, status)
       VALUES ($1, 'pending')`,
      [doc.id]
    );

    return {
      ...doc,
      verificationStatus: 'pending',
    };
  }

  async findDocumentById(id: string): Promise<DocumentRecord | null> {
    const res = await db.query(
      `SELECT 
        d.id, d.institution_id as "institutionId", d.document_type_id as "documentTypeId",
        dt.code as "documentTypeCode", dt.name as "documentTypeName",
        d.owner_type as "ownerType", d.owner_id as "ownerId", d.storage_key as "storageKey",
        d.file_name as "fileName", d.mime_type as "mimeType", d.file_size as "fileSize",
        d.uploaded_by as "uploadedBy", p.full_name as "uploadedByName",
        d.metadata, d.deleted_at as "deletedAt", d.created_at as "createdAt",
        COALESCE(dv.status, 'pending') as "verificationStatus",
        dv.verified_by as "verifiedBy", dv.verified_at as "verifiedAt",
        dv.remarks as "verificationRemarks"
       FROM documents d
       JOIN document_types dt ON dt.id = d.document_type_id
       LEFT JOIN profiles p ON p.id = d.uploaded_by
       LEFT JOIN LATERAL (
         SELECT status, verified_by, verified_at, remarks
         FROM document_verifications
         WHERE document_id = d.id
         ORDER BY created_at DESC
         LIMIT 1
       ) dv ON true
       WHERE d.id = $1 AND d.institution_id = $2`,
      [id, this.institutionId]
    );
    return res.rows[0] || null;
  }

  async findDocumentsByOwner(
    ownerType: string,
    ownerId: string,
    includeDeleted: boolean = false
  ): Promise<DocumentRecord[]> {
    const whereDeleted = includeDeleted ? '' : 'AND d.deleted_at IS NULL';
    const res = await db.query(
      `SELECT 
        d.id, d.institution_id as "institutionId", d.document_type_id as "documentTypeId",
        dt.code as "documentTypeCode", dt.name as "documentTypeName",
        d.owner_type as "ownerType", d.owner_id as "ownerId", d.storage_key as "storageKey",
        d.file_name as "fileName", d.mime_type as "mimeType", d.file_size as "fileSize",
        d.uploaded_by as "uploadedBy", p.full_name as "uploadedByName",
        d.metadata, d.deleted_at as "deletedAt", d.created_at as "createdAt",
        COALESCE(dv.status, 'pending') as "verificationStatus",
        dv.verified_by as "verifiedBy", dv.verified_at as "verifiedAt",
        dv.remarks as "verificationRemarks"
       FROM documents d
       JOIN document_types dt ON dt.id = d.document_type_id
       LEFT JOIN profiles p ON p.id = d.uploaded_by
       LEFT JOIN LATERAL (
         SELECT status, verified_by, verified_at, remarks
         FROM document_verifications
         WHERE document_id = d.id
         ORDER BY created_at DESC
         LIMIT 1
       ) dv ON true
       WHERE d.institution_id = $1 AND d.owner_type = $2 AND d.owner_id = $3 ${whereDeleted}
       ORDER BY d.created_at DESC`,
      [this.institutionId, ownerType, ownerId]
    );
    return res.rows;
  }

  async listDocuments(filters: {
    ownerType?: string;
    ownerId?: string;
    documentTypeId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ documents: DocumentRecord[]; total: number }> {
    const params: any[] = [this.institutionId];
    let paramIdx = 2;

    const whereClauses: string[] = ['d.deleted_at IS NULL'];

    if (filters.ownerType) {
      whereClauses.push(`d.owner_type = $${paramIdx++}`);
      params.push(filters.ownerType);
    }
    if (filters.ownerId) {
      whereClauses.push(`d.owner_id = $${paramIdx++}`);
      params.push(filters.ownerId);
    }
    if (filters.documentTypeId) {
      whereClauses.push(`d.document_type_id = $${paramIdx++}`);
      params.push(filters.documentTypeId);
    }
    if (filters.status) {
      whereClauses.push(`COALESCE(dv.status, 'pending') = $${paramIdx++}`);
      params.push(filters.status);
    }
    if (filters.search) {
      whereClauses.push(`(d.file_name ILIKE $${paramIdx} OR dt.name ILIKE $${paramIdx})`);
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    const whereStr = whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT count(*) FROM documents d
       JOIN document_types dt ON dt.id = d.document_type_id
       LEFT JOIN LATERAL (
         SELECT status FROM document_verifications WHERE document_id = d.id ORDER BY created_at DESC LIMIT 1
       ) dv ON true
       WHERE d.institution_id = $1 ${whereStr}`,
      params
    );

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const dataRes = await db.query(
      `SELECT 
        d.id, d.institution_id as "institutionId", d.document_type_id as "documentTypeId",
        dt.code as "documentTypeCode", dt.name as "documentTypeName",
        d.owner_type as "ownerType", d.owner_id as "ownerId", d.storage_key as "storageKey",
        d.file_name as "fileName", d.mime_type as "mimeType", d.file_size as "fileSize",
        d.uploaded_by as "uploadedBy", p.full_name as "uploadedByName",
        d.metadata, d.deleted_at as "deletedAt", d.created_at as "createdAt",
        COALESCE(dv.status, 'pending') as "verificationStatus",
        dv.verified_by as "verifiedBy", dv.verified_at as "verifiedAt",
        dv.remarks as "verificationRemarks"
       FROM documents d
       JOIN document_types dt ON dt.id = d.document_type_id
       LEFT JOIN profiles p ON p.id = d.uploaded_by
       LEFT JOIN LATERAL (
         SELECT status, verified_by, verified_at, remarks
         FROM document_verifications
         WHERE document_id = d.id
         ORDER BY created_at DESC
         LIMIT 1
       ) dv ON true
       WHERE d.institution_id = $1 ${whereStr}
       ORDER BY d.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      documents: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  }

  async softDeleteDocument(id: string): Promise<boolean> {
    const res = await db.query(
      `UPDATE documents SET deleted_at = NOW()
       WHERE id = $1 AND institution_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, this.institutionId]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  // ==========================================
  // DOCUMENT VERIFICATION
  // ==========================================
  async verifyDocument(
    documentId: string,
    status: 'verified' | 'rejected',
    verifiedBy?: string,
    remarks?: string
  ): Promise<DocumentVerificationRecord> {
    const res = await db.query(
      `INSERT INTO document_verifications (document_id, status, verified_by, verified_at, remarks)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING id, document_id as "documentId", status, verified_by as "verifiedBy",
                 verified_at as "verifiedAt", remarks, created_at as "createdAt"`,
      [documentId, status, verifiedBy || null, remarks || null]
    );
    return res.rows[0];
  }

  async getVerificationHistory(documentId: string): Promise<DocumentVerificationRecord[]> {
    const res = await db.query(
      `SELECT id, document_id as "documentId", status, verified_by as "verifiedBy",
              verified_at as "verifiedAt", remarks, created_at as "createdAt"
       FROM document_verifications
       WHERE document_id = $1
       ORDER BY created_at DESC`,
      [documentId]
    );
    return res.rows;
  }

  // ==========================================
  // DOCUMENT TEMPLATES
  // ==========================================
  async createTemplate(data: {
    documentTypeId: string;
    name: string;
    templateStorageKey: string;
    templateBody?: string;
    variables?: string[];
  }): Promise<DocumentTemplateRecord> {
    const res = await db.query(
      `INSERT INTO document_templates (
        institution_id, document_type_id, name, template_storage_key, template_body, variables
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id, institution_id as "institutionId", document_type_id as "documentTypeId",
        name, template_storage_key as "templateStorageKey", template_body as "templateBody",
        variables, created_at as "createdAt"`,
      [
        this.institutionId,
        data.documentTypeId,
        data.name,
        data.templateStorageKey,
        data.templateBody || '',
        JSON.stringify(data.variables || []),
      ]
    );
    return res.rows[0];
  }

  async findTemplateById(id: string): Promise<DocumentTemplateRecord | null> {
    const res = await db.query(
      `SELECT 
        dtm.id, dtm.institution_id as "institutionId", dtm.document_type_id as "documentTypeId",
        dt.code as "documentTypeCode", dt.name as "documentTypeName",
        dtm.name, dtm.template_storage_key as "templateStorageKey",
        dtm.template_body as "templateBody", dtm.variables, dtm.created_at as "createdAt"
       FROM document_templates dtm
       JOIN document_types dt ON dt.id = dtm.document_type_id
       WHERE dtm.id = $1 AND dtm.institution_id = $2`,
      [id, this.institutionId]
    );
    return res.rows[0] || null;
  }

  async listTemplates(documentTypeId?: string): Promise<DocumentTemplateRecord[]> {
    const filter = documentTypeId ? 'AND dtm.document_type_id = $2' : '';
    const params: any[] = [this.institutionId];
    if (documentTypeId) params.push(documentTypeId);

    const res = await db.query(
      `SELECT 
        dtm.id, dtm.institution_id as "institutionId", dtm.document_type_id as "documentTypeId",
        dt.code as "documentTypeCode", dt.name as "documentTypeName",
        dtm.name, dtm.template_storage_key as "templateStorageKey",
        dtm.template_body as "templateBody", dtm.variables, dtm.created_at as "createdAt"
       FROM document_templates dtm
       JOIN document_types dt ON dt.id = dtm.document_type_id
       WHERE dtm.institution_id = $1 ${filter}
       ORDER BY dtm.created_at DESC`,
      params
    );
    return res.rows;
  }

  async updateTemplate(
    id: string,
    data: Partial<{
      name: string;
      templateStorageKey: string;
      templateBody: string;
      variables: string[];
    }>
  ): Promise<DocumentTemplateRecord | null> {
    const fields: string[] = [];
    const params: any[] = [id, this.institutionId];
    let idx = 3;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      params.push(data.name);
    }
    if (data.templateStorageKey !== undefined) {
      fields.push(`template_storage_key = $${idx++}`);
      params.push(data.templateStorageKey);
    }
    if (data.templateBody !== undefined) {
      fields.push(`template_body = $${idx++}`);
      params.push(data.templateBody);
    }
    if (data.variables !== undefined) {
      fields.push(`variables = $${idx++}`);
      params.push(JSON.stringify(data.variables));
    }

    if (fields.length === 0) return this.findTemplateById(id);

    const res = await db.query(
      `UPDATE document_templates
       SET ${fields.join(', ')}
       WHERE id = $1 AND institution_id = $2
       RETURNING 
         id, institution_id as "institutionId", document_type_id as "documentTypeId",
         name, template_storage_key as "templateStorageKey", template_body as "templateBody",
         variables, created_at as "createdAt"`,
      params
    );
    return res.rows[0] || null;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const res = await db.query(
      `DELETE FROM document_templates WHERE id = $1 AND institution_id = $2`,
      [id, this.institutionId]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  // ==========================================
  // DOCUMENT REQUESTS
  // ==========================================
  async createRequest(data: {
    requestedForType: string;
    requestedForId: string;
    documentTypeId: string;
    requestedBy?: string;
    remarks?: string;
  }): Promise<DocumentRequestRecord> {
    const res = await db.query(
      `INSERT INTO document_requests (
        institution_id, requested_for_type, requested_for_id,
        document_type_id, requested_by, status, remarks
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      RETURNING 
        id, institution_id as "institutionId", requested_for_type as "requestedForType",
        requested_for_id as "requestedForId", document_type_id as "documentTypeId",
        requested_by as "requestedBy", status, remarks, created_at as "createdAt"`,
      [
        this.institutionId,
        data.requestedForType,
        data.requestedForId,
        data.documentTypeId,
        data.requestedBy || null,
        data.remarks || null,
      ]
    );
    return res.rows[0];
  }

  async findRequestById(id: string): Promise<DocumentRequestRecord | null> {
    const res = await db.query(
      `SELECT 
        dr.id, dr.institution_id as "institutionId", dr.requested_for_type as "requestedForType",
        dr.requested_for_id as "requestedForId", dr.document_type_id as "documentTypeId",
        dt.code as "documentTypeCode", dt.name as "documentTypeName",
        dr.requested_by as "requestedBy", dr.status, dr.remarks,
        dr.processed_by as "processedBy", dr.processed_at as "processedAt",
        dr.issued_document_id as "issuedDocumentId", dr.created_at as "createdAt"
       FROM document_requests dr
       JOIN document_types dt ON dt.id = dr.document_type_id
       WHERE dr.id = $1 AND dr.institution_id = $2`,
      [id, this.institutionId]
    );
    return res.rows[0] || null;
  }

  async listRequests(filters: {
    status?: string;
    requestedForType?: string;
    requestedForId?: string;
  }): Promise<DocumentRequestRecord[]> {
    const whereClauses: string[] = [];
    const params: any[] = [this.institutionId];
    let idx = 2;

    if (filters.status) {
      whereClauses.push(`dr.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.requestedForType) {
      whereClauses.push(`dr.requested_for_type = $${idx++}`);
      params.push(filters.requestedForType);
    }
    if (filters.requestedForId) {
      whereClauses.push(`dr.requested_for_id = $${idx++}`);
      params.push(filters.requestedForId);
    }

    const whereStr = whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : '';

    const res = await db.query(
      `SELECT 
        dr.id, dr.institution_id as "institutionId", dr.requested_for_type as "requestedForType",
        dr.requested_for_id as "requestedForId", dr.document_type_id as "documentTypeId",
        dt.code as "documentTypeCode", dt.name as "documentTypeName",
        dr.requested_by as "requestedBy", dr.status, dr.remarks,
        dr.processed_by as "processedBy", dr.processed_at as "processedAt",
        dr.issued_document_id as "issuedDocumentId", dr.created_at as "createdAt"
       FROM document_requests dr
       JOIN document_types dt ON dt.id = dr.document_type_id
       WHERE dr.institution_id = $1 ${whereStr}
       ORDER BY dr.created_at DESC`,
      params
    );
    return res.rows;
  }

  async updateRequestStatus(
    id: string,
    status: 'pending' | 'verified' | 'rejected',
    processedBy?: string,
    remarks?: string,
    issuedDocumentId?: string
  ): Promise<DocumentRequestRecord | null> {
    const res = await db.query(
      `UPDATE document_requests
       SET status = $3, processed_by = $4, processed_at = NOW(),
           remarks = COALESCE($5, remarks), issued_document_id = COALESCE($6, issued_document_id)
       WHERE id = $1 AND institution_id = $2
       RETURNING 
         id, institution_id as "institutionId", requested_for_type as "requestedForType",
         requested_for_id as "requestedForId", document_type_id as "documentTypeId",
         requested_by as "requestedBy", status, remarks, processed_by as "processedBy",
         processed_at as "processedAt", issued_document_id as "issuedDocumentId",
         created_at as "createdAt"`,
      [id, this.institutionId, status, processedBy || null, remarks || null, issuedDocumentId || null]
    );
    return res.rows[0] || null;
  }

  // ==========================================
  // STUDENT / STAFF METADATA FOR CERTIFICATES
  // ==========================================
  async getStudentCertificateDetails(studentId: string): Promise<any> {
    const res = await db.query(
      `SELECT 
        s.id, s.admission_number as "admissionNumber", s.roll_number as "rollNumber",
        s.first_name as "firstName", s.last_name as "lastName",
        s.date_of_birth as "dateOfBirth", s.gender,
        s.current_class_id as "classId", c.name as "className",
        s.current_section_id as "sectionId", sec.name as "sectionName",
        i.name as "institutionName", i.code as "institutionCode",
        i.address as "institutionAddress", i.contact_email as "contactEmail"
       FROM students s
       JOIN institutions i ON i.id = s.institution_id
       LEFT JOIN classes c ON c.id = s.current_class_id
       LEFT JOIN sections sec ON sec.id = s.current_section_id
       WHERE s.id = $1 AND s.institution_id = $2`,
      [studentId, this.institutionId]
    );
    return res.rows[0] || null;
  }

  async verifyParentChildLink(parentUserId: string, studentId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 
       FROM student_parents sp
       JOIN parents p ON p.id = sp.parent_id
       WHERE sp.student_id = $1 AND (p.profile_id::text = $2 OR p.id::text = $2)
       UNION
       SELECT 1
       FROM student_guardians sg
       JOIN guardians g ON g.id = sg.guardian_id
       WHERE sg.student_id = $1 AND (g.profile_id::text = $2 OR g.id::text = $2)
       LIMIT 1`,
      [studentId, parentUserId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async verifyFacultyStudentLink(facultyUserId: string, studentId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1
       FROM students s
       JOIN faculty_assignments fa ON fa.section_id = s.current_section_id
       JOIN staff st ON st.id = fa.staff_id
       WHERE s.id = $1 AND s.institution_id = $2 AND (st.profile_id::text = $3 OR st.id::text = $3)
       LIMIT 1`,
      [studentId, this.institutionId, facultyUserId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async verifyStudentExists(studentId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM students WHERE id = $1 AND institution_id = $2`,
      [studentId, this.institutionId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async verifyStaffExists(staffId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM staff WHERE id = $1 AND institution_id = $2`,
      [staffId, this.institutionId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
