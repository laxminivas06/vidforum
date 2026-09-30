import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Bell, Search, Menu, ChevronDown, User, Shield, Layers, Check } from "lucide-react"
import { PLATFORM_WORKSPACES, getWorkspaceForPath } from "@/config/workspaces"

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

  // Filter workspaces strictly to those assigned/given for this institute admin
  const permittedWorkspaces = React.useMemo(() => {
    if (!assignedWorkspaces) return PLATFORM_WORKSPACES
    return PLATFORM_WORKSPACES.filter((ws) => assignedWorkspaces.includes(ws.id))
  }, [assignedWorkspaces])

  const activeWorkspace = getWorkspaceForPath(currentPath)

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
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-text-secondary hover:text-text-primary hover:bg-subtle rounded-lg focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 truncate">
          <div className="hidden sm:flex items-center gap-1.5 text-text-secondary font-medium">
            <span className="w-2 h-2 rounded-full bg-brand-green shrink-0" />
            <span className="truncate max-w-[160px]">{institutionName}</span>
            <span className="text-text-muted">/</span>
          </div>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer truncate">
                {crumb.label}
              </span>
              <span className="text-text-muted">/</span>
            </React.Fragment>
          ))}

          <span className="font-semibold text-text-primary truncate">
            {pageTitle}
          </span>
        </div>

        {/* Workspace Selector Dropdown (for Institute Admin) */}
        {permittedWorkspaces.length > 0 && userRole.toUpperCase().includes("ADMIN") && (
          <div className="relative hidden md:block ml-2" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border-default hover:border-border-strong text-xs font-medium text-text-primary transition-colors shadow-xs"
              aria-label="Select Assigned Workspace"
            >
              <Layers className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span className="text-text-secondary text-[11px]">Workspace:</span>
              <span className="font-semibold truncate max-w-[130px] text-xs">
                {activeWorkspace ? activeWorkspace.name : "Assigned"}
              </span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 text-text-muted transition-transform shrink-0",
                  isWorkspaceDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {isWorkspaceDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-canvas border border-border-default shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 border-b border-border-subtle flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                    Assigned Workspaces ({permittedWorkspaces.length})
                  </span>
                  <span className="text-[10px] text-brand-primary font-semibold">
                    Institute Admin
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
                  {permittedWorkspaces.map((ws) => {
                    const isCurrent = activeWorkspace?.id === ws.id
                    return (
                      <Link
                        key={ws.id}
                        href={ws.routes[0]}
                        onClick={() => setIsWorkspaceDropdownOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                          isCurrent
                            ? "bg-action-black text-canvas font-semibold"
                            : "text-text-primary hover:bg-subtle"
                        )}
                      >
                        <div className="truncate min-w-0 pr-2">
                          <div className="truncate font-medium">{ws.name}</div>
                          <div
                            className={cn(
                              "text-[10px] truncate",
                              isCurrent ? "text-neutral-300" : "text-text-secondary"
                            )}
                          >
                            {ws.category}
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
        )}
      </div>

      {/* Right: Actions, Search, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {rightActions}

        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-subtle rounded-full transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onNotificationClick}
          className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-subtle rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-error ring-2 ring-canvas" />
          )}
        </button>

        <div className="h-5 w-px bg-border-default mx-1 hidden sm:block" />

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-badge-neutral border border-border-default/80 flex items-center justify-center text-text-primary font-medium text-xs overflow-hidden shrink-0">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-text-primary leading-tight">
              {userName}
            </div>
            <div className="text-[11px] text-text-secondary leading-tight">
              {userRole}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
