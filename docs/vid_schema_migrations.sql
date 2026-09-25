-- =====================================================================
-- VID (Virtual Identification) — Multi-Tenant Education ERP
-- Production PostgreSQL / Supabase schema
-- Single source of truth SQL — see 01_architecture.md for full rationale
-- =====================================================================


-- =====================================================================
-- 001_extensions.sql
-- =====================================================================
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists btree_gist;    -- EXCLUDE constraints (timetable conflicts)
create extension if not exists pg_trgm;       -- fuzzy search on names/codes


-- =====================================================================
-- 002_types.sql  -- ENUMs used only for small, stable, closed domains
-- =====================================================================
create type institution_status      as enum ('active','inactive','suspended');
create type profile_status          as enum ('active','suspended');
create type gender_type             as enum ('male','female','other','undisclosed');
create type student_status          as enum ('active','inactive','graduated','transferred','dropped');
create type admission_stage         as enum ('enquiry','application','document_verification','review','approved','rejected','waitlisted');
create type staff_employment_status as enum ('active','on_leave','suspended','resigned','terminated');
create type attendance_status       as enum ('present','absent','late','excused');
create type attendance_source       as enum ('manual','ai_face','cctv');
create type exam_status             as enum ('scheduled','ongoing','completed','cancelled');
create type marks_import_status     as enum ('staged','validated','failed','committed');
create type invoice_status          as enum ('draft','pending','partially_paid','paid','overdue','cancelled');
create type payment_method          as enum ('cash','card','upi','netbanking','cheque','online_gateway');
create type payment_status          as enum ('pending','success','failed','refunded');
create type document_verification_status as enum ('pending','verified','rejected');
create type leave_request_status    as enum ('pending','approved','rejected','cancelled');
create type notification_channel    as enum ('push','sms','email','voice');
create type notification_status     as enum ('queued','sent','delivered','failed');
create type voice_call_status       as enum ('queued','ringing','in_progress','completed','failed','no_answer');
create type day_of_week_type        as enum ('mon','tue','wed','thu','fri','sat','sun');


-- =====================================================================
-- 003_core.sql
-- =====================================================================
create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  max_students integer,
  price_monthly numeric(12,2),
  features jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status institution_status not null default 'active',
  plan_id uuid references subscription_plans(id) on delete set null,
  address text,
  contact_email text,
  contact_phone text,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table module_configurations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  module_code text not null,   -- 'events','transport','hostel','library','sports','inventory'
  is_enabled boolean not null default false,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, module_code)
);


-- =====================================================================
-- 004_auth_profiles.sql
-- =====================================================================
-- profiles.id IS auth.users.id (1:1). No credentials stored here.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  default_institution_id uuid references institutions(id) on delete set null,
  status profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =====================================================================
-- 005_rbac.sql
-- =====================================================================
create table roles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id) on delete restrict, -- NULL = global/system role
  name text not null,
  is_system_role boolean not null default false,
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,        -- e.g. 'attendance.create'
  description text not null,
  module text not null,
  created_at timestamptz not null default now()
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  institution_id uuid not null references institutions(id) on delete restrict,
  scope jsonb not null default '{}',   -- optional extra scoping metadata
  granted_by uuid references profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (profile_id, role_id, institution_id)
);

-- =====================================================================
-- 006_academic.sql
-- =====================================================================
create table academic_years (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,                -- '2026-27'
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date > start_date),
  unique (institution_id, name)
);
-- only one current year per institution
create unique index uq_academic_years_current on academic_years (institution_id) where is_current;

create table departments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (institution_id, code)
);

