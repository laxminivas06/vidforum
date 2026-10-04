# VID Platform: Master Build Progress Tracker (v3)

**Document:** `/docs/PROGRESS.md`  
**Execution Standard:** VID Master Build Prompt v3 (Section 6 Build Order & Section 8 Completion Contract)  
**Status:** In Progress (Step R Active)  
**Date:** October 3, 2026  

---

## Master Build Roadmap Summary

| Step | Module / Milestone | Status | Gate Status |
|---|---|---|---|
| **Step R** | **Audit + Security & Cleanup Remediation** | **COMPLETED** | Gate R PASSED (26/26 Tests Green) |
| **Step 1B** | **Staff & HRMS (Finish: Add Teachers & Directory)** | **COMPLETED** | Gate 1B PASSED (10/10 Tests Green) |
| **Step 2** | **Academics & Curriculum (Schedules & Textbooks)** | **COMPLETED** | Gate 2 PASSED (10/10 Tests Green) |
| **Step 3** | **Admissions & Enrollment (Add Students & Pipeline)** | **COMPLETED** | Gate 3 PASSED (10/10 Tests Green) |
| **Step 4** | **Faculty Management (Allocations & Workloads)** | **READY TO START** | Gate 3 Cleared |
| **Step 5** | **Timetable (Constraint Solver & Matrix Editor)** | **QUEUED** | Awaiting Step 4 |
| **Step 6** | **Attendance (Daily Roll Call & Leave Reconciliation)** | **QUEUED** | Awaiting Step 5 |
| **Step 7** | **Finance & Fee (Ledger, POS Collection & Receipts)** | **QUEUED** | Awaiting Step 6 |
| **Step 8** | **Examination (Exams from Estimates, Marks & Report Cards)** | **QUEUED** | Awaiting Step 7 |
| **Step 9** | **Others (Dashboards, Search, Notifications, Audit & Settings)** | **QUEUED** | Awaiting Step 8 |

---

## Detailed Step Checklists

### STEP R: Audit and Remediation
- [x] **R1: Comprehensive Codebase Audit (Docs Only)**
  - [x] Create `docs/CODEBASE_MAP.md` (frameworks, conventions, migrations, test commands, env vars, routes).
  - [x] Create `docs/WORKSPACE_MAP.md` (12 workspaces, exact keys, categories, routes, module mapping).
  - [x] Update `docs/ENTITY_OWNERSHIP.md` with master entity table and foreign key relationships.
  - [x] Create `docs/DEFECTS.md` with line-level forensic citations for Section 4 defects.
  - [x] Structure `docs/PROGRESS.md` to track Master Build Prompt v3.
- [x] **R2: Unified Authentication Rebuild**
  - [x] Implement `findLoginSubject(identifier)` matching email, `login_id`, or `U_id` case-insensitively with typed columns.
  - [x] Enforce password verification strictly against account's bcrypt hash in `auth.users.encrypted_password`.
  - [x] Eliminate universal `admin123` defaults and blank-password acceptance backend and frontend.
  - [x] Implement rate limiting (5 attempts / 15 min per IP and identifier) and account lockout.
  - [x] Implement `must_change_password` first-login screen (min 8 chars, denylist verification).
  - [x] Remove all client-side auth fallbacks, "known accounts", and `localStorage` mock stores.
  - [x] Enforce short access token TTL (15 min) with refresh rotation and revocation on password/role change.
  - [x] Implement forgot-password token flow and admin-initiated credential reset.
  - [x] Log immutable security audit events for all login attempts, failures, lockouts, and resets.
  - [x] Author automated negative and positive test suites on test database.
- [x] **R3: Server-Side Workspace Enforcement**
  - [x] Expose single canonical workspace registry via `GET /api/v1/workspaces`.
  - [x] Implement `requireWorkspace(key)` middleware across all route groups.
  - [x] Verify database-backed workspace grant validation on every request (cached via `perm_version`).
  - [x] Synchronize frontend navigation and page route guards with server-side 403 enforcement.
  - [x] Author cross-tenant and ungranted workspace denial test suites.
- [x] **R4: Account Provisioning Engine**
  - [x] Extend existing Faculty & User Accounts modal with Section 10 Role Templates (`Teacher`, `HR Officer`, `Admission Officer`, etc.).
  - [x] Implement discrete actions: Provision, Edit Access, Reset Credentials, Deactivate/Reactivate, Audit.
  - [x] Implement Bulk Provisioning with atomic per-row error handling and one-time downloadable credentials CSV.
  - [x] Add clipboard credentials card enforcing first-login password change.
  - [x] Author automated tests for single and bulk provisioning failure paths.
