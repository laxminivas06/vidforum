"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/ui/Sidebar"
import { Topbar } from "@/components/ui/Topbar"
import {
  PermissionDenied,
  Button,
  CommandPalette,
  ShortcutsHelpModal,
} from "@/components/ui"
import { isTextInputTarget } from "@/lib/utils/keyboard"
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

import { isPathAllowedForWorkspaces } from "@/config/workspaces"

export const AppShell: React.FC<AppShellProps> = ({
  pageTitle,
  breadcrumbs = [],
  children,
  rightHeaderAction,
  fullWidth = false,
}) => {
  const { user, role, enabledModules, institutionName, logout, isInitialized } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const lastKeyRef = useRef<{ key: string; time: number } | null>(null)

  // Global Cross-Platform Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Command Palette: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        e.stopPropagation()
        setIsPaletteOpen((prev) => !prev)
        return
      }

      // 2. Toggle Sidebar: Cmd+B (Mac) or Ctrl+B (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        e.stopPropagation()
        setIsCollapsed((prev) => !prev)
        return
      }

      // 3. Shortcuts Help: Cmd+/ or Ctrl+/
      if ((e.metaKey || e.ctrlKey) && (e.key === "/" || e.code === "Slash")) {
        e.preventDefault()
        e.stopPropagation()
        setIsShortcutsHelpOpen((prev) => !prev)
        return
      }

      // 4. Escape: Close palette, help, or mobile menu
      if (e.key === "Escape") {
        if (isPaletteOpen) {
          e.preventDefault()
          setIsPaletteOpen(false)
          return
        }
        if (isShortcutsHelpOpen) {
          e.preventDefault()
          setIsShortcutsHelpOpen(false)
          return
        }
        if (isMobileMenuOpen) {
          e.preventDefault()
          setIsMobileMenuOpen(false)
          return
        }
      }

      // 5. If typing in an input/textarea, do NOT handle single-letter chords
      if (isTextInputTarget(e.target)) {
        return
      }

      // 6. Press "?" for keyboard shortcuts cheat sheet
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault()
        setIsShortcutsHelpOpen(true)
        return
      }

      // 7. Sequential chords: "G" then <key>
      const now = Date.now()
      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) {
        lastKeyRef.current = { key: "g", time: now }
        return
      }

      if (lastKeyRef.current && lastKeyRef.current.key === "g" && now - lastKeyRef.current.time < 1200) {
        const nextKey = e.key.toLowerCase()
        lastKeyRef.current = null

        if (nextKey === "d") {
          e.preventDefault()
          router.push("/dashboard")
        } else if (nextKey === "a") {
          e.preventDefault()
          router.push("/academics")
        } else if (nextKey === "s") {
          e.preventDefault()
          router.push("/admissions")
        } else if (nextKey === "u") {
          e.preventDefault()
          router.push("/users")
        } else if (nextKey === "i") {
          e.preventDefault()
          router.push("/institutions")
        } else if (nextKey === "f") {
          e.preventDefault()
          router.push("/finance")
        } else if (nextKey === "e") {
          e.preventDefault()
          router.push("/examinations")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPaletteOpen, isShortcutsHelpOpen, isMobileMenuOpen, router])

  // Redirect to login if user is not authenticated
  React.useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/login")
    }
  }, [isInitialized, user, router])

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    )
  }

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

  const isBlockedByWorkspaceRestriction =
    !isSuperAdmin &&
    user?.assignedWorkspaces &&
    user.assignedWorkspaces.length > 0 &&
    !isPathAllowedForWorkspaces(pathname, user.assignedWorkspaces)

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Dynamic Role-Scoped Sidebar */}
      <Sidebar
        role={role}
        enabledModules={enabledModules}
        assignedWorkspaces={user?.assignedWorkspaces}
        institutionName={institutionName}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={logout}
        collapsed={isCollapsed}
        currentPath={pathname}
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
          onSearchClick={() => setIsPaletteOpen(true)}
          onShortcutsClick={() => setIsShortcutsHelpOpen(true)}
          rightActions={rightHeaderAction}
          assignedWorkspaces={user?.assignedWorkspaces}
          currentPath={pathname}
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
          ) : isBlockedByWorkspaceRestriction ? (
            <div className="flex flex-col items-center justify-center py-12">
              <PermissionDenied
                requiredPermission="workspace.scoped_access"
                message="Access Restricted: Your account has only been granted privileges for designated workspaces. Contact your administrator to expand your workspace access."
              />
              <Link href="/dashboard" className="mt-4">
                <Button size="default" variant="primary" leadingIcon={<ArrowLeft className="w-4 h-4" />}>
                  Return to Permitted Workspaces
                </Button>
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
      />

      {/* Global Keyboard Shortcuts Cheat Sheet (? or Cmd+/) */}
      <ShortcutsHelpModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  )
}
