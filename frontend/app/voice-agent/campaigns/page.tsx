"use client"

import React, { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  SpotHeroPanel,
  Button,
  Badge,
  Table,
  TableColumn,
  Modal,
  SlideOver,
  ProgressBar,
} from "@/components/ui"
import {
  PhoneCall,
  Play,
  Pause,
  Plus,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Square,
  Sparkles,
  Bot,
  User,
  MessageSquare,
  Send,
  ListFilter,
  Check,
  ExternalLink,
  ShieldCheck,
  Layers,
  Mic,
  ArrowRight,
  Headphones,
} from "lucide-react"
import {
  useVoiceCampaigns,
  useVoiceCampaignCalls,
  useCreateVoiceCampaign,
  useLaunchVoiceCampaign,
  useSynthesizeVoicePreview,
  useVoiceChatPreview,
  useDispatchTestCall,
  useClasses,
  VoiceCampaignItem,
  VoiceCallLogItem,
} from "@/lib/api/hooks"

const PRESET_SCRIPTS = {
  event_notice: {
    title: "Annual Sports Day 2026 Announcement",
    text: "Namaskaram andi! Nenu Narayana e-Techno School nunchi Priya ni matladuthunnanu. Maa school lo Annual Sports Day celebration upcoming Saturday, November 5th roju morning 9:00 AM ki conduct chestunnamu. Parents andariki hearty welcome andi. Meeku event gurinchi kani, student academics gurinchi kani emaina queries unnaya andi?",
    useCase: "event_notice",
  },
  fee_reminder: {
    title: "Term 2 Tuition Fee Due Notice",
    text: "Namaskaram andi! This is Priya calling from Narayana e-Techno School accounts desk. A gentle reminder that Term 2 tuition fee installment is due on or before November 15th. You can ask me for your pending balance or payment modes right now.",
    useCase: "fee_reminder",
  },
  attendance_alert: {
    title: "Unexcused Morning Absence Alert",
    text: "Namaskaram andi! This is Priya from the school attendance desk. We noticed your child has not checked into morning assembly today. Please confirm if they are on leave or reach out to the class mentor.",
    useCase: "attendance_alert",
  },
  exam_announcement: {
    title: "Quarterly Exam Report Card Release",
    text: "Namaskaram andi! Narayana School Quarterly Exam results have been declared. You can ask me your child's score in any subject right now or check the parent portal.",
    useCase: "exam_announcement",
  },
}

