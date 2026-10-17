"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { useVoiceCampaigns } from "@/lib/api/hooks"
import { CampaignDetail } from "../../_components/CampaignDetail"
import { ArrowLeft } from "lucide-react"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: campaigns = [], isLoading } = useVoiceCampaigns()
  const campaign = campaigns.find((c) => c.id === id)

  return (
    <AppShell
      pageTitle="Campaign Details"
      breadcrumbs={[
        { label: "Virtual Office", href: "/voice-agent" },
        { label: "Campaigns", href: "/voice-agent/campaigns" },
        { label: campaign?.title || "Details" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-20 text-center text-zinc-400">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading campaign details...
          </div>
        ) : campaign ? (
          <CampaignDetail
            campaign={campaign}
            onBack={() => router.push("/voice-agent/campaigns")}
          />
        ) : (
          <div className="bg-white p-8 rounded-xl border border-zinc-200 text-center max-w-md mx-auto my-12">
            <p className="text-zinc-800 font-semibold mb-1">Campaign not found</p>
            <p className="text-xs text-zinc-500 mb-4">
              The campaign you are looking for does not exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/voice-agent/campaigns")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to campaigns
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
