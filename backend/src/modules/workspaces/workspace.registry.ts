export interface WorkspaceDefinition {
  key: string;
  title: string;
  category: 'OVERVIEW' | 'CORE' | 'SERVICES' | 'SETTINGS' | 'PLATFORM';
  primaryRoute: string;
  description: string;
  backendPrefix: string;
  defaultRoles: string[];
}

export const CANONICAL_WORKSPACES: WorkspaceDefinition[] = [
  {
    key: 'dashboard',
    title: 'Institute Admin Workspace',
    category: 'OVERVIEW',
    primaryRoute: '/dashboard',
    description: 'Central operational dashboard, student 360 overview, and administrative summary.',
    backendPrefix: '/api/v1/users',
    defaultRoles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'admissions',
    title: 'Admissions & Enrollment',
    category: 'CORE',
    primaryRoute: '/admissions',
    description: 'Applicant pipeline, inquiry tracking, document verification, and enrolled roster.',
    backendPrefix: '/api/v1/admissions',
    defaultRoles: ['INSTITUTION_ADMIN', 'ADMISSION_TEAM'],
  },
  {
    key: 'academics',
    title: 'Academics & Curriculum',
    category: 'CORE',
    primaryRoute: '/academics/hierarchy',
    description: 'Academic hierarchy, grades, sections, subjects mapping, schedules, and textbooks.',
    backendPrefix: '/api/v1/academics',
    defaultRoles: ['INSTITUTION_ADMIN', 'ACADEMIC_COORDINATOR', 'FACULTY'],
  },
  {
    key: 'faculty',
    title: 'Faculty Management',
    category: 'CORE',
    primaryRoute: '/faculty/dashboard',
    description: 'Teacher allocations, subject assignments, class teachers, and workload analytics.',
    backendPrefix: '/api/v1/faculty',
    defaultRoles: ['INSTITUTION_ADMIN', 'ACADEMIC_COORDINATOR', 'FACULTY'],
  },
  {
    key: 'attendance',
    title: 'Attendance System',
    category: 'CORE',
    primaryRoute: '/attendance/sessions',
    description: 'Daily roll call, period sessions, biometric sync, absence tracking, and leave reconciliation.',
    backendPrefix: '/api/v1/attendance',
    defaultRoles: ['INSTITUTION_ADMIN', 'FACULTY'],
  },
  {
    key: 'examinations',
    title: 'Examinations & Gradebook',
    category: 'CORE',
    primaryRoute: '/examinations/schedules',
    description: 'Exam scheduling, marks entry, pre-commit validation, grading curves, and report cards.',
    backendPrefix: '/api/v1/examinations',
    defaultRoles: ['INSTITUTION_ADMIN', 'EXAM_TEAM', 'FACULTY'],
  },
  {
    key: 'finance',
    title: 'Finance & Fee Collection',
    category: 'CORE',
    primaryRoute: '/finance/dashboard',
    description: 'Fee structures, student invoicing, counter POS collections, receipts, and ledger.',
    backendPrefix: '/api/v1/finance',
    defaultRoles: ['INSTITUTION_ADMIN', 'FINANCE_TEAM'],
  },
  {
    key: 'documents',
    title: 'Documents Vault',
    category: 'CORE',
    primaryRoute: '/documents/vault',
    description: 'Institutional document repository, verification workflows, and QR-verifiable certificate issuance.',
    backendPrefix: '/api/v1/documents',
    defaultRoles: ['INSTITUTION_ADMIN', 'ADMISSION_TEAM'],
  },
  {
    key: 'hrms',
    title: 'Staff & HRMS Workspace',
    category: 'CORE',
    primaryRoute: '/hrms/staff',
    description: 'Staff directory, HR onboarding, bulk imports, leave management, and staff attendance.',
    backendPrefix: '/api/v1/hrms',
    defaultRoles: ['INSTITUTION_ADMIN', 'HR_STAFF'],
  },
  {
    key: 'timetable',
    title: 'Timetable & Schedules',
    category: 'CORE',
    primaryRoute: '/timetable/matrix',
    description: 'Timetable matrix editor, periods configuration, conflict detector, and substitutions.',
    backendPrefix: '/api/v1/timetable',
    defaultRoles: ['INSTITUTION_ADMIN', 'ACADEMIC_COORDINATOR', 'FACULTY'],
  },
  {
    key: 'campus_life',
    title: 'Campus Services',
    category: 'SERVICES',
    primaryRoute: '/events',
    description: 'Campus events, transport fleet tracking, hostel occupancy, library catalog, and inventory.',
    backendPrefix: '/api/v1/optional-modules',
    defaultRoles: ['INSTITUTION_ADMIN'],
  },
  {
    key: 'settings',
    title: 'Institutional Settings',
    category: 'SETTINGS',
    primaryRoute: '/settings',
    description: 'Institution profile, configuration policies, outbox notifications, and audit log explorer.',
    backendPrefix: '/api/v1/institutions',
    defaultRoles: ['INSTITUTION_ADMIN'],
  },
  {
    key: 'platform',
    title: 'Super Admin Platform Console',
    category: 'PLATFORM',
    primaryRoute: '/dashboard',
    description: 'Global tenant management, subscription plans, platform telemetry, and tenant billing.',
    backendPrefix: '/api/v1/institutions',
    defaultRoles: ['SUPER_ADMIN'],
  },
];