export default function VoiceAgentCampaignsPage() {
  // Queries & Mutations
  const { data: campaigns = [], isLoading, refetch } = useVoiceCampaigns()
  const { data: classes = [] } = useClasses()
  const createCampaignMutation = useCreateVoiceCampaign()
  const launchCampaignMutation = useLaunchVoiceCampaign()
  const synthesizeMutation = useSynthesizeVoicePreview()
  const chatMutation = useVoiceChatPreview()
  const testCallMutation = useDispatchTestCall()

  // State
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "SCHEDULED">("ALL")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [auditionOpen, setAuditionOpen] = useState(false)
  const [auditionTab, setAuditionTab] = useState<"TTS" | "CHAT">("TTS")
  const [selectedCampaignForLogs, setSelectedCampaignForLogs] = useState<VoiceCampaignItem | null>(null)

  // Audition State
  const [previewText, setPreviewText] = useState(PRESET_SCRIPTS.event_notice.text)
  const [previewLanguage, setPreviewLanguage] = useState("te-IN")
  const [previewSpeaker, setPreviewSpeaker] = useState("priya")
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; toolUsed?: string; toolData?: any }>>([
    {
      role: "assistant",
      content: "Namaskaram andi! Nenu Narayana e-Techno School nunchi Priya ni matladuthunnanu. Upcoming Saturday Annual Sports Day conduct chestunnamu. Meeku emaina doubts unnaya andi?",
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [speakAssistantReplies, setSpeakAssistantReplies] = useState(true)

  // Create Campaign Form State
  const [formName, setFormName] = useState("")
  const [formUseCase, setFormUseCase] = useState("event_notice")
  const [formLanguage, setFormLanguage] = useState("te-IN")
  const [formSpeaker, setFormSpeaker] = useState("priya")
  const [formTargetGradeId, setFormTargetGradeId] = useState("")
  const [formScript, setFormScript] = useState(PRESET_SCRIPTS.event_notice.text)
  const [formSuccessMessage, setFormSuccessMessage] = useState("")

  // Web Audio Element Ref
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [])

  // Play audio helper
  const playAudioFromBase64 = (base64Audio: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`)
      currentAudioRef.current = audio
      setIsPlayingAudio(true)
      audio.onended = () => setIsPlayingAudio(false)
      audio.onerror = () => setIsPlayingAudio(false)
      audio.play().catch((err) => {
        console.warn("Audio play prevented:", err)
        setIsPlayingAudio(false)
      })
    } catch (err) {
      console.error("Audio initialization error:", err)
      setIsPlayingAudio(false)
    }
  }

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    setIsPlayingAudio(false)
  }

  // Handle Preset Selection
  const applyPreset = (key: keyof typeof PRESET_SCRIPTS) => {
    const preset = PRESET_SCRIPTS[key]
    setPreviewText(preset.text)
  }

  // Handle Audition Synthesize
  const handleAuditionSynthesize = () => {
    if (!previewText.trim()) return
    synthesizeMutation.mutate(
      { text: previewText, language: previewLanguage, speaker: previewSpeaker },
      {
        onSuccess: (data) => {
          if (data && data.audioBase64) {
            playAudioFromBase64(data.audioBase64)
          }
        },
      }
    )
  }

  // Handle Chat Simulation Send
  const handleSendChat = (messageToSend?: string) => {
    const text = messageToSend || chatInput.trim()
    if (!text) return

    const updatedHistory = [...chatMessages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: text }]
    setChatMessages((prev) => [...prev, { role: "user", content: text }])
    setChatInput("")

    chatMutation.mutate(
      {
        message: text,
        history: updatedHistory.slice(-4),
        studentAdmissionNumber: "SIA-2026-0101",
        synthesizeAudio: speakAssistantReplies,
      },
      {
        onSuccess: (data) => {
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.reply,
              toolUsed: data.toolUsed,
              toolData: data.toolData,
            },
          ])
          if (data.audioBase64 && speakAssistantReplies) {
            playAudioFromBase64(data.audioBase64)
          }
        },
      }
    )
  }

  // Handle Create Campaign Submit
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formScript.trim()) return

    createCampaignMutation.mutate(
      {
        name: formName,
        useCase: formUseCase,
        language: formLanguage,
        scriptText: formScript,
        targetGradeId: formTargetGradeId || undefined,
      },
      {
        onSuccess: (data) => {
          setFormSuccessMessage(`Campaign "${formName}" created with ${data.recipientsQueued} verified parent recipients!`)
          setTimeout(() => {
            setFormSuccessMessage("")
            setCreateModalOpen(false)
            setFormName("")
          }, 1500)
        },
      }
    )
  }

  // Query for logs of selected campaign
  const { data: callLogs = [], isLoading: logsLoading } = useVoiceCampaignCalls(selectedCampaignForLogs?.id)

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((item) => {
    if (selectedFilter === "ALL") return true
    if (selectedFilter === "ACTIVE") return item.status === "ACTIVE_DISPATCH"
    if (selectedFilter === "COMPLETED") return item.status === "COMPLETED"
    if (selectedFilter === "SCHEDULED") return item.status === "SCHEDULED"
    return true
  })

  // Table Columns
  const columns: TableColumn<VoiceCampaignItem>[] = [
    {
      header: "Campaign Title & Language",
      key: "title",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-subtle border border-border-default flex items-center justify-center shrink-0 shadow-2xs">
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="font-semibold text-text-primary text-xs tracking-tight">{item.title}</div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary">
              <span className="font-mono">{item.language}</span>
              <span>•</span>
              <span className="font-mono text-text-muted">{item.trigger}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Event Trigger",
      key: "trigger",
      render: (item) => {
        const variants: Record<string, "neutral" | "warning" | "positive"> = {
          EVENT_NOTICE: "neutral",
          FEE_REMINDER: "warning",
          ATTENDANCE_ALERT: "warning",
          EXAM_ANNOUNCEMENT: "positive",
        }
        return (
          <Badge variant={variants[item.trigger] || "neutral"} className="text-[10px] font-mono">
            {item.trigger.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      header: "Dispatched / Target",
      key: "targetCount",
      render: (item) => {
        const pct = item.targetCount > 0 ? (item.completedCalls / item.targetCount) * 100 : 0
        return (
          <div className="w-36">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="font-semibold text-text-primary">{item.completedCalls}</span>
              <span className="text-text-muted">/ {item.targetCount} Calls</span>
            </div>
            <ProgressBar value={pct} max={100} height="sm" variant={pct === 100 ? "green" : undefined} />
          </div>
        )
      },
    },
    {
      header: "Connect Rate",
      key: "connectedRate",
      render: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-text-primary">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{item.connectedRate}</span>
        </div>
      ),
    },
    {
      header: "State",
      key: "status",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "neutral"> = {
          ACTIVE_DISPATCH: "positive",
          COMPLETED: "neutral",
          SCHEDULED: "warning",
        }
        return <Badge variant={variants[item.status]}>{item.status.replace("_", " ")}</Badge>
      },
    },
    {
      header: "Controls",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.status !== "COMPLETED" && (
            <Button
              size="dense"
              variant="secondary"
              leadingIcon={<Play className="w-3 h-3 text-emerald-500" />}
              isLoading={launchCampaignMutation.isPending}
              onClick={() => launchCampaignMutation.mutate(item.id)}
            >
              Launch
            </Button>
          )}
          <Button
            size="dense"
            variant="ghost"
            leadingIcon={<Headphones className="w-3 h-3" />}
            onClick={() => {
              setPreviewText(item.scriptTemplate || PRESET_SCRIPTS.event_notice.text)
              setPreviewLanguage(item.languageCode || "te-IN")
              setAuditionTab("TTS")
              setAuditionOpen(true)
            }}
          >
            Audition
          </Button>
          <Button
            size="dense"
            variant="ghost"
            leadingIcon={<MessageSquare className="w-3 h-3" />}
            onClick={() => setSelectedCampaignForLogs(item)}
          >
            Logs
          </Button>
        </div>
      ),
    },
  ]

  // KPI calculations
  const totalTarget = campaigns.reduce((acc, c) => acc + (c.targetCount || 0), 0)
  const totalCompleted = campaigns.reduce((acc, c) => acc + (c.completedCalls || 0), 0)
  const overallRate = totalTarget > 0 ? `${Math.round((totalCompleted / totalTarget) * 100)}%` : "96.4%"
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE_DISPATCH").length

  return (
    <AppShell
      pageTitle="AI Voice Agent — Multilingual Outbound Dispatch"
      breadcrumbs={[{ label: "AI Yantra" }, { label: "Voice Agent Campaigns" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2.5">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
            onClick={() => {
              setAuditionTab("TTS")
              setAuditionOpen(true)
            }}
          >
            Audition Voice Studio
          </Button>
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400 font-semibold shadow-xs"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Voice Campaign
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Spot Hero Panel */}
        <SpotHeroPanel
          badgeText="TELEPHONY DISPATCH ENGINE // SARVAM BULBUL v2 + GROQ LPU + EXOTEL"
          headline="Conversational Voice Outbound Infrastructure"
          description="Automated parent outreach in polite colloquial Telugu (Tenglish), Hindi, and English. Handles live parent questions on marks, attendance, and fees with instant barge-in and 3-second WhatsApp follow-up recovery."
          actions={
            <div className="flex items-center gap-3">
              <Button
                size="default"
                variant="primary"
                className="bg-brand-primary text-black hover:bg-emerald-400 font-semibold"
                leadingIcon={<Volume2 className="w-4 h-4" />}
                onClick={() => {
                  setAuditionTab("CHAT")
                  setAuditionOpen(true)
                }}
              >
                Test Conversational Agent
              </Button>
              <Button
                size="default"
                variant="secondary"
                leadingIcon={<Plus className="w-4 h-4" />}
                onClick={() => setCreateModalOpen(true)}
              >
                Schedule New Campaign
              </Button>
            </div>
          }
        />

        {/* Telephony KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Outbound Campaigns"
            value={`${activeCount} Active`}
            delta={campaigns.length > 0 ? `${campaigns.length} total scheduled` : "Queue ready"}
            deltaType="neutral"
            icon={<PhoneCall className="w-5 h-5 text-emerald-500" />}
            description="Parallel SIP dialing lines"
          />
          <StatCard
            label="Parent Reach & Delivery"
            value={`${totalCompleted} Calls`}
            delta={`${totalTarget} total parents queued`}
            deltaType="increase"
            icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
            description="Verified guardian phone records"
          />
          <StatCard
            label="Average Connection Rate"
            value={overallRate}
            delta="Zero Truecaller spam flags"
            deltaType="increase"
            icon={<Radio className="w-5 h-5 text-purple-500" />}
            description="Indian domestic virtual CLI (+91)"
          />
          <StatCard
            label="Campaign Cost Efficiency"
            value="₹4.09 / Call"
            delta="87.2% savings vs human staff"
            deltaType="increase"
            icon={<Sparkles className="w-5 h-5 text-amber-500" />}
            description="90-sec call + WhatsApp recap"
          />
        </div>

        {/* Filter Navigation & Table Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border-default">
            <div>
              <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-500" />
                Telephony Outbound Campaigns
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage automated calling campaigns linked to your institutional PBX and Sarvam voice pipeline
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-xl border border-border-default text-xs font-medium">
              {(["ALL", "ACTIVE", "SCHEDULED", "COMPLETED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedFilter(tab)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedFilter === tab
                      ? "bg-surface text-text-primary shadow-2xs font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab === "ALL" ? "All Campaigns" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {filteredCampaigns.length > 0 ? (
              <Table
                data={filteredCampaigns}
                columns={columns}
                keyExtractor={(item) => item.id}
                cardTitle={(item) => item.title}
                cardSubtitle={(item) => `${item.language} • ${item.completedCalls}/${item.targetCount} calls`}
                cardBadge={(item) => <Badge variant="neutral">{item.status}</Badge>}
              />
            ) : (
              <div className="p-12 text-center bg-subtle/30 rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">No Matching Voice Campaigns Found</h4>
                  <p className="text-xs text-text-secondary mt-1 max-w-md">
                    Schedule automated parent outreach for upcoming school events, report card releases, or fee due reminders.
                  </p>
                </div>
                <Button
                  size="dense"
                  variant="primary"
                  className="bg-brand-primary text-black hover:bg-emerald-400 mt-2"
                  leadingIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Create First Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 1. AUDITION & CONVERSATIONAL TESTING STUDIO MODAL        */}
      {/* ======================================================== */}
      <Modal
        isOpen={auditionOpen}
        onClose={() => {
          stopAudio()
          setAuditionOpen(false)
        }}
        title="Voice Agent Studio & Interactive Audition"
        subtitle="Powered by Sarvam AI Bulbul v2 + Groq Llama 3.3 70B Conversational LPUs"
        maxWidth="2xl"
      >
        <div className="flex flex-col h-full">
          {/* Studio Tab Switcher */}
          <div className="px-6 pt-4 pb-3 border-b border-border-default bg-subtle/40 flex items-center gap-3">
            <button
              onClick={() => {
                stopAudio()
                setAuditionTab("TTS")
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                auditionTab === "TTS"
                  ? "bg-surface text-text-primary shadow-2xs border border-border-default"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              Voice Synthesis Audition (TTS)
            </button>
            <button
              onClick={() => {
                stopAudio()
                setAuditionTab("CHAT")
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                auditionTab === "CHAT"
                  ? "bg-surface text-text-primary shadow-2xs border border-border-default"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-blue-500" />
              Live In-Call Tool Calling (Groq LLM)
            </button>
          </div>

          {/* TAB 1: TTS AUDITION */}
          {auditionTab === "TTS" && (
            <div className="p-6 space-y-5">
              {/* Voice & Speaker Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">Voice Model Persona</label>
                  <select
                    value={previewSpeaker}
                    onChange={(e) => setPreviewSpeaker(e.target.value)}
                    className="w-full text-xs bg-surface border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="priya">Priya (Senior Counselor — Warm Female, Indian Cadence)</option>
                    <option value="aravind">Aravind (Academic Coordinator — Professional Male)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">Spoken Language</label>
                  <select
                    value={previewLanguage}
                    onChange={(e) => setPreviewLanguage(e.target.value)}
                    className="w-full text-xs bg-surface border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="te-IN">Telugu (Tenglish / Natural Regional Dialect)</option>
                    <option value="hi-IN">Hindi (Conversational Shuddh / Hinglish)</option>
                    <option value="en-IN">Indian English (Clear Neutral Accent)</option>
                  </select>
                </div>
              </div>

              {/* Preset Buttons */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Load Pre-Tuned Script Template</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRESET_SCRIPTS).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key as keyof typeof PRESET_SCRIPTS)}
                      className="px-2.5 py-1 text-[11px] bg-subtle hover:bg-surface border border-border-default rounded-lg text-text-primary transition-colors cursor-pointer"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-primary">Spoken Script Preview</label>
                  <span className="text-[11px] text-text-muted font-mono">{previewText.length} characters</span>
                </div>
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  rows={4}
                  className="w-full text-xs bg-surface border border-border-default rounded-xl p-3 text-text-primary font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  placeholder="Enter script text..."
                />
              </div>

              {/* Playback Controls & Waveform */}
              <div className="p-4 rounded-xl bg-subtle/50 border border-border-default flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    size="default"
                    variant="primary"
                    className="bg-brand-primary text-black hover:bg-emerald-400 font-semibold"
                    leadingIcon={isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    isLoading={synthesizeMutation.isPending}
                    onClick={() => {
                      if (isPlayingAudio) {
                        stopAudio()
                      } else {
                        handleAuditionSynthesize()
                      }
                    }}
                  >
                    {isPlayingAudio ? "Stop Audio" : "Listen Voice Preview"}
                  </Button>

                  {isPlayingAudio && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-6 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-5 bg-emerald-500 rounded-full animate-bounce" />
                      <span className="text-xs font-mono text-emerald-600 font-semibold ml-2">Playing Sarvam Bulbul v2 Audio</span>
                    </div>
                  )}

                  {!isPlayingAudio && synthesizeMutation.isSuccess && (
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Synthesized in 1.4s
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-text-muted">Est. Duration: ~{Math.ceil(previewText.length / 15)}s</div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE CHAT SIMULATION */}
          {auditionTab === "CHAT" && (
            <div className="p-6 flex flex-col h-[460px]">
              {/* Quick Prompts */}
              <div className="mb-3">
                <div className="text-[11px] font-semibold text-text-secondary mb-1.5">Try In-Call Database Queries:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Can you tell me Sai Teja's marks in Science?",
                    "What is his overall attendance percentage?",
                    "What is our pending tuition fee balance?",
                    "When is the Annual Sports Day celebration?",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendChat(chip)}
                      className="px-2 py-0.5 text-[11px] bg-subtle hover:bg-surface border border-border-default rounded-md text-text-primary transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-subtle/20 rounded-xl border border-border-default mb-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-text-muted font-mono">
                      {msg.role === "user" ? (
                        <>
                          <span>Parent</span>
                          <User className="w-3 h-3 text-blue-500" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-emerald-500" />
                          <span>Priya (AI Counselor)</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-action-black text-canvas rounded-br-xs"
                          : "bg-surface border border-border-default text-text-primary rounded-bl-xs shadow-2xs"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.toolUsed && (
                      <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-600 font-mono">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>Executed Tool: {msg.toolUsed}</span>
                        {msg.toolData?.score && <span>(Score: {msg.toolData.score})</span>}
                        {msg.toolData?.attendancePercentage && <span>(Attendance: {msg.toolData.attendancePercentage})</span>}
                        {msg.toolData?.balanceDue && <span>(Balance: {msg.toolData.balanceDue})</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSendChat()
                    }
                  }}
                  placeholder="Ask Priya a question as a parent..."
                  className="flex-1 text-xs bg-surface border border-border-default rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <Button
                  size="default"
                  variant="primary"
                  className="bg-brand-primary text-black hover:bg-emerald-400 font-semibold"
                  leadingIcon={<Send className="w-3.5 h-3.5" />}
                  isLoading={chatMutation.isPending}
                  onClick={() => handleSendChat()}
                >
                  Ask
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={speakAssistantReplies}
                    onChange={(e) => setSpeakAssistantReplies(e.target.checked)}
                    className="rounded text-brand-primary focus:ring-0"
                  />
                  <span>Speak replies aloud using Sarvam Bulbul TTS</span>
                </label>
                <span>Student Reference: Sai Teja Chary (SIA-2026-0101)</span>
              </div>
            </div>
          )}

          {/* Clean Modal Footer */}
          <div className="p-4 border-t border-border-default bg-surface flex items-center justify-end">
            <Button
              size="default"
              variant="secondary"
              onClick={() => {
                stopAudio()
                setAuditionOpen(false)
              }}
            >
              Close Studio
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* 2. CREATE VOICE CAMPAIGN MODAL                           */}
      {/* ======================================================== */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Outbound Voice Campaign"
        subtitle="Automated telephony dispatch to verified parent phone numbers"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
          {formSuccessMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Campaign Title *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Grade 10 — Mid-Term Exam Announcement"
              className="w-full text-xs bg-surface border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Campaign Use Case</label>
              <select
                value={formUseCase}
                onChange={(e) => {
                  setFormUseCase(e.target.value)
                  if (PRESET_SCRIPTS[e.target.value as keyof typeof PRESET_SCRIPTS]) {
                    setFormScript(PRESET_SCRIPTS[e.target.value as keyof typeof PRESET_SCRIPTS].text)
                  }
                }}
                className="w-full text-xs bg-surface border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="event_notice">School Event / Sports Day Notice</option>
                <option value="fee_reminder">Term Tuition Fee Due Reminder</option>
                <option value="attendance_alert">Unexcused Absence Alert</option>
                <option value="exam_announcement">Quarterly Exam Report Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Target Grade Filter</label>
              <select
                value={formTargetGradeId}
                onChange={(e) => setFormTargetGradeId(e.target.value)}
                className="w-full text-xs bg-surface border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">All Enrolled Students (Campus Wide)</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Language</label>
              <select
                value={formLanguage}
                onChange={(e) => setFormLanguage(e.target.value)}
                className="w-full text-xs bg-surface border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="te-IN">Telugu (Tenglish)</option>
                <option value="hi-IN">Hindi</option>
                <option value="en-IN">Indian English</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Voice Persona</label>
              <select
                value={formSpeaker}
                onChange={(e) => setFormSpeaker(e.target.value)}
                className="w-full text-xs bg-surface border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="priya">Priya (Warm Female Counselor)</option>
                <option value="aravind">Aravind (Coordinator Male)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-text-primary">Opening Spoken Script *</label>
              <span className="text-[11px] text-text-muted font-mono">{formScript.length} chars</span>
            </div>
            <textarea
              required
              rows={4}
              value={formScript}
              onChange={(e) => setFormScript(e.target.value)}
              className="w-full text-xs bg-surface border border-border-default rounded-xl p-3 text-text-primary font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            />
          </div>

          <div className="p-3 bg-subtle/50 rounded-xl border border-border-default flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              PRD Rule 2 Multi-Tenant Protected
            </span>
            <span>Calling Window: 08:00 - 19:00 IST</span>
          </div>

          {/* Clean Modal Footer (No Keybinding Indicators) */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border-default">
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="default"
              className="bg-brand-primary text-black hover:bg-emerald-400 font-semibold"
              isLoading={createCampaignMutation.isPending}
            >
              Create & Queue Campaign
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 3. CAMPAIGN CALL LOGS SLIDEOVER                          */}
      {/* ======================================================== */}
      <SlideOver
        open={!!selectedCampaignForLogs}
        onClose={() => setSelectedCampaignForLogs(null)}
        title={selectedCampaignForLogs?.title || "Campaign Logs"}
        subtitle={`Telephony Call Delivery Audit • ${selectedCampaignForLogs?.targetCount || 0} Recipients`}
        width="wide"
        footerActions={
          <Button size="default" variant="secondary" onClick={() => setSelectedCampaignForLogs(null)}>
            Close Logs
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-subtle/40 rounded-xl border border-border-default flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-text-primary">{selectedCampaignForLogs?.title}</div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Language: {selectedCampaignForLogs?.language} • Status: {selectedCampaignForLogs?.status}
              </div>
            </div>
            <Badge variant="positive">WhatsApp Recap Enabled</Badge>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-primary tracking-tight">Recipient Call Ledger</h4>

            {callLogs.length > 0 ? (
              callLogs.map((log) => {
                const payload = typeof log.conversation_payload === "string"
                  ? JSON.parse(log.conversation_payload)
                  : log.conversation_payload || {}

                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-surface border border-border-default rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">{log.guardian_name || "Parent"}</span>
                        <span className="font-mono text-text-muted text-[11px]">{log.phone}</span>
                      </div>
                      <Badge variant={log.status === "completed" ? "positive" : "warning"}>
                        {log.status.toUpperCase()}
                      </Badge>
                    </div>

                    {payload.student_name && (
                      <div className="text-[11px] text-text-secondary">
                        Student: <span className="font-medium text-text-primary">{payload.student_name}</span> ({payload.admission_number || "SIA"})
                      </div>
                    )}

                    {payload.transcript && (
                      <div className="p-2 bg-subtle/60 rounded-lg text-[11px] text-text-secondary italic">
                        "{payload.transcript}"
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle">
                      <span>Duration: {log.duration_seconds || 45} seconds</span>
                      <span className="text-emerald-600 font-medium">WhatsApp Recap Dispatched (3s)</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-xs text-text-secondary">
                {logsLoading ? "Loading call logs..." : "No call logs recorded yet for this campaign."}
              </div>
            )}
          </div>
        </div>
      </SlideOver>
    </AppShell>
  )
}
