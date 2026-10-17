"use client"

import React, { useState } from "react"
import {
  Phone,
  Mic,
  Bot,
  MessageSquare,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Info,
} from "lucide-react"
import { useVoiceHealth, VoiceHealthCapability } from "@/lib/api/hooks"

export function SetupHealth() {
  const { data: health, isLoading, refetch } = useVoiceHealth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  // Calculate if calling window is open (08:00 AM to 08:00 PM IST)
  const now = new Date()
  // Format current IST time
  const istTimeString = now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  
  // Calculate hour in IST
  const istHour = parseInt(
    now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }),
    10
  )
  const isCallingWindowOpen = istHour >= 8 && istHour < 20

  const renderStatusBadge = (status?: string) => {
    if (status === "ready") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Ready
        </span>
      )
    }
    if (status === "needs_attention") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Needs attention
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/60">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        Not configured
      </span>
    )
  }

  const renderCapabilityCard = (
    title: string,
    icon: React.ReactNode,
    capability?: VoiceHealthCapability,
    defaultDetails?: { provider: string; notes: string }
  ) => {
    const isReady = capability?.status === "ready"
    const isAttention = capability?.status === "needs_attention"

    return (
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">{title}</h3>
                <p className="text-xs text-zinc-500 font-mono">
                  {capability?.provider || defaultDetails?.provider || "Service"}
                </p>
              </div>
            </div>
            {renderStatusBadge(capability?.status)}
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed mb-4">
            {capability?.message || defaultDetails?.notes}
          </p>

          {/* Action required steps if not ready */}
          {!isReady && capability?.actionRequired && capability.actionRequired.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200/50">
              <p className="text-xs font-medium text-amber-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Setup steps:
              </p>
              <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
                {capability.actionRequired.map((step, idx) => (
                  <li key={idx} className="leading-snug">{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
          <span>Checked in real time</span>
          <span className="font-medium text-zinc-600">
            {isReady ? "100% operational" : isAttention ? "Action recommended" : "Offline"}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">System Setup & Health</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time status of school calling lines, speech synthesis, and WhatsApp dispatch.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Check connections"}
        </button>
      </div>

      {/* Capability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderCapabilityCard(
          "Phone Calling Line",
          <Phone className="w-4 h-4 text-emerald-600" />,
          health?.phoneLine,
          {
            provider: "Twilio Telephony",
            notes: "Outbound carrier lines dispatching calls to parents across India.",
          }
        )}

        {renderCapabilityCard(
          "Voice Synthesis",
          <Mic className="w-4 h-4 text-purple-600" />,
          health?.voice,
          {
            provider: "Sarvam AI (Bulbul v2)",
            notes: "Generates natural Telugu, Hindi, and Indian English parent audio.",
          }
        )}

        {renderCapabilityCard(
          "AI Conversational Agent",
          <Bot className="w-4 h-4 text-blue-600" />,
          health?.aiAssistant,
          {
            provider: "Groq LPU (Llama 3.3 70B)",
            notes: "Answers parent questions dynamically using student database records.",
          }
        )}

        {renderCapabilityCard(
          "WhatsApp Delivery",
          <MessageSquare className="w-4 h-4 text-teal-600" />,
          health?.whatsapp,
          {
            provider: "Meta WhatsApp Cloud API",
            notes: "Sends call summaries and fee payment links after every conversation.",
          }
        )}
      </div>

      {/* Regulations & Calling Hours Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calling hours card */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-zinc-900 text-sm">School Calling Window</h3>
          </div>
          <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
            In compliance with Indian telecom regulations (TRAI) and respectful parent communication standards, automated calls may only be launched between <strong>08:00 AM and 08:00 PM IST</strong>.
          </p>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/60 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500">Current IST Time</div>
              <div className="text-sm font-semibold text-zinc-800 font-mono mt-0.5">{istTimeString}</div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isCallingWindowOpen
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                    : "bg-amber-50 text-amber-800 border border-amber-200/60"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCallingWindowOpen ? "bg-emerald-500" : "bg-amber-500"}`} />
                {isCallingWindowOpen ? "Calling window open" : "Calling window closed"}
              </span>
            </div>
          </div>
        </div>

        {/* Transparent Cost & Billing card */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-zinc-900 text-sm">Transparent Cost Breakdown</h3>
          </div>
          <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
            Calls are billed strictly per second of connected conversation. No fixed recurring maintenance fees or inflated markup.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-600">Carrier Outbound Line (India mobile)</span>
              <span className="font-mono font-medium text-zinc-800">~₹0.60 / minute</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-600">AI Speech Synthesis (Indian Languages)</span>
              <span className="font-mono font-medium text-zinc-800">~₹0.15 / minute</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-100">
              <span className="text-zinc-600">Estimated Average per 1-minute Call</span>
              <span className="font-mono font-semibold text-emerald-700">~₹0.75 / parent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance notice */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Parent Consent & Transactional Exemption:</span>{" "}
          Educational notifications regarding school attendance, academic fee schedules, and emergency closures sent to registered parent contacts qualify as critical transactional communication under National Customer Preference Register (NCPR) guidelines.
        </div>
      </div>
    </div>
  )
}
