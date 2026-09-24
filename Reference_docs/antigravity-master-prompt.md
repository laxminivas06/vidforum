# MASTER PROMPT — Antigravity Full-Stack Build

> Fill in the `[ ]` placeholders below before pasting this into Antigravity.
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
  - No cross-tenant data exposure (hard tenant isolation with institution_id).
- **Reference sites / inspiration (if any):** Modern education operating platforms, linear.app clarity, stripe-grade financial ledgering.
- **Brand/tone (playful, corporate, minimal, etc.):** Modern, enterprise-grade, authoritative, sleek, accessible, and responsive.

---

## 2. REQUIRED DELIVERABLES — CREATE THESE FILES FIRST

Before any implementation, generate the following files at the project root and present them to me for review:

### `/docs/PRD.md`
Must include: problem statement, target users/personas, goals & success metrics, full feature list split into MVP vs later, user stories per feature, out-of-scope items, open questions/assumptions you had to make.

### `/docs/TECH_SPEC.md`
Must include: chosen stack and **why** (not just what), architecture diagram (text/mermaid is fine), folder structure, data model / schema, API contract (routes, request/response shapes), state management approach, auth approach if needed, third-party services/APIs, environment variables required, deployment target.

### `/docs/TASKS.md`
A dependency-ordered task breakdown (checklist format) from project scaffold → data layer → core features → polish → tests → deploy. Each task should be small enough to implement and verify in one pass. Keep this file updated as you complete tasks — check items off, don't delete history.

### `/docs/DECISIONS.md`
A running log of any non-trivial decision you make autonomously (library choice, schema tradeoff, workaround), with a one-line rationale, timestamped. This is your audit trail.

**Stop after producing these four files and wait for my go-ahead before writing implementation code.**

---

## 3. DEVELOPMENT RULES (apply throughout, no exceptions)

- **Scaffold first, feature by feature after** — get a running skeleton (routing, layout, build/dev server) working and verified in-browser before adding features.
- **One task from TASKS.md at a time.** Implement → self-test → mark done → move on. Don't batch multiple unrelated features into one pass.
- **Verify visually.** After any UI change, load the page in the browser tool and confirm it actually renders and behaves as intended — don't assume from reading code.
- **No dead code / no TODOs left unresolved** in what you present as "done." If something is intentionally deferred, log it in `TASKS.md` under a "Later" section, not as a silent TODO.
- **Responsive by default** — every screen must work at mobile, tablet, and desktop widths.
- **Accessibility baseline** — semantic HTML, proper labels/alt text, keyboard navigability, color contrast.
- **Error handling** — every network call, form, and async action needs a loading state and an error/failure state, not just the happy path.
- **Security basics** — sanitize/validate all user input server-side (never trust client validation alone), never hardcode secrets (use env vars), no obvious injection surfaces.
- **Testing** — write at minimum: unit tests for core logic/utils, and one smoke test per critical user flow. Note test coverage in `TASKS.md`.
- **Git hygiene** — small, logically scoped commits with clear messages as you go, not one giant commit at the end.
- **Performance sanity** — no obviously unbounded loops/queries, images optimized/lazy-loaded, no unnecessary re-renders (if using a component framework).

---

## 4. TECH STACK CONSTRAINTS

- **Frontend:** React 18+ (Next.js / Vite SPA) + TypeScript + Tailwind CSS + TanStack Query + Zod + Radix UI / Lucide
- **Backend:** Python 3.11+ + FastAPI (Async REST APIs) + Pydantic v2 + SQLAlchemy 2.0 (asyncpg)
- **Database:** PostgreSQL 16 (Multi-tenant with institution_id & Row-Level Security)
- **Cache / Queue:** Redis 7 + Celery / ARQ (Background asynchronous worker queue)
- **Storage:** S3-compatible Object Storage (MinIO / AWS S3) with signed URLs
- **AI Services:** Python AI Services (OpenCV + Face Recognition for AI Attendance, LLM API for AI Tutor & Voice Agent)
- **Auth:** JWT with HTTP-only cookies and refresh token rotation, Two-Tier RBAC + Resource-Level Authorization
- **Hosting target:** Docker containerized (Deployable to Cloud VM / AWS / Kubernetes)
- **Package manager:** npm / pip / poetry / uv

If left blank, the agent should propose a stack in `TECH_SPEC.md` with rationale and wait for approval rather than assuming.

---

## 5. WORKING AGREEMENT / CHECK-IN CADENCE

- After PRD + TECH_SPEC + TASKS are generated → **pause for my review.**
- After the initial scaffold is running → **pause and show me.**
- After each major feature group (not every tiny task) → **short status update**: what was built, what was verified, what's next.
- If you hit a genuine ambiguity that changes architecture or scope → **ask, don't assume.** Small implementation-detail choices can go in `DECISIONS.md` without asking.

---

## 6. AGENT MEMORY USAGE

- At the start, check memory for any prior context on this project (previous sessions, prior decisions, known constraints). Summarize what you found before proceeding.
- Persist to memory: the finalized stack choice, key architectural decisions, and any user preferences stated during this session (coding style, naming conventions, things I explicitly said not to do).
- Do not persist secrets, API keys, or credentials to memory.

---

## 7. DEFINITION OF DONE (v1)

The project is "done" for v1 only when:
- [ ] All MVP features in `PRD.md` are implemented and manually verified in-browser
- [ ] `TASKS.md` has no unchecked MVP items
- [ ] Responsive check passed on mobile/tablet/desktop
- [ ] Basic tests pass
- [ ] No console errors on core flows
- [ ] `README.md` exists with setup/run instructions
- [ ] Deployed (or deploy-ready) per the hosting target in Section 4

---

**Begin now with Section 2 (PRD.md, TECH_SPEC.md, TASKS.md, DECISIONS.md) based on the brief in Section 1. Stop and wait for my review before writing implementation code.**
