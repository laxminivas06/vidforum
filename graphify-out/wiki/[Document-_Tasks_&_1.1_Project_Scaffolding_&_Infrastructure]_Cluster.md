# [Document: Tasks & 1.1 Project Scaffolding & Infrastructure] Cluster

> 109 nodes · cohesion 0.03

## Key Concepts

- [.dispatch()](file:///C:/Antigravityyyyy/VID_School/backend/src/common/audit-dispatcher.ts#L23) (81 connections)
- [AcademicsService](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts#L5) (50 connections)
- [HrmsService](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/hrms/hrms.service.ts#L16) (30 connections)
- [ExaminationsService](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.service.ts#L6) (26 connections)
- [runVerification()](file:///C:/Antigravityyyyy/VID_School/backend/src/scripts/verify-1b-hrms.ts#L11) (23 connections)
- [runVerification()](file:///C:/Antigravityyyyy/VID_School/backend/src/scripts/verify-2-academics.ts#L4) (21 connections)
- [.verifyFacultySubjectAllocation()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.repository.ts#L1053) (6 connections)
- [.validateImportBatch()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.repository.ts#L694) (5 connections)
- [.createDepartment()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/hrms/hrms.service.ts#L68) (5 connections)
- [.softDeleteStaff()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/hrms/hrms.service.ts#L435) (5 connections)
- [.getClassesByInstitution()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.repository.ts#L332) (4 connections)
- [.createAcademicYear()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts#L18) (4 connections)
- [.createClass()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts#L165) (4 connections)
- [.generateClassMatrix()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts#L270) (4 connections)
- [verify-1b-hrms.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/scripts/verify-1b-hrms.ts#L1) (4 connections)
- [.commitImportBatch()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.repository.ts#L807) (4 connections)
- [.upsertMarksBatch()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.repository.ts#L560) (4 connections)
- [.commitExcelImport()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.service.ts#L315) (4 connections)
- [.getStudentReportCard()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.service.ts#L448) (4 connections)
- [.listMarks()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.service.ts#L236) (4 connections)
- [.submitMarksBatch()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.service.ts#L193) (4 connections)
- [tenantMiddleware()](file:///C:/Antigravityyyyy/VID_School/backend/src/middleware/tenant.middleware.ts#L12) (4 connections)
- [.cloneAcademicYear()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts#L84) (3 connections)
- [.copySubjectMatrix()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts#L455) (3 connections)
- [.createCalendarDay()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts#L557) (3 connections)
- *... and 84 more nodes in this community*

## Class Diagram

```mermaid
classDiagram
    class AcademicsService {
        +academics.service.ts()
        +.getAcademicYears()
        +.getAcademicYearById()
        +.createAcademicYear()
        +.updateAcademicYear()
        +.setCurrentAcademicYear()
        +.closeAcademicYear()
        +.cloneAcademicYear()
        +.getAcademicGrades()
        +.getClasses()
    }
    class AuditDispatcher {
        +audit-dispatcher.ts()
        +.dispatch()
    }
    class ExaminationsService {
        +examinations.service.ts()
        +.createExamType()
        +.listExamTypes()
        +.createExam()
        +.getExamById()
        +.listExams()
        +.updateExamStatus()
        +.addExamSubject()
        +.listExamSubjects()
        +.createExamSchedule()
    }
    class HrmsService {
        +hrms.service.ts()
        +.constructor()
        +.listDesignations()
        +.createDesignation()
        +.deleteDesignation()
        +.listDepartments()
        +.createDepartment()
        +.deleteDepartment()
        +.listStaff()
        +.getStaffDetails()
    }
```

## Relationships

- No strong cross-community connections detected

## Source Files

- [C:\Antigravityyyyy\VID_School\backend\src\common\audit-dispatcher.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/common/audit-dispatcher.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\middleware\tenant.middleware.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/middleware/tenant.middleware.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\academics\academics.repository.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.repository.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\academics\academics.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/academics/academics.service.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\examinations\examinations.repository.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.repository.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\examinations\examinations.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/examinations/examinations.service.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\hrms\hrms.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/hrms/hrms.service.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\scripts\verify-1b-hrms.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/scripts/verify-1b-hrms.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\scripts\verify-2-academics.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/scripts/verify-2-academics.ts)

## Audit Trail

- EXTRACTED: 228 (48%)
- INFERRED: 243 (52%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*