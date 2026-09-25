import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost"
  size?: "dense" | "default" | "lg" | "icon"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  leadingIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading = false,
      leftIcon,
      leadingIcon,
      rightIcon,
      trailingIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-black focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]"

    const variants = {
      primary:
        "bg-action-black text-canvas hover:bg-neutral-800 shadow-sm",
      secondary:
        "bg-canvas border border-border-default text-text-primary hover:bg-subtle shadow-sm hover:border-border-strong",
      destructive:
        "bg-canvas border border-status-error/40 text-status-error hover:bg-red-50/50 hover:border-status-error shadow-sm",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary hover:bg-subtle",
    }

    const sizes = {
      dense: "h-9 px-3.5 text-xs gap-1.5",
      default: "h-10 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-sm gap-2",
      icon: "h-9 w-9 p-0",
    }

    const activeLeftIcon = leadingIcon || leftIcon
    const activeRightIcon = trailingIcon || rightIcon

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          activeLeftIcon && <span className="inline-flex shrink-0">{activeLeftIcon}</span>
        )}
        {children}
        {!isLoading && activeRightIcon && (
          <span className="inline-flex shrink-0">{activeRightIcon}</span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"
