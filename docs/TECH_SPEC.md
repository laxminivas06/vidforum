# Technical Specification: VID (Virtual Identification) Platform

**Document Version:** 1.0.0  

**Status:** Under Review (Phase 0 Deliverable)  

**System Architecture:** Multi-Tenant Modular Educational Operating System  

**Author:** Senior Full-Stack Engineering Team (Antigravity Agent)

---

## 1. Technical Stack Selection & Justification

The technical stack aligns with Section 24 of the VID specification:

| Layer | Chosen Technology | Architectural Justification ("Why") |

| :--- | :--- | :--- |

| **Frontend Framework** | **React 18+ (Next.js / Vite SPA)** | High-performance component model, optimal tree-shaking, robust ecosystem for responsive dashboards and state-driven interfaces. |

| **Frontend Language** | **TypeScript 5.x** | End-to-end static type safety preventing runtime null/undefined regressions across dense enterprise academic entities. |

| **Styling** | **Tailwind CSS + CSS Modules** | Modern design tokens, utility-first responsiveness (320px to 1440px+ breakpoints), and zero-runtime CSS footprint. |

| **Data Fetching & Cache** | **TanStack Query (React Query v5)** | Declarative server-state caching, automatic background invalidation on mutations, optimistic UI updates, and request deduplication. |

| **Validation** | **Zod 3.x** | Isomorphic runtime schema validation sharing types between form submission inputs, client query responses, and backend API contracts. |

| **UI Components & Icons** | **Radix UI Primitives + Lucide React** | Unstyled, fully accessible (WAI-ARIA compliant) interactive primitives (dialogs, dropdowns, sheet drawers, tabs) with crisp iconography. |

| **Backend Framework** | **Node.js 22 LTS + Express.js 5 + TypeScript 5.x** | Native asynchronous concurrency (`async`/`await`), automatic OpenAPI 3.0 generation, high-performance Zod v2 data serialization, and direct compatibility with Node.js AI/ML ecosystem. |

| **Database** | **PostgreSQL 16** | Proven ACID-compliant relational engine with JSONB support, row-level security (RLS), and pgvector extension for AI embeddings. |

| **Cache & Message Broker** | **Redis 7.x** | Sub-millisecond session caching, rate-limiting counters, and reliable Celery/ARQ task broker for async notifications and imports. |

| **Asynchronous Jobs** | **BullMQ Background Workers** | Asynchronous execution of heavy workloads: batch Excel marks processing, bulk SMS/voice campaign calls, document generation, and daily absentee alerts. |

| **File / Object Storage** | **S3-Compatible Object Storage (AWS S3 / MinIO)** | Segregation of unstructured binary blobs (student photos, identity proof scans, bonafide PDFs, face crops) from transactional relational data; accessed via pre-signed temporary URLs. |

| **AI Vision Layer** | **OpenCV + InsightFace / DeepFace** | Real-time face detection, alignment, and 512-dimension vector embedding extraction for Yantra AI Attendance. |

| **AI LLM & Tutor** | **LLM API (OpenAI / Anthropic / Gemini)** | Context-bounded RAG query processing for the 24/7 Yantra AI Tutor and conversational prompts for Yantra Voice Agent. |

| **Speech Services** | **STT (Whisper API) + TTS (ElevenLabs / EdgeTTS)** | Low-latency speech synthesis and transcription for automated parent voice outreach campaigns. |

---

## 1.1 Backend Architecture — Layered MVC

VID uses a layered MVC architecture implemented with Node.js, Express.js, and TypeScript. MVC is the primary application architecture, with Services and Repositories added to keep business logic and database access separate from HTTP concerns.

Backend Request Lifecycle

Client
  ↓
Express Router (/api/v1)
  ↓
Middleware
  ├── Authentication
  ├── Tenant Isolation
  ├── RBAC / Resource Authorization
  └── Request Validation
  ↓
Controller
  ↓
Service
  ↓
Repository / Data Access Layer
  ↓
PostgreSQL / Supabase

Architectural Layers

Layer

