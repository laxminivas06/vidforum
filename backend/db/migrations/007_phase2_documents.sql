-- Migration 007: Phase 2 Module 5 - Documents Management & Verification
-- Enhances document metadata, template content, request resolution, and performance indexes.

-- 1. Extend documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS file_size integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Extend document_templates table
ALTER TABLE document_templates
  ADD COLUMN IF NOT EXISTS template_body text,
  ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 3. Extend document_requests table
ALTER TABLE document_requests
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS issued_document_id uuid REFERENCES documents(id) ON DELETE SET NULL;

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(institution_id, owner_type, owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(institution_id, document_type_id);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_verifications_doc ON document_verifications(document_id, status);
CREATE INDEX IF NOT EXISTS idx_document_requests_inst ON document_requests(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_document_templates_inst ON document_templates(institution_id, document_type_id);
