"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { getFilteredNavigation, RoleType, NavItem } from "@/config/navigation"
import { PLATFORM_WORKSPACES, getWorkspaceForPath } from "@/config/workspaces"
import { Badge } from "./Badge"
import {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  ShieldCheck,
  Activity,
  Cpu,
  CreditCard,
  Settings,
  UserPlus,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Clock,
  PhoneCall,
  ScanFace,
  Bot,
  Calendar,
  Bus,
  Home,
  Library,
  Trophy,
  Package,
  Receipt,
  UploadCloud,
  Award,
  AlertTriangle,
  User,
  LogOut,
  X,
  ArrowLeft,
  CheckCircle2,
  UserCheck,
  FileCheck,
  ChevronRight,
  BookMarked,
} from "lucide-react"

// Icon registry matching navigation.ts and workspaces.ts
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  ShieldCheck,
  Activity,
  Cpu,
  CreditCard,
  Settings,
  UserPlus,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Clock,
  PhoneCall,
  ScanFace,
  Bot,
  Calendar,
  Bus,
  Home,
  Library,
  Trophy,
  Package,
  Receipt,
  UploadCloud,
  Award,
  AlertTriangle,
  User,
  CheckCircle2,
  UserCheck,
  FileCheck,
  BookMarked,
}

