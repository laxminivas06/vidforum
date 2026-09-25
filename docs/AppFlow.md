# VID (Virtual Identification) — Application Flow & Architecture Document

**Version:** 2.0.0  
**Status:** Canonical Frontend Specification  
**Companion Documents:** `docs/Design.md`, `docs/PRD.md`, `docs/TECH_SPEC.md`  

---

## 1. Overview & Navigation Architecture

VID (Virtual Identification) is a centralized, multi-tenant educational operating ecosystem connecting the complete institutional lifecycle around a single immutable student master record. 

The application architecture enforces strict role-based workspace boundaries and dynamic module configuration:
1. **Single Shell, Role-Driven:** The same desktop/tablet/mobile shell houses all workspaces, driven dynamically by `/config/navigation.ts`.
2. **Dynamic Optional Module Filtering (PRD Rule 5):** Disabled optional modules (Hostel, Transport, Library, Sports, Events, Inventory) are completely omitted from navigation and routing trees.
3. **Adaptive Role Views (PRD Rule 25):** Navigation automatically adapts to the authenticated persona (Super Admin, Institution Admin, Faculty, Admissions, Finance, etc.).
4. **Student Master Anchor (PRD Rule 1):** Student is **never** a standalone workspace. The `<StudentProfile>` is a unified tabbed entity accessible as a route (`/students/[id]`) or as a right-side `<SlideOver>`.

---

## 2. Complete Route Hierarchy & Screen Inventory

### 2.1 Authentication
- `/login` — Multi-tenant authentication with institution subdomain resolution, email/password, and role redirection.

### 2.2 Super Admin Console (`/(super-admin)`)
- `/dashboard` — Platform overview: tenant count, active students, MRR, system uptime, and AI usage metrics.
- `/institutions` — Tenant directory, onboarding wizard, activation/suspension toggles.
- `/plans` — Tiered subscription plans (Starter, Growth, Enterprise) and feature limits.
- `/users` — Global platform administrators and super admin user management.
- `/security` — Global role definitions, permission matrix, session revocation.
- `/monitoring` — Real-time API latency, background queue throughput, database connection pools.
- `/ai-config` — Global AI Yantra provider keys (LLM, Vision, STT/TTS), model routing, token rate limits.
- `/billing` — SaaS subscriptions, invoice billing logs, platform revenue ledger.
- `/settings` — Platform-wide settings, SMTP credentials, webhook endpoints.

### 2.3 Institution Admin Workspace (`/(institution-admin)`)
- `/dashboard` — High-level institutional telemetry: student attendance rate, fee collection pace, admission funnel, pending verification queues, quick actions.
- `/settings/*` — **Two-Pane List+Detail Layout (Section 3.2)**:
  - `Profile` — School name, logo, contact, affiliation code, timezone, currency.
  - `Academic Structure` — Academic years, departments, courses, classes, sections, subjects.
  - `Staff & Roles` — Staff directory, custom roles, permission assignments.
  - `Modules & Subscriptions` — Independent toggles for optional modules (Hostel, Transport, Library, Sports, Events, Inventory).
  - `Integrations` — Payment gateway keys (Stripe/Razorpay), SMS gateway, CCTV cameras.
  - `Audit Logs` — Immutable institutional audit trail.

### 2.4 Core Workspaces (`/(core)`)
- `admissions/*` — **Section 3.3**:
  - `/admissions` — Kanban board (Enquiry $\to$ Application $\to$ Verification $\to$ Decision) with applicant count badges, filters, and quick inquiry modal.
  - `/admissions/enquiries` — Tabular leads tracking with contact history.
  - Applicant Detail Slide-Over — Document verification checklist, interview notes, 1-click "Approve Admission" (triggers atomic Student Master & Parent creation).
- `academics/*`:
  - `/academics/hierarchy` — Interactive visualizer for Dept $\to$ Course $\to$ Class $\to$ Section.
  - `/academics/subjects` — Subject catalog, syllabus upload, faculty assignments.
- `faculty/*`:
  - `/faculty/dashboard` — Today's teaching schedule, assigned classes/sections, pending marks entry.
  - `/faculty/my-students` — Class roster scoped strictly to assigned teaching classes.
  - `/faculty/attendance` — Period roll-call entry with instant submission.
- `attendance/*`:
  - `/attendance/sessions` — Daily attendance roll, class-wise verification queue.
  - `/attendance/absentees` — Unexcused absence tracker with 1-click notification trigger.
- `examinations/*`:
  - `/examinations/schedules` — Exam term timetable, room and invigilator allocation.
  - `/examinations/marks` — Spreadsheet marks entry grid.
  - `/examinations/import` — Multi-step Excel import engine (Upload $\to$ Validate Columns $\to$ Match Students $\to$ Preview $\to$ Commit).
  - `/examinations/report-cards` — Bulk printable report card generator.
- `finance/*`:
  - `/finance/dashboard` — Fee collection pacing, outstanding dues, daily reconciliation.
  - `/finance/structures` — Tuition, lab, sports, and optional fee builders.
  - `/finance/invoices` — Invoices ledger with payment status filters.
  - `/finance/collect` — Counter payment collection with instant receipt print.
- `documents/*`:
  - `/documents/vault` — Institution, staff, and student document repositories.
  - `/documents/bonafide` — Automated certificate generator with QR verification stamp.
- `hrms/*`:
  - `/hrms/staff` — Employee directory, designations, qualification credentials.
  - `/hrms/leaves` — Leave application and approval workflow.
