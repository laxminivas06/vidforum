"use client"

import React, { useEffect } from "react"
import { X, Keyboard, Command } from "lucide-react"
import { getModifierLabel, isMac } from "@/lib/utils/keyboard"

export interface ShortcutsHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutEntry {
  keys: string[]
  description: string
  note?: string
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const mod = getModifierLabel()

  const sections: { title: string; shortcuts: ShortcutEntry[] }[] = [
    {
      title: "Global Navigation",
      shortcuts: [
        { keys: [mod, "K"], description: "Open Command Palette / Quick Search" },
        { keys: [mod, "B"], description: "Toggle Sidebar (Collapse / Expand)" },
        { keys: [mod, "/"], description: "Open this Keyboard Shortcuts cheat sheet" },
        { keys: ["?"], description: "Show Shortcuts (when not in a text field)" },
        { keys: ["Esc"], description: "Dismiss active modal, palette, or menu" },
      ],
    },
    {
      title: "Modals & Confirmation Dialogs",
      shortcuts: [
        { keys: ["↵ Enter"], description: "Confirm dialog action / Primary button" },
        { keys: [mod, "↵ Enter"], description: "Submit active modal form" },
        { keys: ["Esc"], description: "Cancel or close without saving" },
        { keys: ["Tab"], description: "Navigate between form fields and buttons" },
      ],
    },
    {
      title: "Dropdowns & Selection",
      shortcuts: [
        { keys: ["↓", "↑"], description: "Navigate options in dropdown list" },
        { keys: ["↵ Enter"], description: "Select highlighted option and close" },
        { keys: ["Esc"], description: "Close dropdown without making changes" },
      ],
    },
    {
      title: "Quick Workspace Jumps (Press 'G' then letter)",
      shortcuts: [
        { keys: ["G", "D"], description: "Go to Institute Admin Dashboard" },
        { keys: ["G", "A"], description: "Go to Academics & Curriculum" },
        { keys: ["G", "S"], description: "Go to Admissions & Enrollments" },
        { keys: ["G", "U"], description: "Go to Users & Faculty" },
        { keys: ["G", "I"], description: "Go to Institutions Directory" },
        { keys: ["G", "F"], description: "Go to Finance & Fee Collection" },
      ],
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-xl bg-canvas border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-border-default bg-surface/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-action-black text-canvas flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-canvas" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-text-secondary">
                Mac ({isMac() ? "Active" : "Compatible"}) & Windows cross-platform keybindings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-bold">
                {section.title}
              </h4>
              <div className="rounded-xl border border-border-default bg-surface divide-y divide-border-default/60">
                {section.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <span className="text-text-primary font-medium">
                      {sc.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 text-[11px] font-mono font-semibold text-text-primary bg-canvas border border-border-default rounded shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-default bg-surface flex items-center justify-between text-xs text-text-muted">
          <span>Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-canvas border border-border-default rounded">Esc</kbd> to close</span>
          <span className="text-[11px] text-brand-primary font-medium">VID Platform Keyboard System</span>
        </div>
      </div>
    </div>
  )
}
