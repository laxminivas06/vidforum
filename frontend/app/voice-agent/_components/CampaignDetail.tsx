"use client"

import React, { useState, useEffect } from "react"
import {
  VoiceCampaignItem,
  useCampaignProgress,
  useVoiceCampaignCalls,
  usePauseVoiceCampaign,
  useResumeVoiceCampaign,
  useCancelVoiceCampaign,
  VoiceCallLogItem,
} from "@/lib/api/hooks"
import { CallQueue } from "./CallQueue"
import { TranscriptDrawer } from "./TranscriptDrawer"
import { ArrowLeft, Pause, Play, XCircle, PhoneCall, Radio, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignDetailProps {
  campaign: VoiceCampaignItem
  onBack: () => void
}

export const CampaignDetail: React.FC<CampaignDetailProps> = ({ campaign, onBack }) => {
  const { data: progress } = useCampaignProgress(campaign.id)
  const { data: calls = [] } = useVoiceCampaignCalls(campaign.id)

  const pauseMutation = usePauseVoiceCampaign()
  const resumeMutation = useResumeVoiceCampaign()
  const cancelMutation = useCancelVoiceCampaign()

  const [selectedTranscriptCall, setSelectedTranscriptCall] = useState<VoiceCallLogItem | null>(null)
  const [liveCallSeconds, setLiveCallSeconds] = useState(14)

  // Live timer for currently active call
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCallSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const isRunning = campaign.status === "ACTIVE_DISPATCH" || campaign.status === "RUNNING"
  const isPaused = campaign.status === "PAUSED"

  // Counts from progress or fallback
  const totalRecipients = progress?.totalRecipients || campaign.targetCount || 40
  const completedCount = progress?.completedCount || campaign.completedCalls || 0
  const failedCount = progress?.failedCount || 0
  const remainingCount = Math.max(0, totalRecipients - completedCount - failedCount)

  // Mask phone number
  const maskPhone = (phone?: string) => {
    if (!phone) return "—"
    const cleaned = phone.replace(/\s+/g, "")
    if (cleaned.length >= 10) {
      return `+91XXXXXX${cleaned.slice(-4)}`
    }
    return phone
  }

  const currentRecipient = progress?.currentRecipient || (isRunning ? {
    guardianName: "K. Mahender Reddy",
    studentName: "Ananya Reddy (Grade 2)",
    phone: "+919440101000",
    status: "in_conversation",
  } : null)

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to campaigns</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">{campaign.title}</h1>
              {isRunning && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Running
                </span>
              )}
              {isPaused && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Paused
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Audience: {campaign.targetAudience || "All Parents"} · Language: {campaign.language || "Telugu"}
            </p>
          </div>

          {/* Controls: Pause / Resume / Cancel */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={() => pauseMutation.mutate(campaign.id)}
                disabled={pauseMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-xs transition-colors"
              >
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                <span>Pause calling</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={() => resumeMutation.mutate(campaign.id)}
                disabled={resumeMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume calling</span>
              </button>
            ) : null}

            {campaign.status !== "COMPLETED" && (
              <button
                onClick={() => cancelMutation.mutate(campaign.id)}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 shadow-xs transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: Now Calling Card & Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Now Calling Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Currently dialing
            </span>
            {currentRecipient && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active Call
              </span>
            )}
          </div>

          {currentRecipient ? (
            <div className="mt-3 space-y-1">
              <p className="text-base font-bold text-gray-900">{currentRecipient.guardianName}</p>
              <p className="text-xs text-gray-600">Student: {currentRecipient.studentName}</p>
              <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 tabular-nums">
                <span>Phone: {maskPhone(currentRecipient.phone)}</span>
                <span>·</span>
                <span className="font-semibold text-emerald-800">Duration: {liveCallSeconds}s</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-gray-500 py-3">
              {campaign.status === "COMPLETED"
                ? "All recipients have been called."
                : "No active call at this moment."}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Telephony line: Active</span>
            <span>Calling hours: 09:00 AM – 07:00 PM IST</span>
          </div>
        </div>

        {/* Progress Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Audience progress
              </span>
              <span className="text-xs font-semibold text-gray-900 tabular-nums">
                {completedCount} of {totalRecipients} called
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="mt-3 w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(completedCount / totalRecipients) * 100}%` }}
                className="h-full bg-emerald-500 transition-all duration-300"
                title={`Answered: ${completedCount}`}
              />
              <div
                style={{ width: `${(failedCount / totalRecipients) * 100}%` }}
                className="h-full bg-rose-400 transition-all duration-300"
                title={`Needs follow-up: ${failedCount}`}
              />
            </div>
          </div>

          {/* Counts Legend */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100 text-center">
            <div>
              <p className="text-sm font-semibold text-emerald-700 tabular-nums">{completedCount}</p>
              <p className="text-[11px] text-gray-500">Answered</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700 tabular-nums">0</p>
              <p className="text-[11px] text-gray-500">No answer</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600 tabular-nums">{failedCount}</p>
              <p className="text-[11px] text-gray-500">Failed</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 tabular-nums">{remainingCount}</p>
              <p className="text-[11px] text-gray-500">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Call Queue Table */}
      <CallQueue
        calls={calls}
        currentCallPhone={currentRecipient?.phone}
        onViewTranscript={(call) => setSelectedTranscriptCall(call)}
      />

      {/* Transcript Drawer */}
      <TranscriptDrawer
        call={selectedTranscriptCall}
        isOpen={!!selectedTranscriptCall}
        onClose={() => setSelectedTranscriptCall(null)}
      />
    </div>
  )
}
