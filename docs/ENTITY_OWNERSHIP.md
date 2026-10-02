# VID Platform: Entity Ownership & API Map

**Document:** `/docs/ENTITY_OWNERSHIP.md`  
**Authoritative Source:** VID Master Build Prompt (Section 5)  
**Status:** Canonical & Binding  

---

## 1. Single Ownership & Anti-Collision Policy
1. **Single Writer Per Table:** Only the owning module writes to a table. Other modules read via the owner's `service` interface or hold a foreign key reference.
2. **Dependency Direction:** `common` ← `auth/tenants` ← `students/academics/hrms` ← downstream/optional modules.
3. **Core Isolation:** Core modules are strictly forbidden from importing optional or AI modules (Rule 27).

---

## 2. Master Entity Ownership Table

| Module | Owns Tables | API Prefix (`/api/v1/…`) | Phase | Direct Dependencies |
|---|---|---|---|---|
| **platform** | `institutions`, `institution_plans`, `subscriptions`, `institution_modules` (toggle state) | `/institutions` | Phase 1 | `common` |
| **auth** | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens` | `/auth`, `/users` | Phase 1 | `common`, `platform` |
| **admissions** | `admissions`, `applications`, `admission_documents` | `/admissions` | Phase 1 | `common`, `platform`, `students`, `academics` |
| **students** | `students`, `parents`, `guardians`, `student_parents` | `/students` | Phase 1 | `common`, `platform` (No UI workspace, Rule 1) |
| **academics** | `academic_years`, `departments`, `courses`, `classes`, `sections`, `subjects`, `curriculum`, `syllabus` | `/academics` | Phase 1 | `common`, `platform` |
| **faculty** | `faculty`, `faculty_subjects`, `faculty_classes` | `/faculty` | Phase 1 | `common`, `platform`, `academics`, `hrms` (staff) |
| **hrms** | `staff`, `designations` (P1) · `staff_attendance`, `leave_requests` (P2) | `/hrms` | Phase 1 / 2 | `common`, `platform`, `academics` (departments) |
| **timetable** | `timetables`, `periods`, `rooms` | `/timetable` | Phase 2 | `common`, `platform`, `academics`, `faculty` |
| **attendance** | `attendance`, `attendance_records`, `attendance_sessions`, `attendance_corrections` | `/attendance` | Phase 2 | `common`, `platform`, `students`, `academics`, `faculty` |
| **examinations** | `exams`, `exam_types`, `exam_schedules`, `exam_subjects`, `marks`, `grades`, `report_cards`, `exam_room_allocations` | `/examinations` | Phase 2 | `common`, `platform`, `students`, `academics`, `timetable` (rooms) |
| **finance** | `fee_structures`, `student_fees`, `invoices`, `payments`, `transactions`, `receipts`, `discounts`, `scholarships`, `refunds` | `/finance` | Phase 2 | `common`, `platform`, `students` |
| **documents** | `documents`, `document_templates` | `/documents` | Phase 2 | `common`, `platform`, `students`, `hrms` |
| **voice_agent** | `ai_voice_campaigns`, `ai_voice_calls` | `/yantra/voice` | Phase 3 | `common`, `platform` (Narrow read-only core client) |
| **ai_attendance** | `face_profiles`, `face_embeddings`, `ai_attendance_events` | `/yantra/attendance` | Phase 3 | `common`, `platform`, `students` (Encrypted embeddings) |
| **ai_tutor** | `tutor_sessions`, `tutor_messages`, `learning_profiles`, `recommendations` | `/yantra/tutor` | Phase 3 | `common`, `platform`, `students`, `academics` |
| **events** | `events`, `event_registrations`, `event_participants`, `event_certificates` | `/events` | Phase 4 | Optional module |
| **transport** | `transport_routes`, `transport_stops`, `transport_vehicles`, `transport_drivers`, `transport_allocations` | `/transport` | Phase 4 | Optional module |
| **hostel** | `hostels`, `hostel_rooms`, `hostel_beds`, `hostel_allocations` | `/hostel` | Phase 4 | Optional module |
| **library** | `library_books`, `library_copies`, `library_issues`, `library_fines`, `library_reservations` | `/library` | Phase 4 | Optional module |
| **sports** | `sports_teams`, `sports_coaches`, `sports_training`, `sports_competitions`, `sports_results` | `/sports` | Phase 4 | Optional module |
| **inventory** | `inventory_assets`, `inventory_stock`, `inventory_vendors`, `inventory_purchases`, `inventory_allocations` | `/inventory` | Phase 4 | Optional module (Web only) |
| **notifications** | `notifications`, `notification_deliveries` | `/notifications` (internal + inbox) | Phase 1 | Shared foundational service |
| **audit** | `audit_logs` | `/audit` (internal + admin read) | Phase 1 | Shared foundational service |

---

## 3. Fixed Table Collisions Resolutions
- `departments` is owned by `academics` with `department_type` enum (`academic`, `administrative`).
- `rooms` is owned by `timetable`; `examinations` references it via `exam_room_allocations`.
- `students` is a central master table owned by `students` with zero workspace UI.
- Identity chain: `users → staff (hrms) → faculty (faculty)`.
