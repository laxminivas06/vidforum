# VID (Virtual Identification) — Educational Management Ecosystem

[![Node.js 22](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.x-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL / Supabase](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

VID (Virtual Identification) is a next-generation, multi-tenant enterprise educational operating ecosystem that unifies every academic, administrative, and financial operational domain around a **Single Student Master Entity**.

---

## 🏛 Architecture & Tech Stack

```mermaid
graph TD
    Client["Client (Browser / Mobile / Tablet)<br/>Next.js 14 + React 18 + Tailwind"]
    API["API Gateway / Backend Server<br/>Node.js 22 + Express + TypeScript (Port 5000)"]
    DB[("Supabase Cloud PostgreSQL (Port 5432)<br/>127 Tables, RLS, Triggers, Views")]

    Client -->|HTTP / JSON REST API| API
    API -->|Tenant Isolation & RLS| DB
```

### Stack Highlights
- **Frontend**: Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS, TanStack Query v5, Radix UI & Lucide Icons.
- **Backend**: Node.js 22, Express.js, TypeScript, Layered MVC architecture (`Routes -> Controllers -> Services -> Repositories -> PostgreSQL`).
- **Database**: Supabase PostgreSQL with 127 tables across 16 architectural domains, Row-Level Security (RLS), custom audit triggers, cross-tenant consistency triggers, and SSL connection pooling.
- **AI Yantra**: Strictly bounded to 3 isolated workspaces (AI Voice Agent, AI Attendance, AI Tutor).

---

## 🛡️ Core Architectural Pillars & Non-Negotiables

1. **Single Student Master Entity (PRD Rule 1)**: Student is **never** a standalone workspace. A single immutable master record (`students`) serves as the relational anchor across Admissions, Academics, Attendance, Examinations, Finance, Documents, Timetable, and AI Yantra.
2. **Tenant Isolation (PRD Rule 2)**: Strict tenant segmentation enforced at both application layer (`TenantMiddleware`) and database layer (`institution_id` indexed on all tables + PostgreSQL RLS).
3. **Dynamic Module Activation (PRD Rule 5)**: Optional modules (Hostel, Transport, Library, Sports, Events, Inventory) dynamically toggle on/off per institution, automatically pruning routes and navigation links.
4. **Pre-Commit Verification Pipeline**: Examinations marks imports and attendance finalization require pre-commit validation to eliminate silent data corruption.
5. **Layered MVC Architecture**: Complete decoupling of HTTP routing, request validation, business logic, and database persistence.

---

## 📁 Repository Directory Structure

```text
vidforum/
├── backend/                  # Node.js 22 + Express + TypeScript Backend
│   ├── db/                   # Database migrations, triggers, and seed data
│   │   ├── schema.sql        # 127 tables, extensions, enums, views, RLS
│   │   ├── patch_triggers.sql# Table-aware audit & consistency triggers
│   │   └── seed.sql          # Multi-tenant demo dataset
│   ├── src/
│   │   ├── config/           # Database pool (pg SSL) and environment config
│   │   ├── middleware/       # Auth, Tenant, RBAC, and Error Interceptor
│   │   ├── modules/          # Domain modules (Routes, Controller, Service, Repository)
│   │   │   ├── academics/    # Hierarchy, departments, courses, classes, sections
│   │   │   ├── admissions/   # Applications, enquiries, approval pipeline
│   │   │   ├── faculty/      # Roster, teaching assignments, workload
│   │   │   ├── finance/      # Fee structures, ledger, invoices, receipts
│   │   │   ├── institutions/ # Multi-tenant directory, plans, module toggles
│   │   │   ├── students/     # Central Student Master Entity (360° profile)
│   │   │   ├── attendance/   # Roll-call, daily absentee logs, corrections
│   │   │   ├── examinations/ # Exam schedules, marks entry, report cards
│   │   │   ├── documents/    # Private uploads, verifiable certificates
│   │   │   ├── timetable/    # Period scheduling, clash detection
│   │   │   ├── hrms/         # Staff directory, leaves, payroll
│   │   │   ├── ai-yantra/    # Voice agent, biometric attendance, AI tutor
│   │   │   └── optional-modules/ # Events, Transport, Hostel, Library, Sports, Inventory
│   │   ├── routes/           # Versioned API router (/api/v1)
│   │   └── server.ts         # Server bootstrap & lifecycle hooks
│   ├── nodemon.json          # Development watcher configuration
│   └── package.json          # Backend dependencies & scripts
├── frontend/                 # Next.js 14 + React 18 App Router
│   ├── app/                  # Application routes (32 static pages)
│   │   ├── (institution-admin)/ # Institution administration workspace
│   │   ├── (super-admin)/       # Super Admin global control center
│   │   ├── academics/           # Curriculum & class hierarchy
│   │   ├── admissions/          # Admissions funnel & Kanban board
│   │   ├── faculty/             # Faculty dashboard & roster
│   │   ├── finance/             # Fee management & invoices
│   │   └── students/            # Student 360° profile view
│   ├── components/           # Component Design System
│   │   ├── student/          # Single StudentProfile (Rule 1, 8 tabs)
│   │   └── ui/               # Button, Table, Card, Form, SlideOver, etc.
│   ├── lib/                  # TanStack Query hooks & API client with mock fallback
│   └── package.json          # Frontend dependencies & scripts
└── docs/                     # Canonical System Specifications
    ├── PRD.md                # Product Requirements Document (30 Rules)
    ├── TECH_SPEC.md          # Technical Architecture & Schema Spec
    ├── TASKS.md              # Milestone & Task Tracking Ledger
    ├── DECISIONS.md          # Architecture Decision Records (ADR-001 to ADR-010)
    ├── MEMORY.md             # Persistent Agent Memory & Context
    ├── Design.md             # Visual Design System Tokens
    ├── AppFlow.md            # Route Hierarchy & Navigation Matrix
    └── VID_Database_Architecture.md # 16 PostgreSQL Domain Schemas
```

---

## 📊 Current Implementation Progress (As of 2026-09-25)

| Subsystem | Milestone Target | Status | Deliverables & Verification |
| :--- | :--- | :---: | :--- |
| **Supabase Database** | 16 Domains, 127 Tables | **100% Deployed** | All tables, triggers, indexes, RLS policies, views, and seed data live on Supabase PostgreSQL. |
| **Backend Core** | Layered MVC in TypeScript | **100% Active** | Node.js 22 + Express running on port `5000`. Centralized error handling, tenant isolation, and connection pooling. |
| **Admissions Module** | Full Layered MVC | **Complete** | Endpoints for enquiries, Kanban status shifts, document verification, and atomic student enrollment pipeline. |
| **Students Module** | Single Student Master | **Complete** | 360° profile aggregator fetching demographics, guardians, academic enrollments, attendance, and fees in one call. |
| **Institutions Module** | Full Layered MVC | **Complete** | Multi-tenant tenant directory, plan tiers, and dynamic module toggle flags. |
| **Academics Module** | Full Layered MVC | **Complete** | Department, course, class, section, subject hierarchy and syllabus management. |
| **Faculty Module** | Full Layered MVC | **Complete** | Faculty directory, subject specialization, class mapping, and workload counters. |
| **Finance Module** | Full Layered MVC | **Complete** | Fee structures, student fee ledgers, payment checkout, invoices, and instant PDF receipts. |
| **Operational Routes** | REST Endpoints | **Complete** | Attendance, Examinations, Documents, Timetable, HRMS, AI Yantra, and Optional Modules. |
| **Frontend UI** | Next.js 14 App Router | **100% Built** | 32/32 static routes, component design system, role-adaptive sidebar, single Student Master view. |
| **Data Synchronization** | Frontend $\leftrightarrow$ Backend | **Connected** | TanStack Query custom hooks wired to `http://localhost:5000/api/v1/` with zero-downtime mock fallback. |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20.x or v22.x+
- **Package Manager**: `npm`
- **Git**

### 2. Environment Variables
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres.cyvckmjocomqzipbvbpv:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
JWT_SECRET=super-secret-jwt-key-for-vid-platform-2026
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
```

---

### 3. Running the Development Servers

#### Running Backend
```powershell
# In vidforum/backend:
npm run dev
# Or using nodemon:
nodemon
```
The backend starts at `http://localhost:5000`.  
Health check: `http://localhost:5000/api/v1/health`

#### Running Frontend
```powershell
# In vidforum/frontend:
npm run dev
```
The frontend starts at `http://localhost:3000`.

---

### 4. Running in Production

#### Build and Start Backend
```powershell
# In vidforum/backend:
npm run build    # Compiles TypeScript (src/ -> dist/)
npm start        # Executes node dist/server.js
```

#### Build and Start Frontend
```powershell
# In vidforum/frontend:
npm run build    # Compiles Next.js production bundle
npm start        # Starts production Next.js server
```

---

## 📡 API Reference Snapshot (`/api/v1/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and database connection status |
| `GET` | `/institutions` | List all registered tenants with subscription tier |
| `GET` | `/students` | Query students with 360° profile aggregation |
| `GET` | `/admissions/applications` | Kanban admission applications list |
| `POST`| `/admissions/applications/:id/approve` | Transition applicant to enrolled student master |
| `GET` | `/academics/hierarchy` | Full academic tree (departments, classes, sections) |
| `GET` | `/faculty` | Faculty roster with assigned subjects and workload |
| `GET` | `/finance/fees` | Fee structures and student billing ledger |
| `POST`| `/finance/payments` | Record fee payment and issue receipt |
| `GET` | `/attendance/sessions` | Class attendance roll-call sessions |
| `GET` | `/examinations/schedules` | Examination timetables and marks entry |
| `POST`| `/ai-yantra/voice/call` | Dispatch AI voice campaign call |
| `POST`| `/ai-yantra/attendance/verify` | Face biometric attendance verification |
| `POST`| `/ai-yantra/tutor/chat` | Context-bounded AI tutoring query |

---

## 📚 Complete Specifications & Documentation

- [PRD.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/PRD.md) — 30 Non-Negotiable Rules, 10 Personas, Feature Matrix
- [TECH_SPEC.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/TECH_SPEC.md) — System Architecture, Node.js + Express + PostgreSQL Spec
- [TASKS.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/TASKS.md) — Milestone breakdown, verification checklist, progress ledger
- [DECISIONS.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/DECISIONS.md) — Architecture Decision Records (ADR-001 through ADR-010)
- [MEMORY.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/MEMORY.md) — Persistent memory, plugin matrix, and conversion logs
- [AppFlow.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/AppFlow.md) — Screen inventory and route navigation hierarchy
- [Design.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/Design.md) — Design system tokens and component guidelines
- [VID_Database_Architecture.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/VID_Database_Architecture.md) — 16 PostgreSQL domains and 127 table schemas

---

*VID Educational Management Ecosystem &copy; 2026. All rights reserved.*