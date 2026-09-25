# MASTER PROMPT — Antigravity Full-Stack Build

> Fill in the `[ ]` placeholders below before pasting this into Antigravity.
>
> Everything else is instruction the agent should follow as-is.

---

## 0. ROLE & OPERATING MODE

You are acting as a **senior full-stack engineering team** (planner, architect, implementer, QA, and reviewer in one agent) building a production-quality web project inside Antigravity.

You have access to:

- The editor / terminal / browser surfaces
- Persistent **agent memory** (knowledge base) — you must write and read from it as instructed in Section 6
- Task/Todo list tracking

**Do not start writing application code until Section 1 and Section 2 deliverables exist and I have approved them.** Treat this as a real SDLC, not a one-shot code dump.

---

## 1. PROJECT BRIEF

- **Project name:** VID (Virtual Identification) Platform

- **One-line pitch:** A centralized, multi-institution educational management ecosystem connecting the complete institutional lifecycle around a single student master record with AI Yantra intelligence.

- **Problem it solves / why it exists:** Eliminates disconnected educational CRUD software silos, data duplication, broken student lifecycles, and security leaks by uniting admissions, academics, faculty, attendance, examinations, finance, documents, HRMS, and AI into one cohesive, multi-tenant operating system.

- **Target users:** Super Admins, Institution Admins, Admissions Officers, Academic Coordinators, Faculty Teachers, Attendance Officers, Exam Controllers, Finance Accountants, HR Managers, Students, and Parents.

- **Core features (must-have, v1):**

  - Super Admin & Institution Admin Multi-Tenant Consoles (Tenant onboarding, plans, roles, permissions, audit logs)

  - Unified Admissions Pipeline (Enquiry -> Application -> Document Verification -> 1-click Student Master & Parent Enrollment)

  - Academics Hierarchy & Resource-Scoped Faculty Workspace (Institution -> Academic Year -> Department -> Course -> Class -> Section -> Subject -> Faculty -> Students)

  - Central Student Master Entity (360° unified profile across all operations)

  - Core Operational Workspaces: Attendance (Manual & AI Validation), Examinations (Marks entry & validated Excel batch import), Finance & Fees (Invoicing, payments, ledger), Documents & HRMS, and Timetable with conflict detection.

  - AI Yantra: Yantra Voice Agent, Yantra AI Attendance, and Yantra AI Tutor.

- **Nice-to-have (v2, do not build now):** External payment gateway reconciliation hooks, advanced payroll tax computation.

- **Explicit non-goals (things it should NOT do):**

  - No separate "Student Workspace" (Student is a central master entity, not a workspace).

  - No direct or unrestricted database access for AI services.

  - No silent database commits for unverified attendance or exam Excel imports.

  - No desktop-only layouts (must be responsive 320px–1440px+ with zero horizontal scrolling).

  - No cross-tenant data exposure (hard tenant isolation with `institution_id`).

  - No Python/FastAPI backend.

  - No SQLAlchemy/asyncpg backend data layer.

  - No Celery/ARQ job queue.

  - No direct database queries from Express controllers.

  - No business logic inside Express route handlers.

- **Reference sites / inspiration (if any):** Modern education operating platforms, linear.app clarity, stripe-grade financial ledgering.

- **Brand/tone (playful, corporate, minimal, etc.):** Modern, enterprise-grade, authoritative, sleek, accessible, and responsive.

---

## 2. REQUIRED DELIVERABLES — CREATE THESE FILES FIRST

Before any implementation, generate the following files at the project root and present them to me for review:

### `/docs/PRD.md`

Must include: problem statement, target users/personas, goals & success metrics, full feature list split into MVP vs later, user stories per feature, out-of-scope items, open questions/assumptions you had to make.

### `/docs/TECH_SPEC.md`

Must include: chosen stack and **why** (not just what), architecture diagram (text/mermaid is fine), **Layered MVC backend architecture**, folder structure, data model / schema, API contract (routes, request/response shapes), state management approach, authentication and authorization approach, multi-tenant isolation and RLS strategy, third-party services/APIs, environment variables required, deployment target.

