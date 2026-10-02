export interface WorkspaceNavItem {
  title: string
  href: string
  iconName: string
  badge?: string
  badgeVariant?: "neutral" | "positive" | "warning" | "error"
  optionalModuleKey?: "events" | "transport" | "hostel" | "library" | "sports" | "inventory"
}

export interface PlatformWorkspace {
  id: string
  name: string
  shortName: string
  category: "OVERVIEW" | "CORE" | "SERVICES" | "SETTINGS" | "PLATFORM"
  description: string
  iconName: string
  primaryRoute: string
  routes: string[]
  navItems: WorkspaceNavItem[]
}

export const PLATFORM_WORKSPACES: PlatformWorkspace[] = [
  {
    id: "dashboard",
    name: "Executive Workspace Hub",
    shortName: "Hub",
    category: "OVERVIEW",
    description: "Multi-tenant institutional overview, enrollment stats and workspace launcher",
    iconName: "LayoutDashboard",
    primaryRoute: "/dashboard",
    routes: ["/dashboard"],
    navItems: [
      { title: "Executive Overview", href: "/dashboard", iconName: "LayoutDashboard" },
      { title: "Student Master 360°", href: "/students/cccccccc-cccc-cccc-cccc-cccccccccc01", iconName: "User" },
    ],
  },
  {
    id: "admissions",
    name: "Admissions & Enrollment",
    shortName: "Admissions",
    category: "CORE",
    description: "Applicant Kanban, inquiry management and student enrollment pipeline",
    iconName: "UserPlus",
    primaryRoute: "/admissions",
    routes: ["/admissions"],
    navItems: [
      { title: "Applications Kanban", href: "/admissions", iconName: "LayoutDashboard" },
      { title: "Lead Inquiries", href: "/admissions?stage=INQUIRY", iconName: "UserCheck", badge: "Live" },
      { title: "Document Verification", href: "/admissions?stage=DOCUMENT_VERIFICATION", iconName: "FileText" },
      { title: "Enrolled Roster", href: "/admissions?stage=ENROLLED", iconName: "CheckCircle2" },
    ],
  },
  {
    id: "academics",
    name: "Academics & Curriculum",
    shortName: "Academics",
    category: "CORE",
    description: "Grade hierarchies, sections, subjects and curriculum catalog",
    iconName: "GraduationCap",
    primaryRoute: "/academics/hierarchy",
    routes: ["/academics"],
    navItems: [
      { title: "Academic Hierarchy", href: "/academics/hierarchy", iconName: "Layers" },
      { title: "Grade Sections", href: "/academics/hierarchy?view=sections", iconName: "GraduationCap" },
      { title: "Subject Catalog", href: "/academics/hierarchy?view=subjects", iconName: "BookOpen" },
    ],
  },
  {
    id: "faculty",
    name: "Faculty Management",
    shortName: "Faculty",
    category: "CORE",
    description: "Teaching staff allocation, teacher profiles and workloads",
    iconName: "BookOpen",
    primaryRoute: "/faculty/dashboard",
    routes: ["/faculty"],
    navItems: [
      { title: "Faculty Overview", href: "/faculty/dashboard", iconName: "LayoutDashboard" },
      { title: "My Assigned Sections", href: "/faculty/dashboard?view=sections", iconName: "Users" },
      { title: "Roll-Call Attendance", href: "/attendance/sessions", iconName: "CalendarCheck" },
      { title: "Marks & Assessments", href: "/examinations/schedules", iconName: "FileSpreadsheet" },
    ],
  },
  {
    id: "attendance",
    name: "Attendance System",
    shortName: "Attendance",
    category: "CORE",
    description: "Daily roll-call sessions, period-wise attendance and student leave",
    iconName: "CalendarCheck",
    primaryRoute: "/attendance/sessions",
    routes: ["/attendance"],
    navItems: [
      { title: "Daily Roll Call", href: "/attendance/sessions", iconName: "CalendarCheck" },
      { title: "Biometric Vision Stream", href: "/attendance/sessions?filter=BIOMETRIC_VISION", iconName: "Clock", badge: "Vision" },
      { title: "Teacher Manual Entry", href: "/attendance/sessions?filter=MANUAL_TEACHER", iconName: "CheckCircle2" },
      { title: "Attendance Anomalies", href: "/attendance/sessions?filter=ANOMALY", iconName: "AlertTriangle", badgeVariant: "warning" },
    ],
  },
  {
    id: "examinations",
    name: "Examinations & Gradebook",
    shortName: "Exams",
    category: "CORE",
    description: "Exam schedules, mark entries, grading rules, Excel import and report cards",
    iconName: "FileSpreadsheet",
    primaryRoute: "/examinations/schedules",
    routes: ["/examinations"],
    navItems: [
      { title: "Exam Schedules", href: "/examinations/schedules", iconName: "Calendar" },
      { title: "Marks Upload Queue", href: "/examinations/schedules?tab=marks", iconName: "FileSpreadsheet" },
      { title: "Report Cards & Ranks", href: "/examinations/schedules?tab=reports", iconName: "Award" },
    ],
  },
  {
    id: "finance",
    name: "Finance & Fee Collection",
    shortName: "Finance",
    category: "CORE",
    description: "Fee structures, invoicing, student balances, payments and receipts",
    iconName: "CreditCard",
    primaryRoute: "/finance/dashboard",
    routes: ["/finance"],
    navItems: [
      { title: "All Invoices & Dues", href: "/finance/dashboard", iconName: "CreditCard" },
      { title: "Pending Overdue", href: "/finance/dashboard?status=OVERDUE", iconName: "AlertTriangle", badgeVariant: "warning", badge: "Due" },
      { title: "Paid Receipts", href: "/finance/dashboard?status=PAID", iconName: "FileCheck" },
      { title: "Counter POS Collection", href: "/finance/dashboard?tab=collect", iconName: "Receipt" },
    ],
  },
  {
    id: "documents",
    name: "Documents Vault",
    shortName: "Documents",
    category: "CORE",
    description: "Digital archive for student certificates, QR Bonafide/TC and verification",
    iconName: "FileText",
    primaryRoute: "/documents/vault",
    routes: ["/documents"],
    navItems: [
      { title: "Vault Repository", href: "/documents/vault", iconName: "FileText" },
      { title: "Institutional Charters", href: "/documents/vault?category=INSTITUTIONAL_CHARTER", iconName: "Layers" },
      { title: "Student Credentials", href: "/documents/vault?category=STUDENT_CREDENTIAL", iconName: "Award" },
      { title: "Compliance Audits", href: "/documents/vault?category=COMPLIANCE", iconName: "ShieldCheck" },
    ],
  },
  {
    id: "hrms",
    name: "Staff & HRMS Workspace",
    shortName: "Staff / HRMS",
    category: "CORE",
    description: "Staff directory, designations, leave management, attendance and payroll",
    iconName: "Briefcase",
    primaryRoute: "/hrms/staff",
    routes: ["/hrms"],
    navItems: [
      { title: "Staff Directory", href: "/hrms/staff", iconName: "Users" },
      { title: "Active Faculty", href: "/hrms/staff?status=ACTIVE", iconName: "CheckCircle2" },
      { title: "On Leave / Sabbatical", href: "/hrms/staff?status=ON_LEAVE", iconName: "Clock" },
      { title: "Teaching Workload", href: "/hrms/staff?tab=workload", iconName: "Activity" },
    ],
  },
  {
    id: "timetable",
    name: "Timetable & Schedules",
    shortName: "Timetable",
    category: "CORE",
    description: "Class timetable matrices, conflict detection and teacher substitutions",
    iconName: "Clock",
    primaryRoute: "/timetable/matrix",
    routes: ["/timetable"],
    navItems: [
      { title: "Timetable Matrix", href: "/timetable/matrix", iconName: "Clock" },
      { title: "Grade 10 Matrix", href: "/timetable/matrix?grade=Grade+10+-+Section+A", iconName: "Calendar" },
      { title: "Grade 11 Matrix", href: "/timetable/matrix?grade=Grade+11+-+Section+A", iconName: "Layers" },
    ],
  },
  {
    id: "campus_life",
    name: "Campus Services",
    shortName: "Campus Services",
    category: "SERVICES",
    description: "Fleet transport, hostel beds, library books, sports, and assets",
    iconName: "Package",
    primaryRoute: "/events",
    routes: ["/events", "/transport", "/hostel", "/library", "/sports", "/inventory"],
    navItems: [
      { title: "Events & Calendar", href: "/events", iconName: "Calendar", optionalModuleKey: "events" },
      { title: "Transport Fleet", href: "/transport", iconName: "Bus", optionalModuleKey: "transport" },
      { title: "Hostel & Rooms", href: "/hostel", iconName: "Home", optionalModuleKey: "hostel" },
      { title: "Library Catalog", href: "/library", iconName: "Library", optionalModuleKey: "library" },
      { title: "Sports & Teams", href: "/sports", iconName: "Trophy", optionalModuleKey: "sports" },
      { title: "Inventory & Assets", href: "/inventory", iconName: "Package", optionalModuleKey: "inventory" },
    ],
  },
  {
    id: "settings",
    name: "Institutional Settings",
    shortName: "Settings",
    category: "SETTINGS",
    description: "School branding, academic calendar years and tenant settings",
    iconName: "Settings",
    primaryRoute: "/settings",
    routes: ["/settings", "/security"],
    navItems: [
      { title: "Institution Profile", href: "/settings", iconName: "Building2" },
      { title: "Security & Permissions", href: "/security", iconName: "ShieldCheck" },
    ],
  },
]

