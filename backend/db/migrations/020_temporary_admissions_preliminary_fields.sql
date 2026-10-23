-- Migration 020: Add preliminary details to temporary_admissions
ALTER TABLE temporary_admissions 
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS preliminary_address TEXT;
