# query

> God node · 28 connections · [C:\Antigravityyyyy\VID_School\backend\src\modules\timetable\timetable.routes.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/timetable/timetable.routes.ts#L14)

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
    participant P8 as .toggleModule()
    participant P9 as .upsertModule()
    participant P10 as authMiddleware()
    participant P11 as sendError()
    participant P12 as tenantMiddleware()
    participant P13 as .getClassesByInstitution()
    participant P14 as .listClasses()
    participant P15 as .listSubjects()
    participant P16 as .findApplicantsByInstitution()
    participant P17 as .findApplicationById()
    participant P18 as .updateApplicationStage()
    participant P19 as .executeApprovalTransaction()
    participant P20 as .countStudents()
    participant P21 as .findDefaultSection()
    participant P22 as .findFacultyByInstitution()
    participant P23 as .findFacultyById()
    participant P24 as .findFeeRecordsByInstitution()
    participant P25 as .recordPayment()
    participant P26 as .getSummary()
    participant P27 as .findAll()
    participant P28 as .findStudents()
    participant P29 as .findStudentMasterById()
    participant P30 as .promote()
    participant P31 as .getSectionsByClass()
    participant P32 as .getSubjectsByClass()
    participant P33 as .getHierarchy()
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
    P0->>+ P10: calls
    P10-->>- P0: return
    P10->>+ P0: calls
    P0-->>- P10: return
    P10->>+ P11: calls
    P11-->>- P10: return
    P0->>+ P12: calls
    P12-->>- P0: return
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
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
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
```

## Connections by Relation

### calls
- [[.findByIdOrCode()]] `INFERRED`
- [[authMiddleware()]] `INFERRED`
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
- [[.findModules()]] `INFERRED`
- [[.getStats()]] `INFERRED`

### contains
- [[timetable.routes.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*