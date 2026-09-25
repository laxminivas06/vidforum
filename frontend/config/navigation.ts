export interface NavItem {
  title: string
  href: string
  iconName: string // e.g. "LayoutDashboard", "Users", "GraduationCap"
  badge?: string
  badgeVariant?: "neutral" | "positive" | "warning" | "error"
  permission?: string
  optionalModuleKey?: "events" | "transport" | "hostel" | "library" | "sports" | "inventory"
}

export interface NavGroup {
  label: string // e.g. "OVERVIEW", "CORE", "AI YANTRA", "OPTIONAL", "SETTINGS"
  items: NavItem[]
}

export type RoleType =
  | "SUPER_ADMIN"
  | "INSTITUTION_ADMIN"
  | "FACULTY"
  | "ADMISSION_TEAM"
  | "FINANCE_TEAM"
  | "EXAM_TEAM"
  | "ACADEMIC_COORDINATOR"
  | "STUDENT"
  | "PARENT"

export const NAVIGATION_CONFIG: Record<RoleType, NavGroup[]> = {
  SUPER_ADMIN: [
    {
      label: "PLATFORM",
      items: [
        { title: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
        { title: "Institutions", href: "/institutions", iconName: "Building2" },
        { title: "Subscription Plans", href: "/plans", iconName: "Layers" },
        { title: "Platform Users", href: "/users", iconName: "Users" },
      ],
    },
    {
      label: "SYSTEM & AI",
      items: [
        { title: "Security & Roles", href: "/security", iconName: "ShieldCheck" },
        { title: "Telemetry & Health", href: "/monitoring", iconName: "Activity" },
        { title: "AI Yantra Global Config", href: "/ai-config", iconName: "Cpu" },
        { title: "Billing & Revenue", href: "/billing", iconName: "CreditCard" },
        { title: "Platform Settings", href: "/settings", iconName: "Settings" },
      ],
    },
  ],

  INSTITUTION_ADMIN: [
    {
      label: "OVERVIEW",
      items: [
        { title: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
      ],
    },
    {
      label: "CORE",
      items: [
        { title: "Admissions", href: "/admissions", iconName: "UserPlus" },
        { title: "Academics", href: "/academics/hierarchy", iconName: "GraduationCap" },
        { title: "Faculty Management", href: "/faculty/dashboard", iconName: "BookOpen" },
        { title: "Attendance Roll", href: "/attendance/sessions", iconName: "CalendarCheck" },
        { title: "Examinations", href: "/examinations/schedules", iconName: "FileSpreadsheet" },
        { title: "Finance & Fees", href: "/finance/dashboard", iconName: "CreditCard" },
        { title: "Documents Vault", href: "/documents/vault", iconName: "FileText" },
        { title: "Staff / HRMS", href: "/hrms/staff", iconName: "Briefcase" },
        { title: "Timetable", href: "/timetable/matrix", iconName: "Clock" },
      ],
    },
    {
      label: "AI YANTRA",
      items: [
        { title: "Voice Agent", href: "/voice-agent/campaigns", iconName: "PhoneCall", badge: "AI" },
        { title: "AI Attendance", href: "/ai-attendance/monitoring", iconName: "ScanFace", badge: "Live" },
        { title: "AI Tutor Insights", href: "/ai-tutor/analytics", iconName: "Bot" },
      ],
    },
    {
      label: "OPTIONAL",
      items: [
        { title: "Events", href: "/events", iconName: "Calendar", optionalModuleKey: "events" },
        { title: "Transport", href: "/transport", iconName: "Bus", optionalModuleKey: "transport" },
        { title: "Hostel", href: "/hostel", iconName: "Home", optionalModuleKey: "hostel" },
        { title: "Library", href: "/library", iconName: "Library", optionalModuleKey: "library" },
        { title: "Sports", href: "/sports", iconName: "Trophy", optionalModuleKey: "sports" },
        { title: "Inventory & Assets", href: "/inventory", iconName: "Package", optionalModuleKey: "inventory" },
      ],
    },
    {
      label: "CONFIGURATION",
      items: [
        { title: "Settings Shell", href: "/settings", iconName: "Settings" },
      ],
    },
  ],

  FACULTY: [
    {
      label: "MY WORKSPACE",
      items: [
        { title: "Faculty Dashboard", href: "/faculty/dashboard", iconName: "LayoutDashboard" },
        { title: "Today's Schedule", href: "/timetable/matrix", iconName: "Clock" },
        { title: "My Classes & Sections", href: "/faculty/my-students", iconName: "BookOpen" },
        { title: "Roll-Call Attendance", href: "/faculty/attendance", iconName: "CalendarCheck" },
        { title: "Marks & Assessments", href: "/examinations/marks", iconName: "FileSpreadsheet" },
        { title: "AI Tutor Companion", href: "/ai-tutor/chat", iconName: "Bot" },
      ],
    },
  ],

  ADMISSION_TEAM: [
    {
      label: "ADMISSIONS",
      items: [
        { title: "Admissions Kanban", href: "/admissions", iconName: "LayoutDashboard" },
        { title: "Lead Inquiries", href: "/admissions/enquiries", iconName: "UserPlus" },
        { title: "Document Vault", href: "/documents/vault", iconName: "FileText" },
      ],
    },
  ],

  FINANCE_TEAM: [
    {
      label: "FINANCE",
      items: [
        { title: "Finance Dashboard", href: "/finance/dashboard", iconName: "LayoutDashboard" },
        { title: "Fee Structures", href: "/finance/structures", iconName: "Layers" },
        { title: "Invoices Ledger", href: "/finance/invoices", iconName: "CreditCard" },
        { title: "Counter Collection", href: "/finance/collect", iconName: "Receipt" },
      ],
    },
  ],

  EXAM_TEAM: [
    {
      label: "EXAMINATIONS",
      items: [
        { title: "Exam Schedules", href: "/examinations/schedules", iconName: "Calendar" },
        { title: "Marks Entry & Ledger", href: "/examinations/marks", iconName: "FileSpreadsheet" },
        { title: "Excel Import Engine", href: "/examinations/import", iconName: "UploadCloud" },
        { title: "Report Cards", href: "/examinations/report-cards", iconName: "Award" },
      ],
    },
  ],

  ACADEMIC_COORDINATOR: [
    {
      label: "ACADEMICS",
      items: [
        { title: "Academic Hierarchy", href: "/academics/hierarchy", iconName: "Layers" },
        { title: "Subject Catalog", href: "/academics/subjects", iconName: "BookOpen" },
        { title: "Timetable Matrix", href: "/timetable/matrix", iconName: "Clock" },
        { title: "Timetable Conflicts", href: "/timetable/conflicts", iconName: "AlertTriangle" },
      ],
    },
  ],

  STUDENT: [
    {
      label: "STUDENT PORTAL",
      items: [
        { title: "Home Overview", href: "/app/home", iconName: "Home" },
        { title: "Academics", href: "/app/academics", iconName: "BookOpen" },
        { title: "Attendance", href: "/app/attendance", iconName: "CalendarCheck" },
        { title: "Fee Payments", href: "/app/fees", iconName: "CreditCard" },
        { title: "AI Tutor 24/7", href: "/ai-tutor/chat", iconName: "Bot" },
        { title: "My Profile", href: "/app/profile", iconName: "User" },
      ],
    },
  ],

  PARENT: [
    {
      label: "PARENT PORTAL",
      items: [
        { title: "Children Overview", href: "/app/home", iconName: "Users" },
        { title: "Attendance Alerts", href: "/app/attendance", iconName: "CalendarCheck" },
        { title: "Report Cards & Marks", href: "/app/academics", iconName: "Award" },
        { title: "Fee Invoices & Pay", href: "/app/fees", iconName: "CreditCard" },
        { title: "Parent Profile", href: "/app/profile", iconName: "User" },
      ],
    },
  ],
}

/**
 * Filter navigation dynamically per Role and Enabled Optional Modules (PRD Rules 5 & 25)
 */
export function getFilteredNavigation(
  role: RoleType,
  enabledModules: string[] = ["events", "transport", "hostel", "library", "sports", "inventory"]
): NavGroup[] {
  const groups = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.INSTITUTION_ADMIN

  return groups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (!item.optionalModuleKey) return true
        return enabledModules.includes(item.optionalModuleKey)
      })
      return {
        ...group,
        items: filteredItems,
      }
    })
    .filter((group) => group.items.length > 0)
}
