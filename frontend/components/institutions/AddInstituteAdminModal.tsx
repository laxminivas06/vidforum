"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  User,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react"
import { Button, FormField, Input, Badge } from "@/components/ui"
import { PLATFORM_WORKSPACES } from "@/config/workspaces"
import { useCreateInstitutionAdmin } from "@/lib/api/hooks"
import { Institution } from "@/types"

interface AddInstituteAdminModalProps {
  isOpen: boolean
  institution: Institution | null
  onClose: () => void
  onSuccess?: () => void
}

export const AddInstituteAdminModal: React.FC<AddInstituteAdminModalProps> = ({
  isOpen,
  institution,
  onClose,
  onSuccess,
}) => {
  const createAdminMutation = useCreateInstitutionAdmin()

  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(
    PLATFORM_WORKSPACES.map((w) => w.id)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  if (!isOpen || !institution) return null

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

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!userId.trim()) {
      errs.userId = "User ID / Identifier is required"
    } else if (userId.trim().length < 3) {
      errs.userId = "User ID must be at least 3 characters"
    }

    if (!email.trim()) {
      errs.email = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid institutional email"
    }

    if (!password.trim()) {
      errs.password = "Password is required"
    } else if (password.trim().length < 4) {
      errs.password = "Password must be at least 4 characters"
    }

    if (selectedWorkspaces.length === 0) {
      errs.workspaces = "Please select at least one permitted platform workspace"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createAdminMutation.mutateAsync({
        institutionId: institution.id,
        institutionName: institution.name,
        institutionCode: institution.code,
        userId: userId.trim(),
        email: email.trim(),
        password: password.trim(),
        workspaces: selectedWorkspaces,
        name: `${institution.code} Administrator`,
      })

      setSuccessBanner(
        `Institute Administrator '${userId}' created successfully with access to ${selectedWorkspaces.length} workspace(s).`
      )

      setTimeout(() => {
        setSuccessBanner(null)
        setUserId("")
        setEmail("")
        setPassword("")
        setSelectedWorkspaces(PLATFORM_WORKSPACES.map((w) => w.id))
        onSuccess?.()
        onClose()
      }, 1400)
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to provision Institute Administrator" })
    }
  }

  // Keyboard navigation: Escape closes, Cmd/Ctrl+Enter submits
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(e as any)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, handleSubmit])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-canvas border border-border-default rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
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
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Add Institute Administrator
              </h3>
              <p className="text-xs text-text-secondary">
                Assign credentials & scoped workspace access for{" "}
                <span className="font-semibold text-text-primary">{institution.name}</span>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errors.form && (
            <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-2 text-xs text-status-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center gap-2 text-xs text-status-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* User ID */}
          <FormField
            label="User ID / Login Identifier"
            required
            error={errors.userId}
            helperText="The unique login handle used by this administrator (e.g. admin_blr or adm-001)"
          >
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. admin_sia or sia_principal"
                className="pl-9 font-mono"
              />
            </div>
          </FormField>

          {/* Email */}
          <FormField
            label="Official Email Address"
            required
            error={errors.email}
            helperText="Official institutional communication and password recovery address"
          >
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`e.g. admin@${institution.domain || "school.vid.edu"}`}
                className="pl-9"
              />
            </div>
          </FormField>

          {/* Password */}
          <FormField
            label="Initial Account Password"
            required
            error={errors.password}
            helperText="Initial credential. First login will enforce a password update."
          >
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial password..."
                className="pl-9 font-mono"
              />
            </div>
          </FormField>

          {/* Workspaces Scoping Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div>
                <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-primary" />
                  <span>Platform Workspaces Access</span>
                  <span className="text-status-error">*</span>
                </label>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  This Institute Admin will ONLY be granted access to the checked workspaces below.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-text-muted text-xs">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-semibold text-text-secondary hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {errors.workspaces && (
              <p className="text-xs text-status-error flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.workspaces}</span>
              </p>
            )}

            {/* Workspaces Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-56 overflow-y-auto pr-1">
              {PLATFORM_WORKSPACES.map((ws) => {
                const isChecked = selectedWorkspaces.includes(ws.id)
                return (
                  <div
                    key={ws.id}
                    onClick={() => handleToggleWorkspace(ws.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2.5 ${
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
                        <span className="font-semibold text-text-primary truncate">
                          {ws.name}
                        </span>
                        <Badge
                          variant="neutral"
                          className="text-[9px] px-1.5 py-0 uppercase tracking-wider"
                        >
                          {ws.category}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                        {ws.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-text-secondary">
              <span>Selected Workspaces:</span>
              <span className="font-semibold text-text-primary">
                {selectedWorkspaces.length} of {PLATFORM_WORKSPACES.length}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border-default flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="dense"
              onClick={onClose}
              disabled={createAdminMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="dense"
              isLoading={createAdminMutation.isPending}
            >
              Create Institute Admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
