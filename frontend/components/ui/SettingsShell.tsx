import React from "react"
import { cn } from "@/lib/utils"

export interface SettingsSection {
  id: string
  label: string
  icon?: React.ReactNode
  description?: string
  badge?: string
}

export interface SettingsShellProps {
  title?: string
  subtitle?: string
  sections: SettingsSection[]
  activeSectionId: string
  onSelectSection: (id: string) => void
  children: React.ReactNode
  className?: string
  rightHeaderAction?: React.ReactNode
}

export const SettingsShell: React.FC<SettingsShellProps> = ({
  title,
  subtitle,
  sections,
  activeSectionId,
  onSelectSection,
  children,
  className,
  rightHeaderAction,
}) => {
  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header if provided */}
      {(title || rightHeaderAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default/60">
          <div>
            {title && (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {rightHeaderAction && <div className="shrink-0">{rightHeaderAction}</div>}
        </div>
      )}

      {/* Mobile Horizontal Tabs Strip (< 768px) */}
      <div className="block md:hidden border-b border-border-default overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2 pb-2 min-w-max">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId
            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "bg-action-black text-canvas shadow-sm"
                    : "bg-badge-neutral text-text-secondary hover:text-text-primary hover:bg-border-default/50"
                )}
              >
                {section.icon && (
                  <span className="shrink-0 text-current">{section.icon}</span>
                )}
                <span>{section.label}</span>
                {section.badge && (
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-current/20">
                    {section.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop Two-Pane Split Layout (>= 768px) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Sub-Nav Pane (≈220px / 3 cols) */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-3 space-y-1 bg-sidebar/70 p-2 rounded-xl border border-border-default/80 sticky top-20">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Configuration
          </div>
          {sections.map((section) => {
            const isActive = section.id === activeSectionId
            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-left transition-all flex items-center justify-between gap-2",
                  isActive
                    ? "bg-canvas text-text-primary border border-border-default shadow-sm font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-subtle/80"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {section.icon && (
                    <span
                      className={cn(
                        "shrink-0",
                        isActive ? "text-action-black" : "text-text-secondary"
                      )}
                    >
                      {section.icon}
                    </span>
                  )}
                  <span className="truncate">{section.label}</span>
                </div>
                {section.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-badge-neutral text-text-secondary border border-border-default">
                    {section.badge}
                  </span>
                )}
              </button>
            )
          })}
        </aside>

        {/* Right Fluid Content Panel (9 cols) */}
        <main className="md:col-span-9 lg:col-span-9 rounded-xl border border-border-default bg-canvas p-5 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[480px]">
          {children}
        </main>
      </div>
    </div>
  )
}
