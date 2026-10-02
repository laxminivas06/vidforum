-- =====================================================================
-- 008_phase2_hrms.sql
-- Staff & HRMS Workspace enhancements: Leave Requests, Workload, Indexes & Defaults
-- =====================================================================

-- 1. Extend leave_requests with remarks and total_days
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS total_days integer DEFAULT 1;

-- 2. Extend staff_attendance with optional remarks
ALTER TABLE staff_attendance
  ADD COLUMN IF NOT EXISTS remarks text;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_staff_inst_status
  ON staff (institution_id, employment_status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_dept
  ON staff (institution_id, department_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_desig
  ON staff (institution_id, designation_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leave_requests_inst_status
  ON leave_requests (institution_id, status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_staff
  ON leave_requests (staff_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
  ON leave_requests (institution_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_staff_employment_staff
  ON staff_employment (staff_id, effective_from DESC);

-- 4. Seed Standard Leave Types for existing institutions where missing
INSERT INTO leave_types (institution_id, name, max_days_per_year)
SELECT i.id, lt.name, lt.max_days
FROM institutions i
CROSS JOIN (
  VALUES 
    ('Casual Leave', 12),
    ('Sick Leave', 10),
    ('Earned Leave', 15),
    ('Maternity / Paternity Leave', 90),
    ('Compensatory Off', 5),
    ('Unpaid Leave', NULL)
) AS lt(name, max_days)
ON CONFLICT (institution_id, name) DO NOTHING;
