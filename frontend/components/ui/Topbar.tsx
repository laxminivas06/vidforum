import React from "react"
import { cn } from "@/lib/utils"
import { Bell, Search, Menu, ChevronDown, User, Shield } from "lucide-react"

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
}) => {
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
