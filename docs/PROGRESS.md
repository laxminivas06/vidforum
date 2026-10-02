# VID Platform: Build Progress Tracker

**Document:** `/docs/PROGRESS.md`  
**Execution Standard:** Section 18 Phased Execution Protocol  

---

## Phase Status Summary

| Phase | Description | Status | Exit Gate Status |
|---|---|---|---|
| **Phase 1, Step A** | Foundation & Shared Infrastructure | **COMPLETED** | PASSED (Monorepo, CI, Design System, Common Base Classes, Docs) |
| **Phase 1, Step B** | Platform, Identity, RBAC Engine & Administration | **COMPLETED** | PASSED (14/14 Automated Tests: Cross-Tenant 403, RBAC, Module Toggles, Audit, Notifications, Tokens) |
| **Phase 1, Step C** | Academic Core, Faculty Scoping & Admissions Lifecycle | **COMPLETED** | PASSED (9/9 Automated Tests: Rule 8 Faculty Scoping, Atomic Admission Approval, 360° Student Master, D2 Department Types) || **Phase 2, Module 1** | Timetable: Periods, Rooms, Conflict Engine, Publishing & Substitutions | **COMPLETED** | PASSED (10/10 Automated Tests: Conflict Detection Blocks Publish, Teacher/Room/Section Clashes, Substitutions, Scoped Schedules) |
| **Phase 2, Module 2** | Finance: Fees, Invoicing, Partial Payments, Receipts, Webhook Idempotency & Refunds | **COMPLETED** | PASSED (10/10 Automated Tests: Fee Structures, Invoices, Webhook Idempotency & Failure Paths, Refunds, Scoped Access) |
| **Phase 2, Module 3** | Attendance: Daily & Period Sessions, Batch Roll Call, Low Attendance Alerts, Leave Workflows | **COMPLETED** | PASSED (10/10 Automated Tests: Atomic Roll Call, Leave Request to Excused Status, Absence Notifications, Rule 8/9 Scoping) |
| **Phase 2, Module 4** | Examinations: Exam Lifecycle, Grade Scales, Pre-Commit Excel Import Validation, Report Cards | **COMPLETED** | PASSED (10/10 Automated Tests: Grade Resolution, Rule 8 Faculty Scoping, Excel Import Blocks Invalid Data, Automated Ranking, Scoped Access) |
| **Phase 2, Module 5** | Documents: Vault Storage, Verification Workflow, Templates, Bonafide & TC QR Generation | **COMPLETED** | PASSED (10/10 Automated Tests: Storage Key Isolation, MIME Whitelist, Verification State Machine, QR Verification, Scoped Access) |
| **Phase 2, Module 6** | HRMS: Staff Onboarding, D3 Identity Chain, Leaves Workflow, Biometric Roll Call, Workload & Payroll Export | **COMPLETED** | PASSED (10/10 Automated Tests: Identity Chain, Historized Employment, Leave Quotas, Overlap Checks, Workload, Section 14 Payroll) |
| **Phase 2 (Overall)** | Core Academic & Administrative Engine (Modules 1 - 6) | **COMPLETED** | PASSED (60/60 Phase 2 Tests; 83/83 Full Platform Tests Passing) |
| **Phase 3** | AI Yantra (Voice Agent, AI Attendance, AI Tutor) | **QUEUED** | Ready for Phase 3 |
| **Phase 4** | Optional Modules (Events, Transport, Hostel, Library, Sports, Inventory) | **QUEUED** | Pending Phase 3 |

---

## Phase 1, Step A Checklist (Completed)
- [x] **Monorepo Scaffold:** Directory alignment (`backend/`, `web/`, `mobile/`, `packages/`, `docs/`)
- [x] **CI Pipeline:** `.github/workflows/ci.yml` linting, type-checking, and build validation
- [x] **Design System:** Shared responsive primitives in `web/components/ui/` (`frontend/components/ui/`)
- [x] **Base Classes:** `TenantScopedRepository` with mandatory `institution_id` isolation, `AuditDispatcher`, `AppError` and error formatting envelope
- [x] **Documentation Seeding:** `docs/DECISIONS.md` (ADR-001 to ADR-014), `docs/ENTITY_OWNERSHIP.md`, `docs/PERMISSIONS.md`, `docs/PROGRESS.md`
- [x] **Shared Packages:** `@vid/schemas` and `@vid/api-client` initialized

