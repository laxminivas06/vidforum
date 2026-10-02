-- VID Platform: Phase 2 Step 2 Migration (Finance & Fee Management Module)
-- Ensures schema compatibility for: fee_categories, fee_groups, fee_structures, fee_structure_items,
-- student_fees, invoices, invoice_items, payments, receipts, discounts, scholarships, refunds,
-- and idempotent payment_webhook_events

-- 1. Ensure receipts, refunds, and invoices have required columns and multi-tenant isolation
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Create payment_webhook_events table for webhook idempotency (Section 9.10 & Section 18 Exit Gate)
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  gateway_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_gateway_event UNIQUE (gateway_name, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_inst ON payment_webhook_events(institution_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event ON payment_webhook_events(gateway_name, event_id);

-- 3. Essential indexes for high performance queries
CREATE INDEX IF NOT EXISTS idx_fee_structures_inst ON fee_structures(institution_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_year ON fee_structures(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class ON fee_structures(class_id);

CREATE INDEX IF NOT EXISTS idx_student_fees_inst ON student_fees(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_balance ON student_fees(institution_id, balance_due);

CREATE INDEX IF NOT EXISTS idx_invoices_inst ON invoices(institution_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fee ON invoices(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(institution_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_inst ON payments(institution_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

CREATE INDEX IF NOT EXISTS idx_receipts_payment ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