Responsibility

Must Not Contain

Routes

Define versioned API endpoints and connect middleware to controllers.

Business logic or direct database queries

Middleware

Authentication, tenant resolution, RBAC, resource authorization, validation, rate limiting, and audit context.

Domain workflow logic

Controllers

Handle HTTP requests/responses, invoke services, and map results to API responses.

Business rules or direct database queries

Services

Implement business/domain logic, workflow rules, transaction boundaries, and coordination between repositories/integrations.

HTTP-specific response handling

Repositories

Encapsulate database access and provide domain-specific data-access methods.

HTTP logic or UI concerns

Models / Data Layer

Represent persistence structures and database access contracts.

Request/response handling

Integrations

Encapsulate external systems such as payments, SMS, email, storage, telephony, and AI providers.

Core HTTP routing logic

Jobs / Workers

Execute asynchronous workloads through BullMQ.

Synchronous request-response responsibilities

MVC Responsibility Mapping

Model
 └── PostgreSQL / Supabase persistence
     └── Repository / Data Access Layer

View
 └── React / Next.js frontend
     └── Consumes versioned REST APIs

Controller
 └── Express.js Controllers
     └── Receives HTTP requests and returns HTTP responses

The Service layer is the business-logic boundary between Controllers and Repositories. Controllers must remain thin and must not contain domain rules or database queries.

Module-Level Structure

Each backend domain module should follow the same separation:

<module>/
├── routes.ts
├── controller.ts
├── service.ts
├── repository.ts
├── validators.ts
├── types.ts
└── index.ts

For larger domains, the module may contain multiple controllers, services, repositories, validators, and supporting files.

Dependency Direction

Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Database / Supabase

Dependencies must flow inward/downward through these boundaries. A Controller must not bypass the Service layer to query the database directly.

Transaction Boundary

Business operations that modify multiple related records must be coordinated by the Service layer and executed within an appropriate database transaction.

Examples include:

Admission approval → Student Master creation → related setup

Student promotion → enrollment/history updates

Marks Excel validation → marks commit

Payment → invoice/transaction/receipt workflow

Attendance finalization → immutable attendance state

This architecture keeps the API layer, business rules, persistence, and external integrations independently testable and maintainable.

## 2. High-Level Architecture Diagram

```mermaid

graph TD

    subgraph Clients["Presentation Layer (Responsive 320px - 1440px+)"]

        AdminWeb["Admin & Staff Web Application<br/>(Super Admin, Inst Admin, Faculty, Staff)"]

        MobileApp["Parent & Student Mobile Experience<br/>(Role-Adaptive Bottom Navigation & Child Switcher)"]

    end

    subgraph Gateway["API & Security Layer"]

        ReverseProxy["Reverse Proxy / Nginx / SSL (HTTPS)"]

        APIGateway["Express.js Core Router (/api/v1)"]

        AuthMiddleware["JWT Auth & Refresh Rotation (Node.js)"]

        TenantMiddleware["Tenant Isolation Middleware (Express)<br/>(institution_id Enforcer)"]

        RBACMiddleware["Two-Tier RBAC & Resource Validator (Express)<br/>(User + Role + Tenant + Resource + Action)"]

    end

    subgraph CoreServices["Backend Domain Modules (Express.js)"]

        AuthModule["auth/ & users/"]

        TenantModule["tenants/"]

        AdmissionsModule["admissions/"]

        StudentsModule["students/ (Master Entity)"]

        AcademicsModule["academics/ & faculty/"]

        AttendanceModule["attendance/"]

        ExamsModule["examinations/"]

        FinanceModule["finance/"]

        DocumentsModule["documents/"]

        HRMSModule["hrms/"]

        TimetableModule["timetable/"]

        AuditModule["audit/ & notifications/"]

    end

    subgraph AIYantraServices["AI Yantra Intelligence Layer"]

        VoiceAgent["voice_agent/<br/>(Campaigns, TTS/STT, Telephony)"]

        AIAttendance["ai_attendance/<br/>(OpenCV, Embeddings, Confidence Engine)"]

        AITutor["ai_tutor/<br/>(Context-Bounded LLM RAG, Practice Generator)"]

    end

    subgraph OptionalModules["Optional Pluggable Modules"]

        EventsMod["events/"]

        TransportMod["transport/"]

        HostelMod["hostel/"]

        LibraryMod["library/"]

        SportsMod["sports/"]

        InventoryMod["inventory/"]

    end

    subgraph Persistence["Persistence & Infrastructure Layer"]

        PostgresDB[(PostgreSQL 16<br/>Multi-Tenant Tables with RLS)]

        RedisCache[(Redis 7<br/>Sessions, Rates, BullMQ Queue)]

        ObjectStorage[(S3 / MinIO<br/>Encrypted Documents & Photos)]

        BackgroundWorkers["BullMQ Worker Processes<br/>(Batch Jobs & Notifications)"]

    end

    AdminWeb --> ReverseProxy

    MobileApp --> ReverseProxy

    ReverseProxy --> APIGateway

    APIGateway --> AuthMiddleware --> TenantMiddleware --> RBACMiddleware

    RBACMiddleware --> CoreServices

    RBACMiddleware --> AIYantraServices

    RBACMiddleware --> OptionalModules

    CoreServices --> PostgresDB

    CoreServices --> RedisCache

    CoreServices --> ObjectStorage

    CoreServices --> BackgroundWorkers

    AIYantraServices --> CoreServices

    AIYantraServices --> PostgresDB

    AIYantraServices --> ObjectStorage

    OptionalModules --> PostgresDB

```

