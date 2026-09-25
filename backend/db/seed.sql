-- =====================================================================
-- VID Platform Baseline Master & Demo Data Seed
-- =====================================================================

-- 1. Subscription Plans
INSERT INTO subscription_plans (id, code, name, max_students, price_monthly, features) VALUES
  ('11111111-1111-1111-1111-111111111101', 'BASIC', 'Starter Tier', 500, 499.00, '{"attendance": true, "finance": false, "ai_yantra": false}'),
  ('11111111-1111-1111-1111-111111111102', 'PRO', 'Professional Campus', 2000, 1299.00, '{"attendance": true, "finance": true, "ai_yantra": false, "optional_modules": 3}'),
  ('11111111-1111-1111-1111-111111111103', 'ENTERPRISE', 'Full Ecosystem Enterprise', 10000, 2999.00, '{"attendance": true, "finance": true, "ai_yantra": true, "optional_modules": 6}')
ON CONFLICT (code) DO NOTHING;

-- 2. Institutions
INSERT INTO institutions (id, code, name, status, plan_id, address, contact_email, contact_phone, settings) VALUES
  ('22222222-2222-2222-2222-222222222201', 'SIA-BLR', 'Springfield International Academy', 'active', '11111111-1111-1111-1111-111111111103', 'Whitefield, Bangalore, Karnataka, India', 'contact@springfield.edu', '+91 80 4123 4567', '{"currency": "INR", "timezone": "Asia/Kolkata", "domain": "springfield.vid.edu"}'),
  ('22222222-2222-2222-2222-222222222202', 'SJHW-DEL', 'St. Jude Heritage World School', 'active', '11111111-1111-1111-1111-111111111102', 'Vasant Kunj, New Delhi, India', 'admissions@stjude.vid.edu', '+91 11 2612 8900', '{"currency": "INR", "timezone": "Asia/Kolkata", "domain": "stjude.vid.edu"}'),
  ('22222222-2222-2222-2222-222222222203', 'OGSC-HYD', 'Oakridge Global STEM Campus', 'active', '11111111-1111-1111-1111-111111111103', 'Gachibowli, Hyderabad, Telangana, India', 'info@oakridge.vid.edu', '+91 40 6688 1234', '{"currency": "INR", "timezone": "Asia/Kolkata", "domain": "oakridge.vid.edu"}'),
  ('22222222-2222-2222-2222-222222222204', 'PMC-MUM', 'Presidency Model Collegiate', 'inactive', '11111111-1111-1111-1111-111111111101', 'Bandra West, Mumbai, Maharashtra, India', 'office@presidency.vid.edu', '+91 22 2640 5500', '{"currency": "INR", "timezone": "Asia/Kolkata", "domain": "presidency.vid.edu"}')
ON CONFLICT (code) DO NOTHING;

-- 3. Module Configurations for Springfield
INSERT INTO module_configurations (institution_id, module_code, is_enabled, config) VALUES
  ('22222222-2222-2222-2222-222222222201', 'events', true, '{"allow_external": false}'),
  ('22222222-2222-2222-2222-222222222201', 'transport', true, '{"gps_tracking": true}'),
  ('22222222-2222-2222-2222-222222222201', 'hostel', true, '{"curfew_hours": "20:00"}'),
  ('22222222-2222-2222-2222-222222222201', 'library', true, '{"max_borrow_days": 14}'),
  ('22222222-2222-2222-2222-222222222201', 'sports', true, '{"inter_school": true}'),
  ('22222222-2222-2222-2222-222222222201', 'inventory', true, '{"low_stock_threshold": 10}')
ON CONFLICT (institution_id, module_code) DO NOTHING;

-- 4. Institution Roles
INSERT INTO roles (id, institution_id, name, is_system_role) VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'Institution Admin', true),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 'Faculty', false),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201', 'Student', false),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222201', 'Parent', false),
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222201', 'Finance Staff', false),
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222201', 'Admissions Officer', false)
ON CONFLICT (institution_id, name) DO NOTHING;

-- 5. Link Admin Role to All Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333301', id FROM permissions
ON CONFLICT DO NOTHING;