export interface SidebarProps {
  role?: RoleType
  enabledModules?: string[]
  assignedWorkspaces?: string[]
  institutionName?: string
  institutionLogo?: string
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  onSignOut?: () => void
  collapsed?: boolean
  currentPath?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = "INSTITUTION_ADMIN",
  enabledModules = ["events", "transport", "hostel", "library", "sports", "inventory"],
  assignedWorkspaces,
  institutionName = "Partner Institution",
  institutionLogo,
  isMobileOpen = false,
  onCloseMobile,
  onSignOut,
  collapsed = false,
  currentPath,
}) => {
  const routerPathname = usePathname()
  const routerSearchParams = useSearchParams()
  const pathname = currentPath || routerPathname
  const [currentSearch, setCurrentSearch] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentSearch(window.location.search)
    }
  }, [pathname, routerSearchParams])

  const renderIcon = (name: string, isActive: boolean) => {
    const IconComponent = ICON_MAP[name] || LayoutDashboard
    return (
      <IconComponent
        className={cn(
          "w-4.5 h-4.5 shrink-0 transition-colors",
          isActive ? "text-canvas" : "text-text-secondary group-hover:text-text-primary"
        )}
        strokeWidth={1.75}
      />
    )
  }

  // 1. Detect if currently inside a specific workspace
  const activeWorkspace = getWorkspaceForPath(pathname)
  const isInsideIsolatedWorkspace =
    role !== "SUPER_ADMIN" &&
    activeWorkspace !== undefined &&
    activeWorkspace.id !== "dashboard"

  // 2. Compute Navigation Items:
  // In an isolated workspace, show ONLY that workspace's dedicated tools for a clean, focused sidebar
  // In hub/dashboard mode, render full role-filtered navigation
  const navigationGroups = React.useMemo(() => {
    if (isInsideIsolatedWorkspace && activeWorkspace) {
      // Filter workspace items if any optional module is disabled
      const scopedItems = activeWorkspace.navItems.filter((item) => {
        if (item.optionalModuleKey && !enabledModules.includes(item.optionalModuleKey)) {
          return false
        }
        return true
      })

      const workspaceToolsGroup = {
        label: `${activeWorkspace.shortName.toUpperCase()} TOOLS`,
        items: scopedItems.map((item) => ({
          title: item.title,
          href: item.href,
          iconName: item.iconName,
          badge: item.badge,
          badgeVariant: item.badgeVariant,
        })),
      }

      // Strictly isolated: render ONLY active workspace functionalities
      return [workspaceToolsGroup]
    }

    // Otherwise, render full role-filtered navigation
    return getFilteredNavigation(role, enabledModules, assignedWorkspaces)
  }, [role, enabledModules, assignedWorkspaces, isInsideIsolatedWorkspace, activeWorkspace])

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar border-r border-border-default select-none">
      {/* Brand Header */}
      <div className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-border-default/60 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-action-black flex items-center justify-center text-canvas shrink-0 font-bold text-sm tracking-wider">
            <span className="text-brand-green font-extrabold text-base">V</span>ID
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block leading-none">
                {role.replace("_", " ")}
              </span>
              <span className="text-sm font-semibold text-text-primary truncate block mt-0.5">
                {institutionName}
              </span>
            </div>
          )}
        </Link>
        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Groups Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* ISOLATED WORKSPACE HEADER CARD */}
        {isInsideIsolatedWorkspace && activeWorkspace && !collapsed && (
          <div className="p-2.5 rounded-xl bg-surface border border-border-default shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                {React.createElement(ICON_MAP[activeWorkspace.iconName] || Briefcase, {
                  className: "w-4 h-4",
                })}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary block leading-none">
                  Isolated Workspace
                </span>
                <span className="text-xs font-semibold text-text-primary block truncate mt-0.5">
                  {activeWorkspace.name}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-canvas border border-border-default hover:bg-subtle hover:border-border-strong text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Workspaces Hub</span>
            </Link>
          </div>
        )}

        {/* Collapsed Back-to-Hub Icon when in isolated workspace */}
        {isInsideIsolatedWorkspace && activeWorkspace && collapsed && (
          <div className="flex justify-center pb-2 border-b border-border-default/60">
            <Link
              href="/dashboard"
              title="Return to All Workspaces Hub"
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Global Permitted Workspaces Pill (When on Dashboard / Hub) */}
        {!isInsideIsolatedWorkspace && role === "INSTITUTION_ADMIN" && !collapsed && (
          <div className="px-1 mb-2 shrink-0">
            <div className="p-2 rounded-xl bg-surface border border-border-default/80 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-action-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Layers className="w-3 h-3 text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-text-primary block truncate leading-tight">
                    Workspace Directory
                  </span>
                  <span className="text-[10px] text-text-secondary block leading-tight">
                    Select a workspace to enter
                  </span>
                </div>
              </div>
              <Badge variant="neutral" className="text-[9px] font-mono shrink-0 px-1 py-0">
                {assignedWorkspaces ? `${assignedWorkspaces.length}` : "10 Core"}
              </Badge>
            </div>
          </div>
        )}

        {/* Navigation Items (Exclusively Isolated) */}
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1.5 flex items-center justify-between">
                <span>{group.label}</span>
                {isInsideIsolatedWorkspace && (
                  <span className="text-[9px] font-mono text-brand-primary font-normal">
                    Isolated
                  </span>
                )}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const [itemPath, itemQuery] = item.href.split("?")
                const currentPathOnly = pathname.split("?")[0]

                let isActive = false
                if (itemQuery) {
                  isActive = currentPathOnly === itemPath && currentSearch.includes(itemQuery)
                } else if (isInsideIsolatedWorkspace) {
                  const anySiblingMatches = group.items.some(
                    (other) => other.href.includes("?") && currentSearch.includes(other.href.split("?")[1])
                  )
                  isActive = currentPathOnly === itemPath && !anySiblingMatches
                } else {
                  isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => onCloseMobile && onCloseMobile()}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        collapsed ? "justify-center px-0 py-2.5" : "justify-between",
                        isActive
                          ? "bg-action-black text-canvas shadow-xs font-semibold"
                          : "text-text-secondary hover:text-text-primary hover:bg-subtle"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderIcon(item.iconName, isActive)}
                        {!collapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </div>
                      {!collapsed && item.badge && (
                        <Badge
                          variant={item.badgeVariant || "neutral"}
                          size="sm"
                          showDot={false}
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4.5",
                            isActive && "bg-neutral-800 text-neutral-200 border-neutral-700"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Profile / Sign Out */}
      <div className="p-3 border-t border-border-default/60 shrink-0">
        <button
          onClick={onSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-text-secondary hover:text-status-error hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Rail (230px, or 64px collapsed) */}
      <aside
        className={cn(
          "hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-200 z-30",
          collapsed ? "w-16" : "w-[230px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