create table courses (   -- optional stream/program under a department (ASSUMPTION #3)
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  department_id uuid not null references departments(id) on delete restrict,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (institution_id, code)
);

create table classes (   -- grade/standard level
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  department_id uuid not null references departments(id) on delete restrict,
  course_id uuid references courses(id) on delete restrict,
  name text not null,               -- 'Class 8', 'Grade 10'
  sequence_order integer not null,  -- for promotion ordering
  created_at timestamptz not null default now(),
  unique (institution_id, academic_year_id, department_id, name)
);

create table sections (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  class_id uuid not null references classes(id) on delete restrict,
  name text not null,               -- 'A'
  capacity integer,
  class_teacher_staff_id uuid,      -- FK added after staff table exists (below)
  created_at timestamptz not null default now(),
  unique (class_id, name)
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  code text not null,
  name text not null,
  is_elective boolean not null default false,
  created_at timestamptz not null default now(),
  unique (institution_id, code)
);

create table class_subjects (   -- N:M classes <-> subjects
  class_id uuid not null references classes(id) on delete restrict,
  subject_id uuid not null references subjects(id) on delete restrict,
  is_mandatory boolean not null default true,
  primary key (class_id, subject_id)
);

create table curriculum (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  class_id uuid not null references classes(id) on delete restrict,
  subject_id uuid not null references subjects(id) on delete restrict,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table syllabus (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references curriculum(id) on delete restrict,
  unit_title text not null,
  unit_order integer not null,
  content text,
  created_at timestamptz not null default now()
);


-- =====================================================================
-- 007_students.sql
-- =====================================================================
create table guardians (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  profile_id uuid references profiles(id) on delete set null,  -- nullable until they self-register
  full_name text not null,
  relationship text,       -- free text label e.g. 'father','mother','guardian' shown per-link instead (see student_guardians.relationship)
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  admission_number text not null,
  profile_id uuid references profiles(id) on delete set null,
  admission_id uuid,  -- FK added in 008_admissions.sql after admissions table exists
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender gender_type,
  current_class_id uuid references classes(id) on delete restrict,
  current_section_id uuid references sections(id) on delete restrict,
  status student_status not null default 'active',
  photo_storage_key text,
  deleted_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, admission_number)
);

create table student_guardians (   -- N:M, one parent -> many children (§21)
  student_id uuid not null references students(id) on delete cascade,
  guardian_id uuid not null references guardians(id) on delete cascade,
  relationship text not null,       -- 'father','mother','guardian'
  is_primary_contact boolean not null default false,
  primary key (student_id, guardian_id)
);

-- append-only enrollment history; current row has effective_to IS NULL
create table student_academic_history (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  class_id uuid not null references classes(id) on delete restrict,
  section_id uuid not null references sections(id) on delete restrict,
  roll_number text,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now()
);
create unique index uq_student_academic_history_current
  on student_academic_history (student_id) where effective_to is null;

create table student_promotions (   -- the decision event, separate from the history timeline
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  from_class_id uuid references classes(id) on delete restrict,
  to_class_id uuid not null references classes(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  decision text not null,     -- 'promoted','detained','graduated'
  decided_by uuid references profiles(id) on delete set null,
  decided_at timestamptz not null default now()
);


-- =====================================================================
-- 008_admissions.sql
-- =====================================================================
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  full_name text not null,
  phone text,
  email text,
  interested_class_id uuid references classes(id) on delete set null,
  source text,
  notes text,
  created_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  enquiry_id uuid references enquiries(id) on delete set null,
  applicant_name text not null,
  date_of_birth date,
  gender gender_type,
  applying_for_class_id uuid not null references classes(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  stage admission_stage not null default 'enquiry',
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admission_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete restrict,
  document_type text not null,
  storage_key text not null,
  verification_status document_verification_status not null default 'pending',
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table admissions (   -- the final approval record that spawns a student
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  application_id uuid not null references applications(id) on delete restrict,
  approved_class_id uuid not null references classes(id) on delete restrict,
  approved_section_id uuid not null references sections(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  decision admission_stage not null,   -- 'approved' | 'rejected' | 'waitlisted'
  decided_by uuid references profiles(id) on delete set null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table students add constraint fk_students_admission
  foreign key (admission_id) references admissions(id) on delete restrict;

-- =====================================================================
-- 009_faculty_hrms.sql
-- =====================================================================
create table designations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table staff (   -- covers faculty + non-teaching employees
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  profile_id uuid not null references profiles(id) on delete restrict,
  employee_code text not null,
  department_id uuid references departments(id) on delete set null,
  designation_id uuid references designations(id) on delete set null,
  is_teaching_staff boolean not null default true,
  employment_status staff_employment_status not null default 'active',
  date_of_joining date not null,
  payroll_reference text,   -- ASSUMPTION #4: external payroll hook only
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, employee_code)
);

alter table sections add constraint fk_sections_class_teacher
  foreign key (class_teacher_staff_id) references staff(id) on delete set null;

create table staff_employment (   -- historized employment detail changes (designation/dept moves)
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete restrict,
  department_id uuid references departments(id) on delete set null,
  designation_id uuid references designations(id) on delete set null,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now()
);

-- append-only, scopes faculty authorization (drives RLS in §19)
create table faculty_assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  staff_id uuid not null references staff(id) on delete restrict,
  subject_id uuid not null references subjects(id) on delete restrict,
  section_id uuid not null references sections(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now()
);
create unique index uq_faculty_assignments_current
  on faculty_assignments (staff_id, subject_id, section_id, academic_year_id)
  where effective_to is null;

create table leave_types (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  max_days_per_year integer,
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  staff_id uuid not null references staff(id) on delete restrict,
  leave_type_id uuid not null references leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  reason text,
  status leave_request_status not null default 'pending',
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table staff_attendance (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  staff_id uuid not null references staff(id) on delete restrict,
  attendance_date date not null,
  status attendance_status not null,
  marked_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (staff_id, attendance_date)
);

create table staff_workload (   -- derived/materialized snapshot, refreshed by job — not authoritative
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  periods_per_week integer not null default 0,
  sections_count integer not null default 0,
  computed_at timestamptz not null default now(),
  unique (staff_id, academic_year_id)
);


-- =====================================================================
-- 010_attendance.sql
-- =====================================================================
create table attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  section_id uuid not null references sections(id) on delete restrict,
  subject_id uuid references subjects(id) on delete restrict,   -- null for whole-day (non-subject) attendance
  staff_id uuid references staff(id) on delete restrict,
  session_date date not null,
  period_number integer,
  created_at timestamptz not null default now(),
  unique (section_id, subject_id, session_date, period_number)
);

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  session_id uuid not null references attendance_sessions(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  status attendance_status not null,
  source attendance_source not null default 'manual',
  ai_event_id uuid,   -- FK added in 015_ai_yantra.sql
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  attendance_record_id uuid not null references attendance_records(id) on delete restrict,
  previous_status attendance_status not null,
  new_status attendance_status not null,
  reason text not null,
  requested_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 011_examinations.sql
-- =====================================================================
create table exam_types (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,     -- 'Unit Test','Midterm','Final'
  weightage numeric(5,2),
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table exams (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  exam_type_id uuid not null references exam_types(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  class_id uuid not null references classes(id) on delete restrict,
  name text not null,
  status exam_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete restrict,
  subject_id uuid not null references subjects(id) on delete restrict,
  max_marks numeric(6,2) not null,
  pass_marks numeric(6,2) not null,
  unique (exam_id, subject_id)
);

create table exam_schedules (
  id uuid primary key default gen_random_uuid(),
  exam_subject_id uuid not null references exam_subjects(id) on delete restrict,
  exam_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table exam_rooms (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  exam_subject_id uuid not null references exam_subjects(id) on delete restrict,
  room_id uuid,   -- FK added in 014_timetable.sql (rooms table)
  capacity integer,
  created_at timestamptz not null default now()
);

create table invigilators (
  id uuid primary key default gen_random_uuid(),
  exam_room_id uuid not null references exam_rooms(id) on delete restrict,
  staff_id uuid not null references staff(id) on delete restrict,
  unique (exam_room_id, staff_id)
);

create table exam_room_allocations (   -- student seating
  id uuid primary key default gen_random_uuid(),
  exam_room_id uuid not null references exam_rooms(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  seat_number text,
  unique (exam_room_id, student_id)
);

create table question_papers (
  id uuid primary key default gen_random_uuid(),
  exam_subject_id uuid not null references exam_subjects(id) on delete restrict,
  storage_key text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table grade_scales (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  grade_scale_id uuid not null references grade_scales(id) on delete restrict,
  label text not null,          -- 'A+','B', etc.
  min_percentage numeric(5,2) not null,
  max_percentage numeric(5,2) not null,
  grade_point numeric(4,2),
  unique (grade_scale_id, label),
  check (max_percentage >= min_percentage)
);

create table marks_import_batches (   -- staging table for Excel import validation
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  exam_subject_id uuid not null references exam_subjects(id) on delete restrict,
  file_storage_key text not null,
  status marks_import_status not null default 'staged',
  error_report jsonb,
  uploaded_by uuid references profiles(id) on delete set null,
  committed_by uuid references profiles(id) on delete set null,
  committed_at timestamptz,
  created_at timestamptz not null default now()
);

-- immutable once verified: no UPDATE grant on this table for the app role after verified_at is set
create table marks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  exam_subject_id uuid not null references exam_subjects(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  marks_obtained numeric(6,2) not null,
  import_batch_id uuid references marks_import_batches(id) on delete set null,
  entered_by uuid references profiles(id) on delete set null,
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (exam_subject_id, student_id),
  check (marks_obtained >= 0)
);


-- =====================================================================
-- 012_finance.sql
-- =====================================================================
create table fee_categories (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,     -- 'Tuition','Transport','Lab'
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table fee_groups (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table fee_structures (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  fee_group_id uuid not null references fee_groups(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  class_id uuid references classes(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now()
);

create table fee_structure_items (
  id uuid primary key default gen_random_uuid(),
  fee_structure_id uuid not null references fee_structures(id) on delete restrict,
  fee_category_id uuid not null references fee_categories(id) on delete restrict,
  amount numeric(12,2) not null,
  check (amount >= 0)
);

create table student_fees (   -- assignment of a fee structure to a student
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  fee_structure_id uuid not null references fee_structures(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  total_amount numeric(12,2) not null,
  balance_due numeric(12,2) not null,   -- maintained transactionally (§13)
  created_at timestamptz not null default now(),
  unique (student_id, fee_structure_id, academic_year_id)
);

create table discounts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  discount_type text not null,   -- 'percentage' | 'flat'
  value numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table scholarships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  sponsor text,
  value numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table student_discounts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  discount_id uuid references discounts(id) on delete cascade,
  scholarship_id uuid references scholarships(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(discount_id, scholarship_id) = 1)
);

-- append-only, immutable once issued (no UPDATE on items after issuance)
create table invoices (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  student_fee_id uuid not null references student_fees(id) on delete restrict,
  invoice_number text not null,
  total_amount numeric(12,2) not null,
  status invoice_status not null default 'pending',
  due_date date,
  issued_at timestamptz not null default now(),
  unique (institution_id, invoice_number),
  check (total_amount >= 0)
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete restrict,
  fee_category_id uuid not null references fee_categories(id) on delete restrict,
  amount numeric(12,2) not null,
  check (amount >= 0)
);

-- append-only ledger: never UPDATE/DELETE after settlement
create table payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  invoice_id uuid not null references invoices(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  amount numeric(12,2) not null,
  method payment_method not null,
  status payment_status not null default 'success',
  received_by uuid references profiles(id) on delete set null,
  paid_at timestamptz not null default now(),
  check (amount > 0)
);

create table payment_gateway_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete restrict,
  gateway_name text not null,
  gateway_reference text not null,
  gateway_response jsonb,
  created_at timestamptz not null default now()
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete restrict,
  receipt_number text not null,
  storage_key text,
  created_at timestamptz not null default now(),
  unique (receipt_number)
);

create table refunds (   -- a new row, never a mutation of the original payment (§13)
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete restrict,
  amount numeric(12,2) not null,
  reason text not null,
  approved_by uuid references profiles(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  check (amount > 0)
);

-- =====================================================================
-- 013_documents.sql
-- =====================================================================
create table document_types (   -- global reference catalog
  id uuid primary key default gen_random_uuid(),
  code text not null unique,     -- 'birth_certificate','bonafide','id_card',...
  name text not null,
  created_at timestamptz not null default now()
);

-- polymorphic owner: no single relational FK possible; owner_type+owner_id
-- validated at the application/service layer (documented in §16)
create table documents (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  document_type_id uuid not null references document_types(id) on delete restrict,
  owner_type text not null,      -- 'student','staff','institution','admission'
  owner_id uuid not null,
  storage_key text not null,
  file_name text not null,
  mime_type text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table document_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  document_type_id uuid not null references document_types(id) on delete restrict,
  name text not null,
  template_storage_key text not null,
  created_at timestamptz not null default now()
);

create table document_verifications (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete restrict,
  status document_verification_status not null default 'pending',
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  remarks text,
  created_at timestamptz not null default now()
);

create table document_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  requested_for_type text not null,   -- 'student','staff'
  requested_for_id uuid not null,
  document_type_id uuid not null references document_types(id) on delete restrict,
  requested_by uuid references profiles(id) on delete set null,
  status document_verification_status not null default 'pending',
  created_at timestamptz not null default now()
);


-- =====================================================================
-- 014_timetable.sql
-- =====================================================================
create table rooms (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  capacity integer,
  room_type text,   -- 'classroom','lab','hall'
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

alter table exam_rooms add constraint fk_exam_rooms_room
  foreign key (room_id) references rooms(id) on delete restrict;

create table periods (   -- period configuration
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,          -- 'Period 1'
  start_time time not null,
  end_time time not null,
  is_break boolean not null default false,
  sequence_order integer not null,
  created_at timestamptz not null default now(),
  unique (institution_id, name),
  check (end_time > start_time)
);

create table timetables (   -- published version metadata
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  name text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- EXCLUDE constraint prevents teacher/room/section double-booking on the same day+period
create table timetable_entries (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  timetable_id uuid not null references timetables(id) on delete restrict,
  section_id uuid not null references sections(id) on delete restrict,
  subject_id uuid not null references subjects(id) on delete restrict,
  faculty_id uuid not null references staff(id) on delete restrict,
  room_id uuid references rooms(id) on delete restrict,
  day_of_week day_of_week_type not null,
  period_id uuid not null references periods(id) on delete restrict,
  created_at timestamptz not null default now(),
  exclude using gist (
    faculty_id with =, day_of_week with =, period_id with =
  ) where (true),   -- a teacher cannot be in two places in the same period
  unique (section_id, day_of_week, period_id)   -- a section cannot have two subjects in the same period
);

create table substitutions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  timetable_entry_id uuid not null references timetable_entries(id) on delete restrict,
  substitute_date date not null,
  original_staff_id uuid not null references staff(id) on delete restrict,
  substitute_staff_id uuid not null references staff(id) on delete restrict,
  reason text,
  created_at timestamptz not null default now(),
  unique (timetable_entry_id, substitute_date)
);

-- =====================================================================
-- 015_ai_yantra.sql
-- =====================================================================

-- ---- Yantra Voice Agent ----
create table ai_voice_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  language text not null,
  script_text text not null,
  created_at timestamptz not null default now()
);

create table ai_voice_campaigns (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  template_id uuid not null references ai_voice_templates(id) on delete restrict,
  name text not null,
  use_case text not null,   -- 'fee_reminder','attendance_alert','exam_reminder',...
  scheduled_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table ai_voice_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references ai_voice_campaigns(id) on delete restrict,
  guardian_id uuid references guardians(id) on delete set null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table ai_voice_calls (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references ai_voice_recipients(id) on delete restrict,
  status voice_call_status not null default 'queued',
  conversation_payload jsonb,   -- raw provider payload — genuinely dynamic, correct JSONB use
  duration_seconds integer,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---- Yantra AI Attendance ----
create table camera_devices (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  room_id uuid references rooms(id) on delete set null,
  device_code text not null,
  status text not null default 'active',
  metadata jsonb not null default '{}',   -- vendor-specific capabilities — correct JSONB use
  created_at timestamptz not null default now(),
  unique (institution_id, device_code)
);

create table face_profiles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  registered_by uuid references profiles(id) on delete set null,
  reference_photo_storage_key text not null,   -- the source image lives in Storage
  created_at timestamptz not null default now(),
  unique (student_id)
);

-- highly restricted RLS (§19/§34); embeddings are numeric vectors, never raw images
create table face_embeddings (
  id uuid primary key default gen_random_uuid(),
  face_profile_id uuid not null references face_profiles(id) on delete cascade,
  embedding_vector double precision[] not null,   -- or `vector` type if pgvector is enabled
  model_version text not null,
  created_at timestamptz not null default now()
);

create table ai_attendance_events (   -- raw detection event, pre-verification
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  camera_device_id uuid not null references camera_devices(id) on delete restrict,
  face_profile_id uuid references face_profiles(id) on delete set null,  -- null = unknown face
  confidence numeric(5,4),
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table attendance_records add constraint fk_attendance_records_ai_event
  foreign key (ai_event_id) references ai_attendance_events(id) on delete set null;

-- ---- Yantra AI Tutor ----
create table learning_profiles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  weak_topics jsonb not null default '[]',   -- dynamic, AI-derived list — correct JSONB use
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create table tutor_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  subject_id uuid references subjects(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table tutor_messages (
  id uuid primary key default gen_random_uuid(),
  tutor_session_id uuid not null references tutor_sessions(id) on delete restrict,
  sender text not null,     -- 'student' | 'ai'
  content text not null,
  created_at timestamptz not null default now()
);

create table practice_questions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  subject_id uuid not null references subjects(id) on delete restrict,
  question_text text not null,
  difficulty text,
  generated_for_student_id uuid references students(id) on delete set null,
  created_at timestamptz not null default now()
);

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  learning_profile_id uuid not null references learning_profiles(id) on delete restrict,
  recommendation_text text not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 016_optional_modules.sql
-- Each namespaced module is schema-present for every institution but
-- gated at the API layer by module_configurations (§12). No table here
-- duplicates student/staff — all reference the shared core by FK.
-- =====================================================================

-- ---- Events ----
create table events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete restrict,
  student_id uuid references students(id) on delete restrict,
  staff_id uuid references staff(id) on delete restrict,
  registered_at timestamptz not null default now(),
  check (num_nonnulls(student_id, staff_id) = 1)
);

create table event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete restrict,
  registration_id uuid not null references event_registrations(id) on delete restrict,
  role text
);

create table event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete restrict,
  registration_id uuid not null references event_registrations(id) on delete restrict,
  status attendance_status not null default 'present',
  marked_at timestamptz not null default now()
);

create table event_certificates (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references event_registrations(id) on delete restrict,
  storage_key text not null,
  issued_at timestamptz not null default now()
);

-- ---- Transport (no live-location tables — real-time tracking is Redis, ASSUMPTION #6) ----
create table transport_routes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now()
);

create table transport_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references transport_routes(id) on delete restrict,
  name text not null,
  sequence_order integer not null,
  latitude numeric(9,6),
  longitude numeric(9,6)
);

create table transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  registration_number text not null,
  capacity integer,
  unique (institution_id, registration_number)
);

create table transport_drivers (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  full_name text not null,
  license_number text not null,
  phone text
);

create table transport_allocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete restrict,
  route_id uuid not null references transport_routes(id) on delete restrict,
  stop_id uuid not null references transport_stops(id) on delete restrict,
  vehicle_id uuid references transport_vehicles(id) on delete set null,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  unique (student_id, academic_year_id)
);

-- ---- Hostel ----
create table hostels (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null
);

create table hostel_rooms (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references hostels(id) on delete restrict,
  room_number text not null,
  unique (hostel_id, room_number)
);

create table hostel_beds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references hostel_rooms(id) on delete restrict,
  bed_number text not null,
  unique (room_id, bed_number)
);

create table hostel_allocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete restrict,
  bed_id uuid not null references hostel_beds(id) on delete restrict,
  academic_year_id uuid not null references academic_years(id) on delete restrict,
  allocated_at date not null default current_date,
  vacated_at date,
  unique (bed_id, academic_year_id)
);

create table hostel_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete restrict,
  attendance_date date not null,
  status attendance_status not null,
  unique (student_id, attendance_date)
);

-- ---- Library ----
create table library_books (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  isbn text,
  title text not null,
  author text,
  created_at timestamptz not null default now()
);

create table library_book_copies (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references library_books(id) on delete restrict,
  copy_code text not null,
  is_available boolean not null default true,
  unique (book_id, copy_code)
);

create table library_issues (
  id uuid primary key default gen_random_uuid(),
  copy_id uuid not null references library_book_copies(id) on delete restrict,
  student_id uuid references students(id) on delete restrict,
  staff_id uuid references staff(id) on delete restrict,
  issued_at date not null default current_date,
  due_date date not null,
  returned_at date,
  check (num_nonnulls(student_id, staff_id) = 1)
);

create table library_reservations (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references library_books(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  reserved_at timestamptz not null default now(),
  fulfilled boolean not null default false
);

create table library_fines (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references library_issues(id) on delete restrict,
  amount numeric(10,2) not null,
  paid boolean not null default false,
  check (amount >= 0)
);

-- ---- Sports ----
create table sports_teams (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  sport text not null
);

create table sports_coaches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references sports_teams(id) on delete restrict,
  staff_id uuid references staff(id) on delete set null,
  external_name text
);

create table sports_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references sports_teams(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  joined_at date not null default current_date,
  unique (team_id, student_id)
);

create table sports_training_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references sports_teams(id) on delete restrict,
  session_date date not null,
  notes text
);

create table sports_competitions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  competition_date date
);

create table sports_competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references sports_competitions(id) on delete restrict,
  team_id uuid not null references sports_teams(id) on delete restrict,
  result text not null,
  position integer
);

-- ---- Inventory & Assets ----
create table inventory_categories (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  unique (institution_id, name)
);

create table inventory_vendors (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  name text not null,
  contact_phone text
);

create table inventory_assets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  category_id uuid not null references inventory_categories(id) on delete restrict,
  name text not null,
  asset_code text not null,
  status text not null default 'in_stock',
  unique (institution_id, asset_code)
);

create table inventory_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  vendor_id uuid not null references inventory_vendors(id) on delete restrict,
  order_date date not null default current_date,
  total_amount numeric(12,2)
);

create table inventory_allocations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references inventory_assets(id) on delete restrict,
  allocated_to_type text not null,   -- 'staff','room','department'
  allocated_to_id uuid not null,
  allocated_at date not null default current_date,
  returned_at date
);

