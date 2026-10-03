"use client"

import React from "react"
import { X, History, Shield, Clock, User, CheckCircle, AlertCircle, Key } from "lucide-react"
import { Button, Badge } from "@/components/ui"
import { useUserAudit } from "@/lib/api/hooks"

interface UserAuditModalProps {
  isOpen: boolean
  user: any | null
  onClose: () => void
}

export const UserAuditModal: React.FC<UserAuditModalProps> = ({
  isOpen,
  user,
  onClose,
}) => {
  const targetId = user?.profileId || user?.id
  const { data: logs = [], isLoading } = useUserAudit(isOpen ? targetId : undefined)

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <History className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Security & Lifecycle Audit Trail</h2>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Loading security audit records...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No audit logs recorded for this account yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => {
                const isProvision = log.action.includes("provision")
                const isReset = log.action.includes("reset")
                const isAccess = log.action.includes("access")
                const isStatus = log.action.includes("status")

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-canvas border border-border-default space-y-1.5 text-xs transition-all hover:border-brand-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isProvision && <Shield className="w-3.5 h-3.5 text-brand-primary" />}
                        {isReset && <Key className="w-3.5 h-3.5 text-amber-500" />}
                        {isAccess && <Shield className="w-3.5 h-3.5 text-emerald-500" />}
                        {isStatus && <AlertCircle className="w-3.5 h-3.5 text-blue-500" />}
                        <span className="font-bold font-mono text-text-primary uppercase tracking-wider text-[11px]">
                          {log.action}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-text-secondary text-[11px] flex items-center justify-between">
                      <span>Actor: {log.actor_name || "System Admin"} ({log.actor_email || "System Engine"})</span>
                      {log.ip_address && (
                        <span className="font-mono text-text-muted">IP: {log.ip_address}</span>
                      )}
                    </div>

                    {log.new_value && (
                      <div className="mt-1 p-2 rounded-lg bg-surface border border-border-subtle font-mono text-[10px] text-text-secondary overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.new_value, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-end bg-subtle">
          <Button type="button" variant="secondary" size="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