-- 6. Seed Users in auth.users and profiles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES 
  ('44444444-4444-4444-4444-444444444401', 'admin@springfield.edu', '$2a$10$e8R6.VvM6J8yU9tQ1iZ1yOeqx9tQx9tQx9tQx9tQx9tQx9tQx9tQ.', now(), '{"full_name": "Dr. Alistair Vance"}'),
  ('44444444-4444-4444-4444-444444444402', 'revathi.raman@springfield.edu', '$2a$10$e8R6.VvM6J8yU9tQ1iZ1yOeqx9tQx9tQx9tQx9tQx9tQx9tQx9tQ.', now(), '{"full_name": "Mrs. Revathi Raman"}'),
  ('44444444-4444-4444-4444-444444444403', 'arvind.rao@springfield.edu', '$2a$10$e8R6.VvM6J8yU9tQ1iZ1yOeqx9tQx9tQx9tQx9tQx9tQx9tQx9tQ.', now(), '{"full_name": "Dr. Arvind Rao"}'),
  ('44444444-4444-4444-4444-444444444404', 'superadmin@vid.edu', '$2a$10$e8R6.VvM6J8yU9tQ1iZ1yOeqx9tQx9tQx9tQx9tQx9tQx9tQx9tQ.', now(), '{"full_name": "VID Platform Super Admin"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, email, phone, default_institution_id, status) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Dr. Alistair Vance', 'admin@springfield.edu', '+91 98450 11223', '22222222-2222-2222-2222-222222222201', 'active'),
  ('44444444-4444-4444-4444-444444444402', 'Mrs. Revathi Raman', 'revathi.raman@springfield.edu', '+91 98451 22910', '22222222-2222-2222-2222-222222222201', 'active'),
  ('44444444-4444-4444-4444-444444444403', 'Dr. Arvind Rao', 'arvind.rao@springfield.edu', '+91 97412 33490', '22222222-2222-2222-2222-222222222201', 'active'),
  ('44444444-4444-4444-4444-444444444404', 'VID Platform Super Admin', 'superadmin@vid.edu', '+91 99999 00000', '22222222-2222-2222-2222-222222222201', 'active')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

-- Assign Roles
INSERT INTO user_roles (profile_id, role_id, institution_id) VALUES
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201'),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201'),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201')
ON CONFLICT (profile_id, role_id, institution_id) DO NOTHING;

-- 7. Academic Structure
INSERT INTO academic_years (id, institution_id, name, start_date, end_date, is_current) VALUES
  ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', '2026-27', '2026-06-01', '2027-04-30', true)
ON CONFLICT (institution_id, name) DO NOTHING;

