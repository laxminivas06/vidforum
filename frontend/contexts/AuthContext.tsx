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
  institutionCode?: string
  avatarUrl?: string
  assignedWorkspaces?: string[]
  mustChangePassword?: boolean
}

export interface LoginResult {
  role: RoleType
  mustChangePassword: boolean
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
  logout: () => Promise<void>
  switchRole: (newRole: RoleType) => void
  toggleOptionalModule: (moduleKey: string) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
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
        const token = localStorage.getItem("vid_auth_token")

        if (savedUserStr && savedRole && token) {
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
    institutionSlug = "narayana"
  ): Promise<RoleType> => {
    const cleanId = (identifier || "").trim()
    if (!cleanId) {
      throw new Error("User ID or Email is required.")
    }

    const cleanPassword = (password || "").trim()
    if (!cleanPassword) {
      throw new Error("Password is required.")
    }

    const res = await fetch("http://localhost:5000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: cleanId,
        password: cleanPassword,
      }),
    })
    const data = await res.json()

    if (!res.ok || !data.success || !data.data?.user) {
      throw new Error(data.message || "Authentication failed. Please verify your credentials.")
    }

    const backendUser = data.data.user
    const resolvedRole = (backendUser.role || explicitRole || "INSTITUTION_ADMIN") as RoleType

    const loggedInUser: UserProfile = {
      id: backendUser.id,
      name: backendUser.name || cleanId.toUpperCase(),
      email: backendUser.email || cleanId,
      role: resolvedRole,
      institutionId: backendUser.institutionId || `inst-${institutionSlug}`,
      institutionName: backendUser.institutionName || (resolvedRole === "SUPER_ADMIN" ? "VID Global Platform" : "Partner Institution"),
      institutionCode: backendUser.institutionCode,
      assignedWorkspaces: backendUser.assignedWorkspaces || [],
      mustChangePassword: Boolean(backendUser.mustChangePassword),
    }

    setUser(loggedInUser)
    setRole(resolvedRole)
    setPermissions(backendUser.permissions || ROLE_PERMISSIONS[resolvedRole] || ALL_PERMISSIONS)

    if (typeof window !== "undefined") {
      localStorage.setItem("vid_session_user", JSON.stringify(loggedInUser))
      localStorage.setItem("vid_session_role", resolvedRole)
      if (data.data?.token) {
        localStorage.setItem("vid_auth_token", data.data.token)
      }
      if (data.data?.refreshToken) {
        localStorage.setItem("vid_refresh_token", data.data.refreshToken)
      }
    }

    return resolvedRole
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("vid_auth_token") : null
    if (!token) {
      throw new Error("You must be logged in to change your password.")
    }

    const res = await fetch("http://localhost:5000/api/v1/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update password.")
    }

    if (data.data?.token && typeof window !== "undefined") {
      localStorage.setItem("vid_auth_token", data.data.token)
    }

    if (user) {
      const updatedUser = { ...user, mustChangePassword: false }
      setUser(updatedUser)
      if (typeof window !== "undefined") {
        localStorage.setItem("vid_session_user", JSON.stringify(updatedUser))
      }
    }
  }

  const logout = async () => {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("vid_refresh_token") : null
    if (refreshToken) {
      try {
        await fetch("http://localhost:5000/api/v1/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })
      } catch (err) {
        console.warn("Backend logout notification warning:", err)
      }
    }

    setUser(null)
    setRole("INSTITUTION_ADMIN")
    if (typeof window !== "undefined") {
      localStorage.removeItem("vid_session_user")
      localStorage.removeItem("vid_session_role")
      localStorage.removeItem("vid_auth_token")
      localStorage.removeItem("vid_refresh_token")
      window.location.href = "/login"
    }
  }

  const switchRole = (newRole: RoleType) => {
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

  const toggleOptionalModule = async (moduleKey: string) => {
    const isCurrentlyEnabled = enabledModules.includes(moduleKey)
    const newEnabled = !isCurrentlyEnabled

    setEnabledModules((prev) =>
      isCurrentlyEnabled
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey]
    )

    try {
      const instId = user?.institutionId || "22222222-2222-2222-2222-222222222201"
      await fetch(`http://localhost:5000/api/v1/institutions/${instId}/modules/${moduleKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: newEnabled }),
      })
    } catch (err) {
      console.warn("Failed to persist module toggle to backend:", err)
    }
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
        changePassword,
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