---

## 3. Repository & Folder Structure

Following Section 24 of the specification:

```

VID_School/

├── docs/

│   ├── PRD.md

│   ├── TECH_SPEC.md

│   ├── TASKS.md

│   └── DECISIONS.md

├── Reference_docs/

│   ├── VID Platform.pdf

│   └── antigravity-master-prompt.md

├── backend/

│   ├── app/

│   │   ├── core/

│   │   │   ├── config.py             # Zod BaseSettings & Env Config

│   │   │   ├── database.py           # Async PostgreSQL data-access layer Engine & SessionLocal

│   │   │   ├── security.py           # Password Hashing, JWT encode/decode

│   │   │   └── middleware.py         # Tenant Isolation, Rate Limiting, Audit

│   │   ├── common/

│   │   │   ├── exceptions.py         # Standardized API Error Responses

│   │   │   ├── pagination.py         # Cursor and Offset Pagination Utilities

│   │   │   └── rbac.py               # Resource-Level Authorization Rules

│   │   ├── tenants/                  # Platform & Institution Management

│   │   ├── auth/                     # Authentication & Tokens

│   │   ├── users/                    # User Profiles & Global/Local Roles

│   │   ├── admissions/               # Inquiries, Applications, Verification

│   │   ├── students/                 # CENTRAL MASTER ENTITY Engine

│   │   ├── academics/                # Years, Depts, Courses, Classes, Sections, Subjects

│   │   ├── faculty/                  # Faculty Mappings, Workload & My Teaching

│   │   ├── attendance/               # Attendance Logs, Sessions, Corrections

│   │   ├── examinations/             # Exam Types, Schedules, Marks & Excel Import

│   │   ├── finance/                  # Fees, Invoices, Payments, Receipts, Audits

│   │   ├── documents/                # Vault, Templates, Bonafide, Verification

│   │   ├── hrms/                     # Staff Directory, Leaves, Attendance

│   │   ├── timetable/                # Schedules, Conflict Detection Engine

│   │   ├── ai_yantra/

│   │   │   ├── voice_agent/          # Campaigns, Voice Templates, Call Queues

│   │   │   ├── ai_attendance/        # Face Registration, Embeddings, Camera Stream

│   │   │   └── ai_tutor/             # LLM Chat, Practice Generator, Performance

│   │   ├── events/                   # [Optional] Events & Registrations

│   │   ├── transport/                # [Optional] Routes, Stops, Vehicles, Drivers

│   │   ├── hostel/                   # [Optional] Hostels, Rooms, Beds, Allocation

│   │   ├── library/                  # [Optional] Books, Copies, Issue/Return

│   │   ├── sports/                   # [Optional] Teams, Tournaments, Results

│   │   ├── inventory/                # [Optional] Assets, Vendors, Stock Ledger

│   │   ├── notifications/            # Push, SMS, Email, Voice Shared Service

│   │   ├── audit/                    # Immutable Platform Audit Log Service

│   │   └── main.py                   # Express.js Application Entrypoint

│   ├── alembic/                      # Database Migrations

│   ├── tests/                        # Vitest/Jest Test Suites (Unit + Integration)

│   ├── requirements.txt

│   └── Dockerfile

├── frontend/

│   ├── public/

│   │   └── favicon.ico

│   ├── src/

│   │   ├── api/                      # Typed TanStack Query API Client

│   │   ├── assets/                   # Brand Logos & Illustrations

│   │   ├── components/

│   │   │   ├── ui/                   # Buttons, Inputs, Dialogs, Sheets, Dropdowns

│   │   │   ├── forms/                # Adaptive Responsive Form Controls

│   │   │   ├── tables/               # Responsive Data Tables (reflow to cards)

│   │   │   ├── navigation/           # Desktop Sidebar, Topbar, Mobile Bottom Bar

│   │   │   └── feedback/             # Alerts, Skeletons, Empty States

│   │   ├── contexts/                 # AuthContext, TenantContext, NavigationContext

│   │   ├── hooks/                    # useTenant, usePermissions, useMediaQuery

│   │   ├── layouts/                  # AdminLayout, FacultyLayout, MobileLayout

│   │   ├── pages/

│   │   │   ├── superadmin/           # Super Admin Console

│   │   │   ├── admin/                # Institution Admin Console

│   │   │   ├── admissions/           # Admissions Kanban & Application Review

│   │   │   ├── academics/            # Academic Hierarchy & Subject Mapping

│   │   │   ├── faculty/              # Faculty Schedule, Attendance & Marks

│   │   │   ├── attendance/           # Roll-Call, Validation & Biometric Monitoring

│   │   │   ├── examinations/         # Schedules, Marks Entry & Excel Upload

│   │   │   ├── finance/              # Invoices, Payments & Ledger

│   │   │   ├── documents/            # Document Vault & Bonafide Generator

│   │   │   ├── timetable/            # Grid Scheduler & Conflict Inspector

│   │   │   ├── hrms/                 # Staff Directory & Leave Requests

│   │   │   ├── ai-yantra/            # Voice Agent, AI Attendance, AI Tutor

│   │   │   ├── optional/             # Events, Transport, Hostel, Library, Sports

│   │   │   └── student-parent/       # Student & Parent Mobile-Optimized Views

│   │   ├── types/                    # Shared TypeScript Domain Interfaces

│   │   ├── utils/                    # Formatters, Validation Helpers

│   │   ├── App.tsx                   # Role-Based Routing

│   │   └── index.css                 # Tailwind & Design Tokens

│   ├── package.json

│   ├── tsconfig.json

│   ├── vite.config.ts

│   └── tailwind.config.js

└── docker-compose.yml

```

