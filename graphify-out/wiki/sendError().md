# sendError()

> God node · 155 connections · [C:\Antigravityyyyy\VID_School\backend\src\utils\api-response.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/utils/api-response.ts#L48)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendError()
    participant P1 as status
    participant P2 as sendSuccess()
    participant P3 as .addDocument()
    participant P4 as .getStaffAttendance()
    participant P5 as .getExamEstimates()
    participant P6 as .getCalendarConfig()
    participant P7 as .getCalendarDays()
    participant P8 as .checkWorkingDay()
    participant P9 as .getWorkingDaysCount()
    participant P10 as .getTextbooks()
    participant P11 as .getBooklist()
    participant P12 as .convertEnquiry()
    participant P13 as .getStudentSummary()
    participant P14 as .getLogs()
    participant P15 as .getLogById()
    participant P16 as .getFaculty()
    participant P17 as .recordPayment()
    participant P18 as .getSummary()
    participant P19 as .deleteStaff()
    participant P20 as .markStaffAttendance()
    participant P21 as .getMonthlyAttendanceSummary()
    participant P22 as .getFacultyWorkloads()
    participant P23 as .getPayrollExport()
    participant P24 as .getNotifications()
    participant P25 as .send()
    participant P26 as .promote()
    participant P27 as .checkConflict()
    participant P28 as .createEntry()
    participant P29 as .publishTimetable()
    participant P30 as .getAcademicYears()
    participant P31 as .getAcademicYearById()
    participant P32 as .createAcademicYear()
    participant P33 as .cloneAcademicYear()
    participant P34 as .getGrades()
    participant P35 as .createClass()
    participant P36 as .deleteClass()
    participant P37 as .generateClassMatrix()
    participant P38 as .createSection()
    participant P39 as .deleteSection()
    participant P40 as .createSubject()
    participant P41 as .updateSubject()
    participant P42 as .deleteSubject()
    participant P43 as .mapSubjectToGrade()
    participant P44 as .copySubjectMatrix()
    participant P45 as .createExamEstimate()
    participant P46 as .saveCalendarConfig()
    participant P47 as .createCalendarDay()
    participant P48 as .createTextbook()
    participant P49 as .createEnquiry()
    participant P50 as .createApplication()
    participant P51 as .bulkImport()
    participant P52 as .updateStage()
    participant P53 as .approve()
    participant P54 as .getDocuments()
    participant P55 as .updateDocumentStatus()
    participant P56 as .getEnrolled()
    participant P57 as .getOrCreateSession()
    participant P58 as .getSessionById()
    participant P59 as .listSessions()
    participant P60 as .getSectionRoster()
    participant P61 as .submitRollCall()
    participant P62 as .getScopedAttendance()
    participant P63 as .applyStudentLeave()
    participant P64 as .listStudentLeaves()
    participant P65 as .decideStudentLeave()
    participant P66 as .recordStaffAttendance()
    participant P67 as .listStaffAttendance()
    participant P68 as .getInstitutionSummary()
    participant P69 as .createExamType()
    participant P70 as .listExamTypes()
    participant P71 as .createExam()
    participant P72 as .getExamById()
    participant P73 as .listExams()
    participant P74 as .updateExamStatus()
    participant P75 as .addExamSubject()
    participant P76 as .listExamSubjects()
    participant P77 as .createExamSchedule()
    participant P78 as .listExamSchedules()
    participant P79 as .createExamRoom()
    participant P80 as .allocateSeating()
    participant P81 as .assignInvigilator()
    participant P82 as .createGradeScale()
    participant P83 as .listGradeScales()
    participant P84 as .addGradeTier()
    participant P85 as .submitMarksBatch()
    participant P86 as .listMarks()
    participant P87 as .verifyMarks()
    participant P88 as .validateExcelImport()
    participant P89 as .commitExcelImport()
    participant P90 as .calculateResults()
    participant P91 as .publishExamResults()
    participant P92 as .getStudentReportCard()
    participant P93 as .listStudentReportCards()
    participant P94 as .getMyProfile()
    participant P95 as .getMyClasses()
    participant P96 as .getMySubjects()
    participant P97 as .getSectionStudents()
    participant P98 as .getFacultyById()
    participant P99 as .createFaculty()
    participant P100 as .createFacultyBulk()
    participant P101 as .listFeeCategories()
    participant P102 as .createFeeCategory()
    participant P103 as .listFeeGroups()
    participant P104 as .createFeeGroup()
    participant P105 as .listFeeStructures()
    participant P106 as .getFeeStructure()
    participant P107 as .createFeeStructure()
    participant P108 as .listDiscounts()
    participant P109 as .createDiscount()
    participant P110 as .listScholarships()
    participant P111 as .createScholarship()
    participant P112 as .assignFeeToStudent()
    participant P113 as .listStudentFees()
    participant P114 as .getStudentFeeLedger()
    participant P115 as .listInvoices()
    participant P116 as .getInvoice()
    participant P117 as .listPayments()
    participant P118 as .getReceipt()
    participant P119 as .processRefund()
    participant P120 as .getScopedFees()
    participant P121 as .listDesignations()
    participant P122 as .createDesignation()
    participant P123 as .deleteDesignation()
    participant P124 as .listDepartments()
    participant P125 as .createDepartment()
    participant P126 as .deleteDepartment()
    participant P127 as .listStaff()
    participant P128 as .getStaffDetails()
    participant P129 as .onboardStaff()
    participant P130 as .updateStaff()
    participant P131 as .listLeaveTypes()
    participant P132 as .createLeaveType()
    participant P133 as .listLeaveRequests()
    participant P134 as .applyLeave()
    participant P135 as .actionLeaveRequest()
    participant P136 as .getStaffLeaveBalance()
    participant P137 as .computeStaffWorkload()
    participant P138 as .checkDuplicateStaff()
    participant P139 as .markAllStaffPresent()
    participant P140 as .getHRReportSummary()
    participant P141 as .getInstitutions()
    participant P142 as .getInstitutionById()
    participant P143 as .getStats()
    participant P144 as .getAdmins()
    participant P145 as .addAdmin()
    participant P146 as .updateStatus()
    participant P147 as .getUnreadCount()
    participant P148 as .markAsRead()
    participant P149 as .markAllAsRead()
    participant P150 as .getStudents()
    participant P151 as .getStudentById()
    participant P152 as .createStudent()
    participant P153 as .getEnrollmentCounts()
    participant P154 as .bulkImport()
    participant P155 as .listRooms()
    participant P156 as .createRoom()
    participant P157 as .updateRoom()
    participant P158 as .deleteRoom()
    participant P159 as .listPeriods()
    participant P160 as .createPeriod()
    participant P161 as .updatePeriod()
    participant P162 as .deletePeriod()
    participant P163 as .listTimetables()
    participant P164 as .getTimetable()
    participant P165 as .createTimetable()
    participant P166 as .deleteTimetable()
    participant P167 as .auditTimetableConflicts()
    participant P168 as .listEntries()
    participant P169 as .deleteEntry()
    participant P170 as .unpublishTimetable()
    participant P171 as .listSubstitutions()
    participant P172 as .createSubstitution()
    participant P173 as .getScopedSchedule()
    participant P174 as .updateAcademicYear()
    participant P175 as .setCurrentAcademicYear()
    participant P176 as .closeAcademicYear()
    participant P177 as .getClasses()
    participant P178 as .updateClass()
    participant P179 as .getClassSections()
    participant P180 as .updateSection()
    participant P181 as .getSubjects()
    participant P182 as .getClassSubjects()
    participant P183 as .getGradeSubjects()
    participant P184 as .removeSubjectFromGrade()
    participant P185 as .linkSubjectToClass()
    participant P186 as .updateExamEstimate()
    participant P187 as .deleteExamEstimate()
    participant P188 as .deleteCalendarDay()
    participant P189 as .updateTextbook()
    participant P190 as .deleteTextbook()
    participant P191 as .getHierarchy()
    participant P192 as .getDepartments()
    participant P193 as .createDepartment()
    participant P194 as .getAllocations()
    participant P195 as .createAllocation()
    participant P196 as .getEnquiries()
    participant P197 as .getApplicants()
    participant P198 as .getApplicationById()
    participant P199 as .getPipelineStats()
    participant P200 as .getModules()
    participant P201 as .toggleModule()
    participant P202 as .createInstitution()
    participant P203 as .updateAdminWorkspaces()
    participant P204 as .updateStudent()
    participant P205 as .handleGatewayWebhook()
    participant P206 as sendPaginated()
    participant P207 as tenantMiddleware()
    participant P208 as authMiddleware()
    participant P209 as errorMiddleware()
    P0->>+ P1: calls
    P1-->>- P0: return
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
    P2->>+ P116: calls
    P116-->>- P2: return
    P2->>+ P117: calls
    P117-->>- P2: return
    P2->>+ P118: calls
    P118-->>- P2: return
    P2->>+ P119: calls
    P119-->>- P2: return
    P2->>+ P120: calls
    P120-->>- P2: return
    P2->>+ P121: calls
    P121-->>- P2: return
    P2->>+ P122: calls
    P122-->>- P2: return
    P2->>+ P123: calls
    P123-->>- P2: return
    P2->>+ P124: calls
    P124-->>- P2: return
    P2->>+ P125: calls
    P125-->>- P2: return
    P2->>+ P126: calls
    P126-->>- P2: return
    P2->>+ P127: calls
    P127-->>- P2: return
    P2->>+ P128: calls
    P128-->>- P2: return
    P2->>+ P129: calls
    P129-->>- P2: return
    P2->>+ P130: calls
    P130-->>- P2: return
    P2->>+ P131: calls
    P131-->>- P2: return
    P2->>+ P132: calls
    P132-->>- P2: return
    P2->>+ P133: calls
    P133-->>- P2: return
    P2->>+ P134: calls
    P134-->>- P2: return
    P2->>+ P135: calls
    P135-->>- P2: return
    P2->>+ P136: calls
    P136-->>- P2: return
    P2->>+ P137: calls
    P137-->>- P2: return
    P2->>+ P138: calls
    P138-->>- P2: return
    P2->>+ P139: calls
    P139-->>- P2: return
    P2->>+ P140: calls
    P140-->>- P2: return
    P2->>+ P141: calls
    P141-->>- P2: return
    P2->>+ P142: calls
    P142-->>- P2: return
    P2->>+ P143: calls
    P143-->>- P2: return
    P2->>+ P144: calls
    P144-->>- P2: return
    P2->>+ P145: calls
    P145-->>- P2: return
    P2->>+ P146: calls
    P146-->>- P2: return
    P2->>+ P147: calls
    P147-->>- P2: return
    P2->>+ P148: calls
    P148-->>- P2: return
    P2->>+ P149: calls
    P149-->>- P2: return
    P2->>+ P150: calls
    P150-->>- P2: return
    P2->>+ P151: calls
    P151-->>- P2: return
    P2->>+ P152: calls
    P152-->>- P2: return
    P2->>+ P153: calls
    P153-->>- P2: return
    P2->>+ P154: calls
    P154-->>- P2: return
    P2->>+ P155: calls
    P155-->>- P2: return
    P2->>+ P156: calls
    P156-->>- P2: return
    P2->>+ P157: calls
    P157-->>- P2: return
    P2->>+ P158: calls
    P158-->>- P2: return
    P2->>+ P159: calls
    P159-->>- P2: return
    P2->>+ P160: calls
    P160-->>- P2: return
    P2->>+ P161: calls
    P161-->>- P2: return
    P2->>+ P162: calls
    P162-->>- P2: return
    P2->>+ P163: calls
    P163-->>- P2: return
    P2->>+ P164: calls
    P164-->>- P2: return
    P2->>+ P165: calls
    P165-->>- P2: return
    P2->>+ P166: calls
    P166-->>- P2: return
    P2->>+ P167: calls
    P167-->>- P2: return
    P2->>+ P168: calls
    P168-->>- P2: return
    P2->>+ P169: calls
    P169-->>- P2: return
    P2->>+ P170: calls
    P170-->>- P2: return
    P2->>+ P171: calls
    P171-->>- P2: return
    P2->>+ P172: calls
    P172-->>- P2: return
    P2->>+ P173: calls
    P173-->>- P2: return
    P2->>+ P174: calls
    P174-->>- P2: return
    P2->>+ P175: calls
    P175-->>- P2: return
    P2->>+ P176: calls
    P176-->>- P2: return
    P2->>+ P177: calls
    P177-->>- P2: return
    P2->>+ P178: calls
    P178-->>- P2: return
    P2->>+ P179: calls
    P179-->>- P2: return
    P2->>+ P180: calls
    P180-->>- P2: return
    P2->>+ P181: calls
    P181-->>- P2: return
    P2->>+ P182: calls
    P182-->>- P2: return
    P2->>+ P183: calls
    P183-->>- P2: return
    P2->>+ P184: calls
    P184-->>- P2: return
    P2->>+ P185: calls
    P185-->>- P2: return
    P2->>+ P186: calls
    P186-->>- P2: return
    P2->>+ P187: calls
    P187-->>- P2: return
    P2->>+ P188: calls
    P188-->>- P2: return
    P2->>+ P189: calls
    P189-->>- P2: return
    P2->>+ P190: calls
    P190-->>- P2: return
    P2->>+ P191: calls
    P191-->>- P2: return
    P2->>+ P192: calls
    P192-->>- P2: return
    P2->>+ P193: calls
    P193-->>- P2: return
    P2->>+ P194: calls
    P194-->>- P2: return
    P2->>+ P195: calls
    P195-->>- P2: return
    P2->>+ P196: calls
    P196-->>- P2: return
    P2->>+ P197: calls
    P197-->>- P2: return
    P2->>+ P198: calls
    P198-->>- P2: return
    P2->>+ P199: calls
    P199-->>- P2: return
    P2->>+ P200: calls
    P200-->>- P2: return
    P2->>+ P201: calls
    P201-->>- P2: return
    P2->>+ P202: calls
    P202-->>- P2: return
    P2->>+ P203: calls
    P203-->>- P2: return
    P2->>+ P204: calls
    P204-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P28: calls
    P28-->>- P1: return
    P1->>+ P29: calls
    P29-->>- P1: return
    P1->>+ P205: calls
    P205-->>- P1: return
    P1->>+ P206: calls
    P206-->>- P1: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P207: calls
    P207-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P6: calls
    P6-->>- P0: return
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
    P0->>+ P31: calls
    P31-->>- P0: return
    P0->>+ P32: calls
    P32-->>- P0: return
    P0->>+ P33: calls
    P33-->>- P0: return
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
    P0->>+ P55: calls
    P55-->>- P0: return
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
    P0->>+ P113: calls
    P113-->>- P0: return
    P0->>+ P114: calls
    P114-->>- P0: return
    P0->>+ P115: calls
    P115-->>- P0: return
    P0->>+ P116: calls
    P116-->>- P0: return
    P0->>+ P117: calls
    P117-->>- P0: return
    P0->>+ P118: calls
    P118-->>- P0: return
    P0->>+ P205: calls
    P205-->>- P0: return
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
    P0->>+ P136: calls
    P136-->>- P0: return
    P0->>+ P137: calls
    P137-->>- P0: return
    P0->>+ P138: calls
    P138-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
    P0->>+ P140: calls
    P140-->>- P0: return
    P0->>+ P147: calls
    P147-->>- P0: return
    P0->>+ P148: calls
    P148-->>- P0: return
    P0->>+ P149: calls
    P149-->>- P0: return
    P0->>+ P152: calls
    P152-->>- P0: return
    P0->>+ P154: calls
    P154-->>- P0: return
    P0->>+ P155: calls
    P155-->>- P0: return
    P0->>+ P156: calls
    P156-->>- P0: return
    P0->>+ P157: calls
    P157-->>- P0: return
    P0->>+ P158: calls
    P158-->>- P0: return
    P0->>+ P159: calls
    P159-->>- P0: return
    P0->>+ P160: calls
    P160-->>- P0: return
    P0->>+ P161: calls
    P161-->>- P0: return
    P0->>+ P162: calls
    P162-->>- P0: return
    P0->>+ P163: calls
    P163-->>- P0: return
    P0->>+ P164: calls
    P164-->>- P0: return
    P0->>+ P165: calls
    P165-->>- P0: return
    P0->>+ P166: calls
    P166-->>- P0: return
    P0->>+ P167: calls
    P167-->>- P0: return
    P0->>+ P168: calls
    P168-->>- P0: return
    P0->>+ P169: calls
    P169-->>- P0: return
    P0->>+ P170: calls
    P170-->>- P0: return
    P0->>+ P171: calls
    P171-->>- P0: return
    P0->>+ P172: calls
    P172-->>- P0: return
    P0->>+ P173: calls
    P173-->>- P0: return
    P0->>+ P208: calls
    P208-->>- P0: return
    P0->>+ P209: calls
    P209-->>- P0: return
```

## Connections by Relation

### calls
- [[status]] `INFERRED`
- [[.addDocument()]] `INFERRED`
- [[.getStaffAttendance()]] `INFERRED`
- [[tenantMiddleware()]] `INFERRED`
- [[.getExamEstimates()]] `INFERRED`
- [[.getCalendarConfig()]] `INFERRED`
- [[.getCalendarDays()]] `INFERRED`
- [[.checkWorkingDay()]] `INFERRED`
- [[.getWorkingDaysCount()]] `INFERRED`
- [[.getTextbooks()]] `INFERRED`
- [[.getBooklist()]] `INFERRED`
- [[.convertEnquiry()]] `INFERRED`
- [[.getStudentSummary()]] `INFERRED`
- [[.getLogs()]] `INFERRED`
- [[.getLogById()]] `INFERRED`
- [[.recordPayment()]] `INFERRED`
- [[.getSummary()]] `INFERRED`
- [[.deleteStaff()]] `INFERRED`
- [[.markStaffAttendance()]] `INFERRED`
- [[.getMonthlyAttendanceSummary()]] `INFERRED`

### contains
- [[api-response.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*