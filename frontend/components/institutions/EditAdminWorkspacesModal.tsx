"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  CheckSquare,
  Square,
  Layers,
  Save,
  Loader2,
} from "lucide-react"
import { Button, Badge } from "@/components/ui"
import { PLATFORM_WORKSPACES } from "@/config/workspaces"
import { useUpdateAdminWorkspaces } from "@/lib/api/hooks"
import { Institution } from "@/types"

interface EditAdminWorkspacesModalProps {
  isOpen: boolean
  institution: Institution | null
  admin: any | null
  onClose: () => void
  onSuccess?: () => void
}

export const EditAdminWorkspacesModal: React.FC<EditAdminWorkspacesModalProps> = ({
  isOpen,
  institution,
  admin,
  onClose,
  onSuccess,
}) => {
  const updateWorkspacesMutation = useUpdateAdminWorkspaces()
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (admin) {
      const initial = Array.isArray(admin.workspaces)
        ? admin.workspaces
        : PLATFORM_WORKSPACES.map((w) => w.id)
      setSelectedWorkspaces(initial)
      setError(null)
      setSuccessBanner(null)
    }
  }, [admin, isOpen])

  if (!isOpen || !institution || !admin) return null

  const handleToggleWorkspace = (id: string) => {
    setSelectedWorkspaces((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedWorkspaces(PLATFORM_WORKSPACES.map((w) => w.id))
  }

  const handleDeselectAll = () => {
    setSelectedWorkspaces([])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const targetId = admin.id || admin.userId || admin.email
      await updateWorkspacesMutation.mutateAsync({
        institutionId: institution.id,
        adminId: targetId,
        workspaces: selectedWorkspaces,
      })

      setSuccessBanner(
        `Workspaces updated for ${admin.name || admin.userId}. Saved to Cloud DB (${selectedWorkspaces.length} permitted).`
      )

      setTimeout(() => {
        setSuccessBanner(null)
        onSuccess?.()
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || "Failed to update workspaces in Cloud DB")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-canvas border border-border-default rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default bg-surface/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-action-black text-canvas flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-canvas" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary tracking-tight">
                  Edit Assigned Workspaces
                </h3>
                <Badge variant="positive" className="text-[10px]">
                  CLOUD DB
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Configure workspaces given or taken for{" "}
                <span className="font-semibold text-text-primary">
                  {admin.name || admin.userId}
                </span>{" "}
                ({institution.name})
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

        {/* Admin Details Summary Card */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="p-3 rounded-xl bg-surface border border-border-default flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-text-muted shrink-0" />
              <div className="truncate">
                <span className="font-bold text-text-primary block truncate">
                  {admin.name || admin.userId}
                </span>
                <span className="font-mono text-text-secondary text-[11px] block truncate">
                  {admin.email}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-text-secondary block">Assigned Workspaces</span>
              <span className="font-bold font-mono text-xs text-brand-primary">
                {selectedWorkspaces.length} of {PLATFORM_WORKSPACES.length}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-2 text-xs text-status-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center gap-2 text-xs text-status-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Quick Selection Toolbar */}
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <div>
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-primary" />
                <span>Permitted Platform Workspaces</span>
              </label>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Only checked workspaces will appear in the institute admin&apos;s navigation bar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-subtle hover:bg-subtle-hover text-text-primary border border-border-default transition-all"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-subtle text-text-secondary border border-transparent transition-all"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Workspaces Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
            {PLATFORM_WORKSPACES.map((ws) => {
              const isChecked = selectedWorkspaces.includes(ws.id)
              return (
                <div
                  key={ws.id}
                  onClick={() => handleToggleWorkspace(ws.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                    isChecked
                      ? "bg-action-black/5 border-action-black/30 dark:bg-white/5 dark:border-white/30"
                      : "bg-surface border-border-default hover:border-border-strong opacity-65"
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-text-primary">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-action-black dark:text-canvas" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-text-primary truncate">
                        {ws.name}
                      </span>
                      <Badge variant="neutral" className="text-[9px] px-1 py-0 uppercase">
                        {ws.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                      {ws.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default bg-surface/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-text-secondary">
            <span className="font-bold text-text-primary">{selectedWorkspaces.length}</span> workspaces given to this administrator
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="default"
              onClick={handleSave}
              disabled={isSubmitting}
              leadingIcon={
                isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )
              }
            >
              {isSubmitting ? "Saving to Cloud DB..." : "Save Workspaces to DB"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
