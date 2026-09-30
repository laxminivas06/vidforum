"use client"

import React, { createContext, useContext, useState } from "react"
import { RoleType } from "@/config/navigation"
import { PermissionDenied } from "@/components/ui"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: RoleType
  institutionId: string
  institutionName: string
  avatarUrl?: string
}

export interface AuthContextType {
  user: UserProfile | null
  role: RoleType
  institutionId: string
  institutionName: string
  permissions: string[]
  enabledModules: string[]
  isAuthenticated: boolean
  isInitialized: boolean
  hasPermission: (permission: string) => boolean
  login: (
    identifier: string,
    password?: string,
    explicitRole?: RoleType,
    institutionSlug?: string
  ) => Promise<RoleType>
  logout: () => void
  switchRole: (newRole: RoleType) => void
  toggleOptionalModule: (moduleKey: string) => void
}

const DEFAULT_USER: UserProfile = {
  id: "usr-admin-01",
  name: "Dr. Alistair Vance",
  email: "admin@springfield.edu",
  role: "INSTITUTION_ADMIN",
  institutionId: "inst-springfield-001",
  institutionName: "Springfield International Academy",
}

const ALL_PERMISSIONS = [
  "institutions.manage",
  "users.manage",
  "admissions.read",
  "admissions.write",
  "admissions.approve",
  "academics.manage",
  "faculty.view_assigned",
  "attendance.create",
  "attendance.verify",
  "examinations.manage",
  "examinations.import",
  "finance.read",
  "finance.collect",
  "documents.read",
  "documents.generate",
  "hrms.manage",
  "timetable.manage",
  "ai.voice.dispatch",
  "ai.attendance.monitor",
  "ai.tutor.access",
  "events.manage",
  "transport.manage",
  "hostel.manage",
  "library.manage",
  "sports.manage",
  "inventory.manage",
]

const SUPER_ADMIN_PERMISSIONS = [
  "platform.read",
  "platform.write",
  "platform.admin",
  "institutions.manage",
  "users.manage",
  "security.manage",
  "telemetry.read",
  "billing.manage",
  "plans.manage",
  "ai.config.global",
]

const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
  INSTITUTION_ADMIN: ALL_PERMISSIONS.filter((p) => !p.startsWith("platform.")),
  FACULTY: [
    "faculty.view_assigned",
    "attendance.create",
    "attendance.verify",
    "examinations.manage",
    "examinations.marks.entry",
    "timetable.manage",
    "ai.tutor.access",
    "documents.read",
  ],
  STUDENT: [
    "student.profile.view",
    "attendance.view",
    "examinations.view",
    "finance.read",
    "timetable.manage",
    "ai.tutor.access",
    "documents.read",
  ],
  PARENT: [
    "parent.children.view",
    "attendance.view",
    "examinations.view",
    "finance.read",
    "finance.collect",
    "documents.read",
  ],
  ADMISSION_TEAM: [
    "admissions.read",
    "admissions.write",
    "admissions.approve",
    "documents.read",
    "documents.generate",
  ],
  FINANCE_TEAM: [
    "finance.read",
    "finance.collect",
    "finance.manage",
    "documents.read",
    "documents.generate",
  ],
  EXAM_TEAM: [
    "examinations.manage",
    "examinations.import",
    "examinations.marks.entry",
    "documents.read",
  ],
  ACADEMIC_COORDINATOR: [
    "academics.manage",
    "timetable.manage",
    "faculty.view_assigned",
    "documents.read",
  ],
}