---

## Phase 1, Step B Checklist (Completed)
- [x] **Platform & Tenants:** `institutions`, `subscriptions`, `institution_plans`, `institution_modules` toggle table
- [x] **Auth & Identity:** `users` view, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens` (with token rotation)
- [x] **RBAC Engine:** 3-step decision chain (`tenant_resolver` → `permission_middleware` → `resource_guard`)
- [x] **Permission Seeding:** 77 canonical `<module>.<resource>.<action>` permissions seeded into PostgreSQL
- [x] **Module Guard:** `require_module_enabled(module_key)` blocking disabled modules with 403
- [x] **Shared Services:**
  - `notifications`: User inbox, unread count, read tracking, and multi-channel dispatch
  - `audit`: Immutable event dispatcher and tenant-filtered audit logs inspection
- [x] **Admin Consoles:** Super Admin & Institution Admin module toggle engine
- [x] **Automated Test Suite:** `backend/tests/phase1_step_b.test.ts` passing 14/14 tests

---

## Phase 1, Step C Checklist (Completed)
- [x] **Academic Core (Section 9.5 & Decision D2):**
  - Hierarchy: `academic_years`, `departments` (with `department_type`: `'academic'` | `'administrative'`), `classes`, `sections`, `subjects`, `class_subjects`, and `faculty_assignments` (allocations).
  - API Routes: Full CRUD under `/api/v1/academics/` (`/academic-years`, `/departments`, `/classes`, `/sections`, `/subjects`, `/allocations`, `/hierarchy`).
- [x] **HRMS Foundation (Decision D3):**
  - Tables: `staff` and `designations` created in Phase 1 with `is_teaching_staff` flag.
  - Endpoints: `GET` and `POST` for `/api/v1/hrms/staff` and `/api/v1/hrms/designations`.
- [x] **Faculty Module & Rule 8 Scoped Access:**
  - Identity Chain: `users → staff → faculty` per Decision D3.
  - Canonical Views & Tables: `faculty`, `faculty_subjects`, `faculty_classes`.
  - Scoped Guarding: `GET /api/v1/faculty/sections/:sectionId/students` protected by `resourceGuard({ type: 'faculty' })`.
  - Rule 8 Enforcement: Faculty attempting to access student rosters for unassigned sections are strictly blocked with `403 FORBIDDEN` (`RESOURCE_ACCESS_DENIED`).
- [x] **Admissions Lifecycle & Atomic Approval (Section 8 & Decision D6):**
  - Atomic Transaction: Single SQL transaction (`BEGIN...COMMIT`) executes:
    1. `admissions` approval record created with `admission_fee_status = 'pending'` (D6).
    2. `students` central master row created with generated `admission_number` and `roll_number` (Rule 1).
    3. `parents` row created and linked via `student_parents` (Section 5).
    4. `guardians` row created and linked via `student_guardians`.
    5. `student_academic_history` row recorded.
    6. `applications.stage` updated to `'approved'`.
  - Post-Commit Integrations: Dispatches immutable audit event `admissions.application.approved` and notification to applicant/parent.
- [x] **Student Master 360° Profile (Section 9.4 & Decision D1):**
  - Master profile retrieval (`GET /api/v1/students/:id`) consolidates personal info, guardians, parents, academic history, attendance summary, and finance ledger.
  - Scoped Guards: Student (Rule 10) and Parent (Rule 9) access control enforced server-side.
- [x] **Automated Test Suite:** `backend/tests/phase1_step_c.test.ts` passing 9/9 tests.

---

## Phase 2, Module 1 Checklist: Timetable (Completed)
- [x] **Database Migration (`003_phase2_timetable.sql`):**
  - Confirmed schema & indexes for `rooms`, `periods`, `timetables`, `timetable_entries`, and `substitutions`.
- [x] **Room & Period Configuration (Section 5 & Decision D8):**
  - Rooms CRUD (`name`, `capacity`, `room_type`) owned by timetable module.
  - Periods CRUD (`name`, `start_time`, `end_time`, `is_break`, `sequence_order`) with time check and sequencing.
- [x] **Conflict Detection Engine (Section 9.7 & Section 18):**
  - **Teacher Double-Booking:** Prevents assigning a teacher to multiple sections in the same period and day.
  - **Room Double-Booking:** Prevents assigning a room to multiple classes in the same period and day.
  - **Section Period Double-Booking:** Prevents assigning multiple subjects to a section in the same period and day.
  - **Break Period Overlap:** Prevents scheduling academic subjects during break periods.
  - Candidate conflict check (`POST /api/v1/timetable/check-conflict`) for pre-flight matrix validation.
- [x] **Publishing Engine (Section 9.7 & Section 18 Exit Gate):**
  - Comprehensive conflict audit (`GET /api/v1/timetable/:id/conflicts`).
  - Publishing (`POST /api/v1/timetable/:id/publish`) strictly BLOCKS if any conflict is detected (returns `409 Conflict` with `CONFLICT_DETECTED`).
  - Successful publish sets `is_published = true`, `published_at = now()` and emits `timetable.published` audit event.
- [x] **Substitutions Lifecycle:**
  - Create and approve teacher substitutions (`POST /api/v1/timetable/substitutions`) with reason and audit log.
  - Filter substitutions by date and staff ID (`GET /api/v1/timetable/substitutions`).
- [x] **Scoped Timetable Access:**
  - `GET /api/v1/timetable/my-schedule` / `GET /api/v1/timetable/today`.
  - Student & Parent: Only returns published timetable entries for student's enrolled section, plus substitution alerts.
  - Faculty: Returns only assigned timetable entries and active substitute periods for logged-in teacher.
- [x] **Automated Test Suite:** `backend/tests/phase2_timetable.test.ts` passing 10/10 tests. Total test suite passing: 33/33 tests.

---

## Phase 2, Module 2 Checklist: Finance & Fee Management (Completed)
- [x] **Database Migration (`004_phase2_finance.sql`):**
  - Confirmed schema & performance indexes for `fee_structures`, `fee_categories`, `fee_groups`, `fee_structure_items`, `student_fees`, `invoices`, `invoice_items`, `payments`, `receipts`, `discounts`, `scholarships`, `student_discounts`, `refunds`.
  - Added `payment_webhook_events` with unique constraint `(gateway_name, event_id)` for webhook idempotency.
  - Added `institution_id` on `receipts` and `refunds` for multi-tenant isolation.
  - Added `updated_at` column on `invoices` matching trigger `trg_set_updated_at`.
- [x] **Atomic Transaction Helper:**
  - Extended database configuration with atomic `db.transaction(callback)` executing `BEGIN`, `COMMIT`, `ROLLBACK`, and safe connection release.
- [x] **Fee Structures & Discounts (Section 9.10 & Section 5):**
  - Categories & Groups CRUD (`/api/v1/finance/categories`, `/api/v1/finance/groups`).
  - Fee Structure builder with items and academic year/class mapping (`/api/v1/finance/structures`).
  - Percentage discounts & flat scholarships with student assignment.
- [x] **Invoicing & Ledger Engine:**
  - Fee assignment generating `student_fees` row and initial itemized `invoices` with `invoice_items`.
  - Overpayment prevention: strictly rejects payment attempts exceeding remaining balance due.
  - Partial payments: atomic payment registration, receipt generation (`receipts`), and balance due update.
  - Invoice status progression: `pending` → `partially_paid` → `paid`.
  - Decision D6 Linkage: Transitions `admissions.admission_fee_status = 'paid'` upon student's full fee settlement.
- [x] **Payment Gateway Webhooks (Section 9.10 & Section 18 Exit Gate):**
  - Dedicated idempotent webhook endpoint (`POST /api/v1/finance/webhooks/:gateway` and `/api/v1/finance/webhook`).
  - Duplicate delivery prevention: uses `(gateway_name, event_id)` table constraint and pre-check to return `{ duplicate: true }` without duplicate credit.
  - Explicit failure path handling: captures `payment.failed` events, logs failed payments in `payments` ledger without modifying balance due, and returns status.
- [x] **Refunds Engine:**
  - Refund processing (`POST /api/v1/finance/refunds`) creating immutable refund ledger record, restoring student's balance due, reverting invoice status to `partially_paid`, and logging audit events.
- [x] **Scoped Fee Access (Rules 8, 9, 10):**
  - Student: Retrieves own fee ledger, invoices, payments, and receipts.
  - Parent: Retrieves linked children's fee summaries and outstanding dues.
  - Faculty: Blocked with `403 FORBIDDEN` (`RESOURCE_ACCESS_DENIED`) — faculty never accesses student financial ledgers.
- [x] **Automated Test Suite:** `backend/tests/phase2_finance.test.ts` passing 10/10 tests. Total test suite passing: 43/43 tests.

---

## Phase 2, Module 3 Checklist: Attendance & Leave Management (Completed)
- [x] **Database Migration (`005_phase2_attendance.sql`):**
  - Verified partial unique constraints `uq_daily_attendance_session` and `uq_period_attendance_session` on `attendance_sessions`.
  - Verified `student_leave_requests` table with `chk_student_leave_dates` constraint.
  - Verified indexes for student attendance, staff attendance, session dates, and student leave requests.
- [x] **Daily & Period Attendance Sessions:**
  - Session creation endpoint (`POST /api/v1/attendance/sessions`) enforcing unique sessions per section/date/period.
  - Roster retrieval (`GET /api/v1/attendance/sessions/:id/roster`) integrating student master data with active leave status and prior markings.
- [x] **Batch Roll Call Recording:**
  - Atomic batch upsert (`POST /api/v1/attendance/sessions/:id/records`) supporting statuses (`present`, `absent`, `late`, `excused`) and remarks.
  - Pre-validation checking that all students belong to the targeted section.
  - Real-time parent notification dispatch for students marked `absent` (`attendance_alert`).
- [x] **Student Attendance Metrics & Low Attendance Flagging:**
  - Comprehensive attendance summary endpoint (`GET /api/v1/attendance/students/:studentId/summary`).
  - Accurate attendance percentage calculation: `(present + late) / total * 100`.
  - Automatic low attendance threshold indicator (`isLowAttendance: true` when percentage `< 75%`).
- [x] **Leave Management Workflow:**
  - Student/parent leave request submission (`POST /api/v1/attendance/leaves`).
  - Role-based listing (`GET /api/v1/attendance/leaves`) with institution and student filtering.
  - Leave approval/rejection (`PATCH /api/v1/attendance/leaves/:id/status`).
  - Automatic reconciliation: approving a leave retroactively transitions any existing `absent` records in that date range to `excused`.
- [x] **Staff Attendance:**
  - Dedicated endpoints (`POST /api/v1/attendance/staff` and `GET /api/v1/attendance/staff`) for recording staff daily attendance.
- [x] **Scoped Attendance Access (Rules 8, 9, 10):**
  - Faculty: Restricted to creating sessions and recording roll call only for allocated classes/sections (or assigned class teacher sections).
  - Student: Scoped strictly to viewing own attendance records and summaries.
  - Parent: Scoped strictly to viewing linked children's attendance records.
- [x] **Automated Test Suite:** `backend/tests/phase2_attendance.test.ts` passing 10/10 tests. Total test suite passing: 53/53 tests.

---

## Phase 2, Module 4 Checklist: Examinations & Gradebook (Completed)
- [x] **Database Migration (`006_phase2_examinations.sql`):**
  - Extended `marks` table with `grade_id`, `is_absent`, `remarks`, and `updated_at`.
  - Extended `exams` table with `is_published` and `published_at`.
  - Created `report_cards` table matching Section 5 authoritative entity ownership (`total_marks_obtained`, `total_max_marks`, `percentage`, `gpa`, `grade`, `rank`, `result_status`).
  - Created `invigilators` table with `(exam_room_id, staff_id)` unique constraint.
  - Created performance indexes for exams, exam subjects, schedules, marks, and report cards.
- [x] **Exam Types, Exams & Subjects CRUD:**
  - Endpoints for exam types (`POST/GET /api/v1/examinations/types`) with weightage.
  - Exam definitions (`POST/GET /api/v1/examinations/exams`) with class and academic year mapping.
  - Subject mapping with `max_marks` and `pass_marks` (`POST/GET /api/v1/examinations/exams/:id/subjects`).
- [x] **Exam Schedules, Rooms & Invigilators:**
  - Schedule creation (`POST /api/v1/examinations/schedules`) with time boundary validation (`endTime > startTime`).
  - Exam rooms configuration with room capacity enforcement (`POST /api/v1/examinations/rooms`).
  - Student seating allocations (`POST /api/v1/examinations/rooms/:id/seating`) with capacity overflow checks.
  - Staff invigilator assignments (`POST /api/v1/examinations/rooms/:id/invigilators`).
- [x] **Grade Scales & Tier Resolution:**
  - Grade scale builder with arbitrary tiers (`POST/GET /api/v1/examinations/grade-scales`).
  - Automated tier resolver matching percentage to letter grade and grade points.
- [x] **Marks Entry & Batch Upsert:**
  - Atomic batch marks recording (`POST /api/v1/examinations/marks/batch`) with automatic grade resolution.
  - Marks verification workflow (`POST /api/v1/examinations/marks/verify`) setting `verified_by` and emitting audit events.
- [x] **Excel Import Pipeline (Section 18 Exit Gate):**
  - Dedicated pre-commit validation endpoint (`POST /api/v1/examinations/marks/import-validate` and `/import-excel`).
  - Validates student existence in exam's class roster, bounds checking (`0 <= marks <= max_marks`), absence handling, and duplicate detection.
  - **Strict Exit Gate Protection:** Pre-commit validation blocks any import with errors (`canCommit = false`). Commit attempt is rejected with `CANNOT_COMMIT_INVALID_DATA`. Invalid data is never committed.
  - Atomic commit endpoint (`POST /api/v1/examinations/marks/import-commit`) for approved, valid batches.
- [x] **Automated Report Card Calculation & Class Ranking Engine:**
  - Calculation engine (`POST /api/v1/examinations/exams/:id/calculate-results`):
    - Computes aggregate marks obtained, total max marks, and percentage.
    - Resolves GPA and overall grade from institutional scale.
    - Evaluates pass/fail status against individual subject pass marks.
    - Orders class by percentage descending to compute official class rank (Rank 1, 2, 3...).
    - Saves into `report_cards`.
- [x] **Publishing Engine & Multi-Channel Notifications:**
  - Publishing endpoint (`POST /api/v1/examinations/exams/:id/publish`):
    - Sets `is_published = true`, `published_at = now()`, `status = 'completed'`.
    - Marks all student report cards as published.
    - Emits immutable audit log `examinations.results_published`.
    - Automatically dispatches push notifications to student and linked parent inboxes.
- [x] **Scoped Access Control (Rules 8, 9, 10):**
  - Faculty: Can only enter/view marks for subjects and classes they are assigned to (`verifyFacultySubjectAllocation`). Unallocated access blocked with `403 FORBIDDEN` (`RESOURCE_ACCESS_DENIED`).
  - Parent: Can only view report cards and marks for their linked children (`verifyParentChildLink`).
  - Student: Can only view their own marks and published report cards.
- [x] **Automated Test Suite:** `backend/tests/phase2_examinations.test.ts` passing 10/10 tests. Total test suite passing: 63/63 tests.

---

## Phase 2, Module 5 Checklist: Documents Management (Completed)
- [x] **Database Migration (`007_phase2_documents.sql`):**
  - Extended `documents` with `file_size` and `metadata` JSONB.
  - Extended `document_templates` with `template_body` and `variables` JSONB.
  - Extended `document_requests` with `remarks`, `processed_by`, `processed_at`, and `issued_document_id`.
  - Added performance indexes for owner-scoped lookups, types, verification statuses, requests, and templates.
- [x] **Document Types Catalog (Section 9.11 & Decision D7):**
  - Full catalog listing (`GET /api/v1/documents/types`) including global types (`birth_certificate`, `bonafide`, `id_card`, `transfer_certificate`, `mark_sheet`).
  - Dynamic creation of institution-specific document types (`POST /api/v1/documents/types`).
- [x] **Document Vault & Upload Engine:**
  - Standardized registration (`POST /api/v1/documents`) with structured canonical storage keys: `{institution_id}/documents/{owner_type}/{owner_id}/{timestamp}-{fileName}`.
  - MIME whitelist validation: permits PDF, JPEG, PNG, DOC, DOCX; strictly blocks executable/malicious uploads with `400 INVALID_MIME_TYPE`.
  - Initial pending verification state automatically registered in `document_verifications`.
  - Soft deletion support (`DELETE /api/v1/documents/:id`) setting `deleted_at = now()`, excluding soft-deleted documents from active queries.
- [x] **Verification Workflow & Audit Trail:**
  - Multi-status verification transitions (`POST /api/v1/documents/:id/verify`) for `verified` and `rejected` statuses.
  - Complete verification history inspection (`GET /api/v1/documents/:id/verification-history`).
  - Real-time audit event dispatch (`documents.verified`, `documents.rejected`) and push notifications to student/parent inboxes.
- [x] **Document Templates Engine:**
  - Full CRUD for templates (`POST/GET/PUT/DELETE /api/v1/documents/templates`).
  - Dynamic placeholder substitution support (`variables: ['{{student_name}}', '{{admission_number}}', ...]`).
- [x] **Official Certificate Generation Engine (with QR & Verification URL):**
  - **Bonafide Certificate** (`POST /api/v1/documents/generate/bonafide`):
    - Authoritative ID format: `BONA-{instCode}-{timestamp}-{random}`.
    - Tamper-evident SHA-256 signature in QR payload (`{ certId, studentId, admissionNo, institution, issuedAt, sig }`).
    - Verification URL: `https://verify.vid.edu/cert/{certificateId}`.
    - Automated vault registration with status `verified` and push notification dispatch.
  - **Transfer Certificate (TC)** (`POST /api/v1/documents/generate/transfer-certificate`):
    - Authoritative ID format: `TC-{instCode}-{timestamp}-{random}`.
    - Records student academic conduct, reason for leaving, and class clearance.
    - Automated vault registration with status `verified`.
