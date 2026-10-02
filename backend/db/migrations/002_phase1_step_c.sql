-- VID Platform: Phase 1 Step C Migration
-- Academic Core, Faculty Scoping, Student Master & Admissions Lifecycle

-- 1. Decision D2: Add department_type enum to departments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departments' AND column_name = 'department_type'
  ) THEN
    ALTER TABLE departments ADD COLUMN department_type TEXT NOT NULL DEFAULT 'academic';
  END IF;
END $$;

-- 2. Decision D6 & Section 8: Add admission_fee_status, roll_number, and user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admissions' AND column_name = 'admission_fee_status'
  ) THEN
    ALTER TABLE admissions ADD COLUMN admission_fee_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'roll_number'
  ) THEN
    ALTER TABLE students ADD COLUMN roll_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE students ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Module students: parents and student_parents per Section 5
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Parent',
  phone TEXT,
  email TEXT,
  occupation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parents_tenant ON parents(institution_id);

CREATE TABLE IF NOT EXISTS student_parents (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'Parent',
  is_primary_contact BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, parent_id)
);
CREATE INDEX IF NOT EXISTS idx_student_parents_student ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent ON student_parents(parent_id);

-- 4. Module faculty: faculty, faculty_subjects, and faculty_classes per Section 5 & Decision D3
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  qualification TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_faculty_staff UNIQUE (staff_id)
);
CREATE INDEX IF NOT EXISTS idx_faculty_tenant ON faculty(institution_id);

-- Populate faculty from existing teaching staff
INSERT INTO faculty (id, institution_id, staff_id, qualification, specialization)
SELECT gen_random_uuid(), institution_id, id, 'Master of Education', 'Curriculum & Pedagogy'
FROM staff
WHERE is_teaching_staff = true
ON CONFLICT (staff_id) DO NOTHING;

-- Canonical views for faculty_subjects and faculty_classes
CREATE OR REPLACE VIEW faculty_subjects AS
SELECT fa.id, fa.institution_id, f.id as faculty_id, fa.staff_id, fa.subject_id, fa.academic_year_id, fa.effective_from, fa.effective_to
FROM faculty_assignments fa
JOIN faculty f ON f.staff_id = fa.staff_id;

CREATE OR REPLACE VIEW faculty_classes AS
SELECT fa.id, fa.institution_id, f.id as faculty_id, fa.staff_id, fa.section_id, sec.class_id, fa.academic_year_id, fa.effective_from, fa.effective_to
FROM faculty_assignments fa
JOIN faculty f ON f.staff_id = fa.staff_id
JOIN sections sec ON sec.id = fa.section_id;