---

## 4. Database Schema & Multi-Tenant Data Model

Every tenant-scoped table strictly inherits:

```sql

institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE

created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

```

### 4.1 Schema Definition across 16 Core Domains

```mermaid

erDiagram

    institutions ||--o{ users : "has"

    institutions ||--o{ students : "enrolls"

    institutions ||--o{ academic_years : "configures"

    institutions ||--o{ departments : "contains"

    institutions ||--o{ staff : "employs"

    academic_years ||--o{ classes : "schedules"

    departments ||--o{ courses : "offers"

    courses ||--o{ classes : "structures"

    classes ||--o{ sections : "divides into"

    sections ||--o{ students : "contains"

    students ||--o{ student_parents : "linked to"

    users ||--o{ student_parents : "parent user"

    students ||--o{ attendance_records : "tracks"

    students ||--o{ marks : "receives"

    students ||--o{ student_fees : "billed"

    students ||--o{ documents : "owns"

    students ||--o{ face_profiles : "biometrics"

```

#### Detailed Entity Specifications:

1. **Platform:**

   - `institutions`: `id` (PK, UUID), `name`, `code` (unique slug), `subdomain`, `contact_email`, `status` (Active, Suspended), `subscription_plan_id`, `enabled_optional_modules` (JSON array: `['hostel', 'library']`), `created_at`.

