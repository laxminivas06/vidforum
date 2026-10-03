"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  Layers,
  Save,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react"
import { Button, Badge, FormField, Select } from "@/components/ui"
import { PLATFORM_WORKSPACES } from "@/config/workspaces"
import { useRoleTemplates, useUpdateUserAccess } from "@/lib/api/hooks"

interface EditUserAccessModalProps {
  isOpen: boolean
  user: any | null
  onClose: () => void
  onSuccess?: () => void
}

export const EditUserAccessModal: React.FC<EditUserAccessModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const { data: roleTemplates = [] } = useRoleTemplates()
  const updateAccessMutation = useUpdateUserAccess()

  const [selectedTemplate, setSelectedTemplate] = useState<string>("TEACHER")
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const tplKey = user.roleTemplate || "TEACHER"
      setSelectedTemplate(tplKey)

      const initialWorkspaces = Array.isArray(user.assignedWorkspaces) && user.assignedWorkspaces.length > 0
        ? user.assignedWorkspaces
        : ["faculty", "academics", "attendance", "examinations", "timetable"]
      setSelectedWorkspaces(initialWorkspaces)

      setError(null)
      setSuccessBanner(null)
    }
  }, [user, isOpen])

  if (!isOpen || !user) return null

  const handleTemplateChange = (tplKey: string) => {
    setSelectedTemplate(tplKey)
    const found = roleTemplates.find((t: any) => t.key === tplKey)
    if (found && Array.isArray(found.defaultWorkspaces)) {
      setSelectedWorkspaces(found.defaultWorkspaces)
    }
  }

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
    setError(null)

    try {
      const targetId = user.profileId || user.id
      await updateAccessMutation.mutateAsync({
        id: targetId,
        roleTemplate: selectedTemplate,
        workspaces: selectedWorkspaces,
      })

      setSuccessBanner(`Access permissions updated for ${user.name || user.email}.`)
      setTimeout(() => {
        setSuccessBanner(null)
        onSuccess?.()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Failed to update user access")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Edit Account Access & Workspaces</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {user.name} • <span className="font-mono">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Section 10 Role Template */}
          <FormField label="Assign Role Template (Section 10 Standard)" required>
            <Select
              value={selectedTemplate}
              onChange={(val) => handleTemplateChange(val)}
              className="w-full text-xs font-semibold"
              options={roleTemplates.map((t: any) => ({
                label: `${t.name} (${t.roleName} • ${t.defaultWorkspaces?.length || 0} Default Workspaces)`,
                value: t.key,
              }))}
            />
          </FormField>

          {/* Workspace Multi-Select Grid */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-primary" />
                <span>Permitted Workspaces ({selectedWorkspaces.length} Selected)</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-action-primary hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-border-default">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-text-muted hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-2 rounded-xl bg-canvas border border-border-default">
              {PLATFORM_WORKSPACES.map((ws) => {
                const isSelected = selectedWorkspaces.includes(ws.id)
                return (
                  <div
                    key={ws.id}
                    onClick={() => handleToggleWorkspace(ws.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-brand-primary/10 border-brand-primary/40 text-text-primary"
                        : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted shrink-0" />
                    )}
                    <div className="flex-1 truncate">
                      <div className="font-semibold truncate">{ws.name}</div>
                      <div className="text-[10px] text-text-muted capitalize">{ws.category}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border-default flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" size="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="default"
              isLoading={updateAccessMutation.isPending}
              leadingIcon={<Save className="w-4 h-4" />}
            >
              Save Access
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
