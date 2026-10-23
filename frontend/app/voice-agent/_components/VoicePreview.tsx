"use client"

import React, { useState, useRef } from "react"
import { useSynthesizeVoicePreview, useVoiceChatPreview } from "@/lib/api/hooks"
import { X, Volume2, Play, Square, MessageSquare, Send, Bot, User, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoicePreviewProps {
  isOpen: boolean
  onClose: () => void
  initialLanguage?: string
  initialText?: string
}

const SAMPLE_SCRIPTS: Record<string, string> = {
  "te-IN": "నమస్కారం అండి! నేను Narayana School నుండి Priya ని మాట్లాడుతున్నాను. Next Saturday మన school లో Annual Sports Day ఉంది అండి. మీ పిల్లల marks, attendance లేదా fee details గురించి ఏమైనా తెలుసుకోవాలంటే నన్ను అడగవచ్చు.",
  "en-IN": "Good morning! This is Priya calling from Narayana High School. A gentle reminder that the Term Two tuition fee installment is due soon. You can ask me about your pending balance or payment options right now.",
  "hi-IN": "नमस्ते! मैं नारायणा स्कूल से प्रिया बोल रही हूँ। आगामी शनिवार को हमारे स्कूल में वार्षिक खेल दिवस का आयोजन किया जा रहा है। आप अपने बच्चे के अंक या उपस्थिति के बारे में मुझसे पूछ सकते हैं।",
}

const SUGGESTED_CHIPS: Record<string, string[]> = {
  "te-IN": [
    "Sai Teja కి Science లో ఎన్ని marks వచ్చాయి?",
    "Attendance percentage ఎంత ఉంది?",
    "Pending fee details చెప్పండి",
  ],
  "en-IN": [
    "What are my child's marks in Science?",
    "What is the attendance percentage?",
    "How much fee is pending?",
  ],
  "hi-IN": [
    "मेरे बच्चे के विज्ञान में कितने अंक आए हैं?",
    "उपस्थिति का प्रतिशत कितना है?",
    "फीस कितनी बकाया है?",
  ],
}

export const VoicePreview: React.FC<VoicePreviewProps> = ({
  isOpen,
  onClose,
  initialLanguage = "te-IN",
  initialText,
}) => {
  const [activeTab, setActiveTab] = useState<"listen" | "chat">("listen")
  const [language, setLanguage] = useState(initialLanguage)
  const [voiceSpeaker, setVoiceSpeaker] = useState("priya")
  const [scriptText, setScriptText] = useState(initialText || SAMPLE_SCRIPTS[initialLanguage] || SAMPLE_SCRIPTS["te-IN"])

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<any>(null)

  // Chat Simulation State
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ role: "parent" | "agent"; text: string; lookupTag?: string; audioBase64?: string }>>([
    {
      role: "agent",
      text: initialText || SAMPLE_SCRIPTS[initialLanguage] || SAMPLE_SCRIPTS["te-IN"],
    },
  ])

  const synthMutation = useSynthesizeVoicePreview()
  const chatMutation = useVoiceChatPreview()

  if (!isOpen) return null

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    setScriptText(SAMPLE_SCRIPTS[newLang] || "")
    setChatMessages([
      {
        role: "agent",
        text: SAMPLE_SCRIPTS[newLang] || "",
      },
    ])
  }

  const handlePlayAudio = async (textToPlay: string) => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
      clearInterval(progressIntervalRef.current)
      return
    }

    try {
      setIsPlaying(true)
      setPlaybackProgress(10)
      const res = await synthMutation.mutateAsync({
        text: textToPlay,
        language: language,
        speaker: voiceSpeaker,
      })

      if (res && res.audioBase64) {
        const audioSrc = `data:${res.audioMimeType || "audio/wav"};base64,${res.audioBase64}`
        const audio = new Audio(audioSrc)
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
          setPlaybackProgress(0)
          clearInterval(progressIntervalRef.current)
        }

        audio.play()

        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current && audioRef.current.duration) {
            const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
            setPlaybackProgress(pct)
          }
        }, 150)
      } else {
        setIsPlaying(false)
        setPlaybackProgress(0)
      }
    } catch (err) {
      console.error("Audio synthesis error:", err)
      setIsPlaying(false)
      setPlaybackProgress(0)
    }
  }

  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim()) return

    const userMsg = msgText.trim()
    setChatInput("")

    const updated = [...chatMessages, { role: "parent" as const, text: userMsg }]
    setChatMessages(updated)

    try {
      const history = updated.map((m) => ({
        role: m.role === "parent" ? "user" : "assistant",
        content: m.text,
      }))

      const res = await chatMutation.mutateAsync({
        message: userMsg,
        history,
        studentAdmissionNumber: "SIA-2026-0101",
        synthesizeAudio: true,
        language: language,
      })

      if (res) {
        let tag: string | undefined = undefined
        if (res.toolUsed === "get_student_marks") tag = "Looked up student marks"
        else if (res.toolUsed === "get_student_attendance") tag = "Looked up attendance record"
        else if (res.toolUsed === "get_fee_status") tag = "Looked up fee status"

        setChatMessages((prev) => [
          ...prev,
          {
            role: "agent",
            text: res.reply,
            lookupTag: tag,
            audioBase64: res.audioBase64,
          },
        ])
      }
    } catch (err) {
      console.error("Chat error:", err)
      setChatMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: language === "te-IN"
            ? "క్షమించండి, సమాధానం పొందడంలో సమస్య ఎదురైంది."
            : "I apologize, could you please repeat that?",
        },
      ])
    }
  }

  const chips = SUGGESTED_CHIPS[language] || SUGGESTED_CHIPS["te-IN"]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Preview voice</h2>
            <p className="text-xs text-gray-500">Listen to speech synthesis or practice asking parent questions</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-gray-200 flex items-center gap-4 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("listen")}
            className={cn(
              "text-xs font-semibold pb-2 border-b-2 transition-colors",
              activeTab === "listen"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            Listen
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "text-xs font-semibold pb-2 border-b-2 transition-colors",
              activeTab === "chat"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            Talk to the agent
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "te-IN", label: "Telugu" },
                { id: "en-IN", label: "English" },
                { id: "hi-IN", label: "Hindi" },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleLanguageChange(l.id)}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-colors",
                    language === l.id
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "listen" ? (
            /* LISTEN TAB */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Spoken opening line
                </label>
                <textarea
                  rows={4}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs text-gray-900 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed font-sans"
                />
              </div>

              {/* Audio Player Card */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-gray-700">Audio playback</span>
                  </div>
                  <span className="text-[11px] text-gray-500">Priya · Female voice</span>
                </div>

                {/* Waveform / Progress bar */}
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${playbackProgress}%` }}
                    className="h-full bg-emerald-600 transition-all duration-150"
                  />
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => handlePlayAudio(scriptText)}
                    disabled={synthMutation.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors"
                  >
                    {synthMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing voice...</span>
                      </>
                    ) : isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play audio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TALK TO THE AGENT (CHAT TAB) */
            <div className="flex flex-col h-[480px]">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50/70 rounded-xl border border-gray-200">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col max-w-[85%] text-xs",
                      m.role === "parent" ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl leading-relaxed",
                        m.role === "parent"
                          ? "bg-gray-900 text-white rounded-br-xs"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-xs shadow-2xs"
                      )}
                    >
                      <p>{m.text}</p>
                    </div>

                    {/* Lookup tag if record was retrieved */}
                    {m.lookupTag && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-2.5 h-2.5" />
                        {m.lookupTag}
                      </span>
                    )}
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="mr-auto flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl text-xs text-gray-500 shadow-2xs">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>Agent is checking student records...</span>
                  </div>
                )}
              </div>

              {/* Suggested Questions Chips */}
              <div className="pt-3 pb-2 space-y-1">
                <p className="text-[11px] font-semibold text-gray-500">Ask a question as a parent:</p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChatMessage(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-gray-700 transition-colors text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a parent message or question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage(chatInput)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <button
                  onClick={() => handleSendChatMessage(chatInput)}
                  disabled={!chatInput.trim() || chatMutation.isPending}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
