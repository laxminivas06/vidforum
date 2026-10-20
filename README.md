# VID (Virtual Identification) — Educational Management Ecosystem

[![Node.js 22](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.x-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL / Supabase](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

VID (Virtual Identification) is a multi-tenant enterprise educational operating ecosystem that unifies academic, administrative, and financial workflows around a **Single Student Master Entity**.

---

## 🏛 Architecture & Tech Stack

```mermaid
graph TD
    Client["Client (Browser / Mobile / Tablet)<br/>Next.js 14 App Router + React 18 + Tailwind"]
    API["API Gateway / Backend Server<br/>Node.js 22 + Express + TypeScript (Port 5000)"]
    DB[("Supabase Cloud PostgreSQL (Port 5432)<br/>127 Tables, RLS, Triggers, Views")]
    AI["AI Yantra Services<br/>Voice Agent, On-Device Face Biometrics, AI Tutor"]

    Client -->|HTTP / JSON REST API| API
    API -->|Tenant Isolation & RLS| DB
    Client -->|On-Device WebAssembly Inference| AI
    API -->|Telephony & AI Services| AI
```

### Stack Highlights
- **Frontend**: Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS, TanStack Query v5, Radix UI & Lucide Icons.
- **Backend**: Node.js 22, Express.js, TypeScript, Layered MVC architecture (`Routes -> Controllers -> Services -> Repositories -> PostgreSQL`).
- **Database**: Supabase PostgreSQL across 16 architectural domains, Row-Level Security (RLS), custom audit triggers, cross-tenant consistency triggers, and SSL connection pooling.
- **AI Yantra**: Isolated intelligent services encompassing multilingual parent voice notifications, on-device edge facial attendance, and bounded academic tutoring.

---

## 🛡️ Core Architectural Principles

1. **Single Student Master Entity**: Student is never a standalone workspace. A single immutable master record (`students`) serves as the relational anchor across Admissions, Academics, Attendance, Examinations, Finance, Documents, Timetable, and AI Yantra.
2. **Strict Multi-Tenant Isolation**: Multi-tenant segmentation is enforced at both the application layer (`TenantMiddleware`) and database layer (`institution_id` indexed on all tables with PostgreSQL RLS).
3. **Dynamic Module Activation**: Optional modules (Hostel, Transport, Library, Sports, Events, Inventory) toggle per institution, automatically pruning routes and navigation.
4. **Pre-Commit Verification Pipeline**: Examinations marks imports and attendance finalization require pre-commit validation to eliminate silent data corruption.
5. **Decoupled Edge AI & Cloud State**: Biometric recognition runs entirely on-device via WebAssembly/ONNX (privacy-first, zero raw biometric uploads required), while operational state syncs to the centralized cloud database.

---

## 📁 Repository Structure

```text
VID_School/
├── backend/                  # Node.js 22 + Express + TypeScript API Server
│   ├── db/                   # Database schemas, migrations, and triggers
│   ├── src/
│   │   ├── config/           # Database pool (pg SSL) and environment config
│   │   ├── middleware/       # Auth, Tenant, RBAC, and error handlers
│   │   ├── modules/          # Modular domain services (Academics, Admissions, Finance, etc.)
│   │   │   ├── academics/    # Class hierarchy, departments, sections, subjects
│   │   │   ├── admissions/   # Applications, enquiry funnel, enrollment pipeline
│   │   │   ├── faculty/      # Roster, teaching assignments, workload
│   │   │   ├── finance/      # Fee structures, student ledgers, invoicing
│   │   │   ├── institutions/ # Multi-tenant directory, plans, module toggles
│   │   │   ├── students/     # Central Student Master Entity (360° profile)
│   │   │   ├── attendance/   # Class sessions, roll-call, biometric sync
│   │   │   ├── examinations/ # Schedules, grading scales, marks entry
│   │   │   ├── hrms/         # Staff directory, leaves, payroll
│   │   │   └── ai-yantra/    # Voice agent, telephony providers, AI services
│   │   └── routes/           # Versioned REST router (/api/v1)
│   └── package.json
├── frontend/                 # Next.js 14 + React 18 App Router
│   ├── app/                  # Application route workspaces
│   │   ├── (auth)/           # Authentication & multi-tenant login
│   │   ├── academics/        # Curriculum & class hierarchy
│   │   ├── admissions/       # Admissions funnel & application review
│   │   ├── attendance/       # Roll-call, daily registers, biometric attendance
│   │   ├── faculty/          # Faculty dashboard & roster
│   │   ├── finance/          # Fee collection, invoices, receipts
│   │   ├── students/         # Student 360° profile view
│   │   └── voice-agent/      # Voice agent campaigns, call history & setup
│   ├── components/           # UI design system & workspace layouts
│   ├── lib/                  # TanStack Query hooks, API client, face engine
│   ├── public/               # Static assets & vendor model binaries
│   └── package.json
├── docs/                     # Architecture & Product Specifications
└── packages/                 # Shared TypeScript libraries & API schemas
```

---

## 🌟 Primary Workspaces & Capabilities

| Workspace | Scope & Key Capabilities |
| :--- | :--- |
| **Student 360° Master** | Single comprehensive record aggregating demographics, guardians, enrollments, attendance records, academic performance, and financial balances in one place. |
| **Admissions Pipeline** | Application lifecycle from enquiry to document verification and atomic enrollment into the student master table. |
| **Academics & Timetable** | Department hierarchies, course offerings, grade sections, timetable clash detection, and period scheduling. |
| **Attendance & Biometrics** | Multi-modal attendance tracking: standard roll-call registers and privacy-preserving on-device facial recognition running locally in the browser with offline capability. |
| **Finance & Fee Ledger** | Transparent fee schedules, installment tracking, online payment receipts, and automated parent billing summaries. |
| **Parent Voice Outreach** | Multilingual outbound communication for school event announcements, fee reminders, and attendance alerts with automated WhatsApp follow-ups. |
| **Examinations & Grading** | Exam timetables, multi-assessor marks entry, weighted grading structures, and automated report card generation. |
| **HRMS & Faculty** | Staff profiles, subject specialization mapping, leave tracking, and teaching workload management. |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: `npm`
- **PostgreSQL / Supabase Database instance**

### 2. Environment Configuration

Copy the example environment file in `backend/`:
```bash
cp backend/.env.example backend/.env
```

Configure your database and security credentials in `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
JWT_SECRET=your-secure-random-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Installation

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies (this automatically sets up the self-hosted AI models and vendor runtimes):
```bash
cd ../frontend
npm install
```

### 4. Running the Development Environment

Start the Backend API Server:
```bash
cd backend
npm run dev
```
*API server runs at `http://localhost:5000` (Health check: `http://localhost:5000/api/v1/health`)*

Start the Frontend Web Application:
```bash
cd frontend
npm run dev
```
*Application runs at `http://localhost:3000`*

---

## 📡 API Reference Overview (`/api/v1/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and database connectivity verification |
| `GET` | `/institutions` | List registered tenants and active module configuration |
| `GET` | `/students` | Query students with 360° aggregated master profile |
| `GET` | `/admissions/applications` | Retrieve admission applicant pipeline |
| `POST`| `/admissions/applications/:id/approve` | Transition applicant to enrolled student master |
| `GET` | `/academics/hierarchy` | Full academic structure (departments, classes, sections) |
| `GET` | `/attendance/sessions` | Fetch class attendance sessions and daily logs |
| `POST`| `/attendance/sessions` | Finalize attendance submission |
| `GET` | `/finance/fees` | Fee structures, student ledgers, and billing records |
| `GET` | `/examinations/schedules` | Examination timetables and marks entry |
| `GET` | `/ai-yantra/voice/health` | Telephony line, voice synthesis, and service health check |
| `GET` | `/ai-yantra/voice/campaigns` | List parent notification campaigns and progress |
| `POST`| `/ai-yantra/voice/call-test` | Dispatch a single test call |

---

## 📚 Documentation & Specifications

Detailed architectural documents and system specifications are available in the [`docs/`](docs/) directory:

- [PRD.md](docs/PRD.md) — Product Requirements Document & Non-Negotiable System Invariants
- [TECH_SPEC.md](docs/TECH_SPEC.md) — Technical Architecture & Domain Schemas
- [TASKS.md](docs/TASKS.md) — System Roadmap & Milestone Ledger
- [DECISIONS.md](docs/DECISIONS.md) — Architecture Decision Records (ADRs)
- [Design.md](docs/Design.md) — Visual Design Tokens & Component System Guidelines
- [VID_Database_Architecture.md](docs/VID_Database_Architecture.md) — PostgreSQL Domain Schemas

---

*VID Educational Management Ecosystem &copy; 2026. All rights reserved.*