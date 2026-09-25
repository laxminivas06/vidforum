import React, { useEffect } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface SlideOverProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footerActions?: React.ReactNode
  footer?: React.ReactNode
  width?: "default" | "wide" | "full"
  className?: string
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  open,
  onClose,
  title,
  subtitle,
  children,
  footerActions,
  footer,
  width = "default",
  className,
}) => {
  const isPanelOpen = open !== undefined ? open : (isOpen ?? false)
  const activeFooter = footer || footerActions

  // Lock body scroll when open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isPanelOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPanelOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPanelOpen, onClose])

  if (!isPanelOpen) return null

  const widths = {
    default: "md:max-w-[480px]",
    wide: "md:max-w-[640px]",
    full: "md:max-w-[800px]",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div
          className={cn(
            "w-screen bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-border-default",
            widths[width],
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border-default flex items-start justify-between gap-4 bg-subtle/50">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-text-secondary mt-0.5 truncate font-mono">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1.5 text-text-secondary hover:text-text-primary hover:bg-subtle rounded-lg transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {children}
          </div>

          {/* Sticky Footer Actions */}
          {activeFooter && (
            <div className="p-4 sm:p-5 border-t border-border-default bg-surface sticky bottom-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] flex items-center justify-end gap-3">
              {activeFooter}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
