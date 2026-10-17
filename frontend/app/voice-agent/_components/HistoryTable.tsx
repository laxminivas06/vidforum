"use client"

import React, { useState, useMemo } from "react"
import {
  Search,
  Download,
  FileText,
  CheckCircle2,
  PhoneCall,
  Clock,
  PhoneMissed,
  AlertCircle,
  HelpCircle,
} from "lucide-react"
import { useVoiceAllCalls, AllVoiceCallItem } from "@/lib/api/hooks"

interface HistoryTableProps {
  onOpenTranscript: (call: AllVoiceCallItem) => void
}

export function HistoryTable({ onOpenTranscript }: HistoryTableProps) {
  const { data: calls = [], isLoading } = useVoiceAllCalls()
  const [searchQuery, setSearchQuery] = useState("")
  const [outcomeFilter, setOutcomeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")

  // Filter logic
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const parentMatch = (call.guardian_name || "").toLowerCase().includes(q)
        const studentMatch = (call.student_name || "").toLowerCase().includes(q)
        const phoneMatch = (call.phone || "").includes(q)
        const campMatch = (call.campaign_name || "").toLowerCase().includes(q)
        if (!parentMatch && !studentMatch && !phoneMatch && !campMatch) {
          return false
        }
      }

      // Outcome
      if (outcomeFilter !== "all") {
        const s = (call.status || "").toLowerCase()
        if (outcomeFilter === "answered" && !(s === "completed" || s === "answered")) return false
        if (outcomeFilter === "no-answer" && !(s === "no_answer" || s === "no-answer")) return false
        if (outcomeFilter === "busy" && s !== "busy") return false
        if (outcomeFilter === "failed" && s !== "failed") return false
        if (outcomeFilter === "followup") {
          const needsFollowup =
            call.conversation_payload?.follow_up_required ||
            call.conversation_payload?.summary?.toLowerCase().includes("follow")
          if (!needsFollowup) return false
        }
      }

      // Language
      if (languageFilter !== "all") {
        const lang = (call.language || call.conversation_payload?.language || "").toLowerCase()
        if (languageFilter === "te" && !lang.includes("te")) return false
        if (languageFilter === "hi" && !lang.includes("hi")) return false
        if (languageFilter === "en" && !lang.includes("en")) return false
      }

      // Date filter
      if (dateFilter !== "all" && call.started_at) {
        const callDate = new Date(call.started_at)
        const now = new Date()
        const diffHours = (now.getTime() - callDate.getTime()) / (1000 * 60 * 60)
        if (dateFilter === "today" && diffHours > 24) return false
        if (dateFilter === "7days" && diffHours > 24 * 7) return false
        if (dateFilter === "30days" && diffHours > 24 * 30) return false
      }

      return true
    })
  }, [calls, searchQuery, outcomeFilter, dateFilter, languageFilter])

  // Format duration helper
  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "—"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  }

  // Format date helper
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  // Mask phone
  const maskPhone = (phone?: string) => {
    if (!phone) return "—"
    const clean = phone.replace(/[^\d+]/g, "")
    if (clean.length < 8) return clean
    return clean.slice(0, clean.length - 8) + "••••••" + clean.slice(-2)
  }

  // Outcome badge helper
  const renderOutcomeBadge = (call: AllVoiceCallItem) => {
    const s = (call.status || "").toLowerCase()
    const needsFollowup =
      call.conversation_payload?.follow_up_required ||
      call.conversation_payload?.summary?.toLowerCase().includes("follow")

    if (needsFollowup) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          Follow-up needed
        </span>
      )
    }

    if (s === "completed" || s === "answered") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Answered
        </span>
      )
    }

    if (s === "no_answer" || s === "no-answer") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
          <PhoneMissed className="w-3 h-3 text-rose-500" />
          No answer
        </span>
      )
    }

    if (s === "busy") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
          <Clock className="w-3 h-3 text-zinc-500" />
          Line busy
        </span>
      )
    }

    if (s === "in_progress" || s === "in-progress" || s === "dialing") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <PhoneCall className="w-3 h-3 text-blue-500 animate-pulse" />
          Calling now
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
        <HelpCircle className="w-3 h-3 text-zinc-400" />
        {s || "Queued"}
      </span>
    )
  }

  // Language pill helper
  const renderLanguagePill = (langCode?: string) => {
    const code = (langCode || "te").toLowerCase()
    if (code.includes("te")) {
      return <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">Telugu</span>
    }
    if (code.includes("hi")) {
      return <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">Hindi</span>
    }
    return <span className="text-xs font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/50">English</span>
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredCalls.length) return
    const headers = ["Date & Time", "Parent Name", "Phone", "Student Name", "Campaign", "Language", "Duration", "Outcome"]
    const rows = filteredCalls.map((c) => [
      c.started_at ? new Date(c.started_at).toISOString() : "",
      `"${(c.guardian_name || "Parent").replace(/"/g, '""')}"`,
      `"${c.phone || ""}"`,
      `"${(c.student_name || "").replace(/"/g, '""')}"`,
      `"${(c.campaign_name || "Individual Call").replace(/"/g, '""')}"`,
      c.language || "Telugu",
      c.duration_seconds || 0,
      c.status || "Unknown",
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `voice_calls_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search parent, student, phone, or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-zinc-800 placeholder-zinc-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All outcomes</option>
            <option value="answered">Answered</option>
            <option value="no-answer">No answer</option>
            <option value="busy">Line busy</option>
            <option value="followup">Needs follow-up</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
          </select>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All languages</option>
            <option value="te">Telugu</option>
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredCalls.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Flat Call History Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-xs font-semibold text-zinc-500 tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Parent</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      Loading call history...
                    </div>
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <p className="font-medium text-zinc-700">No calls found</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {searchQuery || outcomeFilter !== "all"
                        ? "Try clearing filters to see more results."
                        : "When campaigns or test calls run, completed calls will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-zinc-50/60 transition-colors group">
                    <td className="py-3 px-4 text-zinc-600 text-xs whitespace-nowrap">
                      {formatDateTime(call.started_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800">{call.guardian_name || "Parent"}</div>
                      <div className="text-xs text-zinc-400 font-mono">{maskPhone(call.phone)}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-700 text-xs">
                      {call.student_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-600 max-w-[180px] truncate" title={call.campaign_name}>
                      {call.campaign_name || "Single Direct Call"}
                    </td>
                    <td className="py-3 px-4">
                      {renderLanguagePill(call.language || call.conversation_payload?.language)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-zinc-600">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="py-3 px-4">
                      {renderOutcomeBadge(call)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenTranscript(call)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 rounded-md border border-emerald-200/50 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Transcript
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {!isLoading && filteredCalls.length > 0 && (
          <div className="py-3 px-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Showing <strong className="text-zinc-700">{filteredCalls.length}</strong> of{" "}
              <strong className="text-zinc-700">{calls.length}</strong> total calls
            </span>
            <span className="text-zinc-400">
              Updated automatically after every completed call
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