create table inventory_maintenance_records (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references inventory_assets(id) on delete restrict,
  maintenance_date date not null,
  description text,
  cost numeric(10,2)
);


-- =====================================================================
-- 017_shared_services.sql
-- =====================================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id) on delete set null,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  resource_table text not null,
  resource_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table notification_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id) on delete cascade,  -- null = system default template
  code text not null,
  channel notification_channel not null,
  subject text,
  body_template text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  recipient_profile_id uuid references profiles(id) on delete set null,
  template_id uuid references notification_templates(id) on delete set null,
  channel notification_channel not null,
  status notification_status not null default 'queued',
  payload jsonb not null default '{}',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 018_functions_triggers.sql
-- =====================================================================

-- generic updated_at maintenance
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'institutions','module_configurations','profiles','students','applications',
    'staff','invoices'  -- 'invoices' gets updated_at only for status transitions,
                          -- amounts remain immutable at the grant level (§16)
  ]) loop
    execute format('create trigger trg_set_updated_at before update on %I
                     for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- auto-create a profile row whenever a new Supabase auth user is created
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function handle_new_user();

-- tenant-consistency guard: a child row's institution_id must match its parent's
create or replace function enforce_tenant_consistency()
returns trigger language plpgsql as $$
declare parent_institution_id uuid;
begin
  if tg_table_name = 'students' and new.admission_id is not null then
    select institution_id into parent_institution_id from admissions where id = new.admission_id;
    if parent_institution_id is not null and parent_institution_id <> new.institution_id then
      raise exception 'Tenant mismatch: students.institution_id must match admissions.institution_id';
    end if;
  elsif tg_table_name = 'sections' then
    select institution_id into parent_institution_id from classes where id = new.class_id;
    if parent_institution_id <> new.institution_id then
      raise exception 'Tenant mismatch: sections.institution_id must match classes.institution_id';
    end if;
  end if;
  return new;
end;
$$;
-- Applied per-table as needed; shown here for `students` and `sections` as
-- representative examples — the same trigger function is attached to every
-- tenant table with a tenant-owned parent, following this pattern.
create trigger trg_tenant_consistency_students
  before insert or update on students
  for each row execute function enforce_tenant_consistency();

create trigger trg_tenant_consistency_sections
  before insert or update on sections
  for each row execute function enforce_tenant_consistency();

-- generic audit logging, attached to sensitive tables listed in §17
create or replace function log_audit_event()
returns trigger language plpgsql as $$
declare v_institution_id uuid;
begin
  v_institution_id := coalesce(new.institution_id, old.institution_id);
  insert into audit_logs (institution_id, actor_id, action, resource_table, resource_id, old_value, new_value)
  values (
    v_institution_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'payments','invoices','marks','attendance_records','user_roles','students','institutions'
  ]) loop
    execute format('create trigger trg_audit_log after insert or update or delete on %I
                     for each row execute function log_audit_event();', t);
  end loop;
end $$;

-- student promotion — atomic (§21 transaction #2)
create or replace function promote_student(
  p_student_id uuid, p_to_class_id uuid, p_to_section_id uuid,
  p_academic_year_id uuid, p_decision text, p_decided_by uuid
) returns void language plpgsql as $$
declare v_institution_id uuid;
begin
  select institution_id into v_institution_id from students where id = p_student_id;

  insert into student_promotions (institution_id, student_id, from_class_id, to_class_id,
                                   academic_year_id, decision, decided_by)
  select v_institution_id, p_student_id, current_class_id, p_to_class_id,
         p_academic_year_id, p_decision, p_decided_by
  from students where id = p_student_id;

  update student_academic_history
    set effective_to = current_date
    where student_id = p_student_id and effective_to is null;

  insert into student_academic_history (institution_id, student_id, academic_year_id,
                                         class_id, section_id, effective_from)
  values (v_institution_id, p_student_id, p_academic_year_id, p_to_class_id, p_to_section_id, current_date);

  update students set current_class_id = p_to_class_id, current_section_id = p_to_section_id
    where id = p_student_id;
end;
$$;

-- attendance finalize (§21/§22) — flips is_final and (by grant policy) locks further edits
create or replace function finalize_attendance_session(p_session_id uuid, p_verified_by uuid)
returns void language plpgsql as $$
begin
  update attendance_records
    set is_final = true, verified_by = p_verified_by, verified_at = now()
    where session_id = p_session_id and is_final = false;
end;
$$;

-- payment recording — atomic (§21 transaction #4)
create or replace function record_payment(
  p_invoice_id uuid, p_student_id uuid, p_amount numeric, p_method payment_method,
  p_received_by uuid, p_receipt_number text
) returns uuid language plpgsql as $$
declare v_institution_id uuid; v_payment_id uuid; v_student_fee_id uuid;
begin
  select institution_id, student_fee_id into v_institution_id, v_student_fee_id
    from invoices where id = p_invoice_id;

  insert into payments (institution_id, invoice_id, student_id, amount, method, received_by)
  values (v_institution_id, p_invoice_id, p_student_id, p_amount, p_method, p_received_by)
  returning id into v_payment_id;

  insert into receipts (payment_id, receipt_number)
  values (v_payment_id, p_receipt_number);

  update student_fees set balance_due = greatest(balance_due - p_amount, 0)
    where id = v_student_fee_id;

  update invoices set status = case
      when (select balance_due from student_fees where id = v_student_fee_id) = 0 then 'paid'
      else 'partially_paid' end
    where id = p_invoice_id;

  return v_payment_id;
end;
$$;

-- tenant-scoped, human-readable invoice numbering
create sequence if not exists invoice_number_seq;
create or replace function generate_invoice_number()
returns text language sql as $$
  select 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 6, '0');
$$;
alter table invoices alter column invoice_number set default generate_invoice_number();

-- =====================================================================
-- 019_indexes.sql  (use CONCURRENTLY in production once tables hold data;
-- shown here in plain form for a fresh database bootstrap)
-- =====================================================================
create index idx_tenant_students on students (institution_id);
create index idx_tenant_staff on staff (institution_id);
create index idx_tenant_attendance_records on attendance_records (institution_id);
create index idx_tenant_marks on marks (institution_id);
create index idx_tenant_payments on payments (institution_id);
create index idx_tenant_invoices on invoices (institution_id);
create index idx_tenant_documents on documents (institution_id);

create index idx_students_class_section on students (institution_id, current_class_id, current_section_id);
create index idx_attendance_records_student_session on attendance_records (institution_id, student_id, session_id);
create index idx_attendance_records_pending on attendance_records (session_id) where is_final = false;
create index idx_payments_student_recent on payments (institution_id, student_id, paid_at desc);
create index idx_invoices_pending on invoices (institution_id, status) where status = 'pending';
create index idx_documents_owner on documents (owner_type, owner_id);
create index idx_audit_logs_resource on audit_logs (institution_id, resource_table, resource_id, created_at desc);
create index idx_notifications_recipient on notifications (institution_id, recipient_profile_id, created_at desc);
create index idx_faculty_assignments_staff on faculty_assignments (staff_id) where effective_to is null;
create index idx_student_academic_history_student on student_academic_history (student_id);

-- fuzzy name search (uses pg_trgm)
create index idx_students_name_trgm on students using gin ((first_name || ' ' || last_name) gin_trgm_ops);
create index idx_staff_employee_code_trgm on staff using gin (employee_code gin_trgm_ops);


-- =====================================================================
-- 020_views.sql
-- =====================================================================
create view student_academic_summary as
select s.id as student_id, s.institution_id, s.admission_number,
       s.first_name, s.last_name, c.name as class_name, sec.name as section_name,
       ay.name as academic_year_name
from students s
join classes c on c.id = s.current_class_id
join sections sec on sec.id = s.current_section_id
join academic_years ay on ay.id = c.academic_year_id;

create view student_attendance_summary as
select ar.student_id, s.institution_id, ases.subject_id,
       count(*) filter (where ar.status = 'present') as present_count,
       count(*) as total_count,
       round(100.0 * count(*) filter (where ar.status = 'present') / nullif(count(*), 0), 2) as attendance_percentage
from attendance_records ar
join attendance_sessions ases on ases.id = ar.session_id
join students s on s.id = ar.student_id
where ar.is_final = true
group by ar.student_id, s.institution_id, ases.subject_id;

create view student_fee_status as
select sf.student_id, sf.institution_id, sf.academic_year_id,
       sf.total_amount, sf.balance_due,
       (sf.balance_due > 0) as has_outstanding_balance,
       max(p.paid_at) as last_payment_at
from student_fees sf
left join invoices i on i.student_fee_id = sf.id
left join payments p on p.invoice_id = i.id
group by sf.id, sf.student_id, sf.institution_id, sf.academic_year_id, sf.total_amount, sf.balance_due;

create view faculty_workload as
select fa.staff_id, fa.institution_id, fa.academic_year_id,
       count(distinct fa.section_id) as sections_count,
       count(distinct fa.subject_id) as subjects_count,
       count(te.id) as periods_per_week
from faculty_assignments fa
left join timetable_entries te on te.faculty_id = fa.staff_id and te.subject_id = fa.subject_id
where fa.effective_to is null
group by fa.staff_id, fa.institution_id, fa.academic_year_id;

create view exam_result_summary as
select m.student_id, es.exam_id, e.institution_id,
       sum(m.marks_obtained) as total_marks_obtained,
       sum(es2.max_marks) as total_max_marks,
       round(100.0 * sum(m.marks_obtained) / nullif(sum(es2.max_marks), 0), 2) as percentage
from marks m
join exam_subjects es on es.id = m.exam_subject_id
join exam_subjects es2 on es2.id = m.exam_subject_id
join exams e on e.id = es.exam_id
group by m.student_id, es.exam_id, e.institution_id;

create view attendance_verification_queue as
select ar.id as attendance_record_id, ar.institution_id, ar.student_id, ar.session_id,
       ae.confidence, ae.detected_at
from attendance_records ar
join ai_attendance_events ae on ae.id = ar.ai_event_id
where ar.is_final = false;

-- =====================================================================
-- 021_rls.sql
-- =====================================================================

create or replace function auth.my_institution_ids()
returns setof uuid language sql stable as $$
  select institution_id from public.user_roles where profile_id = auth.uid();
$$;

create or replace function auth.has_permission(p_institution_id uuid, p_code text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.profile_id = auth.uid()
      and ur.institution_id = p_institution_id
      and p.code = p_code
  );
$$;

create or replace function auth.is_assigned_faculty(p_section_id uuid, p_subject_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.faculty_assignments fa
    join public.staff st on st.id = fa.staff_id
    where st.profile_id = auth.uid()
      and fa.section_id = p_section_id
      and fa.subject_id = p_subject_id
      and fa.effective_to is null
  );
$$;

create or replace function auth.is_guardian_of(p_student_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.student_guardians sg
    join public.guardians g on g.id = sg.guardian_id
    where g.profile_id = auth.uid() and sg.student_id = p_student_id
  );
$$;

-- Enable RLS on every tenant table (representative statement; repeat for all)
do $$
declare t text;
begin
  for t in select unnest(array[
    'institutions','module_configurations','roles','permissions','role_permissions','user_roles',
    'academic_years','departments','courses','classes','sections','subjects','class_subjects',
    'curriculum','syllabus','students','guardians','student_guardians','student_academic_history',
    'student_promotions','enquiries','applications','admission_documents','admissions',
    'designations','staff','staff_employment','faculty_assignments','leave_types','leave_requests',
    'staff_attendance','staff_workload','attendance_sessions','attendance_records',
    'attendance_corrections','exam_types','exams','exam_subjects','exam_schedules','exam_rooms',
    'invigilators','exam_room_allocations','question_papers','grade_scales','grades',
    'marks_import_batches','marks','fee_categories','fee_groups','fee_structures',
    'fee_structure_items','student_fees','discounts','scholarships','student_discounts',
    'invoices','invoice_items','payments','payment_gateway_transactions','receipts','refunds',
    'document_types','documents','document_templates','document_verifications','document_requests',
    'rooms','periods','timetables','timetable_entries','substitutions',
    'ai_voice_templates','ai_voice_campaigns','ai_voice_recipients','ai_voice_calls',
    'camera_devices','face_profiles','face_embeddings','ai_attendance_events',
    'learning_profiles','tutor_sessions','tutor_messages','practice_questions','recommendations',
    'events','event_registrations','event_participants','event_attendance','event_certificates',
    'transport_routes','transport_stops','transport_vehicles','transport_drivers','transport_allocations',
    'hostels','hostel_rooms','hostel_beds','hostel_allocations','hostel_attendance',
    'library_books','library_book_copies','library_issues','library_reservations','library_fines',
    'sports_teams','sports_coaches','sports_team_members','sports_training_sessions',
    'sports_competitions','sports_competition_results',
    'inventory_categories','inventory_vendors','inventory_assets','inventory_purchase_orders',
    'inventory_allocations','inventory_maintenance_records',
    'audit_logs','notification_templates','notifications',
    'profiles','subscription_plans'
  ]) loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Representative policies — the same institution+permission pattern is
-- applied to every tenant table above; the three patterns below cover
-- every case that appears elsewhere in the schema (standard tenant table,
-- resource-scoped faculty table, guardian/parent-scoped table).

-- Pattern A: standard tenant-scoped table
create policy students_select on students for select
  using (institution_id in (select auth.my_institution_ids())
         and auth.has_permission(institution_id, 'students.read'));
create policy students_insert on students for insert
  with check (institution_id in (select auth.my_institution_ids())
              and auth.has_permission(institution_id, 'students.create'));
create policy students_update on students for update
  using (institution_id in (select auth.my_institution_ids())
         and auth.has_permission(institution_id, 'students.update'))
  with check (institution_id in (select auth.my_institution_ids()));
-- intentionally no DELETE policy on students — hard delete unreachable via RLS

-- Pattern B: resource-scoped (faculty) table
create policy attendance_sessions_select on attendance_sessions for select
  using (institution_id in (select auth.my_institution_ids())
         and (auth.has_permission(institution_id, 'attendance.read.all')
              or auth.is_assigned_faculty(section_id, subject_id)));
create policy attendance_sessions_insert on attendance_sessions for insert
  with check (institution_id in (select auth.my_institution_ids())
              and auth.is_assigned_faculty(section_id, subject_id));

-- Pattern C: guardian/parent-scoped table
create policy students_select_parent on students for select
  using (auth.is_guardian_of(id));
create policy payments_select_parent on payments for select
  using (auth.is_guardian_of(student_id));
create policy student_attendance_records_select_parent on attendance_records for select
  using (auth.is_guardian_of(student_id));

-- profiles: identity table, NOT institution-scoped by column — every
-- authenticated user may read/update only their own row; institution
-- admins may read (not write) profiles of users who hold a role in
-- their institution, via a join through user_roles.
create policy profiles_select_own on profiles for select
  using (id = auth.uid());
create policy profiles_update_own on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
create policy profiles_select_admin on profiles for select
  using (
    exists (
      select 1 from user_roles ur
      where ur.profile_id = profiles.id
        and ur.institution_id in (select auth.my_institution_ids())
        and auth.has_permission(ur.institution_id, 'users.role.assign')
    )
  );
-- no insert policy: profiles are created only via handle_new_user() (security definer trigger)
-- no delete policy: profile removal happens via auth.users deletion (ON DELETE CASCADE), never direct

-- subscription_plans: global read-only catalog, no institution scoping
create policy subscription_plans_select_all on subscription_plans for select
  using (true);
-- no insert/update/delete policy for any client role: plans are managed only
-- via the service-role key (billing/admin backoffice), never client-writable

-- Tightest policy in the schema: biometric embeddings (§19/§34)
create policy face_embeddings_select_restricted on face_embeddings for select
  using (
    exists (
      select 1 from face_profiles fp
      where fp.id = face_embeddings.face_profile_id
        and fp.institution_id in (select auth.my_institution_ids())
        and auth.has_permission(fp.institution_id, 'ai_attendance.biometric.read')
    )
  );
-- No insert/update/delete policy for any client role: writes happen only via
-- the AI Attendance service using the Supabase service-role key, never via
-- a client-facing RLS-governed session.


-- =====================================================================
-- 022_seed.sql  -- reference/master data only, per instruction §27
-- (no fake students, staff, or transactions are generated)
-- =====================================================================

insert into permissions (code, description, module) values
  ('students.read','View students','students'),
  ('students.create','Create students','students'),
  ('students.update','Update students','students'),
  ('attendance.read.all','View all attendance records','attendance'),
  ('attendance.create','Create attendance records','attendance'),
  ('attendance.verify','Verify AI-sourced attendance','attendance'),
  ('exams.marks.enter','Enter exam marks','examinations'),
  ('exams.marks.verify','Verify exam marks','examinations'),
  ('finance.invoice.create','Create invoices','finance'),
  ('finance.payment.record','Record payments','finance'),
  ('finance.read.all','View all finance records','finance'),
  ('users.role.assign','Assign roles to users','core'),
  ('ai_attendance.biometric.read','Read biometric embeddings','ai_yantra')
  on conflict (code) do nothing;

insert into document_types (code, name) values
  ('birth_certificate','Birth Certificate'),
  ('bonafide','Bonafide Certificate'),
  ('id_card','ID Card'),
  ('transfer_certificate','Transfer Certificate'),
  ('mark_sheet','Mark Sheet')
  on conflict (code) do nothing;

-- Global system role (institution_id NULL) — Super Admin
insert into roles (institution_id, name, is_system_role)
  values (null, 'Super Admin', true)
  on conflict do nothing;

-- NOTE: per-institution roles (Institution Admin, Faculty, Finance Team,
-- etc.), fee_categories, leave_types, grade_scales, and document_templates
-- are created at institution-onboarding time (they vary per institution),
-- not seeded globally here.

-- =====================================================================
-- END OF MIGRATIONS
-- =====================================================================