// Known registered accounts lookup for offline resilience
const KNOWN_ACCOUNTS: Record<string, { role: RoleType; name: string; instName: string }> = {
  "superadmin": { role: "SUPER_ADMIN", name: "VID Platform Super Admin", instName: "VID Global Platform" },
  "superadmin@vid.edu": { role: "SUPER_ADMIN", name: "VID Platform Super Admin", instName: "VID Global Platform" },
  "sa-001": { role: "SUPER_ADMIN", name: "VID Platform Super Admin", instName: "VID Global Platform" },
  "admin@springfield.edu": { role: "INSTITUTION_ADMIN", name: "Dr. Alistair Vance", instName: "Springfield International Academy" },
  "revathi.raman@springfield.edu": { role: "FACULTY", name: "Mrs. Revathi Raman", instName: "Springfield International Academy" },
  "arvind.rao@springfield.edu": { role: "FACULTY", name: "Dr. Arvind Rao", instName: "Springfield International Academy" },
  "sia-2026-042": { role: "STUDENT", name: "Aarav Sharma", instName: "Springfield International Academy" },
  "sia-2026-043": { role: "STUDENT", name: "Rhea Nair", instName: "Springfield International Academy" },
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [role, setRole] = useState<RoleType>("INSTITUTION_ADMIN")
  const [enabledModules, setEnabledModules] = useState<string[]>([
    "events",
    "transport",
    "hostel",
    "library",
    "sports",
    "inventory",
  ])
  const [permissions, setPermissions] = useState<string[]>(ALL_PERMISSIONS)

  // Hydrate session from localStorage to ensure session persistence across reloads
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUserStr = localStorage.getItem("vid_session_user")
        const savedRole = localStorage.getItem("vid_session_role") as RoleType | null
        if (savedUserStr && savedRole) {
          const parsedUser = JSON.parse(savedUserStr)
          setUser(parsedUser)
          setRole(savedRole)
          setPermissions(ROLE_PERMISSIONS[savedRole] || ALL_PERMISSIONS)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.warn("Failed to hydrate auth session from storage", err)
        setUser(null)
      } finally {
        setIsInitialized(true)
      }
    } else {
      setIsInitialized(true)
    }
  }, [])

  const hasPermission = (permission: string): boolean => {
    if (role === "SUPER_ADMIN") {
      // Super Admin ONLY has platform-level permissions, NOT institution operations
      return (
        permission.startsWith("platform.") ||
        permission.startsWith("institutions.") ||
        permission.startsWith("users.") ||
        permission.startsWith("security.") ||
        permission.startsWith("billing.") ||
        permission.startsWith("telemetry.") ||
        permission.startsWith("plans.") ||
        permission.startsWith("ai.config.")
      )
    }
    if (role === "INSTITUTION_ADMIN") return !permission.startsWith("platform.")
    return permissions.includes(permission)
  }

  const login = async (
    identifier: string,
    password?: string,
    explicitRole?: RoleType,
    institutionSlug = "springfield"
  ): Promise<RoleType> => {
    const cleanId = (identifier || "").trim().toLowerCase()
    if (!cleanId) {
      throw new Error("User ID or Email is required.")
    }

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanId, password, role: explicitRole }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || "Invalid User ID or Email. Account not found.")
      }

      if (data.data?.user) {
        const backendUser = data.data.user
        const resolvedRole = (backendUser.role || explicitRole || "INSTITUTION_ADMIN") as RoleType

        const loggedInUser: UserProfile = {
          id: backendUser.id,
          name: backendUser.name || cleanId.toUpperCase(),
          email: backendUser.email || cleanId,
          role: resolvedRole,
          institutionId: backendUser.institutionId || `inst-${institutionSlug}`,
          institutionName: backendUser.institutionName || (resolvedRole === "SUPER_ADMIN" ? "VID Global Platform" : "Springfield International Academy"),
        }

        setUser(loggedInUser)
        setRole(resolvedRole)
        setPermissions(backendUser.permissions || ROLE_PERMISSIONS[resolvedRole] || ALL_PERMISSIONS)

        if (typeof window !== "undefined") {
          localStorage.setItem("vid_session_user", JSON.stringify(loggedInUser))
          localStorage.setItem("vid_session_role", resolvedRole)
        }

        return resolvedRole
      }
    } catch (err: any) {
      if (err.message && (err.message.includes("Invalid") || err.message.includes("not found"))) {
        throw err
      }
      // If network failed, check known registered accounts
      const known = KNOWN_ACCOUNTS[cleanId]
      if (known) {
        const loggedInUser: UserProfile = {
          id: `usr-${cleanId}`,
          name: known.name,
          email: cleanId.includes("@") ? cleanId : `${cleanId}@springfield.edu`,
          role: known.role,
          institutionId: `inst-${institutionSlug}`,
          institutionName: known.instName,
        }
        setUser(loggedInUser)
        setRole(known.role)
        setPermissions(ROLE_PERMISSIONS[known.role] || ALL_PERMISSIONS)

        if (typeof window !== "undefined") {
          localStorage.setItem("vid_session_user", JSON.stringify(loggedInUser))
          localStorage.setItem("vid_session_role", known.role)
        }

        return known.role
      }
      throw new Error("Invalid User ID or Email. Account not found.")
    }

    throw new Error("Invalid User ID or Email. Account not found.")
  }

  const logout = () => {
    setUser(null)
    setRole("INSTITUTION_ADMIN")
    if (typeof window !== "undefined") {
      localStorage.removeItem("vid_session_user")
      localStorage.removeItem("vid_session_role")
      window.location.href = "/login"
    }
  }

  const switchRole = (newRole: RoleType) => {
    // Strictly isolate Super Admin: Cannot switch perspective into institution roles
    if (role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
      console.warn("Super Admin workspace isolation: cannot switch to institution roles.")
      return
    }
    setRole(newRole)
    if (user) {
      const updated = { ...user, role: newRole }
      setUser(updated)
      if (typeof window !== "undefined") {
        localStorage.setItem("vid_session_user", JSON.stringify(updated))
        localStorage.setItem("vid_session_role", newRole)
      }
    }
    setPermissions(ROLE_PERMISSIONS[newRole] || ALL_PERMISSIONS)
  }

  const toggleOptionalModule = (moduleKey: string) => {
    setEnabledModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey]
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        institutionId: user?.institutionId || "inst-default",
        institutionName: user?.institutionName || "VID Educational Platform",
        permissions,
        enabledModules,
        isAuthenticated: !!user,
        isInitialized,
        hasPermission,
        login,
        logout,
        switchRole,
        toggleOptionalModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export interface RequirePermissionProps {
  permission: string
  children: React.ReactNode
  fallbackMessage?: string
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  fallbackMessage,
}) => {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return (
      <PermissionDenied
        requiredPermission={permission}
        message={fallbackMessage}
      />
    )
  }

  return <>{children}</>
}