- [x] **Document Requests Pipeline:**
  - Student / Parent submission (`POST /api/v1/documents/requests`).
  - Admin review and processing (`PATCH /api/v1/documents/requests/:id/status`) linking issued document IDs.
- [x] **Scoped Access Control (Rules 1, 2, 8, 9, 10):**
  - Multi-tenant isolation: Cross-tenant access attempts are completely isolated and blocked with 404.
  - Student (Rule 10): Scoped strictly to own document vault. Blocked from accessing other students' records.
  - Parent (Rule 9): Scoped strictly to linked children. Blocked from unlinked students.
  - Faculty (Rule 8): Scoped to students in assigned sections. Unallocated faculty access blocked with 403.
- [x] **Automated Test Suite:** `backend/tests/phase2_documents.test.ts` passing 10/10 tests. Total test suite passing: 73/73 tests.

---

## Phase 2, Module 6 Checklist: Staff & HRMS Workspace (Completed)
- [x] **Database Schema & Enhancements (`008_phase2_hrms.sql`):**
  - Extended `leave_requests` with `remarks text` and `total_days integer DEFAULT 1`.
  - Extended `staff_attendance` with `remarks text`.
  - Created performance indexes: `idx_staff_inst_status`, `idx_staff_dept`, `idx_staff_desig`, `idx_leave_requests_inst_status`, `idx_leave_requests_staff`, `idx_leave_requests_dates`, `idx_staff_employment_staff`.
  - Seeded standard leave types (Casual Leave 12d, Sick Leave 10d, Earned Leave 15d, Maternity/Paternity 90d, Comp Off 5d, Unpaid Leave).
