import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, ChevronDown, Check, Search, Calendar as CalendarIcon } from "lucide-react"

// -------------------------------------------------------------
// FormField Wrapper (Zod Error Support)
// -------------------------------------------------------------
export interface FormFieldProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  className?: string
  children: React.ReactNode
  id?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  className,
  children,
  id,
}) => {
  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm font-medium text-text-primary"
        >
          {label} {required && <span className="text-status-error">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-status-error flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-text-secondary mt-1">{helperText}</p>
      ) : null}
    </div>
  )
}

// -------------------------------------------------------------
// Input Component
// -------------------------------------------------------------
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3 text-text-secondary pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full h-10 px-3.5 bg-canvas border rounded-lg text-sm text-text-primary placeholder:text-text-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-action-black/10 focus:border-border-strong",
            hasError
              ? "border-status-error focus:border-status-error focus:ring-status-error/10"
              : "border-border-default",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            disabled && "bg-subtle opacity-60 cursor-not-allowed",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-text-secondary flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// -------------------------------------------------------------
// Searchable Select Component
// -------------------------------------------------------------
export interface SelectOption {
  label: string
  value: string
  sublabel?: string
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  hasError?: boolean
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchable = true,
  disabled = false,
  hasError = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 bg-canvas border rounded-lg text-sm text-left flex items-center justify-between transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-action-black/10 focus:border-border-strong",
          hasError
            ? "border-status-error"
            : isOpen
            ? "border-border-strong"
            : "border-border-default",
          disabled && "bg-subtle opacity-60 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "truncate",
            !selectedOption ? "text-text-muted" : "text-text-primary"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-secondary transition-transform shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border-default bg-canvas shadow-lg py-1.5 max-h-60 overflow-hidden flex flex-col">
          {searchable && (
            <div className="px-2 pb-1.5 border-b border-border-default/50">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-action-black/20"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted text-center">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearchTerm("")
                  }}
                  className={cn(
                    "px-3 py-2 text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors",
                    opt.value === value
                      ? "bg-badge-neutral text-text-primary font-medium"
                      : "text-text-secondary hover:bg-subtle hover:text-text-primary"
                  )}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[11px] text-text-muted">{opt.sublabel}</div>
                    )}
                  </div>
                  {opt.value === value && (
                    <Check className="w-4 h-4 text-brand-green shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// DatePicker Component
// -------------------------------------------------------------
export interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  hasError?: boolean
  className?: string
  min?: string
  max?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  hasError = false,
  className,
  min,
  max,
}) => {
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <span className="absolute left-3 text-text-secondary pointer-events-none flex items-center">
        <CalendarIcon className="w-4 h-4" />
      </span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-10 pl-9 pr-3.5 bg-canvas border rounded-lg text-sm text-text-primary transition-colors cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-action-black/10 focus:border-border-strong",
          hasError ? "border-status-error" : "border-border-default",
          disabled && "bg-subtle opacity-60 cursor-not-allowed"
        )}
      />
    </div>
  )
}
