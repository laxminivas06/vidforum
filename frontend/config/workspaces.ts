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

export const WORKSPACE_ORDER: string[] = [
  "dashboard",
  "hrms",
  "academics",
  "admissions",
  "faculty",
  "examinations",
  "attendance",
  "timetable",
  "finance",
  "documents",
  "campus_life",
  "ai_yantra",
  "settings",
]

export const PLATFORM_WORKSPACES: PlatformWorkspace[] = [
  {
    id: "dashboard",
    name: "Institute Admin Workspace",
    shortName: "Institute Admin",
    category: "OVERVIEW",
    description: "Multi-tenant institutional administration, academic configurations, admission control, fee management, and user provisioning",
    iconName: "ShieldCheck",
    primaryRoute: "/dashboard",
    routes: [
      "/dashboard",
      "/admin",
      "/admin/settings",
      "/admin/academic-configuration",
      "/admin/admission-information",
      "/admin/admission-control",
      "/admin/admission-fees",
      "/admin/academic-fees",
      "/admin/payments",
      "/academics/configuration",
      "/admissions/information",
      "/admissions/control",
      "/admissions/fees",
      "/finance/academic-fees",
    ],
    navItems: [
      { title: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
      { title: "Academic Configuration", href: "/admin/academic-configuration", iconName: "Layers" },
      { title: "Admission Control", href: "/admin/admission-control", iconName: "UserPlus" },
      { title: "Institute Settings", href: "/admin/settings", iconName: "Sliders" },
      { title: "Faculty & User Accounts", href: "/dashboard?tab=users", iconName: "Users" },
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
    id: "academics",
    name: "Academics & Curriculum",
    shortName: "Academics",
    category: "CORE",
    description: "Grade hierarchies, sections, subjects and curriculum catalog",
    iconName: "GraduationCap",
    primaryRoute: "/academics",
    routes: ["/academics", "/academics/configuration"],
    navItems: [
      { title: "Classes or Grades", href: "/academics", iconName: "Layers" },
      { title: "Academic Configuration", href: "/academics/configuration", iconName: "Settings", badge: "Base" },
      { title: "Subject Master", href: "/academics?tab=subjects", iconName: "BookOpen" },
      { title: "Curriculum Mapping", href: "/academics?tab=mapping", iconName: "GraduationCap" },
      { title: "Year Exam Schedule", href: "/academics?tab=exams", iconName: "CalendarCheck" },
      { title: "Preferred Textbooks", href: "/academics?tab=textbooks", iconName: "BookMarked" },
      { title: "Academic Years", href: "/academics?tab=years", iconName: "Calendar" },
      { title: "Working Days & Schedule", href: "/academics?tab=calendar", iconName: "Clock" },
    ],
  },
  {
    id: "admissions",
    name: "Admissions & Enrollment",
    shortName: "Admissions",
    category: "CORE",
    description: "Unified admissions evaluation, registration, and student onboarding ecosystem",
    iconName: "UserPlus",
    primaryRoute: "/admissions",
    routes: [
      "/admissions",
      "/admissions/control",
      "/admissions/documents",
      "/admissions/enrolled",
    ],
    navItems: [
      { title: "Admissions & Enrollment", href: "/admissions", iconName: "UserPlus", badge: "Active" },
      { title: "Applications Pipeline", href: "/admissions?tab=pipeline", iconName: "LayoutDashboard" },
      { title: "Document Verification", href: "/admissions/documents", iconName: "FileText", badge: "Desk" },
      { title: "Enrolled Students", href: "/admissions/enrolled", iconName: "CheckCircle2", badge: "Roster" },
    ],
  },
  {
    id: "faculty",
    name: "Faculty Management",
    shortName: "Faculty",
    category: "CORE",
    description: "Teaching staff allocation, teacher profiles, assigned courses and mentee tracking",
    iconName: "BookOpen",
    primaryRoute: "/faculty/dashboard",
    routes: ["/faculty"],
    navItems: [
      { title: "Faculty Dashboard", href: "/faculty/dashboard", iconName: "LayoutDashboard" },
      { title: "My Assigned Courses", href: "/faculty/courses", iconName: "BookOpen" },
      { title: "My Mentees", href: "/faculty/mentees", iconName: "Users" },
      { title: "Marks and Assignment", href: "/faculty/marks-assignments", iconName: "FileSpreadsheet" },
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
    id: "attendance",
    name: "Attendance System",
    shortName: "Attendance",
    category: "CORE",
    description: "Daily roll-call sessions, period-wise attendance and student leave",
    iconName: "CalendarCheck",
    primaryRoute: "/attendance/sessions",
    routes: ["/attendance", "/attendance/face", "/attendance/reports"],
    navItems: [
      { title: "Daily Roll Call", href: "/attendance/sessions", iconName: "CalendarCheck" },
      { title: "Face Attendance", href: "/attendance/face", iconName: "ScanFace", badge: "AI" },
      { title: "Attendance Reports", href: "/attendance/reports", iconName: "Activity" },
      { title: "Face Enrollment", href: "/attendance/face/enroll", iconName: "UserPlus" },
      { title: "Teacher Manual Entry", href: "/attendance/sessions?filter=MANUAL_TEACHER", iconName: "CheckCircle2" },
      { title: "Attendance Anomalies", href: "/attendance/sessions?filter=ANOMALY", iconName: "AlertTriangle", badgeVariant: "warning" },
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
    id: "finance",
    name: "Finance & Fee Collection",
    shortName: "Finance",
    category: "CORE",
    description: "Fee structures, invoicing, student balances, payments and receipts",
    iconName: "CreditCard",
    primaryRoute: "/finance/dashboard",
    routes: ["/finance", "/finance/academic-fees", "/finance/payments"],
    navItems: [
      { title: "All Invoices & Dues", href: "/finance/dashboard", iconName: "CreditCard" },
      { title: "Academic Fees", href: "/finance/academic-fees", iconName: "Layers", badge: "New" },
      { title: "Payment Records", href: "/finance/payments", iconName: "Receipt" },
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
    id: "ai_yantra",
    name: "AI Yantra Workspace",
    shortName: "AI Yantra",
    category: "SERVICES",
    description: "Multilingual conversational voice agent, biometric facial attendance, and intelligent tutoring insights",
    iconName: "Cpu",
    primaryRoute: "/voice-agent/campaigns",
    routes: ["/voice-agent", "/ai-tutor"],
    navItems: [
      { title: "Voice Agent", href: "/voice-agent/campaigns", iconName: "PhoneCall", badge: "AI" },
      { title: "AI Attendance", href: "/attendance/face", iconName: "ScanFace", badge: "Live" },
      { title: "AI Tutor", href: "/ai-tutor/chat", iconName: "Bot" },
      { title: "Tutor Textbooks", href: "/ai-tutor/textbooks", iconName: "BookOpen" },
      { title: "AI Tutor Insights", href: "/ai-tutor/analytics", iconName: "Bot" },
    ],
  },
  {
    id: "settings",
    name: "Institute Settings",
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

export function sortWorkspaceIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const idxA = WORKSPACE_ORDER.indexOf(a)
    const idxB = WORKSPACE_ORDER.indexOf(b)
    const orderA = idxA === -1 ? 999 : idxA
    const orderB = idxB === -1 ? 999 : idxB
    return orderA - orderB
  })
}

export function getPermittedWorkspaces(assignedWorkspaces?: string[]): PlatformWorkspace[] {
  if (!assignedWorkspaces || assignedWorkspaces.length === 0 || assignedWorkspaces.includes("*")) {
    return PLATFORM_WORKSPACES
  }
  return PLATFORM_WORKSPACES.filter((ws) => assignedWorkspaces.includes(ws.id))
}

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
  
  // 1. Institute Admin Workspace check first (so /admin and integrated pages remain inside Institute Admin)
  const dashboardWs = PLATFORM_WORKSPACES.find((w) => w.id === "dashboard")
  if (
    cleanPath === "/dashboard" ||
    cleanPath === "" ||
    cleanPath.startsWith("/admin") ||
    (dashboardWs &&
      dashboardWs.routes.some((r) => {
        const cleanRoute = r.replace(/\/$/, "")
        return cleanPath === cleanRoute || cleanPath.startsWith(cleanRoute + "/")
      }))
  ) {
    return dashboardWs
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
