# VID Platform: Codebase Architecture & Technical Map

**Document:** `/docs/CODEBASE_MAP.md`  
**Execution Standard:** Section 12 (Step R1 Audit)  
**Status:** Canonical & Audited  
**Date:** October 3, 2026  

---

## 1. Technology Stack & Frameworks

| Layer | Technology | Details |
|---|---|---|
| **Backend Runtime** | Node.js (v20+) | TypeScript 5.7.2, ESM / tsx 4.19.2 |
| **Backend Framework** | Express 4.21.2 | Modular MVC, Helmet, CORS, Morgan |
| **Frontend Framework** | Next.js 14.2.18 | App Router (`frontend/app/`), React 18.3.1 |
| **Frontend State/Cache** | TanStack Query v5.60.5 | Hook-based query/mutation caching |
| **Frontend Styling** | Tailwind CSS 3.4.15 | Custom design tokens, Lucide React 0.460 |
| **Database** | PostgreSQL on Supabase | Hosted PostgreSQL with multi-tenant schemas |
| **Database Client** | `pg` 8.13.1 (node-postgres) | Connection pool with SSL support |
| **Auth & Security** | JWT (jsonwebtoken 9.0.2) | bcryptjs 2.4.3 for password hashing |
| **Validation** | Zod 3.24.1 | Schema validation client & server |
| **Spreadsheet Engine** | xlsx 0.18.5 | Client-side spreadsheet parsing & generation |

---

## 2. Directory Structure & Conventions

```
VID_School/
├── backend/                        # Express TypeScript API server
│   ├── db/
│   │   ├── migrations/             # Numbered SQL migrations (001 to 009)
│   │   └── schema.sql              # Master consolidated schema
│   ├── scripts/                    # Database maintenance & migration runner scripts
│   │   └── run-migration.ts        # Single-file migration execution script
│   └── src/
│       ├── common/                 # Base repository, audit dispatcher, error format
│       ├── config/                 # Environment variables, database pool
│       ├── middleware/             # Tenant resolver, auth guard, resource guard, error handler
│       ├── modules/                # Domain-driven feature modules (routes, service, repo)
│       │   ├── academics/          # Classes, sections, subjects, academic years
│       │   ├── admissions/         # Inquiries, applications, atomic enrollment
│       │   ├── attendance/         # Daily & period roll call, leave reconciliation
│       │   ├── audit/              # Immutable audit logging
│       │   ├── auth/               # Login, token refresh, password management
│       │   ├── documents/          # Vault storage, QR certificate generation
│       │   ├── examinations/       # Exam schedules, pre-commit validation, report cards
│       │   ├── faculty/            # Scoped teacher profiles, class allocations
│       │   ├── finance/            # Fee structures, invoices, payments, webhooks
│       │   ├── hrms/               # Staff directory, leave quotas, biometric logs, payroll
│       │   ├── institutions/       # Multi-tenant provisioning & module toggles
│       │   ├── notifications/      # Multi-channel notification delivery & inbox
│       │   ├── optional-modules/   # Events, Transport, Hostel, Library, Sports, Inventory
│       │   ├── students/           # Single student master record (no workspace)
│       │   ├── timetable/          # Rooms, periods, conflict detection, publishing
│       │   └── users/              # User accounts & faculty provisioning
│       ├── routes/
│       │   └── api.v1.ts           # Central API v1 router mounting all domain modules
│       ├── utils/                  # API response formatting (`sendSuccess`, `sendError`)
│       ├── app.ts                  # Express application setup & middleware mounting
│       └── server.ts               # HTTP server bootstrap & graceful shutdown
├── frontend/                       # Next.js 14 Web Application
│   ├── app/                        # App Router directory
│   │   ├── (auth)/                 # Login route group
│   │   ├── dashboard/              # Executive Hub & Institute Admin Workspace
│   │   ├── admissions/             # Admissions Kanban & student enrollment
│   │   ├── academics/              # Academic hierarchy & section roster
│   │   ├── faculty/                # Faculty workspace & assignments
│   │   ├── attendance/             # Daily roll call & attendance sessions
│   │   ├── examinations/           # Exam schedules & gradebook
│   │   ├── finance/                # Fee collection, invoices, receipts
│   │   ├── documents/              # Vault storage & QR verification
│   │   ├── hrms/                   # Staff roster, Add Staff modal, bulk import
│   │   ├── timetable/              # Class timetable matrix & clash resolver
│   │   ├── settings/               # Tenant settings & security
│   │   └── students/               # Student Master 360° Profile view
│   ├── components/
│   │   ├── layout/                 # AppShell layout with persistent rails
│   │   ├── ui/                     # Design System primitives (Button, Card, Table, etc.)
│   │   └── institutions/           # ProvisionTenantModal, AddInstituteAdminModal
│   ├── config/
│   │   ├── navigation.ts           # Role-based navigation item configurations
│   │   └── workspaces.ts           # 12 Platform Workspace metadata & path matcher
│   ├── contexts/
│   │   └── AuthContext.tsx         # Client authentication state & permissions
│   ├── lib/
│   │   └── api/                    # TanStack Query custom hooks (`hooks.ts`)
│   └── types/                      # Frontend TypeScript type declarations
├── docs/                           # Persistent architectural & engineering memory
└── package.json                    # Monorepo root orchestration
```

