"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  UserPlus,
  Users,
  ShieldCheck,
  CalendarCheck,
  FileSpreadsheet,
  CreditCard,
  FileText,
  Briefcase,
  Clock,
  Building2,
  Settings,
  HelpCircle,
  PlusCircle,
  ArrowRight,
  Command,
  CornerDownLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getModifierLabel, isMac } from "@/lib/utils/keyboard"
import { PLATFORM_WORKSPACES } from "@/config/workspaces"

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenShortcutsHelp?: () => void
}

interface PaletteItem {
  id: string
  title: string
  subtitle?: string
  category: "Workspaces" | "Quick Actions" | "System"
  icon: React.ElementType
  route?: string
  action?: () => void
  badge?: string
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenShortcutsHelp,
}) => {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Construct item catalog
  const items: PaletteItem[] = React.useMemo(() => {
    const list: PaletteItem[] = []

    // 1. Workspaces
    PLATFORM_WORKSPACES.forEach((ws) => {
      let icon = LayoutDashboard
      if (ws.id === "academics") icon = GraduationCap
      else if (ws.id === "admissions") icon = UserPlus
      else if (ws.id === "faculty" || ws.id === "hrms") icon = Users
      else if (ws.id === "attendance") icon = CalendarCheck
      else if (ws.id === "examinations") icon = FileSpreadsheet
      else if (ws.id === "finance") icon = CreditCard
      else if (ws.id === "documents") icon = FileText
      else if (ws.id === "timetable") icon = Clock
      else if (ws.id === "institutions") icon = Building2
      else if (ws.id === "settings") icon = Settings

      list.push({
        id: `ws-${ws.id}`,
        title: ws.name,
        subtitle: ws.description,
        category: "Workspaces",
        icon,
        route: ws.primaryRoute,
        badge: ws.category,
      })
    })

    // 2. High-value Quick Actions
    list.push(
      {
        id: "act-add-user",
        title: "Add Platform User / Faculty",
        subtitle: "Create new user account mapped to role and tenant",
        category: "Quick Actions",
        icon: PlusCircle,
        route: "/users",
      },
      {
        id: "act-new-tenant",
        title: "Provision New Institutional Tenant",
        subtitle: "Onboard new school tenant to the platform fleet",
        category: "Quick Actions",
        icon: Building2,
        route: "/institutions",
      },
      {
        id: "act-collect-fee",
        title: "Collect Student Fee & Payment",
        subtitle: "Record student tuition, transportation or academic fees",
        category: "Quick Actions",
        icon: CreditCard,
        route: "/finance/collect",
      },
      {
        id: "act-student-profile",
        title: "Student Master 360° Profile",
        subtitle: "View comprehensive single student record and analytics",
        category: "Quick Actions",
        icon: Users,
        route: "/students/cccccccc-cccc-cccc-cccc-cccccccccc01",
      },
      {
        id: "act-subjects",
        title: "Academics: Subject Master & Syllabus",
        subtitle: "Configure language, core & external subjects with syllabus linking",
        category: "Quick Actions",
        icon: GraduationCap,
        route: "/academics?tab=subjects",
      },
      {
        id: "act-admissions-kanban",
        title: "Admissions Kanban & Inquiry Enrollment",
        subtitle: "Review inquiry applications and direct student registrations",
        category: "Quick Actions",
        icon: UserPlus,
        route: "/admissions",
      }
    )

    // 3. System
    if (onOpenShortcutsHelp) {
      list.push({
        id: "sys-shortcuts",
        title: "View Keyboard Shortcuts Cheat Sheet",
        subtitle: "List of all system keybindings and shortcuts",
        category: "System",
        icon: HelpCircle,
        action: () => {
          onClose()
          onOpenShortcutsHelp()
        },
      })
    }

    return list
  }, [onClose, onOpenShortcutsHelp])

  // Filter items by search query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    )
  }, [items, query])

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Keyboard navigation inside Command Palette
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = filteredItems[selectedIndex]
        if (selected) {
          executeItem(selected)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredItems, selectedIndex])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  const executeItem = (item: PaletteItem) => {
    onClose()
    if (item.action) {
      item.action()
    } else if (item.route) {
      router.push(item.route)
    }
  }

  if (!isOpen) return null

  const mod = getModifierLabel()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div
        className="relative w-full max-w-2xl bg-canvas border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-default bg-surface/50">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a workspace, action, or command (e.g. Academics, Users, Fee)..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-muted bg-subtle border border-border-default rounded">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No matching workspaces or actions found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const Icon = item.icon

              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors",
                    isSelected
                      ? "bg-action-black text-canvas font-medium shadow-xs"
                      : "text-text-primary hover:bg-subtle"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isSelected
                          ? "bg-white/20 text-canvas"
                          : "bg-subtle text-text-secondary"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="truncate font-semibold">{item.title}</div>
                      {item.subtitle && (
                        <div
                          className={cn(
                            "truncate text-[10px]",
                            isSelected ? "text-neutral-300" : "text-text-secondary"
                          )}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[9px] uppercase font-mono px-1.5 py-0.5 rounded",
                          isSelected
                            ? "bg-white/10 text-neutral-200"
                            : "bg-subtle text-text-muted border border-border-default/50"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-brand-green" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2.5 bg-surface border-t border-border-default flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono text-[10px] bg-subtle border border-border-default rounded">↑</kbd>
              <kbd className="px-1 py-0.5 font-mono text-[10px] bg-subtle border border-border-default rounded">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-subtle border border-border-default rounded">↵</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-subtle border border-border-default rounded">Esc</kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px]">
            <span>Press</span>
            <kbd className="px-1 py-0.5 font-mono bg-subtle border border-border-default rounded">{mod}K</kbd>
            <span>anywhere</span>
          </div>
        </div>
      </div>
    </div>
  )
}
