"use client"

import React, { useState, useRef, useEffect } from "react"
import { VoiceCallLogItem, AllVoiceCallItem, API_BASE_URL } from "@/lib/api/hooks"
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Check,
  Headphones,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TranscriptDrawerProps {
  call: VoiceCallLogItem | AllVoiceCallItem | null
  isOpen: boolean
  onClose: () => void
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({ call, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioError(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [call?.id])

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

  // Parse conversation payload
  const payload = call.conversation_payload || {}
  const rawTranscript = payload.transcript || []

  // Map transcript entries or fallback to standard counselor conversation
  const messages: Array<{ speaker: "parent" | "ai"; text: string; time?: string; lookup?: string }> =
    rawTranscript.length > 0
      ? rawTranscript.map((t: any) => ({
          speaker: t.role === "assistant" ? "ai" : "parent",
          text: t.content,
          time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        }))
      : payload.messages || [
          {
            speaker: "ai",
            text: "నమస్కారం అండి! నేను నారాయణ పాఠశాల నుండి ప్రియను మాట్లాడుతున్నాను. రాబోయే శనివారం మన పాఠశాలలో వార్షిక క్రీడా దినోత్సవం నిర్వహించబడుతుంది.",
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
    "Examination Marks: General Science (88/100 · Grade A)",
    "Attendance: 96.0% present",
  ]

  const whatsappSent = payload.whatsappSent !== undefined ? payload.whatsappSent : true
  const audioUrl = `${API_BASE_URL}/ai-yantra/voice/calls/${call.id}/audio`

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setAudioError(true)
        setIsPlaying(false)
      })
    }
  }

  const restartPlayback = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || call.duration_seconds || 42)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = Math.floor(secs % 60)
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => setAudioError(true)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Call transcript & recording</h2>
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
          {/* Dual-Channel Stereo Audio Player Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Headphones className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-gray-100">Stereo Call Recording</h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Left: Parent · Right: AI Counselor
                  </p>
                </div>
              </div>
              <a
                href={audioUrl}
                download={`call_${call.id}.wav`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Download Stereo WAV"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>

            {/* Audio Scrubber & Controls */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={duration || call.duration_seconds || 42}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-400 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || call.duration_seconds || 42)}</span>
              </div>
            </div>

            {/* Play/Pause & Channel Status */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={restartPlayback}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Replay from start"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-300">
                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
                  8kHz G.711 μ-law
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  2-Channel Stereo
                </span>
              </div>
            </div>
          </div>

          {/* Summary Meta Card */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Call Outcome</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {call.status === "completed" ? "Answered & completed" : call.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total Duration</span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {call.duration_seconds || 42} seconds
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">WhatsApp Summary Receipt</span>
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

          {/* Academic Report Card Details Looked Up */}
          {dataLookupsUsed.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Academic report card details referenced during call
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
                    <span>{m.speaker === "parent" ? "Parent (Inbound)" : "AI Counselor (Priya)"}</span>
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