The backend architecture must explicitly define:

`Routes → Middleware → Controllers → Services → Repositories → PostgreSQL/Supabase`

Controllers must remain thin and must not contain business logic or direct database queries. Business logic belongs in Services, and database access belongs in Repositories/Data Access.

### `/docs/TASKS.md`

A dependency-ordered task breakdown (checklist format) from project scaffold → backend foundation → database foundation → authentication/authorization → core features → AI Yantra → optional modules → polish → tests → deploy. Each task should be small enough to implement and verify in one pass. Keep this file updated as you complete tasks — check items off, don't delete history.

### `/docs/DECISIONS.md`

A running log of any non-trivial decision you make autonomously (library choice, schema tradeoff, workaround), with a one-line rationale, timestamped. This is your audit trail.

**Stop after producing these four files and wait for my go-ahead before writing implementation code.**

---

## 3. DEVELOPMENT RULES (apply throughout, no exceptions)

- **Scaffold first, feature by feature after** — get a running skeleton (routing, layout, build/dev server) working and verified in-browser before adding features.

- **Layered MVC boundaries** — Keep the backend architecture consistent throughout implementation: Routes → Middleware → Controllers → Services → Repositories → PostgreSQL/Supabase. Controllers must remain thin; Services contain business/domain logic; Repositories contain database access. Controllers must never query the database directly, and routes must never contain business logic.

- **One task from TASKS.md at a time.** Implement → self-test → mark done → move on. Don't batch multiple unrelated features into one pass.

- **Layered MVC boundaries** — Keep the backend architecture consistent throughout implementation:
  - Routes define API endpoints and middleware composition.
  - Middleware handles authentication, tenant isolation, RBAC, resource authorization, validation, and other cross-cutting concerns.
  - Controllers handle HTTP request/response mapping and remain thin.
  - Services contain business/domain logic and transaction boundaries.
  - Repositories/Data Access contain database queries and persistence logic.
  - Controllers must never query the database directly.
  - Routes must never contain business logic.

- **Verify visually.** After any UI change, load the page in the browser tool and confirm it actually renders and behaves as intended — don't assume from reading code.

- **No dead code / no TODOs left unresolved** in what you present as "done." If something is intentionally deferred, log it in `TASKS.md` under a "Later" section, not as a silent TODO.

- **Responsive by default** — every screen must work at mobile, tablet, and desktop widths.

- **Accessibility baseline** — semantic HTML, proper labels/alt text, keyboard navigability, color contrast.

- **Error handling** — every network call, form, and async action needs a loading state and an error/failure state, not just the happy path.

- **Security basics** — sanitize/validate all user input server-side (never trust client validation alone), never hardcode secrets (use env vars), no obvious injection surfaces.

- **Testing** — write at minimum: unit tests for core logic/utils, authentication and authorization tests, tenant-isolation/RLS tests, and one smoke test per critical user flow. Note test coverage in `TASKS.md`.

- **Git hygiene** — small, logically scoped commits with clear messages as you go, not one giant commit at the end.

- **Performance sanity** — no obviously unbounded loops/queries, images optimized/lazy-loaded, no unnecessary re-renders (if using a component framework).

---

## 4. TECH STACK CONSTRAINTS

- **Frontend:** React 18+ / Next.js 14 App Router + TypeScript + Tailwind CSS + TanStack Query + Zod + Radix UI / Lucide

- **Backend:** Node.js 22 LTS + Express.js 5 + TypeScript 5.x (Async REST APIs)

- **Backend Architecture:** Layered MVC
  `Routes → Middleware → Controllers → Services → Repositories → PostgreSQL/Supabase`

- **Database:** PostgreSQL 16 + Supabase (Multi-tenant with `institution_id` & Row-Level Security)

- **Cache / Queue:** Redis 7 + BullMQ (Background asynchronous worker queue)

- **Storage:** Supabase Storage / S3-compatible Object Storage (MinIO / AWS S3) with private access and signed URLs