2. **Auth & Identity:**

   - `users`: `id`, `institution_id` (nullable for Super Admin), `email`, `password_hash`, `first_name`, `last_name`, `phone`, `avatar_url`, `status`, `is_super_admin`.

   - `roles`: `id`, `institution_id` (nullable for system roles), `role_name` (`SUPER_ADMIN`, `INSTITUTION_ADMIN`, `FACULTY`, `PARENT`, `STUDENT`, etc.), `description`.

   - `permissions`: `id`, `permission_code` (e.g. `attendance.create`, `marks.verify`, `finance.refund`), `module`.

   - `user_roles`: `user_id`, `role_id`, `institution_id`.

3. **Admissions:**

   - `admissions`: `id`, `institution_id`, `enquiry_number`, `applicant_name`, `grade_applying_for`, `parent_name`, `parent_phone`, `parent_email`, `status` (Enquiry, Applied, Reviewing, Approved, Rejected, Waitlisted).

   - `applications`: `id`, `admission_id`, `institution_id`, `submitted_data` (JSONB), `interview_date`, `notes`.

   - `admission_documents`: `id`, `application_id`, `institution_id`, `document_type`, `file_url`, `is_verified`.

4. **Students (Central Master Record):**

   - `students`: `id` (PK, UUID), `institution_id`, `admission_id` (FK), `student_id_number` (unique within tenant), `roll_number`, `first_name`, `last_name`, `gender`, `dob`, `blood_group`, `emergency_contact`, `current_class_id`, `current_section_id`, `academic_year_id`, `photo_url`, `status` (Active, Inactive, Graduated, Transferred).

   - `parents`: `id`, `user_id` (FK to users), `relationship` (Father, Mother, Guardian), `occupation`, `annual_income`.

   - `student_parents`: `student_id`, `parent_id`, `is_primary_contact`.

5. **Academics & Faculty:**

   - `academic_years`: `id`, `institution_id`, `year_code` (e.g. "2026-2027"), `start_date`, `end_date`, `is_current`.

   - `departments`: `id`, `institution_id`, `name`, `head_of_department_id`.

   - `courses`: `id`, `institution_id`, `department_id`, `name`, `code`.

   - `classes`: `id`, `institution_id`, `course_id`, `name` (e.g. "Class 10").

   - `sections`: `id`, `institution_id`, `class_id`, `name` (e.g. "Section A"), `room_id`.

   - `subjects`: `id`, `institution_id`, `class_id`, `name`, `code`, `is_elective`.

   - `faculty`: `id`, `user_id`, `institution_id`, `employee_code`, `qualification`, `designation`.

   - `faculty_classes`: `faculty_id`, `section_id`, `subject_id`, `institution_id` (Enforces scoped authorization).

6. **Attendance:**

   - `attendance_sessions`: `id`, `institution_id`, `session_date`, `section_id`, `subject_id`, `period_number`, `taken_by_faculty_id`, `source` (Manual, AI_Face, CCTV), `is_verified`.

   - `attendance_records`: `id`, `session_id`, `student_id`, `institution_id`, `status` (Present, Absent, Late, Excused), `marked_time`, `confidence_score` (if AI), `remarks`.

   - `attendance_corrections`: `id`, `record_id`, `institution_id`, `requested_by`, `old_status`, `new_status`, `reason`, `approved_by`, `status` (Pending, Approved).

