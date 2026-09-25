"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
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
  hasPermission: (permission: string) => boolean
  login: (email: string, role?: RoleType, institutionSlug?: string) => Promise<void>
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER)
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

  const hasPermission = (permission: string): boolean => {
    if (role === "SUPER_ADMIN") return true
    return permissions.includes(permission)
  }

  const login = async (
    email: string,
    targetRole: RoleType = "INSTITUTION_ADMIN",
    institutionSlug = "springfield"
  ) => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: email.split("@")[0].replace(".", " ").toUpperCase(),
      email,
      role: targetRole,
      institutionId: `inst-${institutionSlug}`,
      institutionName: `${institutionSlug.charAt(0).toUpperCase() + institutionSlug.slice(1)} Academy`,
    }
    setUser(newUser)
    setRole(targetRole)
  }

  const logout = () => {
    setUser(null)
  }

  const switchRole = (newRole: RoleType) => {
    setRole(newRole)
    if (user) {
      setUser({ ...user, role: newRole })
    }
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
