import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getFilteredNavigation, RoleType, NavItem } from "@/config/navigation"
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
  X
} from "lucide-react"

// Icon registry matching navigation.ts
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
}

export interface SidebarProps {
  role?: RoleType
  enabledModules?: string[]
  institutionName?: string
  institutionLogo?: string
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  onSignOut?: () => void
  collapsed?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = "INSTITUTION_ADMIN",
  enabledModules = ["events", "transport", "hostel", "library", "sports", "inventory"],
  institutionName = "Springfield International",
  institutionLogo,
  isMobileOpen = false,
  onCloseMobile,
  onSignOut,
  collapsed = false,
}) => {
  const pathname = usePathname()
  const navigationGroups = getFilteredNavigation(role, enabledModules)

  const renderIcon = (name: string, isActive: boolean) => {
    const IconComponent = ICON_MAP[name] || LayoutDashboard
    return (
      <IconComponent
        className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          isActive ? "text-canvas" : "text-text-secondary group-hover:text-text-primary"
        )}
        strokeWidth={1.75}
      />
    )
  }

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
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-medium uppercase tracking-[0.05em] text-text-muted mb-2">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))

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
                          ? "bg-action-black text-canvas shadow-sm"
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
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-text-secondary hover:text-status-error hover:bg-red-50/50 transition-colors",
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
