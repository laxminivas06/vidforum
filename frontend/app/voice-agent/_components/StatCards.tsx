"use client"

import React from "react"
import { VoiceCampaignItem, AllVoiceCallItem, useVoiceAllCalls } from "@/lib/api/hooks"

interface StatCardsProps {
  campaigns?: VoiceCampaignItem[]
  allCalls?: AllVoiceCallItem[]
  onFilterFollowUp?: () => void
}

export const StatCards: React.FC<StatCardsProps> = ({
  campaigns = [],
  allCalls,
  onFilterFollowUp,
}) => {
  const { data: fetchedCalls = [] } = useVoiceAllCalls()
  const calls = allCalls || fetchedCalls

  // Compute from real call data
  const totalCallsPlaced = calls.length
  const answeredCalls = calls.filter(
    (c) => c.status === "completed" || c.status === "answered"
  ).length
  const answerRatePct =
    totalCallsPlaced > 0 ? Math.round((answeredCalls / totalCallsPlaced) * 100) : null

  const runningCampaignsCount = campaigns.filter(
    (c) => c.status === "ACTIVE_DISPATCH" || c.status === "RUNNING"
  ).length

  const followUpCount = calls.filter((c) =>
    ["no_answer", "failed", "busy", "rejected", "interrupted"].includes(c.status)
  ).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Calls today */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <p className="text-xs font-medium text-gray-500">Calls today</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
          {totalCallsPlaced > 0 ? totalCallsPlaced : "—"}
        </p>
        <p className="mt-1.5 text-xs text-gray-500">
          {totalCallsPlaced > 0
            ? "Across all active campaigns"
            : "No outbound calls logged today"}
        </p>
      </div>

      {/* 2. Answered */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <p className="text-xs font-medium text-gray-500">Answered</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
          {answerRatePct !== null ? `${answerRatePct}%` : "—"}
        </p>
        <p className="mt-1.5 text-xs text-gray-500 tabular-nums">
          {totalCallsPlaced > 0
            ? `${answeredCalls} of ${totalCallsPlaced} calls connected`
            : "Awaiting call responses"}
        </p>
      </div>

      {/* 3. Campaigns running */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <p className="text-xs font-medium text-gray-500">Campaigns running</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
          {runningCampaignsCount}
        </p>
        <p className="mt-1.5 text-xs text-gray-500">
          {runningCampaignsCount > 0
            ? "Sequentially dialing parents"
            : "No campaigns currently in progress"}
        </p>
      </div>

      {/* 4. Need follow-up */}
      <div
        onClick={followUpCount > 0 ? onFilterFollowUp : undefined}
        className={`bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs transition-all ${
          followUpCount > 0
            ? "cursor-pointer hover:border-amber-300 hover:bg-amber-50/20"
            : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Need follow-up</p>
          {followUpCount > 0 && (
            <span className="text-[11px] font-medium text-amber-700 underline underline-offset-2">
              View list
            </span>
          )}
        </div>
        <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
          {followUpCount > 0 ? followUpCount : "0"}
        </p>
        <p className="mt-1.5 text-xs text-gray-500">
          {followUpCount > 0
            ? "No answer, busy, or failed calls"
            : "All completed calls connected"}
        </p>
      </div>
    </div>
  )
}
