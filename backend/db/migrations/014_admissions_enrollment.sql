-- =====================================================================
-- 014_admissions_enrollment.sql
-- Step 3: Admissions & Enrollment Refinements
-- Students extended fields, Enquiries table, capacity enforcement,
-- Direct enrollment support, class history view, promotion function
-- =====================================================================

-- 1. Extend students table with all required profile fields
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS blood_group       TEXT,
  ADD COLUMN IF NOT EXISTS nationality       TEXT DEFAULT 'Indian',
  ADD COLUMN IF NOT EXISTS mother_tongue     TEXT,
  ADD COLUMN IF NOT EXISTS religion          TEXT,
  ADD COLUMN IF NOT EXISTS caste             TEXT,
  ADD COLUMN IF NOT EXISTS previous_school   TEXT,
  ADD COLUMN IF NOT EXISTS address_line1     TEXT,
  ADD COLUMN IF NOT EXISTS address_line2     TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS state             TEXT,
  ADD COLUMN IF NOT EXISTS pincode           TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS emergency_phone   TEXT,
  ADD COLUMN IF NOT EXISTS notes             TEXT,
  ADD COLUMN IF NOT EXISTS photo_url         TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_number    TEXT,
  ADD COLUMN IF NOT EXISTS transfer_cert_no  TEXT,
  ADD COLUMN IF NOT EXISTS tc_date           DATE,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT now();

-- students.status is already constrained by the student_status enum type
-- Enum values: active, inactive, graduated, transferred, dropped
-- Add 'alumni' value if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'student_status')
    AND enumlabel = 'alumni'
  ) THEN
    ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'alumni';
  END IF;
END $$;

-- 2. Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_students_institution
  ON students (institution_id);

CREATE INDEX IF NOT EXISTS idx_students_class_section
  ON students (institution_id, current_class_id, current_section_id);

CREATE INDEX IF NOT EXISTS idx_students_admission_number
  ON students (institution_id, admission_number);

-- 3. Enquiries table (top-of-funnel before application)
CREATE TABLE IF NOT EXISTS enquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  applicant_name  TEXT NOT NULL,
  date_of_birth   DATE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  grade_applying  TEXT,
  class_id        UUID REFERENCES classes(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  contact_name    TEXT NOT NULL,
  contact_phone   TEXT NOT NULL,
  contact_email   TEXT,
  source          TEXT DEFAULT 'walk-in',
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'converted', 'dropped')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_institution
  ON enquiries (institution_id, status, created_at DESC);

-- 4. Add missing columns to applications table if not present
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS enquiry_id       UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes            TEXT,
  ADD COLUMN IF NOT EXISTS entrance_score   NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS interview_date   DATE,
  ADD COLUMN IF NOT EXISTS reviewed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Ensure application stage constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_applications_stage'
  ) THEN
    ALTER TABLE applications
      ADD CONSTRAINT chk_applications_stage
      CHECK (stage IN (
        'enquiry','application','document_verification',
        'review','approved','rejected','waitlisted','enrolled'
      ));
  END IF;
END $$;

-- 5. Admission documents table (if not exists from earlier migrations)
CREATE TABLE IF NOT EXISTS admission_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type       TEXT NOT NULL,
  storage_key         TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
                      CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admission_docs_application
  ON admission_documents (application_id);

-- 6. Class capacity enforcement: add capacity column to classes if missing
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 40;

-- View: current enrollment count per class
CREATE OR REPLACE VIEW class_enrollment_counts AS
SELECT
  c.id                         AS class_id,
  c.institution_id,
  c.name                       AS class_name,
  c.capacity,
  COUNT(s.id) FILTER (WHERE s.status = 'active') AS enrolled_count,
  c.capacity - COUNT(s.id) FILTER (WHERE s.status = 'active') AS available_seats
FROM classes c
LEFT JOIN students s ON s.current_class_id = c.id
GROUP BY c.id, c.institution_id, c.name, c.capacity;

-- 7. Student class history view (alias for student_academic_history)
CREATE OR REPLACE VIEW student_class_history AS
SELECT
  sah.id,
  sah.student_id,
  sah.institution_id,
  sah.academic_year_id,
  ay.name   AS academic_year_name,
  sah.class_id,
  c.name    AS class_name,
  sah.section_id,
  sec.name  AS section_name,
  sah.roll_number,
  sah.effective_from,
  sah.effective_to,
  CASE WHEN sah.effective_to IS NULL THEN true ELSE false END AS is_current
FROM student_academic_history sah
LEFT JOIN academic_years ay  ON ay.id  = sah.academic_year_id
LEFT JOIN classes        c   ON c.id   = sah.class_id
LEFT JOIN sections       sec ON sec.id = sah.section_id;

-- 8. Safe promote_student function (idempotent upsert)
CREATE OR REPLACE FUNCTION promote_student(
  p_student_id     UUID,
  p_class_id       UUID,
  p_section_id     UUID,
  p_academic_year_id UUID,
  p_decision       TEXT,  -- 'promoted' | 'repeated' | 'transferred' | 'alumni'
  p_actor_id       UUID
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Close current history record
  UPDATE student_academic_history
  SET effective_to = v_now
  WHERE student_id = p_student_id AND effective_to IS NULL;

  -- Open new history record
  INSERT INTO student_academic_history (
    institution_id, student_id, academic_year_id,
    class_id, section_id, effective_from
  )
  SELECT
    institution_id, p_student_id, p_academic_year_id,
    p_class_id, p_section_id, v_now
  FROM students WHERE id = p_student_id;

  -- Update student master record
  UPDATE students
  SET
    current_class_id   = p_class_id,
    current_section_id = p_section_id,
    status             = CASE
                           WHEN p_decision = 'alumni'      THEN 'graduated'::student_status
                           WHEN p_decision = 'transferred' THEN 'transferred'::student_status
                           WHEN p_decision = 'dropped'     THEN 'dropped'::student_status
                           ELSE 'active'::student_status
                         END,
    updated_at         = v_now
  WHERE id = p_student_id;
END;
$$;

-- 9. Admission number sequence helper
CREATE SEQUENCE IF NOT EXISTS admission_number_seq START 1 INCREMENT 1;
