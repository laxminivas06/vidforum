# Development Tasks Breakdown: VID Platform

**Project:** VID (Virtual Identification) Educational Management Ecosystem  
**Tracking Mode:** Sequential Dependency-Ordered Checklist  
**Status Key:**  
- `[ ]` Pending  
- `[/]` In Progress  
- `[x]` Completed & Verified  

---

## Phase 0: Project Initiation & Architecture Baseline
- [x] **TASK-001**: Review reference specifications (`VID Platform.pdf` & `antigravity-master-prompt.md`).
- [x] **TASK-002**: Author `/docs/PRD.md` covering all 30 non-negotiable rules, 10 user personas, and modular classification.
- [x] **TASK-003**: Author `/docs/TECH_SPEC.md` specifying FastAPI backend, React/TypeScript/Tailwind frontend, 16 PostgreSQL domains, and RBAC architecture.
- [x] **TASK-004**: Author `/docs/TASKS.md` with complete dependency tracking.
- [x] **TASK-005**: Author `/docs/DECISIONS.md` audit trail recording architectural choices.
- [ ] **TASK-006**: **MILESTONE REVIEW CHECKPOINT 1** — Pause and present Phase 0 documentation deliverables to user for approval before writing implementation code.

---

## Phase 1: Foundation Scaffold & MVP Core (Phase 1 Target)

### 1.1 Project Scaffolding & Infrastructure
- [ ] **TASK-007**: Initialize Monorepo directory structure (`backend/`, `frontend/`, `docker-compose.yml`, root scripts).
- [ ] **TASK-008**: Scaffold FastAPI backend with async SQLAlchemy 2.0 engine, Alembic migrations, and CORS/Security middleware.
- [ ] **TASK-009**: Scaffold Vite + React 18 + TypeScript + Tailwind CSS frontend with routing skeleton and TanStack Query client.
- [ ] **TASK-010**: Implement design tokens and theme system (Inter typography, rich dark/light surface tokens, glassmorphism, responsive utilities).
- [ ] **TASK-011**: Verify running skeleton in-browser (FastAPI `/docs` + React root shell).

### 1.2 Auth, Multi-Tenancy & RBAC Engine
- [ ] **TASK-012**: Implement multi-tenant schema models (`institutions`, `users`, `roles`, `permissions`, `user_roles`).
- [ ] **TASK-013**: Implement `TenantMiddleware` enforcing `institution_id` on all tenant-owned database queries.
- [ ] **TASK-014**: Build JWT authentication service (`/api/v1/auth/login`, `/refresh`, `/me`) with refresh token rotation.
- [ ] **TASK-015**: Build resource-level authorization engine (`user + role + institution + permission + resource + action`).
- [ ] **TASK-016**: Create frontend `AuthContext`, `TenantContext`, and role-based route guards.

### 1.3 Super Admin & Institution Admin Consoles
- [ ] **TASK-017**: Build Super Admin API endpoints (`/api/v1/institutions`, status toggle, plan tiers, audit logs).
- [ ] **TASK-018**: Build Super Admin Web UI (Tenant directory, onboarding wizard, subscription switch, health status cards).
- [ ] **TASK-019**: Build Institution Admin API endpoints (Profile, optional module toggles, academic settings, staff directory).
- [ ] **TASK-020**: Build Institution Admin Web UI (Tenant settings, dynamic module activation panel, role assigner).

### 1.4 Academics Hierarchy & Faculty Mapping
- [ ] **TASK-021**: Implement database models for academic structure (`academic_years`, `departments`, `courses`, `classes`, `sections`, `subjects`).
- [ ] **TASK-022**: Implement Academics API endpoints (`/api/v1/academics/hierarchy`, classes/sections/subjects CRUD).
- [ ] **TASK-023**: Build Academics Workspace Web UI (Interactive hierarchy visualizer, curriculum/syllabus upload, subject assignment table).
- [ ] **TASK-024**: Implement Faculty mapping engine (`faculty_classes`, subject specialization, workload counter).
- [ ] **TASK-025**: Build Faculty Workspace Web UI (My Classes, My Students, assigned subject roster, lecture schedule).

### 1.5 Admissions Workspace & Central Student Master Entity
- [ ] **TASK-026**: Implement Admissions database models (`admissions`, `applications`, `admission_documents`).
- [ ] **TASK-027**: Implement central `students`, `parents`, and `student_parents` master records.
- [ ] **TASK-028**: Build Admissions API endpoints (Enquiry management, kanban application statuses, document verification).
- [ ] **TASK-029**: Build the Approval Transition Pipeline (`/api/v1/admissions/applications/{id}/approve` $\to$ atomic creation of Student Master, Parent user, ID/Roll assignment, and initial tuition invoice).
- [ ] **TASK-030**: Build Admissions Workspace Web UI (Enquiries table, Kanban application board, document previewer, 1-click student enrollment modal).
- [ ] **TASK-031**: Build Student Master Profile View (Aggregated 360° student card: personal, parents, academic records, documents, fee summary).
- [ ] **TASK-032**: **MILESTONE REVIEW CHECKPOINT 2** — Phase 1 MVP Core smoke test and user check-in.

---

## Phase 2: Core Operational Workspaces

### 2.1 Attendance Workspace
- [ ] **TASK-033**: Implement Attendance schema (`attendance_sessions`, `attendance_records`, `attendance_corrections`).
- [ ] **TASK-034**: Build Attendance API endpoints (Session creation, bulk roll-call entry, correction approval workflow).
- [ ] **TASK-035**: Build Attendance Web UI (Interactive roll-call sheet, daily absentee tracker, correction request modal, calendar heatmap).

