-- VID Platform: Phase 2 Step 3 Migration (Attendance & Leave Management Module)
-- Ensures schema compatibility for: attendance_sessions, attendance_records,
-- attendance_corrections, staff_attendance, student_leave_requests

-- 1. Ensure attendance_records has updated_at and remarks
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 2. Ensure partial unique indexes for attendance_sessions
-- Prevents duplicate daily sessions for same section & date
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_attendance_session 
ON attendance_sessions (section_id, session_date) 
WHERE subject_id IS NULL AND period_number IS NULL;

-- Prevents duplicate period/subject sessions for same section, date, period & subject
CREATE UNIQUE INDEX IF NOT EXISTS uq_period_attendance_session 
ON attendance_sessions (section_id, session_date, period_number, subject_id) 
WHERE subject_id IS NOT NULL AND period_number IS NOT NULL;

-- 3. Dedicated student_leave_requests table for Student/Parent leave workflow
CREATE TABLE IF NOT EXISTS student_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status leave_request_status NOT NULL DEFAULT 'pending',
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_student_leave_dates CHECK (end_date >= start_date)
);

-- 4. Essential performance indexes for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_inst_sec ON attendance_sessions(institution_id, section_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(institution_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_inst_student ON attendance_records(institution_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(institution_id, status);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_inst_date ON staff_attendance(institution_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff ON staff_attendance(institution_id, staff_id);

CREATE INDEX IF NOT EXISTS idx_student_leaves_inst_student ON student_leave_requests(institution_id, student_id);
CREATE INDEX IF NOT EXISTS idx_student_leaves_inst_status ON student_leave_requests(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_student_leaves_dates ON student_leave_requests(institution_id, start_date, end_date);