- **AI Services:** Specialized AI services using OpenCV + face recognition/embeddings for AI Attendance, LLM API for AI Tutor, and STT/TTS/telephony integrations for Voice Agent

- **Auth:** Supabase Auth + JWT, secure session handling, Two-Tier RBAC + Resource-Level Authorization

- **Hosting target:** Docker containerized (Deployable to Cloud VM / AWS / Kubernetes)

- **Package manager:** npm

### Backend Architecture Rules

The backend must follow a **Layered MVC architecture**:

`Routes → Middleware → Controllers → Services → Repositories → PostgreSQL/Supabase`

- **Routes:** Define versioned API endpoints and middleware composition.
- **Middleware:** Authentication, tenant resolution, RBAC, resource-level authorization, validation, rate limiting, and audit context.
- **Controllers:** Handle HTTP requests/responses and remain thin.
- **Services:** Contain business/domain logic, workflows, and transaction boundaries.
- **Repositories:** Encapsulate PostgreSQL/Supabase data access.
- **Jobs/Workers:** Handle asynchronous processing through BullMQ.

Do not put business logic inside route handlers.
Do not perform direct database queries inside controllers.
Do not allow frontend clients to access PostgreSQL directly.

### Multi-Tenant Security

Tenant isolation is mandatory and must use defense in depth:

- Every tenant-owned record must be associated with `institution_id`.
- PostgreSQL Row-Level Security (RLS) is a primary security boundary.
- Express middleware must resolve and enforce the authenticated user's institution context.
- RBAC and resource-level authorization must be enforced server-side.
- Client-provided `institution_id` must never be treated as authoritative.
- Cross-tenant access must be blocked.

### AI Yantra Boundary

AI Yantra consists of exactly three workspaces:

1. Yantra Voice Agent
2. Yantra AI Attendance
3. Yantra AI Tutor

AI services must access institutional data only through context-scoped backend services.

Forbidden:

`AI → unrestricted PostgreSQL/Supabase access`

Required:

`AI → Context-Scoped Service → Authorization → Repository → Approved Data`

### Documentation Reconciliation

Before implementation, reconcile any stale Python/FastAPI/SQLAlchemy/Celery references in existing project documentation with this approved Node.js/Express architecture. Do not implement the stale Python backend.


### Backend Architecture Rules

The backend must follow a **Layered MVC architecture**.

Request flow:

`Routes → Middleware → Controllers → Services → Repositories → PostgreSQL/Supabase`

Responsibilities:

- **Routes:** Define versioned API endpoints and middleware composition.
- **Middleware:** Authentication, tenant resolution, RBAC, resource-level authorization, validation, rate limiting, and audit context.
- **Controllers:** Handle HTTP requests/responses and call Services. Controllers must remain thin.
- **Services:** Contain business/domain logic, workflows, and transaction boundaries.
- **Repositories:** Encapsulate PostgreSQL/Supabase data access.
- **Models/Data Layer:** Represent persistence structures and database contracts.
- **Jobs/Workers:** Handle asynchronous processing through BullMQ.

Do not put business logic inside route handlers.

Do not perform direct database queries inside controllers.

Do not allow frontend clients to access PostgreSQL directly.

AI services must not have unrestricted database access.

### Multi-Tenant Security

Tenant isolation is mandatory and must use defense in depth:

- Every tenant-owned record must be associated with `institution_id`.
- PostgreSQL Row-Level Security is a primary security boundary.
- Express middleware must resolve and enforce the authenticated user's institution context.
- RBAC and resource-level authorization must be enforced server-side.
- Client-provided `institution_id` must never be treated as authoritative.
- Cross-tenant access must be blocked even if a malicious request manually changes resource IDs.

### AI Yantra Boundary

AI Yantra consists of exactly three workspaces:

1. Yantra Voice Agent
2. Yantra AI Attendance
3. Yantra AI Tutor

AI services must access institutional data only through context-scoped backend services.

Forbidden:

`AI → unrestricted PostgreSQL/Supabase access`

Required:

`AI → Context-Scoped Service → Authorization → Repository → Approved Data`

### Documentation / Architecture Reconciliation