7. **Examinations:**

   - `exam_types`: `id`, `institution_id`, `name` (e.g. "Midterm 1", "Final Exam"), `weightage_percentage`.

   - `exams`: `id`, `institution_id`, `academic_year_id`, `exam_type_id`, `start_date`, `end_date`, `status` (Draft, Scheduled, Ongoing, Grading, Published).

   - `exam_subjects`: `id`, `exam_id`, `subject_id`, `class_id`, `exam_date`, `start_time`, `end_time`, `max_marks`, `passing_marks`.

   - `marks`: `id`, `institution_id`, `exam_subject_id`, `student_id`, `marks_obtained`, `grade`, `is_absent`, `status` (Draft, Verified, Published), `verified_by`.

   - `report_cards`: `id`, `institution_id`, `student_id`, `exam_id`, `gpa`, `total_marks`, `rank`, `generated_pdf_url`.

8. **Finance & Fee Management:**

   - `fee_structures`: `id`, `institution_id`, `academic_year_id`, `class_id`, `name`, `total_amount`, `breakup` (JSONB: tuition, lab, sports, transport).

   - `student_fees`: `id`, `institution_id`, `student_id`, `fee_structure_id`, `discount_amount`, `net_payable`, `due_date`, `status` (Unpaid, Partially_Paid, Paid).

   - `invoices`: `id`, `institution_id`, `student_fee_id`, `invoice_number`, `issue_date`, `amount_due`, `status`.

   - `transactions`: `id`, `institution_id`, `invoice_id`, `student_id`, `amount`, `payment_method` (Online, Cash, Cheque, Transfer), `gateway_reference`, `status` (Success, Failed, Refunded), `paid_at`.

   - `receipts`: `id`, `institution_id`, `transaction_id`, `receipt_number`, `pdf_url`.

9. **Documents & HRMS:**

   - `documents`: `id`, `institution_id`, `entity_type` (Student, Staff, Institution), `entity_id`, `doc_type`, `title`, `file_url`, `file_size_bytes`, `mime_type`, `is_verified`.

   - `staff`: `id`, `user_id`, `institution_id`, `department_id`, `designation`, `date_of_joining`, `employment_type`.

   - `leave_requests`: `id`, `institution_id`, `staff_id`, `leave_type`, `start_date`, `end_date`, `reason`, `status` (Pending, Approved, Rejected).

10. **Timetable:**

    - `periods`: `id`, `institution_id`, `period_number`, `start_time`, `end_time`, `is_break`.

    - `timetables`: `id`, `institution_id`, `academic_year_id`, `section_id`, `day_of_week`, `period_id`, `subject_id`, `faculty_id`, `room_id`.

11. **AI Yantra:**

    - `ai_voice_campaigns`: `id`, `institution_id`, `name`, `purpose` (Fee Reminder, Attendance Alert, Exam Alert), `target_audience_filter` (JSONB), `script_template`, `scheduled_at`, `status`.

    - `ai_voice_calls`: `id`, `campaign_id`, `institution_id`, `recipient_phone`, `student_id`, `call_status` (Queued, Ringing, Completed, Failed), `duration_seconds`, `transcript`, `parent_response_intent`.

    - `face_profiles`: `id`, `institution_id`, `student_id`, `is_active`, `registered_at`.

    - `face_embeddings`: `id`, `face_profile_id`, `institution_id`, `embedding_vector` (encrypted or pgvector 512d), `confidence_threshold`.

    - `tutor_sessions`: `id`, `institution_id`, `student_id`, `subject_id`, `created_at`.

    - `tutor_messages`: `id`, `session_id`, `role` (User, Assistant, System), `content`, `cited_materials` (JSONB).

12. **Audit & Notifications:**

    - `audit_logs`: `id`, `institution_id`, `actor_user_id`, `actor_name`, `action`, `resource_type`, `resource_id`, `old_value` (JSONB), `new_value` (JSONB), `ip_address`, `timestamp`.

    - `notifications`: `id`, `institution_id`, `recipient_user_id`, `channel` (Push, SMS, Email, Voice), `title`, `body`, `status` (Queued, Sent, Failed), `sent_at`.

