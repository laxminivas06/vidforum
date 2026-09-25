import React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, ShieldAlert, FolderSearch, RefreshCw } from "lucide-react"
import { Button } from "./Button"

// -------------------------------------------------------------
// EmptyState Component
// -------------------------------------------------------------
export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border-default/80 bg-subtle/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-badge-neutral text-text-secondary flex items-center justify-center shrink-0">
        {icon || <FolderSearch className="w-6 h-6 text-text-muted" />}
      </div>
      <div className="max-w-md space-y-1.5">
        <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="secondary" size="dense" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// ErrorState Component
// -------------------------------------------------------------
export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-rose-200/80 bg-rose-50/50 p-5 sm:p-6 text-rose-900 space-y-3",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold tracking-tight text-status-error">
            {title}
          </h4>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <Button
            variant="secondary"
            size="dense"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="border-rose-200 text-rose-800 hover:bg-rose-100/60"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// PermissionDenied Component (PRD Rule 26 & design.md Section 7)
// -------------------------------------------------------------
export interface PermissionDeniedProps {
  requiredPermission?: string
  message?: string
  className?: string
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  requiredPermission,
  message = "You do not have administrative authorization to view this workspace or resource.",
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-default bg-canvas p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-8 shadow-sm",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-amber-50 text-status-warning border border-amber-200 flex items-center justify-center shrink-0">
        <ShieldAlert className="w-6 h-6 text-amber-600" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-text-primary tracking-tight">
          Access Restricted
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          {message}
        </p>
        {requiredPermission && (
          <div className="pt-2">
            <span className="text-[11px] font-mono bg-badge-neutral px-2 py-0.5 rounded border border-border-default text-text-muted">
              Permission Required: {requiredPermission}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// LoadingSkeleton Component
// -------------------------------------------------------------
export interface LoadingSkeletonProps {
  variant?: "card" | "table" | "form" | "dashboard"
  className?: string
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = "card",
  className,
}) => {
  if (variant === "table") {
    return (
      <div className={cn("rounded-xl border border-border-default bg-canvas p-6 space-y-4", className)}>
        <div className="h-6 w-1/3 bg-badge-neutral rounded-md animate-pulse" />
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-subtle rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === "dashboard") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border-default bg-canvas p-5 space-y-3">
              <div className="h-4 w-1/2 bg-badge-neutral rounded animate-pulse" />
              <div className="h-8 w-1/3 bg-subtle rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl border border-border-default bg-canvas p-6 animate-pulse" />
          <div className="h-72 rounded-xl border border-border-default bg-canvas p-6 animate-pulse" />
        </div>
      </div>
    )
  }

  if (variant === "form") {
    return (
      <div className={cn("rounded-xl border border-border-default bg-canvas p-6 space-y-5", className)}>
        <div className="h-5 w-1/4 bg-badge-neutral rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-subtle rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-subtle rounded-lg animate-pulse" />
          <div className="h-24 w-full bg-subtle rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border-default bg-canvas p-6 space-y-3 animate-pulse",
        className
      )}
    >
      <div className="h-5 w-2/5 bg-badge-neutral rounded" />
      <div className="h-4 w-full bg-subtle rounded" />
      <div className="h-4 w-4/5 bg-subtle rounded" />
    </div>
  )
}
