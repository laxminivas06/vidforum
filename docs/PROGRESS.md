# VID Platform: Build Progress Tracker

**Document:** `/docs/PROGRESS.md`  
**Execution Standard:** Section 18 Phased Execution Protocol  

---

## Phase Status Summary

| Phase | Description | Status | Exit Gate Status |
|---|---|---|---|
| **Phase 1, Step A** | Foundation & Shared Infrastructure | **COMPLETED** | PASSED (Monorepo, CI, Design System, Common Base Classes, Docs) |
| **Phase 1, Step B** | Platform, Identity, RBAC Engine & Administration | **COMPLETED** | PASSED (14/14 Automated Tests: Cross-Tenant 403, RBAC, Module Toggles, Audit, Notifications, Tokens) |
| **Phase 1, Step C** | Academic Core, Faculty Scoping & Admissions Lifecycle | **COMPLETED** | PASSED (9/9 Automated Tests: Rule 8 Faculty Scoping, Atomic Admission Approval, 360° Student Master, D2 Department Types) |
| **Phase 2, Module 1** | Timetable: Periods, Rooms, Conflict Engine, Publishing & Substitutions | **COMPLETED** | PASSED (10/10 Automated Tests: Conflict Detection Blocks Publish, Teacher/Room/Section Clashes, Substitutions, Scoped Schedules) |
| **Phase 2, Remaining** | Finance, Attendance, Examinations, Documents, HRMS UI, Mobile Shell | **IN PROGRESS** | Next: Module 2 (Finance & Invoicing Engine) |
| **Phase 3** | AI Yantra (Voice Agent, AI Attendance, AI Tutor) | **QUEUED** | Pending Phase 2 |
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

## Next Milestone: Phase 2, Module 2 (Finance & Fees)
- Scope per Section 9.8 & Decisions D6, D10:
  - Fee structures, fee components, discounts/concessions.
  - Student fee ledger (`finance_transactions`, `invoices`, `payments`).
  - Invoicing engine with partial payment tracking, receipts, and offline reconciliation.

