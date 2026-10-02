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
| **Phase 2** | Timetable, Finance, Attendance, Examinations, Documents, HRMS UI, Mobile Shell | **READY** | Queued for Kickoff per Section 18 |
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

## Next Milestone: Phase 2 Kickoff
- Order of execution per Section 18:
  1. `timetable`
  2. `finance`
  3. `attendance`
  4. `examinations`
  5. `documents`
  6. `hrms` (UI)
  7. Mobile shell (Student / Parent)
