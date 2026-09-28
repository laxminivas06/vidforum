# Graph Report - VID_School  (2026-09-28)

## Corpus Check
- 183 files · ~85,444 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 1213 nodes · 2904 edges · 88 communities (76 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 24,000 input · 9,000 output

## Community Hubs (Navigation)
- Frontend App Routes & UI Workspaces
- Database Architecture & RBAC Normalization
- Backend Node.js Dependencies
- PostgreSQL Schema & Event System
- VID Database Migrations & RLS Functions
- Frontend Next.js & UI Dependencies
- Academic Entities & Institutional Domains
- Multi-Tenant Middleware & API Routing
- Authentication Pages & Root Layout
- Express Server Core & Database Pooling
- Academic Controllers & Business Logic
- VID Design System & Theme Tokens
- Backend Architecture & Technical Specs
- SDLC Roadmap & Implementation Tasks
- Product Vision & PRD Specifications
- admissiondocuments / applications
- aiattendanceevents / cameradevices
- academicyears / admissions
- 1 Prerequisites / 2 Environment Variables
- academicyears / admissions
- admissiondocuments / aivoicecalls
- 1 Overview  Navigation Architecture / 21 Auth
- 0 ROLE  OPERATING MODE / 1 PROJECT BRIEF
- tsconfigjson / compilerOptions
- feecategories / feegroups
- admissionscontrollerts / admissionsrepository
- courses / departments
- academicscontrollerts / academicsrepositoryts
- feecategories / feestructureitems
- Academics  Curriculum / Admissions  Enrollmen
- institutionrepositoryts / institutionReposito
- tsconfigjson / compilerOptions
- ADR001 Strict Separation of Phase Deliverable
- 11 Architecture  Stack Contract / 12 Core Dev
- examresultsummary / examroomallocations
- facultycontrollerts / facultyController
- aiattendanceevents / attendancecorrections
- classsubjects / curriculum
- financecontrollerts / financerepositoryts
- studentcontrollerts / studentrepositoryts
- classsubjects / curriculum
- packagejson / name
- 1 Memory Phase Start of Session  PreEdit / 2 
- attendancecorrections / attendancerecords
- aivoicecalls / aivoicecampaigns
- admissions / patchtriggerssql
- 1 Operating Mode  Standards / 2 Active Plugin
- publichaspermission / publicmyinstitutionids
- authhaspermission / authmyinstitutionids
- Skill brookslint / Brooks Lint Skill
- Skill honchomemory / Honcho Memory Skill
- Key Actions / Skill localmemory
- Skill agentguard / Agent Guard Skill
- Skill ainativesdlc / AINative SDLC Skill
- Skill axonflow / AxonFlow Skill
- Checklist / Skill codexreviewer
- Skill commitnarrator / Commit Narrator Skill
- Skill debtops / DebtOps Skill
- Skill docflow / Docflow Skill
- Skill espresso / Espresso Skill
- Skill falsegreen / Falsegreen Skill
- Skill flakydetector / Flaky Detector Skill
- Audit Checks / Skill holguard
- Skill knowl / Knowl Project Memory Skill
- Skill megalinter / MegaLinter Skill
- Execution Guide / Skill memesh
- Skill metabrain / Metabrain Skill
- Skill prstoryteller / PR Storyteller Skill
- Review Lenses / Skill riverreview
- Scan Targets / Skill secretguard
- Lifecycle Stages / Skill specdriven
- Procedure / Skill tailtest
- Checks / Skill testgap
- Best Practices / Skill tokenoptimizer
- Guidelines / Skill unforgit
- PreEdit Verification Checklist / Skill wingma
- publicisassignedfaculty / publicfacultyassign
- publicisguardianof / publicguardians
- authisassignedfaculty / publicfacultyassignme
- authisguardianof / publicguardians
- nextconfigjs / nextConfig
- Core Workflows / Skill devskills
- Document Graphify / Workflow graphify
- Document Graphify
- Document Data

## God Nodes (most connected - your core abstractions)
1. `institutions` - 74 edges
2. `institutions` - 74 edges
3. `Button` - 64 edges
4. `AppShell()` - 62 edges
5. `Badge()` - 57 edges
6. `react` - 47 edges
7. `Document: Vid Database Architecture` - 47 edges
8. `Card` - 43 edges
9. `lucide-react` - 40 edges
10. `CardHeader` - 39 edges

## Surprising Connections (you probably didn't know these)
- `requireRole()` --calls--> `sendError()`  [EXTRACTED]
  backend/src/middleware/rbac.middleware.ts → backend/src/utils/api-response.ts
- `requirePermission()` --calls--> `sendError()`  [EXTRACTED]
  backend/src/middleware/rbac.middleware.ts → backend/src/utils/api-response.ts
- `tenantMiddleware()` --calls--> `sendError()`  [EXTRACTED]
  backend/src/middleware/tenant.middleware.ts → backend/src/utils/api-response.ts
- `LoginPage()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/app/(auth)/login/page.tsx → frontend/contexts/AuthContext.tsx
- `DashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/app/dashboard/page.tsx → frontend/contexts/AuthContext.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Multi-Tenant Data Isolation Flow** — readme_complete_specifications_documentatio, reference_docs_antigravity_master_prompt_docs_techspec_md, reference_docs_antigravity_master_prompt_3_development_rules_apply_throughout, reference_docs_antigravity_master_prompt_backend_architecture_rules, reference_docs_antigravity_master_prompt_multi_tenant_security [INFERRED 0.95]
- **Single Student Master Record Architecture** — docs_appflow_2_7_central_student_master_profile_stu, docs_appflow_2_8_mobile_parent_student_portal_mo, docs_appflow_3_4_student_master_profile_shell, docs_decisions_adr_003_central_student_master_record_vs, docs_memory_persistent_agent_memory_plugin_ecosyst [INFERRED 0.95]

## Communities (88 total, 12 thin omitted)

### Community 0 - "Frontend App Routes & UI Workspaces"
Cohesion: 0.06
Nodes (143): AcademicsHierarchyPage(), AdmissionsPage(), STAGES, AIAttendanceMonitoringPage(), CAMERA_DECKS, AIConfigPage(), AITutorAnalyticsPage(), AttendanceSessionsPage() (+135 more)

### Community 1 - "Database Architecture & RBAC Normalization"
Cohesion: 0.04
Nodes (48): 10. RBAC / Permissions, 11. Academic Data Model, 12. Workspace/Data Ownership Model, 13. Normalization Analysis, 14. Primary Key Strategy, 15. Constraints, 16. Delete/Update Strategy, 17. Audit Strategy (+40 more)

### Community 2 - "Backend Node.js Dependencies"
Cohesion: 0.04
Nodes (46): dependencies, bcryptjs, cors, dotenv, express, helmet, jsonwebtoken, morgan (+38 more)

### Community 3 - "PostgreSQL Schema & Event System"
Cohesion: 0.07
Nodes (39): event_attendance, event_certificates, event_participants, event_registrations, events, grade_scales, grades, hostel_beds (+31 more)

### Community 4 - "VID Database Migrations & RLS Functions"
Cohesion: 0.07
Nodes (37): audit_logs, grade_scales, grades, hostel_beds, hostel_rooms, hostels, idx_audit_logs_resource, inventory_allocations (+29 more)

### Community 5 - "Frontend Next.js & UI Dependencies"
Cohesion: 0.05
Nodes (36): dependencies, clsx, lucide-react, next, react, react-dom, tailwind-merge, @tanstack/react-query (+28 more)

### Community 6 - "Academic Entities & Institutional Domains"
Cohesion: 0.11
Nodes (30): camera_devices, courses, departments, designations, discounts, idx_staff_employee_code_trgm, idx_tenant_staff, institutions (+22 more)

### Community 7 - "Multi-Tenant Middleware & API Routing"
Cohesion: 0.22
Nodes (15): db, tenantMiddleware(), router, router, router, router, router, router (+7 more)

### Community 8 - "Authentication Pages & Root Layout"
Cohesion: 0.11
Nodes (23): LoginPage(), frontend_app_globals, metadata, RootLayout(), RootPage(), frontend_components_ui_index_permissiondenied, SidebarProps, PermissionDenied() (+15 more)

### Community 9 - "Express Server Core & Database Pooling"
Cohesion: 0.14
Nodes (16): app, pool, env, AuthenticatedUser, authMiddleware(), Express, Request, errorMiddleware() (+8 more)

### Community 10 - "Academic Controllers & Business Logic"
Cohesion: 0.12
Nodes (7): academicsController, admissionsController, financeController, institutionController, router, studentController, sendSuccess()

### Community 11 - "VID Design System & Theme Tokens"
Cohesion: 0.08
Nodes (26): 10. Accessibility Baseline, 11. What This Design System Deliberately Avoids, 1. Design Philosophy, 2.1 Core Palette, 2.2 Accent & Status Colors, 2.3 Dark Elements (used, not a dark mode), 2. Color System, 3. Typography (+18 more)

### Community 12 - "Backend Architecture & Technical Specs"
Cohesion: 0.08
Nodes (24): 1.1 Backend Architecture — Layered MVC, 1. Technical Stack Selection & Justification, 2. High-Level Architecture Diagram, 3. Repository & Folder Structure, 4.1 Schema Definition across 16 Core Domains, 4. Database Schema & Multi-Tenant Data Model, 5.1 Route Inventory (Section 26 Mapping), 5.2 Sample Request & Response Schemas (+16 more)

### Community 13 - "SDLC Roadmap & Implementation Tasks"
Cohesion: 0.09
Nodes (23): 1.1 Project Scaffolding & Infrastructure, 1.2 Auth, Multi-Tenancy & RBAC Engine, 1.3 Super Admin & Institution Admin Consoles, 1.4 Academics Hierarchy & Faculty Mapping, 1.5 Admissions Workspace & Central Student Master Entity, 2.1 Attendance Workspace, 2.2 Examinations Workspace & Excel Import Engine, 2.3 Finance & Fee Management Workspace (+15 more)

### Community 14 - "Product Vision & PRD Specifications"
Cohesion: 0.09
Nodes (22): 1.1 Problem Statement, 1.2 Core Principle & Philosophy, 1. Executive Summary & Product Vision, 2. Target Users & Personas, 3.1 Workspace Classification Matrix, 3.2 The Student Master Entity, 3.3 The 30 Non-Negotiable Rules, 3. Product Scope & Modular Architecture (+14 more)

### Community 15 - "admissiondocuments / applications"
Cohesion: 0.13
Nodes (22): admission_documents, applications, document_requests, document_templates, document_types, document_verifications, documents, enquiries (+14 more)

### Community 16 - "aiattendanceevents / cameradevices"
Cohesion: 0.14
Nodes (22): ai_attendance_events, camera_devices, face_embeddings, face_profiles, fee_groups, fee_structures, idx_notifications_recipient, institutions (+14 more)

### Community 17 - "academicyears / admissions"
Cohesion: 0.17
Nodes (21): academic_years, admissions, classes, discounts, enforce_tenant_consistency(), hostel_allocations, hostel_attendance, idx_student_academic_history_student (+13 more)

### Community 18 - "1 Prerequisites / 2 Environment Variables"
Cohesion: 0.10
Nodes (21): 1. Prerequisites, 2. Environment Variables, 3. Running the Development Servers, 4. Running in Production, 📡 API Reference Snapshot (/api/v1/), 🏛 Architecture & Tech Stack, Build and Start Backend, Build and Start Frontend (+13 more)

### Community 19 - "academicyears / admissions"
Cohesion: 0.19
Nodes (20): academic_years, admissions, applications, classes, enforce_tenant_consistency(), enquiries, hostel_allocations, hostel_attendance (+12 more)

### Community 20 - "admissiondocuments / aivoicecalls"
Cohesion: 0.12
Nodes (19): admission_documents, ai_voice_calls, ai_voice_campaigns, ai_voice_recipients, ai_voice_templates, audit_logs, document_requests, document_templates (+11 more)

### Community 21 - "1 Overview  Navigation Architecture / 21 Auth"
Cohesion: 0.11
Nodes (19): 1. Overview & Navigation Architecture, 2.1 Authentication, 2.2 Super Admin Console (/(super-admin)), 2.3 Institution Admin Workspace (/(institution-admin)), 2.4 Core Workspaces (/(core)), 2.5 AI Yantra Services (/(ai-yantra)), 2.6 Optional Modular Workspaces (/(optional)), 2.7 Central Student Master Profile (/students/id) (+11 more)

### Community 22 - "0 ROLE  OPERATING MODE / 1 PROJECT BRIEF"
Cohesion: 0.11
Nodes (19): 0. ROLE & OPERATING MODE, 1. PROJECT BRIEF, 2. REQUIRED DELIVERABLES — CREATE THESE FILES FIRST, 3. DEVELOPMENT RULES (apply throughout, no exceptions), 4. TECH STACK CONSTRAINTS, 5. WORKING AGREEMENT / CHECK-IN CADENCE, 6. AGENT MEMORY USAGE, 7. DEFINITION OF DONE (v1) (+11 more)

### Community 23 - "tsconfigjson / compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 24 - "feecategories / feegroups"
Cohesion: 0.15
Nodes (17): fee_categories, fee_groups, fee_structure_items, fee_structures, idx_invoices_pending, idx_payments_student_recent, idx_tenant_invoices, idx_tenant_payments (+9 more)

### Community 25 - "admissionscontrollerts / admissionsrepository"
Cohesion: 0.13
Nodes (5): admissionsRepository, ApplicantRow, admissionsService, STAGE_MAP_TO_DB, STAGE_MAP_TO_UI

### Community 26 - "courses / departments"
Cohesion: 0.15
Nodes (17): courses, departments, designations, event_attendance, event_certificates, event_participants, event_registrations, events (+9 more)

### Community 28 - "feecategories / feestructureitems"
Cohesion: 0.16
Nodes (15): fee_categories, fee_structure_items, idx_invoices_pending, idx_payments_student_recent, idx_tenant_invoices, idx_tenant_payments, invoice_items, invoices (+7 more)

### Community 29 - "Academics  Curriculum / Admissions  Enrollmen"
Cohesion: 0.14
Nodes (14): Academics & Curriculum, Admissions & Enrollment, Alumni Management, Attendance Management, Communication & Notifications, Examination & Grading, Fee & Financial Management, Hostel Management (+6 more)

### Community 31 - "tsconfigjson / compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule, rootDir (+4 more)

### Community 32 - "ADR001 Strict Separation of Phase Deliverable"
Cohesion: 0.15
Nodes (13): ADR-001 Strict Separation of Phase Deliverables, ADR-002 Multi-Tenancy via Shared Database with Institution-ID & RLS, ADR-003 Central Student Master Record vs Workspace, ADR-004 Two-Tier RBAC with Resource-Level Context Verification, ADR-005 Full-Stack Monorepo Structure (backend/ + frontend/), ADR-006 Pre-Commit Validation Pipeline for Excel Exam Imports, ADR-007 Strict 3-Workspace Boundary for AI Yantra, ADR-008 Node.js 22 + TypeScript + Express Layered MVC Architecture (+5 more)

### Community 33 - "11 Architecture  Stack Contract / 12 Core Dev"
Cohesion: 0.15
Nodes (13): 1.1 Architecture & Stack Contract, 1.2 Core Development Directives, 1. Project Context & Durable Conclusions (Honcho / Wingman / Knowl), 2. Installed Plugin Suite (28 Plugins Matrix), 3. Workflow Activation Guide, 4. Frontend Implementation & Stitch Conversion State (2026-09-25), 5.1 Cloud Database Infrastructure (Supabase PostgreSQL), 5.2 Backend Layered MVC Engine (Node.js 22 + Express + TypeScript) (+5 more)

### Community 34 - "examresultsummary / examroomallocations"
Cohesion: 0.21
Nodes (12): exam_result_summary, exam_room_allocations, exam_rooms, exam_schedules, exam_subjects, exam_types, exams, idx_tenant_marks (+4 more)

### Community 35 - "facultycontrollerts / facultyController"
Cohesion: 0.20
Nodes (3): facultyController, facultyRepository, facultyService

### Community 36 - "aiattendanceevents / attendancecorrections"
Cohesion: 0.22
Nodes (11): ai_attendance_events, attendance_corrections, attendance_records, attendance_sessions, attendance_verification_queue, face_embeddings, face_profiles, idx_attendance_records_pending (+3 more)

### Community 37 - "classsubjects / curriculum"
Cohesion: 0.18
Nodes (11): class_subjects, curriculum, faculty_assignments, faculty_workload, idx_faculty_assignments_staff, practice_questions, subjects, syllabus (+3 more)

### Community 40 - "classsubjects / curriculum"
Cohesion: 0.18
Nodes (11): class_subjects, curriculum, faculty_assignments, faculty_workload, idx_faculty_assignments_staff, practice_questions, subjects, syllabus (+3 more)

### Community 41 - "packagejson / name"
Cohesion: 0.22
Nodes (8): name, private, scripts, build:backend, build:frontend, dev:backend, dev:frontend, version

### Community 42 - "1 Memory Phase Start of Session  PreEdit / 2 "
Cohesion: 0.25
Nodes (8): 1. Memory Phase (Start of Session & Pre-Edit), 2. Planning & SDLC Phase, 3. Implementation & Testing Phase, 4. Code Quality & Review Phase, 5. Security & Git Phase, 6. Token & Output Optimization, Plugin Orchestration Rules, Document: Plugin Orchestrator

### Community 43 - "attendancecorrections / attendancerecords"
Cohesion: 0.29
Nodes (8): attendance_corrections, attendance_records, attendance_sessions, attendance_verification_queue, idx_attendance_records_pending, idx_attendance_records_student_session, idx_tenant_attendance_records, student_attendance_summary

### Community 44 - "aivoicecalls / aivoicecampaigns"
Cohesion: 0.33
Nodes (6): ai_voice_calls, ai_voice_campaigns, ai_voice_recipients, ai_voice_templates, guardians, student_guardians

### Community 45 - "admissions / patchtriggerssql"
Cohesion: 0.40
Nodes (3): admissions, enforce_tenant_consistency(), classes

### Community 46 - "1 Operating Mode  Standards / 2 Active Plugin"
Cohesion: 0.40
Nodes (5): 1. Operating Mode & Standards, 2. Active Plugin Ecosystem & Memory, 3. Working Agreement Checklist, Document: Agents, VID Platform: Agent Operating Guidelines

### Community 47 - "publichaspermission / publicmyinstitutionids"
Cohesion: 0.40
Nodes (5): public.has_permission(), public.my_institution_ids(), public.permissions, public.role_permissions, public.user_roles

### Community 48 - "authhaspermission / authmyinstitutionids"
Cohesion: 0.40
Nodes (5): auth.has_permission(), auth.my_institution_ids(), public.permissions, public.role_permissions, public.user_roles

### Community 49 - "Skill brookslint / Brooks Lint Skill"
Cohesion: 0.50
Nodes (4): Skill: brooks-lint, Brooks Lint Skill, Guiding Principles, Severity Classifications

### Community 50 - "Skill honchomemory / Honcho Memory Skill"
Cohesion: 0.50
Nodes (4): Skill: honcho-memory, Honcho Memory Skill, When to Pull Memory, When to Save Memory

### Community 51 - "Key Actions / Skill localmemory"
Cohesion: 0.50
Nodes (4): Key Actions, Skill: local-memory, Local Memory Skill, When to Use

### Community 52 - "Skill agentguard / Agent Guard Skill"
Cohesion: 0.67
Nodes (3): Skill: agent-guard, Agent Guard Skill, Enforcement

### Community 53 - "Skill ainativesdlc / AINative SDLC Skill"
Cohesion: 0.67
Nodes (3): Skill: ai-native-sdlc, AI-Native SDLC Skill, Gates

### Community 54 - "Skill axonflow / AxonFlow Skill"
Cohesion: 0.67
Nodes (3): Skill: axonflow, AxonFlow Skill, Policies

### Community 55 - "Checklist / Skill codexreviewer"
Cohesion: 0.67
Nodes (3): Checklist, Skill: codex-reviewer, Codex Reviewer Skill

### Community 56 - "Skill commitnarrator / Commit Narrator Skill"
Cohesion: 0.67
Nodes (3): Skill: commit-narrator, Commit Narrator Skill, Format

### Community 57 - "Skill debtops / DebtOps Skill"
Cohesion: 0.67
Nodes (3): Skill: debt-ops, Debt-Ops Skill, Rules

### Community 58 - "Skill docflow / Docflow Skill"
Cohesion: 0.67
Nodes (3): Skill: docflow, Docflow Skill, Policy

### Community 59 - "Skill espresso / Espresso Skill"
Cohesion: 0.67
Nodes (3): Skill: espresso, Espresso Skill, Guidelines

### Community 60 - "Skill falsegreen / Falsegreen Skill"
Cohesion: 0.67
Nodes (3): Skill: falsegreen, Falsegreen Skill, Patterns to Flag

### Community 61 - "Skill flakydetector / Flaky Detector Skill"
Cohesion: 0.67
Nodes (3): Skill: flaky-detector, Flaky Detector Skill, Instructions

### Community 62 - "Audit Checks / Skill holguard"
Cohesion: 0.67
Nodes (3): Audit Checks, Skill: hol-guard, HOL Guard Skill

### Community 63 - "Skill knowl / Knowl Project Memory Skill"
Cohesion: 0.67
Nodes (3): Skill: knowl, Knowl Project Memory Skill, Procedures

### Community 64 - "Skill megalinter / MegaLinter Skill"
Cohesion: 0.67
Nodes (3): Skill: megalinter, MegaLinter Skill, Target Toolchains

### Community 65 - "Execution Guide / Skill memesh"
Cohesion: 0.67
Nodes (3): Execution Guide, Skill: memesh, MeMesh Shared Memory Skill

### Community 66 - "Skill metabrain / Metabrain Skill"
Cohesion: 0.67
Nodes (3): Skill: metabrain, Metabrain Skill, Workflow

### Community 67 - "Skill prstoryteller / PR Storyteller Skill"
Cohesion: 0.67
Nodes (3): Skill: pr-storyteller, PR Storyteller Skill, Structure

### Community 68 - "Review Lenses / Skill riverreview"
Cohesion: 0.67
Nodes (3): Review Lenses, Skill: river-review, River Review Skill

### Community 69 - "Scan Targets / Skill secretguard"
Cohesion: 0.67
Nodes (3): Scan Targets, Skill: secret-guard, Secret Guard Skill

### Community 70 - "Lifecycle Stages / Skill specdriven"
Cohesion: 0.67
Nodes (3): Lifecycle Stages, Skill: spec-driven, Spec-Driven Development Skill

### Community 71 - "Procedure / Skill tailtest"
Cohesion: 0.67
Nodes (3): Procedure, Skill: tailtest, Tailtest Skill

### Community 72 - "Checks / Skill testgap"
Cohesion: 0.67
Nodes (3): Checks, Skill: test-gap, Test Gap Skill

### Community 73 - "Best Practices / Skill tokenoptimizer"
Cohesion: 0.67
Nodes (3): Best Practices, Skill: token-optimizer, Token Optimizer Skill

### Community 74 - "Guidelines / Skill unforgit"
Cohesion: 0.67
Nodes (3): Guidelines, Skill: unforgit, Unforgit Skill

### Community 75 - "PreEdit Verification Checklist / Skill wingma"
Cohesion: 0.67
Nodes (3): Pre-Edit Verification Checklist, Skill: wingman, Wingman Data-Contract Skill

### Community 76 - "publicisassignedfaculty / publicfacultyassign"
Cohesion: 0.67
Nodes (3): public.is_assigned_faculty(), public.faculty_assignments, public.staff

### Community 77 - "publicisguardianof / publicguardians"
Cohesion: 0.67
Nodes (3): public.is_guardian_of(), public.guardians, public.student_guardians

### Community 78 - "authisassignedfaculty / publicfacultyassignme"
Cohesion: 0.67
Nodes (3): auth.is_assigned_faculty(), public.faculty_assignments, public.staff

### Community 79 - "authisguardianof / publicguardians"
Cohesion: 0.67
Nodes (3): auth.is_guardian_of(), public.guardians, public.student_guardians

## Knowledge Gaps
- **457 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+452 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 556 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Frontend App Routes & UI Workspaces` to `Authentication Pages & Root Layout`, `Frontend Next.js & UI Dependencies`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `express` connect `Multi-Tenant Middleware & API Routing` to `Backend Node.js Dependencies`, `facultycontrollerts / facultyController`, `financecontrollerts / financerepositoryts`, `studentcontrollerts / studentrepositoryts`, `Express Server Core & Database Pooling`, `Academic Controllers & Business Logic`, `admissionscontrollerts / admissionsrepository`, `academicscontrollerts / academicsrepositoryts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Frontend App Routes & UI Workspaces` to `Authentication Pages & Root Layout`, `Frontend Next.js & UI Dependencies`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _457 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend App Routes & UI Workspaces` be split into smaller, more focused modules?**
  _Cohesion score 0.059495665878644605 - nodes in this community are weakly interconnected._
- **Should `Database Architecture & RBAC Normalization` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `Backend Node.js Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._