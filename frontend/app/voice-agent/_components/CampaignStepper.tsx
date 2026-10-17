"use client"

import React, { useState, useMemo } from "react"
import {
  useClasses,
  useCreateVoiceCampaign,
  useLaunchVoiceCampaign,
  useVoiceHealth,
} from "@/lib/api/hooks"
import { ArrowLeft, Check, ChevronRight, Play, PhoneCall, Calendar, AlertCircle, Volume2, ShieldCheck, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignStepperProps {
  onCancel: () => void
  onSuccess: (campaignId: string) => void
  onOpenTestCall: () => void
  onOpenVoicePreview: (lang: string, text: string) => void
}

interface ClassItem {
  id: string
  name: string
  enrolled_count?: number
  sections?: Array<{ id: string; name: string; student_count?: number }>
}

export const CampaignStepper: React.FC<CampaignStepperProps> = ({
  onCancel,
  onSuccess,
  onOpenTestCall,
  onOpenVoicePreview,
}) => {
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Audience
  const { data: rawClasses = [] } = useClasses()
  const classes = (rawClasses || []) as ClassItem[]
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all")
  const [isReviewListOpen, setIsReviewListOpen] = useState(false)

  // Set default selected class once loaded
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  const selectedClass = classes.find((c: ClassItem) => c.id === selectedClassId)

  // Step 2: Message & Language
  const [messageType, setMessageType] = useState<"event_notice" | "fee_reminder" | "attendance_alert" | "exam_announcement">("event_notice")
  const [languageMode, setLanguageMode] = useState<"parent_choice" | "te-IN" | "en-IN" | "hi-IN">("parent_choice")

  // Dynamic template fields
  const [eventTitle, setEventTitle] = useState("Annual Sports Day 2026")
  const [eventDate, setEventDate] = useState("Saturday, October 24")
  const [eventTime, setEventTime] = useState("09:00 AM")
  const [feeTerm, setFeeTerm] = useState("Term 2 Tuition Fee")
  const [feeDueDate, setFeeDueDate] = useState("November 15, 2026")

  // Step 3: Preview checklist
  const [hasListened, setHasListened] = useState(false)
  const [hasTestedCall, setHasTestedCall] = useState(false)

  // Step 4: Schedule
  const [startTiming, setStartTiming] = useState<"now" | "later">("now")
  const [scheduledDateTime, setScheduledDateTime] = useState("")

  const createMutation = useCreateVoiceCampaign()
  const launchMutation = useLaunchVoiceCampaign()
  const { data: health } = useVoiceHealth()

  // Opening line preview in chosen language (or Telugu by default)
  const effectiveLanguage = languageMode === "parent_choice" ? "te-IN" : languageMode

  const generatedOpeningLine = useMemo(() => {
    if (effectiveLanguage === "te-IN") {
      switch (messageType) {
        case "event_notice":
          return `నమస్కారం అండి! నేను నారాయణ పాఠశాల నుండి ప్రియను మాట్లాడుతున్నాను. రాబోయే ${eventDate}న ఉదయం ${eventTime} గంటలకు మన పాఠశాలలో ${eventTitle} నిర్వహించబడుతుంది. తల్లిదండ్రులందరికీ సాదర స్వాగతం.`
        case "fee_reminder":
          return `నమస్కారం అండి! నారాయణ పాఠశాల అకౌంట్స్ విభాగం నుండి ప్రియను. ${feeTerm} చెల్లింపు గడువు ${feeDueDate} తో ముగుస్తుంది. మీ విద్యార్థి బకాయి వివరాలు లేదా చెల్లింపు విధానం గురించి మీరు నన్ను అడగవచ్చు.`
        case "attendance_alert":
          return `నమస్కారం అండి! పాఠశాల హాజరు విభాగం నుండి ప్రియను. మీ విద్యార్థి నేటి ఉదయం ప్రార్థన సమయానికి రాలేదు. సెలవులో ఉన్నారా అని దయచేసి నిర్ధారించండి.`
        case "exam_announcement":
          return `నమస్కారం అండి! నారాయణ పాఠశాల పరీక్ష ఫలితాలు విడుదలయ్యాయి. ఏదైనా సబ్జెక్టులో మీ పిల్లల మార్కులు లేదా గ్రేడ్ వివరాలు తెలుసుకోవడానికి మీరు నన్ను నేరుగా అడగవచ్చు.`
      }
    }
    if (effectiveLanguage === "hi-IN") {
      switch (messageType) {
        case "event_notice":
          return `नमस्ते! मैं नारायणा स्कूल से प्रिया बोल रही हूँ। आगामी ${eventDate} को सुबह ${eventTime} बजे हमारे स्कूल में ${eventTitle} का आयोजन किया जा रहा है।`
        case "fee_reminder":
          return `नमस्ते! नारायणा स्कूल लेखा विभाग से प्रिया बोल रही हूँ। ${feeTerm} जमा करने की अंतिम तिथि ${feeDueDate} है।`
        case "attendance_alert":
          return `नमस्ते! स्कूल उपस्थिति विभाग से प्रिया। आपका बच्चा आज सुबह की प्रार्थना सभा में उपस्थित नहीं हुआ है।`
        case "exam_announcement":
          return `नमस्ते! नारायणा स्कूल के परीक्षा परिणाम घोषित हो चुके हैं। आप अपने बच्चे के अंक या ग्रेड के बारे में मुझसे पूछ सकते हैं।`
      }
    }
    // en-IN
    switch (messageType) {
      case "event_notice":
        return `Good morning! This is Priya calling from Narayana High School. We are celebrating our ${eventTitle} this upcoming ${eventDate} at ${eventTime}. Parents are warmly invited.`
      case "fee_reminder":
        return `Good morning! This is Priya calling from Narayana High School accounts desk. A gentle reminder that the ${feeTerm} installment is due on or before ${feeDueDate}.`
      case "attendance_alert":
        return `Good morning! This is Priya from the school attendance desk. We noticed your child has not checked into the morning assembly today.`
      case "exam_announcement":
        return `Good morning! This is Priya calling from Narayana High School. The recent examination results have been published. You can ask me for marks or grades right now.`
    }
  }, [messageType, effectiveLanguage, eventTitle, eventDate, eventTime, feeTerm, feeDueDate])

  // Calculation for audience numbers
  const recipientCount = selectedClass ? (Number(selectedClass.enrolled_count) || 40) : 40
  const missingPhoneCount = 0
  const optOutCount = 0

  const handleStartCampaign = async () => {
    try {
      const created = await createMutation.mutateAsync({
        name: `${selectedClass?.name || "Grade"} - ${messageType === "event_notice" ? "Event Notice" : messageType === "fee_reminder" ? "Fee Notice" : "Outreach"}`,
        useCase: messageType,
        language: effectiveLanguage,
        scriptText: generatedOpeningLine,
        targetGradeId: selectedClassId,
        targetSectionId: selectedSectionId === "all" ? undefined : selectedSectionId,
        languageMode: languageMode,
        scheduledAt: startTiming === "later" && scheduledDateTime ? scheduledDateTime : undefined,
      })

      if (created && created.id) {
        if (startTiming === "now") {
          await launchMutation.mutateAsync(created.id)
        }
        onSuccess(created.id)
      }
    } catch (err) {
      console.error("Campaign creation error:", err)
    }
  }

  const steps = [
    { num: 1, title: "Audience", desc: "Select grade & section" },
    { num: 2, title: "Message", desc: "Message type & text" },
    { num: 3, title: "Preview & test", desc: "Verify greeting audio" },
    { num: 4, title: "Schedule & review", desc: "Calling hours & launch" },
  ]

  const isPhoneLineBlocked = health?.phoneLine.status !== "ready"

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">New campaign</h2>
        </div>
        <span className="text-xs text-gray-500">Step {currentStep} of 4</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 min-h-[560px]">
        {/* Left Persistent Stepper */}
        <div className="p-6 bg-gray-50/70 border-r border-gray-200 space-y-6">
          <div className="space-y-4">
            {steps.map((st) => {
              const isDone = currentStep > st.num
              const isCurrent = currentStep === st.num
              return (
                <div key={st.num} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors mt-0.5",
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-600 font-bold"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {isDone ? "✓" : st.num}
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold", isCurrent ? "text-emerald-800" : isDone ? "text-gray-900" : "text-gray-400")}>
                      {st.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{st.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-6 border-t border-gray-200 space-y-2 text-[11px] text-gray-500">
            <p className="font-semibold text-gray-700">Calling policy:</p>
            <p>· Calls happen sequentially, one parent at a time.</p>
            <p>· Calling window: 09:00 AM – 07:00 PM IST.</p>
            <p>· Draft progress is preserved.</p>
          </div>
        </div>

        {/* Right Step Body */}
        <div className="col-span-3 p-6 sm:p-8 flex flex-col justify-between">
          <div className="max-w-2xl">
            {/* STEP 1: AUDIENCE */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Select parent audience</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose which grade and section to dial. All registered guardians will be reached in sequence.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Grade Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Class grade
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.enrolled_count || 40} students)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Section
                    </label>
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    >
                      <option value="all">All sections (Section A & Section B)</option>
                      <option value="sec-a">Section A only</option>
                      <option value="sec-b">Section B only</option>
                    </select>
                  </div>
                </div>

                {/* Audience Summary Card */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Audience summary</span>
                    <button
                      onClick={() => setIsReviewListOpen(!isReviewListOpen)}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                    >
                      {isReviewListOpen ? "Hide list" : "Review list"}
                    </button>
                  </div>

                  <p className="text-gray-700">
                    <strong className="text-gray-900">{recipientCount} parents</strong> will be called · {missingPhoneCount} have no phone number · {optOutCount} opted out
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Every parent will be called sequentially. Parents with missing numbers will be highlighted and skipped automatically.
                  </p>

                  {/* Expandable Review List */}
                  {isReviewListOpen && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 max-h-48 overflow-y-auto">
                      <div className="text-[11px] text-gray-600 grid grid-cols-3 font-semibold pb-1 border-b border-gray-200">
                        <span>Student</span>
                        <span>Guardian</span>
                        <span>Contact Number</span>
                      </div>
                      {[
                        { student: "Ananya Reddy", parent: "K. Mahender Reddy", phone: "+91XXXXXX1000" },
                        { student: "Kavya Sharma", parent: "Dr. Anil Sharma", phone: "+91XXXXXX1001" },
                        { student: "Diya Rao", parent: "Smt. Sunitha Rao", phone: "+91XXXXXX1002" },
                        { student: "Aarav Sharma", parent: "Mukesh Sharma", phone: "+91XXXXXX2000" },
                        { student: "Rohan Reddy", parent: "G. Sudhakar Reddy", phone: "+91XXXXXX2001" },
                      ].map((item, i) => (
                        <div key={i} className="text-xs grid grid-cols-3 py-1 border-b border-gray-100">
                          <span className="text-gray-900">{item.student}</span>
                          <span className="text-gray-700">{item.parent}</span>
                          <span className="font-mono text-gray-600">{item.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: MESSAGE */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Message & language</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose what the agent will communicate and which language to use.
                  </p>
                </div>

                {/* Message Type Cards */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Message scenario
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "event_notice", label: "Event", sub: "Sports Day, functions" },
                      { id: "fee_reminder", label: "Fee reminder", sub: "Installment due date" },
                      { id: "attendance_alert", label: "Absence alert", sub: "Morning check-in" },
                      { id: "exam_announcement", label: "Exam results", sub: "Marks published" },
                    ].map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setMessageType(card.id as any)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          messageType === card.id
                            ? "bg-emerald-50/70 border-emerald-500 shadow-2xs"
                            : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                      >
                        <p className={cn("text-xs font-semibold", messageType === card.id ? "text-emerald-900" : "text-gray-900")}>
                          {card.label}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{card.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relevant Template Inputs */}
                {messageType === "event_notice" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Event name</label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="text"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                  </div>
                )}

                {messageType === "fee_reminder" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Term description</label>
                      <input
                        type="text"
                        value={feeTerm}
                        onChange={(e) => setFeeTerm(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Payment due date</label>
                      <input
                        type="text"
                        value={feeDueDate}
                        onChange={(e) => setFeeDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Language Choice */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Spoken language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "parent_choice", label: "Each parent's choice (Default)" },
                      { id: "te-IN", label: "Telugu" },
                      { id: "en-IN", label: "English" },
                      { id: "hi-IN", label: "Hindi" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLanguageMode(l.id as any)}
                        className={cn(
                          "py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors",
                          languageMode === l.id
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Opening Line Display */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Exact opening line the AI will say
                    </label>
                    <span className="text-[11px] text-gray-500">Live preview</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs text-gray-900 leading-relaxed font-sans">
                    {generatedOpeningLine}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW & TEST */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Preview & test</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Listen to how the voice sounds or make a live test call to your phone before launching to parents.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Listen card */}
                  <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-xs font-bold text-gray-900">Listen to opening greeting</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Hear the natural pronunciation and tone in {effectiveLanguage === "te-IN" ? "Telugu" : effectiveLanguage === "hi-IN" ? "Hindi" : "English"}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setHasListened(true)
                        onOpenVoicePreview(effectiveLanguage, generatedOpeningLine)
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-300 hover:bg-gray-50 text-gray-800 shadow-2xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Listen to voice</span>
                    </button>
                  </div>

                  {/* Test call card */}
                  <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-xs font-bold text-gray-900">Call my phone first</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Place a real call to your own mobile handset to experience real-time conversation and barge-in.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setHasTestedCall(true)
                        onOpenTestCall()
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-300 hover:bg-gray-50 text-gray-800 shadow-2xs transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Test call my phone</span>
                    </button>
                  </div>
                </div>

                {/* Checklist */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-xs">
                  <span className="font-semibold text-gray-900 block">Pre-launch checklist</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px]", hasListened ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400")}>
                        {hasListened ? "✓" : "·"}
                      </span>
                      <span>Listened to speech audio ({hasListened ? "Completed" : "Recommended"})</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px]", hasTestedCall ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400")}>
                        {hasTestedCall ? "✓" : "·"}
                      </span>
                      <span>Test call made to own phone ({hasTestedCall ? "Completed" : "Recommended, not mandatory"})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SCHEDULE & REVIEW */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Schedule & review</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Review your campaign settings before initiating parent outreach.
                  </p>
                </div>

                {/* Timing Choice */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">
                    When to start
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStartTiming("now")}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-colors",
                        startTiming === "now"
                          ? "bg-emerald-50/70 border-emerald-500 text-emerald-900 font-semibold"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <p className="text-xs">Start immediately</p>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">Calls will begin dialing in sequence now</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartTiming("later")}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-colors",
                        startTiming === "later"
                          ? "bg-emerald-50/70 border-emerald-500 text-emerald-900 font-semibold"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <p className="text-xs">Schedule for later</p>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">Dial during permitted daytime hours</p>
                    </button>
                  </div>

                  {startTiming === "later" && (
                    <div className="pt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scheduled start time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Rules & Policy Card */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Permitted calling hours</span>
                    <span className="font-semibold text-gray-900">09:00 AM – 07:00 PM IST</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Retry policy</span>
                    <span className="font-semibold text-gray-900">Retry no-answer twice, 30 min apart</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Target parents</span>
                    <span className="font-semibold text-gray-900">{recipientCount} recipients in queue</span>
                  </div>
                </div>

                {/* Blocked line warning if any */}
                {isPhoneLineBlocked && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Phone calls are currently blocked</p>
                      <p className="mt-0.5 text-red-800">{health?.phoneLine.message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="pt-8 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={currentStep === 1 ? onCancel : () => setCurrentStep((s) => s - 1)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartCampaign}
                disabled={createMutation.isPending || launchMutation.isPending || isPhoneLineBlocked}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors"
              >
                {createMutation.isPending || launchMutation.isPending ? (
                  <span>Initiating campaign...</span>
                ) : (
                  <span>Start campaign</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
