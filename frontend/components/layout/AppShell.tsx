"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/ui/Sidebar"
import { Topbar } from "@/components/ui/Topbar"
import { PermissionDenied, Button } from "@/components/ui"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AppShellProps {
  pageTitle: string
  breadcrumbs?: { label: string; href?: string }[]
  children: React.ReactNode
  rightHeaderAction?: React.ReactNode
  fullWidth?: boolean
}

// Institution-specific workspaces that Super Admins CANNOT access (PRD RBAC isolation)
const INSTITUTION_WORKSPACES = [
  "/admissions",
  "/academics",
  "/faculty",
  "/attendance",
  "/examinations",
  "/finance",
  "/documents",
  "/hrms",
  "/timetable",
  "/students",
  "/app",
  "/voice-agent",
  "/ai-attendance",
  "/ai-tutor",
  "/events",
  "/transport",
  "/hostel",
  "/library",
  "/sports",
  "/inventory",
]

// Platform-level workspaces that non-Super Admins CANNOT access
const PLATFORM_SUPER_ADMIN_WORKSPACES = [
  "/institutions",
  "/plans",
  "/monitoring",
  "/ai-config",
  "/billing",
]

export const AppShell: React.FC<AppShellProps> = ({
  pageTitle,
  breadcrumbs = [],
  children,
  rightHeaderAction,
  fullWidth = false,
}) => {
  const { user, role, enabledModules, institutionName, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Enforce Workspace Scoping
  const isSuperAdmin = role === "SUPER_ADMIN"
  const isBlockedForSuperAdmin =
    isSuperAdmin &&
    INSTITUTION_WORKSPACES.some(
      (prefix) => pathname === prefix || pathname?.startsWith(prefix + "/")
    )

  const isBlockedForInstitutionStaff =
    !isSuperAdmin &&
    PLATFORM_SUPER_ADMIN_WORKSPACES.some(
      (prefix) => pathname === prefix || pathname?.startsWith(prefix + "/")
    )

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Dynamic Role-Scoped Sidebar */}
      <Sidebar
        role={role}
        enabledModules={enabledModules}
        institutionName={institutionName}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={logout}
        collapsed={isCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          institutionName={institutionName}
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
          userName={user?.name || (isSuperAdmin ? "VID Platform Super Admin" : "Dr. Alistair Vance")}
          userRole={role.replace("_", " ")}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          rightActions={rightHeaderAction}
        />

        <main
          className={cn(
            "flex-1 p-4 sm:p-6 lg:p-8 w-full transition-all",
            !fullWidth && "max-w-content mx-auto"
          )}
        >
          {isBlockedForSuperAdmin ? (
            <div className="flex flex-col items-center justify-center py-12">
              <PermissionDenied
                requiredPermission="platform.super_admin_isolation"
                message="As a Platform Super Administrator, your workspace is dedicated to platform-level tenant and system infrastructure. Institution-level workspaces (Admissions, Academics, Faculty, Finance, etc.) are strictly isolated to school staff."
              />
              <Link href="/dashboard" className="mt-4">
                <Button size="default" variant="primary" leadingIcon={<ArrowLeft className="w-4 h-4" />}>
                  Return to Super Admin Platform Console
                </Button>
              </Link>
            </div>
          ) : isBlockedForInstitutionStaff ? (
            <div className="flex flex-col items-center justify-center py-12">
              <PermissionDenied
                requiredPermission="platform.super_admin"
                message="This workspace is restricted exclusively to the VID Platform Super Administrator."
              />
              <Link href="/dashboard" className="mt-4">
                <Button size="default" variant="primary" leadingIcon={<ArrowLeft className="w-4 h-4" />}>
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
