-- VID Platform: Phase 1 Step B Migration
-- Tables: institution_modules, refresh_tokens, subscriptions, users view, canonical permissions & role seed

-- 1. Ensure institution_modules table exists per Section 5 & Section 12
CREATE TABLE IF NOT EXISTS institution_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_institution_modules UNIQUE (institution_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_institution_modules_tenant ON institution_modules(institution_id, module_key);

-- Populate institution_modules from module_configurations if any exists
INSERT INTO institution_modules (institution_id, module_key, enabled, config, created_at, updated_at)
SELECT institution_id, module_code AS module_key, is_enabled AS enabled, config, created_at, updated_at
FROM module_configurations
ON CONFLICT (institution_id, module_key) DO UPDATE
SET enabled = EXCLUDED.enabled, config = EXCLUDED.config, updated_at = EXCLUDED.updated_at;

-- 2. Ensure subscriptions table exists per Section 5
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ DEFAULT now() + INTERVAL '1 year',
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_institution ON subscriptions(institution_id);

-- Ensure institution_plans view exists
CREATE OR REPLACE VIEW institution_plans AS SELECT * FROM subscription_plans;

-- 3. Ensure refresh_tokens table exists per Section 5
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 4. Ensure users view exists pointing to profiles
CREATE OR REPLACE VIEW users AS SELECT * FROM profiles;

-- 5. Ensure all standard roles exist in roles table
INSERT INTO roles (id, name, is_system_role)
VALUES 
  ('ec77c31b-b5da-4362-b93d-4a5af1a8bf87', 'Super Admin', true),
  ('33333333-3333-3333-3333-333333333301', 'Institution Admin', true),
  ('33333333-3333-3333-3333-333333333302', 'Faculty', false),
  ('33333333-3333-3333-3333-333333333303', 'Student', false),
  ('33333333-3333-3333-3333-333333333304', 'Parent', false),
  ('33333333-3333-3333-3333-333333333305', 'Finance Team', false),
  ('33333333-3333-3333-3333-333333333306', 'Admission Team', false),
  ('33333333-3333-3333-3333-333333333307', 'Academic Coordinator', false),
  ('33333333-3333-3333-3333-333333333308', 'Exam Team', false),
  ('33333333-3333-3333-3333-333333333309', 'HR Staff', false)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_system_role = EXCLUDED.is_system_role;

-- 6. Seed canonical permissions from docs/PERMISSIONS.md
INSERT INTO permissions (code, description, module) VALUES
  ('platform.all', 'Unrestricted platform root access', 'platform'),
  ('platform.read', 'Read platform infrastructure and telemetry', 'platform'),
  ('platform.write', 'Mutate platform settings', 'platform'),
  ('institutions.manage', 'Create, provision, activate, and suspend institutions', 'platform'),
  ('subscriptions.manage', 'Manage subscription plans and tenant quotas', 'platform'),
  ('ai.config.global', 'Global AI Yantra service models and token budgets', 'platform'),
  ('telemetry.read', 'System health, cluster metrics, and global audit inspection', 'platform'),
  ('billing.manage', 'Global invoice settlement and gateway configurations', 'platform'),
  ('institution.profile.read', 'Read institutional profile and board affiliations', 'institutions'),
  ('institution.profile.update', 'Update institutional configuration and branding', 'institutions'),
  ('institution.modules.toggle', 'Enable or disable optional modules', 'institutions'),
  ('users.manage', 'Provision, assign roles, and edit institutional staff/users', 'auth'),
  ('roles.manage', 'Inspect role capability mappings', 'auth'),
  ('admissions.enquiry.read', 'Read prospective student inquiries', 'admissions'),
  ('admissions.enquiry.create', 'Record new inquiry', 'admissions'),
  ('admissions.application.read', 'View admissions applications and kanban', 'admissions'),
  ('admissions.application.create', 'Submit new application', 'admissions'),
  ('admissions.application.verify', 'Verify submitted applicant documents', 'admissions'),
  ('admissions.application.approve', 'Execute atomic approval transaction', 'admissions'),
  ('admissions.application.reject', 'Reject application', 'admissions'),
  ('admissions.application.waitlist', 'Place application on waitlist', 'admissions'),
  ('academics.year.manage', 'Create and toggle academic calendar years', 'academics'),
  ('academics.department.manage', 'Manage academic & administrative departments', 'academics'),
  ('academics.course.manage', 'Manage course catalog', 'academics'),
  ('academics.class.manage', 'Manage classes, sections, and capacities', 'academics'),
  ('academics.subject.manage', 'Manage subject catalog and syllabus', 'academics'),
  ('academics.allocation.manage', 'Allocate faculty to classes and subjects', 'academics'),
  ('academics.promotion.manage', 'Execute student promotion / demotion pipelines', 'academics'),
  ('faculty.profile.read', 'View own faculty profile', 'faculty'),
  ('faculty.classes.read', 'View assigned classes, sections, and subjects', 'faculty'),
  ('faculty.students.read', 'View assigned student rosters', 'faculty'),
  ('faculty.timetable.read', 'View today schedule and timetable', 'faculty'),
  ('attendance.session.create', 'Open daily roll-call attendance session', 'attendance'),
  ('attendance.record.write', 'Mark student attendance', 'attendance'),
  ('examinations.config.manage', 'Configure exam types, grading scales', 'examinations'),
  ('examinations.schedule.manage', 'Publish exam schedules and rooms', 'examinations'),
  ('examinations.marks.entry', 'Enter examination marks for assigned subjects', 'examinations'),
  ('examinations.marks.import', 'Execute Excel marks import engine', 'examinations'),
  ('examinations.marks.verify', 'Verify entered marks', 'examinations'),
  ('examinations.marks.approve', 'Approve marks and lock gradebooks', 'examinations'),
  ('examinations.reportcard.generate', 'Generate student report cards and transcripts', 'examinations'),
  ('finance.structure.manage', 'Configure fee categories and schedules', 'finance'),
  ('finance.assignment.manage', 'Assign fees to students, classes, or cohorts', 'finance'),
  ('finance.invoice.read', 'View invoices ledger', 'finance'),
  ('finance.invoice.create', 'Issue fee invoices', 'finance'),
  ('finance.payment.collect', 'Record counter collections and receipts', 'finance'),
  ('finance.discount.manage', 'Apply concession/scholarship waivers', 'finance'),
  ('finance.refund.manage', 'Issue approved fee refunds', 'finance'),
  ('hrms.staff.read', 'View staff directory and employment profiles', 'hrms'),
  ('hrms.staff.manage', 'Onboard employees and manage designations', 'hrms'),
  ('hrms.attendance.manage', 'Record staff biometric / roll-call attendance', 'hrms'),
  ('hrms.leave.approve', 'Review and approve staff leave requests', 'hrms'),
  ('student.profile.view', 'View own personal profile', 'students'),
  ('student.academics.view', 'View own enrolled classes, subjects, and study materials', 'students'),
  ('student.attendance.view', 'View own attendance percentages and session logs', 'students'),
  ('student.timetable.view', 'View own class schedule', 'students'),
  ('student.fees.view', 'View own fee invoices and payment status', 'students'),
  ('student.marks.view', 'View own approved examination results and report cards', 'students'),
  ('parent.children.view', 'View linked children profiles and progress', 'students'),
  ('parent.attendance.view', 'View child daily roll-call and absence alerts', 'attendance'),
  ('parent.fees.pay', 'Pay child school tuition and view receipts', 'finance'),
  ('parent.marks.view', 'View child exam report cards and academic trajectory', 'examinations'),
  ('ai.tutor.access', 'Access AI Tutor guidance and practice', 'ai_tutor'),
  ('notifications.inbox.read', 'Read personal notifications inbox', 'notifications'),
  ('audit.logs.read', 'Inspect institutional audit trail', 'audit')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description, module = EXCLUDED.module;

-- 7. Wire role_permissions for standard roles
-- Super Admin gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ec77c31b-b5da-4362-b93d-4a5af1a8bf87', id FROM permissions
ON CONFLICT DO NOTHING;

-- Institution Admin gets all non-platform permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333301', id FROM permissions
WHERE module != 'platform'
ON CONFLICT DO NOTHING;

-- Faculty role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333302', id FROM permissions
WHERE code IN (
  'faculty.profile.read',
  'faculty.classes.read',
  'faculty.students.read',
  'faculty.timetable.read',
  'attendance.session.create',
  'attendance.record.write',
  'examinations.marks.entry',
  'ai.tutor.access',
  'notifications.inbox.read'
)
ON CONFLICT DO NOTHING;

-- Student role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333303', id FROM permissions
WHERE code LIKE 'student.%' OR code IN ('notifications.inbox.read', 'ai.tutor.access')
ON CONFLICT DO NOTHING;

-- Parent role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333304', id FROM permissions
WHERE code LIKE 'parent.%' OR code IN ('notifications.inbox.read')
ON CONFLICT DO NOTHING;

-- Finance Team role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333305', id FROM permissions
WHERE code LIKE 'finance.%' OR code IN ('notifications.inbox.read')
ON CONFLICT DO NOTHING;

-- Admission Team role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333306', id FROM permissions
WHERE code LIKE 'admissions.%' OR code IN ('notifications.inbox.read')
ON CONFLICT DO NOTHING;

-- Academic Coordinator role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333307', id FROM permissions
WHERE code LIKE 'academics.%' OR code IN ('notifications.inbox.read')
ON CONFLICT DO NOTHING;

-- Exam Team role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333308', id FROM permissions
WHERE code LIKE 'examinations.%' OR code IN ('notifications.inbox.read')
ON CONFLICT DO NOTHING;

-- HR Staff role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333309', id FROM permissions
WHERE code LIKE 'hrms.%' OR code IN ('notifications.inbox.read')
ON CONFLICT DO NOTHING;

-- 8. Ensure default module keys are populated for all institutions
DO $$
DECLARE
  inst RECORD;
  m_key TEXT;
  modules TEXT[] := ARRAY[
    'admissions', 'academics', 'faculty', 'attendance', 'examinations', 
    'finance', 'documents', 'hrms', 'timetable', 'voice_agent', 
    'ai_attendance', 'ai_tutor', 'events', 'transport', 'hostel', 
    'library', 'sports', 'inventory'
  ];
BEGIN
  FOR inst IN SELECT id FROM institutions LOOP
    FOREACH m_key IN ARRAY modules LOOP
      INSERT INTO institution_modules (institution_id, module_key, enabled)
      VALUES (inst.id, m_key, true)
      ON CONFLICT (institution_id, module_key) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