- [x] **Designations Catalog (`/api/v1/hrms/designations`):**
  - CRUD operations with tenant isolation and audit logging (`hrms.designation_created`).
- [x] **Staff Directory & Onboarding (`/api/v1/hrms/staff`):**
  - Identity Chain enforcement (Decision D3: `users/profiles -> staff -> faculty`).
  - Auto-provisions `faculty` record when `isTeachingStaff = true`.
  - Initial employment record generated in `staff_employment`.
  - Directory filtering by department, designation, status, teaching flag, and search query.
- [x] **Staff Lifecycle & Historized Role Changes (`PATCH /api/v1/hrms/staff/:id`):**
  - Updates department, designation, employment status (`active`, `on_leave`, `suspended`, `resigned`, `terminated`), and payroll reference.
  - Automatically closes previous `staff_employment` record (`effective_to = now()`) and records new effective tenure.
- [x] **Staff Soft Deletion (`DELETE /api/v1/hrms/staff/:id`):**
  - Sets `deleted_at = now()` and status `terminated`.
  - Excludes soft-deleted employees from active directory listings and lookups.
- [x] **Leave Management Engine (`/api/v1/hrms/leaves`):**
  - Custom leave type creation with annual max quota.
  - Leave application with start/end date validation, inclusive day calculation, overlap detection, and quota enforcement.
  - Leave approval/rejection workflow with remarks, audit log (`hrms.leave_approved`/`hrms.leave_rejected`), and notification dispatch.
  - Leave balance calculator (`/api/v1/hrms/leaves/balance/:staffId`) computing annual allowance, taken, and remaining days.
