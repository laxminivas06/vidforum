# Attendance Service Attendanceservice

> 14 nodes

## Key Concepts

- **attendanceService** (15 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.getOrCreateSession()** (4 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.getSessionById()** (4 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.getStudentAttendanceSummary()** (4 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.listSessions()** (3 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.listStaffAttendance()** (3 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.recordStaffAttendance()** (3 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.submitRollCall()** (3 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.applyStudentLeave()** (2 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.decideStudentLeave()** (2 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.getScopedAttendance()** (2 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.getInstitutionSummary()** (1 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.getSectionRoster()** (1 connections) — `backend/src/modules/attendance/attendance.service.ts`
- **.listStudentLeaves()** (1 connections) — `backend/src/modules/attendance/attendance.service.ts`

## Relationships

- [Academics Service Academicsservice](Academics_Service_Academicsservice.md) (4 shared connections)
- [Routes Middleware Router](Routes_Middleware_Router.md) (1 shared connections)
- [Repository Service Timetable](Repository_Service_Timetable.md) (1 shared connections)

## Source Files

- `backend/src/modules/attendance/attendance.service.ts`

## Audit Trail

- EXTRACTED: 27 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*