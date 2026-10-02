# sendSuccess()

> God node · 130 connections · [C:\Antigravityyyyy\VID_School\backend\src\utils\api-response.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/utils/api-response.ts#L19)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendSuccess()
    participant P1 as .getHierarchy()
    participant P2 as .getClasses()
    participant P3 as .getSubjects()
    participant P4 as .getStudentSummary()
    participant P5 as sendError()
    participant P6 as .getLogs()
    participant P7 as .getLogById()
    participant P8 as .recordPayment()
    participant P9 as .getSummary()
    participant P10 as .getNotifications()
    participant P11 as .send()
    participant P12 as .checkConflict()
    participant P13 as authMiddleware()
    participant P14 as tenantMiddleware()
    participant P15 as .createApplication()
    participant P16 as .updateStage()
    participant P17 as .getOrCreateSession()
    participant P18 as .getSessionById()
    participant P19 as .listSessions()
    participant P20 as .getSectionRoster()
    participant P21 as .submitRollCall()
    participant P22 as .getScopedAttendance()
    participant P23 as .applyStudentLeave()
    participant P24 as .listStudentLeaves()
    participant P25 as .decideStudentLeave()
    participant P26 as .recordStaffAttendance()
    participant P27 as .listStaffAttendance()
    participant P28 as .getInstitutionSummary()
    participant P29 as .createExamType()
    participant P30 as .listExamTypes()
    participant P31 as .createExam()
    participant P32 as .getExamById()
    participant P33 as .listExams()
    participant P34 as .updateExamStatus()
    participant P35 as .addExamSubject()
    participant P36 as .listExamSubjects()
    participant P37 as .createExamSchedule()
    participant P38 as .listExamSchedules()
    participant P39 as .createExamRoom()
    participant P40 as .allocateSeating()
    participant P41 as .assignInvigilator()
    participant P42 as .createGradeScale()
    participant P43 as .listGradeScales()
    participant P44 as .addGradeTier()
    participant P45 as .submitMarksBatch()
    participant P46 as .listMarks()
    participant P47 as .verifyMarks()
    participant P48 as .validateExcelImport()
    participant P49 as .commitExcelImport()
    participant P50 as .calculateResults()
    participant P51 as .publishExamResults()
    participant P52 as .getStudentReportCard()
    participant P53 as .listStudentReportCards()
    participant P54 as .listFeeCategories()
    participant P55 as .createFeeCategory()
    participant P56 as .listFeeGroups()
    participant P57 as .createFeeGroup()
    participant P58 as .listFeeStructures()
    participant P59 as .getFeeStructure()
    participant P60 as .createFeeStructure()
    participant P61 as .listDiscounts()
    participant P62 as .createDiscount()
    participant P63 as .listScholarships()
    participant P64 as .createScholarship()
    participant P65 as .assignFeeToStudent()
    participant P66 as .listStudentFees()
    participant P67 as .getStudentFeeLedger()
    participant P68 as .listInvoices()
    participant P69 as .getInvoice()
    participant P70 as .listPayments()
    participant P71 as .getReceipt()
    participant P72 as .processRefund()
    participant P73 as .getScopedFees()
    participant P74 as .getUnreadCount()
    participant P75 as .markAsRead()
    participant P76 as .markAllAsRead()
    participant P77 as .listRooms()
    participant P78 as .createRoom()
    participant P79 as .updateRoom()
    participant P80 as .deleteRoom()
    participant P81 as .listPeriods()
    participant P82 as .createPeriod()
    participant P83 as .updatePeriod()
    participant P84 as .deletePeriod()
    participant P85 as .listTimetables()
    participant P86 as .getTimetable()
    participant P87 as .createTimetable()
    participant P88 as .deleteTimetable()
    participant P89 as .auditTimetableConflicts()
    participant P90 as .listEntries()
    participant P91 as .createEntry()
    participant P92 as .deleteEntry()
    participant P93 as .publishTimetable()
    participant P94 as .unpublishTimetable()
    participant P95 as .listSubstitutions()
    participant P96 as .createSubstitution()
    participant P97 as .getScopedSchedule()
    participant P98 as errorMiddleware()
    participant P99 as .handleGatewayWebhook()
    participant P100 as .getStudentAttendanceSummary()
    participant P101 as .getFaculty()
    participant P102 as .getGrades()
    participant P103 as .approve()
    participant P104 as .getMyProfile()
    participant P105 as .getMyClasses()
    participant P106 as .getMySubjects()
    participant P107 as .getSectionStudents()
    participant P108 as .getFacultyById()
    participant P109 as .getInstitutions()
    participant P110 as .getInstitutionById()
    participant P111 as .getStats()
    participant P112 as .getAdmins()
    participant P113 as .addAdmin()
    participant P114 as .updateStatus()
    participant P115 as .getStudents()
    participant P116 as .getStudentById()
    participant P117 as .promote()
    participant P118 as .getAcademicYears()
    participant P119 as .createAcademicYear()
    participant P120 as .getDepartments()
    participant P121 as .createDepartment()
    participant P122 as .createClass()
    participant P123 as .getClassSections()
    participant P124 as .createSection()
    participant P125 as .getClassSubjects()
    participant P126 as .createSubject()
    participant P127 as .linkSubjectToClass()
    participant P128 as .getAllocations()
    participant P129 as .createAllocation()
    participant P130 as .getApplicants()
    participant P131 as .getApplicationById()
    participant P132 as .getModules()
    participant P133 as .toggleModule()
    participant P134 as .createInstitution()
    participant P135 as .updateAdminWorkspaces()
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
    P1->>+ P3: calls
    P3-->>- P1: return
    P3->>+ P0: calls
    P0-->>- P3: return
    P3->>+ P1: calls
    P1-->>- P3: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P4->>+ P0: calls
    P0-->>- P4: return
    P4->>+ P5: calls
    P5-->>- P4: return
    P5->>+ P4: calls
    P4-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P5->>+ P7: calls
    P7-->>- P5: return
    P5->>+ P8: calls
    P8-->>- P5: return
    P5->>+ P9: calls
    P9-->>- P5: return
    P5->>+ P10: calls
    P10-->>- P5: return
    P5->>+ P11: calls
    P11-->>- P5: return
    P5->>+ P12: calls
    P12-->>- P5: return
    P5->>+ P13: calls
    P13-->>- P5: return
    P5->>+ P14: calls
    P14-->>- P5: return
    P5->>+ P15: calls
    P15-->>- P5: return
    P5->>+ P16: calls
    P16-->>- P5: return
    P5->>+ P17: calls
    P17-->>- P5: return
    P5->>+ P18: calls
    P18-->>- P5: return
    P5->>+ P19: calls
    P19-->>- P5: return
    P5->>+ P20: calls
    P20-->>- P5: return
    P5->>+ P21: calls
    P21-->>- P5: return
    P5->>+ P22: calls
    P22-->>- P5: return
    P5->>+ P23: calls
    P23-->>- P5: return
    P5->>+ P24: calls
    P24-->>- P5: return
    P5->>+ P25: calls
    P25-->>- P5: return
    P5->>+ P26: calls
    P26-->>- P5: return
    P5->>+ P27: calls
    P27-->>- P5: return
    P5->>+ P28: calls
    P28-->>- P5: return
    P5->>+ P29: calls
    P29-->>- P5: return
    P5->>+ P30: calls
    P30-->>- P5: return
    P5->>+ P31: calls
    P31-->>- P5: return
    P5->>+ P32: calls
    P32-->>- P5: return
    P5->>+ P33: calls
    P33-->>- P5: return
    P5->>+ P34: calls
    P34-->>- P5: return
    P5->>+ P35: calls
    P35-->>- P5: return
    P5->>+ P36: calls
    P36-->>- P5: return
    P5->>+ P37: calls
    P37-->>- P5: return
    P5->>+ P38: calls
    P38-->>- P5: return
    P5->>+ P39: calls
    P39-->>- P5: return
    P5->>+ P40: calls
    P40-->>- P5: return
    P5->>+ P41: calls
    P41-->>- P5: return
    P5->>+ P42: calls
    P42-->>- P5: return
    P5->>+ P43: calls
    P43-->>- P5: return
    P5->>+ P44: calls
    P44-->>- P5: return
    P5->>+ P45: calls
    P45-->>- P5: return
    P5->>+ P46: calls
    P46-->>- P5: return
    P5->>+ P47: calls
    P47-->>- P5: return
    P5->>+ P48: calls
    P48-->>- P5: return
    P5->>+ P49: calls
    P49-->>- P5: return
    P5->>+ P50: calls
    P50-->>- P5: return
    P5->>+ P51: calls
    P51-->>- P5: return
    P5->>+ P52: calls
    P52-->>- P5: return
    P5->>+ P53: calls
    P53-->>- P5: return
    P5->>+ P54: calls
    P54-->>- P5: return
    P5->>+ P55: calls
    P55-->>- P5: return
    P5->>+ P56: calls
    P56-->>- P5: return
    P5->>+ P57: calls
    P57-->>- P5: return
    P5->>+ P58: calls
    P58-->>- P5: return
    P5->>+ P59: calls
    P59-->>- P5: return
    P5->>+ P60: calls
    P60-->>- P5: return
    P5->>+ P61: calls
    P61-->>- P5: return
    P5->>+ P62: calls
    P62-->>- P5: return
    P5->>+ P63: calls
    P63-->>- P5: return
    P5->>+ P64: calls
    P64-->>- P5: return
    P5->>+ P65: calls
    P65-->>- P5: return
    P5->>+ P66: calls
    P66-->>- P5: return
    P5->>+ P67: calls
    P67-->>- P5: return
    P5->>+ P68: calls
    P68-->>- P5: return
    P5->>+ P69: calls
    P69-->>- P5: return
    P5->>+ P70: calls
    P70-->>- P5: return
    P5->>+ P71: calls
    P71-->>- P5: return
    P5->>+ P72: calls
    P72-->>- P5: return
    P5->>+ P73: calls
    P73-->>- P5: return
    P5->>+ P74: calls
    P74-->>- P5: return
    P5->>+ P75: calls
    P75-->>- P5: return
    P5->>+ P76: calls
    P76-->>- P5: return
    P5->>+ P77: calls
    P77-->>- P5: return
    P5->>+ P78: calls
    P78-->>- P5: return
    P5->>+ P79: calls
    P79-->>- P5: return
    P5->>+ P80: calls
    P80-->>- P5: return
    P5->>+ P81: calls
    P81-->>- P5: return
    P5->>+ P82: calls
    P82-->>- P5: return
    P5->>+ P83: calls
    P83-->>- P5: return
    P5->>+ P84: calls
    P84-->>- P5: return
    P5->>+ P85: calls
    P85-->>- P5: return
    P5->>+ P86: calls
    P86-->>- P5: return
    P5->>+ P87: calls
    P87-->>- P5: return
    P5->>+ P88: calls
    P88-->>- P5: return
    P5->>+ P89: calls
    P89-->>- P5: return
    P5->>+ P90: calls
    P90-->>- P5: return
    P5->>+ P91: calls
    P91-->>- P5: return
    P5->>+ P92: calls
    P92-->>- P5: return
    P5->>+ P93: calls
    P93-->>- P5: return
    P5->>+ P94: calls
    P94-->>- P5: return
    P5->>+ P95: calls
    P95-->>- P5: return
    P5->>+ P96: calls
    P96-->>- P5: return
    P5->>+ P97: calls
    P97-->>- P5: return
    P5->>+ P98: calls
    P98-->>- P5: return
    P5->>+ P99: calls
    P99-->>- P5: return
    P4->>+ P100: calls
    P100-->>- P4: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P0->>+ P101: calls
    P101-->>- P0: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P102: calls
    P102-->>- P0: return
    P0->>+ P2: calls
    P2-->>- P0: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P103: calls
    P103-->>- P0: return
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
    P0->>+ P53: calls
    P53-->>- P0: return
    P0->>+ P104: calls
    P104-->>- P0: return
    P0->>+ P105: calls
    P105-->>- P0: return
    P0->>+ P106: calls
    P106-->>- P0: return
    P0->>+ P107: calls
    P107-->>- P0: return
    P0->>+ P108: calls
    P108-->>- P0: return
    P0->>+ P54: calls
    P54-->>- P0: return
    P0->>+ P55: calls
    P55-->>- P0: return
    P0->>+ P56: calls
    P56-->>- P0: return
    P0->>+ P57: calls
    P57-->>- P0: return
    P0->>+ P58: calls
    P58-->>- P0: return
    P0->>+ P59: calls
    P59-->>- P0: return
    P0->>+ P60: calls
    P60-->>- P0: return
    P0->>+ P61: calls
    P61-->>- P0: return
    P0->>+ P62: calls
    P62-->>- P0: return
    P0->>+ P63: calls
    P63-->>- P0: return
    P0->>+ P64: calls
    P64-->>- P0: return
    P0->>+ P65: calls
    P65-->>- P0: return
    P0->>+ P66: calls
    P66-->>- P0: return
    P0->>+ P67: calls
    P67-->>- P0: return
    P0->>+ P68: calls
    P68-->>- P0: return
    P0->>+ P69: calls
    P69-->>- P0: return
    P0->>+ P70: calls
    P70-->>- P0: return
    P0->>+ P71: calls
    P71-->>- P0: return
    P0->>+ P72: calls
    P72-->>- P0: return
    P0->>+ P73: calls
    P73-->>- P0: return
    P0->>+ P109: calls
    P109-->>- P0: return
    P0->>+ P110: calls
    P110-->>- P0: return
    P0->>+ P111: calls
    P111-->>- P0: return
    P0->>+ P112: calls
    P112-->>- P0: return
    P0->>+ P113: calls
    P113-->>- P0: return
    P0->>+ P114: calls
    P114-->>- P0: return
    P0->>+ P74: calls
    P74-->>- P0: return
    P0->>+ P75: calls
    P75-->>- P0: return
    P0->>+ P76: calls
    P76-->>- P0: return
    P0->>+ P115: calls
    P115-->>- P0: return
    P0->>+ P116: calls
    P116-->>- P0: return
    P0->>+ P117: calls
    P117-->>- P0: return
    P0->>+ P77: calls
    P77-->>- P0: return
    P0->>+ P78: calls
    P78-->>- P0: return
    P0->>+ P79: calls
    P79-->>- P0: return
    P0->>+ P80: calls
    P80-->>- P0: return
    P0->>+ P81: calls
    P81-->>- P0: return
    P0->>+ P82: calls
    P82-->>- P0: return
    P0->>+ P83: calls
    P83-->>- P0: return
    P0->>+ P84: calls
    P84-->>- P0: return
    P0->>+ P85: calls
    P85-->>- P0: return
    P0->>+ P86: calls
    P86-->>- P0: return
    P0->>+ P87: calls
    P87-->>- P0: return
    P0->>+ P88: calls
    P88-->>- P0: return
    P0->>+ P89: calls
    P89-->>- P0: return
    P0->>+ P90: calls
    P90-->>- P0: return
    P0->>+ P91: calls
    P91-->>- P0: return
    P0->>+ P92: calls
    P92-->>- P0: return
    P0->>+ P93: calls
    P93-->>- P0: return
    P0->>+ P94: calls
    P94-->>- P0: return
    P0->>+ P95: calls
    P95-->>- P0: return
    P0->>+ P96: calls
    P96-->>- P0: return
    P0->>+ P97: calls
    P97-->>- P0: return
    P0->>+ P118: calls
    P118-->>- P0: return
    P0->>+ P119: calls
    P119-->>- P0: return
    P0->>+ P120: calls
    P120-->>- P0: return
    P0->>+ P121: calls
    P121-->>- P0: return
    P0->>+ P122: calls
    P122-->>- P0: return
    P0->>+ P123: calls
    P123-->>- P0: return
    P0->>+ P124: calls
    P124-->>- P0: return
    P0->>+ P125: calls
    P125-->>- P0: return
    P0->>+ P126: calls
    P126-->>- P0: return
    P0->>+ P127: calls
    P127-->>- P0: return
    P0->>+ P128: calls
    P128-->>- P0: return
    P0->>+ P129: calls
    P129-->>- P0: return
    P0->>+ P130: calls
    P130-->>- P0: return
    P0->>+ P131: calls
    P131-->>- P0: return
    P0->>+ P132: calls
    P132-->>- P0: return
    P0->>+ P133: calls
    P133-->>- P0: return
    P0->>+ P134: calls
    P134-->>- P0: return
    P0->>+ P135: calls
    P135-->>- P0: return
```

## Connections by Relation

### calls
- [[.getHierarchy()]] `INFERRED`
- [[.getStudentSummary()]] `INFERRED`
- [[.getLogs()]] `INFERRED`
- [[.getLogById()]] `INFERRED`
- [[.getFaculty()]] `INFERRED`
- [[.recordPayment()]] `INFERRED`
- [[.getSummary()]] `INFERRED`
- [[.getNotifications()]] `INFERRED`
- [[.send()]] `INFERRED`
- [[.checkConflict()]] `INFERRED`
- [[.getGrades()]] `INFERRED`
- [[.getClasses()]] `INFERRED`
- [[.getSubjects()]] `INFERRED`
- [[.createApplication()]] `INFERRED`
- [[.updateStage()]] `INFERRED`
- [[.approve()]] `INFERRED`
- [[.getOrCreateSession()]] `INFERRED`
- [[.getSessionById()]] `INFERRED`
- [[.listSessions()]] `INFERRED`
- [[.getSectionRoster()]] `INFERRED`

### contains
- [[api-response.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*