"use client"

import React, { useState } from "react"
import { VoiceCallLogItem } from "@/lib/api/hooks"
import { cn } from "@/lib/utils"

interface CallQueueProps {
  calls: VoiceCallLogItem[]
  currentCallPhone?: string
  onViewTranscript: (call: VoiceCallLogItem) => void
}

export const CallQueue: React.FC<CallQueueProps> = ({
  calls,
  currentCallPhone,
  onViewTranscript,
}) => {
  const [filter, setFilter] = useState<"all" | "answered" | "followup">("all")

  // Mask phone numbers: +91XXXXXX1234
  const maskPhone = (phone?: string) => {
    if (!phone) return "—"
    const cleaned = phone.replace(/\s+/g, "")
    if (cleaned.length >= 10) {
      const last4 = cleaned.slice(-4)
      return `+91XXXXXX${last4}`
    }
    return phone
  }

  const formatOutcome = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "answered":
        return { label: "Answered", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" }
      case "no_answer":
        return { label: "No answer", badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" }
      case "busy":
        return { label: "Busy", badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" }
      case "failed":
      case "rejected":
        return { label: "Failed", badge: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500" }
      case "in_progress":
      case "ringing":
        return { label: "In call now", badge: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500 animate-pulse" }
      default:
        return { label: "Queued", badge: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" }
    }
  }

  const filteredCalls = calls.filter((c) => {
    if (filter === "answered") return c.status === "completed" || c.status === "answered"
    if (filter === "followup") return ["no_answer", "busy", "failed", "rejected"].includes(c.status)
    return true
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Header & Filters */}
      <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Sequential call queue</h3>
          <p className="text-xs text-gray-500 mt-0.5">Calls are dialed one parent at a time in sequence</p>
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: `All (${calls.length})` },
            { id: "answered", label: "Answered" },
            { id: "followup", label: "Needs follow-up" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                filter === tab.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      {filteredCalls.length === 0 ? (
        <div className="p-10 text-center text-xs text-gray-500">
          No calls match the selected filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-semibold text-gray-500 tracking-wider">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Parent</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-5 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredCalls.map((call, idx) => {
                const outcome = formatOutcome(call.status)
                const isCurrentlyDialed = currentCallPhone && call.phone === currentCallPhone

                return (
                  <tr
                    key={call.id || idx}
                    className={cn(
                      "transition-colors",
                      isCurrentlyDialed
                        ? "bg-emerald-50/60 border-l-4 border-l-emerald-600 font-medium"
                        : "hover:bg-gray-50/80"
                    )}
                  >
                    <td className="py-3 px-4 text-gray-400 tabular-nums">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {call.guardian_name || "Parent"}
                    </td>

                    <td className="py-3 px-4 text-gray-700">
                      {(call as any).student_name || "Enrolled student"}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                      {maskPhone(call.phone)}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {(call as any).language === "en-IN" ? "English" : (call as any).language === "hi-IN" ? "Hindi" : "Telugu"}
                    </td>

                    <td className="py-3 px-4 tabular-nums text-gray-600">
                      {call.duration_seconds ? `${call.duration_seconds}s` : "—"}
                    </td>

                    <td className="py-3 px-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border", outcome.badge)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", outcome.dot)} />
                        {outcome.label}
                      </span>
                    </td>

                    <td className="py-3 px-5 text-right">
                      {call.status === "completed" || call.status === "answered" ? (
                        <button
                          onClick={() => onViewTranscript(call)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                        >
                          View transcript
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
