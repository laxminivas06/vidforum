# academicyears / admissions

> 20 nodes · cohesion 0.19

## Key Concepts

- **students** (32 connections) — `backend/db/schema.sql`
- **academic_years** (18 connections) — `backend/db/schema.sql`
- **classes** (18 connections) — `backend/db/schema.sql`
- **sections** (11 connections) — `backend/db/schema.sql`
- **admissions** (9 connections) — `backend/db/schema.sql`
- **applications** (8 connections) — `backend/db/schema.sql`
- **student_academic_history** (8 connections) — `backend/db/schema.sql`
- **student_promotions** (6 connections) — `backend/db/schema.sql`
- **student_academic_summary** (5 connections) — `backend/db/schema.sql`
- **enquiries** (4 connections) — `backend/db/schema.sql`
- **hostel_allocations** (4 connections) — `backend/db/schema.sql`
- **enforce_tenant_consistency()** (3 connections) — `backend/db/schema.sql`
- **hostel_attendance** (2 connections) — `backend/db/schema.sql`
- **idx_student_academic_history_student** (2 connections) — `backend/db/schema.sql`
- **idx_students_class_section** (2 connections) — `backend/db/schema.sql`
- **idx_students_name_trgm** (2 connections) — `backend/db/schema.sql`
- **idx_tenant_students** (2 connections) — `backend/db/schema.sql`
- **promote_student()** (2 connections) — `backend/db/schema.sql`
- **uq_academic_years_current** (2 connections) — `backend/db/schema.sql`
- **uq_student_academic_history_current** (2 connections) — `backend/db/schema.sql`

## Relationships

- [PostgreSQL Schema & Event System](PostgreSQL_Schema_&_Event_System.md) (28 shared connections)
- [Academic Entities & Institutional Domains](Academic_Entities_&_Institutional_Domains.md) (17 shared connections)
- [classsubjects / curriculum](classsubjects_-_curriculum.md) (6 shared connections)
- [admissiondocuments / aivoicecalls](admissiondocuments_-_aivoicecalls.md) (6 shared connections)
- [feecategories / feegroups](feecategories_-_feegroups.md) (5 shared connections)
- [examresultsummary / examroomallocations](examresultsummary_-_examroomallocations.md) (4 shared connections)
- [aiattendanceevents / attendancecorrections](aiattendanceevents_-_attendancecorrections.md) (4 shared connections)

## Source Files

- `backend/db/schema.sql`

## Audit Trail

- EXTRACTED: 106 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*