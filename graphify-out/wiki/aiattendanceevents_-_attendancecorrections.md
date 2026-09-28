# aiattendanceevents / attendancecorrections

> 11 nodes · cohesion 0.22

## Key Concepts

- **attendance_records** (12 connections) — `backend/db/schema.sql`
- **attendance_sessions** (7 connections) — `backend/db/schema.sql`
- **ai_attendance_events** (6 connections) — `backend/db/schema.sql`
- **face_profiles** (6 connections) — `backend/db/schema.sql`
- **attendance_corrections** (4 connections) — `backend/db/schema.sql`
- **student_attendance_summary** (4 connections) — `backend/db/schema.sql`
- **attendance_verification_queue** (3 connections) — `backend/db/schema.sql`
- **face_embeddings** (2 connections) — `backend/db/schema.sql`
- **idx_attendance_records_pending** (2 connections) — `backend/db/schema.sql`
- **idx_attendance_records_student_session** (2 connections) — `backend/db/schema.sql`
- **idx_tenant_attendance_records** (2 connections) — `backend/db/schema.sql`

## Relationships

- [PostgreSQL Schema & Event System](PostgreSQL_Schema_&_Event_System.md) (11 shared connections)
- [Academic Entities & Institutional Domains](Academic_Entities_&_Institutional_Domains.md) (7 shared connections)
- [academicyears / admissions](academicyears_-_admissions.md) (4 shared connections)
- [admissiondocuments / aivoicecalls](admissiondocuments_-_aivoicecalls.md) (3 shared connections)
- [classsubjects / curriculum](classsubjects_-_curriculum.md) (1 shared connections)

## Source Files

- `backend/db/schema.sql`

## Audit Trail

- EXTRACTED: 38 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*