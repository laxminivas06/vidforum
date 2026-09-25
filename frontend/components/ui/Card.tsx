import React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Button } from "./Button"
import { Badge } from "./Badge"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "standard" | "stat" | "focal" | "bordered"
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "standard", children, ...props }, ref) => {
    const base = "rounded-xl transition-all"
    const variants = {
      standard:
        "bg-surface border border-border-default p-4 sm:p-5 shadow-card",
      stat:
        "bg-surface border border-border-default p-4 sm:p-5 shadow-card flex flex-col justify-between",
      focal:
        "bg-[#0A0A0A] text-white border border-neutral-800 p-5 sm:p-6 shadow-md relative overflow-hidden",
      bordered:
        "bg-subtle/50 border border-border-default/80 p-4 sm:p-5",
    }

    return (
      <div
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-3", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-semibold leading-none tracking-tight text-text-primary", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-text-secondary mt-1", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-3 border-t border-border-subtle", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  delta?: string
  deltaType?: "increase" | "decrease" | "neutral"
  trend?: {
    value: string
    isPositive?: boolean
  }
  description?: string
  icon?: React.ReactNode
  badgeText?: string
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  delta,
  deltaType = "neutral",
  trend,
  description,
  icon,
  badgeText,
  className,
}) => {
  const activeDelta = delta || (trend ? trend.value : undefined)
  const activeDeltaType =
    deltaType !== "neutral"
      ? deltaType
      : trend
      ? trend.isPositive
        ? "increase"
        : "decrease"
      : "neutral"

  return (
    <Card variant="stat" className={className}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-text-secondary truncate uppercase font-mono tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-subtle border border-border-default/80 text-brand-primary shrink-0">
            {icon}
          </div>
        )}
        {badgeText && (
          <Badge variant="neutral" size="sm" showDot={false}>
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="mt-1">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-mono tabular-nums">
          {value}
        </div>

        {(activeDelta || sublabel || description) && (
          <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-text-secondary">
            {activeDelta && (
              <span
                className={cn(
                  "font-medium inline-flex items-center gap-1 text-[11px]",
                  activeDeltaType === "increase"
                    ? "text-emerald-700"
                    : activeDeltaType === "decrease"
                    ? "text-amber-700"
                    : "text-text-muted"
                )}
              >
                {activeDeltaType === "increase" ? "↑" : activeDeltaType === "decrease" ? "↓" : "•"} {activeDelta}
              </span>
            )}
            {(description || sublabel) && (
              <span className="text-text-muted text-[11px] truncate">
                {description || sublabel}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export interface SpotHeroPanelProps {
  badgeText?: string
  headline: string
  description?: string
  className?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export const SpotHeroPanel: React.FC<SpotHeroPanelProps> = ({
  badgeText,
  headline,
  description,
  className,
  actions,
  children,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-[#0A0A0A] text-white p-5 sm:p-7 shadow-xl border border-neutral-800 overflow-hidden",
        className
      )}
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-4">
        {badgeText && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-[10px] font-mono font-semibold text-brand-primary tracking-widest uppercase">
              {badgeText}
            </span>
          </div>
        )}

        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {headline}
          </h2>
          {description && (
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="pt-1">{actions}</div>}
        {children && <div className="pt-2">{children}</div>}
      </div>
    </div>
  )
}

export interface PlanCardProps {
  tierName?: string
  title?: string
  subtitle?: string
  price: string
  billingCycle?: string
  period?: string
  features: string[]
  highlighted?: boolean
  isHighlighted?: boolean
  badgeText?: string
  ctaText?: string
  onCtaClick?: () => void
  className?: string
}

export const PlanCard: React.FC<PlanCardProps> = ({
  tierName,
  title,
  subtitle,
  price,
  billingCycle,
  period = "/month",
  features,
  highlighted = false,
  isHighlighted = false,
  badgeText,
  ctaText = "Select Plan",
  onCtaClick,
  className,
}) => {
  const activeHighlight = highlighted || isHighlighted
  const activeTitle = tierName || title || "Plan"
  const activeCycle = billingCycle || period

  return (
    <div
      className={cn(
        "rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all",
        activeHighlight
          ? "bg-[#0A0A0A] text-white border border-neutral-800 shadow-xl"
          : "bg-surface text-text-primary border border-border-default shadow-sm",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold tracking-tight">{activeTitle}</h3>
          {badgeText && (
            <Badge
              variant={activeHighlight ? "positive" : "neutral"}
              size="sm"
              showDot={false}
              className={activeHighlight ? "bg-emerald-950 text-emerald-300 border-emerald-800" : ""}
            >
              {badgeText}
            </Badge>
          )}
        </div>

        {subtitle && (
          <p
            className={cn(
              "text-xs mb-4",
              activeHighlight ? "text-neutral-400" : "text-text-secondary"
            )}
          >
            {subtitle}
          </p>
        )}

        <div className="flex items-baseline gap-1 my-4">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight font-mono tabular-nums">
            {price}
          </span>
          {activeCycle && (
            <span
              className={cn(
                "text-xs",
                activeHighlight ? "text-neutral-400" : "text-text-secondary"
              )}
            >
              {activeCycle}
            </span>
          )}
        </div>

        <div className="h-px bg-current opacity-10 my-4" />

        <ul className="space-y-2.5 my-4 text-xs sm:text-sm">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <Check
                className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  activeHighlight ? "text-brand-primary" : "text-emerald-600"
                )}
              />
              <span
                className={
                  activeHighlight ? "text-neutral-200" : "text-text-secondary"
                }
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 mt-4">
        <Button
          variant={activeHighlight ? "primary" : "secondary"}
          className={cn(
            "w-full",
            activeHighlight &&
              "bg-brand-primary text-black hover:bg-emerald-400"
          )}
          onClick={onCtaClick}
        >
          {ctaText}
        </Button>
      </div>
    </div>
  )
}
