# [API_BASE_URL & DEFAULT_INST_ID] Cluster

> 39 nodes · cohesion 0.08

## Key Concepts

- [.findByIdOrCode()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L41) (12 connections)
- [InstitutionService](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts#L17) (12 connections)
- [InstitutionController](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts#L5) (11 connections)
- [InstitutionRepository](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L5) (11 connections)
- [.findModules()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L205) (5 connections)
- [.updateStatus()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L301) (5 connections)
- [.createAdmin()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L93) (4 connections)
- [.getStats()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L243) (4 connections)
- [.upsertModule()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L274) (4 connections)
- [.addInstitutionAdmin()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts#L141) (4 connections)
- [.getInstitutionDetails()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts#L55) (4 connections)
- [.getInstitutionStats()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts#L75) (4 connections)
- [.addAdmin()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts#L77) (3 connections)
- [.getAdmins()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts#L67) (3 connections)
- [.getInstitutionById()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts#L15) (3 connections)
- [.getInstitutions()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts#L6) (3 connections)
- [.getStats()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts#L25) (3 connections)
- [.updateStatus()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts#L87) (3 connections)
- [.create()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L52) (3 connections)
- [.findAdmins()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L166) (3 connections)
- [.findAll()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L6) (3 connections)
- [.updateAdminWorkspaces()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts#L187) (3 connections)
- [.getAllInstitutions()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts#L21) (3 connections)
- [.getInstitutionAdmins()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts#L212) (3 connections)
- [.getModules()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts#L92) (3 connections)
- *... and 14 more nodes in this community*

## Class Diagram

```mermaid
classDiagram
    class InstitutionController {
        +institution.controller.ts()
        +.getInstitutions()
        +.getInstitutionById()
        +.getStats()
        +.getModules()
        +.toggleModule()
        +.createInstitution()
        +.getAdmins()
        +.addAdmin()
        +.updateStatus()
    }
    class InstitutionRepository {
        +institution.repository.ts()
        +.findAll()
        +.findByIdOrCode()
        +.create()
        +.createAdmin()
        +.findAdmins()
        +.updateAdminWorkspaces()
        +.findModules()
        +.getStats()
        +.upsertModule()
    }
    class InstitutionService {
        +institution.service.ts()
        +.getAllInstitutions()
        +.getInstitutionDetails()
        +.getInstitutionStats()
        +.getModules()
        +.toggleModule()
        +.createInstitution()
        +.addInstitutionAdmin()
        +.getInstitutionAdmins()
        +.updateAdminWorkspaces()
    }
```

## Relationships

- No strong cross-community connections detected

## Source Files

- [C:\Antigravityyyyy\VID_School\backend\src\modules\institutions\institution.controller.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.controller.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\institutions\institution.repository.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\institutions\institution.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts)
- [C:\Antigravityyyyy\VID_School\frontend\app\admissions\documents\page.tsx](file:///C:/Antigravityyyyy/VID_School/frontend/app/admissions/documents/page.tsx)

## Audit Trail

- EXTRACTED: 80 (56%)
- INFERRED: 64 (44%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*