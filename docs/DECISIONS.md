# Architectural & Technical Decisions Log: VID Platform

**Document:** `/docs/DECISIONS.md`  
**Purpose:** Running audit trail of non-trivial architectural, library, and implementation choices made throughout the VID Platform lifecycle.

---

## Decision Records

### [ADR-001] Strict Separation of Phase Deliverables
- **Date & Timestamp:** 2026-09-24T12:20:00+05:30
- **Context:** The Master Prompt strictly mandates generating `/docs/PRD.md`, `/docs/TECH_SPEC.md`, `/docs/TASKS.md`, and `/docs/DECISIONS.md` and pausing for user review prior to implementing application code.
- **Decision:** Produce all four architecture specification documents in full fidelity based on the 48-page `VID Platform.pdf` specification and pause at Checkpoint 1.
- **Rationale:** Prevents scope misalignment, ensures architectural compliance with the 30 non-negotiable rules, and establishes clear verification contracts.

### [ADR-002] Multi-Tenancy via Shared Database with Institution-ID & RLS
- **Date & Timestamp:** 2026-09-24T12:21:00+05:30
- **Context:** Deciding between database-per-tenant, schema-per-tenant, or shared-database-with-tenant-id for multi-institution support.
- **Decision:** Shared PostgreSQL database with mandatory indexed `institution_id` on all tenant entities, reinforced by backend middleware and PostgreSQL Row Level Security (RLS).
- **Rationale:** Scales cleanly to hundreds of institutions without migration connection pool exhaustion, while guaranteeing absolute query isolation via automated middleware filters.

### [ADR-003] Central Student Master Record vs Workspace
- **Date & Timestamp:** 2026-09-24T12:22:00+05:30
- **Context:** Rule 1 specifies that there must be no "Student Workspace"; student is a central master entity.
- **Decision:** Model `students` as the singular operational anchor across admissions, academics, attendance, examinations, finance, documents, and AI Yantra.
- **Rationale:** Completely eliminates fractured student duplicates across departments and ensures unified 360° student history.

### [ADR-004] Two-Tier RBAC with Resource-Level Context Verification
- **Date & Timestamp:** 2026-09-24T12:23:00+05:30
- **Context:** Rule 7 and Rule 8 state that role permissions must be constrained to assigned classes, sections, and subjects (e.g. Faculty can only grade their own students).
- **Decision:** Implement a two-tier authorization check: (1) Role has capability (e.g., `marks.entry`), and (2) Resource context check matches tenancy and assignment table (e.g. `faculty_classes.contains(section_id, subject_id)`).
- **Rationale:** Prevents unauthorized lateral access between departments or classrooms even among users with identical roles.

### [ADR-005] Full-Stack Monorepo Structure (`backend/` + `frontend/`)
- **Date & Timestamp:** 2026-09-24T12:24:00+05:30
- **Context:** Monorepo vs multi-repo for VID web admin, parent/student mobile views, and FastAPI backend.
- **Decision:** Adopt a root monorepo containing `backend/` (FastAPI), `frontend/` (React + TypeScript + Tailwind), and `docs/`.
- **Rationale:** Keeps all contracts, TypeScript interfaces, and integration testing co-located and synchronized across the development lifecycle.

### [ADR-006] Pre-Commit Validation Pipeline for Excel Exam Imports
- **Date & Timestamp:** 2026-09-24T12:24:30+05:30
- **Context:** Page 16–17 of the VID specification requires an Excel import flow with validation before database commits.
- **Decision:** Uploaded Excel files pass through: File Validation $\to$ Column Mapping $\to$ Student ID Matching $\to$ Marks Bounds Checking $\to$ Interactive Preview UI with highlighted errors/warnings $\to$ Explicit Admin Confirmation before committing to the database.
- **Rationale:** Guarantees zero silent failures or corrupt grade data in permanent academic records.

### [ADR-007] Strict 3-Workspace Boundary for AI Yantra
- **Date & Timestamp:** 2026-09-24T12:25:00+05:30
- **Context:** Rule 3 strictly limits AI Yantra to exactly three workspaces: Voice Agent, AI Attendance, and AI Tutor.
- **Decision:** All AI capabilities are routed through these three specific workspaces, isolating their execution environments from direct unrestricted database queries.
- **Rationale:** Preserves strict product boundaries and guarantees that AI operations remain context-bounded and safe.

### [ADR-008] Node.js 22 + TypeScript + Express Layered MVC Architecture
- **Date & Timestamp:** 2026-09-25T17:15:00+05:30
- **Context:** Ensuring backend architecture scales predictably, maintains strict separation of concerns, and matches the specifications in `/docs/TECH_SPEC.md`.
- **Decision:** Adopt a Layered MVC pattern where requests flow strictly through:
  `Routes (Endpoint & Middleware)` $\to$ `Controllers (HTTP parsing & Responses)` $\to$ `Services (Domain logic & Transactions)` $\to$ `Repositories (Raw SQL / pg Pool)` $\to$ `PostgreSQL`.
- **Rationale:** Prevents HTTP concerns from leaking into database queries, simplifies unit testing of business logic, and guarantees uniform error envelopes across all modules.

