# VID Platform: Comprehensive Project & Progress Summary

**Project Name:** VID (Virtual Identification) Platform  
**Architecture:** Multi-Tenant Educational Operating Ecosystem  
**Repository:** `vidforum`  
**Document:** [`docs/Summary.md`](file:///c:/Projects/VID_School/vidforum/docs/Summary.md)  
**Last Updated:** October 13, 2026  
**Status:** Core Backend Complete (83/83 Tests Passing) | Core Web Workspaces Integrated (Gates R, 1B, 2, 3 Cleared)  

---

## 1. Executive Summary & Vision

The **VID (Virtual Identification) Platform** is an enterprise-grade, multi-tenant educational operating ecosystem engineered to connect the complete operational and academic lifecycle of educational institutions. Unlike traditional fragmented campus software where admissions, fees, attendance, academics, and exams operate as disconnected silos, VID is anchored to a fundamental architectural invariant:

> **One Institution $\to$ One Connected Ecosystem $\to$ One Student Master Record $\to$ Multiple Connected Services.**

The student is **never** a standalone workspace; rather, the single immutable Student Master Record serves as the gravitational center around which academic curriculum, faculty assignments, biometric attendance, fee billing, examinations, and AI tutoring pivot.

---

## 2. Core Architectural Invariants & Non-Negotiables

All development across backend and frontend strictly complies with the **30 Non-Negotiable Rules** defined in [`docs/PRD.md`](file:///c:/Projects/VID_School/vidforum/docs/PRD.md):

1. **Rule 1: Single Student Master Entity:** The student record is created once (at admission enrollment) and referenced across all 12 operational workspaces. Duplicate student records are prohibited.
2. **Rule 2: Tenant Isolation:** All database tables, queries, file storage, and cache keys enforce strict tenant scoping via `institution_id`. Cross-tenant data leakage is prevented via `TenantMiddleware` and Row-Level Security (RLS).
3. **Rule 3: Team Collaboration & Zero-Isolation Policy:** Codebase is shared and multi-user ready. Zero hardcoded personal accounts, zero machine-specific local paths (`C:\Users\...`, `C:\Antigravityyyyy\...`), and graceful fail-open mechanisms for optional dependencies.
4. **Zero Duplicate Data & Dates Policy:** Strictly enforced uniqueness across IDs, dates, tenant codes, and mock/seed data.
5. **Zero LocalStorage for Domain Data:** Browser `localStorage` and `sessionStorage` are exclusively reserved for ephemeral auth tokens (`vid_auth_token`). All domain state lives in the centralized cloud database (Supabase PostgreSQL) via backend APIs.
6. **Workspace Navigation Isolation:** When navigating inside an operational workspace (e.g., Staff/HRMS, Academics, Admissions), the sidebar displays **only** that workspace's dedicated tools. Cross-workspace navigation items are completely suppressed to eliminate cognitive clutter.
7. **Clean Modal Footers:** Modal and form action footers remain clean and uncluttered (`Cancel`, `Save`, `Submit`), with keyboard shortcuts operating under the hood without visible bottom `<kbd>` indicator badges.

---

## 3. Technology Stack & Infrastructure

| Layer | Technologies | Key Architecture Highlights |
|---|---|---|
| **Backend API** | Node.js / Express.js with TypeScript | RESTful `/api/v1/*` contracts, Zod runtime schema validation, bcrypt authentication, centralized audit dispatcher, fail-open connection management. |
| **Database** | PostgreSQL (Supabase Cloud) | Managed via sequential SQL migrations ([`docs/vid_schema_migrations.sql`](file:///c:/Projects/VID_School/vidforum/docs/vid_schema_migrations.sql)), connection pooling tuned to session limits (`max: 10`), stored procedures, RLS. |
| **Frontend Web** | Next.js 14+ (App Router) + React 18+ | Strict TypeScript typing (`npx tsc --noEmit` clean), Tailwind CSS with custom design tokens, TanStack React Query for centralized caching, Radix UI primitives, Lucide icons. |
| **Design System** | Tailored High-Density UI System | Responsive 320px–1440px+, dark/light canvas support, table-to-card auto-adaptation, unified `@/components/ui/` primitives (`Table`, `Badge`, `Card`, `SlideOver`, `StatCard`). |
| **AI Subsystem (Yantra)** | Bounded AI Engine (Phase 3) | Strictly restricted to Voice Agent, Biometric Attendance, and AI Tutor. Zero raw or unrestricted DB access. |

---

## 4. Master Canonical Workspace Matrix (12 Workspaces)

Every route and API controller maps strictly to one of the 12 platform workspaces detailed in [`docs/WORKSPACE_MAP.md`](file:///c:/Projects/VID_School/vidforum/docs/WORKSPACE_MAP.md):

| # | Workspace Key | Title | Primary Route | Operational Scope & Capabilities |
|---|---|---|---|---|
| **1** | `dashboard` | **Executive Workspace Hub** | `/dashboard` | Central operational summary, Student 360° overview, User & Role administration, high-level institutional health metrics. |
| **2** | `hrms` | **Staff & HRMS Workspace** | `/hrms/staff` | Staff directory (teaching & non-teaching), live duplicate detection, bulk Excel/CSV onboarding, leave types/balances, daily roll call, department & designation CRUD. |
| **3** | `academics` | **Academics & Curriculum** | `/academics/hierarchy` | Academic years (clone & set current), grade-section class matrix, subjects master, weekly periods allocation, exam estimate windows (A2), working calendar, preferred textbooks (A1). |
| **4** | `admissions` | **Admissions & Enrollment** | `/admissions` | Multi-stage inquiry & application Kanban, document verification vault, atomic 1-click enrollment into Student Master, Class Promotion Wizard. |
| **5** | `faculty` | **Faculty Management** | `/faculty/dashboard` | Faculty dashboard, My Assigned Courses, class-section rosters with manual roll call, mentees, marks & assignments. |
| **6** | `timetable` | **Timetable & Schedules** | `/timetable/matrix` | Period definitions, rooms, conflict-checking matrix editor, teacher unavailability, daily substitutions, publishing blockers. |
| **7** | `attendance` | **Attendance System** | `/attendance/sessions` | Daily & period roll call, mark-all-present, working-day validation, low-attendance alerts (<75%), leave reconciliation. |
| **8** | `finance` | **Finance & Fee Collection** | `/finance/dashboard` | Fee plan templates, student fee accounts, counter POS collection, sequential immutable receipts, append-only ledger, defaulters aging. |
| **9** | `examinations` | **Examinations & Gradebook** | `/examinations/schedules` | Exam schedules generated from academic estimates, pre-commit Excel mark validation, GPA & tie-aware class ranking, report cards. |
| **10** | `documents` | **Documents Vault** | `/documents/vault` | Secure document storage, verification workflow, tamper-evident QR Bonafide & Transfer Certificate (TC) generation. |
| **11** | `campus_life` | **Campus Services** | `/events` | Extensible modular services: Fleet transport, hostel room allocations, library catalog, sports equipment, asset inventory. |
| **12** | `settings` | **Institutional Settings** | `/settings` | Institution profile, security policies, notification center & message outbox, immutable system audit logs. |
| **—** | `platform` | **Super Admin Console** | `/dashboard` | Cross-tenant provisioning, subscription tiers, platform health, tenant isolation boundaries. |

---

## 5. Current Implementation Progress & Gate Milestones

The project has achieved complete implementation of its Core Operative Backend Engine (83/83 passing tests) and has cleared successive verification gates:

```
[====================================================================] 100% Core Backend Engine (83 / 83 Tests Passing)
[====================================================================] 100% Strict Workspace Isolation & Routing Infrastructure
[====================================================================] 100% Gate R: Security & Remediation (26 / 26 Tests Green)
[====================================================================] 100% Gate 1B: Staff & HRMS (10 / 10 Tests Green)
[====================================================================] 100% Gate 2: Academics & Curriculum (10 / 10 Tests Green)
[====================================================================] 100% Gate 3: Admissions & Enrollment (10 / 10 Tests Green)
[========================================================............]  82% Frontend Web Workspace Workstations
```

### Detailed Milestone Breakdown

| Milestone | Gate Status | Test Results | Deliverables & Forensic Verification |
|---|---|---|---|
| **Step R: Audit & Unified Auth** | **COMPLETED** | 26 / 26 Green | Multi-identifier login (`findLoginSubject`), rate-limiting (5 attempts/15 min), account lockouts, `must_change_password` first-login enforcement, server-side `requireWorkspace` middleware, zero mock stores. Documented in [`docs/GATE_REPORT_R.md`](file:///c:/Projects/VID_School/vidforum/docs/GATE_REPORT_R.md). |
| **Step 1B: Staff & HRMS** | **COMPLETED** | 10 / 10 Green | Full staff lifecycle, live duplicate detection (`checkDuplicateStaff`), bulk spreadsheet import, foreign-key protected department/designation deletion, leave application workflows, daily staff attendance registers. Documented in [`docs/GATE_REPORT_1B.md`](file:///c:/Projects/VID_School/vidforum/docs/GATE_REPORT_1B.md). |
| **Step 2: Academics & Curriculum** | **COMPLETED** | 10 / 10 Green | Academic years with atomic clone, Grade $\times$ Section class matrix generation, subjects master with core/elective types, exam estimate windows (A2), holiday calendar with `isWorkingDay` calculation, preferred textbooks catalog (A1). Documented in [`docs/GATE_REPORT_2.md`](file:///c:/Projects/VID_School/vidforum/docs/GATE_REPORT_2.md). |
| **Step 3: Admissions & Enrollment** | **COMPLETED** | 10 / 10 Green | Inquiries funnel, multi-stage application pipeline, document verification, atomic 1-click admission approval creating Student Master, class capacity hard cap enforcement, atomic student promotion wizard. Documented in [`docs/GATE_REPORT_3.md`](file:///c:/Projects/VID_School/vidforum/docs/GATE_REPORT_3.md). |
| **Step 4: Faculty Management** | **IN PROGRESS** | Backend Ready | Faculty dashboard, My Assigned Courses $\to$ Classes $\to$ Sections $\to$ Student roll-call view, teacher subject allocations, mentee tracking, marks & assignment submissions. |
| **Step 5: Timetable** | **BACKEND VERIFIED** | 10 / 10 Green | Period configurations, rooms, live collision engine, clash detection, teacher substitutions. Web UI integration queued. |
| **Step 6: Attendance** | **BACKEND VERIFIED** | 10 / 10 Green | Daily & period sessions, atomic batch roll call, low-attendance alerts (<75%), leave reconciliation. |
| **Step 7: Finance & Fees** | **BACKEND VERIFIED** | 10 / 10 Green | Fee plan templates, student fee accounts, counter POS collection, sequential immutable receipts, append-only ledger. |
| **Step 8: Examinations** | **BACKEND VERIFIED** | 10 / 10 Green | Exam creation from estimates, pre-commit Excel mark validation, GPA & tie-aware class ranking, report cards. |
| **Step 9: Documents & Vault** | **BACKEND VERIFIED** | 10 / 10 Green | Document vault, cryptographic verification, tamper-evident QR Bonafide & Transfer Certificate generation. |

---

## 6. Key Subsystems & Recent Engineering Highlights

### 6.1 Authentication & Workspace RBAC
- **Dynamic Multi-Identifier Auth:** Users can authenticate via email, employee code, or admission number.
- **Server-Side Workspace Enforcement:** Routes are protected by `requireWorkspace(workspaceKey | workspaceKey[])`. Allows multi-workspace access (such as allowing both `faculty` and `hrms` workspace holders to access staff rosters without permission denial).
- **Session Security:** Token rotation on role/password updates, bcrypt-hashed credentials, zero universal credentials.

### 6.2 Staff & HRMS Hardening (Recent Fix)
- **Unified Directory Scope:** Restructured queries in `findFacultyByInstitution` to include all non-deleted staff (both teaching and non-teaching), ensuring complete visibility of administrative, accounting, and faculty personnel.
- **Connection Pool Tuning:** Eliminated N+1 query loops where 40+ simultaneous queries were dispatched in `Promise.all`. Replaced with single-pass SQL aggregations, and tuned PostgreSQL pool `max: 10` to maintain headroom on Supabase session limits.
- **Status Normalization:** Added case-insensitive, hyphen/underscore normalization (`ACTIVE`, `ON_LEAVE`) across URL params, table filters, and status cards.

### 6.3 Academics & Class Generation
- **Automated Class Matrix:** Generates `classes` by cross-multiplying configured grades with sections, establishing classroom capacities and linking class teachers.
- **Working Calendar Engine:** Determines institution working days by reconciling configured weekly schedules against holidays, vacations, and emergency closures.

### 6.4 Admissions Pipeline & Student 360°
- **Pipeline Progression:** Applications advance through `applied` $\to$ `document_verification` $\to$ `review` $\to$ `approved`.
- **Atomic Enrollment:** Single-transaction enrollment provisions the permanent Student Master Record, allocates student ID / roll number, and increments section capacity counts.

---

## 7. Active Repository Structure

```
vidforum/
├── backend/                         # Express.js TypeScript Backend
│   ├── src/
│   │   ├── config/                  # Database pool, env, Supabase configs
│   │   ├── middleware/              # Auth, tenant, workspace, resource guard
│   │   ├── modules/                 # Modular domain services:
│   │   │   ├── academics/           # Grades, sections, subjects, textbooks
│   │   │   ├── admissions/          # Inquiries, applications, enrollment
│   │   │   ├── attendance/          # Roll call, sessions, registers
│   │   │   ├── auth/                # Login, password reset, token rotation
│   │   │   ├── examinations/        # Schedules, marks, report cards
│   │   │   ├── faculty/             # Allocations, courses, workloads
│   │   │   ├── finance/             # Fee accounts, POS collection, ledger
│   │   │   ├── hrms/                # Staff directory, leaves, attendance
│   │   │   ├── institutions/        # Multi-tenant institution profiles
│   │   │   ├── timetable/           # Periods, matrix editor, solver
│   │   │   └── workspaces/          # Canonical workspace definitions
│   │   └── routes/                  # Centralized /api/v1 router
│   └── tests/                       # Integration test suites (Gates R, 1B, 2, 3)
│
├── frontend/                        # Next.js 14+ App Router Frontend
│   ├── app/                         # App Router Workstations:
│   │   ├── dashboard/               # Executive Workspace Hub
│   │   ├── hrms/staff/              # Staff & HRMS Directory & Management
│   │   ├── academics/hierarchy/     # Academics & Curriculum Hub
│   │   ├── admissions/              # Admissions Kanban & Student Directory
│   │   ├── faculty/                 # Faculty Dashboard & Assigned Courses
│   │   ├── timetable/matrix/        # Timetable Grid
│   │   ├── attendance/              # Attendance Roll Call
│   │   ├── finance/                 # Fee Collection & Ledgers
│   │   ├── examinations/            # Exam Schedules & Marks
│   │   └── documents/vault/         # Document Vault & QR Certificates
│   ├── components/
│   │   ├── layout/                  # AppShell, Topbar, Sidebar
│   │   └── ui/                      # Standard design primitives (Button, Table, Card...)
│   ├── config/                      # Navigation and canonical workspace definitions
│   └── lib/api/                     # TanStack Query hooks and API clients
│
├── docs/                            # Authoritative Project Documentation
│   ├── PRD.md                       # Product Requirements Document & 30 Rules
│   ├── TECH_SPEC.md                 # Technical Architecture Specification
│   ├── PROGRESS.md                  # Master Milestone & Gate Tracker
│   ├── WORKSPACE_MAP.md             # Canonical 12 Workspaces & Routing Spec
│   ├── MEMORY.md                    # Persistent Agent Memory & Directives
│   ├── DECISIONS.md                 # Architecture Decision Records (ADRs)
│   ├── DEFECTS.md                   # Forensic Defect Tracking
│   ├── GATE_REPORT_*.md             # Exit Gate Verification Reports
│   └── Summary.md                   # This Comprehensive Summary Document
│
└── .agents/                         # Agent Customizations & Engineering Plugins
    └── plugins/                     # 28 Active Plugins (Ponytail, Wingman, River, etc.)
```

---

## 8. Code & File Architecture: Full-Stack Structure Explained

### 8.1 Monorepo Structure & Decoupling Contract
A frequent question is whether the backend and frontend are coded in the same file. **No, the backend and frontend are strictly decoupled into two distinct sub-projects within a unified monorepo:**

```
                  ┌────────────────────────────────────────┐
                  │          PostgreSQL Database           │
                  │         (Supabase Cloud Pool)          │
                  └───────────────────▲────────────────────┘
                                      │  SQL Queries (pg Pool)
                  ┌───────────────────┴────────────────────┐
                  │           BACKEND SERVICE              │
                  │   Node.js / Express / TypeScript       │
                  │           (Port: 5000)                 │
                  └───────────────────▲────────────────────┘
                                      │  JSON REST (/api/v1/*)
                                      │  via Authorization Bearer
                  ┌───────────────────┴────────────────────┐
                  │          FRONTEND CLIENT               │
                  │   Next.js 14+ / React 18 / Tailwind    │
                  │           (Port: 3000)                 │
                  └────────────────────────────────────────┘
```

- **Backend Location:** [`backend/src/`](file:///c:/Projects/VID_School/vidforum/backend/src/) running standalone Express on **Port 5000**.
- **Frontend Location:** [`frontend/app/`](file:///c:/Projects/VID_School/vidforum/frontend/app/) running Next.js App Router on **Port 3000**.
- **Next.js API Routes (`app/api/*`) Are NOT Used:** We deliberately avoid Next.js inline route handlers or Server Actions for database access. All data mutations, business rules, and SQL queries live in the backend service.
- **Communication Bridge:** The frontend talks to the backend exclusively over standard HTTP REST requests mapped through TanStack React Query hooks in [`frontend/lib/api/hooks.ts`](file:///c:/Projects/VID_School/vidforum/frontend/lib/api/hooks.ts).

---

### 8.2 Backend Code Architecture (3-Tier Layered Pattern)
The backend adheres to a strict **Controller-Service-Repository** architectural pattern. Every domain module (e.g. `academics`, `admissions`, `faculty`, `hrms`, `finance`, `examinations`) is organized into dedicated files:

```
backend/src/modules/<module-name>/
├── <module>.routes.ts       # Route declarations, HTTP verbs, and guards
├── <module>.controller.ts   # Request/response parsing, HTTP status codes, Zod validation
├── <module>.service.ts      # Business rules, authorization logic, transaction orchestration
└── <module>.repository.ts   # Direct SQL queries, database client interactions, row mapping
```

1. **Routing & Workspace Middleware Layer (`routes/`):**
   - Express router files define endpoints (`router.get()`, `router.post()`).
   - Requests must pass through `authMiddleware` (JWT verification), `tenantMiddleware` (extracting `institution_id`), and `requireWorkspace(['faculty', 'hrms'])` (verifying user role scopes).
2. **Controller Layer (`*.controller.ts`):**
   - Receives `req: Request` and `res: Response`.
   - Validates incoming payload shapes using `zod` schemas.
   - Extracts tenant identity (`req.institutionId`) and authenticated user (`req.user`).
   - Calls the corresponding Service and sends standard responses via `sendSuccess(res, data)` or `sendError(res, message)`.
3. **Service Layer (`*.service.ts`):**
   - Contains all domain rules, business workflows, and sanity calculations.
   - Dispatches immutable administrative audit entries using `AuditDispatcher.dispatch(...)`.
   - Never writes raw SQL directly; it delegates data queries to the Repository.
4. **Repository Layer (`*.repository.ts`):**
   - Direct database access layer executing parameterized queries via `db.query(...)` or `db.transaction(...)`.
   - Strictly enforces tenant isolation by binding `institution_id = $1` on all `WHERE` clauses.

---

### 8.3 Frontend Code Architecture (Component & Hook System)
The frontend is structured into modular layers designed for high density and rapid interaction:

```
frontend/
├── app/                     # Next.js App Router Workstation Pages
│   ├── (auth)/login/        # Rate-limited authentication screen
│   ├── dashboard/           # Executive Hub launchpad & accounts management
│   ├── hrms/staff/          # Staff & HRMS Directory workstation
│   ├── academics/hierarchy/ # Academic hierarchy & curriculum workstation
│   └── admissions/          # Admissions Kanban & Student Directory
├── components/
│   ├── layout/              # Structural shells:
│   │   ├── AppShell.tsx     # Workspace layout wrapper with isolated sidebar
│   │   ├── Sidebar.tsx      # Renders ONLY active workspace sub-tools
│   │   └── Topbar.tsx       # Workspace switcher dropdown & user profile
│   └── ui/                  # Tailored design system primitives:
│       ├── Button.tsx       # Standard buttons (dense, primary, secondary, outline)
│       ├── Card.tsx         # Structured surface containers
│       ├── Table.tsx        # High-density desktop table with mobile auto-card conversion
│       ├── Badge.tsx        # Status indicators (positive, warning, negative, neutral)
│       └── SlideOver.tsx    # Flyout detail drawers for records and profiles
├── lib/
│   ├── api/
│   │   └── hooks.ts         # Centralized TanStack Query hooks (useFaculty, useCreateStaff...)
│   └── utils.ts             # Tailwind class mergers (cn) and formatters
└── types/
    └── index.ts             # Shared TypeScript models and API response types
```

1. **Workstation Pages (`app/*/page.tsx`):**
   - Each workspace route contains a `"use client"` page rendering the workstation.
   - Wrapped inside `<AppShell activeWorkspace="hrms">` to guarantee isolated navigation.
   - Manages local modal state, search inputs, and tab switches.
2. **Centralized Data Hooks (`lib/api/hooks.ts`):**
   - All server communication is centralized into reusable React Query hooks (`useQuery` and `useMutation`).
   - Attaches `Authorization: Bearer <token>` dynamically via `getAuthHeaders()`.
   - On mutation success, queries are invalidated using `queryClient.invalidateQueries(...)`, automatically synchronizing the UI across tabs and clients.
3. **Shared Design Primitives (`components/ui/`):**
   - Pure, reusable UI components adhering strictly to Tailwind CSS design tokens.
   - Ad-hoc styles or conflicting third-party component libraries are banned under **Ponytail Ultra**.

---

## 9. Quality, Security & Tooling Guarantees

1. **Type Safety:** Both frontend and backend compile cleanly with **0 type errors** (`npx tsc --noEmit` exits with code 0).
2. **Audit Logging:** Every administrative mutation (admissions approval, leave action, grade creation, fee transaction) automatically emits an immutable audit event to PostgreSQL via the `AuditDispatcher`.
3. **Database Integrity:** Managed exclusively via tested SQL migrations and Supabase MCP protocol, avoiding teardowns or destructive drops of live data.
4. **Active Plugin Suite:** Enforced through `.agents/` customizations, including **Ponytail Ultra** (minimal diffs, YAGNI, native platform first), **Wingman** (backward compatibility guards), **Docflow** (documentation synchronization), and **River Review** (multi-perspective quality review).

---

## 10. Immediate Roadmap & Next Priorities

1. **Step 4 (Faculty Management UI Polish):** Finalize interactive Course $\to$ Class $\to$ Section student attendance roll-call workflows for teachers.
2. **Step 5 (Timetable Matrix UI Integration):** Connect the tested backend clash-detection and substitution engine to the frontend drag-and-drop matrix editor.
3. **Step 6 (Attendance Parent Alert Outbox):** Wire automated absenteeism notifications from daily roll calls to the message outbox queue.
4. **Step 7 (Finance Counter POS UI):** Complete counter collection screen with receipt printing and multi-mode payment allocation.
5. **Step 8 (Report Card Generation):** Wire class ranking engine to printable PDF report card generation with subject grades and attendance metrics.
