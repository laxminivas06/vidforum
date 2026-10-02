-- Migration: 006_phase2_examinations.sql
-- Description: Phase 2 Module 4 Examinations & Gradebook schema extensions, tables, indexes and constraints

-- 1. Extend marks table with grade linkage, absence flag, remarks and timestamp
ALTER TABLE marks 
  ADD COLUMN IF NOT EXISTS grade_id uuid REFERENCES grades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_absent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Extend exams table with published flag and timestamp
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Create invigilators table if it doesn't exist
CREATE TABLE IF NOT EXISTS invigilators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_room_id uuid NOT NULL REFERENCES exam_rooms(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_room_id, staff_id)
);

-- 4. Create report_cards table (Section 5 authoritative entity ownership)
CREATE TABLE IF NOT EXISTS report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  total_marks_obtained numeric(8,2) NOT NULL,
  total_max_marks numeric(8,2) NOT NULL,
  percentage numeric(5,2) NOT NULL,
  gpa numeric(4,2),
  grade text,
  rank integer,
  result_status text NOT NULL DEFAULT 'passed', -- 'passed', 'failed', 'withheld'
  remarks text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);

-- 5. Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_exams_inst_class ON exams(institution_id, class_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam ON exam_subjects(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_subject ON exam_schedules(exam_subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_subject ON marks(exam_subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_subject ON exam_rooms(exam_subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_room_alloc_student ON exam_room_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_scale ON grades(grade_scale_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_inst_exam ON report_cards(institution_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);