### [ADR-009] Supabase Cloud PostgreSQL with Public Schema Helper Functions for RLS
- **Date & Timestamp:** 2026-09-25T17:45:00+05:30
- **Context:** Supabase restricts custom function creation in the `auth` schema (`permission denied for schema auth`), but Row-Level Security (RLS) policies require helper functions like `my_institution_ids()` and `has_permission()` that inspect `auth.uid()`.
- **Decision:** Define RLS helper functions in the `public` schema (`public.my_institution_ids()`, `public.has_permission()`, `public.is_assigned_faculty()`, `public.is_guardian_of()`) with `SECURITY DEFINER` and have them query `auth.uid()` from the execution context.
- **Rationale:** Satisfies Supabase permission constraints without sacrificing security or tenant isolation.

### [ADR-010] Zero-Downtime TanStack Query Hooks with Resilient Mock Fallback
- **Date & Timestamp:** 2026-09-25T18:10:00+05:30
- **Context:** The frontend needs live connectivity to `http://localhost:5000/api/v1/` while remaining fully usable and interactive even during server restarts, initial offline development, or build pipelines.
- **Decision:** Wrap backend API calls inside custom TanStack Query hooks (`useInstitutions`, `useAdmissions`, `useAcademics`, `useFaculty`, `useFinance`) with a seamless try/catch fallback to the offline mock dataset.
- **Rationale:** Ensures zero UI breakage or blank screens during backend deployments, cold starts, or transient network failures.

### [ADR-011] Permanent Activation of Ponytail Ultra Mode
- **Date & Timestamp:** 2026-09-29T19:48:00+05:30
- **Context:** User explicitly requested enabling the Ponytail plugin with intensity level **Ultra** across the codebase, saving it to orchestration guidelines (`AGENTS.md`) and persistent memory (`docs/MEMORY.md`).
- **Decision:** Activate Ponytail Ultra permanently. Enforce YAGNI minimalism, reuse existing `@/components/ui/` primitives, prioritize native platform features, write the shortest working diffs, and eliminate all speculative abstractions or boilerplate.
- **Boundaries:** Ponytail Ultra is strictly forbidden from compromising multi-tenant `institution_id` isolation, role/permission security checks, student master single-entity constraints, or pre-commit data validation queues.
- **Rationale:** Keeps token consumption minimal, diffs reviewable, and prevents architectural bloat across both frontend and backend.

### [ADR-012] Adoption of Master Build Prompt Fixed Decisions (D1–D11)
- **Date & Timestamp:** 2026-10-02T10:56:00+05:30
- **Context:** Enforcing single-source-of-truth governance across all platform modules and eliminating domain collisions.
- **Decision:** Formally bind all 11 Master Prompt fixed decisions:
  - **D1 (Student Master):** `students` table is owned by module `students` with zero module-specific duplicate student tables. No student workspace.
  - **D2 (Departments):** Single `departments` table in `academics` with `department_type` enum (`academic`, `administrative`), referenced by HRMS.
  - **D3 (Identity Chain):** `users → staff → faculty`. `staff` and `designations` created in Phase 1; HRMS workspace UI ships in Phase 2.
  - **D4 (Attendance Triad):** `attendance*` = student attendance; `staff_attendance` = HRMS; `ai_attendance_events` = raw AI output requiring validation before becoming final.
  - **D5 (Attendance Staging):** Source-agnostic attendance ingestion pipeline in Phase 2; AI Face/CCTV attached in Phase 3.
  - **D6 (Admission Fee Hand-off):** Admissions approval emits `admission.approved` event and marks `admission_fee_status = pending`; Finance module consumes in Phase 2.
  - **D7 (Shared Platform Services):** Notifications and Audit logging are implemented as shared foundational services in Phase 1, never UI workspaces.
  - **D8 (Room Ownership):** `rooms` table is owned by `timetable`; `examinations` references it via `exam_room_allocations`.
  - **D9 & D10 (Unified Mobile Client):** Single role-based React Native (Expo) + TypeScript app for Students and Parents, consuming the same OpenAPI-generated client and schemas.
  - **D11 (Phase 4 Modular Isolation):** Capability-minimal design with strict module-prefixed tables (`hostel_*`, `library_*`, `transport_*`, etc.).
- **Rationale:** Establishes immutable boundaries across entities and guarantees seamless cross-phase integration.

### [ADR-013] Strict Anti-Collision & Dependency Hierarchy Protocol
- **Date & Timestamp:** 2026-10-02T10:57:00+05:30
- **Context:** Preventing circular dependencies, cross-module mutations, and architectural drift.
- **Decision:** Enforce strict single ownership where only the owning module writes to its tables. Enforce strict dependency hierarchy: `common` ← `auth/tenants` ← `students/academics/hrms` ← downstream/optional modules. Core modules are strictly prohibited from importing optional or AI modules.
- **Rationale:** Guarantees that optional or AI modules can be toggled or detached without destabilizing the core educational engine.

### [ADR-014] Five-Point Multi-Tenancy Enforcement Protocol
- **Date & Timestamp:** 2026-10-02T10:58:00+05:30
- **Context:** Section 6 and Rule 6 mandate tenant isolation across five distinct architectural layers.
- **Decision:** Enforce `institution_id` validation at: (1) Verified JWT claims (never user input), (2) RBAC permission checks, (3) Repository base queries with mandatory tenant filter / PostgreSQL RLS, (4) Object storage file keys (`{institution_id}/...`), and (5) AI prompt context bounding. Cross-tenant access strictly emits a 403 status code and an immutable security audit event.
- **Rationale:** Guarantees ironclad tenant isolation across all services, API endpoints, storage buckets, and AI models.

---
*End of DECISIONS.md*
