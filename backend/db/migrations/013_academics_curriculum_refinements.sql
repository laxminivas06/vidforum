-- =====================================================================
-- 013_academics_curriculum_refinements.sql
-- Step 2: Academics & Curriculum Refinements
-- Academic Years, Subjects Master, Grade Subjects Mapping, 
-- Exam Estimated Schedule (A2), Year Schedule / Calendar, Preferred Textbooks (A1)
-- =====================================================================

-- 1. Academic Years enhancements: status and strictly one current year
ALTER TABLE academic_years
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_academic_years_status'
  ) THEN
    ALTER TABLE academic_years 
      ADD CONSTRAINT chk_academic_years_status CHECK (status IN ('planning', 'active', 'closed'));
  END IF;
END $$;

-- Enforce at most one current academic year per institution tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_years_one_current 
  ON academic_years (institution_id) 
  WHERE (is_current = true);

-- 2. Subjects Master enhancements: active flag, credits, optional department link
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS credits numeric(3,1) DEFAULT 4.0;

ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

-- 3. Grade Subjects: Periods per week, max marks, pass marks matrix
CREATE TABLE IF NOT EXISTS grade_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  periods_per_week INTEGER NOT NULL DEFAULT 5,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
  pass_marks NUMERIC(5,2) NOT NULL DEFAULT 35,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_grade_subjects UNIQUE (class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_grade_subjects_class ON grade_subjects (class_id);
CREATE INDEX IF NOT EXISTS idx_grade_subjects_tenant ON grade_subjects (institution_id);

-- Backfill grade_subjects from class_subjects if any exist
INSERT INTO grade_subjects (institution_id, class_id, subject_id, is_mandatory)
SELECT c.institution_id, cs.class_id, cs.subject_id, cs.is_mandatory
FROM class_subjects cs
JOIN classes c ON c.id = cs.class_id
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- 4. Exam Estimates (A2): Term windows per grade/academic year
CREATE TABLE IF NOT EXISTS exam_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  term_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_exam_estimates_dates CHECK (end_date >= start_date)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_exam_estimates_status'
  ) THEN
    ALTER TABLE exam_estimates 
      ADD CONSTRAINT chk_exam_estimates_status CHECK (status IN ('draft', 'scheduled', 'completed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_estimates_year ON exam_estimates (institution_id, academic_year_id);

-- 5. Calendar Days & Holiday Schedule
CREATE TABLE IF NOT EXISTS calendar_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_type TEXT NOT NULL DEFAULT 'holiday',
  description TEXT,
  is_working_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_calendar_days UNIQUE (institution_id, academic_year_id, date)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_calendar_days_type'
  ) THEN
    ALTER TABLE calendar_days 
      ADD CONSTRAINT chk_calendar_days_type CHECK (day_type IN ('working', 'holiday', 'vacation', 'event', 'exam'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calendar_days_lookup ON calendar_days (institution_id, academic_year_id, date);

-- 6. Academic Calendar Working Week Config (e.g. 1=Mon..5=Fri)
CREATE TABLE IF NOT EXISTS academic_calendar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  working_days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_academic_calendar_config UNIQUE (institution_id, academic_year_id)
);

-- 7. Preferred Textbooks (A1): Prescribed book catalog with ISBN and publishers
CREATE TABLE IF NOT EXISTS preferred_textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT NOT NULL,
  edition TEXT,
  isbn TEXT,
  price NUMERIC(10,2),
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preferred_textbooks ON preferred_textbooks (institution_id, academic_year_id, class_id);