- `timetable/*`:
  - `/timetable/matrix` — Class/section weekly schedule grid.
  - `/timetable/conflicts` — Real-time conflict inspector (double-booked teacher/room).

### 2.5 AI Yantra Services (`/(ai-yantra)`)
- `/voice-agent/*`:
  - `/voice-agent/campaigns` — Outbound voice campaigns (fee reminders, absentee alerts, PTM alerts).
  - `/voice-agent/simulator` — Interactive audio playback dialog tester.
- `/ai-attendance/*`:
  - `/ai-attendance/monitoring` — Live CCTV / classroom camera recognition feed simulator.
  - `/ai-attendance/verify` — Biometric recognition queue with confidence threshold scores.
- `/ai-tutor/*`:
  - `/ai-tutor/chat` — Context-bounded student doubt resolution assistant.
  - `/ai-tutor/practice` — AI practice question and mock test generator.
  - `/ai-tutor/analytics` — Weak topic detection radar and learning mastery curves.

### 2.6 Optional Modular Workspaces (`/(optional)`)
- `/events/*` — School event calendar, registration, participant rosters.
- `/transport/*` — Bus routes, stops, vehicle tracking, student bus allocations.
- `/hostel/*` — Hostel buildings, room/bed occupancy matrix, room allocations.
- `/library/*` — Book catalog, ISBN scanner, issue/return logs, overdue fine calculator.
- `/sports/*` — Athletic teams, coach assignments, tournament fixture schedules.
- `/inventory/*` — Equipment inventory, consumable stock ledger, vendor purchase orders.

### 2.7 Central Student Master Profile (`/students/[id]`)
- **Section 3.4**: Reusable `<StudentProfile>` shell containing:
  - Header: Photo, Student ID, Roll No, Current Class & Section, Status badge.
  - Tab 1: **Personal & Parents** — Demographics, blood group, emergency contact, linked parents.
  - Tab 2: **Academic History** — Current enrollment, previous grades, promotions.
  - Tab 3: **Attendance Roll** — Year-to-date percentage, monthly calendar heatmap, absence history.
  - Tab 4: **Examinations & Marks** — Term-wise scorecards, GPA, rank.
  - Tab 5: **Fee Ledger** — Assigned fee schedule, invoices, transaction history, receipts.
  - Tab 6: **Documents Vault** — Identity proofs, birth certificate, transfer certificate.
  - Tab 7: **Timetable** — Weekly class schedule.
  - Tab 8: **AI Tutor Radar** — Subject mastery analysis, weak topics, practice logs.

### 2.8 Mobile Parent & Student Portal (`/(mobile)/app`)
- Role-adaptive bottom navigation: `Home`, `Academics`, `Attendance`, `Fees`, `Profile`.
- Multi-child switcher for parents (`Child 1` / `Child 2` / `Child 3`).

---

## 3. Deep-Dive Screen Specifications

### 3.1 Login & Tenant Resolution
- Clean centered card (`bg-canvas`, `border-default`, `rounded-xl`).
- Dynamic institution branding (logo, institution name, primary green accent).
- Fields: Subdomain slug, Email address, Password, "Remember Me" checkbox.
- Actions: Primary black pill button "Sign In to VID".

### 3.2 Institution Admin Settings Shell (Two-Pane)
- Left pane (220px): Vertical sub-navigation list. Active item has white card pill background with `border-default`.
- Right pane: Full fluid workspace containing the active section's configuration forms.
- On mobile (<768px): Collapses automatically to a horizontal scrollable tab strip above the content panel.

### 3.3 Admissions Workspace (Kanban & Slide-Over)
- Header: Stats ribbon (Total Inquiries, Active Applications, Verification Pending, Approved).
- Action Bar: Search input, Grade filter, "New Inquiry" button, "Export CSV".
- Kanban Columns: `Enquiry` $\to$ `Application Submitted` $\to$ `Under Verification` $\to$ `Approved` $\to$ `Enrolled`.
- Cards: Applicant name, applying grade, parent contact, submission date, status chip.
- Slide-Over Panel (500px): Clicking any card opens slide-over with applicant details, submitted documents preview, verification status toggles, and sticky footer action: "Approve Admission & Enroll".

### 3.4 Student Master Profile Shell
- Full page route `/students/[id]` and Slide-Over embeddable modal.
- Tabbed layout switching between 8 core operational domains.
- Data is read from the single central student master entity.

---

## 4. Navigation & Optional Module Matrix (`/config/navigation.ts`)

```typescript
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  permission?: string;
  optionalModuleKey?: 'events' | 'transport' | 'hostel' | 'library' | 'sports' | 'inventory';
}

export interface NavGroup {
  label: string; // e.g. "CORE", "AI YANTRA", "OPTIONAL"
  items: NavItem[];
}
```

When an optional module is disabled in the tenant configuration, all matching items are filtered out before rendering the navigation rail.

---

## 5. Development Phases

- **Phase 1 (MVP Foundation):** Shared UI Component Library, Auth/Login, Super Admin Console, Institution Admin Dashboard & Settings Shell, Admissions Kanban & Slide-Over, Student Master Profile, Academics & Faculty Workspace.
- **Phase 2 (Core Operations):** Attendance, Examinations (with Excel Import), Finance & Fee Ledger, Documents, Timetable with Conflict Detection, HRMS.
- **Phase 3 (AI Yantra Intelligence):** Yantra Voice Agent, AI Attendance, AI Tutor.
- **Phase 4 (Optional & Mobile):** Events, Transport, Hostel, Library, Sports, Inventory, Parent & Student Mobile Application.

---
*End of AppFlow.md*
