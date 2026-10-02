# [Document: Prd & 1.1 Problem Statement] Cluster

> 47 nodes · cohesion 0.05

## Key Concepts

- [page.tsx](file:///C:/Antigravityyyyy/VID_School/frontend/app/admissions/page.tsx#L1) (15 connections)
- [page.tsx](file:///C:/Antigravityyyyy/VID_School/frontend/app/%28auth%29/login/page.tsx#L1) (10 connections)
- [AdmissionsRepository](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L16) (8 connections)
- [AdmissionsService](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L23) (6 connections)
- [.approveApplication()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L75) (6 connections)
- [.updateStage()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L44) (5 connections)
- [.approve()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.controller.ts#L82) (3 connections)
- [.executeApprovalTransaction()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L98) (3 connections)
- [.findApplicationById()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L48) (3 connections)
- [admissions.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L1) (3 connections)
- [page.tsx](file:///C:/Antigravityyyyy/VID_School/frontend/app/timetable/matrix/page.tsx#L1) (3 connections)
- [.countStudents()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L229) (2 connections)
- [.findApplicantsByInstitution()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L17) (2 connections)
- [.findDefaultSection()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L234) (2 connections)
- [.updateApplicationStage()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L90) (2 connections)
- [.getApplicants()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L24) (2 connections)
- [.getApplicationById()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L53) (2 connections)
- [handleAdvanceStage()](file:///C:/Antigravityyyyy/VID_School/frontend/app/admissions/page.tsx#L130) (2 connections)
- [handleEnroll()](file:///C:/Antigravityyyyy/VID_School/frontend/app/admissions/page.tsx#L120) (2 connections)
- [handleReject()](file:///C:/Antigravityyyyy/VID_School/frontend/app/admissions/page.tsx#L147) (2 connections)
- [router](file:///C:/Antigravityyyyy/VID_School/frontend/app/admissions/page.tsx#L45) (2 connections)
- [[selectedGrade, setSelectedGrade]](file:///C:/Antigravityyyyy/VID_School/frontend/app/timetable/matrix/page.tsx#L26) (2 connections)
- [.createApplication()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts#L56) (1 connections)
- [.createApplication()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L61) (1 connections)
- [STAGE_MAP_TO_DB](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts#L13) (1 connections)
- *... and 22 more nodes in this community*

## Class Diagram

```mermaid
classDiagram
    class AdmissionsRepository {
        +admissions.repository.ts()
        +.findApplicantsByInstitution()
        +.findApplicationById()
        +.createApplication()
        +.updateApplicationStage()
        +.executeApprovalTransaction()
        +.countStudents()
        +.findDefaultSection()
    }
    class AdmissionsService {
        +admissions.service.ts()
        +.getApplicants()
        +.updateStage()
        +.getApplicationById()
        +.createApplication()
        +.approveApplication()
    }
```

## Relationships

- No strong cross-community connections detected

## Source Files

- [C:\Antigravityyyyy\VID_School\backend\src\modules\admissions\admissions.controller.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.controller.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\admissions\admissions.repository.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.repository.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\admissions\admissions.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/admissions/admissions.service.ts)
- [C:\Antigravityyyyy\VID_School\frontend\app\(auth)\login\page.tsx](file:///C:/Antigravityyyyy/VID_School/frontend/app/%28auth%29/login/page.tsx)
- [C:\Antigravityyyyy\VID_School\frontend\app\admissions\page.tsx](file:///C:/Antigravityyyyy/VID_School/frontend/app/admissions/page.tsx)
- [C:\Antigravityyyyy\VID_School\frontend\app\timetable\matrix\page.tsx](file:///C:/Antigravityyyyy/VID_School/frontend/app/timetable/matrix/page.tsx)

## Audit Trail

- EXTRACTED: 88 (79%)
- INFERRED: 24 (21%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*