# sendSuccess()

> God node · 33 connections · [C:\Antigravityyyyy\VID_School\backend\src\utils\api-response.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/utils/api-response.ts#L19)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendSuccess()
    participant P1 as .getLogs()
    participant P2 as sendError()
    participant P3 as authMiddleware()
    participant P4 as tenantMiddleware()
    participant P5 as .getLogById()
    participant P6 as .getNotifications()
    participant P7 as .send()
    participant P8 as .updateStage()
    participant P9 as .getUnreadCount()
    participant P10 as .markAsRead()
    participant P11 as .markAllAsRead()
    participant P12 as errorMiddleware()
    participant P13 as .getAuditLogs()
    participant P14 as .getGrades()
    participant P15 as .approve()
    participant P16 as .getFaculty()
    participant P17 as .getFacultyById()
    participant P18 as .getRecords()
    participant P19 as .recordPayment()
    participant P20 as .getSummary()
    participant P21 as .getInstitutions()
    participant P22 as .getInstitutionById()
    participant P23 as .getStats()
    participant P24 as .getAdmins()
    participant P25 as .addAdmin()
    participant P26 as .updateStatus()
    participant P27 as .getStudents()
    participant P28 as .getStudentById()
    participant P29 as .promote()
    participant P30 as .getHierarchy()
    participant P31 as .getClasses()
    participant P32 as .getSubjects()
    participant P33 as .getApplicants()
    participant P34 as .getModules()
    participant P35 as .toggleModule()
    participant P36 as .createInstitution()
    participant P37 as .updateAdminWorkspaces()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P2->>+ P9: calls
    P9-->>- P2: return
    P2->>+ P10: calls
    P10-->>- P2: return
    P2->>+ P11: calls
    P11-->>- P2: return
    P2->>+ P12: calls
    P12-->>- P2: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P8: calls
    P8-->>- P0: return
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
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
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
```

## Connections by Relation

### calls
- [[.getLogs()]] `INFERRED`
- [[.getLogById()]] `INFERRED`
- [[.getNotifications()]] `INFERRED`
- [[.send()]] `INFERRED`
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
- [[.updateStatus()]] `INFERRED`
- [[.getUnreadCount()]] `INFERRED`
- [[.markAsRead()]] `INFERRED`

### contains
- [[api-response.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*