- [x] **R5: Typo, Schema & Mock Data Sanitation**
  - [x] Correct all label typos across UI, templates, and validation messages (`Experience`, `Date of Birth`, `University`, `Phone Number`).
  - [x] Standardize schema attributes to snake_case (`experience_years`, `date_of_birth`).
  - [x] Purge remaining `MOCK_*` arrays, dummy seeds, and leftover "Executive Workspace Hub" strings.
- [x] **R6: Test Infrastructure & Verification Tooling**
  - [x] Configure isolated test database environment (`TEST_DATABASE_URL`).
  - [x] Add `scripts/verify_actions`, `scripts/scan_forbidden`, and `scripts/gate_report`.
  - [x] Integrate test commands into unified CI verification pipeline.
- [x] **Gate R: Remediation Exit Criteria**
  - [x] All R2–R4 automated tests passing green on test database (26/26 tests passed).
  - [x] `scan_forbidden` exits 0 (zero unapproved `admin123` literals, zero mock data).
  - [x] `npx tsc --noEmit` exits 0 across backend and frontend.
  - [x] Direct API requests without workspace grants or permissions return strict `403 Forbidden`.
  - [x] Generate and commit `docs/GATE_REPORT_R.md`.

---

### STEP 1B: Staff & HRMS (Finish: Add Teachers)
- [x] Database migration: `staff` extended fields (`experience_years`, `date_of_birth`, `staff_type`, `designation_id`, `department_id`, `joining_date`, `status`). (Migration 012 applied)
- [x] **Staff Directory:** Standard list anatomy, filters by type, designation, department, experience, account status.
- [x] **Add/Edit Staff:** All note fields, duplicate warnings on email and name+DOB, server-side duplicate check.
- [x] **Bulk Import (xlsx/csv):** Template download, client preview, **mandatory server-side validation**, row-by-row error report.
- [x] **Staff Profile:** Tabs for Overview, Documents, Leave, Attendance, History/Audit, Account.
- [x] **Designations & Departments:** CRUD with foreign key usage blocking.
- [x] **Leave Management:** Leave types, quotas, balance adjustments, application workflow, calendar.
- [x] **Staff Attendance:** Daily roll call, mark-all-present, monthly register, working-day validation.
- [x] **HR Reports:** Headcount by type/department, experience distribution, leave summary.
- [x] **Gate 1B:** Add teacher -> provision account -> forced password change -> leave approval reduces balance -> delete designation in use blocked -> deactivate blocks login. Generated `docs/GATE_REPORT_1B.md`.

---

### STEP 2: Academics & Curriculum
- [x] Database migration: `grades`, `sections`, `classes`, `subjects`, `grade_subjects`, `exam_estimates`, `calendar_days`, `preferred_textbooks`. (Migration 013 applied)
- [x] **Academic Years:** Create, edit, Set as current (exactly one), Close year, Clone from previous year.
- [x] **Grades & Sections:** CRUD, reordering, generate classes (Grade x Section matrix with capacity).
- [x] **Subjects Master:** Name, unique code, core/elective type, active flag.
- [x] **Grade -> Subject Mapping:** Periods per week, max marks, pass marks, copy matrix.
- [x] **Exam Estimated Schedule (A2):** Term windows per grade, date validation, calendar overlay.
- [x] **Year Schedule:** Working week configuration, holiday/vacation calendar, live working day count, `isWorkingDay(date)` service.
- [x] **Preferred Textbooks (A1):** Title, author, publisher, edition, ISBN, printable booklist.
- [x] **Gate 2:** Year created -> classes generated -> subjects mapped -> holidays added -> working day counts exact -> clone verified. Generated `docs/GATE_REPORT_2.md`.

---

### STEP 3: Admissions & Enrollment (Add Students)
- [x] Database migration: `students`, `student_academic_history`, `admission_documents`, `class_enrollment_counts`, `promote_student`. (Migration 014 applied)
- [x] **Students Directory:** Standard list anatomy, filters by class, status, age computation, capacity usage badge, 360° profile navigation.
- [x] **Add/Edit Student:** All note fields, age computed from DOB, class capacity hard check (exceeded capacity blocked), parents/guardians contact check.
- [x] **Enquiry -> Application -> Enroll Pipeline:** Stage progression (`applied` -> `document_verification` -> `review` -> `approved`), 1-Click atomic approval transaction.
- [x] **Student Profile:** Overview, Demographics, Parents & Guardians, Academic History, Attendance, Fees, Audit tabs.
- [x] **Class Lists & Promotion Wizard:** Stored procedure atomic promotion with full history (`effective_to` / `effective_from`).
- [x] **Gate 3:** Enroll student -> capacity updates -> bulk import with reporting -> age correct across birthday. Generated `docs/GATE_REPORT_3.md`.

---

