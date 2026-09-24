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

---
*End of DECISIONS.md*
