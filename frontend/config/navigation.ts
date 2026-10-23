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
      label: "INSTITUTE ADMIN WORKSPACE",
      items: [
        { title: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
        { title: "Academic Configuration", href: "/admin/academic-configuration", iconName: "Layers" },
        { title: "Admission Control", href: "/admin/admission-control", iconName: "UserPlus" },
        { title: "Institute Settings", href: "/admin/settings", iconName: "Sliders" },
      ],
    },
    {
      label: "SYSTEM & USERS",
      items: [
        { title: "Faculty & User Accounts", href: "/dashboard?tab=users", iconName: "Users" },
        { title: "Settings Shell", href: "/settings", iconName: "Settings" },
      ],
    },
  ],

  FACULTY: [
    {
      label: "FACULTY MANAGEMENT",
      items: [
        { title: "Faculty Dashboard", href: "/faculty/dashboard", iconName: "LayoutDashboard" },
        { title: "My Assigned Courses", href: "/faculty/courses", iconName: "BookOpen" },
        { title: "My Mentees", href: "/faculty/mentees", iconName: "Users" },
        { title: "Marks and Assignment", href: "/faculty/marks-assignments", iconName: "FileSpreadsheet" },
      ],
    },
  ],

  ADMISSION_TEAM: [
    {
      label: "ADMISSIONS",
      items: [
        { title: "Admissions & Enrollment", href: "/admissions", iconName: "UserPlus" },
        { title: "Applications Pipeline", href: "/admissions?tab=pipeline", iconName: "LayoutDashboard" },
        { title: "Document Verification", href: "/admissions/documents", iconName: "FileText" },
        { title: "Enrolled Students", href: "/admissions/enrolled", iconName: "CheckCircle2" },
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
        { title: "Classes or Grades", href: "/academics/hierarchy", iconName: "Layers" },
        { title: "Subject Master", href: "/academics?tab=subjects", iconName: "BookOpen" },
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

import { isPathAllowedForWorkspaces } from "./workspaces"

/**
 * Filter navigation dynamically per Role, Enabled Optional Modules, and Assigned Workspaces (PRD Rules 5 & 25)
 */
export function getFilteredNavigation(
  role: RoleType,
  enabledModules: string[] = ["events", "transport", "hostel", "library", "sports", "inventory"],
  assignedWorkspaces?: string[]
): NavGroup[] {
  const groups = NAVIGATION_CONFIG[role] || NAVIGATION_CONFIG.INSTITUTION_ADMIN

  return groups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (item.optionalModuleKey && !enabledModules.includes(item.optionalModuleKey)) {
          return false
        }
        if (role === "INSTITUTION_ADMIN" && assignedWorkspaces !== undefined) {
          if (!isPathAllowedForWorkspaces(item.href, assignedWorkspaces)) {
            return false
          }
        }
        return true
      })
      return {
        ...group,
        items: filteredItems,
      }
    })
    .filter((group) => group.items.length > 0)
}