---

## 5. API Contracts & Endpoint Specification

All endpoints are versioned under `/api/v1` and strictly enforce tenant isolation and RBAC.

### 5.1 Route Inventory (Section 26 Mapping)

- `/api/v1/auth`: `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`

- `/api/v1/institutions`: `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `POST /{id}/toggle-module`

- `/api/v1/users`: `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`

- `/api/v1/admissions`: `GET /enquiries`, `POST /enquiries`, `GET /applications`, `POST /applications/{id}/approve`

- `/api/v1/students`: `GET /`, `GET /{id}`, `PATCH /{id}`, `GET /{id}/academic-history`, `GET /{id}/fee-ledger`

- `/api/v1/academics`: `GET /hierarchy`, `POST /classes`, `POST /sections`, `POST /subjects`

- `/api/v1/faculty`: `GET /my-classes`, `GET /my-schedule`, `POST /assignments`

- `/api/v1/attendance`: `GET /sessions`, `POST /sessions`, `POST /mark-bulk`, `POST /corrections`

- `/api/v1/examinations`: `GET /schedules`, `POST /marks/entry`, `POST /marks/excel-upload`, `POST /marks/commit`

- `/api/v1/finance`: `GET /structures`, `POST /invoices/generate`, `POST /payments/checkout`, `GET /receipts/{id}`

- `/api/v1/documents`: `GET /`, `POST /upload`, `GET /{id}/download`, `POST /bonafide/generate`

- `/api/v1/hrms`: `GET /staff`, `GET /leaves`, `POST /leaves/apply`, `POST /leaves/{id}/action`

- `/api/v1/timetable`: `GET /matrix`, `POST /slots`, `POST /validate-conflicts`

- `/api/v1/events`: `GET /`, `POST /`, `POST /{id}/register`

- `/api/v1/transport`: `GET /routes`, `POST /allocations`

- `/api/v1/hostel`: `GET /rooms`, `POST /allocations`

- `/api/v1/library`: `GET /catalog`, `POST /issue`, `POST /return`

- `/api/v1/sports`: `GET /teams`, `POST /fixtures`

- `/api/v1/inventory`: `GET /items`, `POST /stock-adjust`

- `/api/v1/yantra/voice`: `GET /campaigns`, `POST /campaigns/create`, `POST /dispatch`

- `/api/v1/yantra/attendance`: `POST /register-face`, `POST /recognize-frame`, `GET /unverified`

- `/api/v1/yantra/tutor`: `POST /ask`, `POST /generate-practice`, `GET /analytics/{student_id}`

### 5.2 Sample Request & Response Schemas

#### Admission Approval $\to$ Student Creation Pipeline

`POST /api/v1/admissions/applications/{id}/approve`

```json

// Request Body

{

  "class_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",

  "section_id": "a24fa60b-8534-4b5c-b171-8bc762b1bdf3",

  "roll_number": "10-A-042",

  "academic_year_id": "e838d21b-6893-4a8b-9e2c-3592e3a1f112",

  "assign_fee_structure_id": "c1f1074a-2f47-49d7-8ef6-150dc76bf33b",

  "parent_email": "john.parent@example.com",

  "parent_phone": "+919876543210"

}

// Response (201 Created)

{

  "status": "success",

  "data": {

    "student_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",

    "student_id_number": "VID-2026-0042",

    "roll_number": "10-A-042",

    "parent_user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",

    "assigned_invoice_id": "d3b07384-d113-46c4-8703-a4e98f0e08f2",

    "message": "Student master record created, parent user registered, and tuition fee invoiced successfully."

  }

}

```

#### Timetable Conflict Detection

`POST /api/v1/timetable/validate-conflicts`

```json

// Request Body

{

  "academic_year_id": "e838d21b-6893-4a8b-9e2c-3592e3a1f112",

  "day_of_week": "MONDAY",

  "period_id": "p3",

  "faculty_id": "fac-008",

  "room_id": "room-204",

  "section_id": "sec-10a",

  "subject_id": "sub-math"

}

