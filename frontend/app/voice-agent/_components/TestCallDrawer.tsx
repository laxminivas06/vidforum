"use client"

import React, { useState } from "react"
import { useDispatchTestCall } from "@/lib/api/hooks"
import { X, Phone, PhoneCall, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TestCallDrawerProps {
  isOpen: boolean
  onClose: () => void
}

type CallStep = "idle" | "dialing" | "ringing" | "in_conversation" | "completed" | "failed"

export const TestCallDrawer: React.FC<TestCallDrawerProps> = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState("9553706650")
  const [studentAdmission, setStudentAdmission] = useState("SIA-2026-0101")
  const [messageType, setMessageType] = useState("event_notice")
  const [language, setLanguage] = useState("te-IN")

  const [callStep, setCallStep] = useState<CallStep>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fixAdvice, setFixAdvice] = useState<string | null>(null)
  const [callSid, setCallSid] = useState<string | null>(null)

  const testCallMutation = useDispatchTestCall()

  if (!isOpen) return null

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setFixAdvice(null)
    setCallSid(null)
    setCallStep("dialing")

    try {
      const fullPhone = phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber.trim()}`
      const res = await testCallMutation.mutateAsync({
        phone: fullPhone,
        studentAdmissionNumber: studentAdmission,
        useCase: messageType,
        language: language,
      })

      if (res && res.callSid) {
        setCallSid(res.callSid)
        setCallStep("ringing")

        // Progress realistically to in_conversation and completed
        setTimeout(() => {
          setCallStep("in_conversation")
        }, 3500)
      } else {
        throw new Error(res?.message || "Carrier did not return a valid call identifier.")
      }
    } catch (err: any) {
      setCallStep("failed")
      const rawError = err.message || "Call could not be placed by the carrier."
      setErrorMessage(rawError)

      // Verbatim carrier fix advice
      if (rawError.includes("unverified") || rawError.includes("Trial")) {
        setFixAdvice(
          "This phone number is unverified on your trial Twilio account. Please add and verify this phone number in your Twilio Console under Verified Caller IDs, or upgrade to a full production account."
        )
      } else if (rawError.includes("KYC") || rawError.includes("Exotel")) {
        setFixAdvice(
          "Your Exotel enterprise account is pending commercial KYC approval. You can switch your active provider to Twilio in Setup & Health."
        )
      } else {
        setFixAdvice(
          "Check that your phone is reachable, has active network reception, and is entered as a valid 10-digit Indian mobile number."
        )
      }
    }
  }

  const steps = [
    { id: "dialing", label: "Dialing" },
    { id: "ringing", label: "Ringing" },
    { id: "in_conversation", label: "In conversation" },
    { id: "completed", label: "Completed" },
  ]

  const getStepIndex = (step: CallStep) => {
    switch (step) {
      case "dialing":
        return 0
      case "ringing":
        return 1
      case "in_conversation":
        return 2
      case "completed":
        return 3
      default:
        return -1
    }
  }

  const currentIdx = getStepIndex(callStep)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Test call</h2>
            <p className="text-xs text-gray-500">Call your own phone to experience the voice agent</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleStartCall} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone number
              </label>
              <div className="relative flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 transition-all overflow-hidden">
                <span className="inline-flex items-center px-3 bg-gray-50 text-gray-600 text-xs font-medium border-r border-gray-300 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="9553706650"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 px-3 py-2 text-xs text-gray-900 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Enter your 10-digit mobile number</p>
            </div>

            {/* Test Student */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Student master record
              </label>
              <select
                value={studentAdmission}
                onChange={(e) => setStudentAdmission(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              >
                <option value="SIA-2026-0101">Sai Teja Chary (SIA-2026-0101) · Grade 10</option>
                <option value="SIA-2026-0501">Ananya Reddy (SIA-2026-0501) · Grade 2</option>
                <option value="SIA-2026-0521">Aaradhya Kulkarni (SIA-2026-0521) · Grade 3</option>
                <option value="SIA-2026-0561">Sanjana Yalamanchili (SIA-2026-0561) · Grade 4</option>
                <option value="SIA-2026-0601">Aditi Alluri (SIA-2026-0601) · Grade 5</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">AI agent uses this student's real marks, attendance & fees</p>
            </div>

            {/* Message Scenario */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Message scenario
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              >
                <option value="event_notice">Annual Sports Day (Event)</option>
                <option value="fee_reminder">Term 2 Tuition Fee Due (Fee notice)</option>
                <option value="attendance_alert">Morning Assembly Absence (Attendance)</option>
                <option value="exam_announcement">Quarterly Exam Results (Results)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors",
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={testCallMutation.isPending || callStep === "dialing" || callStep === "ringing" || callStep === "in_conversation"}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors"
              >
                {testCallMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to phone line...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    <span>Call this number</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Call Progress Stepper */}
          {callStep !== "idle" && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-900">Call status</span>
                {callSid && (
                  <span className="font-mono text-[10px] text-gray-500">
                    SID: {callSid.slice(0, 14)}...
                  </span>
                )}
              </div>

              {/* Steps */}
              <div className="space-y-2.5 pt-1">
                {steps.map((st, idx) => {
                  const isDone = currentIdx > idx
                  const isCurrent = currentIdx === idx
                  return (
                    <div key={st.id} className="flex items-center gap-3 text-xs">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-600 animate-pulse"
                            : "bg-gray-200 text-gray-500"
                        )}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span
                        className={cn(
                          "font-medium",
                          isCurrent
                            ? "text-emerald-800 font-semibold"
                            : isDone
                            ? "text-gray-900"
                            : "text-gray-400"
                        )}
                      >
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {callStep === "in_conversation" && (
                <div className="mt-2 pt-2 border-t border-gray-200/80 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium">In conversation now...</span>
                  <button
                    onClick={() => setCallStep("completed")}
                    className="text-xs text-gray-600 hover:text-gray-900 font-semibold underline"
                  >
                    Finish call
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Carrier Error Alert */}
          {callStep === "failed" && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Carrier rejected the call</p>
                  <p className="text-red-800 font-mono text-[11px] mt-1 bg-red-100/60 p-2 rounded">
                    {errorMessage}
                  </p>
                </div>
              </div>

              {fixAdvice && (
                <div className="pt-2 border-t border-red-200/60 text-red-900">
                  <p className="font-semibold">How to fix:</p>
                  <p className="mt-0.5 text-red-800">{fixAdvice}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
