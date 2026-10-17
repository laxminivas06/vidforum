"use client"

import React, { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { Plus, PhoneCall, Headphones, Layers, History, Activity } from "lucide-react"
import { useVoiceCampaigns, VoiceCampaignItem, VoiceCallLogItem, AllVoiceCallItem } from "@/lib/api/hooks"

import { HealthStrip } from "../_components/HealthStrip"
import { StatCards } from "../_components/StatCards"
import { CampaignTable } from "../_components/CampaignTable"
import { CampaignStepper } from "../_components/CampaignStepper"
import { CampaignDetail } from "../_components/CampaignDetail"
import { HistoryTable } from "../_components/HistoryTable"
import { SetupHealth } from "../_components/SetupHealth"
import { TestCallDrawer } from "../_components/TestCallDrawer"
import { VoicePreview } from "../_components/VoicePreview"
import { TranscriptDrawer } from "../_components/TranscriptDrawer"

function VoiceAgentAdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "campaigns"

  const { data: campaigns = [], isLoading } = useVoiceCampaigns()

  // Navigation & Sub-views
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Drawers
  const [isTestCallOpen, setIsTestCallOpen] = useState(false)
  const [isVoicePreviewOpen, setIsVoicePreviewOpen] = useState(false)
  const [voicePreviewInitial, setVoicePreviewInitial] = useState<{ lang: string; text?: string }>({
    lang: "te-IN",
  })
  const [selectedTranscriptCall, setSelectedTranscriptCall] = useState<
    VoiceCallLogItem | AllVoiceCallItem | null
  >(null)

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId)

  const setTab = (tab: "campaigns" | "history" | "health") => {
    // Reset inner states when switching tabs
    setSelectedCampaignId(null)
    setIsCreating(false)
    router.push(`/voice-agent/campaigns?tab=${tab}`)
  }

  const handleOpenVoicePreview = (lang: string = "te-IN", text?: string) => {
    setVoicePreviewInitial({ lang, text })
    setIsVoicePreviewOpen(true)
  }

  return (
    <AppShell
      pageTitle="Voice Agent"
      breadcrumbs={[{ label: "Virtual Office", href: "/voice-agent" }, { label: "Voice Agent" }]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Health status notification bar at top */}
        <HealthStrip onFixClick={() => setTab("health")} />

        {/* Header - Calm, Scannable, School Administrator Focused */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1">
              <span>Virtual Office</span>
              <span>/</span>
              <span className="text-zinc-800">Voice Agent</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Voice Agent</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Call parents across grades in their preferred language with automated updates and follow-ups.
            </p>
          </div>

          {/* Action Button Hierarchy: Exactly ONE Primary Green Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenVoicePreview("te-IN")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-zinc-500" />
              Preview voice
            </button>

            <button
              onClick={() => setIsTestCallOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5 text-zinc-500" />
              Test call
            </button>

            <button
              onClick={() => {
                setSelectedCampaignId(null)
                setIsCreating(true)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New campaign
            </button>
          </div>
        </div>

        {/* If creating a new campaign, show full-page 4-step stepper */}
        {isCreating ? (
          <CampaignStepper
            onCancel={() => setIsCreating(false)}
            onSuccess={(campaignId) => {
              setIsCreating(false)
              setSelectedCampaignId(campaignId)
            }}
            onOpenTestCall={() => setIsTestCallOpen(true)}
            onOpenVoicePreview={(lang, text) => handleOpenVoicePreview(lang, text)}
          />
        ) : selectedCampaign ? (
          /* If viewing a single campaign detail */
          <CampaignDetail
            campaign={selectedCampaign}
            onBack={() => setSelectedCampaignId(null)}
          />
        ) : (
          /* Main Tabbed Interface */
          <div className="space-y-6">
            {/* 3 URL-based Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-zinc-200">
              <button
                onClick={() => setTab("campaigns")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === "campaigns"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
                }`}
              >
                <Layers className="w-4 h-4" />
                Campaigns
                <span className="px-1.5 py-0.5 rounded-full text-xs font-mono bg-zinc-100 text-zinc-600">
                  {campaigns.length}
                </span>
              </button>

              <button
                onClick={() => setTab("history")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === "history"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
                }`}
              >
                <History className="w-4 h-4" />
                Call History
              </button>

              <button
                onClick={() => setTab("health")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === "health"
                    ? "border-emerald-600 text-emerald-700 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
                }`}
              >
                <Activity className="w-4 h-4" />
                Setup & Health
              </button>
            </div>

            {/* Tab 1: Campaigns */}
            {currentTab === "campaigns" && (
              <div className="space-y-6">
                {/* 4 Calm Stat Cards derived from real data */}
                <StatCards campaigns={campaigns} />

                {/* Scannable Campaign Table */}
                <CampaignTable
                  campaigns={campaigns}
                  onSelectCampaign={(id) => setSelectedCampaignId(id)}
                  onNewCampaign={() => setIsCreating(true)}
                  onPreviewVoice={(c) => handleOpenVoicePreview(c.languageCode || "te-IN", c.scriptTemplate)}
                />
              </div>
            )}

            {/* Tab 2: Call History */}
            {currentTab === "history" && (
              <HistoryTable
                onOpenTranscript={(call) => setSelectedTranscriptCall(call)}
              />
            )}

            {/* Tab 3: Setup & Health */}
            {currentTab === "health" && <SetupHealth />}
          </div>
        )}

        {/* Global Slide-Over Drawers */}
        <TestCallDrawer
          isOpen={isTestCallOpen}
          onClose={() => setIsTestCallOpen(false)}
        />

        <VoicePreview
          isOpen={isVoicePreviewOpen}
          onClose={() => setIsVoicePreviewOpen(false)}
          initialLanguage={voicePreviewInitial.lang}
          initialText={voicePreviewInitial.text}
        />

        <TranscriptDrawer
          isOpen={!!selectedTranscriptCall}
          call={selectedTranscriptCall}
          onClose={() => setSelectedTranscriptCall(null)}
        />
      </div>
    </AppShell>
  )
}

export default function VoiceAgentCampaignsPage() {
  return (
    <Suspense
      fallback={
        <AppShell pageTitle="Voice Agent">
          <div className="max-w-7xl mx-auto px-4 py-12 text-center text-zinc-400">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading Voice Agent...
          </div>
        </AppShell>
      }
    >
      <VoiceAgentAdminContent />
    </Suspense>
  )
}