---

## 3. Database Migrations Ledger

Migrations are sequentially ordered in `backend/db/migrations/`:

| Migration File | Description | Status |
|---|---|---|
| `001_phase1_step_b.sql` | Core Platform: institutions, auth, roles, permissions, audit_logs, notifications | Applied |
| `002_phase1_step_c.sql` | Academic Core: academic_years, departments, classes, sections, subjects, admissions | Applied |
| `003_phase2_timetable.sql` | Timetable: rooms, periods, timetables, timetable_entries, substitutions | Applied |
| `004_phase2_finance.sql` | Finance: fee_structures, invoices, payments, receipts, discounts, refunds | Applied |
| `005_phase2_attendance.sql` | Attendance: attendance_sessions, attendance_records, student_leave_requests | Applied |
| `006_phase2_examinations.sql` | Examinations: exams, exam_schedules, marks, report_cards, invigilators | Applied |
| `007_phase2_documents.sql` | Documents: document_types, documents, document_verifications, templates | Applied |
| `008_phase2_hrms.sql` | HRMS: staff, designations, leave_types, leave_balances, biometric_logs | Applied |
| `009_staff_extended_fields.sql` | Extended Staff: qualification, university, subjects, experience, address, DOB, gender | Applied |

**Migration Command:**
```bash
# Run specific migration:
npx tsx backend/scripts/run-migration.ts <migration_name>.sql
```

---

## 4. Test Commands & Testing Infrastructure

| Test Type | Command | Scope & Location |
|---|---|---|
| **Type Check (Backend)** | `npm --prefix backend run build` | `tsc` compilation across all backend files |
| **Type Check (Frontend)** | `npx tsc --noEmit` (in `frontend/`) | Next.js App Router & component typecheck |
| **Linting (Frontend)** | `npm --prefix frontend run lint` | Next.js ESLint configuration |
| **API Integration Tests** | `npm --prefix backend test` | Node test runner / tsx integration test suites |
| **End-to-End Tests** | `npm run e2e` | Playwright browser automation on test database |

---

## 5. Environment Variables & Secrets Policy

Configured via `backend/.env` (server) and `frontend/.env.local` (client):

| Variable | Description | Location | Default / Dev Fallback |
|---|---|---|---|
| `PORT` | Backend HTTP Port | Server only | `5000` |
| `NODE_ENV` | Runtime environment | Server & Client | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Server only | Supabase URI |
| `TEST_DATABASE_URL` | Isolated test database URI | Server only | Dedicated test database |
| `JWT_SECRET` | Token signing secret | Server only | High-entropy secret |
| `JWT_EXPIRES_IN` | Access token lifespan | Server only | `15m` (R2 spec) |
| `CORS_ORIGIN` | Allowed web origin | Server only | `http://localhost:3000` |
| `DEFAULT_INITIAL_PASSWORD` | Configurable dev initial password | Server only | `admin123` (dev only) |

---

## 6. Existing Mounted API Routes (`/api/v1`)

```
/api/v1
├── /health                       (GET - System & database health probe)
├── /auth
│   ├── /login                    (POST - Authentication endpoint)
│   ├── /me                       (GET - Current authenticated session identity)
│   └── /refresh                  (POST - JWT refresh token rotation)
├── /users
│   ├── /                         (GET, POST - Platform users management)
│   ├── /faculty-accounts         (GET - Staff roster with credential status)
│   ├── /provision-faculty        (POST - Generate user credentials & workspace grants)
│   ├── /update-workspaces        (POST - Update permitted workspaces)
│   ├── /reset-password           (POST - Reset user password)
│   └── /toggle-status            (POST - Activate/deactivate user account)
├── /institutions                 (GET, POST, PATCH - Tenant provisioning & modules)
├── /notifications                (GET, POST, PATCH - Inbox, unread count, read mark)
├── /audit-logs                   (GET - Immutable audit trail queries)
├── /academics                    (CRUD - Years, departments, classes, sections, subjects)
├── /admissions                   (GET, POST, PATCH - Applications & atomic approval)
├── /students                     (GET, PATCH - Single Student Master 360° record)
├── /faculty                      (GET, POST - Teaching staff allocations & assignments)
├── /attendance                   (GET, POST - Sessions, batch roll call, leave requests)
├── /examinations                 (GET, POST - Schedules, marks batch, pre-commit validation, rankings)
├── /finance                      (GET, POST - Invoices, fee collection, webhooks, receipts)
├── /documents                    (GET, POST - Vault storage, verification, QR Bonafide/TC)
├── /hrms                         (GET, POST - Staff directory, leaves, biometric attendance)
└── /timetable                    (GET, POST - Period matrices, conflict engine, publish)
```
