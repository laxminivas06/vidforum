-- Migration 015: Applications fee columns
-- Adds fee_amount and fee_status to applications table for student registration fee tracking

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS fee_status VARCHAR(50) DEFAULT 'unpaid';
