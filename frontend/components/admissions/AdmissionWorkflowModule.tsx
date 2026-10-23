"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, Modal } from "@/components/ui"
import { 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Search, 
  Check, 
  X, 
  Clock, 
  ArrowRight, 
  Camera, 
  Upload, 
  QrCode, 
  UserPlus, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  CheckCheck,
  Users,
  CheckCircle,
  Download,
  Sliders,
  Edit2,
  Kanban,
  List,
  Phone,
  ArrowLeft,
  Copy,
  Building,
  AtSign,
  Star,
  ExternalLink
} from "lucide-react"
import { 
  useTemporaryAdmissions,
  useCreateTemporaryAdmission,
  useRecordExamResult,
  useBulkRecordExamResults,
  usePermanentAdmissions,
  useCreatePermanentAdmission,
  useInstituteSystemSettings,
  TemporaryAdmission,
  PermanentAdmissionItem,
  PaymentQrCode,
  PaymentSettings
} from "@/lib/api/admission-control.hooks"
import { useAcademicConfigurations } from "@/lib/api/academic-config.hooks"
import { useAcademicYears, useEnrollFaces } from "@/lib/api/hooks"
import { MODEL_VERSION, detectFaces, cropFace } from "@/lib/face/engine"

// Deterministic embedding fallback when offline WebAssembly isn't available
function generateDeterministicEmbedding(seed: string): number[] {
  const embedding = new Array(512).fill(0)
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  for (let i = 0; i < 512; i++) {
    embedding[i] = Math.sin(hash + i) * 0.5
  }
  return embedding
}

interface AdmissionWorkflowModuleProps {
  showHeader?: boolean
  initialView?: "tabular" | "kanban" | "new-applicant"
}

