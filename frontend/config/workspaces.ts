export interface PlatformWorkspace {
  id: string
  name: string
  category: "OVERVIEW" | "CORE" | "AI YANTRA" | "SERVICES" | "SETTINGS"
  description: string
  routes: string[]
}

export const PLATFORM_WORKSPACES: PlatformWorkspace[] = [
  {
    id: "dashboard",
    name: "Executive Dashboard",
    category: "OVERVIEW",
    description: "Enrollment metrics, attendance overview and financial KPIs",
    routes: ["/dashboard"],
  },
  {
    id: "admissions",
    name: "Admissions & Enrollment",
    category: "CORE",
    description: "Applicant Kanban, inquiry management and document checks",
    routes: ["/admissions", "/admissions/enquiries"],
  },
  {
    id: "academics",
    name: "Academics & Curriculum",
    category: "CORE",
    description: "Grade hierarchies, sections, subjects and syllabus schemes",
    routes: ["/academics/hierarchy"],
  },
  {
    id: "faculty",
    name: "Faculty Management",
    category: "CORE",
    description: "Teaching staff allocation, teacher profiles and workloads",
    routes: ["/faculty/dashboard", "/faculty/my-students", "/faculty/attendance"],
  },
  {
    id: "attendance",
    name: "Attendance System",
    category: "CORE",
    description: "Daily roll-call sessions, student leave and audit logs",
    routes: ["/attendance/sessions"],
  },
  {
    id: "examinations",
    name: "Examinations & Marks",
    category: "CORE",
    description: "Exam schedules, mark entries, grading rules and report cards",
    routes: ["/examinations/schedules", "/examinations/marks"],
  },
  {
    id: "finance",
    name: "Finance & Fee Collection",
    category: "CORE",
    description: "Fee structures, invoicing, student balances and receipts",
    routes: ["/finance/dashboard"],
  },
  {
    id: "documents",
    name: "Documents Vault",
    category: "CORE",
    description: "Digital archive for student certificates, records and files",
    routes: ["/documents/vault"],
  },
  {
    id: "hrms",
    name: "Staff / HRMS",
    category: "CORE",
    description: "Employee registry, department hierarchy and staff profiles",
    routes: ["/hrms/staff"],
  },
  {
    id: "timetable",
    name: "Timetable & Schedules",
    category: "CORE",
    description: "Bell schedules, class timetable matrices and clash detection",
    routes: ["/timetable/matrix"],
  },
  {
    id: "ai_yantra",
    name: "AI Yantra Suite",
    category: "AI YANTRA",
    description: "Voice dispatch agent, biometric attendance and AI tutor analytics",
    routes: [
      "/voice-agent/campaigns",
      "/ai-attendance/monitoring",
      "/ai-tutor/analytics",
      "/ai-tutor/chat",
    ],
  },
  {
    id: "campus_life",
    name: "Campus Services & Logistics",
    category: "SERVICES",
    description: "Transport fleet, student hostel, library catalog, sports, inventory",
    routes: [
      "/events",
      "/transport",
      "/hostel",
      "/library",
      "/sports",
      "/inventory",
    ],
  },
  {
    id: "settings",
    name: "Institutional Settings",
    category: "SETTINGS",
    description: "School branding, academic calendar years and tenant settings",
    routes: ["/settings"],
  },
]

export function getWorkspaceForPath(path: string): PlatformWorkspace | undefined {
  return PLATFORM_WORKSPACES.find((w) =>
    w.routes.some((r) => path === r || path.startsWith(r + "/") || (r !== "/" && path.startsWith(r)))
  )
}

export function isPathAllowedForWorkspaces(
  path: string,
  assignedWorkspaces?: string[]
): boolean {
  // If undefined, allow all (Super Admin or unrestricted)
  if (assignedWorkspaces === undefined) {
    return true
  }

  // Find which workspace this path belongs to
  const matchingWorkspace = getWorkspaceForPath(path)

  // If path doesn't match any restricted workspace (e.g. /profile, /login), allow it
  if (!matchingWorkspace) {
    return true
  }

  return assignedWorkspaces.includes(matchingWorkspace.id)
}
