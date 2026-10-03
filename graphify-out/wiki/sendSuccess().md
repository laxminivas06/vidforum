# sendSuccess()

> God node · 151 connections · [C:\Antigravityyyyy\VID_School\backend\src\utils\api-response.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/utils/api-response.ts#L19)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendSuccess()
    participant P1 as .getStaffAttendance()
    participant P2 as sendError()
    participant P3 as tenantMiddleware()
    participant P4 as .getStudentSummary()
    participant P5 as .getLogs()
    participant P6 as .getLogById()
    participant P7 as .recordPayment()
    participant P8 as .getSummary()
    participant P9 as .deleteStaff()
    participant P10 as .markStaffAttendance()
    participant P11 as .getMonthlyAttendanceSummary()
    participant P12 as .getFacultyWorkloads()
    participant P13 as .getPayrollExport()
    participant P14 as .getNotifications()
    participant P15 as .send()
    participant P16 as .checkConflict()
    participant P17 as .createApplication()
    participant P18 as .updateStage()
    participant P19 as .getOrCreateSession()
    participant P20 as .getSessionById()
    participant P21 as .listSessions()
    participant P22 as .getSectionRoster()
    participant P23 as .submitRollCall()
    participant P24 as .getScopedAttendance()
    participant P25 as .applyStudentLeave()
    participant P26 as .listStudentLeaves()
    participant P27 as .decideStudentLeave()
    participant P28 as .recordStaffAttendance()
    participant P29 as .listStaffAttendance()
    participant P30 as .getInstitutionSummary()
    participant P31 as .createExamType()
    participant P32 as .listExamTypes()
    participant P33 as .createExam()
    participant P34 as .getExamById()
    participant P35 as .listExams()
    participant P36 as .updateExamStatus()
    participant P37 as .addExamSubject()
    participant P38 as .listExamSubjects()
    participant P39 as .createExamSchedule()
    participant P40 as .listExamSchedules()
    participant P41 as .createExamRoom()
    participant P42 as .allocateSeating()
    participant P43 as .assignInvigilator()
    participant P44 as .createGradeScale()
    participant P45 as .listGradeScales()
    participant P46 as .addGradeTier()
    participant P47 as .submitMarksBatch()
    participant P48 as .listMarks()
    participant P49 as .verifyMarks()
    participant P50 as .validateExcelImport()
    participant P51 as .commitExcelImport()
    participant P52 as .calculateResults()
    participant P53 as .publishExamResults()
    participant P54 as .getStudentReportCard()
    participant P55 as .listStudentReportCards()
    participant P56 as .listFeeCategories()
    participant P57 as .createFeeCategory()
    participant P58 as .listFeeGroups()
    participant P59 as .createFeeGroup()
    participant P60 as .listFeeStructures()
    participant P61 as .getFeeStructure()
    participant P62 as .createFeeStructure()
    participant P63 as .listDiscounts()
    participant P64 as .createDiscount()
    participant P65 as .listScholarships()
    participant P66 as .createScholarship()
    participant P67 as .assignFeeToStudent()
    participant P68 as .listStudentFees()
    participant P69 as .getStudentFeeLedger()
    participant P70 as .listInvoices()
    participant P71 as .getInvoice()
    participant P72 as .listPayments()
    participant P73 as .getReceipt()
    participant P74 as .processRefund()
    participant P75 as .getScopedFees()
    participant P76 as .listDesignations()
    participant P77 as .createDesignation()
    participant P78 as .listStaff()
    participant P79 as .getStaffDetails()
    participant P80 as .onboardStaff()
    participant P81 as .updateStaff()
    participant P82 as .listLeaveTypes()
    participant P83 as .createLeaveType()
    participant P84 as .listLeaveRequests()
    participant P85 as .applyLeave()
    participant P86 as .actionLeaveRequest()
    participant P87 as .getStaffLeaveBalance()
    participant P88 as .computeStaffWorkload()
    participant P89 as .getUnreadCount()
    participant P90 as .markAsRead()
    participant P91 as .markAllAsRead()
    participant P92 as .listRooms()
    participant P93 as .createRoom()
    participant P94 as .updateRoom()
    participant P95 as .deleteRoom()
    participant P96 as .listPeriods()
    participant P97 as .createPeriod()
    participant P98 as .updatePeriod()
    participant P99 as .deletePeriod()
    participant P100 as .listTimetables()
    participant P101 as .getTimetable()
    participant P102 as .createTimetable()
    participant P103 as .deleteTimetable()
    participant P104 as .auditTimetableConflicts()
    participant P105 as .listEntries()
    participant P106 as .createEntry()
    participant P107 as .deleteEntry()
    participant P108 as .publishTimetable()
    participant P109 as .unpublishTimetable()
    participant P110 as .listSubstitutions()
    participant P111 as .createSubstitution()
    participant P112 as .getScopedSchedule()
    participant P113 as authMiddleware()
    participant P114 as errorMiddleware()
    participant P115 as .handleGatewayWebhook()
    participant P116 as .getStaffAttendanceByDate()
    participant P117 as .getStaffAttendanceHistory()
    participant P118 as .getHierarchy()
    participant P119 as .getFaculty()
    participant P120 as .getGrades()
    participant P121 as .getClasses()
    participant P122 as .getSubjects()
    participant P123 as .approve()
    participant P124 as .getMyProfile()
    participant P125 as .getMyClasses()
    participant P126 as .getMySubjects()
    participant P127 as .getSectionStudents()
    participant P128 as .getFacultyById()
    participant P129 as .createFaculty()
    participant P130 as .createFacultyBulk()
    participant P131 as .getInstitutions()
    participant P132 as .getInstitutionById()
    participant P133 as .getStats()
    participant P134 as .getAdmins()
    participant P135 as .addAdmin()
    participant P136 as .updateStatus()
    participant P137 as .getStudents()
    participant P138 as .getStudentById()
    participant P139 as .promote()
    participant P140 as .getAcademicYears()
    participant P141 as .createAcademicYear()
    participant P142 as .getDepartments()
    participant P143 as .createDepartment()
    participant P144 as .createClass()
    participant P145 as .getClassSections()
    participant P146 as .createSection()
    participant P147 as .getClassSubjects()
    participant P148 as .createSubject()
    participant P149 as .linkSubjectToClass()
    participant P150 as .getAllocations()
    participant P151 as .createAllocation()
    participant P152 as .getApplicants()
    participant P153 as .getApplicationById()
    participant P154 as .getModules()
    participant P155 as .toggleModule()
    participant P156 as .createInstitution()
    participant P157 as .updateAdminWorkspaces()
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
    P2->>+ P13: calls
    P13-->>- P2: return
    P2->>+ P14: calls
    P14-->>- P2: return
    P2->>+ P15: calls
    P15-->>- P2: return
    P2->>+ P16: calls
    P16-->>- P2: return
    P2->>+ P17: calls
    P17-->>- P2: return
    P2->>+ P18: calls
    P18-->>- P2: return
    P2->>+ P19: calls
    P19-->>- P2: return
    P2->>+ P20: calls
    P20-->>- P2: return
    P2->>+ P21: calls
    P21-->>- P2: return
    P2->>+ P22: calls
    P22-->>- P2: return
    P2->>+ P23: calls
    P23-->>- P2: return
    P2->>+ P24: calls
    P24-->>- P2: return
    P2->>+ P25: calls
    P25-->>- P2: return
    P2->>+ P26: calls
    P26-->>- P2: return
    P2->>+ P27: calls
    P27-->>- P2: return
    P2->>+ P28: calls
    P28-->>- P2: return
    P2->>+ P29: calls
    P29-->>- P2: return
    P2->>+ P30: calls
    P30-->>- P2: return
    P2->>+ P31: calls
    P31-->>- P2: return
    P2->>+ P32: calls
    P32-->>- P2: return
    P2->>+ P33: calls
    P33-->>- P2: return
    P2->>+ P34: calls
    P34-->>- P2: return
    P2->>+ P35: calls
    P35-->>- P2: return
    P2->>+ P36: calls
    P36-->>- P2: return
    P2->>+ P37: calls
    P37-->>- P2: return
    P2->>+ P38: calls
    P38-->>- P2: return
    P2->>+ P39: calls
    P39-->>- P2: return
    P2->>+ P40: calls
    P40-->>- P2: return
    P2->>+ P41: calls
    P41-->>- P2: return
    P2->>+ P42: calls
    P42-->>- P2: return
    P2->>+ P43: calls
    P43-->>- P2: return
    P2->>+ P44: calls
    P44-->>- P2: return
    P2->>+ P45: calls
    P45-->>- P2: return
    P2->>+ P46: calls
    P46-->>- P2: return
    P2->>+ P47: calls
    P47-->>- P2: return
    P2->>+ P48: calls
    P48-->>- P2: return
    P2->>+ P49: calls
    P49-->>- P2: return
    P2->>+ P50: calls
    P50-->>- P2: return
    P2->>+ P51: calls
    P51-->>- P2: return
    P2->>+ P52: calls
    P52-->>- P2: return
    P2->>+ P53: calls
    P53-->>- P2: return
    P2->>+ P54: calls
    P54-->>- P2: return
    P2->>+ P55: calls
    P55-->>- P2: return
    P2->>+ P56: calls
    P56-->>- P2: return
    P2->>+ P57: calls
    P57-->>- P2: return
    P2->>+ P58: calls
    P58-->>- P2: return
    P2->>+ P59: calls
    P59-->>- P2: return
    P2->>+ P60: calls
    P60-->>- P2: return
    P2->>+ P61: calls
    P61-->>- P2: return
    P2->>+ P62: calls
    P62-->>- P2: return
    P2->>+ P63: calls
    P63-->>- P2: return
    P2->>+ P64: calls
    P64-->>- P2: return
    P2->>+ P65: calls
    P65-->>- P2: return
    P2->>+ P66: calls
    P66-->>- P2: return
    P2->>+ P67: calls
    P67-->>- P2: return
    P2->>+ P68: calls
    P68-->>- P2: return
    P2->>+ P69: calls
    P69-->>- P2: return
    P2->>+ P70: calls
    P70-->>- P2: return
    P2->>+ P71: calls
    P71-->>- P2: return
    P2->>+ P72: calls
    P72-->>- P2: return
    P2->>+ P73: calls
    P73-->>- P2: return
    P2->>+ P74: calls
    P74-->>- P2: return
    P2->>+ P75: calls
    P75-->>- P2: return
    P2->>+ P76: calls
    P76-->>- P2: return
    P2->>+ P77: calls
    P77-->>- P2: return
    P2->>+ P78: calls
    P78-->>- P2: return
    P2->>+ P79: calls
    P79-->>- P2: return
    P2->>+ P80: calls
    P80-->>- P2: return
    P2->>+ P81: calls
    P81-->>- P2: return
    P2->>+ P82: calls
    P82-->>- P2: return
    P2->>+ P83: calls
    P83-->>- P2: return
    P2->>+ P84: calls
    P84-->>- P2: return
    P2->>+ P85: calls
    P85-->>- P2: return
    P2->>+ P86: calls
    P86-->>- P2: return
    P2->>+ P87: calls
    P87-->>- P2: return
    P2->>+ P88: calls
    P88-->>- P2: return
    P2->>+ P89: calls
    P89-->>- P2: return
    P2->>+ P90: calls
    P90-->>- P2: return
    P2->>+ P91: calls
    P91-->>- P2: return
    P2->>+ P92: calls
    P92-->>- P2: return
    P2->>+ P93: calls
    P93-->>- P2: return
    P2->>+ P94: calls
    P94-->>- P2: return
    P2->>+ P95: calls
    P95-->>- P2: return
    P2->>+ P96: calls
    P96-->>- P2: return
    P2->>+ P97: calls
    P97-->>- P2: return
    P2->>+ P98: calls
    P98-->>- P2: return
    P2->>+ P99: calls
    P99-->>- P2: return
    P2->>+ P100: calls
    P100-->>- P2: return
    P2->>+ P101: calls
    P101-->>- P2: return
    P2->>+ P102: calls
    P102-->>- P2: return
    P2->>+ P103: calls
    P103-->>- P2: return
    P2->>+ P104: calls
    P104-->>- P2: return
    P2->>+ P105: calls
    P105-->>- P2: return
    P2->>+ P106: calls
    P106-->>- P2: return
    P2->>+ P107: calls
    P107-->>- P2: return
    P2->>+ P108: calls
    P108-->>- P2: return
    P2->>+ P109: calls
    P109-->>- P2: return
    P2->>+ P110: calls
    P110-->>- P2: return
    P2->>+ P111: calls
    P111-->>- P2: return
    P2->>+ P112: calls
    P112-->>- P2: return
    P2->>+ P113: calls
    P113-->>- P2: return
    P2->>+ P114: calls
    P114-->>- P2: return
    P2->>+ P115: calls
    P115-->>- P2: return
    P1->>+ P116: calls
    P116-->>- P1: return
    P1->>+ P117: calls
    P117-->>- P1: return
    P0->>+ P118: calls
    P118-->>- P0: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P0->>+ P119: calls
    P119-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
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
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P120: calls
    P120-->>- P0: return
    P0->>+ P121: calls
    P121-->>- P0: return
    P0->>+ P122: calls
    P122-->>- P0: return
    P0->>+ P17: calls
    P17-->>- P0: return
    P0->>+ P18: calls
    P18-->>- P0: return
    P0->>+ P123: calls
    P123-->>- P0: return
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
    P0->>+ P54: calls
    P54-->>- P0: return
    P0->>+ P55: calls
    P55-->>- P0: return
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
    P0->>+ P74: calls
    P74-->>- P0: return
    P0->>+ P75: calls
    P75-->>- P0: return
    P0->>+ P76: calls
    P76-->>- P0: return
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
    P0->>+ P136: calls
    P136-->>- P0: return
    P0->>+ P89: calls
    P89-->>- P0: return
    P0->>+ P90: calls
    P90-->>- P0: return
    P0->>+ P91: calls
    P91-->>- P0: return
    P0->>+ P137: calls
    P137-->>- P0: return
    P0->>+ P138: calls
    P138-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
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
    P0->>+ P98: calls
    P98-->>- P0: return
    P0->>+ P99: calls
    P99-->>- P0: return
    P0->>+ P100: calls
    P100-->>- P0: return
    P0->>+ P101: calls
    P101-->>- P0: return
    P0->>+ P102: calls
    P102-->>- P0: return
    P0->>+ P103: calls
    P103-->>- P0: return
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
    P0->>+ P109: calls
    P109-->>- P0: return
    P0->>+ P110: calls
    P110-->>- P0: return
    P0->>+ P111: calls
    P111-->>- P0: return
    P0->>+ P112: calls
    P112-->>- P0: return
    P0->>+ P140: calls
    P140-->>- P0: return
    P0->>+ P141: calls
    P141-->>- P0: return
    P0->>+ P142: calls
    P142-->>- P0: return
    P0->>+ P143: calls
    P143-->>- P0: return
    P0->>+ P144: calls
    P144-->>- P0: return
    P0->>+ P145: calls
    P145-->>- P0: return
    P0->>+ P146: calls
    P146-->>- P0: return
    P0->>+ P147: calls
    P147-->>- P0: return
    P0->>+ P148: calls
    P148-->>- P0: return
    P0->>+ P149: calls
    P149-->>- P0: return
    P0->>+ P150: calls
    P150-->>- P0: return
    P0->>+ P151: calls
    P151-->>- P0: return
    P0->>+ P152: calls
    P152-->>- P0: return
    P0->>+ P153: calls
    P153-->>- P0: return
    P0->>+ P154: calls
    P154-->>- P0: return
    P0->>+ P155: calls
    P155-->>- P0: return
    P0->>+ P156: calls
    P156-->>- P0: return
    P0->>+ P157: calls
    P157-->>- P0: return
```

## Connections by Relation

### calls
- [[.getStaffAttendance()]] `INFERRED`
- [[.getHierarchy()]] `INFERRED`
- [[.getStudentSummary()]] `INFERRED`
- [[.getLogs()]] `INFERRED`
- [[.getLogById()]] `INFERRED`
- [[.getFaculty()]] `INFERRED`
- [[.recordPayment()]] `INFERRED`
- [[.getSummary()]] `INFERRED`
- [[.deleteStaff()]] `INFERRED`
- [[.markStaffAttendance()]] `INFERRED`
- [[.getMonthlyAttendanceSummary()]] `INFERRED`
- [[.getFacultyWorkloads()]] `INFERRED`
- [[.getPayrollExport()]] `INFERRED`
- [[.getNotifications()]] `INFERRED`
- [[.send()]] `INFERRED`
- [[.checkConflict()]] `INFERRED`
- [[.getGrades()]] `INFERRED`
- [[.getClasses()]] `INFERRED`
- [[.getSubjects()]] `INFERRED`
- [[.createApplication()]] `INFERRED`

### contains
- [[api-response.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*