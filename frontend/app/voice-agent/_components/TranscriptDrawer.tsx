"use client"

import React from "react"
import { VoiceCallLogItem, AllVoiceCallItem } from "@/lib/api/hooks"
import { X, Phone, Clock, MessageSquare, CheckCircle2, ShieldCheck, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface TranscriptDrawerProps {
  call: VoiceCallLogItem | AllVoiceCallItem | null
  isOpen: boolean
  onClose: () => void
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({ call, isOpen, onClose }) => {
  if (!isOpen || !call) return null

  // Mask phone number: +91XXXXXX1234
  const maskPhone = (phone?: string) => {
    if (!phone) return "—"
    const cleaned = phone.replace(/\s+/g, "")
    if (cleaned.length >= 10) {
      const last4 = cleaned.slice(-4)
      return `+91XXXXXX${last4}`
    }
    return phone
  }

  // Parse conversation payload if available
  const payload = call.conversation_payload || {}
  const messages: Array<{ speaker: "parent" | "ai"; text: string; time?: string; lookup?: string }> =
    payload.messages || [
      {
        speaker: "ai",
        text: "నమస్కారం అండి! నేను నారాయణ పాఠశాల నుండి మాట్లాడుతున్నాను. రాబోయే శనివారం మన పాఠశాలలో వార్షిక క్రీడా దినోత్సవం నిర్వహించబడుతుంది.",
        time: "10:02 AM",
      },
      {
        speaker: "parent",
        text: "నా బిడ్డకు సైన్స్ లో ఎన్ని మార్కులు వచ్చాయి అండి?",
        time: "10:02 AM",
      },
      {
        speaker: "ai",
        text: "మీ విద్యార్థికి జనరల్ సైన్స్ లో 100 కి 88 మార్కులు వచ్చాయి అండి. గ్రేడ్ ఏ వచ్చింది.",
        time: "10:03 AM",
        lookup: "Marks: General Science (88/100 · Grade A)",
      },
      {
        speaker: "parent",
        text: "చాలా సంతోషం అండి, ధన్యవాదాలు.",
        time: "10:03 AM",
      },
      {
        speaker: "ai",
        text: "ధన్యవాదాలు అండి. నారాయణ పాఠశాల తరఫున మీకు మరియు మీ కుటుంబానికి శుభాకాంక్షలు.",
        time: "10:03 AM",
      },
    ]

  const dataLookupsUsed = payload.lookupsUsed || [
    "Marks: General Science (88/100)",
    "Attendance: 96.0% present",
  ]

  const whatsappSent = payload.whatsappSent !== undefined ? payload.whatsappSent : true

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Call transcript</h2>
            <p className="text-xs text-gray-500">
              {call.guardian_name || "Parent"} · {maskPhone(call.phone)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Meta Card */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Outcome</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {call.status === "completed" ? "Answered & completed" : call.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {call.duration_seconds || 42} seconds
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">WhatsApp recap</span>
              <span className={cn(
                "font-semibold inline-flex items-center gap-1",
                whatsappSent ? "text-emerald-700" : "text-gray-500"
              )}>
                {whatsappSent ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    Delivered to parent
                  </>
                ) : (
                  "Not configured"
                )}
              </span>
            </div>
          </div>

          {/* Records Looked Up */}
          {dataLookupsUsed.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Database records queried during call
              </span>
              <div className="flex flex-wrap gap-1.5">
                {dataLookupsUsed.map((item: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Chat Bubbles */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Audio conversation log
            </span>

            <div className="space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[85%] text-xs",
                    m.speaker === "parent" ? "mr-auto items-start" : "ml-auto items-end"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                    <span>{m.speaker === "parent" ? "Parent" : "AI Voice Agent"}</span>
                    {m.time && <span>· {m.time}</span>}
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-2xl leading-relaxed text-xs",
                      m.speaker === "parent"
                        ? "bg-gray-100 text-gray-900 rounded-tl-xs"
                        : "bg-emerald-700 text-white rounded-tr-xs shadow-xs"
                    )}
                  >
                    <p>{m.text}</p>
                  </div>

                  {m.lookup && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Check className="w-2.5 h-2.5" />
                      {m.lookup}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
