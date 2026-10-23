"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { 
  Sliders, 
  FileSpreadsheet, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  IndianRupee, 
  Save, 
  BookOpen, 
  GraduationCap, 
  HelpCircle, 
  Sparkles,
  Info,
  Check,
  Edit2,
  QrCode,
  Upload,
  Image as ImageIcon,
  Building,
  AtSign,
  Star,
  RefreshCw,
  Eye,
  CheckCircle
} from "lucide-react"
import { 
  useInstituteSystemSettings, 
  useSaveInstituteSystemSettings,
  CustomGradeFee,
  AvailableGrade,
  PaymentQrCode,
  PaymentSettings
} from "@/lib/api/admission-control.hooks"

type SettingsTab = "admission-info" | "admission-fees" | "academic-fees" | "payments"

export default function InstituteSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTabParam = searchParams.get("tab") as SettingsTab | null
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    currentTabParam && ["admission-info", "admission-fees", "academic-fees", "payments"].includes(currentTabParam)
      ? currentTabParam
      : "admission-info"
  )

  // Fetch unified system configuration
  const { data: settingsData, isLoading, error: fetchError } = useInstituteSystemSettings()
  const saveMutation = useSaveInstituteSystemSettings()

  // Tab 1: Admission Info State
  const [hasExamination, setHasExamination] = useState<boolean>(true)
  const [examTotalMarks, setExamTotalMarks] = useState<number>(100)
  const [passMarks, setPassMarks] = useState<number>(35)
  const [admissionInfoSaved, setAdmissionInfoSaved] = useState<boolean>(false)
  const [admissionInfoError, setAdmissionInfoError] = useState<string | null>(null)

  // Tab 2: Admission Fees State
  const [isAdmissionFeeApplicable, setIsAdmissionFeeApplicable] = useState<boolean>(true)
  const [admissionPricingMethod, setAdmissionPricingMethod] = useState<"SAME_FOR_ALL" | "CUSTOM">("SAME_FOR_ALL")
  const [admissionBaseAmount, setAdmissionBaseAmount] = useState<number>(5000)
  const [admissionGradeFees, setAdmissionGradeFees] = useState<CustomGradeFee[]>([])
  // Builder inputs for Tab 2
  const [selectedAdmissionGradeId, setSelectedAdmissionGradeId] = useState<string>("")
  const [admissionGradeFeeInput, setAdmissionGradeFeeInput] = useState<string>("")
  const [admissionFeesSaved, setAdmissionFeesSaved] = useState<boolean>(false)
  const [admissionFeesError, setAdmissionFeesError] = useState<string | null>(null)

  // Tab 3: Academic Fees State
  const [academicPricingMethod, setAcademicPricingMethod] = useState<"SAME_FOR_ALL" | "CUSTOM">("SAME_FOR_ALL")
  const [academicBaseAmount, setAcademicBaseAmount] = useState<number>(35000)
  const [academicGradeFees, setAcademicGradeFees] = useState<CustomGradeFee[]>([])
  // Builder inputs for Tab 3
  const [selectedAcademicGradeId, setSelectedAcademicGradeId] = useState<string>("")
  const [academicGradeFeeInput, setAcademicGradeFeeInput] = useState<string>("")
  const [academicFeesSaved, setAcademicFeesSaved] = useState<boolean>(false)
  const [academicFeesError, setAcademicFeesError] = useState<string | null>(null)

  // Tab 4: Payments Configuration State
  const [accountName, setAccountName] = useState<string>("")
  const [upiId, setUpiId] = useState<string>("")
  const [qrCodes, setQrCodes] = useState<PaymentQrCode[]>([])
  // Builder inputs for Tab 4
  const [selectedProvider, setSelectedProvider] = useState<string>("Unified UPI")
  const [qrUpiIdInput, setQrUpiIdInput] = useState<string>("")
  const [qrImagePreview, setQrImagePreview] = useState<string>("")
  const [isQrDefault, setIsQrDefault] = useState<boolean>(false)
  const [paymentsSaved, setPaymentsSaved] = useState<boolean>(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const availableGrades: AvailableGrade[] = useMemo(() => {
    return settingsData?.availableGrades || []
  }, [settingsData])

  // Hydrate states when settings data loads
  useEffect(() => {
    if (settingsData?.systemConfiguration) {
      const config = settingsData.systemConfiguration
      // 1. Admission Info
      if (config.admissionInfo) {
        setHasExamination(Boolean(config.admissionInfo.hasExamination))
        setExamTotalMarks(Number(config.admissionInfo.examTotalMarks) || 100)
        setPassMarks(Number(config.admissionInfo.passMarks) || 35)
      }
      // 2. Admission Fees
      if (config.admissionFees) {
        setIsAdmissionFeeApplicable(Boolean(config.admissionFees.isApplicable))
        setAdmissionPricingMethod(config.admissionFees.pricingMethod === "CUSTOM" ? "CUSTOM" : "SAME_FOR_ALL")
        setAdmissionBaseAmount(Number(config.admissionFees.baseAmount) || 5000)
        setAdmissionGradeFees(config.admissionFees.customGradeFees || [])
      }
      // 3. Academic Fees
      if (config.academicFees) {
        setAcademicPricingMethod(config.academicFees.pricingMethod === "CUSTOM" ? "CUSTOM" : "SAME_FOR_ALL")
        setAcademicBaseAmount(Number(config.academicFees.baseAmount) || 35000)
        setAcademicGradeFees(config.academicFees.customGradeFees || [])
      }
      // 4. Payments
      if (config.paymentSettings) {
        setAccountName(config.paymentSettings.accountName || "")
        setUpiId(config.paymentSettings.upiId || "")
        setQrCodes(config.paymentSettings.qrCodes || [])
      }
    }
  }, [settingsData])

  // Sync activeTab with URL
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("tab", tab)
    router.replace(`/admin/settings?${newParams.toString()}`)
  }

  // --- TAB 1: Save Admission Information ---
  const handleSaveAdmissionInfo = async () => {
    setAdmissionInfoError(null)
    setAdmissionInfoSaved(false)

    if (hasExamination) {
      if (!examTotalMarks || examTotalMarks <= 0) {
        setAdmissionInfoError("Exam Total Marks must be a positive number greater than 0.")
        return
      }
      if (!passMarks || passMarks <= 0) {
        setAdmissionInfoError("Pass Marks must be a positive number greater than 0.")
        return
      }
      if (passMarks > examTotalMarks) {
        setAdmissionInfoError(`Pass Marks (${passMarks}) cannot be greater than Exam Total Marks (${examTotalMarks}).`)
        return
      }
    }

    try {
      await saveMutation.mutateAsync({
        section: "admissionInfo",
        admissionInfo: {
          hasExamination,
          examTotalMarks: hasExamination ? Number(examTotalMarks) : 100,
          passMarks: hasExamination ? Number(passMarks) : 35,
        },
      })
      setAdmissionInfoSaved(true)
      setTimeout(() => setAdmissionInfoSaved(false), 4000)
    } catch (err: any) {
      setAdmissionInfoError(err.message || "Failed to save admission information settings.")
    }
  }

  // --- TAB 2: Admission Fees Grade Builder ---
  const handleAddAdmissionGradeFee = () => {
    setAdmissionFeesError(null)
    if (!selectedAdmissionGradeId) {
      setAdmissionFeesError("Please select a grade first.")
      return
    }
    const amount = Number(admissionGradeFeeInput)
    if (isNaN(amount) || amount < 0) {
      setAdmissionFeesError("Please enter a valid non-negative fee amount.")
      return
    }
    const gradeObj = availableGrades.find((g) => g.id === selectedAdmissionGradeId)
    const gradeName = gradeObj ? gradeObj.name : "Selected Grade"

    setAdmissionGradeFees((prev) => {
      const existingIdx = prev.findIndex((item) => item.gradeId === selectedAdmissionGradeId)
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = { gradeId: selectedAdmissionGradeId, gradeName, amount }
        return updated
      }
      return [...prev, { gradeId: selectedAdmissionGradeId, gradeName, amount }]
    })

    setSelectedAdmissionGradeId("")
    setAdmissionGradeFeeInput("")
  }

  const handleRemoveAdmissionGradeFee = (gradeId: string) => {
    setAdmissionGradeFees((prev) => prev.filter((item) => item.gradeId !== gradeId))
  }

  const handleSaveAdmissionFees = async () => {
    setAdmissionFeesError(null)
    setAdmissionFeesSaved(false)

    if (isAdmissionFeeApplicable) {
      if (admissionPricingMethod === "SAME_FOR_ALL") {
        if (admissionBaseAmount === undefined || admissionBaseAmount === null || admissionBaseAmount < 0) {
          setAdmissionFeesError("Please enter a valid Admission Fee Amount.")
          return
        }
      } else {
        if (admissionGradeFees.length === 0) {
          setAdmissionFeesError("Please add at least one grade fee in the customized fee structure before saving.")
          return
        }
      }
    }

    try {
      await saveMutation.mutateAsync({
        section: "admissionFees",
        admissionFees: {
          isApplicable: isAdmissionFeeApplicable,
          pricingMethod: admissionPricingMethod,
          baseAmount: isAdmissionFeeApplicable && admissionPricingMethod === "SAME_FOR_ALL" ? Number(admissionBaseAmount) : null,
          customGradeFees: isAdmissionFeeApplicable && admissionPricingMethod === "CUSTOM" ? admissionGradeFees : [],
        },
      })
      setAdmissionFeesSaved(true)
      setTimeout(() => setAdmissionFeesSaved(false), 4000)
    } catch (err: any) {
      setAdmissionFeesError(err.message || "Failed to save admission fees settings.")
    }
  }

  // --- TAB 3: Academic Fees Grade Builder ---
  const handleAddAcademicGradeFee = () => {
    setAcademicFeesError(null)
    if (!selectedAcademicGradeId) {
      setAcademicFeesError("Please select a grade from the dropdown.")
      return
    }
    const amount = Number(academicGradeFeeInput)
    if (isNaN(amount) || amount < 0) {
      setAcademicFeesError("Please enter a valid non-negative academic fee amount.")
      return
    }
    const gradeObj = availableGrades.find((g) => g.id === selectedAcademicGradeId)
    const gradeName = gradeObj ? gradeObj.name : "Selected Grade"

    setAcademicGradeFees((prev) => {
      const existingIdx = prev.findIndex((item) => item.gradeId === selectedAcademicGradeId)
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = { gradeId: selectedAcademicGradeId, gradeName, amount }
        return updated
      }
      return [...prev, { gradeId: selectedAcademicGradeId, gradeName, amount }]
    })

    setSelectedAcademicGradeId("")
    setAcademicGradeFeeInput("")
  }

  const handleRemoveAcademicGradeFee = (gradeId: string) => {
    setAcademicGradeFees((prev) => prev.filter((item) => item.gradeId !== gradeId))
  }

  const handleSaveAcademicFees = async () => {
    setAcademicFeesError(null)
    setAcademicFeesSaved(false)

    if (academicPricingMethod === "SAME_FOR_ALL") {
      if (academicBaseAmount === undefined || academicBaseAmount === null || academicBaseAmount < 0) {
        setAcademicFeesError("Please enter a valid Base Academic Fee Amount.")
        return
      }
    } else {
      if (academicGradeFees.length === 0) {
        setAcademicFeesError("Please add at least one grade fee in the customized fee structure before saving.")
        return
      }
    }

    try {
      await saveMutation.mutateAsync({
        section: "academicFees",
        academicFees: {
          pricingMethod: academicPricingMethod,
          baseAmount: academicPricingMethod === "SAME_FOR_ALL" ? Number(academicBaseAmount) : null,
          customGradeFees: academicPricingMethod === "CUSTOM" ? academicGradeFees : [],
        },
      })
      setAcademicFeesSaved(true)
      setTimeout(() => setAcademicFeesSaved(false), 4000)
    } catch (err: any) {
      setAcademicFeesError(err.message || "Failed to save academic fees settings.")
    }
  }

  // --- TAB 4: Payments Handlers ---
  const handleProcessQrImageFile = (file: File) => {
    setPaymentsError(null)
    if (!file.type.startsWith("image/")) {
      setPaymentsError("Please upload a valid image file (.png, .jpg, .jpeg, .webp, .svg)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPaymentsError("Image file size must be less than 5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setQrImagePreview(result)
    }
    reader.onerror = () => {
      setPaymentsError("Failed to read image file.")
    }
    reader.readAsDataURL(file)
  }

  const handleAddQrCode = () => {
    setPaymentsError(null)
    if (!qrImagePreview) {
      setPaymentsError("Please upload or select a QR code image first.")
      return
    }
    const newQr: PaymentQrCode = {
      id: `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      provider: selectedProvider,
      upiId: qrUpiIdInput.trim() || upiId.trim() || undefined,
      qrImageUrl: qrImagePreview,
      isDefault: qrCodes.length === 0 || isQrDefault,
    }

    let updated = qrCodes
    if (newQr.isDefault) {
      updated = updated.map((qr) => ({ ...qr, isDefault: false }))
    }
    setQrCodes([...updated, newQr])
    setQrImagePreview("")
    setQrUpiIdInput("")
    setIsQrDefault(false)
  }

  const handleSetDefaultQr = (qrId: string) => {
    setQrCodes((prev) =>
      prev.map((qr) => ({
        ...qr,
        isDefault: qr.id === qrId,
      }))
    )
  }

  const handleRemoveQrCode = (qrId: string) => {
    setQrCodes((prev) => {
      const filtered = prev.filter((qr) => qr.id !== qrId)
      if (filtered.length > 0 && !filtered.some((qr) => qr.isDefault)) {
        filtered[0].isDefault = true
      }
      return filtered
    })
  }

  const handleSavePayments = async () => {
    setPaymentsError(null)
    setPaymentsSaved(false)

    try {
      await saveMutation.mutateAsync({
        section: "paymentSettings",
        paymentSettings: {
          isConfigured: qrCodes.length > 0,
          accountName: accountName.trim(),
          upiId: upiId.trim(),
          qrCodes,
          updatedAt: new Date().toISOString(),
        },
      })
      setPaymentsSaved(true)
      setTimeout(() => setPaymentsSaved(false), 4000)
    } catch (err: any) {
      setPaymentsError(err.message || "Failed to save payment settings.")
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Sliders className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Institute Settings</h1>
              <Badge variant="neutral" className="ml-1 text-xs">
                System Configuration
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Foundational institutional rules, entrance examination requirements, base fee structures, and payment QR gateways.
            </p>
          </div>
        </div>

        {/* Global Fetch Error or Loading Banner */}
        {fetchError && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load institute system settings. Please verify your connection or reload the page.</span>
          </div>
        )}

        {/* Settings Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-px overflow-x-auto">
          <button
            onClick={() => handleTabChange("admission-info")}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap rounded-t-lg ${
              activeTab === "admission-info"
                ? "border-primary text-primary bg-primary/5 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Admission Information</span>
          </button>

          <button
            onClick={() => handleTabChange("admission-fees")}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap rounded-t-lg ${
              activeTab === "admission-fees"
                ? "border-primary text-primary bg-primary/5 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Admission Fees</span>
          </button>

          <button
            onClick={() => handleTabChange("academic-fees")}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap rounded-t-lg ${
              activeTab === "academic-fees"
                ? "border-primary text-primary bg-primary/5 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Academic Fees</span>
          </button>

          <button
            onClick={() => handleTabChange("payments")}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap rounded-t-lg ${
              activeTab === "payments"
                ? "border-primary text-primary bg-primary/5 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Payments</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ADMISSION INFORMATION SETTINGS                                    */}
        {/* ========================================================================= */}
        {activeTab === "admission-info" && (
          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-500" />
                      Entrance Examination Policy
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure whether the institution requires an entrance examination for student admissions.
                    </p>
                  </div>
                  <Badge variant={hasExamination ? "warning" : "positive"}>
                    {hasExamination ? "Exam Required" : "Direct Admission"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Primary Selection: Radio Group */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground block">
                    Admission Requirement Mode <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option A: Admission with Examination */}
                    <div
                      onClick={() => setHasExamination(true)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                        hasExamination
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="examRequirement"
                        checked={hasExamination}
                        onChange={() => setHasExamination(true)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Admission with Examination</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Requires candidates to take an entrance examination. Total marks and minimum passing cutoff are enforced.
                        </p>
                      </div>
                    </div>

                    {/* Option B: Admission without Examination */}
                    <div
                      onClick={() => setHasExamination(false)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                        !hasExamination
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="examRequirement"
                        checked={!hasExamination}
                        onChange={() => setHasExamination(false)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Admission without Examination</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Direct admission without mandatory entrance tests. Qualified status is automatically granted upon application submission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Rendering based on Primary Selection */}
                {hasExamination ? (
                  <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-4 transition-all">
                    <div className="flex items-center gap-2 text-indigo-500 font-medium text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Entrance Examination Parameters</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Exam Total Marks */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Exam Total Marks <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="100"
                          value={examTotalMarks || ""}
                          onChange={(e) => setExamTotalMarks(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                        />
                        <p className="text-xs text-muted-foreground">Maximum possible score in the entrance exam.</p>
                      </div>

                      {/* Pass Marks */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Pass Marks <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={examTotalMarks}
                          placeholder="35"
                          value={passMarks || ""}
                          onChange={(e) => setPassMarks(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum score required to qualify for permanent admission.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      Direct admission is active. No exam dates or score thresholds will be required for applicants. You can click <strong>Save</strong> below to persist this configuration.
                    </div>
                  </div>
                )}

                {/* Validation Error Message */}
                {admissionInfoError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{admissionInfoError}</span>
                  </div>
                )}

                {/* Success Feedback */}
                {admissionInfoSaved && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Admission Information configuration saved successfully!</span>
                  </div>
                )}

                {/* Dedicated Action Button */}
                <div className="flex items-center justify-end pt-4 border-t border-border/40">
                  <Button
                    onClick={handleSaveAdmissionInfo}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveMutation.isPending ? "Saving..." : "Save Admission Information"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ADMISSION FEES SETTINGS                                           */}
        {/* ========================================================================= */}
        {activeTab === "admission-fees" && (
          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-indigo-500" />
                      Admission Fee Policy
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure whether the institution charges a one-time admission fee and how that fee is structured.
                    </p>
                  </div>
                  <Badge variant={isAdmissionFeeApplicable ? "warning" : "neutral"}>
                    {isAdmissionFeeApplicable ? "Fee Applicable" : "No Admission Fee"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Step 1: Applicability Radio Group */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground block">
                    Step 1: Fee Applicability <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option A: Admission Fee Applicable */}
                    <div
                      onClick={() => setIsAdmissionFeeApplicable(true)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                        isAdmissionFeeApplicable
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="admissionFeeApplicable"
                        checked={isAdmissionFeeApplicable}
                        onChange={() => setIsAdmissionFeeApplicable(true)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Admission Fee Applicable</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          The institution collects a one-time admission fee upon student enrollment.
                        </p>
                      </div>
                    </div>

                    {/* Option B: Admission Fee Not Applicable */}
                    <div
                      onClick={() => setIsAdmissionFeeApplicable(false)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                        !isAdmissionFeeApplicable
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="admissionFeeApplicable"
                        checked={!isAdmissionFeeApplicable}
                        onChange={() => setIsAdmissionFeeApplicable(false)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Admission Fee Not Applicable</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Zero admission fee policy. Students are enrolled without any mandatory admission charges.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Level 1 & 2 */}
                {isAdmissionFeeApplicable ? (
                  <div className="space-y-6 pt-2">
                    {/* Step 2: Pricing Method Radio Group */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground block">
                        Step 2: Pricing Method <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Sub-Option 1: Same Amount for Everyone */}
                        <div
                          onClick={() => setAdmissionPricingMethod("SAME_FOR_ALL")}
                          className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                            admissionPricingMethod === "SAME_FOR_ALL"
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                              : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="admissionPricingMethod"
                            checked={admissionPricingMethod === "SAME_FOR_ALL"}
                            onChange={() => setAdmissionPricingMethod("SAME_FOR_ALL")}
                            className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-foreground">Same Amount for Everyone</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              A uniform flat admission fee charged across all grades and boards.
                            </p>
                          </div>
                        </div>

                        {/* Sub-Option 2: Customized (Grade-wise) */}
                        <div
                          onClick={() => setAdmissionPricingMethod("CUSTOM")}
                          className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                            admissionPricingMethod === "CUSTOM"
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                              : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="admissionPricingMethod"
                            checked={admissionPricingMethod === "CUSTOM"}
                            onChange={() => setAdmissionPricingMethod("CUSTOM")}
                            className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-foreground">Customized (Grade-wise)</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Configure specific admission fee amounts per individual grade.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conditional Level 2 Rendering */}
                    {admissionPricingMethod === "SAME_FOR_ALL" ? (
                      <div className="p-5 rounded-xl border border-border/60 bg-card/60 space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Admission Fee Amount (₹) <span className="text-destructive">*</span>
                        </label>
                        <div className="relative max-w-sm">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="5000"
                            value={admissionBaseAmount || ""}
                            onChange={(e) => setAdmissionBaseAmount(Math.max(0, Number(e.target.value)))}
                            className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This uniform fee will be applied to every enrolled candidate.
                        </p>
                      </div>
                    ) : (
                      /* Customized Grade-wise Builder */
                      <div className="p-5 rounded-xl border border-border/60 bg-card/60 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-semibold text-foreground">Grade-Based Admission Fee Builder</h4>
                            <p className="text-xs text-muted-foreground">
                              Select a grade, set its admission fee, and click Add (+) to build the schedule.
                            </p>
                          </div>
                          <Badge variant="neutral">{admissionGradeFees.length} configured</Badge>
                        </div>

                        {/* Inline Builder Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-6 space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Select Grade</label>
                            <select
                              value={selectedAdmissionGradeId}
                              onChange={(e) => setSelectedAdmissionGradeId(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                              <option value="">-- Choose a Grade --</option>
                              {availableGrades.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-4 space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Fee Amount (₹)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="4500"
                                value={admissionGradeFeeInput}
                                onChange={(e) => setAdmissionGradeFeeInput(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <Button
                              type="button"
                              onClick={handleAddAdmissionGradeFee}
                              className="w-full flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add</span>
                            </Button>
                          </div>
                        </div>

                        {/* Configured Grade Fees Table */}
                        {admissionGradeFees.length > 0 ? (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                  <th className="py-2.5 px-4">Grade</th>
                                  <th className="py-2.5 px-4">Admission Fee (₹)</th>
                                  <th className="py-2.5 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {admissionGradeFees.map((item) => (
                                  <tr key={item.gradeId} className="hover:bg-muted/20 transition-colors">
                                    <td className="py-2.5 px-4 font-medium text-foreground">{item.gradeName}</td>
                                    <td className="py-2.5 px-4 font-mono text-foreground font-semibold">
                                      ₹{Number(item.amount).toLocaleString("en-IN")}
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAdmissionGradeFee(item.gradeId)}
                                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Remove grade fee"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                            No grade-specific fees configured yet. Select a grade above and click Add (+).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      Admission fee collection is disabled. Click <strong>Save Admission Fees</strong> below to confirm.
                    </div>
                  </div>
                )}

                {/* Validation Error Message */}
                {admissionFeesError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{admissionFeesError}</span>
                  </div>
                )}

                {/* Success Feedback */}
                {admissionFeesSaved && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Admission Fees configuration saved successfully!</span>
                  </div>
                )}

                {/* Dedicated Action Button */}
                <div className="flex items-center justify-end pt-4 border-t border-border/40">
                  <Button
                    onClick={handleSaveAdmissionFees}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveMutation.isPending ? "Saving..." : "Save Admission Fees"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ACADEMIC FEES SETTINGS                                            */}
        {/* ========================================================================= */}
        {activeTab === "academic-fees" && (
          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-500" />
                      Academic Fee Structure
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Every institution defines Academic Fees. Configure whether tuition is uniform or customized per grade.
                    </p>
                  </div>
                  <Badge variant={academicPricingMethod === "SAME_FOR_ALL" ? "neutral" : "positive"}>
                    {academicPricingMethod === "SAME_FOR_ALL" ? "Flat Academic Fee" : "Custom Grade Fees"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Primary Selection: Pricing Method Radio Group */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground block">
                    Pricing Method <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option A: Same for Everyone */}
                    <div
                      onClick={() => setAcademicPricingMethod("SAME_FOR_ALL")}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                        academicPricingMethod === "SAME_FOR_ALL"
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="academicPricingMethod"
                        checked={academicPricingMethod === "SAME_FOR_ALL"}
                        onChange={() => setAcademicPricingMethod("SAME_FOR_ALL")}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Same for Everyone</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Uniform base academic tuition fee applied across all grades and courses.
                        </p>
                      </div>
                    </div>

                    {/* Option B: Customized (Grade-wise) */}
                    <div
                      onClick={() => setAcademicPricingMethod("CUSTOM")}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                        academicPricingMethod === "CUSTOM"
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="academicPricingMethod"
                        checked={academicPricingMethod === "CUSTOM"}
                        onChange={() => setAcademicPricingMethod("CUSTOM")}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Customized (Grade-wise)</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Specify tailored academic tuition fees for each individual grade or standard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Rendering */}
                {academicPricingMethod === "SAME_FOR_ALL" ? (
                  <div className="p-5 rounded-xl border border-border/60 bg-card/60 space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Base Academic Fee Amount (₹) <span className="text-destructive">*</span>
                    </label>
                    <div className="relative max-w-sm">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="35000"
                        value={academicBaseAmount || ""}
                        onChange={(e) => setAcademicBaseAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This annual base academic fee applies to all students regardless of grade.
                    </p>
                  </div>
                ) : (
                  /* Customized Grade-wise Dynamic Row Builder */
                  <div className="p-5 rounded-xl border border-border/60 bg-card/60 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-foreground">Grade-Based Academic Fee Builder</h4>
                        <p className="text-xs text-muted-foreground">
                          Select from all available grades, enter the academic fee, and click Add (+) to build the schedule.
                        </p>
                      </div>
                      <Badge variant="neutral">{academicGradeFees.length} configured</Badge>
                    </div>

                    {/* Inline Dynamic Row Builder */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* 1. Grade Dropdown/Select */}
                      <div className="sm:col-span-6 space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          1. Select Grade <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={selectedAcademicGradeId}
                          onChange={(e) => setSelectedAcademicGradeId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="">-- Choose Grade (e.g. Grade 1, Grade 2...) --</option>
                          {availableGrades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Academic Fee Input */}
                      <div className="sm:col-span-4 space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          2. Academic Fee (₹) <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="35000"
                            value={academicGradeFeeInput}
                            onChange={(e) => setAcademicGradeFeeInput(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                          />
                        </div>
                      </div>

                      {/* 3. Add (+) Icon Button */}
                      <div className="sm:col-span-2">
                        <Button
                          type="button"
                          onClick={handleAddAcademicGradeFee}
                          className="w-full flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add</span>
                        </Button>
                      </div>
                    </div>

                    {/* Summary Table / List */}
                    {academicGradeFees.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                              <th className="py-2.5 px-4">Grade</th>
                              <th className="py-2.5 px-4">Academic Fee Amount (₹)</th>
                              <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {academicGradeFees.map((item) => (
                              <tr key={item.gradeId} className="hover:bg-muted/20 transition-colors">
                                <td className="py-2.5 px-4 font-medium text-foreground">{item.gradeName}</td>
                                <td className="py-2.5 px-4 font-mono text-foreground font-semibold">
                                  ₹{Number(item.amount).toLocaleString("en-IN")}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAcademicGradeFee(item.gradeId)}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Remove grade fee"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                        No grade-specific academic fees added yet. Select a grade and enter fee amount above.
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Error Message */}
                {academicFeesError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{academicFeesError}</span>
                  </div>
                )}

                {/* Success Feedback */}
                {academicFeesSaved && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Academic Fees configuration saved successfully!</span>
                  </div>
                )}

                {/* Dedicated Action Button */}
                <div className="flex items-center justify-end pt-4 border-t border-border/40">
                  <Button
                    onClick={handleSaveAcademicFees}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveMutation.isPending ? "Saving..." : "Save Academic Fees"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PAYMENTS & UPI QR CONFIGURATION                                    */}
        {/* ========================================================================= */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-indigo-500" />
                      Payment QR Codes & UPI Gateway Configuration
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure official institutional payment QR codes and UPI identifiers dynamically displayed during Admissions and Enrollment checkout.
                    </p>
                  </div>
                  <Badge variant={qrCodes.length > 0 ? "positive" : "neutral"} className="self-start sm:self-auto">
                    {qrCodes.length > 0 ? `${qrCodes.length} QR Code${qrCodes.length > 1 ? "s" : ""} Active` : "Not Configured"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Section 1: Institutional Merchant / Beneficiary Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">1. Institutional Merchant & Account Details</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      These details appear alongside the QR code in the Admissions payment card so parents and applicants can verify the payee.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-muted-foreground" />
                        Account Holder / Institute Name
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="e.g. Sphoorthy Educational Society"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <AtSign className="w-3.5 h-3.5 text-muted-foreground" />
                        Primary Institute UPI ID / VPA
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. institute.admissions@okicici"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40" />

                {/* Section 2: Upload / Configure Payment QR Codes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">2. Add Payment QR Code</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upload official QR codes for PhonePe, Google Pay, Paytm, or a Unified UPI QR.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-border/60 bg-muted/20 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Payment Provider / Label <span className="text-destructive">*</span></label>
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                          <option value="Unified UPI">Unified UPI QR (All Apps)</option>
                          <option value="PhonePe">PhonePe</option>
                          <option value="Google Pay">Google Pay</option>
                          <option value="Paytm">Paytm</option>
                          <option value="BHIM UPI">BHIM UPI</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Provider-Specific UPI ID (Optional)</label>
                        <input
                          type="text"
                          value={qrUpiIdInput}
                          onChange={(e) => setQrUpiIdInput(e.target.value)}
                          placeholder={upiId ? `Defaults to: ${upiId}` : "e.g. institute@ybl"}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    {/* QR Code Image Uploader / Dropzone */}
                    {!qrImagePreview ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDragging(true)
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDragging(false)
                          if (e.dataTransfer.files?.[0]) {
                            handleProcessQrImageFile(e.dataTransfer.files[0])
                          }
                        }}
                        className={`relative rounded-xl border-2 border-dashed transition-all p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          isDragging
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/80 hover:border-primary/60 hover:bg-muted/40 bg-card"
                        }`}
                        onClick={() => document.getElementById("qr-file-upload-input")?.click()}
                      >
                        <input
                          id="qr-file-upload-input"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleProcessQrImageFile(e.target.files[0])
                            }
                          }}
                        />
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">
                            Click to upload or drag & drop QR image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports PNG, JPG, JPEG, WEBP, or SVG (Up to 5MB)
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Live Image Preview */
                      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-center gap-4">
                        <div className="p-2 rounded-lg bg-white border border-border shadow-xs shrink-0">
                          <img
                            src={qrImagePreview}
                            alt="QR Preview"
                            className="w-28 h-28 object-contain rounded"
                          />
                        </div>
                        <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <Badge variant="neutral" className="text-xs font-semibold">
                              {selectedProvider}
                            </Badge>
                            {qrUpiIdInput || upiId ? (
                              <span className="text-xs font-mono text-muted-foreground">
                                {qrUpiIdInput || upiId}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isQrDefault}
                                onChange={(e) => setIsQrDefault(e.target.checked)}
                                className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              <span>Set as Primary / Default QR code</span>
                            </label>
                          </div>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                            <Button
                              type="button"
                              onClick={handleAddQrCode}
                              className="h-9 px-4 text-xs font-medium flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Roster</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setQrImagePreview("")
                                setIsQrDefault(false)
                              }}
                              className="h-9 px-3 text-xs"
                            >
                              Discard
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => document.getElementById("qr-file-upload-input")?.click()}
                              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              Replace Image
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/40" />

                {/* Section 3: Configured QR Codes Roster */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>3. Configured QR Codes</span>
                      <Badge variant="neutral" className="text-xs">
                        {qrCodes.length}
                      </Badge>
                    </h3>
                  </div>

                  {qrCodes.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border/80 rounded-xl bg-card/50 space-y-2">
                      <QrCode className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                      <p className="text-sm font-medium text-foreground">No QR codes added yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Upload a payment QR image above and click "Add to Roster". Once saved, it will immediately display in the Admissions checkout.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {qrCodes.map((qr) => (
                        <div
                          key={qr.id}
                          className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                            qr.isDefault
                              ? "border-primary/80 bg-primary/5 shadow-xs ring-1 ring-primary/20"
                              : "border-border/70 bg-card hover:border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                              {qr.provider}
                            </span>
                            {qr.isDefault ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Star className="w-3 h-3 fill-amber-400" />
                                Primary
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultQr(qr.id)}
                                className="text-[11px] text-muted-foreground hover:text-primary transition-colors underline"
                              >
                                Set as Primary
                              </button>
                            )}
                          </div>

                          <div className="p-2.5 rounded-lg bg-white border border-border shadow-xs flex items-center justify-center my-1">
                            <img
                              src={qr.qrImageUrl}
                              alt={qr.provider}
                              className="w-32 h-32 object-contain"
                            />
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>VPA / UPI ID:</span>
                              <span className="font-mono text-foreground font-medium truncate max-w-[150px]">
                                {qr.upiId || upiId || "Not specified"}
                              </span>
                            </div>
                            {accountName && (
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Account:</span>
                                <span className="text-foreground font-medium truncate max-w-[150px]">
                                  {accountName}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">
                              {qr.isDefault ? "Default checkout QR" : "Secondary option"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveQrCode(qr.id)}
                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete QR code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Validation Error Message */}
                {paymentsError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentsError}</span>
                  </div>
                )}

                {/* Success Feedback */}
                {paymentsSaved && (
                  <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Payment settings and QR codes saved successfully! Connected to Admissions & Enrollment workflow.</span>
                  </div>
                )}

                {/* Dedicated Action Button */}
                <div className="flex items-center justify-end pt-4 border-t border-border/40">
                  <Button
                    onClick={handleSavePayments}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveMutation.isPending ? "Saving..." : "Save Payment Settings"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
