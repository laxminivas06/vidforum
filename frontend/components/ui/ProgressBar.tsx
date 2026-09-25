import React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps {
  value: number // 0 to 100
  max?: number
  label?: string
  valueLabel?: string
  variant?: "black" | "green" | "warning" | "error"
  className?: string
  height?: "sm" | "default" | "lg"
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  valueLabel,
  variant = "black",
  className,
  height = "default",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const heights = {
    sm: "h-1.5",
    default: "h-2",
    lg: "h-2.5",
  }

  const variants = {
    black: "bg-action-black",
    green: "bg-brand-green",
    warning: "bg-status-warning",
    error: "bg-status-error",
  }

  return (
    <div className={cn("w-full", className)}>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between text-xs font-medium mb-1.5 text-text-secondary">
          {label && <span>{label}</span>}
          {valueLabel ? (
            <span className="tabular-nums text-text-primary">{valueLabel}</span>
          ) : (
            <span className="tabular-nums text-text-primary">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-badge-neutral rounded-full overflow-hidden",
          heights[height]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
