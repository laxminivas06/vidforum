"use client"

import React, { useState, useMemo } from "react"
import {
  VoiceCampaignItem,
  useLaunchVoiceCampaign,
  usePauseVoiceCampaign,
  useResumeVoiceCampaign,
  useCancelVoiceCampaign,
} from "@/lib/api/hooks"
import { Search, MoreVertical, Play, Pause, Eye, Volume2, Copy, XCircle, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignTableProps {
  campaigns: VoiceCampaignItem[]
  onSelectCampaign: (id: string) => void
  onNewCampaign: () => void
  onPreviewVoice: (campaign: VoiceCampaignItem) => void
}

export const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onSelectCampaign,
  onNewCampaign,
  onPreviewVoice,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "running" | "scheduled" | "completed" | "paused">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const launchMutation = useLaunchVoiceCampaign()
  const pauseMutation = usePauseVoiceCampaign()
  const resumeMutation = useResumeVoiceCampaign()
  const cancelMutation = useCancelVoiceCampaign()

  // Format language display in plain words
  const formatLanguage = (lang?: string) => {
    if (!lang || lang === "all" || lang === "parent_choice") return "Each parent's choice"
    if (lang === "te-IN" || lang.toLowerCase() === "telugu") return "Telugu"
    if (lang === "hi-IN" || lang.toLowerCase() === "hindi") return "Hindi"
    if (lang === "en-IN" || lang.toLowerCase() === "english") return "English"
    return lang
  }

  // Format message type
  const formatTrigger = (trigger?: string) => {
    switch (trigger?.toUpperCase()) {
      case "EVENT_NOTICE":
      case "EVENT":
        return { label: "Event", bg: "bg-blue-50 text-blue-700 border-blue-200" }
      case "FEE_REMINDER":
      case "FEE":
        return { label: "Fee reminder", bg: "bg-amber-50 text-amber-700 border-amber-200" }
      case "ATTENDANCE_ALERT":
      case "ATTENDANCE":
        return { label: "Absence alert", bg: "bg-rose-50 text-rose-700 border-rose-200" }
      case "EXAM_ANNOUNCEMENT":
      case "EXAM":
        return { label: "Exam results", bg: "bg-purple-50 text-purple-700 border-purple-200" }
      default:
        return { label: "Notice", bg: "bg-gray-50 text-gray-700 border-gray-200" }
    }
  }

  // Filtered and sorted campaigns: running first, then scheduled, then newest
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        const matchesSearch =
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.targetAudience && c.targetAudience.toLowerCase().includes(searchQuery.toLowerCase()))

        if (!matchesSearch) return false

        const st = (c.status || "").toUpperCase()
        if (activeTab === "running") return st === "ACTIVE_DISPATCH" || st === "RUNNING"
        if (activeTab === "scheduled") return st === "SCHEDULED"
        if (activeTab === "completed") return st === "COMPLETED"
        if (activeTab === "paused") return st === "PAUSED"
        return true
      })
      .sort((a, b) => {
        const aStatus = (a.status || "").toUpperCase()
        const bStatus = (b.status || "").toUpperCase()
        const rank = (s: string) => {
          if (s === "ACTIVE_DISPATCH" || s === "RUNNING") return 0
          if (s === "SCHEDULED") return 1
          if (s === "PAUSED") return 2
          return 3
        }
        if (rank(aStatus) !== rank(bStatus)) {
          return rank(aStatus) - rank(bStatus)
        }
        return (b.id || "").localeCompare(a.id || "")
      })
  }, [campaigns, activeTab, searchQuery])

  // Status badge with dot + text
  const renderStatusBadge = (status?: string, scheduledAt?: string) => {
    const st = (status || "").toUpperCase()
    if (st === "ACTIVE_DISPATCH" || st === "RUNNING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Running
        </span>
      )
    }
    if (st === "PAUSED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Paused
        </span>
      )
    }
    if (st === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Completed
        </span>
      )
    }
    if (st === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Failed to start
        </span>
      )
    }
    // Scheduled
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {scheduledAt ? `Scheduled (${new Date(scheduledAt).toLocaleDateString()})` : "Scheduled"}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Top Filter Bar */}
      <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "running", label: "Running" },
            { id: "scheduled", label: "Scheduled" },
            { id: "completed", label: "Completed" },
            { id: "paused", label: "Paused" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-gray-50/50"
          />
        </div>
      </div>

      {/* Table Content or Empty State */}
      {filteredCampaigns.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <p className="text-sm font-medium text-gray-900">No campaigns found</p>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            {campaigns.length === 0
              ? "Create your first campaign to call parents of a grade or section in sequence."
              : "No campaigns match your current tab or search query."}
          </p>
          {campaigns.length === 0 && (
            <button
              onClick={onNewCampaign}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              New campaign
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-semibold text-gray-500 tracking-wider">
                <th className="py-3 px-5">Campaign</th>
                <th className="py-3 px-4">Message type</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4 w-52">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredCampaigns.map((c) => {
                const triggerInfo = formatTrigger(c.trigger)
                const isRunning = c.status === "ACTIVE_DISPATCH" || c.status === "RUNNING"
                const isPaused = c.status === "PAUSED"
                const target = c.targetCount || 0
                const completed = c.completedCalls || 0
                const progressPct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCampaign(c.id)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                  >
                    {/* 1. Campaign Name + Audience */}
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {c.targetAudience || "All enrolled parents"} · {target} parents
                      </p>
                    </td>

                    {/* 2. Message Type */}
                    <td className="py-3.5 px-4">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border", triggerInfo.bg)}>
                        {triggerInfo.label}
                      </span>
                    </td>

                    {/* 3. Language */}
                    <td className="py-3.5 px-4 text-gray-700 font-medium">
                      {formatLanguage(c.language)}
                    </td>

                    {/* 4. Progress Segmented Bar */}
                    <td className="py-3.5 px-4">
                      <div className="w-full">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1 tabular-nums">
                          <span>{completed} of {target} called</span>
                          <span className="font-semibold">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${progressPct}%` }}
                            className={cn(
                              "h-full transition-all duration-300",
                              isRunning ? "bg-emerald-500" : isPaused ? "bg-amber-400" : "bg-gray-400"
                            )}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 5. Status Badge */}
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(c.status, c.scheduled_at)}
                    </td>

                    {/* 6. Contextual Action + Menu */}
                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {isRunning ? (
                          <button
                            onClick={() => pauseMutation.mutate(c.id)}
                            disabled={pauseMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-2xs transition-colors"
                          >
                            <Pause className="w-3 h-3 text-amber-600" />
                            <span>Pause</span>
                          </button>
                        ) : isPaused ? (
                          <button
                            onClick={() => resumeMutation.mutate(c.id)}
                            disabled={resumeMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 shadow-2xs transition-colors"
                          >
                            <Play className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                            <span>Resume</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectCampaign(c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-2xs transition-colors"
                          >
                            <Eye className="w-3 h-3 text-gray-500" />
                            <span>View</span>
                          </button>
                        )}

                        {/* Dropdown Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {menuOpenId === c.id && (
                            <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white border border-gray-200 shadow-lg py-1 z-30 animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => {
                                  setMenuOpenId(null)
                                  onPreviewVoice(c)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 text-left"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                                <span>Preview voice</span>
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpenId(null)
                                  onSelectCampaign(c.id)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 text-left"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-400" />
                                <span>View call queue</span>
                              </button>
                              {c.status !== "COMPLETED" && (
                                <button
                                  onClick={() => {
                                    setMenuOpenId(null)
                                    cancelMutation.mutate(c.id)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 text-left"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                  <span>Cancel campaign</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