INSERT INTO departments (id, institution_id, code, name) VALUES
  ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', 'MATH', 'Department of Mathematics'),
  ('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222201', 'SCI', 'Department of Science'),
  ('66666666-6666-6666-6666-666666666603', '22222222-2222-2222-2222-222222222201', 'CS', 'Department of Computer Science & AI')
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO classes (id, institution_id, academic_year_id, department_id, name, sequence_order) VALUES
  ('77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666601', 'Grade 9', 9),
  ('77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666601', 'Grade 10', 10),
  ('77777777-7777-7777-7777-777777777703', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666602', 'Grade 11', 11),
  ('77777777-7777-7777-7777-777777777704', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666602', 'Grade 12', 12)
ON CONFLICT (institution_id, academic_year_id, department_id, name) DO NOTHING;

INSERT INTO sections (id, institution_id, class_id, name, capacity) VALUES
  ('88888888-8888-8888-8888-888888888801', '22222222-2222-2222-2222-222222222201', '77777777-7777-7777-7777-777777777702', 'Section A', 40),
  ('88888888-8888-8888-8888-888888888802', '22222222-2222-2222-2222-222222222201', '77777777-7777-7777-7777-777777777702', 'Section B', 40),
  ('88888888-8888-8888-8888-888888888803', '22222222-2222-2222-2222-222222222201', '77777777-7777-7777-7777-777777777703', 'Section A (Science)', 45)
ON CONFLICT (class_id, name) DO NOTHING;

INSERT INTO subjects (id, institution_id, code, name, is_elective) VALUES
  ('99999999-9999-9999-9999-999999999901', '22222222-2222-2222-2222-222222222201', 'MAT101', 'Mathematics', false),
  ('99999999-9999-9999-9999-999999999902', '22222222-2222-2222-2222-222222222201', 'SCI102', 'Physics & Chemistry', false),
  ('99999999-9999-9999-9999-999999999903', '22222222-2222-2222-2222-222222222201', 'ENG103', 'English Language & Lit', false),
  ('99999999-9999-9999-9999-999999999904', '22222222-2222-2222-2222-222222222201', 'CS104', 'Computer Applications', true),
  ('99999999-9999-9999-9999-999999999905', '22222222-2222-2222-2222-222222222201', 'PHY201', 'Advanced Physics', false)
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO class_subjects (class_id, subject_id, is_mandatory) VALUES
  ('77777777-7777-7777-7777-777777777702', '99999999-9999-9999-9999-999999999901', true),
  ('77777777-7777-7777-7777-777777777702', '99999999-9999-9999-9999-999999999902', true),
  ('77777777-7777-7777-7777-777777777702', '99999999-9999-9999-9999-999999999903', true),
  ('77777777-7777-7777-7777-777777777702', '99999999-9999-9999-9999-999999999904', false)
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- 8. Staff / Faculty
INSERT INTO designations (id, institution_id, name) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222201', 'Senior Mathematics Lecturer & HOD'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '22222222-2222-2222-2222-222222222201', 'Head of Physical Sciences')
ON CONFLICT (institution_id, name) DO NOTHING;

INSERT INTO staff (id, institution_id, profile_id, employee_code, department_id, designation_id, is_teaching_staff, employment_status, date_of_joining) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444402', 'FAC-EMP-1042', '66666666-6666-6666-6666-666666666601', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'active', '2021-06-01'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444403', 'FAC-EMP-1088', '66666666-6666-6666-6666-666666666602', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', true, 'active', '2022-08-15')
ON CONFLICT (institution_id, employee_code) DO NOTHING;

-- Faculty Assignments
INSERT INTO faculty_assignments (institution_id, staff_id, subject_id, section_id, academic_year_id) VALUES
  ('22222222-2222-2222-2222-222222222201', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '99999999-9999-9999-9999-999999999901', '88888888-8888-8888-8888-888888888801', '55555555-5555-5555-5555-555555555501'),
  ('22222222-2222-2222-2222-222222222201', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '99999999-9999-9999-9999-999999999901', '88888888-8888-8888-8888-888888888802', '55555555-5555-5555-5555-555555555501'),
  ('22222222-2222-2222-2222-222222222201', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '99999999-9999-9999-9999-999999999905', '88888888-8888-8888-8888-888888888803', '55555555-5555-5555-5555-555555555501')
ON CONFLICT DO NOTHING;

-- 9. Central Students Master Record
INSERT INTO students (id, institution_id, admission_number, first_name, last_name, date_of_birth, gender, current_class_id, current_section_id, status) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '22222222-2222-2222-2222-222222222201', 'SIA-2026-042', 'Aarav', 'Sharma', '2011-04-12', 'male', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888801', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '22222222-2222-2222-2222-222222222201', 'SIA-2026-043', 'Rhea', 'Nair', '2010-09-24', 'female', '77777777-7777-7777-7777-777777777703', '88888888-8888-8888-8888-888888888803', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '22222222-2222-2222-2222-222222222201', 'SIA-2026-044', 'Zaid', 'Khan', '2012-01-18', 'male', '77777777-7777-7777-7777-777777777701', '88888888-8888-8888-8888-888888888801', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc04', '22222222-2222-2222-2222-222222222201', 'SIA-2026-045', 'Ananya', 'Iyer', '2011-11-05', 'female', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888802', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc05', '22222222-2222-2222-2222-222222222201', 'SIA-2026-046', 'Devansh', 'Patel', '2010-07-30', 'male', '77777777-7777-7777-7777-777777777703', '88888888-8888-8888-8888-888888888803', 'active')
ON CONFLICT (institution_id, admission_number) DO NOTHING;

-- Student Academic History
INSERT INTO student_academic_history (institution_id, student_id, academic_year_id, class_id, section_id, roll_number, effective_from) VALUES
  ('22222222-2222-2222-2222-222222222201', 'cccccccc-cccc-cccc-cccc-cccccccccc01', '55555555-5555-5555-5555-555555555501', '77777777-7777-7777-7777-777777777702', '88888888-8888-8888-8888-888888888801', '10A-01', '2026-06-01'),
  ('22222222-2222-2222-2222-222222222201', 'cccccccc-cccc-cccc-cccc-cccccccccc02', '55555555-5555-5555-5555-555555555501', '77777777-7777-7777-7777-777777777703', '88888888-8888-8888-8888-888888888803', '11S-01', '2026-06-01')
ON CONFLICT DO NOTHING;

-- 10. Guardians
INSERT INTO guardians (id, institution_id, full_name, relationship, phone, email) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '22222222-2222-2222-2222-222222222201', 'Vikram Sharma', 'Father', '+91 98450 12345', 'vikram.sharma@example.com'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '22222222-2222-2222-2222-222222222201', 'Sunita Nair', 'Mother', '+91 97410 88219', 'sunita.nair@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary_contact) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'Father', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'dddddddd-dddd-dddd-dddd-dddddddddd02', 'Mother', true)
ON CONFLICT (student_id, guardian_id) DO NOTHING;

-- 11. Admissions Applications (Matches Kanban stages)
INSERT INTO applications (id, institution_id, applicant_name, date_of_birth, gender, applying_for_class_id, academic_year_id, guardian_name, guardian_phone, guardian_email, stage) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', '22222222-2222-2222-2222-222222222201', 'Aarav Sharma', '2011-04-12', 'male', '77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555501', 'Vikram Sharma', '+91 98450 12345', 'vikram.sharma@example.com', 'enquiry'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', '22222222-2222-2222-2222-222222222201', 'Rhea Nair', '2010-09-24', 'female', '77777777-7777-7777-7777-777777777703', '55555555-5555-5555-5555-555555555501', 'Sunita Nair', '+91 97410 88219', 'sunita.nair@example.com', 'application'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', '22222222-2222-2222-2222-222222222201', 'Zaid Khan', '2012-01-18', 'male', '77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555501', 'Farhan Khan', '+91 99001 54321', 'farhan.k@example.com', 'document_verification'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', '22222222-2222-2222-2222-222222222201', 'Ananya Iyer', '2011-11-05', 'female', '77777777-7777-7777-7777-777777777702', '55555555-5555-5555-5555-555555555501', 'Karthik Iyer', '+91 98860 99421', 'karthik.iyer@example.com', 'review'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', '22222222-2222-2222-2222-222222222201', 'Devansh Patel', '2010-07-30', 'male', '77777777-7777-7777-7777-777777777703', '55555555-5555-5555-5555-555555555501', 'Nilesh Patel', '+91 94250 67123', 'nilesh.patel@example.com', 'approved')
ON CONFLICT DO NOTHING;

-- 12. Fee Management & Invoices
INSERT INTO fee_categories (id, institution_id, name) VALUES
  ('10101010-1010-1010-1010-101010101001', '22222222-2222-2222-2222-222222222201', 'Tuition Fee'),
  ('10101010-1010-1010-1010-101010101002', '22222222-2222-2222-2222-222222222201', 'STEM Lab Fee'),
  ('10101010-1010-1010-1010-101010101003', '22222222-2222-2222-2222-222222222201', 'Library & Activities')
ON CONFLICT (institution_id, name) DO NOTHING;

INSERT INTO fee_groups (id, institution_id, name) VALUES
  ('11223344-5566-7788-9900-aabbccddeeff', '22222222-2222-2222-2222-222222222201', 'General Secondary Batch')
ON CONFLICT (institution_id, name) DO NOTHING;

INSERT INTO fee_structures (id, institution_id, fee_group_id, academic_year_id, class_id, name) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffff01', '22222222-2222-2222-2222-222222222201', '11223344-5566-7788-9900-aabbccddeeff', '55555555-5555-5555-5555-555555555501', '77777777-7777-7777-7777-777777777702', 'Standard Secondary Fee 2026-27')
ON CONFLICT DO NOTHING;

INSERT INTO fee_structure_items (fee_structure_id, fee_category_id, amount) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffff01', '10101010-1010-1010-1010-101010101001', 75000.00),
  ('ffffffff-ffff-ffff-ffff-ffffffffff01', '10101010-1010-1010-1010-101010101002', 12000.00),
  ('ffffffff-ffff-ffff-ffff-ffffffffff01', '10101010-1010-1010-1010-101010101003', 8000.00)
ON CONFLICT DO NOTHING;

INSERT INTO student_fees (id, institution_id, student_id, academic_year_id, fee_structure_id, total_amount, balance_due) VALUES
  ('12121212-1212-1212-1212-121212121201', '22222222-2222-2222-2222-222222222201', 'cccccccc-cccc-cccc-cccc-cccccccccc01', '55555555-5555-5555-5555-555555555501', 'ffffffff-ffff-ffff-ffff-ffffffffff01', 95000.00, 0.00),
  ('12121212-1212-1212-1212-121212121202', '22222222-2222-2222-2222-222222222201', 'cccccccc-cccc-cccc-cccc-cccccccccc02', '55555555-5555-5555-5555-555555555501', 'ffffffff-ffff-ffff-ffff-ffffffffff01', 95000.00, 47500.00)
ON CONFLICT DO NOTHING;

INSERT INTO invoices (id, institution_id, student_fee_id, invoice_number, total_amount, status, due_date) VALUES
  ('13131313-1313-1313-1313-131313131301', '22222222-2222-2222-2222-222222222201', '12121212-1212-1212-1212-121212121201', 'INV-2026-000001', 48500.00, 'paid', '2026-09-01'),
  ('13131313-1313-1313-1313-131313131302', '22222222-2222-2222-2222-222222222201', '12121212-1212-1212-1212-121212121202', 'INV-2026-000002', 47500.00, 'pending', '2026-10-15')
ON CONFLICT (institution_id, invoice_number) DO NOTHING;