// Super Admin Platform Workspaces
export const SUPER_ADMIN_WORKSPACES: PlatformWorkspace[] = [
  {
    id: "platform",
    name: "Super Admin Platform Console",
    shortName: "Platform",
    category: "PLATFORM",
    description: "Multi-tenant provisioning, platform users, billing and system telemetry",
    iconName: "Building2",
    primaryRoute: "/dashboard",
    routes: ["/dashboard", "/institutions", "/plans", "/users", "/monitoring", "/security", "/billing", "/settings"],
    navItems: [
      { title: "Executive Overview", href: "/dashboard", iconName: "LayoutDashboard" },
      { title: "Institutions & Tenants", href: "/institutions", iconName: "Building2" },
      { title: "Subscription Plans", href: "/plans", iconName: "Layers" },
      { title: "Platform Users", href: "/users", iconName: "Users" },
      { title: "Security & Policies", href: "/security", iconName: "ShieldCheck" },
      { title: "Telemetry & Health", href: "/monitoring", iconName: "Activity" },
      { title: "Billing & Revenue", href: "/billing", iconName: "CreditCard" },
      { title: "Platform Settings", href: "/settings", iconName: "Settings" },
    ],
  },
]

export function getWorkspaceForPath(path?: string): PlatformWorkspace | undefined {
  if (!path) return undefined
  const cleanPath = path.split("?")[0].replace(/\/$/, "") || "/"
  if (cleanPath === "/dashboard" || cleanPath === "") {
    return PLATFORM_WORKSPACES.find((w) => w.id === "dashboard")
  }
  return PLATFORM_WORKSPACES.find((w) =>
    w.id !== "dashboard" &&
    w.routes.some((r) => {
      const cleanRoute = r.replace(/\/$/, "")
      return cleanPath === cleanRoute || cleanPath.startsWith(cleanRoute + "/")
    })
  )
}

export function isPathAllowedForWorkspaces(
  path: string,
  assignedWorkspaces?: string[]
): boolean {
  if (assignedWorkspaces === undefined) {
    return true
  }
  const matchingWorkspace = getWorkspaceForPath(path)
  if (!matchingWorkspace || matchingWorkspace.id === "dashboard") {
    return true
  }
  return assignedWorkspaces.includes(matchingWorkspace.id)
}
