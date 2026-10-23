-- =====================================================================
-- 019_academic_admission_fees_attendance.sql
-- Modules 1 - 16: Academic Configuration, Admission Information,
-- Admission Fees, Academic Fees, Temporary Admissions, Exam Results,
-- Permanent Admissions & Payments, Supporting Documents, and
-- Automated Multi-Face Group Attendance.
-- =====================================================================

-- 1. Academic Boards
CREATE TABLE IF NOT EXISTS academic_boards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  code            VARCHAR(50) NOT NULL,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_academic_boards_code UNIQUE (institution_id, code)
);

CREATE INDEX IF NOT EXISTS idx_academic_boards_inst ON academic_boards (institution_id, is_active);

-- 2. Academic Streams
CREATE TABLE IF NOT EXISTS academic_streams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  code            VARCHAR(50) NOT NULL,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_academic_streams_code UNIQUE (institution_id, code)
);

CREATE INDEX IF NOT EXISTS idx_academic_streams_inst ON academic_streams (institution_id, is_active);

-- 3. Composite Academic Configurations (Year + Class/Grade + Board + Stream)
CREATE TABLE IF NOT EXISTS academic_configurations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id    UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id            UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  board_id            UUID NOT NULL REFERENCES academic_boards(id) ON DELETE CASCADE,
  stream_id           UUID REFERENCES academic_streams(id) ON DELETE SET NULL,
  display_order       INTEGER NOT NULL DEFAULT 1,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_config_composite 
  ON academic_configurations (
    institution_id, 
    academic_year_id, 
    class_id, 
    board_id, 
    COALESCE(stream_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS idx_academic_config_lookup 
  ON academic_configurations (institution_id, academic_year_id, is_active);

-- 4. Admission Information & Examination Rules
CREATE TABLE IF NOT EXISTS admission_configurations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id              UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_configuration_id   UUID NOT NULL REFERENCES academic_configurations(id) ON DELETE CASCADE,
  requires_exam               BOOLEAN NOT NULL DEFAULT false,
  examination_name            VARCHAR(200),
  max_marks                   NUMERIC(6,2) DEFAULT 100.00,
  passing_marks               NUMERIC(6,2) DEFAULT 40.00,
  cutoff_marks                NUMERIC(6,2) DEFAULT 60.00,
  exam_date                   DATE,
  status                      VARCHAR(50) NOT NULL DEFAULT 'active',
  display_order               INTEGER NOT NULL DEFAULT 1,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_admission_config_ref UNIQUE (institution_id, academic_configuration_id),
  CONSTRAINT chk_passing_max CHECK (passing_marks <= max_marks),
  CONSTRAINT chk_cutoff_max CHECK (cutoff_marks <= max_marks)
);

CREATE INDEX IF NOT EXISTS idx_admission_config_inst ON admission_configurations (institution_id, status);

-- 5. Admission Fee Policies & Custom Rates
CREATE TABLE IF NOT EXISTS admission_fee_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  policy_type     VARCHAR(20) NOT NULL DEFAULT 'fee' CHECK (policy_type IN ('fee', 'no_fee')),
  pricing_method  VARCHAR(30) NOT NULL DEFAULT 'same_for_all' CHECK (pricing_method IN ('same_for_all', 'customized')),
  flat_amount     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  effective_from  DATE,
  effective_to    DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_admission_fee_policy_year UNIQUE (institution_id, academic_year_id)
);

CREATE TABLE IF NOT EXISTS admission_fee_custom_rates (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id              UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  policy_id                   UUID NOT NULL REFERENCES admission_fee_policies(id) ON DELETE CASCADE,
  academic_configuration_id   UUID NOT NULL REFERENCES academic_configurations(id) ON DELETE CASCADE,
  amount                      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_admission_fee_custom UNIQUE (institution_id, policy_id, academic_configuration_id)
);

-- 6. Academic Fees (Structures & Dynamic Heads)
CREATE TABLE IF NOT EXISTS academic_fee_structures (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id              UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id            UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  academic_configuration_id   UUID NOT NULL REFERENCES academic_configurations(id) ON DELETE CASCADE,
  tuition_fee                 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  other_fees                  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_fee                   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status                      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_academic_fee_struct UNIQUE (institution_id, academic_year_id, academic_configuration_id)
);