- [x] **Staff Daily Attendance & Biometric Roll Call (`/api/v1/hrms/attendance`):**
  - Batch roll-call marking with status (`present`, `absent`, `late`, `excused`) and remarks.
  - Upsert idempotency on `(staff_id, attendance_date)` constraint.
  - Monthly attendance aggregation with days present/absent/late/excused.
- [x] **Faculty Workload Analysis (`/api/v1/hrms/workload`):**
  - Computes periods per week from timetable allocations and assigned sections count from `faculty_assignments`.
  - Materializes snapshot in `staff_workload` with overload detection (> 28 periods/week).
- [x] **Section 14 Payroll Integration Hook (`/api/v1/hrms/payroll/export`):**
  - Structured data export boundary for external payroll systems: employee code, name, designation, department, working days, present/absent/late days, payable days, and `payroll_reference`.
- [x] **Automated Test Suite:** `backend/tests/phase2_hrms.test.ts` passing 10/10 tests.
- [x] **Full Platform Regression Suite:** **83 / 83 tests passing (100% GREEN exit gate)**.

---

## Next Milestone: Phase 3 (AI Yantra Workspaces) & Operational Consoles
- **Yantra Voice Agent:** Campaign management, student/parent voice dispatches, call analytics.
- **Yantra AI Attendance:** Face embedding registration, frame recognition queue, validation review before final attendance.
- **Yantra AI Tutor:** Context-scoped tutor chat, curriculum-aligned practice generation, learning velocity analytics.



