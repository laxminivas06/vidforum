"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  User,
  Shield,
  Layers,
  Check,
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  CreditCard,
  FileText,
  Briefcase,
  Clock,
  Settings,
  Building2,
  Package,
} from "lucide-react"
import { PLATFORM_WORKSPACES, getWorkspaceForPath, PlatformWorkspace } from "@/config/workspaces"

const TOPBAR_ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  CreditCard,
  FileText,
  Briefcase,
  Clock,
  Settings,
  Building2,
  Package,
  Layers,
}

export interface TopbarProps {
  institutionName?: string
  pageTitle: string
  breadcrumbs?: { label: string; href?: string }[]
  userName?: string
  userRole?: string
  userAvatar?: string
  notificationCount?: number
  onOpenMobileMenu?: () => void
  onSearchClick?: () => void
  onNotificationClick?: () => void
  rightActions?: React.ReactNode
  assignedWorkspaces?: string[]
  currentPath?: string
}

export const Topbar: React.FC<TopbarProps> = ({
  institutionName = "Springfield International",
  pageTitle,
  breadcrumbs = [],
  userName = "Vishal Gudla",
  userRole = "Administrator",
  userAvatar,
  notificationCount = 3,
  onOpenMobileMenu,
  onSearchClick,
  onNotificationClick,
  rightActions,
  assignedWorkspaces,
  currentPath = "",
}) => {
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter workspaces strictly to those assigned/permitted
  const permittedWorkspaces = React.useMemo(() => {
    if (!assignedWorkspaces) return PLATFORM_WORKSPACES
    return PLATFORM_WORKSPACES.filter(
      (ws) => ws.id === "dashboard" || assignedWorkspaces.includes(ws.id)
    )
  }, [assignedWorkspaces])

  const activeWorkspace = getWorkspaceForPath(currentPath)
  const ActiveIcon = activeWorkspace
    ? TOPBAR_ICON_MAP[activeWorkspace.iconName] || Briefcase
    : LayoutDashboard

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="h-14 sm:h-16 px-4 sm:px-6 bg-canvas border-b border-border-default flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile trigger, Breadcrumbs & Workspace Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-text-secondary hover:text-text-primary hover:bg-subtle rounded-lg focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Workspace Selector Dropdown (Prominent pill switcher) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border-default hover:border-border-strong text-xs font-semibold text-text-primary transition-all shadow-xs hover:shadow-sm"
            aria-label="Switch Active Workspace"
          >
            <div className="w-4.5 h-4.5 rounded-md bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <ActiveIcon className="w-3.5 h-3.5" />
            </div>
            <span className="truncate max-w-[130px] sm:max-w-[180px]">
              {activeWorkspace ? activeWorkspace.name : "Select Workspace"}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-text-muted transition-transform shrink-0",
                isWorkspaceDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {isWorkspaceDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 rounded-xl bg-canvas border border-border-default shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                  Switch Isolated Workspace
                </span>
                <span className="text-[10px] text-brand-primary font-bold">
                  {permittedWorkspaces.length} Available
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto py-1 space-y-1">
                {/* 1. Institute Admin Workspace Option */}
                <Link
                  href="/dashboard"
                  onClick={() => setIsWorkspaceDropdownOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                    currentPath === "/dashboard"
                      ? "bg-action-black text-canvas font-semibold shadow-xs"
                      : "text-text-primary hover:bg-subtle"
                  )}
                >
                  <div className="w-6 h-6 rounded-md bg-action-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-3.5 h-3.5 text-brand-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs truncate">Institute Admin Workspace</div>
                    <div className="text-[10px] text-text-secondary truncate">
                      Tenant admin, faculty accounts & overview
                    </div>
                  </div>
                  {currentPath === "/dashboard" && (
                    <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  )}
                </Link>

                <div className="my-1 border-t border-border-subtle/80" />

                {/* 2. Isolated Workspace Items */}
                {permittedWorkspaces
                  .filter((ws) => ws.id !== "dashboard")
                  .map((ws) => {
                    const isCurrent = activeWorkspace?.id === ws.id
                    const WsIcon = TOPBAR_ICON_MAP[ws.iconName] || Briefcase

                    return (
                      <Link
                        key={ws.id}
                        href={ws.primaryRoute}
                        onClick={() => setIsWorkspaceDropdownOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                          isCurrent
                            ? "bg-action-black text-canvas font-semibold shadow-xs"
                            : "text-text-primary hover:bg-subtle"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                            isCurrent
                              ? "bg-white/20 text-canvas"
                              : "bg-subtle text-text-secondary"
                          )}
                        >
                          <WsIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 truncate pr-2">
                          <div className="font-semibold truncate">{ws.name}</div>
                          <div
                            className={cn(
                              "text-[10px] truncate",
                              isCurrent ? "text-neutral-300" : "text-text-secondary"
                            )}
                          >
                            {ws.description}
                          </div>
                        </div>
                        {isCurrent && (
                          <Check className="w-3.5 h-3.5 shrink-0 text-brand-green" />
                        )}
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumb path label */}
        <div className="hidden lg:flex items-center gap-2 text-xs min-w-0 truncate text-text-secondary">
          <span>/</span>
          <span className="font-medium text-text-primary truncate">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right: Actions, Search, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {rightActions}

        {onSearchClick && (
          <button
            type="button"
            onClick={onSearchClick}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-subtle rounded-lg focus:outline-none transition-colors"
            aria-label="Search across workspace"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onNotificationClick}
          className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-subtle rounded-lg focus:outline-none transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-green rounded-full ring-2 ring-canvas" />
          )}
        </button>

        {/* User profile capsule */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border-default/80">
          <div className="w-8 h-8 rounded-full bg-subtle border border-border-default flex items-center justify-center text-text-primary font-medium text-xs">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
            )}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-text-primary block leading-none truncate max-w-[120px]">
              {userName}
            </span>
            <span className="text-[10px] text-text-secondary font-mono block leading-tight mt-0.5 uppercase">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
