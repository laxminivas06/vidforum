# Multi-Tenant Middleware & API Routing

> 30 nodes · cohesion 0.22

## Key Concepts

- **api.v1.ts** (35 connections) — `backend/src/routes/api.v1.ts`
- **express** (28 connections) — `backend/package.json`
- **database.ts** (23 connections) — `backend/src/config/database.ts`
- **db** (19 connections) — `backend/src/config/database.ts`
- **tenant.middleware.ts** (18 connections) — `backend/src/middleware/tenant.middleware.ts`
- **tenantMiddleware()** (14 connections) — `backend/src/middleware/tenant.middleware.ts`
- **ai-yantra.routes.ts** (10 connections) — `backend/src/modules/ai-yantra/ai-yantra.routes.ts`
- **attendance.routes.ts** (10 connections) — `backend/src/modules/attendance/attendance.routes.ts`
- **documents.routes.ts** (10 connections) — `backend/src/modules/documents/documents.routes.ts`
- **examinations.routes.ts** (10 connections) — `backend/src/modules/examinations/examinations.routes.ts`
- **hrms.routes.ts** (10 connections) — `backend/src/modules/hrms/hrms.routes.ts`
- **optional-modules.routes.ts** (10 connections) — `backend/src/modules/optional-modules/optional-modules.routes.ts`
- **timetable.routes.ts** (10 connections) — `backend/src/modules/timetable/timetable.routes.ts`
- **academics.routes.ts** (7 connections) — `backend/src/modules/academics/academics.routes.ts`
- **admissions.routes.ts** (7 connections) — `backend/src/modules/admissions/admissions.routes.ts`
- **faculty.routes.ts** (7 connections) — `backend/src/modules/faculty/faculty.routes.ts`
- **finance.routes.ts** (7 connections) — `backend/src/modules/finance/finance.routes.ts`
- **student.routes.ts** (7 connections) — `backend/src/modules/students/student.routes.ts`
- **router** (2 connections) — `backend/src/modules/academics/academics.routes.ts`
- **router** (2 connections) — `backend/src/modules/admissions/admissions.routes.ts`
- **router** (2 connections) — `backend/src/modules/ai-yantra/ai-yantra.routes.ts`
- **router** (2 connections) — `backend/src/modules/attendance/attendance.routes.ts`
- **router** (2 connections) — `backend/src/modules/documents/documents.routes.ts`
- **router** (2 connections) — `backend/src/modules/examinations/examinations.routes.ts`
- **router** (2 connections) — `backend/src/modules/faculty/faculty.routes.ts`
- *... and 5 more nodes in this community*

## Relationships

- [Express Server Core & Database Pooling](Express_Server_Core_&_Database_Pooling.md) (37 shared connections)
- [Academic Controllers & Business Logic](Academic_Controllers_&_Business_Logic.md) (16 shared connections)
- [facultycontrollerts / facultyController](facultycontrollerts_-_facultyController.md) (5 shared connections)
- [academicscontrollerts / academicsrepositoryts](academicscontrollerts_-_academicsrepositoryts.md) (4 shared connections)
- [admissionscontrollerts / admissionsrepository](admissionscontrollerts_-_admissionsrepository.md) (4 shared connections)
- [financecontrollerts / financerepositoryts](financecontrollerts_-_financerepositoryts.md) (4 shared connections)
- [studentcontrollerts / studentrepositoryts](studentcontrollerts_-_studentrepositoryts.md) (4 shared connections)
- [Backend Node.js Dependencies](Backend_Node.js_Dependencies.md) (2 shared connections)
- [institutionrepositoryts / institutionReposito](institutionrepositoryts_-_institutionReposito.md) (2 shared connections)

## Source Files

- `backend/package.json`
- `backend/src/config/database.ts`
- `backend/src/middleware/tenant.middleware.ts`
- `backend/src/modules/academics/academics.routes.ts`
- `backend/src/modules/admissions/admissions.routes.ts`
- `backend/src/modules/ai-yantra/ai-yantra.routes.ts`
- `backend/src/modules/attendance/attendance.routes.ts`
- `backend/src/modules/documents/documents.routes.ts`
- `backend/src/modules/examinations/examinations.routes.ts`
- `backend/src/modules/faculty/faculty.routes.ts`
- `backend/src/modules/finance/finance.routes.ts`
- `backend/src/modules/hrms/hrms.routes.ts`
- `backend/src/modules/optional-modules/optional-modules.routes.ts`
- `backend/src/modules/students/student.routes.ts`
- `backend/src/modules/timetable/timetable.routes.ts`
- `backend/src/routes/api.v1.ts`

## Audit Trail

- EXTRACTED: 160 (93%)
- INFERRED: 12 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*