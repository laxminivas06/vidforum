# VID Platform: Canonical Workspace Map & Routing Specification

**Document:** `/docs/WORKSPACE_MAP.md`  
**Execution Standard:** Section 12 (Step R1 Audit) & Section 10 (Access Model)  
**Status:** Binding & Canonical (Never Rename Workspace Keys)  
**Date:** October 3, 2026  

---

## 1. Principles of Workspace Isolation

1. **Strict 1:1 Mapping:** Every API route group (`/api/v1/*`) and frontend route (`frontend/app/*`) belongs to **exactly one** workspace.
2. **Database-Verified Grants:** Access to a workspace is granted via database records in `user_roles.scope->'workspaces'` (or role defaults), cached by a tenant-level `perm_version` counter. A JWT token grant is never trusted in isolation without backend verification.
3. **Exclusive Loading:** When a user navigates to an isolated workspace, the sidebar and workspace shell load **exclusively** the active workspace’s tools. All other workspaces are completely hidden.

---

## 2. Master Table of 12 Platform Workspaces

| # | Workspace Key (`id`) | Canonical Title | Category | Primary Route | Owning Step / Modules | Backend API Prefix |
|---|---|---|---|---|---|---|
| **1** | `dashboard` | **Executive Workspace Hub** | `OVERVIEW` | `/dashboard` | Step R & Step 9 (Platform Hub, Faculty & User Accounts, Student 360°) | `/api/v1/users`, `/api/v1/institutions`, `/api/v1/students` |
| **2** | `admissions` | **Admissions & Enrollment** | `CORE` | `/admissions` | Step 3 (Applications Kanban, Inquiries, Document Verification, Enrolled Roster) | `/api/v1/admissions` |
| **3** | `academics` | **Academics & Curriculum** | `CORE` | `/academics/hierarchy` | Step 2 (Academic Hierarchy, Classes, Sections, Subjects, Year Schedule, Textbooks) | `/api/v1/academics` |
| **4** | `faculty` | **Faculty Management** | `CORE` | `/faculty/dashboard` | Step 4 (Teacher Allocations, Class Teachers, Workloads, Scoped Roster Access) | `/api/v1/faculty` |
| **5** | `attendance` | **Attendance System** | `CORE` | `/attendance/sessions` | Step 6 (Daily Roll Call, Period Sessions, Absence Alerts, Leave Reconciliation) | `/api/v1/attendance` |
| **6** | `examinations` | **Examinations & Gradebook** | `CORE` | `/examinations/schedules` | Step 8 (Exam Schedules, Marks Entry, Pre-Commit Excel Validation, Class Ranking, Report Cards) | `/api/v1/examinations` |
| **7** | `finance` | **Finance & Fee Collection** | `CORE` | `/finance/dashboard` | Step 7 (Fee Plans, Invoicing, Counter POS, Receipts, Ledger, Defaulters) | `/api/v1/finance` |
| **8** | `documents` | **Documents Vault** | `CORE` | `/documents/vault` | Step 9 (Vault Storage, Verification Workflow, QR Bonafide/TC Generation) | `/api/v1/documents` |
| **9** | `hrms` | **Staff & HRMS Workspace** | `CORE` | `/hrms/staff` | Step 1B (Staff Directory, Add Staff, Bulk Import, Leaves, Attendance, Payroll) | `/api/v1/hrms` |
| **10** | `timetable` | **Timetable & Schedules** | `CORE` | `/timetable/matrix` | Step 5 (Periods, Rooms, Constraint Solver, Timetable Matrix, Conflict Detector, Substitutions) | `/api/v1/timetable` |
| **11** | `campus_life` | **Campus Services** | `SERVICES` | `/events` | Phase 4 (Events, Fleet Transport, Hostel Rooms, Library Catalog, Sports, Inventory Assets) | `/api/v1/optional-modules` |
| **12** | `settings` | **Institutional Settings** | `SETTINGS` | `/settings` | Step 9 (Institution Profile, Security Policies, Notification Outbox, Audit Log Viewer) | `/api/v1/institutions`, `/api/v1/notifications`, `/api/v1/audit-logs` |

---

## 3. Dedicated Platform Super Admin Workspace

The Platform Super Administrator operates at the tenant provisioning and system infrastructure level and is strictly isolated from tenant-level operational workspaces (PRD RBAC isolation):

| Workspace Key (`id`) | Canonical Title | Category | Primary Route | Routes Owned | API Groups Owned |
|---|---|---|---|---|---|
| `platform` | **Super Admin Platform Console** | `PLATFORM` | `/dashboard` | `/dashboard`, `/institutions`, `/plans`, `/users`, `/monitoring`, `/security`, `/billing` | `/api/v1/institutions`, `/api/v1/users`, `/api/v1/audit-logs` |

---

## 4. Role Templates & Default Workspace Assignments

Per Section 10 of the Master Specification, account provisioning maps to standard Role Templates:

| Template Name | Assigned System Role | Default Granted Workspaces | Permission Scope |
|---|---|---|---|
| **Teacher** | `FACULTY` | `faculty`, `academics` (read), `attendance` (own class), `examinations` (own marks), `timetable` (own schedule) | Resource-Scoped (Rule 8) |
| **HR Officer** | `INSTITUTION_ADMIN` (Scoped) | `hrms` | Full HRMS |
| **Admission Officer** | `ADMISSION_TEAM` | `admissions`, `documents` | Full Admissions & Verification |
| **Academic Coordinator** | `ACADEMIC_COORDINATOR` | `academics`, `faculty`, `timetable` | Full Academic Management |
| **Finance Officer** | `FINANCE_TEAM` | `finance`, `admissions` (fee status read) | Full Finance & Fees |
| **Exam Officer** | `EXAM_TEAM` | `examinations`, `academics` (read) | Full Examinations |
| **Institution Administrator** | `INSTITUTION_ADMIN` | All 12 Workspaces | Full Institutional Administration |
| **Super Administrator** | `SUPER_ADMIN` | `platform` | Platform-Level Tenant Provisioning |