CREATE TABLE IF NOT EXISTS academic_fee_components (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id    UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  fee_structure_id  UUID NOT NULL REFERENCES academic_fee_structures(id) ON DELETE CASCADE,
  component_name    VARCHAR(100) NOT NULL,
  amount            NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academic_fee_comp ON academic_fee_components (fee_structure_id);

-- 7. Temporary Admissions & Exam Results
CREATE TABLE IF NOT EXISTS temporary_admissions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id              UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  temporary_admission_number  VARCHAR(50) NOT NULL,
  student_name                VARCHAR(200) NOT NULL,
  contact_number              VARCHAR(30) NOT NULL,
  parent_name                 VARCHAR(200) NOT NULL,
  academic_year_id            UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  academic_configuration_id   UUID NOT NULL REFERENCES academic_configurations(id) ON DELETE RESTRICT,
  admission_config_id         UUID REFERENCES admission_configurations(id) ON DELETE SET NULL,
  status                      VARCHAR(50) NOT NULL DEFAULT 'pending' 
                              CHECK (status IN ('pending', 'exam_scheduled', 'qualified', 'not_qualified', 'approved', 'rejected', 'converted_to_permanent')),
  created_by                  UUID,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_temporary_adm_no UNIQUE (institution_id, temporary_admission_number)
);

CREATE INDEX IF NOT EXISTS idx_temp_adm_lookup ON temporary_admissions (institution_id, status);

CREATE TABLE IF NOT EXISTS admission_exam_results (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id          UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  temporary_admission_id  UUID NOT NULL REFERENCES temporary_admissions(id) ON DELETE CASCADE,
  exam_name               VARCHAR(200) NOT NULL,
  max_marks               NUMERIC(6,2) NOT NULL DEFAULT 100.00,
  marks_obtained          NUMERIC(6,2) NOT NULL,
  passing_marks           NUMERIC(6,2) NOT NULL,
  cutoff_marks            NUMERIC(6,2) NOT NULL,
  result_status           VARCHAR(30) NOT NULL CHECK (result_status IN ('pending', 'qualified', 'not_qualified')),
  admin_review_status     VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (admin_review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by             UUID,
  reviewed_at             TIMESTAMPTZ,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_admission_exam_results UNIQUE (institution_id, temporary_admission_id)
);

-- 8. Permanent Admissions & Admission Payments
CREATE TABLE IF NOT EXISTS permanent_admissions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id              UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  permanent_admission_number  VARCHAR(50) NOT NULL,
  temporary_admission_id      UUID REFERENCES temporary_admissions(id) ON DELETE SET NULL,
  student_id                  UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  academic_year_id            UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  academic_configuration_id   UUID NOT NULL REFERENCES academic_configurations(id) ON DELETE RESTRICT,
  admission_fee_amount        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  fee_payment_status          VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (fee_payment_status IN ('pending', 'verified', 'waived', 'not_applicable')),
  enrollment_status           VARCHAR(30) NOT NULL DEFAULT 'completed',
  fee_snapshot                JSONB,
  created_by                  UUID,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_permanent_adm_no UNIQUE (institution_id, permanent_admission_number)
);

CREATE INDEX IF NOT EXISTS idx_perm_adm_student ON permanent_admissions (institution_id, student_id);

CREATE TABLE IF NOT EXISTS admission_payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id          UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  permanent_admission_id  UUID NOT NULL REFERENCES permanent_admissions(id) ON DELETE CASCADE,
  student_id              UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  amount                  NUMERIC(10,2) NOT NULL,
  payment_mode            VARCHAR(30) NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'card', 'other')),
  payment_status          VARCHAR(30) NOT NULL DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification', 'verified', 'failed')),
  utr_reference_number    VARCHAR(100),
  gateway_reference_id    VARCHAR(100),
  payment_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_time            TIME NOT NULL DEFAULT CURRENT_TIME,
  upi_provider            VARCHAR(50),
  collected_by            UUID,
  collected_datetime      TIMESTAMPTZ DEFAULT now(),
  notes                   TEXT,
  audit_trail             JSONB DEFAULT '[]'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admission_payments_utr 
  ON admission_payments (institution_id, utr_reference_number) 
  WHERE utr_reference_number IS NOT NULL AND utr_reference_number != '';

-- 9. Student Supporting Documents
CREATE TABLE IF NOT EXISTS student_supporting_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type       VARCHAR(50) NOT NULL,
  document_name       VARCHAR(200) NOT NULL,
  file_storage_key    TEXT,
  file_url            TEXT,
  file_size           INTEGER,
  file_mime           VARCHAR(100),
  aadhaar_last4       VARCHAR(4),
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  uploaded_by         UUID,
  verified_by         UUID,
  verified_at         TIMESTAMPTZ,
  audit_trail         JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_docs_lookup 
  ON student_supporting_documents (institution_id, student_id, verification_status);

-- 10. Automated Multi-Face Group Attendance Records
CREATE TABLE IF NOT EXISTS automated_face_attendance_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type        VARCHAR(10) NOT NULL CHECK (session_type IN ('AM', 'PM')),
  detected_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence          NUMERIC(5,4),
  proof_thumbnail_url TEXT,
  status              VARCHAR(30) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'NEEDS_REVIEW')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_face_attendance_unique 
  ON automated_face_attendance_records (institution_id, student_id, attendance_date, session_type);

CREATE INDEX IF NOT EXISTS idx_group_face_att_lookup 
  ON automated_face_attendance_records (institution_id, attendance_date, session_type);
