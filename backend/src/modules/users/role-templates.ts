export interface RoleTemplate {
  key: string;
  name: string;
  roleName: string;
  description: string;
  defaultWorkspaces: string[];
  scope: string;
  requiresStaffRecord: boolean;
}

export const ROLE_TEMPLATES: Record<string, RoleTemplate> = {
  TEACHER: {
    key: 'TEACHER',
    name: 'Teacher',
    roleName: 'Faculty',
    description: 'Classroom teaching, student attendance, marks entry, and timetable schedule',
    defaultWorkspaces: ['faculty', 'academics', 'attendance', 'examinations', 'timetable'],
    scope: 'resource_scoped',
    requiresStaffRecord: true,
  },
  HR_OFFICER: {
    key: 'HR_OFFICER',
    name: 'HR Officer',
    roleName: 'HR Staff',
    description: 'Staff directory management, leave approvals, designations, and HR analytics',
    defaultWorkspaces: ['hrms'],
    scope: 'full_hrms',
    requiresStaffRecord: true,
  },
  ADMISSION_OFFICER: {
    key: 'ADMISSION_OFFICER',
    name: 'Admission Officer',
    roleName: 'Admission Team',
    description: 'Inquiries, applicant pipeline, document verification, and student enrollment',
    defaultWorkspaces: ['admissions', 'documents'],
    scope: 'full_admissions',
    requiresStaffRecord: false,
  },
  ACADEMIC_COORDINATOR: {
    key: 'ACADEMIC_COORDINATOR',
    name: 'Academic Coordinator',
    roleName: 'Academic Coordinator',
    description: 'Curriculum structure, classes & sections, grade scales, and faculty allocation',
    defaultWorkspaces: ['academics', 'faculty', 'timetable'],
    scope: 'full_academics',
    requiresStaffRecord: true,
  },
  FINANCE_OFFICER: {
    key: 'FINANCE_OFFICER',
    name: 'Finance Officer',
    roleName: 'Finance Team',
    description: 'Fee structures, POS collection, invoices, receipts, and ledger reconciliation',
    defaultWorkspaces: ['finance', 'admissions'],
    scope: 'full_finance',
    requiresStaffRecord: false,
  },
  EXAM_OFFICER: {
    key: 'EXAM_OFFICER',
    name: 'Exam Officer',
    roleName: 'Exam Team',
    description: 'Exam scheduling, hall tickets, marks verification, ranking, and report cards',
    defaultWorkspaces: ['examinations', 'academics'],
    scope: 'full_examinations',
    requiresStaffRecord: false,
  },
  INSTITUTION_ADMIN: {
    key: 'INSTITUTION_ADMIN',
    name: 'Institution Administrator',
    roleName: 'Institution Admin',
    description: 'Full institutional operations, tenant configuration, and cross-workspace authority',
    defaultWorkspaces: [
      'institute-admin',
      'hrms',
      'admissions',
      'academics',
      'faculty',
      'attendance',
      'examinations',
      'finance',
      'timetable',
      'documents',
      'reports',
      'settings',
    ],
    scope: 'institution_admin',
    requiresStaffRecord: false,
  },
  SUPER_ADMIN: {
    key: 'SUPER_ADMIN',
    name: 'Super Administrator',
    roleName: 'Super Admin',
    description: 'Platform infrastructure, cross-tenant provisioning, and ecosystem monitoring',
    defaultWorkspaces: ['platform'],
    scope: 'platform_admin',
    requiresStaffRecord: false,
  },
};

export function resolveRoleTemplate(identifier?: string | null): RoleTemplate {
  if (!identifier) {
    return ROLE_TEMPLATES.TEACHER;
  }

  const clean = identifier.trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');

  if (ROLE_TEMPLATES[clean]) {
    return ROLE_TEMPLATES[clean];
  }

  for (const tpl of Object.values(ROLE_TEMPLATES)) {
    if (
      tpl.name.toUpperCase() === identifier.trim().toUpperCase() ||
      tpl.roleName.toUpperCase() === identifier.trim().toUpperCase() ||
      tpl.roleName.toUpperCase().replace(/\s+/g, '_') === clean
    ) {
      return tpl;
    }
  }

  return ROLE_TEMPLATES.TEACHER;
}
