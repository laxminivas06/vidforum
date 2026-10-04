# query

> God node · 280 connections · [C:\Antigravityyyyy\VID_School\backend\src\modules\users\users.routes.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/users/users.routes.ts#L446)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as query
    participant P1 as .dispatch()
    participant P2 as .login()
    participant P3 as runVerification()
    participant P4 as .reset()
    participant P5 as .isLocked()
    participant P6 as .findLoginSubject()
    participant P7 as .recordFailure()
    participant P8 as .getUserPermissions()
    participant P9 as handleLoginSubmit()
    participant P10 as .generateBonafideCertificate()
    participant P11 as .sendNotification()
    participant P12 as .verifyDocument()
    participant P13 as .createDocument()
    participant P14 as .createDocumentType()
    participant P15 as .getStudentCertificateDetails()
    participant P16 as .getDocumentTypeByCode()
    participant P17 as .onboardStaff()
    participant P18 as .applyLeave()
    participant P19 as .actionLeaveRequest()
    participant P20 as .submitRollCall()
    participant P21 as .generateTransferCertificate()
    participant P22 as .requestDocument()
    participant P23 as .createStaffDirect()
    participant P24 as .updateStaff()
    participant P25 as .uploadDocument()
    participant P26 as .publishExamResults()
    participant P27 as .changePassword()
    participant P28 as .createDepartment()
    participant P29 as .softDeleteStaff()
    participant P30 as .publishTimetable()
    participant P31 as tenantMiddleware()
    participant P32 as .createAcademicYear()
    participant P33 as .generateClassMatrix()
    participant P34 as .updateApplicationStage()
    participant P35 as .executeApprovalTransaction()
    participant P36 as .applyStudentLeave()
    participant P37 as .decideStudentLeave()
    participant P38 as .deleteDocument()
    participant P39 as .processDocumentRequest()
    participant P40 as .submitMarksBatch()
    participant P41 as .commitExcelImport()
    participant P42 as .processPayment()
    participant P43 as .markStaffAttendanceBatch()
    participant P44 as .createStudent()
    participant P45 as .updateAcademicYear()
    participant P46 as .setCurrentAcademicYear()
    participant P47 as .cloneAcademicYear()
    participant P48 as .createSubject()
    participant P49 as .mapSubjectToGrade()
    participant P50 as .copySubjectMatrix()
    participant P51 as .createExamEstimate()
    participant P52 as .saveCalendarConfig()
    participant P53 as .createCalendarDay()
    participant P54 as .createTextbook()
    participant P55 as .getOrCreateSession()
    participant P56 as .createTemplate()
    participant P57 as .calculateResults()
    participant P58 as .createDesignation()
    participant P59 as .deleteDesignation()
    participant P60 as .deleteDepartment()
    participant P61 as .createLeaveType()
    participant P62 as .markAllStaffPresent()
    participant P63 as .updateStudent()
    participant P64 as .unpublishTimetable()
    participant P65 as .closeAcademicYear()
    participant P66 as .createClass()
    participant P67 as .updateClass()
    participant P68 as .deleteClass()
    participant P69 as .createSection()
    participant P70 as .updateSection()
    participant P71 as .deleteSection()
    participant P72 as .updateSubject()
    participant P73 as .deleteSubject()
    participant P74 as .removeSubjectFromGrade()
    participant P75 as .updateExamEstimate()
    participant P76 as .deleteExamEstimate()
    participant P77 as .deleteCalendarDay()
    participant P78 as .updateTextbook()
    participant P79 as .deleteTextbook()
    participant P80 as .updateTemplate()
    participant P81 as .deleteTemplate()
    participant P82 as .createExamType()
    participant P83 as .createExam()
    participant P84 as .updateExamStatus()
    participant P85 as .addExamSubject()
    participant P86 as .createExamSchedule()
    participant P87 as .verifyMarks()
    participant P88 as .createFeeStructure()
    participant P89 as .assignFeeToStudent()
    participant P90 as .processRefund()
    participant P91 as .createSubstitution()
    participant P92 as runVerification()
    participant P93 as runVerification()
    participant P94 as .findByIdOrCode()
    participant P95 as runR4Verification()
    participant P96 as .verifyParentChildLink()
    participant P97 as .provisionUser()
    participant P98 as .createLog()
    participant P99 as .calculateExamResults()
    participant P100 as .getStaffById()
    participant P101 as .getDocumentTypeById()
    participant P102 as .findDocumentById()
    participant P103 as .verifyFacultySubjectAllocation()
    participant P104 as .getAcademicYearById()
    participant P105 as .getWorkingDaysCount()
    participant P106 as .verifyFacultySectionAccess()
    participant P107 as .getExamSubjectById()
    participant P108 as .validateImportBatch()
    participant P109 as .findFacultyByProfileId()
    participant P110 as .getScopedFees()
    participant P111 as .recordEmploymentHistory()
    participant P112 as .linkFacultyRecord()
    participant P113 as .findModules()
    participant P114 as .listEntries()
    participant P115 as .checkCandidateConflicts()
    participant P116 as .updateUserAccess()
    participant P117 as .resetCredentials()
    participant P118 as .updateUserStatus()
    participant P119 as findById()
    participant P120 as .getClassesByInstitution()
    participant P121 as .getCalendarConfig()
    participant P122 as .listTextbooks()
    participant P123 as .getBooklist()
    participant P124 as .findApplicationById()
    participant P125 as .getInstitutionAttendanceStats()
    participant P126 as .getStudentAttendanceSummary()
    participant P127 as .getScopedAttendance()
    participant P128 as .findTemplateById()
    participant P129 as .verifyStudentExists()
    participant P130 as .verifyStaffExists()
    participant P131 as .getExamById()
    participant P132 as .listMarks()
    participant P133 as .getStudentReportCard()
    participant P134 as .createStaffMember()
    participant P135 as .findAssignedClasses()
    participant P136 as .findAssignedSubjects()
    participant P137 as .listStudentFees()
    participant P138 as .getInvoiceById()
    participant P139 as .listPayments()
    participant P140 as .getSummary()
    participant P141 as .getStaffLeaveUsageByYear()
    participant P142 as .upsertStaffAttendance()
    participant P143 as .getStats()
    participant P144 as .upsertModule()
    participant P145 as .getRoomById()
    participant P146 as .getPeriodById()
    participant P147 as .getTimetableById()
    participant P148 as .createEntry()
    participant P149 as .setPublishStatus()
    participant P150 as .getScopedSchedule()
    participant P151 as findMany()
    participant P152 as softDelete()
    participant P153 as .listAcademicYears()
    participant P154 as .updateAcademicYear()
    participant P155 as .getSectionsByClass()
    participant P156 as .getSubjectsByClass()
    participant P157 as .isClassInUse()
    participant P158 as .deleteClass()
    participant P159 as .isSectionInUse()
    participant P160 as .deleteSection()
    participant P161 as .listSubjects()
    participant P162 as .isSubjectInUse()
    participant P163 as .deleteSubject()
    participant P164 as .listExamEstimates()
    participant P165 as .listCalendarDays()
    participant P166 as .isWorkingDay()
    participant P167 as .listDepartments()
    participant P168 as .listAllocations()
    participant P169 as .findEnquiries()
    participant P170 as .convertEnquiryToApplication()
    participant P171 as .findApplicantsByInstitution()
    participant P172 as .createApplication()
    participant P173 as .countStudents()
    participant P174 as .existsAdmissionNumber()
    participant P175 as .findDefaultSection()
    participant P176 as .getOrCreateSession()
    participant P177 as .getSessionById()
    participant P178 as .getSectionRosterForSession()
    participant P179 as .createStudentLeaveRequest()
    participant P180 as .listStudentLeaveRequests()
    participant P181 as .listStudentLeaves()
    participant P182 as .findLogs()
    participant P183 as .findLogById()
    participant P184 as .updatePassword()
    participant P185 as .softDeleteDocument()
    participant P186 as .updateTemplate()
    participant P187 as .createRequest()
    participant P188 as .findRequestById()
    participant P189 as .listRequests()
    participant P190 as .updateRequestStatus()
    participant P191 as .verifyFacultyStudentLink()
    participant P192 as .publishExam()
    participant P193 as .addExamSubject()
    participant P194 as .listExamSubjects()
    participant P195 as .createExamSchedule()
    participant P196 as .resolveGrade()
    participant P197 as .listStudentReportCards()
    participant P198 as .findFacultyByInstitution()
    participant P199 as .findFacultyById()
    participant P200 as .findSectionStudents()
    participant P201 as .getFeeStructureById()
    participant P202 as .listInvoices()
    participant P203 as .getReceiptByPaymentId()
    participant P204 as .isWebhookEventProcessed()
    participant P205 as .recordWebhookEvent()
    participant P206 as .isDesignationInUse()
    participant P207 as .deleteDesignation()
    participant P208 as .isDepartmentInUse()
    participant P209 as .deleteDepartment()
    participant P210 as .findStaffByEmployeeCode()
    participant P211 as .findStaffByProfileId()
    participant P212 as .createStaff()
    participant P213 as .closeActiveEmploymentHistory()
    participant P214 as .getEmploymentHistory()
    participant P215 as .getLeaveTypeById()
    participant P216 as .createLeaveRequest()
    participant P217 as .getLeaveRequestById()
    participant P218 as .checkOverlappingLeave()
    participant P219 as .updateLeaveRequestAction()
    participant P220 as .upsertStaffWorkload()
    participant P221 as .markAllStaffPresent()
    participant P222 as .findAll()
    participant P223 as .create()
    participant P224 as .createAdmin()
    participant P225 as .findAdmins()
    participant P226 as .updateAdminWorkspaces()
    participant P227 as .updateStatus()
    participant P228 as .findForUser()
    participant P229 as .createNotification()
    participant P230 as .findStudents()
    participant P231 as .findStudentMasterById()
    participant P232 as .promote()
    participant P233 as .countStudents()
    participant P234 as .updateRoom()
    participant P235 as .updatePeriod()
    participant P236 as .listSubstitutions()
    participant P237 as .getUserAudit()
    participant P238 as runTests()
    participant P239 as main()
    participant P240 as .createAcademicYear()
    participant P241 as .setCurrentAcademicYear()
    participant P242 as .closeAcademicYear()
    participant P243 as .cloneAcademicYear()
    participant P244 as .getHierarchy()
    participant P245 as .createClass()
    participant P246 as .updateClass()
    participant P247 as .generateClassMatrix()
    participant P248 as .createSection()
    participant P249 as .updateSection()
    participant P250 as .createSubject()
    participant P251 as .updateSubject()
    participant P252 as .getGradeSubjects()
    participant P253 as .mapSubjectToGrade()
    participant P254 as .removeSubjectFromGrade()
    participant P255 as .copySubjectMatrix()
    participant P256 as .createExamEstimate()
    participant P257 as .updateExamEstimate()
    participant P258 as .deleteExamEstimate()
    participant P259 as .saveCalendarConfig()
    participant P260 as .createCalendarDay()
    participant P261 as .deleteCalendarDay()
    participant P262 as .createTextbook()
    participant P263 as .updateTextbook()
    participant P264 as .deleteTextbook()
    participant P265 as .createDepartment()
    participant P266 as .linkSubjectToClass()
    participant P267 as .createAllocation()
    participant P268 as .createEnquiry()
    participant P269 as .getPipelineStats()
    participant P270 as .listSessions()
    participant P271 as .getStudentAttendanceSummary()
    participant P272 as .listStaffAttendance()
    participant P273 as .revokeAllRefreshTokens()
    participant P274 as .listDocumentTypes()
    participant P275 as .createDocumentType()
    participant P276 as .findDocumentsByOwner()
    participant P277 as .listDocuments()
    participant P278 as .verifyDocument()
    participant P279 as .getVerificationHistory()
    participant P280 as .createTemplate()
    participant P281 as .listTemplates()
    participant P282 as .deleteTemplate()
    participant P283 as .verifyParentChildLink()
    participant P284 as .createExamType()
    participant P285 as .listExamTypes()
    participant P286 as .createExam()
    participant P287 as .listExams()
    participant P288 as .updateExamStatus()
    participant P289 as .listExamSchedules()
    participant P290 as .createExamRoom()
    participant P291 as .assignInvigilator()
    participant P292 as .createGradeScale()
    participant P293 as .listGradeScales()
    participant P294 as .addGradeTier()
    participant P295 as .listMarks()
    participant P296 as .verifyMarks()
    participant P297 as .getStudentReportCard()
    participant P298 as .listStudentReportCards()
    participant P299 as .listFeeCategories()
    participant P300 as .createFeeCategory()
    participant P301 as .listFeeGroups()
    participant P302 as .createFeeGroup()
    participant P303 as .listFeeStructures()
    participant P304 as .listDiscounts()
    participant P305 as .createDiscount()
    participant P306 as .listScholarships()
    participant P307 as .createScholarship()
    participant P308 as .listDesignations()
    participant P309 as .findDesignationByName()
    participant P310 as .createDesignation()
    participant P311 as .listDepartments()
    participant P312 as .createDepartment()
    participant P313 as .listStaff()
    participant P314 as .updateStaff()
    participant P315 as .softDeleteStaff()
    participant P316 as .listLeaveTypes()
    participant P317 as .createLeaveType()
    participant P318 as .listLeaveRequests()
    participant P319 as .getStaffAttendanceByDate()
    participant P320 as .getStaffAttendanceHistory()
    participant P321 as .getMonthlyAttendanceAggregates()
    participant P322 as .computeStaffWorkload()
    participant P323 as .listFacultyWorkloads()
    participant P324 as .checkDuplicateStaff()
    participant P325 as .getHRReportSummary()
    participant P326 as .getUnreadCount()
    participant P327 as .markAsRead()
    participant P328 as .markAllAsRead()
    participant P329 as .getClassEnrollmentCounts()
    participant P330 as .listRooms()
    participant P331 as .createRoom()
    participant P332 as .deleteRoom()
    participant P333 as .listPeriods()
    participant P334 as .createPeriod()
    participant P335 as .deletePeriod()
    participant P336 as .listTimetables()
    participant P337 as .createTimetable()
    participant P338 as .deleteTimetable()
    participant P339 as .deleteEntry()
    participant P340 as .createSubstitution()
    participant P341 as main()
    participant P342 as main()
    participant P343 as main()
    participant P344 as main()
    participant P345 as seedHyderabadDemo()
    participant P346 as runTests()
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
    P2->>+ P9: calls
    P9-->>- P2: return
    P1->>+ P10: calls
    P10-->>- P1: return
    P10->>+ P0: calls
    P0-->>- P10: return
    P10->>+ P1: calls
    P1-->>- P10: return
    P10->>+ P11: calls
    P11-->>- P10: return
    P10->>+ P12: calls
    P12-->>- P10: return
    P10->>+ P13: calls
    P13-->>- P10: return
    P10->>+ P14: calls
    P14-->>- P10: return
    P10->>+ P15: calls
    P15-->>- P10: return
    P10->>+ P16: calls
    P16-->>- P10: return
    P1->>+ P17: calls
    P17-->>- P1: return
    P1->>+ P18: calls
    P18-->>- P1: return
    P1->>+ P19: calls
    P19-->>- P1: return
    P1->>+ P20: calls
    P20-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
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
    P1->>+ P14: calls
    P14-->>- P1: return
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
    P1->>+ P53: calls
    P53-->>- P1: return
    P1->>+ P54: calls
    P54-->>- P1: return
    P1->>+ P55: calls
    P55-->>- P1: return
    P1->>+ P56: calls
    P56-->>- P1: return
    P1->>+ P57: calls
    P57-->>- P1: return
    P1->>+ P58: calls
    P58-->>- P1: return
    P1->>+ P59: calls
    P59-->>- P1: return
    P1->>+ P60: calls
    P60-->>- P1: return
    P1->>+ P61: calls
    P61-->>- P1: return
    P1->>+ P62: calls
    P62-->>- P1: return
    P1->>+ P63: calls
    P63-->>- P1: return
    P1->>+ P64: calls
    P64-->>- P1: return
    P1->>+ P65: calls
    P65-->>- P1: return
    P1->>+ P66: calls
    P66-->>- P1: return
    P1->>+ P67: calls
    P67-->>- P1: return
    P1->>+ P68: calls
    P68-->>- P1: return
    P1->>+ P69: calls
    P69-->>- P1: return
    P1->>+ P70: calls
    P70-->>- P1: return
    P1->>+ P71: calls
    P71-->>- P1: return
    P1->>+ P72: calls
    P72-->>- P1: return
    P1->>+ P73: calls
    P73-->>- P1: return
    P1->>+ P74: calls
    P74-->>- P1: return
    P1->>+ P75: calls
    P75-->>- P1: return
    P1->>+ P76: calls
    P76-->>- P1: return
    P1->>+ P77: calls
    P77-->>- P1: return
    P1->>+ P78: calls
    P78-->>- P1: return
    P1->>+ P79: calls
    P79-->>- P1: return
    P1->>+ P80: calls
    P80-->>- P1: return
    P1->>+ P81: calls
    P81-->>- P1: return
    P1->>+ P82: calls
    P82-->>- P1: return
    P1->>+ P83: calls
    P83-->>- P1: return
    P1->>+ P84: calls
    P84-->>- P1: return
    P1->>+ P85: calls
    P85-->>- P1: return
    P1->>+ P86: calls
    P86-->>- P1: return
    P1->>+ P87: calls
    P87-->>- P1: return
    P1->>+ P88: calls
    P88-->>- P1: return
    P1->>+ P89: calls
    P89-->>- P1: return
    P1->>+ P90: calls
    P90-->>- P1: return
    P1->>+ P91: calls
    P91-->>- P1: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P0->>+ P92: calls
    P92-->>- P0: return
    P0->>+ P93: calls
    P93-->>- P0: return
    P0->>+ P94: calls
    P94-->>- P0: return
    P0->>+ P2: calls
    P2-->>- P0: return
    P0->>+ P95: calls
    P95-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P96: calls
    P96-->>- P0: return
    P0->>+ P17: calls
    P17-->>- P0: return
    P0->>+ P97: calls
    P97-->>- P0: return
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P98: calls
    P98-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P99: calls
    P99-->>- P0: return
    P0->>+ P100: calls
    P100-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P101: calls
    P101-->>- P0: return
    P0->>+ P102: calls
    P102-->>- P0: return
    P0->>+ P103: calls
    P103-->>- P0: return
    P0->>+ P26: calls
    P26-->>- P0: return
    P0->>+ P104: calls
    P104-->>- P0: return
    P0->>+ P105: calls
    P105-->>- P0: return
    P0->>+ P106: calls
    P106-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P0->>+ P27: calls
    P27-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
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
    P0->>+ P31: calls
    P31-->>- P0: return
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
    P0->>+ P34: calls
    P34-->>- P0: return
    P0->>+ P35: calls
    P35-->>- P0: return
    P0->>+ P125: calls
    P125-->>- P0: return
    P0->>+ P126: calls
    P126-->>- P0: return
    P0->>+ P127: calls
    P127-->>- P0: return
    P0->>+ P36: calls
    P36-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P128: calls
    P128-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
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
    P0->>+ P44: calls
    P44-->>- P0: return
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
    P0->>+ P8: calls
    P8-->>- P0: return
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
    P0->>+ P63: calls
    P63-->>- P0: return
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
    P0->>+ P252: calls
    P252-->>- P0: return
    P0->>+ P253: calls
    P253-->>- P0: return
    P0->>+ P254: calls
    P254-->>- P0: return
    P0->>+ P255: calls
    P255-->>- P0: return
    P0->>+ P256: calls
    P256-->>- P0: return
    P0->>+ P257: calls
    P257-->>- P0: return
    P0->>+ P258: calls
    P258-->>- P0: return
    P0->>+ P259: calls
    P259-->>- P0: return
    P0->>+ P260: calls
    P260-->>- P0: return
    P0->>+ P261: calls
    P261-->>- P0: return
    P0->>+ P262: calls
    P262-->>- P0: return
    P0->>+ P263: calls
    P263-->>- P0: return
    P0->>+ P264: calls
    P264-->>- P0: return
    P0->>+ P265: calls
    P265-->>- P0: return
    P0->>+ P266: calls
    P266-->>- P0: return
    P0->>+ P267: calls
    P267-->>- P0: return
    P0->>+ P268: calls
    P268-->>- P0: return
    P0->>+ P269: calls
    P269-->>- P0: return
    P0->>+ P270: calls
    P270-->>- P0: return
    P0->>+ P271: calls
    P271-->>- P0: return
    P0->>+ P272: calls
    P272-->>- P0: return
    P0->>+ P273: calls
    P273-->>- P0: return
    P0->>+ P274: calls
    P274-->>- P0: return
    P0->>+ P275: calls
    P275-->>- P0: return
    P0->>+ P276: calls
    P276-->>- P0: return
    P0->>+ P277: calls
    P277-->>- P0: return
    P0->>+ P278: calls
    P278-->>- P0: return
    P0->>+ P279: calls
    P279-->>- P0: return
    P0->>+ P280: calls
    P280-->>- P0: return
    P0->>+ P281: calls
    P281-->>- P0: return
    P0->>+ P282: calls
    P282-->>- P0: return
    P0->>+ P283: calls
    P283-->>- P0: return
    P0->>+ P284: calls
    P284-->>- P0: return
    P0->>+ P285: calls
    P285-->>- P0: return
    P0->>+ P286: calls
    P286-->>- P0: return
    P0->>+ P287: calls
    P287-->>- P0: return
    P0->>+ P288: calls
    P288-->>- P0: return
    P0->>+ P289: calls
    P289-->>- P0: return
    P0->>+ P290: calls
    P290-->>- P0: return
    P0->>+ P291: calls
    P291-->>- P0: return
    P0->>+ P292: calls
    P292-->>- P0: return
    P0->>+ P293: calls
    P293-->>- P0: return
    P0->>+ P294: calls
    P294-->>- P0: return
    P0->>+ P295: calls
    P295-->>- P0: return
    P0->>+ P296: calls
    P296-->>- P0: return
    P0->>+ P297: calls
    P297-->>- P0: return
    P0->>+ P298: calls
    P298-->>- P0: return
    P0->>+ P299: calls
    P299-->>- P0: return
    P0->>+ P300: calls
    P300-->>- P0: return
    P0->>+ P301: calls
    P301-->>- P0: return
    P0->>+ P302: calls
    P302-->>- P0: return
    P0->>+ P303: calls
    P303-->>- P0: return
    P0->>+ P304: calls
    P304-->>- P0: return
    P0->>+ P305: calls
    P305-->>- P0: return
    P0->>+ P306: calls
    P306-->>- P0: return
    P0->>+ P307: calls
    P307-->>- P0: return
    P0->>+ P308: calls
    P308-->>- P0: return
    P0->>+ P309: calls
    P309-->>- P0: return
    P0->>+ P310: calls
    P310-->>- P0: return
    P0->>+ P311: calls
    P311-->>- P0: return
    P0->>+ P312: calls
    P312-->>- P0: return
    P0->>+ P313: calls
    P313-->>- P0: return
    P0->>+ P314: calls
    P314-->>- P0: return
    P0->>+ P315: calls
    P315-->>- P0: return
    P0->>+ P316: calls
    P316-->>- P0: return
    P0->>+ P317: calls
    P317-->>- P0: return
    P0->>+ P318: calls
    P318-->>- P0: return
    P0->>+ P319: calls
    P319-->>- P0: return
    P0->>+ P320: calls
    P320-->>- P0: return
    P0->>+ P321: calls
    P321-->>- P0: return
    P0->>+ P322: calls
    P322-->>- P0: return
    P0->>+ P323: calls
    P323-->>- P0: return
    P0->>+ P324: calls
    P324-->>- P0: return
    P0->>+ P325: calls
    P325-->>- P0: return
    P0->>+ P326: calls
    P326-->>- P0: return
    P0->>+ P327: calls
    P327-->>- P0: return
    P0->>+ P328: calls
    P328-->>- P0: return
    P0->>+ P329: calls
    P329-->>- P0: return
    P0->>+ P330: calls
    P330-->>- P0: return
    P0->>+ P331: calls
    P331-->>- P0: return
    P0->>+ P332: calls
    P332-->>- P0: return
    P0->>+ P333: calls
    P333-->>- P0: return
    P0->>+ P334: calls
    P334-->>- P0: return
    P0->>+ P335: calls
    P335-->>- P0: return
    P0->>+ P336: calls
    P336-->>- P0: return
    P0->>+ P337: calls
    P337-->>- P0: return
    P0->>+ P338: calls
    P338-->>- P0: return
    P0->>+ P339: calls
    P339-->>- P0: return
    P0->>+ P340: calls
    P340-->>- P0: return
    P0->>+ P341: calls
    P341-->>- P0: return
    P0->>+ P342: calls
    P342-->>- P0: return
    P0->>+ P343: calls
    P343-->>- P0: return
    P0->>+ P344: calls
    P344-->>- P0: return
    P0->>+ P345: calls
    P345-->>- P0: return
    P0->>+ P346: calls
    P346-->>- P0: return
```

## Connections by Relation

### calls
- [[.dispatch()]] `INFERRED`
- [[runVerification()]] `INFERRED`
- [[runVerification()]] `INFERRED`
- [[runVerification()]] `INFERRED`
- [[.findByIdOrCode()]] `INFERRED`
- [[.login()]] `INFERRED`
- [[runR4Verification()]] `INFERRED`
- [[.generateBonafideCertificate()]] `INFERRED`
- [[.verifyParentChildLink()]] `INFERRED`
- [[.onboardStaff()]] `INFERRED`
- [[.provisionUser()]] `INFERRED`
- [[.submitRollCall()]] `INFERRED`
- [[.createLog()]] `INFERRED`
- [[.verifyDocument()]] `INFERRED`
- [[.calculateExamResults()]] `INFERRED`
- [[.getStaffById()]] `INFERRED`
- [[.createStaffDirect()]] `INFERRED`
- [[.reset()]] `INFERRED`
- [[.getDocumentTypeById()]] `INFERRED`
- [[.findDocumentById()]] `INFERRED`

### contains
- [[users.routes.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*