### STEP 4: Faculty Management
- [ ] Database migration: `class_teachers`, `teacher_subject_allocations`, `teacher_load_settings`.
- [ ] **Allocation Matrix:** Interactive class x subject grid, teacher load indicators, auto-suggest by specialization.
- [ ] **Class Teachers:** Assign/replace with history.
- [ ] **Teacher Workload:** Load percentage vs max periods per week (default 30).
- [ ] **Coverage Check:** Real-time gap detector for unallocated subjects.
- [ ] **My Classes:** Scoped teacher view (Rule 8 enforcement).
- [ ] **Gate 4:** Reassignment updates loads -> exceeding max load blocked -> coverage shows gaps then zero -> teacher sees only own data. Generate `docs/GATE_REPORT_4.md`.

---

### STEP 5: Timetable
- [ ] Database migration: `timetable_settings`, `periods`, `teacher_unavailability`, `timetable_versions`, `timetable_entries`, `substitutions`.
- [ ] **Settings & Unavailability:** Period durations, break blocks, teacher unavailability matrix.
- [ ] **Solver Engine:** TypeScript background job constraint propagation solver + independent validator.
- [ ] **Timetable Editor:** Drag-and-drop grid with live collision detection and lockable cells.
- [ ] **Publishing & Rollback:** Publishing strictly blocked if any clash exists.
- [ ] **Teacher Substitutions:** Daily substitute assigner with free teacher suggestions.
- [ ] **Gate 5:** 10 grades x 2 sections x 8 subjects solver yields zero hard violations -> clashing swap rejected -> effective timetable published. Generate `docs/GATE_REPORT_5.md`.

---

### STEP 6: Attendance
- [ ] Database migration: `attendance_sessions`, `attendance_records`, `attendance_corrections`, `attendance_settings`.
- [ ] **Daily Roll Call:** Class roll call, mark-all-present, working-day validation, teacher locking.
- [ ] **Attendance Corrections:** Audited correction log with approval policy.
- [ ] **Monthly Register & Analytics:** Class grid export, student percentage, low-attendance alert list (<75%).
- [ ] **Absentee Follow-up:** Outbox message dispatch to parent phones.
- [ ] **Gate 6:** Teacher marks only own class -> non-working day blocks marking -> correction trail audited -> low attendance list verified. Generate `docs/GATE_REPORT_6.md`.

---

### STEP 7: Finance & Fee
- [ ] Database migration: `fee_accounts`, `fee_plan_templates`, `fee_installments`, `fee_ledger_entries`, `payments`, `receipts`, `refunds`.
- [ ] **Fee Settings & Plan Templates:** Late-fine rules, installment templates (Annual/Quarterly/Monthly).
- [ ] **Fee Accounts:** Backfill existing students, assign plans, append-only ledger tracking.
- [ ] **Collect Fee (POS):** Multi-mode payment registration, sequential immutable receipts, partial payment allocation.
- [ ] **Concessions & Refunds:** Segregation of duties approval workflow.
- [ ] **Dues & Defaulters:** Aging buckets and reminder dispatch.
- [ ] **Gate 7:** Student enrolled -> fee account auto-created -> partial payment updates ledger and receipt -> cancel receipt restores balance. Generate `docs/GATE_REPORT_7.md`.

---

### STEP 8: Examination
- [ ] Database migration: `exams`, `exam_papers`, `exam_invigilators`, `grade_scales`, `marks`, `exam_results`, `report_cards`.
- [ ] **Exam Management:** Create exam from Step 2 estimate, exam timetable, hall ticket generation.
- [ ] **Marks Entry & Pre-Commit Validation:** Teacher marks grid, Excel upload with pre-commit validation.
- [ ] **Verification & Ranking Engine:** Subject approval, aggregate percentage, GPA, tie-aware class rank.
- [ ] **Publishing & Report Cards:** Publish results, emit notifications, generate PDF report cards.
- [ ] **Gate 8:** Estimate to exam -> clash blocked -> teacher enters own subject -> invalid Excel blocked -> ranks calculated exact. Generate `docs/GATE_REPORT_8.md`.

---

### STEP 9: Others & Full Integration
- [ ] **Role-Specific Dashboards:** Admin, Teacher, Finance, HR dashboards with real metrics.
- [ ] **Global Search:** Multi-entity keyboard shortcut search.
- [ ] **Notifications & Outbox:** In-app notification center + message queue outbox viewer.
- [ ] **Users & Roles:** Unified user management with role template assignment.
- [ ] **Audit Log Viewer:** Filterable system event log.
- [ ] **Settings Hub:** Institution profile, formatters, thresholds.
- [ ] **Document Templates:** Merge field engine for dynamic PDF generation.
- [ ] **Full Journey E2E:** Super admin to report card generation verified on isolated test database.
- [ ] **Gate 9:** All 12 workspaces active, zero forbidden tokens, complete journey passes green. Generate `docs/GATE_REPORT_FINAL.md`.
