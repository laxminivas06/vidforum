# sendSuccess()

> God node · 23 connections · [C:\Antigravityyyyy\VID_School\backend\src\utils\api-response.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/utils/api-response.ts#L19)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendSuccess()
    participant P1 as .getGrades()
    participant P2 as .getAcademicGrades()
    participant P3 as .getClassesByInstitution()
    participant P4 as .updateStage()
    participant P5 as sendError()
    participant P6 as authMiddleware()
    participant P7 as tenantMiddleware()
    participant P8 as errorMiddleware()
    participant P9 as .approve()
    participant P10 as .approveApplication()
    participant P11 as .getFaculty()
    participant P12 as .getFacultyById()
    participant P13 as .getRecords()
    participant P14 as .recordPayment()
    participant P15 as .getSummary()
    participant P16 as .getInstitutions()
    participant P17 as .getInstitutionById()
    participant P18 as .getStats()
    participant P19 as .getAdmins()
    participant P20 as .addAdmin()
    participant P21 as .getStudents()
    participant P22 as .getStudentById()
    participant P23 as .promote()
    participant P24 as .getHierarchy()
    participant P25 as .getClasses()
    participant P26 as .getSubjects()
    participant P27 as .getApplicants()
    participant P28 as .toggleModule()
    participant P29 as .createInstitution()
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
    P0->>+ P4: calls
    P4-->>- P0: return
    P4->>+ P0: calls
    P0-->>- P4: return
    P4->>+ P5: calls
    P5-->>- P4: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P5->>+ P7: calls
    P7-->>- P5: return
    P5->>+ P4: calls
    P4-->>- P5: return
    P5->>+ P8: calls
    P8-->>- P5: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P9->>+ P0: calls
    P0-->>- P9: return
    P9->>+ P10: calls
    P10-->>- P9: return
    P0->>+ P11: calls
    P11-->>- P0: return
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
    P0->>+ P28: calls
    P28-->>- P0: return
    P0->>+ P29: calls
    P29-->>- P0: return
```

## Connections by Relation

### calls
- [[.getGrades()]] `INFERRED`
- [[.updateStage()]] `INFERRED`
- [[.approve()]] `INFERRED`
- [[.getFaculty()]] `INFERRED`
- [[.getFacultyById()]] `INFERRED`
- [[.getRecords()]] `INFERRED`
- [[.recordPayment()]] `INFERRED`
- [[.getSummary()]] `INFERRED`
- [[.getInstitutions()]] `INFERRED`
- [[.getInstitutionById()]] `INFERRED`
- [[.getStats()]] `INFERRED`
- [[.getAdmins()]] `INFERRED`
- [[.addAdmin()]] `INFERRED`
- [[.getStudents()]] `INFERRED`
- [[.getStudentById()]] `INFERRED`
- [[.promote()]] `INFERRED`
- [[.getHierarchy()]] `INFERRED`
- [[.getClasses()]] `INFERRED`
- [[.getSubjects()]] `INFERRED`
- [[.getApplicants()]] `INFERRED`

### contains
- [[api-response.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*