-- =====================================================================
-- 012_staff_hrms_refinements.sql
-- HRMS Extended Fields: experience_years, staff_type, unique constraints
-- =====================================================================

-- 1. Add experience_years numeric column to staff
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS experience_years numeric(4,1);

-- 2. Add staff_type text column to staff
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS staff_type text DEFAULT 'teaching';

-- 3. Backfill staff_type from is_teaching_staff
UPDATE staff
SET staff_type = CASE 
  WHEN is_teaching_staff = true THEN 'teaching' 
  ELSE 'non_teaching' 
END
WHERE staff_type IS NULL OR staff_type = '';

-- 4. Backfill experience_years from numeric regex of text experience
UPDATE staff
SET experience_years = NULLIF(regexp_replace(experience, '[^0-9.]', '', 'g'), '')::numeric
WHERE experience_years IS NULL AND experience IS NOT NULL AND experience ~ '[0-9]';

-- 5. Ensure unique index on designations per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_designations_inst_name 
  ON designations (institution_id, LOWER(name));

-- 6. Ensure unique index on departments code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_inst_code 
  ON departments (institution_id, LOWER(code));
