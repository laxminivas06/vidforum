# query

> God node · 48 connections · [C:\Antigravityyyyy\VID_School\backend\src\modules\timetable\timetable.routes.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/timetable/timetable.routes.ts#L14)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as query
    participant P1 as .findByIdOrCode()
    participant P2 as .findModules()
    participant P3 as .getInstitutionDetails()
    participant P4 as .getModules()
    participant P5 as .getStats()
    participant P6 as .getInstitutionStats()
    participant P7 as .upsertModule()
    participant P8 as .toggleModule()
    participant P9 as .addInstitutionAdmin()
    participant P10 as .updateAdminWorkspaces()
    participant P11 as findById()
    participant P12 as authMiddleware()
    participant P13 as tenantMiddleware()
    participant P14 as verify()
    participant P15 as .dispatch()
    participant P16 as findMany()
    participant P17 as softDelete()
    participant P18 as .getClassesByInstitution()
    participant P19 as .listClasses()
    participant P20 as .listSubjects()
    participant P21 as .findApplicantsByInstitution()
    participant P22 as .findApplicationById()
    participant P23 as .updateApplicationStage()
    participant P24 as .executeApprovalTransaction()
    participant P25 as .countStudents()
    participant P26 as .findDefaultSection()
    participant P27 as .findLogs()
    participant P28 as .findLogById()
    participant P29 as .findFacultyByInstitution()
    participant P30 as .findFacultyById()
    participant P31 as .findFeeRecordsByInstitution()
    participant P32 as .recordPayment()
    participant P33 as .getSummary()
    participant P34 as .findAll()
    participant P35 as .create()
    participant P36 as .createAdmin()
    participant P37 as .findAdmins()
    participant P38 as .updateStatus()
    participant P39 as .findForUser()
    participant P40 as .createNotification()
    participant P41 as .findStudents()
    participant P42 as .findStudentMasterById()
    participant P43 as .promote()
    participant P44 as purgeDummyData()
    participant P45 as run()
    participant P46 as .getSectionsByClass()
    participant P47 as .getSubjectsByClass()
    participant P48 as .getHierarchy()
    participant P49 as .getUnreadCount()
    participant P50 as .markAsRead()
    participant P51 as .markAllAsRead()
    participant P52 as runStepBTests()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P0: calls
    P0-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P0: calls
    P0-->>- P5: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P1->>+ P7: calls
    P7-->>- P1: return
    P7->>+ P0: calls
    P0-->>- P7: return
    P7->>+ P1: calls
    P1-->>- P7: return
    P7->>+ P8: calls
    P8-->>- P7: return
    P1->>+ P3: calls
    P3-->>- P1: return
    P1->>+ P6: calls
    P6-->>- P1: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P1->>+ P10: calls
    P10-->>- P1: return
    P1->>+ P4: calls
    P4-->>- P1: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P0->>+ P2: calls
    P2-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P17: calls
    P17-->>- P0: return
    P0->>+ P18: calls
    P18-->>- P0: return
    P0->>+ P19: calls
    P19-->>- P0: return
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P21: calls
    P21-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P25: calls
    P25-->>- P0: return
    P0->>+ P26: calls
    P26-->>- P0: return
    P0->>+ P27: calls
    P27-->>- P0: return
    P0->>+ P28: calls
    P28-->>- P0: return
    P0->>+ P29: calls
    P29-->>- P0: return
    P0->>+ P30: calls
    P30-->>- P0: return
    P0->>+ P31: calls
    P31-->>- P0: return
    P0->>+ P32: calls
    P32-->>- P0: return
    P0->>+ P33: calls
    P33-->>- P0: return
    P0->>+ P34: calls
    P34-->>- P0: return
    P0->>+ P35: calls
    P35-->>- P0: return
    P0->>+ P36: calls
    P36-->>- P0: return
    P0->>+ P37: calls
    P37-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P38: calls
    P38-->>- P0: return
    P0->>+ P39: calls
    P39-->>- P0: return
    P0->>+ P40: calls
    P40-->>- P0: return
    P0->>+ P41: calls
    P41-->>- P0: return
    P0->>+ P42: calls
    P42-->>- P0: return
    P0->>+ P43: calls
    P43-->>- P0: return
    P0->>+ P44: calls
    P44-->>- P0: return
    P0->>+ P45: calls
    P45-->>- P0: return
    P0->>+ P46: calls
    P46-->>- P0: return
    P0->>+ P47: calls
    P47-->>- P0: return
    P0->>+ P48: calls
    P48-->>- P0: return
    P0->>+ P49: calls
    P49-->>- P0: return
    P0->>+ P50: calls
    P50-->>- P0: return
    P0->>+ P51: calls
    P51-->>- P0: return
    P0->>+ P52: calls
    P52-->>- P0: return
```

## Connections by Relation

### calls
- [[.findByIdOrCode()]] `INFERRED`
- [[.findModules()]] `INFERRED`
- [[findById()]] `INFERRED`
- [[authMiddleware()]] `INFERRED`
- [[tenantMiddleware()]] `INFERRED`
- [[.getStats()]] `INFERRED`
- [[.upsertModule()]] `INFERRED`
- [[verify()]] `INFERRED`
- [[.dispatch()]] `INFERRED`
- [[findMany()]] `INFERRED`
- [[softDelete()]] `INFERRED`
- [[.getClassesByInstitution()]] `INFERRED`
- [[.listClasses()]] `INFERRED`
- [[.listSubjects()]] `INFERRED`
- [[.findApplicantsByInstitution()]] `INFERRED`
- [[.findApplicationById()]] `INFERRED`
- [[.updateApplicationStage()]] `INFERRED`
- [[.executeApprovalTransaction()]] `INFERRED`
- [[.countStudents()]] `INFERRED`
- [[.findDefaultSection()]] `INFERRED`

### contains
- [[timetable.routes.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*