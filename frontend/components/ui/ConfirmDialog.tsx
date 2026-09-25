import React, { useEffect } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "./Button"

export interface ConfirmDialogProps {
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onCancel?: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  confirmLabel?: string
  cancelText?: string
  cancelLabel?: string
  isDestructive?: boolean
  danger?: boolean
  isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  open,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  isDestructive,
  danger,
  isLoading = false,
}) => {
  const isDialogOpen = open !== undefined ? open : (isOpen ?? false)
  const handleClose = onCancel || onClose || (() => {})
  const activeConfirmText = confirmLabel || confirmText || "Confirm"
  const activeCancelText = cancelLabel || cancelText || "Cancel"
  const activeDestructive = danger !== undefined ? danger : (isDestructive ?? true)

  useEffect(() => {
    if (isDialogOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isDialogOpen])

  if (!isDialogOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isLoading && handleClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-surface w-full max-w-md rounded-2xl border border-border-default shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-in zoom-in-95 duration-150"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          {activeDestructive && (
            <div className="w-10 h-10 rounded-full bg-red-50 text-status-error border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          )}

          <div className="space-y-1.5 flex-1 min-w-0">
            <h2 className="text-base font-semibold text-text-primary tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="dense"
            onClick={handleClose}
            disabled={isLoading}
          >
            {activeCancelText}
          </Button>

          <Button
            type="button"
            variant={activeDestructive ? "destructive" : "primary"}
            size="dense"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {activeConfirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