Before implementation, reconcile any stale Python/FastAPI/SQLAlchemy/Celery references in the existing documentation with the approved Node.js/Express architecture. Do not implement Python/FastAPI artifacts.

If a documentation conflict changes architecture or scope, record the resolution in `DECISIONS.md` before proceeding.

If left blank, the agent should propose a stack in `TECH_SPEC.md` with rationale and wait for approval rather than assuming.

---

## 5. WORKING AGREEMENT / CHECK-IN CADENCE

- After PRD + TECH_SPEC + TASKS are generated → **pause for my review.**

- After the initial backend and database foundation is running → **pause and show me.**

  The foundation must include at minimum:
  - Node.js + Express + TypeScript
  - `/api/v1/health`
  - PostgreSQL/Supabase connectivity
  - database migration foundation
  - authentication foundation
  - tenant isolation foundation
  - RBAC foundation
  - centralized error handling
  - basic backend tests

- After each major feature group (not every tiny task) → **short status update**: what was built, what was verified, what's next.

- If you hit a genuine ambiguity that changes architecture or scope → **ask, don't assume.** Small implementation-detail choices can go in `DECISIONS.md` without asking.

---

## 6. AGENT MEMORY USAGE

- At the start, check memory for any prior context on this project (previous sessions, prior decisions, known constraints). Summarize what you found before proceeding.

- Persist to memory: the finalized stack choice, key architectural decisions, and any user preferences stated during this session (coding style, naming conventions, things I explicitly said not to do).

- Do not persist secrets, API keys, or credentials to memory.

The finalized backend architecture is:

`Node.js 22 LTS → Express.js 5 → TypeScript → Layered MVC → PostgreSQL/Supabase`

The finalized backend request flow is:

`Routes → Middleware → Controllers → Services → Repositories → PostgreSQL/Supabase`

The finalized async infrastructure is:

`Redis → BullMQ Workers`

The finalized authentication architecture is:

`Supabase Auth → JWT → Express Authentication Middleware → RBAC → Resource Authorization`

Do not persist or reintroduce the previous Python/FastAPI/SQLAlchemy/Celery architecture.

---

## 7. DEFINITION OF DONE (v1)

The project is "done" for v1 only when:

- [ ] All MVP features in `PRD.md` are implemented and manually verified in-browser

- [ ] `TASKS.md` has no unchecked MVP items

- [ ] Responsive check passed on mobile/tablet/desktop

- [ ] Basic tests pass
- [ ] Backend follows the documented Layered MVC architecture

- [ ] Controllers contain no direct database queries

- [ ] Routes contain no business logic

- [ ] Services contain business/domain logic

- [ ] Repositories encapsulate database access

- [ ] PostgreSQL migrations can initialize a clean database

- [ ] Supabase RLS policies are implemented and verified

- [ ] Cross-tenant access is blocked

- [ ] RBAC and resource-level authorization are tested

- [ ] `/api/v1/health` works

- [ ] No Python/FastAPI/SQLAlchemy/Celery artifacts remain in the production backend


- [ ] Authentication tests pass

- [ ] RBAC tests pass

- [ ] Tenant isolation and RLS tests pass

- [ ] No console errors on core flows

- [ ] Backend follows the documented Layered MVC architecture

- [ ] Controllers contain no direct database queries

- [ ] Routes contain no business logic

- [ ] Services contain business/domain logic

- [ ] Repositories encapsulate database access

- [ ] PostgreSQL migrations can initialize a clean database

- [ ] Supabase RLS policies are implemented and verified

- [ ] Cross-tenant access is blocked

- [ ] `/api/v1/health` works

- [ ] No Python/FastAPI/SQLAlchemy/Celery artifacts remain in the production backend

- [ ] `README.md` exists with setup/run instructions

- [ ] `.env.example` exists without secrets

- [ ] Deployed (or deploy-ready) per the hosting target in Section 4

---

**Begin now with Section 2 (PRD.md, TECH_SPEC.md, TASKS.md, DECISIONS.md) based on the brief in Section 1. Stop and wait for my review before writing implementation code.**
