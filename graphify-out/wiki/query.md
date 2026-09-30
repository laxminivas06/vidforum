# query

> God node · 36 connections · [C:\Antigravityyyyy\VID_School\backend\src\modules\timetable\timetable.routes.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/timetable/timetable.routes.ts#L14)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as query
    participant P1 as .findByIdOrCode()
    participant P2 as .getInstitutionDetails()
    participant P3 as .getInstitutionById()
    participant P4 as .findModules()
    participant P5 as .getInstitutionStats()
    participant P6 as .getStats()
    participant P7 as .getStats()
    participant P8 as .addInstitutionAdmin()
    participant P9 as .addAdmin()
    participant P10 as .createAdmin()
    participant P11 as .updateAdminWorkspaces()
    participant P12 as .toggleModule()
    participant P13 as authMiddleware()
    participant P14 as verify()
    participant P15 as tenantMiddleware()
    participant P16 as .getClassesByInstitution()
    participant P17 as .listClasses()
    participant P18 as .listSubjects()
    participant P19 as .findApplicantsByInstitution()
    participant P20 as .findApplicationById()
    participant P21 as .updateApplicationStage()
    participant P22 as .executeApprovalTransaction()
    participant P23 as .countStudents()
    participant P24 as .findDefaultSection()
    participant P25 as .findFacultyByInstitution()
    participant P26 as .findFacultyById()
    participant P27 as .findFeeRecordsByInstitution()
    participant P28 as .recordPayment()
    participant P29 as .getSummary()
    participant P30 as .findAll()
    participant P31 as .create()
    participant P32 as .findAdmins()
    participant P33 as .upsertModule()
    participant P34 as .updateStatus()
    participant P35 as .findStudents()
    participant P36 as .findStudentMasterById()
    participant P37 as .promote()
    participant P38 as purgeDummyData()
    participant P39 as run()
    participant P40 as .getSectionsByClass()
    participant P41 as .getSubjectsByClass()
    participant P42 as .getHierarchy()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P5->>+ P7: calls
    P7-->>- P5: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P8->>+ P1: calls
    P1-->>- P8: return
    P8->>+ P9: calls
    P9-->>- P8: return
    P8->>+ P10: calls
    P10-->>- P8: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P0->>+ P13: calls
    P13-->>- P0: return
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
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P32: calls
    P32-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
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
```

## Connections by Relation

### calls
- [[.findByIdOrCode()]] `INFERRED`
- [[authMiddleware()]] `INFERRED`
- [[verify()]] `INFERRED`
- [[tenantMiddleware()]] `INFERRED`
- [[.getClassesByInstitution()]] `INFERRED`
- [[.listClasses()]] `INFERRED`
- [[.listSubjects()]] `INFERRED`
- [[.findApplicantsByInstitution()]] `INFERRED`
- [[.findApplicationById()]] `INFERRED`
- [[.updateApplicationStage()]] `INFERRED`
- [[.executeApprovalTransaction()]] `INFERRED`
- [[.countStudents()]] `INFERRED`
- [[.findDefaultSection()]] `INFERRED`
- [[.findFacultyByInstitution()]] `INFERRED`
- [[.findFacultyById()]] `INFERRED`
- [[.findFeeRecordsByInstitution()]] `INFERRED`
- [[.recordPayment()]] `INFERRED`
- [[.getSummary()]] `INFERRED`
- [[.findAll()]] `INFERRED`
- [[.create()]] `INFERRED`

### contains
- [[timetable.routes.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*