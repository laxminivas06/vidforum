# attendancecorrections / attendancerecords

> 8 nodes · cohesion 0.29

## Key Concepts

- **attendance_records** (12 connections) — `docs/vid_schema_migrations.sql`
- **attendance_sessions** (7 connections) — `docs/vid_schema_migrations.sql`
- **attendance_corrections** (4 connections) — `docs/vid_schema_migrations.sql`
- **student_attendance_summary** (4 connections) — `docs/vid_schema_migrations.sql`
- **attendance_verification_queue** (3 connections) — `docs/vid_schema_migrations.sql`
- **idx_attendance_records_pending** (2 connections) — `docs/vid_schema_migrations.sql`
- **idx_attendance_records_student_session** (2 connections) — `docs/vid_schema_migrations.sql`
- **idx_tenant_attendance_records** (2 connections) — `docs/vid_schema_migrations.sql`

## Relationships

- [VID Database Migrations & RLS Functions](VID_Database_Migrations_&_RLS_Functions.md) (8 shared connections)
- [aiattendanceevents / cameradevices](aiattendanceevents_-_cameradevices.md) (5 shared connections)
- [academicyears / admissions](academicyears_-_admissions.md) (3 shared connections)
- [admissiondocuments / applications](admissiondocuments_-_applications.md) (2 shared connections)
- [courses / departments](courses_-_departments.md) (1 shared connections)
- [classsubjects / curriculum](classsubjects_-_curriculum.md) (1 shared connections)

## Source Files

- `docs/vid_schema_migrations.sql`

## Audit Trail

- EXTRACTED: 28 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*