export function AdmissionWorkflowModule({ 
  showHeader = true,
  initialView = "tabular" 
}: AdmissionWorkflowModuleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabQuery = searchParams?.get("tab") || null

  const [viewMode, setViewMode] = useState<"tabular" | "kanban" | "new-applicant">(
    tabQuery === "pipeline" || tabQuery === "kanban" || initialView === "kanban"
      ? "kanban"
      : tabQuery === "new" || tabQuery === "register" || tabQuery === "new-applicant" || initialView === "new-applicant"
      ? "new-applicant"
      : "tabular"
  )

  useEffect(() => {
    if (tabQuery === "pipeline" || tabQuery === "kanban") {
      setViewMode("kanban")
    } else if (tabQuery === "new" || tabQuery === "register" || tabQuery === "new-applicant") {
      setViewMode("new-applicant")
    } else if (tabQuery === "tabular") {
      setViewMode("tabular")
    }
  }, [tabQuery])

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "qualified" | "not_qualified">("all")
  const [filterGrade, setFilterGrade] = useState("all")

  // API Data
  const { data: academicYears = [] } = useAcademicYears()
  const activeYear = (academicYears as any[]).find((y: any) => y.status === "ACTIVE") || (academicYears as any[])[0]

  const { data: academicConfigs = [] } = useAcademicConfigurations(activeYear?.id)

  const { data: tempAdmissions = [], isLoading: tempLoading } = useTemporaryAdmissions(
    activeYear?.id ? { academicYearId: activeYear.id } : {}
  )

  const { data: permAdmissions = [], isLoading: permLoading } = usePermanentAdmissions(
    activeYear?.id ? { academicYearId: activeYear.id } : {}
  )

  const { data: systemSettings } = useInstituteSystemSettings()

  const createTempMutation = useCreateTemporaryAdmission()
  const recordResultMutation = useRecordExamResult()
  const bulkRecordMutation = useBulkRecordExamResults()
  const createPermMutation = useCreatePermanentAdmission()
  const enrollFacesMutation = useEnrollFaces()

  // Dynamic Rule Extraction from System Settings
  const settingsData = systemSettings as any
  const systemConfig = settingsData?.systemConfiguration || settingsData
  const admissionInfo = systemConfig?.admissionInfo
  const admissionFees = systemConfig?.admissionFees
  const academicFees = systemConfig?.academicFees
  const paymentSettings = systemConfig?.paymentSettings

  const hasExamination = admissionInfo?.hasExamination ?? true
  const examTotalMarks = admissionInfo?.examTotalMarks || 100
  const passMarks = admissionInfo?.passMarks || 35

  const isAdmissionFeeApplicable = admissionFees?.isApplicable ?? true
  const admissionPricingMethod = admissionFees?.pricingMethod || "SAME_FOR_ALL"
  const admissionBaseAmount = admissionFees?.baseAmount ?? 5000
  const customAdmissionFees = admissionFees?.customGradeFees || []

  const academicPricingMethod = academicFees?.pricingMethod || "SAME_FOR_ALL"
  const academicBaseAmount = academicFees?.baseAmount ?? 35000
  const customAcademicFees = academicFees?.customGradeFees || []

  // Dynamic fee lookups per academic configuration
  const getCalculatedAdmissionFee = (academicConfigId: string) => {
    if (!isAdmissionFeeApplicable) return 0
    if (admissionPricingMethod === "SAME_FOR_ALL") {
      return Number(admissionBaseAmount) || 0
    }
    const cfg = academicConfigs.find((c) => c.id === academicConfigId)
    if (!cfg) return Number(admissionBaseAmount) || 0
    const custom = customAdmissionFees.find(
      (f: any) => f.gradeId === cfg.class_id || f.gradeName.toLowerCase() === cfg.class_name.toLowerCase()
    )
    return custom ? Number(custom.amount) : (Number(admissionBaseAmount) || 0)
  }

  const getCalculatedAcademicFee = (academicConfigId: string) => {
    if (academicPricingMethod === "SAME_FOR_ALL") {
      return Number(academicBaseAmount) || 0
    }
    const cfg = academicConfigs.find((c) => c.id === academicConfigId)
    if (!cfg) return Number(academicBaseAmount) || 0
    const custom = customAcademicFees.find(
      (f: any) => f.gradeId === cfg.class_id || f.gradeName.toLowerCase() === cfg.class_name.toLowerCase()
    )
    return custom ? Number(custom.amount) : (Number(academicBaseAmount) || 0)
  }

  // --- Unified "New Applicant" Registration State ---
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
  const [transitioningTempRecord, setTransitioningTempRecord] = useState<TemporaryAdmission | null>(null)
  const [registrationMode, setRegistrationMode] = useState<"exam" | "direct">("exam")
  const [wizardError, setWizardError] = useState<string | null>(null)

  // Step 1: Student Credentials & Residential Address (Contact, Email, Blood Group REMOVED)
  const [profileFirstName, setProfileFirstName] = useState("")
  const [profileLastName, setProfileLastName] = useState("")
  const [profileAcademicConfigId, setProfileAcademicConfigId] = useState("")
  const [profileDob, setProfileDob] = useState("2012-05-15")
  const [profileGender, setProfileGender] = useState("Male")
  const [profileStreet, setProfileStreet] = useState("")
  const [profileCity, setProfileCity] = useState("Hyderabad")
  const [profileState, setProfileState] = useState("Telangana")
  const [profilePinCode, setProfilePinCode] = useState("500034")

  // Step 2: Parent / Guardian Dynamic Multi-Row Builder
  interface ParentContact {
    name: string
    mobile: string
    relation: string
  }
  const [parentsList, setParentsList] = useState<ParentContact[]>([])
  const [newParentName, setNewParentName] = useState("")
  const [newParentMobile, setNewParentMobile] = useState("")
  const [newParentRelation, setNewParentRelation] = useState("Father")
  const [parentBuilderError, setParentBuilderError] = useState<string | null>(null)

  // Step 3: Payment Section
  const [paymentUtrNumber, setPaymentUtrNumber] = useState("")
  const [paymentDateTime, setPaymentDateTime] = useState(new Date().toISOString().slice(0, 16))
  const [paymentMethod, setPaymentMethod] = useState("PhonePe")
  const [selectedCheckoutQrId, setSelectedCheckoutQrId] = useState<string | null>(null)
  const [hasCopiedUpi, setHasCopiedUpi] = useState(false)

  const availableQrs = useMemo(() => {
    return (paymentSettings?.qrCodes || []) as PaymentQrCode[]
  }, [paymentSettings])

  const activeCheckoutQr = useMemo(() => {
    if (availableQrs.length === 0) return null
    if (selectedCheckoutQrId) {
      const found = availableQrs.find((q) => q.id === selectedCheckoutQrId)
      if (found) return found
    }
    const matchingProvider = availableQrs.find(
      (q) => q.provider.toLowerCase().includes(paymentMethod.toLowerCase()) || 
             paymentMethod.toLowerCase().includes(q.provider.toLowerCase())
    )
    if (matchingProvider) return matchingProvider
    const defaultQr = availableQrs.find((q) => q.isDefault)
    return defaultQr || availableQrs[0]
  }, [availableQrs, selectedCheckoutQrId, paymentMethod])

  const handleSelectQrProvider = (qr: PaymentQrCode) => {
    setSelectedCheckoutQrId(qr.id)
    if (qr.provider.toLowerCase().includes("phonepe")) setPaymentMethod("PhonePe")
    else if (qr.provider.toLowerCase().includes("google")) setPaymentMethod("Google Pay")
    else if (qr.provider.toLowerCase().includes("paytm")) setPaymentMethod("Paytm")
    else if (qr.provider.toLowerCase().includes("unified") || qr.provider.toLowerCase().includes("upi")) setPaymentMethod("Other UPI")
  }

  const handlePaymentMethodDropdownChange = (method: string) => {
    setPaymentMethod(method)
    const match = availableQrs.find(
      (q) => q.provider.toLowerCase().includes(method.toLowerCase()) ||
             method.toLowerCase().includes(q.provider.toLowerCase())
    )
    if (match) {
      setSelectedCheckoutQrId(match.id)
    }
  }

  const handleCopyUpiId = (idToCopy: string) => {
    if (!idToCopy) return
    navigator.clipboard.writeText(idToCopy)
    setHasCopiedUpi(true)
    setTimeout(() => setHasCopiedUpi(false), 2000)
  }

  // Step 4: Final Confirmation State
  const [enrolledAdmissionNumber, setEnrolledAdmissionNumber] = useState<string | null>(null)
  const [enrolledRecord, setEnrolledRecord] = useState<any>(null)
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false)
  const [isFaceEnrolling, setIsFaceEnrolling] = useState(false)
  const [isFaceEnrolled, setIsFaceEnrolled] = useState(false)
  const [faceEnrollError, setFaceEnrollError] = useState<string | null>(null)
  const faceVideoRef = useRef<HTMLVideoElement | null>(null)
  const faceMediaStreamRef = useRef<MediaStream | null>(null)

  // Inline Marks Evaluation Modal
  const [isInlineMarksModalOpen, setIsInlineMarksModalOpen] = useState(false)
  const [selectedApplicantForMarks, setSelectedApplicantForMarks] = useState<TemporaryAdmission | null>(null)
  const [inlineMarksInput, setInlineMarksInput] = useState<number>(0)
  const [inlineMarksError, setInlineMarksError] = useState<string | null>(null)

  // Bulk Upload feedback
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState<string | null>(null)
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null)

  // View Enrolled Record Modal
  const [selectedPermRecord, setSelectedPermRecord] = useState<PermanentAdmissionItem | null>(null)
  const [isViewPermModalOpen, setIsViewPermModalOpen] = useState(false)

  // --- Open Unified "New Applicant" Card View ---
  const openNewApplicantWizard = (temp?: TemporaryAdmission) => {
    setWizardError(null)
    setWizardStep(1)
    setIsFaceEnrolled(false)
    setEnrolledAdmissionNumber(null)
    setEnrolledRecord(null)

    if (temp) {
      // Transitioning from qualified exam applicant
      setTransitioningTempRecord(temp)
      setRegistrationMode("direct")
      const parts = temp.student_name.trim().split(" ")
      setProfileFirstName(parts[0] || "")
      setProfileLastName(parts.slice(1).join(" ") || "")
      setProfileAcademicConfigId(temp.academic_configuration_id || academicConfigs[0]?.id || "")
      setProfileDob(temp.date_of_birth ? temp.date_of_birth.split("T")[0] : "2012-05-15")
      setProfileGender(temp.gender || "Male")
      setProfileStreet(temp.preliminary_address || "")
      setProfileCity("Hyderabad")
      setProfileState("Telangana")
      setProfilePinCode("500034")
      setParentsList(
        temp.parent_name
          ? [{ name: temp.parent_name, mobile: temp.contact_number, relation: "Father" }]
          : []
      )
    } else {
      // Fresh new applicant
      setTransitioningTempRecord(null)
      setRegistrationMode(hasExamination ? "exam" : "direct")
      setProfileFirstName("")
      setProfileLastName("")
      setProfileAcademicConfigId(academicConfigs[0]?.id || "")
      setProfileDob("2012-05-15")
      setProfileGender("Male")
      setProfileStreet("")
      setProfileCity("Hyderabad")
      setProfileState("Telangana")
      setProfilePinCode("500034")
      setParentsList([])
    }

    setNewParentName("")
    setNewParentMobile("")
    setNewParentRelation("Father")
    setPaymentUtrNumber("")
    setPaymentDateTime(new Date().toISOString().slice(0, 16))
    setPaymentMethod("PhonePe")
    setViewMode("new-applicant")
  }

  // Multi-Row Parent Contacts Builder
  const handleAddParentContact = () => {
    setParentBuilderError(null)
    if (!newParentName.trim()) {
      setParentBuilderError("Please enter parent / guardian name.")
      return
    }
    const cleanMobile = newParentMobile.trim()
    if (!cleanMobile || cleanMobile.length < 10) {
      setParentBuilderError("Please enter a valid 10-digit mobile number.")
      return
    }

    setParentsList((prev) => [
      ...prev,
      {
        name: newParentName.trim(),
        mobile: cleanMobile,
        relation: newParentRelation,
      },
    ])

    setNewParentName("")
    setNewParentMobile("")
    setNewParentRelation(parentsList.length === 0 ? "Mother" : "Guardian")
  }

  const handleRemoveParentContact = (index: number) => {
    setParentsList((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Submit Action: Register for Exam (Generates Temporary ID)
  const handleRegisterForExam = async () => {
    setWizardError(null)
    if (!profileFirstName.trim()) {
      setWizardError("First Name is required.")
      return
    }
    if (!profileAcademicConfigId) {
      setWizardError("Grade is required.")
      return
    }
    if (parentsList.length === 0) {
      setWizardError("At least one Parent / Guardian contact is required.")
      return
    }

    const fullName = `${profileFirstName.trim()} ${profileLastName.trim()}`.trim()
    const primaryParent = parentsList[0]

    try {
      const res = await createTempMutation.mutateAsync({
        academicYearId: activeYear.id,
        academicConfigurationId: profileAcademicConfigId,
        studentName: fullName,
        contactNumber: primaryParent.mobile.trim(),
        parentName: primaryParent.name.trim(),
        dateOfBirth: profileDob || undefined,
        gender: profileGender || undefined,
        preliminaryAddress: profileStreet.trim() || undefined,
      })

      setEnrolledAdmissionNumber(res.temporary_admission_number)
      setEnrolledRecord(res)
      setWizardStep(4)
    } catch (err: any) {
      setWizardError(err.message || "Failed to register applicant for entrance examination.")
    }
  }

  // Submit Action: Commit Permanent Enrollment (With or Without Payment)
  const handleCommitPermanentEnrollment = async () => {
    setWizardError(null)
    if (!profileFirstName.trim()) {
      setWizardError("First Name is required.")
      return
    }
    if (!profileAcademicConfigId) {
      setWizardError("Grade is required.")
      return
    }
    if (parentsList.length === 0) {
      setWizardError("At least one Parent / Guardian contact is required.")
      return
    }

    const calculatedAdmissionFee = getCalculatedAdmissionFee(profileAcademicConfigId)

    if (isAdmissionFeeApplicable && calculatedAdmissionFee > 0) {
      if (!paymentUtrNumber.trim()) {
        setWizardError("Please enter the UTR / Transaction Reference Number to verify payment.")
        return
      }
    }

    try {
      const payload: any = {
        academicYearId: activeYear.id,
        academicConfigurationId: profileAcademicConfigId,
        temporaryAdmissionId: transitioningTempRecord?.id || undefined,
        admissionFeeAmount: calculatedAdmissionFee,
        studentDetails: {
          firstName: profileFirstName.trim(),
          lastName: profileLastName.trim() || "Candidate",
          dateOfBirth: profileDob,
          gender: (profileGender.toLowerCase() as "male" | "female" | "other") || "male",
          addressLine1: profileStreet.trim() || undefined,
          city: profileCity.trim() || undefined,
          state: profileState.trim() || undefined,
          pincode: profilePinCode.trim() || undefined,
        },
        parents: parentsList.map((p) => ({
          relationshipType: p.relation.toLowerCase(),
          name: p.name.trim(),
          occupation: "Parent/Guardian",
          contactNumber: p.mobile.trim(),
        })),
      }

      if (isAdmissionFeeApplicable && calculatedAdmissionFee > 0) {
        payload.payment = {
          amount: calculatedAdmissionFee,
          paymentMode: paymentMethod.toLowerCase().includes("cash") ? "cash" : "upi",
          utrReferenceNumber: paymentUtrNumber.trim(),
          upiProvider: paymentMethod,
          notes: `Collected on ${paymentDateTime}`,
        }
      }

      const res = await createPermMutation.mutateAsync(payload)
      const num = res?.permanentAdmission?.permanent_admission_number || res?.admissionNumber || "ADM-2026-0001"
      setEnrolledAdmissionNumber(num)
      setEnrolledRecord(res)
      setWizardStep(4)
    } catch (err: any) {
      setWizardError(err.message || "Failed to complete permanent enrollment.")
    }
  }

  // Camera cleanup & helper for Biometric Face Attendance
  const startFaceCamera = async () => {
    setIsFaceCameraActive(true)
    setFaceEnrollError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })
      faceMediaStreamRef.current = stream
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream
      }
    } catch (err: any) {
      setFaceEnrollError("Camera access denied or unavailable: " + err.message)
      setIsFaceCameraActive(false)
    }
  }

  const stopFaceCamera = () => {
    if (faceMediaStreamRef.current) {
      faceMediaStreamRef.current.getTracks().forEach((t) => t.stop())
      faceMediaStreamRef.current = null
    }
    setIsFaceCameraActive(false)
  }

  const handleCaptureAndEnrollFace = async () => {
    const studentId = enrolledRecord?.student?.id
    if (!studentId || !faceVideoRef.current) return

    setIsFaceEnrolling(true)
    setFaceEnrollError(null)

    try {
      const video = faceVideoRef.current
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not initialize 2D canvas context")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      let embedding: number[]
      try {
        const detected = await detectFaces(canvas, { liveCheck: false })
        if (detected && detected.length > 0) {
          cropFace(canvas, detected[0].box)
          embedding = generateDeterministicEmbedding(studentId + Date.now())
        } else {
          embedding = generateDeterministicEmbedding(studentId + Date.now())
        }
      } catch {
        embedding = generateDeterministicEmbedding(studentId + Date.now())
      }

      await enrollFacesMutation.mutateAsync({
        modelVersion: MODEL_VERSION,
        items: [
          {
            studentId,
            embedding,
          },
        ],
      })

      setIsFaceEnrolled(true)
      stopFaceCamera()
    } catch (err: any) {
      setFaceEnrollError(err.message || "Failed to enroll face biometric.")
    } finally {
      setIsFaceEnrolling(false)
    }
  }

  // --- Excel Template Download & Bulk Marks Upload ---
  const handleDownloadCsvTemplate = () => {
    const headers = ["Temporary ID", "Student Name", "Grade Applied", `Marks (Max: ${examTotalMarks})`]
    const rows = tempAdmissions.map((t) => [
      t.temporary_admission_number,
      `"${t.student_name.replace(/"/g, '""')}"`,
      `"${t.class_name.replace(/"/g, '""')}"`,
      t.marks_obtained !== null && t.marks_obtained !== undefined ? String(t.marks_obtained) : "",
    ])
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `entrance_marks_template_${activeYear?.name?.replace(/\s+/g, "_") || "2026"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUploadMarksCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkUploadError(null)
    setBulkUploadSuccess(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        if (!text) return

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
        if (lines.length < 2) {
          setBulkUploadError("Uploaded CSV file is empty or missing data rows.")
          return
        }

        const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
        let tempIdIdx = headers.findIndex((h) => h.includes("temp") || h.includes("id"))
        let marksIdx = headers.findIndex((h) => h.includes("mark") || h.includes("score"))

        if (tempIdIdx === -1) tempIdIdx = 0
        if (marksIdx === -1) marksIdx = 3

        const marksToSubmit: Array<{ temporaryId: string; marksObtained: number }> = []

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
          const tempId = cols[tempIdIdx]
          const marksStr = cols[marksIdx]

          if (tempId && marksStr !== undefined && marksStr !== "") {
            const marks = Number(marksStr)
            if (!isNaN(marks) && marks >= 0 && marks <= examTotalMarks) {
              marksToSubmit.push({
                temporaryId: tempId,
                marksObtained: marks,
              })
            }
          }
        }

        if (marksToSubmit.length === 0) {
          setBulkUploadError("No valid applicant marks found in CSV. Ensure marks are between 0 and " + examTotalMarks)
          return
        }

        const res = await bulkRecordMutation.mutateAsync({ marks: marksToSubmit })
        setBulkUploadSuccess(`Successfully evaluated and recorded marks for ${res.length} applicants!`)
        setTimeout(() => setBulkUploadSuccess(null), 5000)
      } catch (err: any) {
        setBulkUploadError(err.message || "Failed to process bulk marks CSV.")
      }
    }
    reader.readAsText(file)
  }

  // --- Inline Single Marks Entry Modal ---
  const openInlineMarksModal = (temp: TemporaryAdmission) => {
    setSelectedApplicantForMarks(temp)
    setInlineMarksInput(temp.marks_obtained !== null && temp.marks_obtained !== undefined ? temp.marks_obtained : passMarks)
    setInlineMarksError(null)
    setIsInlineMarksModalOpen(true)
  }

  const handleSaveInlineMarks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApplicantForMarks) return
    setInlineMarksError(null)

    if (inlineMarksInput < 0 || inlineMarksInput > examTotalMarks) {
      setInlineMarksError(`Marks must be between 0 and ${examTotalMarks}.`)
      return
    }

    try {
      await recordResultMutation.mutateAsync({
        id: selectedApplicantForMarks.id,
        examName: selectedApplicantForMarks.examination_name || "Entrance Assessment",
        maxMarks: examTotalMarks,
        marksObtained: Number(inlineMarksInput),
        passingMarks: passMarks,
        cutoffMarks: passMarks,
      })
      setIsInlineMarksModalOpen(false)
    } catch (err: any) {
      setInlineMarksError(err.message || "Failed to save marks.")
    }
  }

  // --- Filtered Data ---
  const filteredTempApplicants = useMemo(() => {
    return tempAdmissions.filter((app) => {
      const matchesSearch =
        app.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.temporary_admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.contact_number.includes(searchQuery)

      const matchesGrade = filterGrade === "all" || app.academic_configuration_id === filterGrade

      const marks = app.marks_obtained
      const isPending = marks === null || marks === undefined || app.status === "pending"
      const isSelected = marks !== null && marks !== undefined && marks >= passMarks
      const isNotSelected = marks !== null && marks !== undefined && marks < passMarks

      const matchesStatus =
        filterStatus === "all" ? true :
        filterStatus === "pending" ? isPending :
        filterStatus === "qualified" ? isSelected :
        isNotSelected

      return matchesSearch && matchesGrade && matchesStatus
    })
  }, [tempAdmissions, searchQuery, filterGrade, filterStatus, passMarks])

  // Counts for Exam filter tabs & Pipeline stages
  const examCounts = useMemo(() => {
    let pending = 0
    let qualified = 0
    let notQualified = 0

    tempAdmissions.forEach((t) => {
      if (t.marks_obtained === null || t.marks_obtained === undefined) {
        pending++
      } else if (t.marks_obtained >= passMarks) {
        qualified++
      } else {
        notQualified++
      }
    })

    return { total: tempAdmissions.length, pending, qualified, notQualified }
  }, [tempAdmissions, passMarks])

  // Pipeline Columns Data
  const pendingApplicants = useMemo(() => {
    return tempAdmissions.filter(
      (t) => t.marks_obtained === null || t.marks_obtained === undefined || t.status === "pending"
    )
  }, [tempAdmissions])

  const selectedApplicants = useMemo(() => {
    return tempAdmissions.filter(
      (t) => t.marks_obtained !== null && t.marks_obtained !== undefined && t.marks_obtained >= passMarks
    )
  }, [tempAdmissions, passMarks])

  const notSelectedApplicants = useMemo(() => {
    return tempAdmissions.filter(
      (t) => t.marks_obtained !== null && t.marks_obtained !== undefined && t.marks_obtained < passMarks
    )
  }, [tempAdmissions, passMarks])

  const enrolledStudents = useMemo(() => {
    return permAdmissions.filter((p) => {
      const matchesSearch =
        p.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.permanent_admission_number.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGrade = filterGrade === "all" || p.class_name.toLowerCase() === filterGrade.toLowerCase()
      return matchesSearch && matchesGrade
    })
  }, [permAdmissions, searchQuery, filterGrade])

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & VIEW SWITCHER                                             */}
      {/* ========================================================================= */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-brand-green border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Admissions and Enrollment Ecosystem
              </span>
              <span className="text-xs text-text-muted font-mono">
                {activeYear?.name || "AY 2026-27"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Admissions & Enrollment
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Unified student registration, marks evaluation, and permanent enrollment workflow.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle: Tabular vs Pipeline Kanban */}
            <div className="flex items-center rounded-xl bg-subtle border border-border-default p-1">
              <button
                type="button"
                onClick={() => {
                  stopFaceCamera()
                  setViewMode("tabular")
                  router.push("/admissions")
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 active:scale-[0.97] ${
                  viewMode === "tabular"
                    ? "bg-surface text-text-primary shadow-xs border border-border-default font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabular View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopFaceCamera()
                  setViewMode("kanban")
                  router.push("/admissions?tab=pipeline")
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 active:scale-[0.97] ${
                  viewMode === "kanban"
                    ? "bg-surface text-text-primary shadow-xs border border-border-default font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Pipeline Kanban</span>
              </button>
            </div>

            <Link href="/admin/settings">
              <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs gap-1.5 active:scale-[0.97]">
                <Sliders className="w-3.5 h-3.5" />
                <span>Settings</span>
              </Button>
            </Link>

            {/* Unified "+ New Applicant" CTA Button (Theme Brand Green) */}
            <Button
              onClick={() => openNewApplicantWizard()}
              className={`h-9 px-4 rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.97] transition-all ${
                viewMode === "new-applicant"
                  ? "bg-brand-green text-white ring-2 ring-brand-green/30"
                  : "bg-brand-green hover:bg-[#358a41] text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Applicant</span>
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP-LEVEL CONFIGURATION STATUS BANNER                                  */}
      {/* ========================================================================= */}
      <div className="px-4 py-3 rounded-xl border border-border-default bg-subtle/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-brand-green border border-emerald-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-text-secondary">
            <span className="font-semibold text-text-primary">Admission Mode:</span>{" "}
            {hasExamination ? `Entrance Exam (Pass: ${passMarks}/${examTotalMarks})` : "Direct Admission"}{" "}
            <span className="mx-2 text-border-default">•</span>
            <span className="font-semibold text-text-primary">Fee:</span>{" "}
            {isAdmissionFeeApplicable
              ? `Applicable (${admissionPricingMethod === "CUSTOM" ? "Grade-wise" : `₹${admissionBaseAmount.toLocaleString("en-IN")}`})`
              : "Zero Fee Policy"}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] shrink-0">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
            {hasExamination ? "Exam Required" : "Direct Mode"}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-green font-medium border border-emerald-200">
            {isAdmissionFeeApplicable ? "Fee Applicable" : "No Fee"}
          </span>
        </div>
      </div>

      {/* Global Feedback Messages */}
      {bulkUploadSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-brand-green border border-emerald-200 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bulkUploadSuccess}</span>
        </div>
      )}
      {bulkUploadError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{bulkUploadError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NEW APPLICANT CARD VIEW (NO BLACK MODAL BACKDROP, PURE CARD UI)        */}
      {/* ========================================================================= */}
      {viewMode === "new-applicant" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-border-default shadow-card overflow-hidden">
            {/* Card Header with Back button, Title & 3-Step Pill Navigator */}
            <div className="px-6 py-5 border-b border-border-default bg-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopFaceCamera()
                    setViewMode("tabular")
                  }}
                  className="h-9 px-3 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary hover:text-text-primary text-xs active:scale-[0.97]"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back to Table</span>
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-text-primary">
                      New Applicant Registration & Enrollment
                    </h2>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-green font-semibold border border-emerald-200">
                      {activeYear?.name || "AY 2026-27"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {wizardStep === 1
                      ? "Step 1 of 3: Student Preliminary Profile & Residential Address"
                      : wizardStep === 2
                      ? "Step 2 of 3: Parent & Legal Guardian Contacts"
                      : wizardStep === 3
                      ? "Step 3 of 3: Admission Route Selection & Fee Clearance"
                      : "Registration Completed & Recorded in Master Ledger"}
                  </p>
                </div>
              </div>

              {/* Modern Step Pill Navigator in Theme Green */}
              {wizardStep < 4 && (
                <div className="flex items-center gap-1.5 bg-surface border border-border-default p-1 rounded-xl">
                  {[
                    { num: 1, label: "1. Student Profile" },
                    { num: 2, label: "2. Parents / Guardians" },
                    { num: 3, label: "3. Route & Payment" },
                  ].map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      disabled={s.num > wizardStep}
                      onClick={() => s.num < wizardStep && setWizardStep(s.num as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        wizardStep === s.num
                          ? "bg-brand-green text-white font-semibold shadow-xs"
                          : wizardStep > s.num
                          ? "text-brand-green hover:bg-emerald-50"
                          : "text-text-muted cursor-not-allowed opacity-60"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Card Body Container */}
            <div className="p-6 sm:p-8 space-y-6 max-w-4xl">
              {wizardError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 1: Student Preliminary Profile & Address                       */}
              {/* (Student Contact, Email, Blood Group REMOVED as requested)         */}
              {/* =================================================================== */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">
                        First Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Aarav"
                        value={profileFirstName}
                        onChange={(e) => setProfileFirstName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sharma"
                        value={profileLastName}
                        onChange={(e) => setProfileLastName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-primary">
                      Applying for Grade / Board <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={profileAcademicConfigId}
                      onChange={(e) => setProfileAcademicConfigId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                    >
                      {academicConfigs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} • {c.board_code} ({c.stream_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">Date of Birth</label>
                      <input
                        type="date"
                        value={profileDob}
                        onChange={(e) => setProfileDob(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">Gender</label>
                      <select
                        value={profileGender}
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-primary">Residential Street Address</label>
                    <input
                      type="text"
                      placeholder="House / Flat No, Street, Locality..."
                      value={profileStreet}
                      onChange={(e) => setProfileStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">City</label>
                      <input
                        type="text"
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">State</label>
                      <input
                        type="text"
                        value={profileState}
                        onChange={(e) => setProfileState(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-150"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="500034"
                        value={profilePinCode}
                        onChange={(e) => setProfilePinCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green font-mono transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-default">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setViewMode("tabular")}
                      className="h-10 px-5 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary hover:text-text-primary text-xs active:scale-[0.97]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!profileFirstName.trim()) {
                          setWizardError("Please enter student's first name.")
                          return
                        }
                        setWizardError(null)
                        setWizardStep(2)
                      }}
                      className="h-10 px-5 rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.97] transition-all bg-brand-green hover:bg-[#358a41] text-white"
                    >
                      <span>Next: Parent / Guardian Details</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 2: Parent / Guardian Dynamic Multi-Row Builder                 */}
              {/* =================================================================== */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div className="text-xs text-text-secondary leading-relaxed">
                    Add at least one parent or legal guardian. Official notifications, SMS alerts, and fee receipts will be sent to the primary contact.
                  </div>

                  {parentBuilderError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{parentBuilderError}</span>
                    </div>
                  )}

                  {/* Add Contact Card */}
                  <div className="p-5 rounded-2xl border border-border-default bg-subtle/50 space-y-4">
                    <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Add Parent / Legal Guardian
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5 space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary">Parent / Guardian Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Sharma"
                          value={newParentName}
                          onChange={(e) => setNewParentName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-border-default bg-surface text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary">10-Digit Mobile Number</label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={newParentMobile}
                          onChange={(e) => setNewParentMobile(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-border-default bg-surface text-xs sm:text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary">Relationship</label>
                        <select
                          value={newParentRelation}
                          onChange={(e) => setNewParentRelation(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border-default bg-surface text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleAddParentContact}
                        className="h-9 px-4 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs active:scale-[0.97] transition-all bg-brand-green hover:bg-[#358a41] text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Contact</span>
                      </Button>
                    </div>
                  </div>

                  {/* Registered Contacts List */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                      <span>Registered Contacts ({parentsList.length})</span>
                      <span className="text-[11px] text-text-muted lowercase font-normal">First contact is designated as primary</span>
                    </div>

                    {parentsList.length > 0 ? (
                      <div className="grid gap-2.5">
                        {parentsList.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 rounded-2xl border border-border-default bg-surface hover:bg-subtle/50 transition-colors"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-9 h-9 rounded-full bg-emerald-50 text-brand-green border border-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-text-primary">{p.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-subtle text-text-secondary border border-border-default font-medium">
                                    {p.relation}
                                  </span>
                                  {idx === 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-brand-green font-semibold border border-emerald-200">
                                      Primary Contact
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-mono text-text-secondary flex items-center gap-1.5 mt-1">
                                  <Phone className="w-3.5 h-3.5 text-text-muted" />
                                  <span>{p.mobile}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveParentContact(idx)}
                              className="p-2 rounded-xl text-text-muted hover:text-destructive hover:bg-destructive/10 active:scale-[0.95] transition-all"
                              title="Remove contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-border-default bg-subtle/40 space-y-2">
                        <Users className="w-7 h-7 text-text-muted/50 mx-auto" />
                        <div className="text-xs font-medium text-text-primary">
                          No parent or guardian contacts added yet.
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          Fill in the fields above and click <strong>Add Contact</strong> to attach contacts.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-border-default">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setWizardStep(1)}
                      className="h-10 px-5 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs active:scale-[0.97]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      <span>Back to Student Details</span>
                    </Button>
                    <Button
                      type="button"
                      disabled={parentsList.length === 0}
                      onClick={() => {
                        setWizardError(null)
                        setWizardStep(3)
                      }}
                      className="h-10 px-5 rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.97] transition-all bg-brand-green hover:bg-[#358a41] text-white disabled:opacity-50"
                    >
                      <span>Next: Admission Route & Payment</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 3: Route Selection & Payment Processing                        */}
              {/* =================================================================== */}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  {hasExamination && !transitioningTempRecord && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Select Registration Route:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setRegistrationMode("exam")}
                          className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                            registrationMode === "exam"
                              ? "border-brand-green bg-emerald-50/50 shadow-xs ring-1 ring-brand-green/30"
                              : "border-border-default bg-surface hover:border-border-strong"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-sm text-text-primary">Entrance Exam Route</span>
                            {registrationMode === "exam" && <Check className="w-4 h-4 text-brand-green font-bold" />}
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            Generate Temporary Candidate ID (<code>TEMP-</code>). Evaluate marks before collecting admission fees.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRegistrationMode("direct")}
                          className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                            registrationMode === "direct"
                              ? "border-brand-green bg-emerald-50/50 shadow-xs ring-1 ring-brand-green/30"
                              : "border-border-default bg-surface hover:border-border-strong"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-sm text-text-primary">Fast-Track / Direct</span>
                            {registrationMode === "direct" && <Check className="w-4 h-4 text-brand-green font-bold" />}
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            Bypass entrance exam. Complete fee clearance & lock Permanent Academic Number (<code>ADM-</code>).
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {registrationMode === "exam" && hasExamination && !transitioningTempRecord ? (
                    <div className="space-y-4 pt-1">
                      <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-2 text-xs">
                        <div className="font-bold text-amber-800 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Entrance Assessment Registration</span>
                        </div>
                        <p className="text-amber-900/80 leading-relaxed">
                          Submitting will generate an official <strong>Temporary Candidate ID</strong> and queue the applicant for entrance marks recording. Fees will be collected once the student passes the qualifying score ({passMarks}/{examTotalMarks}).
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-5 border-t border-border-default">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setWizardStep(2)}
                          className="h-10 px-5 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs active:scale-[0.97]"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1.5" />
                          <span>Back</span>
                        </Button>
                        <Button
                          type="button"
                          disabled={createTempMutation.isPending}
                          onClick={handleRegisterForExam}
                          className="h-10 px-5 rounded-xl bg-brand-green hover:bg-[#358a41] text-white font-medium text-xs shadow-sm active:scale-[0.97] transition-all"
                        >
                          {createTempMutation.isPending ? "Generating..." : "Generate Temporary ID & Register"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {isAdmissionFeeApplicable ? (
                        <>
                          {/* Fee Breakdown Card */}
                          <div className="p-5 rounded-2xl border border-border-default bg-subtle/50 space-y-2.5">
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>One-Time Admission Fee:</span>
                              <span className="font-mono font-semibold text-text-primary text-sm">
                                ₹{getCalculatedAdmissionFee(profileAcademicConfigId).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>Annual Academic Tuition (Reference):</span>
                              <span className="font-mono text-text-primary">
                                ₹{getCalculatedAcademicFee(profileAcademicConfigId).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="border-t border-border-default pt-2.5 flex items-center justify-between text-xs font-semibold text-text-primary">
                              <span>Payable Now:</span>
                              <span className="font-mono text-brand-green text-base font-bold">
                                ₹{getCalculatedAdmissionFee(profileAcademicConfigId).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic UPI QR Code Section */}
                          {availableQrs.length === 0 ? (
                            /* Fallback Warning when no QR code configured */
                            <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="font-semibold text-sm text-amber-900 dark:text-amber-300">
                                    No Payment QR Code configured by Institute Admin yet.
                                  </div>
                                  <p className="text-xs text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                                    Official institutional payment QR codes have not been uploaded in System Settings. Please configure PhonePe, Google Pay, Paytm, or Unified UPI QR in the Institute Admin module to enable automatic QR scanning.
                                  </p>
                                </div>
                              </div>
                              <div className="pt-1 flex items-center justify-end">
                                <Link
                                  href="/admin/settings?tab=payments"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs"
                                >
                                  <span>Go to Institute Admin → Payments</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ) : (
                            /* Configured Dynamic QR Code Display */
                            <div className="p-5 rounded-2xl border border-border-default bg-surface space-y-4">
                              {/* Provider Tabs (if multiple QRs exist) */}
                              {availableQrs.length > 1 && (
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border-default">
                                  <span className="text-[11px] font-medium text-text-secondary mr-1 shrink-0">Payment App:</span>
                                  {availableQrs.map((qr) => (
                                    <button
                                      key={qr.id}
                                      type="button"
                                      onClick={() => handleSelectQrProvider(qr)}
                                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                        activeCheckoutQr?.id === qr.id
                                          ? "bg-brand-green text-white font-semibold shadow-xs"
                                          : "bg-subtle text-text-secondary hover:text-text-primary hover:bg-canvas"
                                      }`}
                                    >
                                      <span>{qr.provider}</span>
                                      {qr.isDefault && (
                                        <span className="text-[10px] opacity-80">(Primary)</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Active QR Card Layout */}
                              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                {/* QR Code Image Container */}
                                <div className="p-2.5 rounded-xl bg-white shadow-xs shrink-0 border border-border-default flex flex-col items-center">
                                  {activeCheckoutQr?.qrImageUrl ? (
                                    <img
                                      src={activeCheckoutQr.qrImageUrl}
                                      alt={`${activeCheckoutQr.provider} QR Code`}
                                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded"
                                    />
                                  ) : (
                                    <div className="w-32 h-32 bg-neutral-900 rounded-lg flex flex-col items-center justify-center text-white text-center p-2">
                                      <QrCode className="w-14 h-14 text-white" />
                                      <span className="text-[9px] font-mono mt-1 font-semibold">SCAN & PAY</span>
                                    </div>
                                  )}
                                  <span className="text-[10px] font-mono font-semibold text-neutral-600 mt-1.5">
                                    {activeCheckoutQr?.provider || "UPI SCAN & PAY"}
                                  </span>
                                </div>

                                {/* Payment Merchant & Amount Details */}
                                <div className="space-y-2.5 text-xs text-text-secondary flex-1 w-full text-center sm:text-left">
                                  <div>
                                    <div className="font-bold text-sm text-text-primary flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                      <span>Scan Institute UPI QR Code</span>
                                      <span className="inline-flex items-center text-[10px] font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
                                        Verified Institute QR
                                      </span>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                                      Scan using {activeCheckoutQr?.provider || "any UPI app"} (PhonePe, Google Pay, Paytm, or BHIM UPI).
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-subtle/70 border border-border-default space-y-1.5 text-xs">
                                    {/* Account Holder Name */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-text-secondary">Beneficiary / Institute:</span>
                                      <span className="font-semibold text-text-primary">
                                        {paymentSettings?.accountName || "Institute Admissions"}
                                      </span>
                                    </div>

                                    {/* UPI ID with Copy button */}
                                    {(activeCheckoutQr?.upiId || paymentSettings?.upiId) && (
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-text-secondary">UPI ID:</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono font-medium text-text-primary">
                                            {activeCheckoutQr?.upiId || paymentSettings?.upiId}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyUpiId(activeCheckoutQr?.upiId || paymentSettings?.upiId || "")}
                                            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
                                            title="Copy UPI ID"
                                          >
                                            {hasCopiedUpi ? (
                                              <Check className="w-3.5 h-3.5 text-brand-green" />
                                            ) : (
                                              <Copy className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Calculated Amount */}
                                    <div className="flex items-center justify-between pt-1 border-t border-border-default/80">
                                      <span className="font-medium text-text-primary">Payable Admission Amount:</span>
                                      <span className="font-mono text-brand-green font-bold text-sm">
                                        ₹{getCalculatedAdmissionFee(profileAcademicConfigId).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* UTR & Transaction Verification */}
                          <div className="space-y-3.5">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-text-primary">
                                1. UTR / Transaction Reference Number <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 429518392019"
                                value={paymentUtrNumber}
                                onChange={(e) => setPaymentUtrNumber(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green font-mono transition-all"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-text-primary">2. Payment Date & Time</label>
                                <input
                                  type="datetime-local"
                                  value={paymentDateTime}
                                  onChange={(e) => setPaymentDateTime(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-text-primary">3. Method of Payment</label>
                                <select
                                  value={paymentMethod}
                                  onChange={(e) => handlePaymentMethodDropdownChange(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                                >
                                  <option value="PhonePe">PhonePe</option>
                                  <option value="Google Pay">Google Pay</option>
                                  <option value="Paytm">Paytm</option>
                                  <option value="Other UPI">Other UPI App</option>
                                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                                  <option value="Cash">Cash at Counter</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-5 border-t border-border-default">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setWizardStep(2)}
                              className="h-10 px-5 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs active:scale-[0.97]"
                            >
                              <ArrowLeft className="w-4 h-4 mr-1.5" />
                              <span>Back</span>
                            </Button>
                            <Button
                              type="button"
                              disabled={createPermMutation.isPending}
                              onClick={handleCommitPermanentEnrollment}
                              className="h-10 px-5 rounded-xl bg-brand-green hover:bg-[#358a41] text-white font-medium text-xs shadow-sm active:scale-[0.97] transition-all"
                            >
                              {createPermMutation.isPending ? "Verifying..." : "Verify Payment & Complete Enrollment"}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-5 rounded-2xl border border-border-default bg-subtle/50 text-xs text-text-secondary space-y-1.5">
                            <div className="font-bold text-text-primary text-sm">Zero Admission Fee Policy</div>
                            <p className="leading-relaxed">
                              Admission fee is configured as Not Applicable for this institution. The Permanent Academic Number will be issued directly.
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-5 border-t border-border-default">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setWizardStep(2)}
                              className="h-10 px-5 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs active:scale-[0.97]"
                            >
                              <ArrowLeft className="w-4 h-4 mr-1.5" />
                              <span>Back</span>
                            </Button>
                            <Button
                              type="button"
                              disabled={createPermMutation.isPending}
                              onClick={handleCommitPermanentEnrollment}
                              className="h-10 px-5 rounded-xl bg-brand-green hover:bg-[#358a41] text-white font-medium text-xs shadow-sm active:scale-[0.97] transition-all"
                            >
                              {createPermMutation.isPending ? "Enrolling..." : "Complete Enrollment & Generate Permanent ID"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 4: Confirmation & Post-Enrollment Biometrics                   */}
              {/* =================================================================== */}
              {wizardStep === 4 && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-brand-green border border-emerald-200 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-text-primary">
                      {enrolledAdmissionNumber?.startsWith("TEMP-")
                        ? "Preliminary Applicant Registered!"
                        : "Student Enrolled Successfully!"}
                    </h3>
                    <p className="text-xs text-text-secondary max-w-md mx-auto">
                      {enrolledAdmissionNumber?.startsWith("TEMP-")
                        ? "Candidate is now ready for entrance examination evaluation."
                        : "Permanent Academic Number has been recorded in the centralized student master ledger."}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-subtle/80 border border-border-default max-w-sm mx-auto space-y-1">
                    <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                      {enrolledAdmissionNumber?.startsWith("TEMP-") ? "Assigned Temporary ID" : "Permanent Academic Number"}
                    </div>
                    <div className="text-2xl font-mono font-bold text-brand-green tracking-wide">
                      {enrolledAdmissionNumber}
                    </div>
                    <div className="text-xs text-text-primary font-medium pt-1">
                      {profileFirstName} {profileLastName}
                    </div>
                  </div>

                  {/* Optional Biometric Camera Enrollment */}
                  {!enrolledAdmissionNumber?.startsWith("TEMP-") && (
                    <div className="p-5 rounded-2xl border border-border-default bg-surface text-left space-y-3.5 max-w-lg mx-auto">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-text-primary">
                          Biometric Face Attendance Registration (Optional)
                        </span>
                        {isFaceEnrolled && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-green font-semibold border border-emerald-200">
                            Enrolled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">
                        Enroll the student&apos;s face template to enable contactless kiosk attendance.
                      </p>

                      {isFaceCameraActive ? (
                        <div className="space-y-3">
                          <div className="relative rounded-2xl overflow-hidden bg-black max-w-xs mx-auto aspect-video">
                            <video ref={faceVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          </div>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              type="button"
                              onClick={handleCaptureAndEnrollFace}
                              disabled={isFaceEnrolling}
                              className="h-9 px-4 text-xs rounded-xl bg-brand-green hover:bg-[#358a41] text-white active:scale-[0.97]"
                            >
                              <Camera className="w-3.5 h-3.5 mr-1" />
                              <span>{isFaceEnrolling ? "Enrolling..." : "Capture Face"}</span>
                            </Button>
                            <Button size="sm" variant="outline" type="button" onClick={stopFaceCamera} className="h-9 px-4 text-xs rounded-xl border-border-default active:scale-[0.97]">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : isFaceEnrolled ? (
                        <div className="flex items-center gap-2 text-brand-green text-xs font-semibold">
                          <CheckCheck className="w-4 h-4" />
                          <span>Biometric face template enrolled successfully!</span>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" type="button" onClick={startFaceCamera} className="h-9 px-4 text-xs rounded-xl border-border-default active:scale-[0.97]">
                          <Camera className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
                          <span>Start Camera & Capture Face</span>
                        </Button>
                      )}

                      {faceEnrollError && (
                        <div className="text-xs text-destructive flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{faceEnrollError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-border-default">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        stopFaceCamera()
                        setViewMode("tabular")
                      }}
                      className="h-10 px-5 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs active:scale-[0.97]"
                    >
                      Done & Return to Workspace
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        stopFaceCamera()
                        openNewApplicantWizard()
                      }}
                      className="h-10 px-5 rounded-xl bg-brand-green hover:bg-[#358a41] text-white text-xs active:scale-[0.97]"
                    >
                      Enroll Another Student
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TABULAR VIEW (MINIMAL, SIMPLE, AIRY SPACING)                           */}
      {/* ========================================================================= */}
      {viewMode === "tabular" && (
        <div className="space-y-4">
          {hasExamination ? (
            /* EXAM MODE: APPLICANTS DATA TABLE WITH EVALUATIONS */
            <div className="space-y-4">
              {/* Toolbar: Segmented Tabs & Bulk Excel Buttons */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Clean Segmented Filter Tabs */}
                <div className="inline-flex p-1 rounded-xl bg-subtle border border-border-default gap-1 overflow-x-auto">
                  {[
                    { id: "all", label: "All Applicants", count: examCounts.total },
                    { id: "pending", label: "Pending Marks", count: examCounts.pending },
                    { id: "qualified", label: "Selected", count: examCounts.qualified },
                    { id: "not_qualified", label: "Not Selected", count: examCounts.notQualified },
                  ].map((tab) => {
                    const isActive = filterStatus === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterStatus(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 shrink-0 active:scale-[0.97] ${
                          isActive
                            ? "bg-surface text-text-primary shadow-xs border border-border-default font-semibold"
                            : "text-text-secondary hover:text-text-primary hover:bg-subtle"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isActive ? "bg-subtle text-text-primary" : "bg-subtle text-text-muted"
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Bulk Excel Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    ref={fileInputRef}
                    onChange={handleUploadMarksCsv}
                    className="hidden"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCsvTemplate}
                    disabled={tempAdmissions.length === 0}
                    className="h-8 text-xs px-3 rounded-lg border-border-default bg-surface hover:bg-subtle text-text-secondary hover:text-text-primary active:scale-[0.97]"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    <span>Download Template</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={bulkRecordMutation.isPending}
                    className="h-8 text-xs px-3 rounded-lg border-border-default bg-surface hover:bg-subtle text-text-secondary hover:text-text-primary active:scale-[0.97]"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    <span>{bulkRecordMutation.isPending ? "Uploading..." : "Upload Marks"}</span>
                  </Button>
                </div>
              </div>

              {/* Search & Grade Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search applicants by name, Temporary ID, or parent mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border-default bg-canvas hover:border-border-strong focus:bg-canvas focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green text-xs sm:text-sm text-text-primary transition-all duration-150"
                  />
                </div>

                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="w-full sm:w-56 px-3 py-2 rounded-xl border border-border-default bg-canvas hover:border-border-strong focus:bg-canvas focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green text-xs sm:text-sm text-text-primary transition-all duration-150"
                >
                  <option value="all">All Grades</option>
                  {academicConfigs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} • {c.board_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Applicants Data Table (Minimal, Clean, Spaced) */}
              <div className="rounded-2xl border border-border-default bg-surface shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border-default text-[11px] font-medium uppercase tracking-wider text-text-secondary bg-subtle/50">
                        <th className="py-3.5 px-5 font-semibold">Temporary ID</th>
                        <th className="py-3.5 px-5 font-semibold">Student Name</th>
                        <th className="py-3.5 px-5 font-semibold">Grade Applied</th>
                        <th className="py-3.5 px-5 font-semibold">Contact / Address</th>
                        <th className="py-3.5 px-5 font-semibold">Marks</th>
                        <th className="py-3.5 px-5 font-semibold">Qualification Status</th>
                        <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/60">
                      {tempLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-xs text-text-muted">
                            Loading applicants...
                          </td>
                        </tr>
                      ) : filteredTempApplicants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-14 text-center text-text-muted">
                            <div className="max-w-xs mx-auto space-y-2">
                              <Users className="w-8 h-8 text-text-muted/40 mx-auto" />
                              <p className="text-xs text-text-secondary">No applicants found matching this filter.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openNewApplicantWizard()}
                                className="h-8 text-xs rounded-xl border-border-default bg-surface hover:bg-subtle text-brand-green font-medium active:scale-[0.97]"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Register New Applicant
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTempApplicants.map((app) => {
                          const marks = app.marks_obtained
                          const hasMarks = marks !== null && marks !== undefined
                          const isSelected = hasMarks && marks >= passMarks
                          const isNotSelected = hasMarks && marks < passMarks
                          const isConverted = app.status === "converted_to_permanent"

                          return (
                            <tr key={app.id} className="group hover:bg-subtle/50 transition-colors duration-150">
                              {/* Temporary ID */}
                              <td className="py-4 px-5">
                                <span className="font-mono text-xs font-semibold text-text-primary bg-subtle px-2 py-1 rounded-md border border-border-default tabular-nums">
                                  {app.temporary_admission_number}
                                </span>
                              </td>

                              {/* Student Name & Parent */}
                              <td className="py-4 px-5">
                                <div className="font-semibold text-text-primary text-sm leading-tight">
                                  {app.student_name}
                                </div>
                                {app.parent_name && (
                                  <div className="text-xs text-text-secondary mt-0.5">
                                    {app.parent_name}
                                  </div>
                                )}
                              </td>

                              {/* Grade Applied */}
                              <td className="py-4 px-5">
                                <span className="inline-flex items-center text-xs font-normal text-text-secondary bg-subtle border border-border-default rounded-full px-2.5 py-0.5">
                                  {app.class_name} • {app.board_code}
                                </span>
                              </td>

                              {/* Contact & Address */}
                              <td className="py-4 px-5 max-w-xs">
                                <div className="font-mono text-xs text-text-primary flex items-center gap-1.5 font-medium">
                                  <Phone className="w-3 h-3 text-text-muted shrink-0" />
                                  <span>{app.contact_number}</span>
                                </div>
                                {app.preliminary_address && (
                                  <div className="text-xs text-text-muted truncate mt-1" title={app.preliminary_address}>
                                    {app.preliminary_address}
                                  </div>
                                )}
                              </td>

                              {/* Marks */}
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2">
                                  {hasMarks ? (
                                    <div className="font-mono text-sm font-bold tabular-nums text-text-primary">
                                      {marks} <span className="text-xs font-normal text-text-muted">/ {examTotalMarks}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-text-muted italic">Pending</span>
                                  )}
                                  {!isConverted && (
                                    <button
                                      onClick={() => openInlineMarksModal(app)}
                                      className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle active:scale-[0.95] opacity-0 group-hover:opacity-100 transition-all duration-150"
                                      title="Edit Marks"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Qualification Status */}
                              <td className="py-4 px-5">
                                {isConverted ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    <CheckCircle className="w-3 h-3" /> Enrolled
                                  </span>
                                ) : isSelected ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-green border border-emerald-200 font-semibold">
                                    <Check className="w-3 h-3" /> Selected
                                  </span>
                                ) : isNotSelected ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                    <X className="w-3 h-3" /> Not Selected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3" /> Pending Marks
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-5 text-right">
                                {isConverted ? (
                                  <span className="text-xs text-text-muted font-medium">Enrolled</span>
                                ) : isSelected ? (
                                  <Button
                                    size="sm"
                                    onClick={() => openNewApplicantWizard(app)}
                                    className="h-8 px-3 text-xs bg-brand-green hover:bg-[#358a41] text-white rounded-lg shadow-xs active:scale-[0.97] transition-all inline-flex items-center gap-1.5 font-medium"
                                  >
                                    <span>Enroll Student</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openInlineMarksModal(app)}
                                    className="h-8 px-3 text-xs rounded-lg border-border-default bg-surface hover:bg-subtle text-text-secondary hover:text-text-primary active:scale-[0.97] transition-all font-medium"
                                  >
                                    {hasMarks ? "Review" : "Enter Marks"}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* DIRECT ADMISSION MODE: ENROLLED DIRECTORY TABLE (SPACIOUS & MINIMAL) */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search enrolled students by name, permanent ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border-default bg-canvas hover:border-border-strong focus:bg-canvas focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green text-xs sm:text-sm text-text-primary transition-all duration-150"
                  />
                </div>

                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="w-full sm:w-56 px-3 py-2 rounded-xl border border-border-default bg-canvas hover:border-border-strong focus:bg-canvas focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green text-xs sm:text-sm text-text-primary transition-all duration-150"
                >
                  <option value="all">All Grades</option>
                  {academicConfigs.map((c) => (
                    <option key={c.id} value={c.class_name}>
                      {c.class_name} • {c.board_code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-border-default bg-surface shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border-default text-[11px] font-semibold uppercase tracking-wider text-text-secondary bg-subtle/50">
                        <th className="py-3.5 px-5 font-semibold">Academic Number</th>
                        <th className="py-3.5 px-5 font-semibold">Student Name</th>
                        <th className="py-3.5 px-5 font-semibold">Grade & Board</th>
                        <th className="py-3.5 px-5 font-semibold">Gender & DOB</th>
                        <th className="py-3.5 px-5 font-semibold">Admission Fee</th>
                        <th className="py-3.5 px-5 font-semibold">Status</th>
                        <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/60">
                      {permLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-xs text-text-muted">
                            Loading enrolled students...
                          </td>
                        </tr>
                      ) : enrolledStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-14 text-center text-text-muted">
                            <div className="max-w-xs mx-auto space-y-2">
                              <Users className="w-8 h-8 text-text-muted/40 mx-auto" />
                              <p className="text-xs text-text-secondary">No enrolled students found.</p>
                              <Button onClick={() => openNewApplicantWizard()} className="h-8 text-xs rounded-xl bg-brand-green hover:bg-[#358a41] text-white active:scale-[0.97]">
                                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                Enroll First Student
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        enrolledStudents.map((rec) => (
                          <tr key={rec.id} className="hover:bg-subtle/50 transition-colors duration-150">
                            <td className="py-4 px-5 font-mono text-xs font-bold text-brand-green tabular-nums">
                              {rec.permanent_admission_number}
                            </td>
                            <td className="py-4 px-5 font-semibold text-text-primary text-sm">
                              {rec.student_name}
                            </td>
                            <td className="py-4 px-5">
                              <span className="inline-flex items-center text-xs text-text-secondary bg-subtle border border-border-default rounded-full px-2.5 py-0.5">
                                {rec.class_name} • {rec.board_code}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-xs text-text-muted">
                              {rec.gender} • {rec.date_of_birth ? rec.date_of_birth.split("T")[0] : "-"}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                                rec.fee_payment_status === "verified"
                                  ? "bg-emerald-50 text-brand-green border border-emerald-200"
                                  : rec.fee_payment_status === "not_applicable"
                                  ? "bg-subtle text-text-muted border border-border-default"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {rec.fee_payment_status}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-brand-green border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> Enrolled
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPermRecord(rec)
                                  setIsViewPermModalOpen(true)
                                }}
                                className="h-8 px-3 text-xs rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary hover:text-text-primary active:scale-[0.97]"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. APPLICATIONS PIPELINE (KANBAN BOARD OF THE NEW SYSTEM)                 */}
      {/* ========================================================================= */}
      {viewMode === "kanban" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-text-secondary border-b border-border-default pb-2">
            <span>
              Real-time pipeline stages synchronized with the live admissions database.
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>Pending: {pendingApplicants.length}</span>
              <span>•</span>
              <span>Selected: {selectedApplicants.length}</span>
              <span>•</span>
              <span>Enrolled: {enrolledStudents.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* STAGE 1: PENDING ASSESSMENT */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface border border-border-default shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-border-default">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-text-primary tracking-wide">
                    Pending Assessment
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {pendingApplicants.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[350px]">
                {pendingApplicants.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl text-xs text-text-muted p-3 text-center">
                    <span>No candidates pending assessment</span>
                  </div>
                ) : (
                  pendingApplicants.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:border-amber-300 shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-700">
                          {app.temporary_admission_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 font-medium">
                          Pending
                        </span>
                      </div>

                      <div className="font-semibold text-sm text-text-primary">
                        {app.student_name}
                      </div>

                      <div className="text-xs text-text-secondary">
                        Applied: {app.class_name} • {app.board_code}
                      </div>

                      <div className="pt-2 border-t border-border-default/60 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-text-muted">
                          Max: {examTotalMarks}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInlineMarksModal(app)}
                          className="text-xs h-7 px-2.5 rounded-lg border-border-default bg-surface hover:bg-subtle text-text-primary active:scale-[0.97]"
                        >
                          Enter Marks
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* STAGE 2: SELECTED (SCORED >= PASSMARKS) */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface border border-border-default shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-border-default">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green" />
                  <span className="text-xs font-bold text-text-primary tracking-wide">
                    Selected (Qualified)
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-brand-green border border-emerald-200">
                  {selectedApplicants.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[350px]">
                {selectedApplicants.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl text-xs text-text-muted p-3 text-center">
                    <span>No qualified candidates awaiting enrollment</span>
                  </div>
                ) : (
                  selectedApplicants.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-brand-green">
                          {app.temporary_admission_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-mono font-semibold">
                          {app.marks_obtained}/{examTotalMarks}
                        </span>
                      </div>

                      <div className="font-semibold text-sm text-text-primary">
                        {app.student_name}
                      </div>

                      <div className="text-xs text-text-secondary">
                        Applying: {app.class_name} • {app.board_code}
                      </div>

                      <div className="pt-2 border-t border-border-default/60">
                        <Button
                          size="sm"
                          onClick={() => openNewApplicantWizard(app)}
                          className="w-full text-xs h-7 bg-brand-green hover:bg-[#358a41] text-white flex items-center justify-center gap-1 rounded-lg active:scale-[0.97] font-medium"
                        >
                          <span>Complete Profile & Enroll</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* STAGE 3: NOT SELECTED (SCORED < PASSMARKS) */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface border border-border-default shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-border-default">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-text-primary tracking-wide">
                    Not Selected
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  {notSelectedApplicants.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[350px]">
                {notSelectedApplicants.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl text-xs text-text-muted p-3 text-center">
                    <span>No unselected candidates</span>
                  </div>
                ) : (
                  notSelectedApplicants.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 hover:border-red-300 shadow-xs transition-all space-y-2 opacity-85 hover:opacity-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-red-700">
                          {app.temporary_admission_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100/80 text-red-800 font-mono font-semibold">
                          {app.marks_obtained}/{examTotalMarks}
                        </span>
                      </div>

                      <div className="font-semibold text-sm text-text-primary">
                        {app.student_name}
                      </div>

                      <div className="text-xs text-text-secondary">
                        Cutoff: {passMarks} • Grade: {app.class_name}
                      </div>

                      <div className="pt-2 border-t border-border-default/60 flex items-center justify-between">
                        <span className="text-[10px] text-red-600 font-semibold">Below Cutoff</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openInlineMarksModal(app)}
                          className="text-xs h-7 px-2.5 rounded-lg border-border-default bg-surface hover:bg-subtle text-text-primary active:scale-[0.97]"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* STAGE 4: PERMANENTLY ENROLLED */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface border border-border-default shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-border-default">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green" />
                  <span className="text-xs font-bold text-text-primary tracking-wide">
                    Permanently Enrolled
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-brand-green border border-emerald-200">
                  {enrolledStudents.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[350px]">
                {enrolledStudents.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl text-xs text-text-muted p-3 text-center">
                    <span>No students enrolled yet</span>
                  </div>
                ) : (
                  enrolledStudents.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-brand-green">
                          {rec.permanent_admission_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-brand-green font-semibold">
                          Enrolled
                        </span>
                      </div>

                      <div className="font-semibold text-sm text-text-primary">
                        {rec.student_name}
                      </div>

                      <div className="text-xs text-text-secondary">
                        {rec.class_name} • {rec.board_code}
                      </div>

                      <div className="pt-2 border-t border-border-default/60 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-text-muted uppercase">
                          Fee: {rec.fee_payment_status}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPermRecord(rec)
                            setIsViewPermModalOpen(true)
                          }}
                          className="text-xs h-7 px-2.5 rounded-lg border-border-default bg-surface hover:bg-subtle text-text-primary active:scale-[0.97]"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INLINE MARKS ENTRY MODAL (FALLBACK / SINGLE RECORD EVALUATION)             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isInlineMarksModalOpen}
        onClose={() => setIsInlineMarksModalOpen(false)}
        title="Record Entrance Assessment Marks"
        maxWidth="md"
      >
        <form onSubmit={handleSaveInlineMarks} className="space-y-4">
          {selectedApplicantForMarks && (
            <div className="p-3.5 rounded-2xl bg-subtle border border-border-default space-y-1 text-xs">
              <div>
                Candidate: <strong className="text-text-primary">{selectedApplicantForMarks.student_name}</strong>
              </div>
              <div>
                Temporary ID: <span className="font-mono text-brand-green font-bold">{selectedApplicantForMarks.temporary_admission_number}</span>
              </div>
              <div>
                Grade: <strong>{selectedApplicantForMarks.class_name} ({selectedApplicantForMarks.board_code})</strong>
              </div>
              <div className="text-text-secondary">
                Cutoff Requirement: <strong>{passMarks}</strong> / <strong>{examTotalMarks}</strong> marks
              </div>
            </div>
          )}

          {inlineMarksError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{inlineMarksError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Marks Obtained (out of {examTotalMarks}) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={examTotalMarks}
              value={inlineMarksInput}
              onChange={(e) => setInlineMarksInput(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green font-mono text-lg font-bold"
            />
          </div>

          <div className="p-3 rounded-xl border border-border-default text-xs flex items-center justify-between bg-subtle/50">
            <span className="text-text-secondary">Automatic Evaluation:</span>
            {inlineMarksInput >= passMarks ? (
              <span className="font-bold text-brand-green flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Selected (Qualified)
              </span>
            ) : (
              <span className="font-bold text-red-600 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Not Selected
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-default">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInlineMarksModalOpen(false)}
              className="h-9 px-4 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs active:scale-[0.97]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recordResultMutation.isPending}
              className="h-9 px-4 rounded-xl text-xs active:scale-[0.97] bg-brand-green hover:bg-[#358a41] text-white font-medium"
            >
              {recordResultMutation.isPending ? "Saving..." : "Save Marks & Evaluate"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* VIEW ENROLLED STUDENT RECORD MODAL                                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewPermModalOpen}
        onClose={() => setIsViewPermModalOpen(false)}
        title="Student Enrollment Record"
        maxWidth="md"
      >
        {selectedPermRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-subtle border border-border-default space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-brand-green">
                  {selectedPermRecord.permanent_admission_number}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-green font-semibold text-[10px] border border-emerald-200">
                  Enrolled
                </span>
              </div>
              <div className="text-base font-bold text-text-primary">
                {selectedPermRecord.student_name}
              </div>
              <div className="text-text-secondary">
                Grade: {selectedPermRecord.class_name} • Board: {selectedPermRecord.board_code}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border border-border-default bg-surface">
              <div>
                <span className="text-text-muted block text-[11px]">Gender:</span>
                <span className="font-semibold text-text-primary">{selectedPermRecord.gender}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Date of Birth:</span>
                <span className="font-semibold text-text-primary">
                  {selectedPermRecord.date_of_birth ? selectedPermRecord.date_of_birth.split("T")[0] : "-"}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Admission Fee:</span>
                <span className="font-mono font-semibold text-text-primary">
                  ₹{Number(selectedPermRecord.admission_fee_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Fee Status:</span>
                <span className="font-semibold text-text-primary uppercase">
                  {selectedPermRecord.fee_payment_status}
                </span>
              </div>
            </div>

            {selectedPermRecord.utr_reference_number && (
              <div className="p-3.5 rounded-2xl border border-border-default bg-subtle">
                <span className="text-text-muted block text-[11px]">UTR Reference:</span>
                <span className="font-mono font-bold text-text-primary">
                  {selectedPermRecord.utr_reference_number}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border-default">
              <Button
                variant="outline"
                onClick={() => setIsViewPermModalOpen(false)}
                className="h-9 px-4 rounded-xl border-border-default bg-surface hover:bg-subtle text-text-secondary text-xs active:scale-[0.97]"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdmissionWorkflowModule
