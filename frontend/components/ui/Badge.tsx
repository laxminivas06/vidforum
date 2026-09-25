import React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "positive" | "warning" | "error" | "info"
  showDot?: boolean
  size?: "sm" | "default"
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  showDot = true,
  size = "default",
  children,
  ...props
}) => {
  const variants = {
    neutral: {
      wrapper: "bg-badge-neutral text-text-secondary border border-border-default/60",
      dot: "bg-text-muted",
    },
    positive: {
      wrapper: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
      dot: "bg-emerald-600",
    },
    warning: {
      wrapper: "bg-amber-50 text-amber-800 border border-amber-200/60",
      dot: "bg-amber-600",
    },
    error: {
      wrapper: "bg-rose-50 text-rose-700 border border-rose-200/60",
      dot: "bg-rose-600",
    },
    info: {
      wrapper: "bg-blue-50 text-blue-700 border border-blue-200/60",
      dot: "bg-blue-600",
    },
  }

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] font-medium leading-4 tracking-wide",
    default: "px-2.5 py-1 text-xs font-medium leading-4",
  }

  const currentVariant = variants[variant]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full whitespace-nowrap",
        sizes[size],
        currentVariant.wrapper,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", currentVariant.dot)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
