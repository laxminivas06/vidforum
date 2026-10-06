# Graph Report - vidforum  (2026-10-06)

## Corpus Check
- 331 files · ~251,996 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 1795 nodes · 5120 edges · 92 communities (40 shown, 52 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Api Hooks Students
- Hrms Repository Hrmsrepository
- Attendance Faculty Examinations
- Admissions Examinations Finance
- Institutions Users Form
- Routes Middleware Router
- Academics Controller Academicscontroller
- Repository Service Timetable
- Auth Repository Workspaces
- Academics Service Academicsservice
- States Card Topbar
- Contexts Config Authcontext
- Academics Repository Academicsrepository
- Package Ref Dependencies
- Examinations Repository Examinationsrepository
- Examinations Controller Examinationscontroller
- Finance Repository Financerepository
- Admissions Repository Admissionsrepository
- Documents Service Documentsservice
- Student Studentprofile Users
- Mobile Package Ref
- Timetable Service Timetableservice
- Documents Repository Documentsrepository
- Hrms Controller Hrmscontroller
- Users Provisioning Service
- Examinations Service Examinationsservice
- Timetable Repository Timetablerepository
- Finance Controller Financecontroller
- Finance Service Financeservice
- Timetable Controller Timetablecontroller
- Scan Gate Report
- Documents Controller Documentscontroller
- Ref Package Json
- Faculty Service Repository
- Tsconfig Compileroptions Allowjs
- Mobile Expo Splash
- Error Format Tenant
- Hrms Repository Service
- Admissions Controller Admissionscontroller
- Packages Api Client
- Packages Schemas Package
- Package Build Migrate
- Attendance Controller Attendancecontroller
- Attendance Repository Attendancerepository
- Attendance Service Attendanceservice
- Tsconfig Compileroptions Esmoduleinterop
- Packages Api Client
- Audit Repository Auditrepository
- Institutions Institution Service
- Students Student Service
- Packages Schemas Tsconfig
- Hrms Controller Actionleaveschema
- Institutions Institution Controller
- Institutions Institution Repository
- Packages Schemas Apierrordetailschema
- Package Dependencies Bcryptjs
- Package Devdependencies Tsx
- Documents Controller Bonafideschema
- Students Student Repository
- Package Build Dev
- Packages Api Client
- Students Student Controller
- Tenant Repository Base
- Notifications Notification Repository
- Notifications Notification Controller
- Tsconfig Mobile Compileroptions
- Structures Finance Classfeestructure
- Next Config Nextconfig
- Css

## God Nodes (most connected - your core abstractions)
1. `sendSuccess()` - 240 edges
2. `sendError()` - 201 edges
3. `Button` - 121 edges
4. `Badge()` - 105 edges
5. `AppShell()` - 103 edges
6. `Card` - 78 edges
7. `getAuthHeaders()` - 76 edges
8. `CardContent` - 69 edges
9. `lucide-react` - 67 edges
10. `CardHeader` - 63 edges

## Surprising Connections (you probably didn't know these)
- `DatePicker()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/Form/index.tsx → frontend/lib/utils.ts
- `auditRepository` --inherits--> `TenantScopedRepository`  [EXTRACTED]
  backend/src/modules/audit/audit.repository.ts → backend/src/common/tenant-repository.base.ts
- `notificationRepository` --inherits--> `TenantScopedRepository`  [EXTRACTED]
  backend/src/modules/notifications/notification.repository.ts → backend/src/common/tenant-repository.base.ts
- `authMiddleware()` --calls--> `sendError()`  [EXTRACTED]
  backend/src/middleware/auth.middleware.ts → backend/src/utils/api-response.ts
- `requireModuleEnabled()` --calls--> `sendError()`  [EXTRACTED]
  backend/src/middleware/module-guard.middleware.ts → backend/src/utils/api-response.ts

## Import Cycles
- None detected.

## Communities (92 total, 52 thin omitted)

### Community 0 - "Api Hooks Students"
Cohesion: 0.05
Nodes (108): AcademicsWorkspaceContent(), AcademicsWorkspacePage(), TabType, InstitutionAdminDashboard(), GENDER_OPTIONS, HRMSStaffContent(), HRMSStaffPage(), TABS (+100 more)

### Community 2 - "Attendance Faculty Examinations"
Cohesion: 0.15
Nodes (49): AdmissionsEnquiriesPage(), EnrolledStudentsPage(), AIAttendanceMonitoringPage(), AIConfigPage(), AITutorAnalyticsPage(), AiTutorChatPage(), ChatMessage, INITIAL_MESSAGES (+41 more)

### Community 3 - "Admissions Examinations Finance"
Cohesion: 0.12
Nodes (38): AdmissionDocumentsPage(), INITIAL_INQUIRIES, LeadInquiry, AdmissionsPage(), BulkApplicantsModal(), BulkApplicantsModalProps, calculateAge(), ParsedApplicantRow (+30 more)

### Community 4 - "Institutions Users Form"
Cohesion: 0.07
Nodes (43): DEFAULT_FACULTY_WORKSPACES, SuperAdminDashboard(), WORKSPACE_ICONS, InstitutionsPage(), SettingsPage(), DEFAULT_USERS, PlatformUser, ROLE_OPTIONS (+35 more)

### Community 5 - "Routes Middleware Router"
Cohesion: 0.10
Nodes (26): AuthenticatedUser, authMiddleware(), Express, Request, requirePermission(), resourceGuard(), ResourceGuardOptions, tenantMiddleware() (+18 more)

### Community 6 - "Academics Controller Academicscontroller"
Cohesion: 0.07
Nodes (3): academicsController, facultyController, sendSuccess()

### Community 7 - "Repository Service Timetable"
Cohesion: 0.08
Nodes (16): AuditDispatcher, AuditEventPayload, db, ApplicantRow, STAGE_MAP_TO_DB, STAGE_MAP_TO_UI, AttendanceRecordData, AttendanceSessionData (+8 more)

### Community 8 - "Auth Repository Workspaces"
Cohesion: 0.08
Nodes (21): app, pool, env, AttemptRecord, AuthRateLimiter, AuthRepository, LoginSubject, PASSWORD_DENYLIST (+13 more)

### Community 10 - "States Card Topbar"
Cohesion: 0.09
Nodes (31): PlansPage(), AppShellProps, INSTITUTION_WORKSPACES, PLATFORM_SUPER_ADMIN_WORKSPACES, BadgeProps, ButtonProps, CardDescription, CardFooter (+23 more)

### Community 11 - "Contexts Config Authcontext"
Cohesion: 0.08
Nodes (33): ChangePasswordPage(), LoginPage(), ROLE_WORKSPACE_MAP, DashboardPage(), metadata, RootLayout(), RootPage(), ICON_MAP (+25 more)

### Community 13 - "Package Ref Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, clsx, lucide-react, next, react, react-dom, tailwind-merge, @tanstack/react-query (+31 more)

### Community 14 - "Examinations Repository Examinationsrepository"
Cohesion: 0.06
Nodes (9): ExamData, examinationsRepository, ExamScheduleData, ExamSubjectData, ExamTypeData, GradeScaleData, GradeTierData, MarkData (+1 more)

### Community 15 - "Examinations Controller Examinationscontroller"
Cohesion: 0.10
Nodes (7): errorMiddleware(), requireModuleEnabled(), requireAnyPermission(), requireRole(), auditController, examinationsController, sendError()

### Community 16 - "Finance Repository Financerepository"
Cohesion: 0.07
Nodes (8): FeeCategoryData, FeeGroupData, FeeStructureData, FeeStructureItemData, financeRepository, InvoiceData, PaymentData, StudentFeeData

### Community 18 - "Documents Service Documentsservice"
Cohesion: 0.14
Nodes (7): AppError, DocumentRecord, DocumentRequestRecord, DocumentTemplateRecord, DocumentTypeRecord, DocumentVerificationRecord, DocumentsService

### Community 19 - "Student Studentprofile Users"
Cohesion: 0.13
Nodes (14): CameraDeck, BillingPage(), MonitoringPage(), StudentMasterPage(), MOCK_STUDENT, StudentMasterData, StudentProfile(), StudentProfileProps (+6 more)

### Community 20 - "Mobile Package Ref"
Cohesion: 0.07
Nodes (26): styles, dependencies, expo, expo-status-bar, react, react-native, devDependencies, @babel/core (+18 more)

### Community 21 - "Timetable Service Timetableservice"
Cohesion: 0.08
Nodes (3): ConflictResult, ConflictError, timetableService

### Community 24 - "Users Provisioning Service"
Cohesion: 0.12
Nodes (13): BulkProvisionResult, BulkProvisionRowError, provisioningService, ProvisionResult, ProvisionUserInput, resolveRoleTemplate(), ROLE_TEMPLATES, RoleTemplate (+5 more)

### Community 30 - "Scan Gate Report"
Cohesion: 0.11
Nodes (18): BACKEND_DIR, DOCS_DIR, FRONTEND_DIR, generateGateReport(), getGitCommit(), ROOT_DIR, runCommand(), EXCLUDED_PATTERNS (+10 more)

### Community 32 - "Ref Package Json"
Cohesion: 0.11
Nodes (18): description, @types/node, typescript, zod, main, name, version, cors (+10 more)

### Community 34 - "Tsconfig Compileroptions Allowjs"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 35 - "Mobile Expo Splash"
Cohesion: 0.11
Nodes (17): backgroundColor, foregroundImage, adaptiveIcon, expo, android, icon, ios, name (+9 more)

### Community 36 - "Error Format Tenant"
Cohesion: 0.15
Nodes (9): ApiErrorDetail, ApiErrorResponse, PermissionDeniedError, ResourceNotFoundError, TenantViolationError, BaseEntity, PaginatedResult, PaginationOptions (+1 more)

### Community 37 - "Hrms Repository Service"
Cohesion: 0.18
Nodes (8): DepartmentRecord, DesignationRecord, LeaveRequestRecord, LeaveTypeRecord, StaffAttendanceRecord, StaffEmploymentHistory, StaffRecord, notificationService

### Community 39 - "Packages Api Client"
Cohesion: 0.13
Nodes (14): dependencies, @vid/schemas, description, devDependencies, typescript, typescript, main, name (+6 more)

### Community 40 - "Packages Schemas Package"
Cohesion: 0.13
Nodes (14): dependencies, zod, description, devDependencies, typescript, typescript, zod, main (+6 more)

### Community 41 - "Package Build Migrate"
Cohesion: 0.14
Nodes (14): scripts, build, db:migrate, db:seed, dev, gate:r, scan:forbidden, start (+6 more)

### Community 45 - "Tsconfig Compileroptions Esmoduleinterop"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule, rootDir (+4 more)

### Community 46 - "Packages Api Client"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir (+4 more)

### Community 47 - "Audit Repository Auditrepository"
Cohesion: 0.20
Nodes (3): AuditRecord, auditRepository, auditService

### Community 50 - "Packages Schemas Tsconfig"
Cohesion: 0.17
Nodes (11): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, skipLibCheck (+3 more)

### Community 51 - "Hrms Controller Actionleaveschema"
Cohesion: 0.18
Nodes (10): actionLeaveSchema, applyLeaveSchema, checkDuplicateSchema, createDepartmentSchema, createDesignationSchema, createLeaveTypeSchema, hrmsService, markAttendanceSchema (+2 more)

### Community 54 - "Packages Schemas Apierrordetailschema"
Cohesion: 0.18
Nodes (8): ApiErrorDetailSchema, ApiErrorResponse, ApiErrorSchema, BaseEntitySchema, PaginationQuery, PaginationQuerySchema, TenantContext, TenantContextSchema

### Community 55 - "Package Dependencies Bcryptjs"
Cohesion: 0.20
Nodes (10): dependencies, bcryptjs, cors, dotenv, express, helmet, jsonwebtoken, morgan (+2 more)

### Community 56 - "Package Devdependencies Tsx"
Cohesion: 0.20
Nodes (10): devDependencies, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken, @types/morgan, @types/node (+2 more)

### Community 57 - "Documents Controller Bonafideschema"
Cohesion: 0.20
Nodes (9): bonafideSchema, createTemplateSchema, createTypeSchema, processRequestSchema, requestDocumentSchema, transferCertSchema, updateTemplateSchema, uploadDocumentSchema (+1 more)

### Community 59 - "Package Build Dev"
Cohesion: 0.22
Nodes (8): name, private, scripts, build:backend, build:frontend, dev:backend, dev:frontend, version

### Community 66 - "Tsconfig Mobile Compileroptions"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 67 - "Structures Finance Classfeestructure"
Cohesion: 0.50
Nodes (3): ClassFeeStructure, FeeHead, INITIAL_STRUCTURES

## Knowledge Gaps
- **388 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+383 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 663 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sendSuccess()` connect `Academics Controller Academicscontroller` to `Notifications Notification Controller`, `Routes Middleware Router`, `Admissions Controller Admissionscontroller`, `Auth Repository Workspaces`, `Attendance Controller Attendancecontroller`, `Examinations Controller Examinationscontroller`, `Audit Repository Auditrepository`, `Students Student Service`, `Timetable Controller Timetablecontroller`, `Hrms Controller Actionleaveschema`, `Institutions Institution Controller`, `Hrms Controller Hrmscontroller`, `Users Provisioning Service`, `Documents Controller Bonafideschema`, `Finance Controller Financecontroller`, `Students Student Controller`, `Documents Controller Documentscontroller`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _388 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Api Hooks Students` be split into smaller, more focused modules?**
  _Cohesion score 0.0534134007585335 - nodes in this community are weakly interconnected._
- **Why does `sendError()` connect `Examinations Controller Examinationscontroller` to `Notifications Notification Controller`, `Routes Middleware Router`, `Academics Controller Academicscontroller`, `Repository Service Timetable`, `Auth Repository Workspaces`, `Academics Service Academicsservice`, `Admissions Controller Admissionscontroller`, `Attendance Controller Attendancecontroller`, `Audit Repository Auditrepository`, `Students Student Service`, `Timetable Controller Timetablecontroller`, `Hrms Controller Actionleaveschema`, `Hrms Controller Hrmscontroller`, `Users Provisioning Service`, `Documents Controller Bonafideschema`, `Finance Controller Financecontroller`, `Students Student Controller`, `Documents Controller Documentscontroller`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `Hrms Repository Hrmsrepository` be split into smaller, more focused modules?**
  _Cohesion score 0.049872122762148335 - nodes in this community are weakly interconnected._
- **Why does `academicsRepository` connect `Academics Repository Academicsrepository` to `Academics Repository Academicsrepository`, `Academics Repository Academicsrepository`, `Repository Service Timetable`, `Hrms Controller Actionleaveschema`, `Academics Repository Academicsrepository`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Attendance Faculty Examinations` be split into smaller, more focused modules?**
  _Cohesion score 0.14807692307692308 - nodes in this community are weakly interconnected._