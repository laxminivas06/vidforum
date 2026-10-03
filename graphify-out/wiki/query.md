# query

> God node · 217 connections · [C:\Antigravityyyyy\VID_School\backend\src\modules\users\users.routes.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/users/users.routes.ts#L446)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as query
    participant P1 as .dispatch()
    participant P2 as .generateBonafideCertificate()
    participant P3 as .sendNotification()
    participant P4 as .verifyDocument()
    participant P5 as .createDocument()
    participant P6 as .createDocumentType()
    participant P7 as .getStudentCertificateDetails()
    participant P8 as .getDocumentTypeByCode()
    participant P9 as .onboardStaff()
    participant P10 as .recordEmploymentHistory()
    participant P11 as .linkFacultyRecord()
    participant P12 as .findStaffByEmployeeCode()
    participant P13 as .findStaffByProfileId()
    participant P14 as .createStaff()
    participant P15 as .submitRollCall()
    participant P16 as .generateTransferCertificate()
    participant P17 as .requestDocument()
    participant P18 as .updateStaff()
    participant P19 as .applyLeave()
    participant P20 as .actionLeaveRequest()
    participant P21 as .uploadDocument()
    participant P22 as .publishExamResults()
    participant P23 as .publishTimetable()
    participant P24 as tenantMiddleware()
    participant P25 as .executeApprovalTransaction()
    participant P26 as .applyStudentLeave()
    participant P27 as .decideStudentLeave()
    participant P28 as .deleteDocument()
    participant P29 as .processDocumentRequest()
    participant P30 as .submitMarksBatch()
    participant P31 as .commitExcelImport()
    participant P32 as .processPayment()
    participant P33 as .softDeleteStaff()
    participant P34 as .markStaffAttendanceBatch()
    participant P35 as .getOrCreateSession()
    participant P36 as .createTemplate()
    participant P37 as .calculateResults()
    participant P38 as .unpublishTimetable()
    participant P39 as .updateTemplate()
    participant P40 as .deleteTemplate()
    participant P41 as .createExamType()
    participant P42 as .createExam()
    participant P43 as .updateExamStatus()
    participant P44 as .addExamSubject()
    participant P45 as .createExamSchedule()
    participant P46 as .verifyMarks()
    participant P47 as .createFeeStructure()
    participant P48 as .assignFeeToStudent()
    participant P49 as .processRefund()
    participant P50 as .createDesignation()
    participant P51 as .createLeaveType()
    participant P52 as .createSubstitution()
    participant P53 as .findByIdOrCode()
    participant P54 as runR4Verification()
    participant P55 as .verifyParentChildLink()
    participant P56 as .createLog()
    participant P57 as .calculateExamResults()
    participant P58 as .getStaffById()
    participant P59 as .provisionUser()
    participant P60 as .getDocumentTypeById()
    participant P61 as .findDocumentById()
    participant P62 as .verifyFacultySubjectAllocation()
    participant P63 as .verifyFacultySectionAccess()
    participant P64 as .reset()
    participant P65 as .getExamSubjectById()
    participant P66 as .validateImportBatch()
    participant P67 as .findFacultyByProfileId()
    participant P68 as .getScopedFees()
    participant P69 as .findModules()
    participant P70 as .listEntries()
    participant P71 as .checkCandidateConflicts()
    participant P72 as .updateUserAccess()
    participant P73 as .resetCredentials()
    participant P74 as findById()
    participant P75 as .findApplicationById()
    participant P76 as .getInstitutionAttendanceStats()
    participant P77 as .getStudentAttendanceSummary()
    participant P78 as .getScopedAttendance()
    participant P79 as .isLocked()
    participant P80 as .recordFailure()
    participant P81 as .findLoginSubject()
    participant P82 as .findTemplateById()
    participant P83 as .verifyStudentExists()
    participant P84 as .verifyStaffExists()
    participant P85 as .getExamById()
    participant P86 as .listMarks()
    participant P87 as .getStudentReportCard()
    participant P88 as .createStaffMember()
    participant P89 as .findAssignedClasses()
    participant P90 as .findAssignedSubjects()
    participant P91 as .listStudentFees()
    participant P92 as .getInvoiceById()
    participant P93 as .listPayments()
    participant P94 as .getSummary()
    participant P95 as .getStaffLeaveUsageByYear()
    participant P96 as .getStats()
    participant P97 as .upsertModule()
    participant P98 as .getRoomById()
    participant P99 as .getPeriodById()
    participant P100 as .getTimetableById()
    participant P101 as .createEntry()
    participant P102 as .setPublishStatus()
    participant P103 as .getScopedSchedule()
    participant P104 as .updateUserStatus()
    participant P105 as findMany()
    participant P106 as softDelete()
    participant P107 as .getClassesByInstitution()
    participant P108 as .getSectionsByClass()
    participant P109 as .getSubjectsByClass()
    participant P110 as .listAcademicYears()
    participant P111 as .listDepartments()
    participant P112 as .listAllocations()
    participant P113 as .findApplicantsByInstitution()
    participant P114 as .updateApplicationStage()
    participant P115 as .countStudents()
    participant P116 as .findDefaultSection()
    participant P117 as .getOrCreateSession()
    participant P118 as .getSessionById()
    participant P119 as .getSectionRosterForSession()
    participant P120 as .createStudentLeaveRequest()
    participant P121 as .listStudentLeaveRequests()
    participant P122 as .listStudentLeaves()
    participant P123 as .findLogs()
    participant P124 as .findLogById()
    participant P125 as .softDeleteDocument()
    participant P126 as .updateTemplate()
    participant P127 as .createRequest()
    participant P128 as .findRequestById()
    participant P129 as .listRequests()
    participant P130 as .updateRequestStatus()
    participant P131 as .verifyFacultyStudentLink()
    participant P132 as .publishExam()
    participant P133 as .addExamSubject()
    participant P134 as .listExamSubjects()
    participant P135 as .createExamSchedule()
    participant P136 as .resolveGrade()
    participant P137 as .listStudentReportCards()
    participant P138 as .findFacultyByInstitution()
    participant P139 as .findFacultyById()
    participant P140 as .findSectionStudents()
    participant P141 as .getFeeStructureById()
    participant P142 as .listInvoices()
    participant P143 as .getReceiptByPaymentId()
    participant P144 as .isWebhookEventProcessed()
    participant P145 as .recordWebhookEvent()
    participant P146 as .closeActiveEmploymentHistory()
    participant P147 as .getEmploymentHistory()
    participant P148 as .getLeaveTypeById()
    participant P149 as .createLeaveRequest()
    participant P150 as .getLeaveRequestById()
    participant P151 as .checkOverlappingLeave()
    participant P152 as .updateLeaveRequestAction()
    participant P153 as .upsertStaffAttendance()
    participant P154 as .upsertStaffWorkload()
    participant P155 as .findAll()
    participant P156 as .create()
    participant P157 as .createAdmin()
    participant P158 as .findAdmins()
    participant P159 as .updateAdminWorkspaces()
    participant P160 as .updateStatus()
    participant P161 as .findForUser()
    participant P162 as .createNotification()
    participant P163 as .findStudents()
    participant P164 as .findStudentMasterById()
    participant P165 as .promote()
    participant P166 as .updateRoom()
    participant P167 as .updatePeriod()
    participant P168 as .listSubstitutions()
    participant P169 as .getUserAudit()
    participant P170 as runTests()
    participant P171 as main()
    participant P172 as .getHierarchy()
    participant P173 as .listClasses()
    participant P174 as .createAcademicYear()
    participant P175 as .createDepartment()
    participant P176 as .createClass()
    participant P177 as .createSection()
    participant P178 as .createSubject()
    participant P179 as .linkSubjectToClass()
    participant P180 as .createAllocation()
    participant P181 as .createApplication()
    participant P182 as .listSessions()
    participant P183 as .getStudentAttendanceSummary()
    participant P184 as .listStaffAttendance()
    participant P185 as .getUserPermissions()
    participant P186 as .updatePassword()
    participant P187 as .revokeAllRefreshTokens()
    participant P188 as .listDocumentTypes()
    participant P189 as .createDocumentType()
    participant P190 as .findDocumentsByOwner()
    participant P191 as .listDocuments()
    participant P192 as .verifyDocument()
    participant P193 as .getVerificationHistory()
    participant P194 as .createTemplate()
    participant P195 as .listTemplates()
    participant P196 as .deleteTemplate()
    participant P197 as .verifyParentChildLink()
    participant P198 as .createExamType()
    participant P199 as .listExamTypes()
    participant P200 as .createExam()
    participant P201 as .listExams()
    participant P202 as .updateExamStatus()
    participant P203 as .listExamSchedules()
    participant P204 as .createExamRoom()
    participant P205 as .assignInvigilator()
    participant P206 as .createGradeScale()
    participant P207 as .listGradeScales()
    participant P208 as .addGradeTier()
    participant P209 as .listMarks()
    participant P210 as .verifyMarks()
    participant P211 as .getStudentReportCard()
    participant P212 as .listStudentReportCards()
    participant P213 as .listFeeCategories()
    participant P214 as .createFeeCategory()
    participant P215 as .listFeeGroups()
    participant P216 as .createFeeGroup()
    participant P217 as .listFeeStructures()
    participant P218 as .listDiscounts()
    participant P219 as .createDiscount()
    participant P220 as .listScholarships()
    participant P221 as .createScholarship()
    participant P222 as .listDesignations()
    participant P223 as .findDesignationByName()
    participant P224 as .createDesignation()
    participant P225 as .listStaff()
    participant P226 as .updateStaff()
    participant P227 as .softDeleteStaff()
    participant P228 as .listLeaveTypes()
    participant P229 as .createLeaveType()
    participant P230 as .listLeaveRequests()
    participant P231 as .getStaffAttendanceByDate()
    participant P232 as .getStaffAttendanceHistory()
    participant P233 as .getMonthlyAttendanceAggregates()
    participant P234 as .computeStaffWorkload()
    participant P235 as .listFacultyWorkloads()
    participant P236 as .getUnreadCount()
    participant P237 as .markAsRead()
    participant P238 as .markAllAsRead()
    participant P239 as .listRooms()
    participant P240 as .createRoom()
    participant P241 as .deleteRoom()
    participant P242 as .listPeriods()
    participant P243 as .createPeriod()
    participant P244 as .deletePeriod()
    participant P245 as .listTimetables()
    participant P246 as .createTimetable()
    participant P247 as .deleteTimetable()
    participant P248 as .deleteEntry()
    participant P249 as .createSubstitution()
    participant P250 as main()
    participant P251 as runTests()
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
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P9->>+ P0: calls
    P0-->>- P9: return
    P9->>+ P1: calls
    P1-->>- P9: return
    P9->>+ P10: calls
    P10-->>- P9: return
    P9->>+ P11: calls
    P11-->>- P9: return
    P9->>+ P12: calls
    P12-->>- P9: return
    P9->>+ P13: calls
    P13-->>- P9: return
    P9->>+ P14: calls
    P14-->>- P9: return
    P1->>+ P15: calls
    P15-->>- P1: return
    P1->>+ P4: calls
    P4-->>- P1: return
    P1->>+ P16: calls
    P16-->>- P1: return
    P1->>+ P17: calls
    P17-->>- P1: return
    P1->>+ P18: calls
    P18-->>- P1: return
    P1->>+ P19: calls
    P19-->>- P1: return
    P1->>+ P20: calls
    P20-->>- P1: return
    P1->>+ P21: calls
    P21-->>- P1: return
    P1->>+ P22: calls
    P22-->>- P1: return
    P1->>+ P23: calls
    P23-->>- P1: return
    P1->>+ P24: calls
    P24-->>- P1: return
    P1->>+ P25: calls
    P25-->>- P1: return
    P1->>+ P26: calls
    P26-->>- P1: return
    P1->>+ P27: calls
    P27-->>- P1: return
    P1->>+ P6: calls
    P6-->>- P1: return
    P1->>+ P28: calls
    P28-->>- P1: return
    P1->>+ P29: calls
    P29-->>- P1: return
    P1->>+ P30: calls
    P30-->>- P1: return
    P1->>+ P31: calls
    P31-->>- P1: return
    P1->>+ P32: calls
    P32-->>- P1: return
    P1->>+ P33: calls
    P33-->>- P1: return
    P1->>+ P34: calls
    P34-->>- P1: return
    P1->>+ P35: calls
    P35-->>- P1: return
    P1->>+ P36: calls
    P36-->>- P1: return
    P1->>+ P37: calls
    P37-->>- P1: return
    P1->>+ P38: calls
    P38-->>- P1: return
    P1->>+ P39: calls
    P39-->>- P1: return
    P1->>+ P40: calls
    P40-->>- P1: return
    P1->>+ P41: calls
    P41-->>- P1: return
    P1->>+ P42: calls
    P42-->>- P1: return
    P1->>+ P43: calls
    P43-->>- P1: return
    P1->>+ P44: calls
    P44-->>- P1: return
    P1->>+ P45: calls
    P45-->>- P1: return
    P1->>+ P46: calls
    P46-->>- P1: return
    P1->>+ P47: calls
    P47-->>- P1: return
    P1->>+ P48: calls
    P48-->>- P1: return
    P1->>+ P49: calls
    P49-->>- P1: return
    P1->>+ P50: calls
    P50-->>- P1: return
    P1->>+ P51: calls
    P51-->>- P1: return
    P1->>+ P52: calls
    P52-->>- P1: return
    P0->>+ P53: calls
    P53-->>- P0: return
    P0->>+ P54: calls
    P54-->>- P0: return
    P0->>+ P2: calls
    P2-->>- P0: return
    P0->>+ P55: calls
    P55-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P56: calls
    P56-->>- P0: return
    P0->>+ P4: calls
    P4-->>- P0: return
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
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P63: calls
    P63-->>- P0: return
    P0->>+ P64: calls
    P64-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
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
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P75: calls
    P75-->>- P0: return
    P0->>+ P25: calls
    P25-->>- P0: return
    P0->>+ P76: calls
    P76-->>- P0: return
    P0->>+ P77: calls
    P77-->>- P0: return
    P0->>+ P78: calls
    P78-->>- P0: return
    P0->>+ P26: calls
    P26-->>- P0: return
    P0->>+ P79: calls
    P79-->>- P0: return
    P0->>+ P80: calls
    P80-->>- P0: return
    P0->>+ P81: calls
    P81-->>- P0: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P0->>+ P82: calls
    P82-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
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
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
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
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
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
    P0->>+ P174: calls
    P174-->>- P0: return
    P0->>+ P175: calls
    P175-->>- P0: return
    P0->>+ P176: calls
    P176-->>- P0: return
    P0->>+ P177: calls
    P177-->>- P0: return
    P0->>+ P178: calls
    P178-->>- P0: return
    P0->>+ P179: calls
    P179-->>- P0: return
    P0->>+ P180: calls
    P180-->>- P0: return
    P0->>+ P181: calls
    P181-->>- P0: return
    P0->>+ P182: calls
    P182-->>- P0: return
    P0->>+ P183: calls
    P183-->>- P0: return
    P0->>+ P184: calls
    P184-->>- P0: return
    P0->>+ P185: calls
    P185-->>- P0: return
    P0->>+ P186: calls
    P186-->>- P0: return
    P0->>+ P187: calls
    P187-->>- P0: return
    P0->>+ P188: calls
    P188-->>- P0: return
    P0->>+ P189: calls
    P189-->>- P0: return
    P0->>+ P190: calls
    P190-->>- P0: return
    P0->>+ P191: calls
    P191-->>- P0: return
    P0->>+ P192: calls
    P192-->>- P0: return
    P0->>+ P193: calls
    P193-->>- P0: return
    P0->>+ P194: calls
    P194-->>- P0: return
    P0->>+ P195: calls
    P195-->>- P0: return
    P0->>+ P196: calls
    P196-->>- P0: return
    P0->>+ P197: calls
    P197-->>- P0: return
    P0->>+ P198: calls
    P198-->>- P0: return
    P0->>+ P199: calls
    P199-->>- P0: return
    P0->>+ P200: calls
    P200-->>- P0: return
    P0->>+ P201: calls
    P201-->>- P0: return
    P0->>+ P202: calls
    P202-->>- P0: return
    P0->>+ P203: calls
    P203-->>- P0: return
    P0->>+ P204: calls
    P204-->>- P0: return
    P0->>+ P205: calls
    P205-->>- P0: return
    P0->>+ P206: calls
    P206-->>- P0: return
    P0->>+ P207: calls
    P207-->>- P0: return
    P0->>+ P208: calls
    P208-->>- P0: return
    P0->>+ P209: calls
    P209-->>- P0: return
    P0->>+ P210: calls
    P210-->>- P0: return
    P0->>+ P211: calls
    P211-->>- P0: return
    P0->>+ P212: calls
    P212-->>- P0: return
    P0->>+ P213: calls
    P213-->>- P0: return
    P0->>+ P214: calls
    P214-->>- P0: return
    P0->>+ P215: calls
    P215-->>- P0: return
    P0->>+ P216: calls
    P216-->>- P0: return
    P0->>+ P217: calls
    P217-->>- P0: return
    P0->>+ P218: calls
    P218-->>- P0: return
    P0->>+ P219: calls
    P219-->>- P0: return
    P0->>+ P220: calls
    P220-->>- P0: return
    P0->>+ P221: calls
    P221-->>- P0: return
    P0->>+ P222: calls
    P222-->>- P0: return
    P0->>+ P223: calls
    P223-->>- P0: return
    P0->>+ P224: calls
    P224-->>- P0: return
    P0->>+ P225: calls
    P225-->>- P0: return
    P0->>+ P226: calls
    P226-->>- P0: return
    P0->>+ P227: calls
    P227-->>- P0: return
    P0->>+ P228: calls
    P228-->>- P0: return
    P0->>+ P229: calls
    P229-->>- P0: return
    P0->>+ P230: calls
    P230-->>- P0: return
    P0->>+ P231: calls
    P231-->>- P0: return
    P0->>+ P232: calls
    P232-->>- P0: return
    P0->>+ P233: calls
    P233-->>- P0: return
    P0->>+ P234: calls
    P234-->>- P0: return
    P0->>+ P235: calls
    P235-->>- P0: return
    P0->>+ P236: calls
    P236-->>- P0: return
    P0->>+ P237: calls
    P237-->>- P0: return
    P0->>+ P238: calls
    P238-->>- P0: return
    P0->>+ P239: calls
    P239-->>- P0: return
    P0->>+ P240: calls
    P240-->>- P0: return
    P0->>+ P241: calls
    P241-->>- P0: return
    P0->>+ P242: calls
    P242-->>- P0: return
    P0->>+ P243: calls
    P243-->>- P0: return
    P0->>+ P244: calls
    P244-->>- P0: return
    P0->>+ P245: calls
    P245-->>- P0: return
    P0->>+ P246: calls
    P246-->>- P0: return
    P0->>+ P247: calls
    P247-->>- P0: return
    P0->>+ P248: calls
    P248-->>- P0: return
    P0->>+ P249: calls
    P249-->>- P0: return
    P0->>+ P250: calls
    P250-->>- P0: return
    P0->>+ P251: calls
    P251-->>- P0: return
```

## Connections by Relation

### calls
- [[.dispatch()]] `INFERRED`
- [[.findByIdOrCode()]] `INFERRED`
- [[runR4Verification()]] `INFERRED`
- [[.generateBonafideCertificate()]] `INFERRED`
- [[.verifyParentChildLink()]] `INFERRED`
- [[.onboardStaff()]] `INFERRED`
- [[.submitRollCall()]] `INFERRED`
- [[.createLog()]] `INFERRED`
- [[.verifyDocument()]] `INFERRED`
- [[.calculateExamResults()]] `INFERRED`
- [[.getStaffById()]] `INFERRED`
- [[.provisionUser()]] `INFERRED`
- [[.getDocumentTypeById()]] `INFERRED`
- [[.findDocumentById()]] `INFERRED`
- [[.verifyFacultySubjectAllocation()]] `INFERRED`
- [[.publishExamResults()]] `INFERRED`
- [[.verifyFacultySectionAccess()]] `INFERRED`
- [[.reset()]] `INFERRED`
- [[.createDocument()]] `INFERRED`
- [[.getExamSubjectById()]] `INFERRED`

### contains
- [[users.routes.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*