// Response (409 Conflict if overlap detected, or 200 OK)

{

  "has_conflicts": true,

  "conflicts": [

    {

      "type": "TEACHER_DOUBLE_BOOKED",

      "message": "Faculty Dr. Sharma is already scheduled for Section 9-B during Period 3 on Monday."

    }

  ]

}

```

---

## 6. Authentication, Security & Tenant Isolation

1. **Multi-Tenant Scoping:**

   - Every request is intercepted by `TenantMiddleware`.

   - The user's JWT contains `sub` (User ID), `inst` (Institution ID), and `roles`.

   - All PostgreSQL data-access layer database queries are automatically wrapped with `.filter(Model.institution_id == request.state.institution_id)` unless the user is a verified Super Admin accessing platform-level entities.

2. **Resource-Level Authorization Rule:**

   - A generic check of `has_permission("attendance.write")` is insufficient. The security layer evaluates:

     $$\text{Access} = f(\text{User}, \text{Role}, \text{Tenant}, \text{Permission}, \text{Resource}, \text{Action})$$

   - E.g., Faculty can only create attendance if `section_id` matches an active entry in `faculty_classes`.

3. **Signed URLs for Object Storage:**

   - No direct public read access to student documents or photos. The backend generates AWS S3 pre-signed URLs valid for 15 minutes.

4. **Audit Immutability:**

   - The `audit_logs` table has database-level `NO UPDATE` and `NO DELETE` triggers ensuring non-repudiation.

---

## 7. Responsive UI Specification & Breakpoints

Following Sections 22 & 23 of the specification:

| Viewport Category | Width Range | Layout Structure | Navigation Paradigm | Table & Component Behavior |

| :--- | :--- | :--- | :--- | :--- |

| **Small Mobile** | 320px – 374px | 1-Column vertical stack | Compact Topbar + Bottom Navigation Bar | Tables collapse to vertical cards; sticky actions. |

| **Mobile** | 375px – 414px | 1-Column reflow | Topbar (Brand, Notifications) + Mobile Drawer | 1-column forms; cards stacked. |

| **Tablet** | 768px – 1023px | Adaptive 1–2 Column | Collapsible icon sidebar with drawer overlay | 2-column forms; responsive reflowing cards. |

| **Desktop** | 1024px – 1279px | 2–3 Column Grid | Persistent left sidebar + topbar | Full data tables with horizontal container scroll. |

| **Large Desktop** | 1280px – 1440px+ | 3–4 Column Grid | Expanded left sidebar with workspace groupings | 4-card metric grid $\to$ 2 analytic charts. |

---

## 8. Third-Party Integrations & Environment Variables

### Required Environment Variables (`.env`)

```bash

# Platform & Server

PORT=8000

ENVIRONMENT=development

SECRET_KEY=change-in-production-super-secret-key-32-chars-min

JWT_ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30

REFRESH_TOKEN_EXPIRE_DAYS=7

# Multi-Tenant PostgreSQL Database

DATABASE_URL=postgresql+asyncpg://vid_user:vid_password@localhost:5432/vid_platform

TEST_DATABASE_URL=postgresql+asyncpg://vid_user:vid_password@localhost:5432/vid_platform_test

# Cache & Message Broker / Job Queue

REDIS_URL=redis://localhost:6379/0

# Object Storage

S3_ENDPOINT_URL=http://localhost:9000

S3_BUCKET_NAME=vid-platform-assets

S3_ACCESS_KEY=minioadmin

S3_SECRET_KEY=minioadmin

S3_REGION=us-east-1

# AI Yantra Intelligence

OPENAI_API_KEY=mock_or_real_key

AI_VOICE_GATEWAY_URL=https://api.telephony.mock.vid.internal

FACE_RECOGNITION_CONFIDENCE_THRESHOLD=0.85

# External Integrations

PAYMENT_GATEWAY_KEY=pk_test_vid_payments

SMS_GATEWAY_API_KEY=mock_sms_gateway_key

```

---

*End of TECH_SPEC.md*