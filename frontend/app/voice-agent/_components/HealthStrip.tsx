"use client"

import React from "react"
import { useVoiceHealth } from "@/lib/api/hooks"
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HealthStripProps {
  onOpenSetup?: () => void
  onFixClick?: () => void
}

export const HealthStrip: React.FC<HealthStripProps> = ({ onOpenSetup, onFixClick }) => {
  const { data: health, isLoading } = useVoiceHealth()
  const handleClick = onFixClick || onOpenSetup || (() => {})

  if (isLoading || !health) {
    return (
      <div className="h-9 flex items-center">
        <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" />
      </div>
    )
  }

  const isReady = health.overallStatus === "ready"
  const isBlocked = health.phoneLine.status !== "ready"

  if (isReady) {
    return (
      <div className="flex items-center">
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70 transition-colors"
          title="Click to view setup and service health"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Phone line ready</span>
          <span className="text-emerald-600/70 text-[11px] ml-1">· {health.phoneLine.provider}</span>
        </button>
      </div>
    )
  }

  // Degraded or Blocked Banner
  const isError = isBlocked
  const message = health.phoneLine.status !== "ready"
    ? health.phoneLine.message
    : health.voice.status !== "ready"
    ? health.voice.message
    : health.aiAssistant.message

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-xs border transition-colors",
        isError
          ? "bg-red-50 text-red-900 border-red-200"
          : "bg-amber-50 text-amber-900 border-amber-200"
      )}
    >
      <div className="flex items-center gap-2">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <span className="font-semibold">{isError ? "Phone calls are blocked:" : "Notice:"}</span>
        <span>{message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity",
            isError ? "text-red-800" : "text-amber-800"
          )}
        >
          <span>How to fix</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
