-- =====================================================================
-- 009_staff_extended_fields.sql
-- Add extended profile fields to staff: qualification, university, subjects, experience, address, BOD/DOB, gender
-- =====================================================================

ALTER TABLE staff 
  ADD COLUMN IF NOT EXISTS qualification text,
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS subjects text,
  ADD COLUMN IF NOT EXISTS experience text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text;
