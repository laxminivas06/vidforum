"use client"

import React, { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/ui/Sidebar"
import { Topbar } from "@/components/ui/Topbar"
import { RoleType } from "@/config/navigation"
import { cn } from "@/lib/utils"

export interface AppShellProps {
  pageTitle: string
  breadcrumbs?: { label: string; href?: string }[]
  children: React.ReactNode
  rightHeaderAction?: React.ReactNode
  fullWidth?: boolean
}

export const AppShell: React.FC<AppShellProps> = ({
  pageTitle,
  breadcrumbs = [],
  children,
  rightHeaderAction,
  fullWidth = false,
}) => {
  const { user, role, enabledModules, institutionName, logout, switchRole } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

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
          userName={user?.name || "Dr. Alistair Vance"}
          userRole={role.replace("_", " ")}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          rightActions={
            <div className="flex items-center gap-2">
              {/* Quick Role Switcher Pill for Testing / Demonstration */}
              <div className="hidden xl:flex items-center gap-1.5 bg-subtle border border-border-default/80 rounded-full px-2.5 py-1 text-xs text-text-secondary">
                <span className="text-[10px] uppercase font-semibold text-text-muted">
                  Perspective:
                </span>
                <select
                  value={role}
                  onChange={(e) => switchRole(e.target.value as RoleType)}
                  className="bg-transparent text-xs font-semibold text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="INSTITUTION_ADMIN">Institution Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMISSION_TEAM">Admissions</option>
                  <option value="FINANCE_TEAM">Finance</option>
                  <option value="EXAM_TEAM">Examinations</option>
                  <option value="ACADEMIC_COORDINATOR">Academics</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>
              {rightHeaderAction}
            </div>
          }
        />

        <main
          className={cn(
            "flex-1 p-4 sm:p-6 lg:p-8 w-full transition-all",
            !fullWidth && "max-w-content mx-auto"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