### 2.2 Examinations Workspace & Excel Import Engine
- [ ] **TASK-036**: Implement Examinations schema (`exam_types`, `exams`, `exam_subjects`, `marks`, `grades`, `report_cards`).
- [ ] **TASK-037**: Build Examinations API endpoints (Exam scheduler, marks entry, report card generation).
- [ ] **TASK-038**: Build robust Excel Import Engine (Upload $\to$ file validation $\to$ column validation $\to$ student matching $\to$ marks bounds check $\to$ preview modal $\to$ admin confirmation $\to$ atomic commit).
- [ ] **TASK-039**: Build Examinations Web UI (Exam schedule calendar, marks spreadsheet grid, Excel drag-and-drop previewer, printable report cards).

### 2.3 Finance & Fee Management Workspace
- [ ] **TASK-040**: Implement Finance schema (`fee_structures`, `student_fees`, `invoices`, `transactions`, `receipts`, `discounts`).
- [ ] **TASK-041**: Build Finance API endpoints (Fee structure builder, invoice dispatch, mock payment checkout, receipt generator).
- [ ] **TASK-042**: Build Finance Web UI (Fee breakdown builder, student ledger, pending dues table, payment modal with instant PDF receipt).

### 2.4 Documents & Timetable & HRMS
- [ ] **TASK-043**: Implement Documents Workspace (Private file upload, Bonafide certificate generator with QR verification).
- [ ] **TASK-044**: Implement Timetable Workspace with real-time conflict detector (Teacher double-booking, room clash, period overlaps).
- [ ] **TASK-045**: Implement Staff / HRMS Workspace (Staff directory, leave application & approval pipeline, faculty workload charts).
- [ ] **TASK-046**: **MILESTONE REVIEW CHECKPOINT 3** — Phase 2 Operational Workspaces review.

---

## Phase 3: AI Yantra Intelligence Layer

### 3.1 Yantra Voice Agent
- [ ] **TASK-047**: Implement Voice Agent schema (`ai_voice_campaigns`, `ai_voice_calls`).
- [ ] **TASK-048**: Build Voice Campaign API (Audience targeting filter, script template builder, simulated telephony dispatch).
- [ ] **TASK-049**: Build Voice Agent Web UI (Campaign manager, call queue, interactive audio playback dialog simulator).

### 3.2 Yantra AI Attendance
- [ ] **TASK-050**: Implement Biometric schema (`face_profiles`, `face_embeddings`, `ai_attendance_events`).
- [ ] **TASK-051**: Build Face Recognition API pipeline (OpenCV face detection, embedding generation, confidence score thresholding).
- [ ] **TASK-052**: Build AI Attendance Web UI (Camera stream interface, live face bounding box simulator, human verification queue).

### 3.3 Yantra AI Tutor
- [ ] **TASK-053**: Implement AI Tutor schema (`tutor_sessions`, `tutor_messages`, `learning_profiles`).
- [ ] **TASK-054**: Build Context-Bounded AI Tutor API (Student academic context injection, doubt resolution, automated practice questions).
- [ ] **TASK-055**: Build AI Tutor Web UI (Interactive conversational chat, LaTeX/math renderer, mock test generator, weak topic radar).
- [ ] **TASK-056**: **MILESTONE REVIEW CHECKPOINT 4** — AI Yantra review.

---

## Phase 4: Optional Workspaces & Mobile Parent/Student Experience

### 4.1 Modular Optional Workspaces
- [ ] **TASK-057**: Implement Events Workspace (Event calendar, registration, participant badges).
- [ ] **TASK-058**: Implement Transport Workspace (Bus routes, stops, vehicle tracking, student transport allocation).
- [ ] **TASK-059**: Implement Hostel Workspace (Hostel buildings, rooms, bed matrix, student allocation).
- [ ] **TASK-060**: Implement Library Workspace (Book catalog, ISBN lookup, issue/return tracker, fine calculator).
- [ ] **TASK-061**: Implement Sports Workspace (Teams, coach assignments, tournament schedule, trophy tally).
- [ ] **TASK-062**: Implement Inventory & Assets Workspace (Stock ledger, purchase orders, asset depreciation).
- [ ] **TASK-063**: Verify dynamic navigation removal when optional modules are disabled in Institution Admin settings.

### 4.2 Dedicated Parent & Student Experience
- [ ] **TASK-064**: Build Student Mobile Portal (Bottom nav: Home, Academics, Attendance, Fees, AI Tutor).
- [ ] **TASK-065**: Build Parent Mobile Portal with multi-child switcher (Child 1 / Child 2 / Child 3 tabs, fee payments, attendance feed).

---

## Phase 5: Testing, Auditing, Verification & Deployment
- [ ] **TASK-066**: Automated unit tests for RBAC, Tenant isolation, and conflict detection.
- [ ] **TASK-067**: Visual and responsive layout tests (320px, 375px, 768px, 1024px, 1440px).
- [ ] **TASK-068**: Platform audit log verification for all critical mutations.
- [ ] **TASK-069**: Author comprehensive `README.md` with docker-compose setup and seed data instructions.
- [ ] **TASK-070**: Final acceptance review against the 30 Non-Negotiable Rules and Definition of Done.

---
*End of TASKS.md*
