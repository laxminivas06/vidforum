"use client"

import React, { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import {
  Button,
  Badge,
  Card,
  SlideOver,
  ConfirmDialog,
  Table,
  TableColumn,
} from "@/components/ui"
import {
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  Mail,
  UserCheck,
  XCircle,
  ExternalLink,
  ChevronRight,
  Upload,
  Download,
  AlertCircle,
  X,
  FileSpreadsheet,
  GraduationCap,
  Users,
  Calendar,
  Sparkles,
  Info,
  HeartPulse,
  Home,
  Shield,
  Layers,
  Banknote,
  Zap,
} from "lucide-react"
import {
  useAdmissions,
  useAcademics,
  useAcademicYears,
  useEnrollmentCounts,
} from "@/lib/api/hooks"
import { Applicant, AdmissionStage } from "@/types"

const STAGES: { key: AdmissionStage; label: string; color: string }[] = [
  { key: "INQUIRY", label: "Inquiry", color: "bg-neutral-500" },
  { key: "APPLIED", label: "Applied", color: "bg-blue-500" },
  { key: "DOCUMENT_VERIFICATION", label: "Doc Verification", color: "bg-amber-500" },
  { key: "INTERVIEW", label: "Interview / Exam", color: "bg-purple-500" },
  { key: "APPROVED", label: "Approved", color: "bg-brand-primary" },
  { key: "ENROLLED", label: "Enrolled (Active)", color: "bg-emerald-600" },
]

function calculateAge(dobStr: string): { years: number; text: string } | null {
  if (!dobStr) return null
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  let years = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    years--
  }
  return {
    years,
    text: `${years} yr${years === 1 ? "" : "s"} old`,
  }
}

interface ParsedApplicantRow {
  rowNumber: number
  applicantName: string
  dateOfBirth: string
  gender: string
  gradeApplying: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  entranceScore?: string
  feeAmount?: string
  feeStatus?: string
  notes?: string
  isValid: boolean
  errors: string[]
}

export default function AdmissionsPage() {
  const router = useRouter()
  const {
    data: applicants = [],
    isLoading,
    updateStage,
    approveApplicant,
    createApplicant,
    bulkImportApplicants,
  } = useAdmissions()

  const { data: academicGrades = [] } = useAcademics()
  const { data: academicYears = [] } = useAcademicYears()
  const { data: enrollmentCounts = [] } = useEnrollmentCounts()

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("ALL")
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [enrollingApplicant, setEnrollingApplicant] = useState(false)
  const [enrollingApplicantId, setEnrollingApplicantId] = useState<string | null>(null)
  const [advancingApplicantId, setAdvancingApplicantId] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Filtered applicants
  const filteredApplicants = applicants.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGrade = selectedGrade === "ALL" || app.gradeApplying.includes(selectedGrade)
    return matchesSearch && matchesGrade
  })

  // Table Columns
  const tableColumns: TableColumn<Applicant>[] = [
    {
      header: "Applicant",
      key: "studentName",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.studentName}</div>
          <div className="text-xs text-text-secondary font-mono">{item.applicationNumber}</div>
        </div>
      ),
    },
    {
      header: "Grade",
      key: "gradeApplying",
      render: (item) => <span className="text-xs font-mono">{item.gradeApplying}</span>,
    },
    {
      header: "Parent Contact",
      key: "parentPhone",
      render: (item) => (
        <div>
          <div className="text-xs text-text-primary">{item.parentName}</div>
          <div className="text-xs text-text-secondary font-mono">{item.parentPhone}</div>
        </div>
      ),
    },
    {
      header: "Fee",
      key: "feePaid",
      render: (item) => (
        <Badge variant={item.feePaid ? "positive" : "warning"}>
          {item.feePaid
            ? `PAID ₹${(item.feeAmount || 2500).toLocaleString("en-IN")}`
            : item.feeAmount
            ? `DUE ₹${item.feeAmount.toLocaleString("en-IN")}`
            : "UNPAID"}
        </Badge>
      ),
    },
    {
      header: "Stage",
      key: "stage",
      render: (item) => <Badge variant="neutral">{item.stage.replace("_", " ")}</Badge>,
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          {item.stage !== "ENROLLED" ? (
            <>
              <Button
                size="dense"
                variant="secondary"
                disabled={advancingApplicantId === item.id || enrollingApplicantId === item.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAdvanceStage(item)
                }}
                trailingIcon={<ChevronRight className="w-3.5 h-3.5" />}
                title={`Advance ${item.studentName} to next stage`}
              >
                {advancingApplicantId === item.id ? "Moving..." : "Next Stage"}
              </Button>
              <Button
                size="dense"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                leadingIcon={<UserCheck className="w-3.5 h-3.5" />}
                disabled={enrollingApplicantId === item.id || advancingApplicantId === item.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDirectEnroll(item)
                }}
                title={`Directly enroll ${item.studentName} into active roster`}
              >
                {enrollingApplicantId === item.id ? "Enrolling..." : "Direct Enroll"}
              </Button>
            </>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono pr-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
            </span>
          )}
          <Button
            size="dense"
            variant="ghost"
            onClick={() => setSelectedApplicant(item)}
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ]

  const handleDirectEnroll = async (applicant: Applicant) => {
    try {
      setEnrollingApplicantId(applicant.id)
      setActionError(null)
      const res = await approveApplicant(applicant.id)
      const studentId = res?.student?.id || applicant.id
      const admNum = res?.admissionNumber || res?.student?.admission_number || res?.student?.admissionNumber || ""
      setActionSuccess(
        `Successfully enrolled ${applicant.studentName}! Admission #: ${admNum}. Redirecting to Student Master Profile...`
      )
      if (selectedApplicant?.id === applicant.id) {
        setSelectedApplicant(null)
      }
      setTimeout(() => {
        router.push(`/students/${studentId}`)
      }, 1200)
    } catch (err: any) {
      console.error("Direct enrollment failed:", err)
      setActionError(err.message || "Failed to directly enroll applicant")
      setTimeout(() => setActionError(null), 6000)
    } finally {
      setEnrollingApplicantId(null)
    }
  }

  const handleEnroll = async (applicant: Applicant) => {
    try {
      setEnrollingApplicant(true)
      const res = await approveApplicant(applicant.id)
      const studentId = res?.student?.id || applicant.id
      setSelectedApplicant(null)
      router.push(`/students/${studentId}`)
    } catch (err: any) {
      console.error("Failed to enroll applicant:", err)
    } finally {
      setEnrollingApplicant(false)
    }
  }

  const handleAdvanceStage = async (applicant: Applicant) => {
    const stageOrder: AdmissionStage[] = [
      "INQUIRY",
      "APPLIED",
      "DOCUMENT_VERIFICATION",
      "INTERVIEW",
      "APPROVED",
      "ENROLLED",
    ]
    const currentIndex = stageOrder.indexOf(applicant.stage)
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1]
      if (nextStage === "ENROLLED") {
        await handleDirectEnroll(applicant)
        return
      }
      try {
        setAdvancingApplicantId(applicant.id)
        setActionError(null)
        await updateStage({ applicantId: applicant.id, newStage: nextStage })
        setActionSuccess(`Advanced ${applicant.studentName} to stage: ${nextStage.replace("_", " ")}`)
        setTimeout(() => setActionSuccess(null), 4000)
        if (selectedApplicant?.id === applicant.id) {
          setSelectedApplicant({ ...applicant, stage: nextStage })
        }
      } catch (err: any) {
        console.error("Failed to advance stage:", err)
        setActionError(err.message || "Failed to advance applicant stage")
        setTimeout(() => setActionError(null), 5000)
      } finally {
        setAdvancingApplicantId(null)
      }
    }
  }

  const handleReject = async () => {
    if (selectedApplicant) {
      await updateStage({ applicantId: selectedApplicant.id, newStage: "REJECTED" })
      setRejectDialogOpen(false)
      setSelectedApplicant(null)
    }
  }

  return (
    <AppShell
      pageTitle="Admissions Desk"
      breadcrumbs={[{ label: "Core" }, { label: "Admissions Desk" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border-default bg-surface p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-action-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-action-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              title="Directory Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setIsBulkModalOpen(true)}
          >
            Bulk Applicants
          </Button>

          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsRegisterModalOpen(true)}
          >
            New Applicant
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Direct Action Notification Alerts */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-between text-xs font-semibold animate-in fade-in shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs font-semibold animate-in fade-in shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="p-1 hover:bg-rose-500/20 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or application #..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-action-primary text-text-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-text-secondary font-medium">Grade Filter:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 font-medium text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Grades</option>
              {academicGrades.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Content */}
        {viewMode === "table" ? (
          <Table
            data={filteredApplicants}
            columns={tableColumns}
            keyExtractor={(item) => item.id}
            loading={isLoading}
            cardTitle={(item) => item.studentName}
            cardSubtitle={(item) => item.applicationNumber}
            cardBadge={(item) => <Badge variant="neutral">{item.stage}</Badge>}
          />
        ) : (
          /* Kanban Board */
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
            {STAGES.map((stage) => {
              const stageApplicants = filteredApplicants.filter((a) => a.stage === stage.key)
              return (
                <div
                  key={stage.key}
                  className="w-72 sm:w-80 shrink-0 flex flex-col gap-3 p-3 rounded-xl bg-subtle border border-border-default snap-start"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                      <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                        {stage.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface border border-border-default font-semibold text-text-secondary">
                      {stageApplicants.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex flex-col gap-2.5 min-h-[300px]">
                    {stageApplicants.length === 0 ? (
                      <div className="h-32 flex items-center justify-center border border-dashed border-border-default rounded-lg text-xs text-text-muted">
                        No applicants in stage
                      </div>
                    ) : (
                      stageApplicants.map((applicant) => (
                        <div
                          key={applicant.id}
                          onClick={() => setSelectedApplicant(applicant)}
                          className="p-3.5 rounded-lg bg-surface border border-border-default hover:border-action-primary/50 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-text-primary">
                              {applicant.studentName}
                            </span>
                            <Badge variant={applicant.feePaid ? "positive" : "warning"}>
                              {applicant.feePaid
                                ? `Paid ₹${(applicant.feeAmount || 2500).toLocaleString("en-IN")}`
                                : applicant.feeAmount
                                ? `Due ₹${applicant.feeAmount.toLocaleString("en-IN")}`
                                : "Unpaid"}
                            </Badge>
                          </div>

                          <div className="font-mono text-xs text-text-secondary mt-1">
                            {applicant.applicationNumber}
                          </div>

                          <div className="flex items-center justify-between text-xs text-text-muted mt-2 pt-2 border-t border-border-subtle">
                            <span>{applicant.gradeApplying}</span>
                            <span className="font-mono">{applicant.appliedDate}</span>
                          </div>

                          {applicant.documentsSubmitted && applicant.documentsSubmitted.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-2">
                              <FileText className="w-3 h-3 text-text-muted" />
                              <span>
                                {
                                  applicant.documentsSubmitted.filter(
                                    (d) => d.status === "VERIFIED"
                                  ).length
                                }
                                /{applicant.documentsSubmitted.length} Docs Verified
                              </span>
                            </div>
                          )}

                          {/* Two Options: Next Stage and Direct Enroll */}
                          {applicant.stage !== "ENROLLED" ? (
                            <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                disabled={advancingApplicantId === applicant.id || enrollingApplicantId === applicant.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAdvanceStage(applicant)
                                }}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-canvas hover:bg-subtle text-text-primary border border-border-default hover:border-action-primary/50 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                title={`Advance ${applicant.studentName} to next stage`}
                              >
                                <span>{advancingApplicantId === applicant.id ? "Moving..." : "Next Stage"}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                              </button>

                              <button
                                type="button"
                                disabled={enrollingApplicantId === applicant.id || advancingApplicantId === applicant.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDirectEnroll(applicant)
                                }}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                title={`Directly enroll ${applicant.studentName} into active student roster`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>
                                  {enrollingApplicantId === applicant.id ? "Enrolling..." : "Direct Enroll"}
                                </span>
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Direct Enrolled
                              </span>
                              <Link
                                href={`/students/${applicant.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-brand-primary hover:underline font-semibold"
                              >
                                Profile →
                              </Link>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SlideOver Detail Drawer */}
      <SlideOver
        open={selectedApplicant !== null}
        onClose={() => setSelectedApplicant(null)}
        title={selectedApplicant?.studentName || "Applicant Detail"}
        subtitle={selectedApplicant?.applicationNumber}
        footer={
          selectedApplicant && (
            <div className="flex items-center justify-between gap-3 w-full">
              <Button
                variant="destructive"
                size="dense"
                onClick={() => setRejectDialogOpen(true)}
              >
                Reject
              </Button>

              <div className="flex items-center gap-2">
                {selectedApplicant.stage !== "ENROLLED" ? (
                  <>
                    <Button
                      variant="secondary"
                      size="dense"
                      disabled={advancingApplicantId === selectedApplicant.id || enrollingApplicantId === selectedApplicant.id}
                      trailingIcon={<ChevronRight className="w-4 h-4" />}
                      onClick={() => handleAdvanceStage(selectedApplicant)}
                      title={`Advance ${selectedApplicant.studentName} to next stage`}
                    >
                      {advancingApplicantId === selectedApplicant.id ? "Moving..." : "Next Stage"}
                    </Button>
                    <Button
                      variant="primary"
                      size="dense"
                      disabled={enrollingApplicantId === selectedApplicant.id || advancingApplicantId === selectedApplicant.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                      leadingIcon={<UserCheck className="w-4 h-4" />}
                      onClick={() => handleDirectEnroll(selectedApplicant)}
                      title={`Directly enroll ${selectedApplicant.studentName} into active roster`}
                    >
                      {enrollingApplicantId === selectedApplicant.id
                        ? "Enrolling..."
                        : "Direct Enroll"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="dense"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    leadingIcon={<UserCheck className="w-4 h-4" />}
                    onClick={() => router.push(`/students/${selectedApplicant.id}`)}
                  >
                    View Student Master Profile
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedApplicant && (
          <div className="flex flex-col gap-6 text-xs">
            {/* Stage Pill */}
            <div className="p-3 rounded-lg bg-subtle border border-border-default flex items-center justify-between">
              <div>
                <span className="text-text-secondary uppercase font-mono text-[10px]">
                  Current Status
                </span>
                <div className="text-sm font-semibold text-text-primary mt-0.5">
                  {selectedApplicant.stage.replace("_", " ")}
                </div>
              </div>
              <Badge variant={selectedApplicant.stage === "APPROVED" ? "positive" : "warning"}>
                Active Processing
              </Badge>
            </div>

            {/* Basic Bio */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-text-primary font-mono tracking-wider">
                Student & Guardian Information
              </span>
              <div className="p-3 rounded-lg bg-surface border border-border-default flex flex-col gap-2.5">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Grade Applying For:</span>
                  <span className="font-semibold text-text-primary">
                    {selectedApplicant.gradeApplying}
                  </span>
                </div>
                {selectedApplicant.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Date of Birth:</span>
                    <span className="font-mono text-text-primary">
                      {selectedApplicant.dateOfBirth} ({calculateAge(selectedApplicant.dateOfBirth)?.text})
                    </span>
                  </div>
                )}
                {selectedApplicant.gender && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Gender:</span>
                    <span className="capitalize text-text-primary">
                      {selectedApplicant.gender}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Guardian Name:</span>
                  <span className="font-semibold text-text-primary">
                    {selectedApplicant.parentName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Contact Phone:</span>
                  <span className="font-mono text-text-primary">
                    {selectedApplicant.parentPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Email Address:</span>
                  <span className="font-mono text-text-primary">
                    {selectedApplicant.parentEmail || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Applied Date:</span>
                  <span className="font-mono text-text-primary">
                    {selectedApplicant.appliedDate}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border-default pt-2">
                  <span className="text-text-secondary">Student Fees:</span>
                  <span className="font-mono font-semibold text-text-primary">
                    ₹{(selectedApplicant.feeAmount || 2500).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Fee Status:</span>
                  <Badge variant={selectedApplicant.feePaid ? "positive" : "warning"}>
                    {selectedApplicant.feePaid ? "PAID" : "UNPAID"}
                  </Badge>
                </div>
                {selectedApplicant.entranceScore !== undefined && selectedApplicant.entranceScore !== null && (
                  <div className="flex justify-between border-t border-border-default pt-2">
                    <span className="text-text-secondary">Entrance Test Score:</span>
                    <span className="font-mono font-bold text-brand-primary">
                      {selectedApplicant.entranceScore} / 100
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Verification Checklist */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-text-primary font-mono tracking-wider">
                Document Verification Checklist
              </span>
              <div className="flex flex-col gap-2">
                {selectedApplicant.documentsSubmitted && selectedApplicant.documentsSubmitted.length > 0 ? (
                  selectedApplicant.documentsSubmitted.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg bg-surface border border-border-default flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-text-muted" />
                        <div>
                          <div className="font-semibold text-text-primary">{doc.title}</div>
                          <div className="text-[10px] text-text-secondary font-mono">
                            {doc.fileName} • {doc.uploadDate}
                          </div>
                        </div>
                      </div>
                      <Badge variant={doc.status === "VERIFIED" ? "positive" : "warning"}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-surface border border-dashed border-border-default text-text-muted text-center">
                    No documents uploaded yet
                  </div>
                )}
              </div>
            </div>

            {/* Application Notes */}
            {selectedApplicant.notes && (
              <div className="p-3 rounded-lg bg-surface border border-border-default">
                <span className="font-semibold text-text-primary">Administrative Notes:</span>
                <p className="text-text-secondary mt-1">{selectedApplicant.notes}</p>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={rejectDialogOpen}
        title="Reject Admission Application"
        description="Are you sure you want to mark this applicant as rejected? An automated notification email will be dispatched to the guardian."
        confirmLabel="Reject Application"
        danger
        onConfirm={handleReject}
        onCancel={() => setRejectDialogOpen(false)}
      />

      {/* New Applicant Registration Modal */}
      <RegisterApplicantModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => setIsRegisterModalOpen(false)}
        academicYears={academicYears}
        academicGrades={academicGrades}
        enrollmentCounts={enrollmentCounts}
        createApplicant={createApplicant}
      />

      {/* Bulk Applicants Ingestion Modal */}
      <BulkApplicantsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => setIsBulkModalOpen(false)}
        academicYears={academicYears}
        academicGrades={academicGrades}
        bulkImportApplicants={bulkImportApplicants}
      />
    </AppShell>
  )
}

// -----------------------------------------------------------------------------
// Component: RegisterApplicantModal
// -----------------------------------------------------------------------------
interface RegisterApplicantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  academicYears: any[]
  academicGrades: any[]
  enrollmentCounts: any[]
  createApplicant: (data: any) => Promise<any>
}

function RegisterApplicantModal({
  isOpen,
  onClose,
  onSuccess,
  academicYears,
  academicGrades,
  enrollmentCounts,
  createApplicant,
}: RegisterApplicantModalProps) {
  const [activeTab, setActiveTab] = useState<"demographics" | "academic" | "guardian" | "notes">("demographics")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Student Demographics
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState("male")
  const [bloodGroup, setBloodGroup] = useState("")
  const [nationality, setNationality] = useState("Indian")
  const [studentEmail, setStudentEmail] = useState("")
  const [studentPhone, setStudentPhone] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")

  // Academic / Application
  const [classId, setClassId] = useState("")
  const [academicYearId, setAcademicYearId] = useState("")
  const [stage, setStage] = useState("APPLIED")
  const [entranceScore, setEntranceScore] = useState("")
  const [previousSchool, setPreviousSchool] = useState("")
  const [transferCertNo, setTransferCertNo] = useState("")

  // Student Fees
  const [feeAmount, setFeeAmount] = useState<string>("5000")
  const [feeStatus, setFeeStatus] = useState<string>("paid")

  // Guardian
  const [guardianName, setGuardianName] = useState("")
  const [guardianRelationship, setGuardianRelationship] = useState("Father")
  const [guardianPhone, setGuardianPhone] = useState("")
  const [guardianEmail, setGuardianEmail] = useState("")
  const [guardianOccupation, setGuardianOccupation] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")

  // Health & Notes
  const [medicalNotes, setMedicalNotes] = useState("")
  const [notes, setNotes] = useState("")

  // Auto-select initial academic year and class
  React.useEffect(() => {
    if (academicYears.length > 0 && !academicYearId) {
      const currentYear = academicYears.find((y: any) => y.is_current) || academicYears[0]
      if (currentYear) setAcademicYearId(currentYear.id)
    }
  }, [academicYears, academicYearId])

  React.useEffect(() => {
    if (academicGrades.length > 0 && !classId) {
      setClassId(academicGrades[0].id)
    }
  }, [academicGrades, classId])

  // Computed Age
  const computedAge = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth])

  // Class capacity
  const selectedClassCapacity = useMemo(() => {
    return enrollmentCounts.find((c: any) => c.class_id === classId)
  }, [enrollmentCounts, classId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please provide both First Name and Last Name.")
      setActiveTab("demographics")
      return
    }
    if (!dateOfBirth) {
      setErrorMsg("Please select the applicant's Date of Birth.")
      setActiveTab("demographics")
      return
    }
    if (!classId) {
      setErrorMsg("Please choose the applying grade/class.")
      setActiveTab("academic")
      return
    }
    if (!guardianName.trim() || !guardianPhone.trim()) {
      setErrorMsg("Please provide Guardian Name and Primary Phone Number.")
      setActiveTab("guardian")
      return
    }

    try {
      setIsSubmitting(true)
      const notesArray = [
        notes.trim(),
        previousSchool ? `Previous School: ${previousSchool.trim()}` : "",
        transferCertNo ? `TC #: ${transferCertNo.trim()}` : "",
        medicalNotes ? `Medical Notes: ${medicalNotes.trim()}` : "",
        guardianRelationship ? `Relationship: ${guardianRelationship}` : "",
        guardianOccupation ? `Occupation: ${guardianOccupation.trim()}` : "",
        addressLine1 ? `Address: ${addressLine1.trim()}, ${city.trim()} ${state.trim()} ${pincode.trim()}` : "",
        emergencyPhone ? `Emergency Phone: ${emergencyPhone.trim()}` : "",
      ].filter(Boolean)

      await createApplicant({
        applicantName: `${firstName.trim()} ${lastName.trim()}`,
        dateOfBirth,
        gender: gender.toLowerCase(),
        classId,
        academicYearId: academicYearId || undefined,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim() || undefined,
        stage,
        notes: notesArray.join(" | ") || undefined,
        entranceScore: entranceScore ? parseFloat(entranceScore) : undefined,
        feeAmount: feeAmount ? parseFloat(feeAmount) : 0,
        feeStatus,
        feePaid: feeStatus === "paid",
      })

      onSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit admission application")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface border border-border-default rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default bg-subtle">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-semibold text-text-primary">
                New Student Admission Application
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Complete applicant registration with demographics, guardian linkage, and academic placement
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-default bg-canvas px-5 pt-2 gap-2">
          {[
            { id: "demographics", label: "1. Student Bio", icon: <Users className="w-3.5 h-3.5" /> },
            { id: "academic", label: "2. Grade & Fees", icon: <GraduationCap className="w-3.5 h-3.5" /> },
            { id: "guardian", label: "3. Guardian", icon: <Shield className="w-3.5 h-3.5" /> },
            { id: "notes", label: "4. Notes & Health", icon: <HeartPulse className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Demographics */}
          {activeTab === "demographics" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Aarav"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-text-secondary">Date of Birth *</label>
                    {computedAge && (
                      <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
                        {computedAge.text}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Undisclosed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer"
                  >
                    <option value="">Select (Optional)</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Student Email</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@example.com (optional)"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Student Phone</label>
                  <input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="e.g. 9876543210 (optional)"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Residential Address</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="House / Flat No., Street, Landmark"
                  className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 500081"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Academic & Intake */}
          {activeTab === "academic" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-text-secondary">Applying for Grade / Class *</label>
                    {selectedClassCapacity && (
                      <span className="text-[10px] font-mono font-medium text-text-muted">
                        Capacity: {selectedClassCapacity.enrolled_count}/{selectedClassCapacity.capacity}
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer font-medium"
                  >
                    <option value="">Select Applying Grade</option>
                    {academicGrades.map((g) => {
                      const cap = enrollmentCounts.find((c: any) => c.class_id === g.id)
                      const isFull = cap && cap.available_seats <= 0
                      return (
                        <option key={g.id} value={g.id}>
                          {g.name} {cap ? `(${cap.available_seats} seats free)` : ""} {isFull ? "⚠️ [FULL]" : ""}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Academic Year *</label>
                  <select
                    required
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer"
                  >
                    {academicYears.map((y: any) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.is_current ? "• (Current Year)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Initial Pipeline Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer font-medium"
                  >
                    <option value="APPLIED">Applied (Formal Application)</option>
                    <option value="INQUIRY">Inquiry (Initial Lead)</option>
                    <option value="DOCUMENT_VERIFICATION">Document Verification</option>
                    <option value="INTERVIEW">Interview / Exam</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Entrance Test Score (/ 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={entranceScore}
                    onChange={(e) => setEntranceScore(e.target.value)}
                    placeholder="e.g. 85.5 (optional)"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Previous School Attended</label>
                  <input
                    type="text"
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    placeholder="e.g. St. Xavier's High School"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Transfer Certificate (TC) Number</label>
                  <input
                    type="text"
                    value={transferCertNo}
                    onChange={(e) => setTransferCertNo(e.target.value)}
                    placeholder="e.g. TC-2026-9812"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono"
                  />
                </div>
              </div>

              {/* Student Fees & Billing Details */}
              <div className="p-3.5 rounded-lg bg-surface border border-border-default flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <span>Student Fee Structure & Payment Status</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">
                      Student Fees (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full pl-7 pr-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">
                      Fee Payment Status
                    </label>
                    <select
                      value={feeStatus}
                      onChange={(e) => setFeeStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer font-medium"
                    >
                      <option value="paid">Paid (Collected at Registration)</option>
                      <option value="unpaid">Unpaid / Payment Pending</option>
                      <option value="partial">Partially Paid</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Guardian */}
          {activeTab === "guardian" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Guardian Full Name *</label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Relationship *</label>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Primary Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Guardian Email</label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Occupation / Organization</label>
                  <input
                    type="text"
                    value={guardianOccupation}
                    onChange={(e) => setGuardianOccupation(e.target.value)}
                    placeholder="e.g. Software Architect, Tech Corp"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Secondary Emergency Phone</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. 9848012345 (optional)"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Notes & Health */}
          {activeTab === "notes" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Medical Notes & Allergies
                </label>
                <input
                  type="text"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Peanut allergy, Asthma inhaler required, None"
                  className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Administrative / Interview Remarks
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special talents, sports quota, sibling discounts, or intake observations..."
                  className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border-default mt-2">
            <div className="text-[11px] text-text-muted">
              * Required fields. All data is isolated under institution tenant policy.
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="dense" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              {activeTab !== "notes" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="dense"
                  trailingIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const tabs: ("demographics" | "academic" | "guardian" | "notes")[] = [
                      "demographics",
                      "academic",
                      "guardian",
                      "notes",
                    ]
                    const idx = tabs.indexOf(activeTab)
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1])
                  }}
                >
                  Next Section
                </Button>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                size="dense"
                disabled={isSubmitting}
                leadingIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {isSubmitting ? "Registering..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Component: BulkApplicantsModal
// -----------------------------------------------------------------------------
interface BulkApplicantsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  academicYears: any[]
  academicGrades: any[]
  bulkImportApplicants: (data: { applicants: any[]; academicYearId?: string }) => Promise<any>
}

function BulkApplicantsModal({
  isOpen,
  onClose,
  onSuccess,
  academicYears,
  academicGrades,
  bulkImportApplicants,
}: BulkApplicantsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMode, setImportMode] = useState<"csv" | "paste">("csv")
  const [rawText, setRawText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [defaultClassId, setDefaultClassId] = useState("")
  const [defaultAcademicYearId, setDefaultAcademicYearId] = useState("")
  const [defaultFeeAmount, setDefaultFeeAmount] = useState<string>("5000")
  const [defaultFeeStatus, setDefaultFeeStatus] = useState<string>("paid")
  const [defaultStage, setDefaultStage] = useState<string>("application")
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [importReport, setImportReport] = useState<{
    total: number
    succeeded: number
    failed: number
    results: any[]
  } | null>(null)

  // Initialize active year and class
  React.useEffect(() => {
    if (academicYears.length > 0 && !defaultAcademicYearId) {
      const cur = academicYears.find((y: any) => y.is_current) || academicYears[0]
      if (cur) setDefaultAcademicYearId(cur.id)
    }
  }, [academicYears, defaultAcademicYearId])

  React.useEffect(() => {
    if (academicGrades.length > 0 && !defaultClassId) {
      setDefaultClassId(academicGrades[0].id)
    }
  }, [academicGrades, defaultClassId])

  // Parse CSV Lines
  const parsedRows: ParsedApplicantRow[] = useMemo(() => {
    if (!rawText.trim()) return []
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)

    const rows: ParsedApplicantRow[] = []

    const headerLine = lines[0]?.toLowerCase() || ""
    const hasHeader =
      headerLine.startsWith("applicant") ||
      headerLine.startsWith("name") ||
      headerLine.startsWith("student")

    const headerCols = hasHeader
      ? lines[0].split(",").map((c) => c.trim().toLowerCase().replace(/^["']|["']$/g, ""))
      : []

    const findIdx = (keywords: string[]) => {
      if (!hasHeader) return -1
      return headerCols.findIndex((col) => keywords.some((k) => col.includes(k)))
    }

    const nameIdx = findIdx(["applicant", "student", "name"])
    const dobIdx = findIdx(["birth", "dob", "date"])
    const genderIdx = findIdx(["gender", "sex"])
    const gradeIdx = findIdx(["grade", "class"])
    const gNameIdx = findIdx(["guardian", "parent", "father", "mother"])
    const gPhoneIdx = findIdx(["phone", "mobile", "contact"])
    const gEmailIdx = findIdx(["email", "mail"])
    const scoreIdx = findIdx(["score", "entrance", "exam", "test"])
    const feeAmtIdx = findIdx(["fee amount", "fee_amount", "fees", "fee", "amount"])
    const feeStatusIdx = findIdx(["fee status", "fee_status", "payment status", "payment", "status"])
    const notesIdx = findIdx(["note", "remark", "comment"])

    lines.forEach((line, index) => {
      // Skip header row if detected
      if (index === 0 && hasHeader) return

      // Split by comma
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""))
      if (cols.length < 2) return

      const applicantName = nameIdx >= 0 ? cols[nameIdx] || "" : cols[0] || ""
      const dateOfBirth = dobIdx >= 0 ? cols[dobIdx] || "" : cols[1] || ""
      const gender = ((genderIdx >= 0 ? cols[genderIdx] : cols[2]) || "male").toLowerCase()
      const gradeApplying = gradeIdx >= 0 ? cols[gradeIdx] || "" : cols[3] || ""
      const guardianName = gNameIdx >= 0 ? cols[gNameIdx] || "" : cols[4] || ""
      const guardianPhone = gPhoneIdx >= 0 ? cols[gPhoneIdx] || "" : cols[5] || ""
      const guardianEmail = gEmailIdx >= 0 ? cols[gEmailIdx] || "" : cols[6] || ""
      const entranceScore = scoreIdx >= 0 ? cols[scoreIdx] || "" : cols[7] || ""

      let feeAmount = defaultFeeAmount
      let feeStatus = defaultFeeStatus
      let notes = ""

      if (feeAmtIdx >= 0 && cols[feeAmtIdx]) {
        feeAmount = cols[feeAmtIdx]
      } else if (!hasHeader && cols.length >= 10 && cols[8]) {
        feeAmount = cols[8]
      }

      if (feeStatusIdx >= 0 && cols[feeStatusIdx]) {
        feeStatus = cols[feeStatusIdx]
      } else if (!hasHeader && cols.length >= 10 && cols[9]) {
        feeStatus = cols[9]
      }

      if (notesIdx >= 0 && cols[notesIdx]) {
        notes = cols[notesIdx]
      } else if (cols.length >= 11) {
        notes = cols.slice(10).join(", ")
      } else if (cols.length >= 9) {
        notes = cols.slice(8).join(", ")
      }

      const errors: string[] = []
      if (!applicantName) errors.push("Missing applicant name")
      if (!guardianName) errors.push("Missing guardian name")
      if (!guardianPhone) errors.push("Missing phone")

      rows.push({
        rowNumber: index + 1,
        applicantName,
        dateOfBirth,
        gender,
        gradeApplying,
        guardianName,
        guardianPhone,
        guardianEmail,
        entranceScore,
        feeAmount,
        feeStatus,
        notes,
        isValid: errors.length === 0,
        errors,
      })
    })

    return rows
  }, [rawText, defaultFeeAmount, defaultFeeStatus])

  const validCount = parsedRows.filter((r) => r.isValid).length
  const invalidCount = parsedRows.filter((r) => !r.isValid).length

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      "Applicant Name,Date of Birth,Gender,Grade Applying,Guardian Name,Guardian Phone,Guardian Email,Entrance Score,Fee Amount,Fee Status,Notes\n" +
      "Rohit Verma,2015-05-14,male,Grade 7,Suresh Verma,9876543210,suresh.verma@example.com,88,5000,paid,Transfer applicant from Delhi\n" +
      "Ananya Sen,2014-08-22,female,Grade 8,Pooja Sen,9876543211,pooja.sen@example.com,92,6000,unpaid,Merit scholarship candidate\n" +
      "Kabir Mehta,2016-01-10,male,Grade 6,Rakesh Mehta,9876543212,rakesh.mehta@example.com,78,5000,paid,Sibling already enrolled\n"

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "admissions_applicants_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawText(content || "")
    }
    reader.readAsText(file)
  }

  // Execute Bulk Import
  const handleImport = async () => {
    if (validCount === 0) {
      setErrorMsg("No valid applicant rows found to import.")
      return
    }

    try {
      setIsProcessing(true)
      setErrorMsg(null)

      const payload = parsedRows
        .filter((r) => r.isValid)
        .map((r) => {
          const rowFee = r.feeAmount || defaultFeeAmount || "0"
          const rowFeeStatus = (r.feeStatus || defaultFeeStatus || "unpaid").toLowerCase()
          return {
            applicantName: r.applicantName,
            dateOfBirth: r.dateOfBirth || undefined,
            gender: r.gender,
            gradeApplying: r.gradeApplying || undefined,
            classId: defaultClassId || undefined,
            guardianName: r.guardianName,
            guardianPhone: r.guardianPhone,
            guardianEmail: r.guardianEmail || undefined,
            entranceScore: r.entranceScore ? parseFloat(r.entranceScore) : undefined,
            feeAmount: parseFloat(rowFee) || 0,
            feeStatus: rowFeeStatus,
            feePaid: rowFeeStatus === "paid",
            notes: r.notes || undefined,
            stage: defaultStage,
            directEnroll: defaultStage === "enrolled",
          }
        })

      const report = await bulkImportApplicants({
        applicants: payload,
        academicYearId: defaultAcademicYearId || undefined,
      })

      setImportReport(report)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process bulk applicant import")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface border border-border-default rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default bg-subtle">
          <div>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-semibold text-text-primary">
                Bulk Applicants Ingestion
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Batch import prospective student applications with auto-class assignment and guardian linkage
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report View on Success */}
        {importReport ? (
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-text-primary">
                {defaultStage === "enrolled"
                  ? "⚡ Bulk Direct Enrollment Completed!"
                  : "Bulk Ingestion Completed!"}
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                {defaultStage === "enrolled"
                  ? `Successfully enrolled ${importReport.succeeded} student(s) directly into the active roster with admission IDs and classroom allocations.`
                  : `Successfully processed ${importReport.total} records into admissions pipeline.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="p-3 rounded-lg bg-surface border border-border-default text-center">
                <span className="text-[11px] text-text-secondary uppercase font-mono">
                  {defaultStage === "enrolled" ? "Enrolled" : "Succeeded"}
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {importReport.succeeded}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border-default text-center">
                <span className="text-[11px] text-text-secondary uppercase font-mono">Failed</span>
                <div className="text-xl font-bold font-mono text-red-400 mt-0.5">
                  {importReport.failed}
                </div>
              </div>
            </div>

            {defaultStage === "enrolled" && importReport.succeeded > 0 && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 max-w-md">
                All enrolled students are now visible in the Student Directory and can be managed directly under the <strong>Students</strong> module.
              </div>
            )}

            {importReport.results && importReport.results.some((r: any) => !r.success) && (
              <div className="w-full text-left bg-canvas border border-border-default rounded-lg p-3 max-h-40 overflow-y-auto text-xs">
                <span className="font-semibold text-red-400 block mb-1">Errors Detail:</span>
                {importReport.results
                  .filter((r: any) => !r.success)
                  .map((r: any, idx: number) => (
                    <div key={idx} className="text-text-secondary font-mono text-[11px] py-0.5">
                      Row {r.row}: {r.applicantName} - {r.error}
                    </div>
                  ))}
              </div>
            )}

            <Button
              variant="primary"
              size="dense"
              onClick={() => {
                setImportReport(null)
                setRawText("")
                setFileName(null)
                onSuccess()
              }}
            >
              Done & Return to Desk
            </Button>
          </div>
        ) : (
          /* Input & Preview View */
          <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Defaults & Fee Structure */}
            <div className="p-4 rounded-xl bg-canvas border border-border-default space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
                <div>
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                    Batch Intake Configuration & Fee Defaults
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Configure intake pipeline destination, fallback class assignment, and baseline fee structure.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="dense"
                  leadingIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* 1. Academic Year */}
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">
                    Target Academic Year
                  </label>
                  <select
                    value={defaultAcademicYearId}
                    onChange={(e) => setDefaultAcademicYearId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border-default rounded-lg text-text-primary cursor-pointer focus:outline-none focus:border-brand-primary"
                  >
                    {academicYears.map((y: any) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.is_current ? "• (Current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Fallback Grade */}
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">
                    Fallback Class (if blank)
                  </label>
                  <select
                    value={defaultClassId}
                    onChange={(e) => setDefaultClassId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border-default rounded-lg text-text-primary cursor-pointer font-medium focus:outline-none focus:border-brand-primary"
                  >
                    {academicGrades.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Intake Action / Mode */}
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 flex items-center justify-between">
                    <span>Intake Mode</span>
                    {defaultStage === "enrolled" && (
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">⚡ Direct</span>
                    )}
                  </label>
                  <select
                    value={defaultStage}
                    onChange={(e) => setDefaultStage(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg font-semibold cursor-pointer focus:outline-none ${
                      defaultStage === "enrolled"
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                        : "bg-surface border-border-default text-text-primary"
                    }`}
                  >
                    <option value="application">Pipeline (Applied)</option>
                    <option value="enrolled">⚡ Direct Enroll (Admit)</option>
                    <option value="enquiry">Inquiry Stage (Lead)</option>
                  </select>
                </div>

                {/* 4. Default Fee Amount */}
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">
                    Default Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={defaultFeeAmount}
                      onChange={(e) => setDefaultFeeAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-surface border border-border-default rounded-lg text-text-primary font-mono focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* 5. Default Fee Status */}
                <div>
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">
                    Fee Status
                  </label>
                  <select
                    value={defaultFeeStatus}
                    onChange={(e) => setDefaultFeeStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border-default rounded-lg text-text-primary cursor-pointer focus:outline-none focus:border-brand-primary"
                  >
                    <option value="paid">Paid (Fully Collected)</option>
                    <option value="unpaid">Unpaid (Payment Due)</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>

              {defaultStage === "enrolled" && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>⚡ Direct Enrollment Enabled:</strong> Each valid row will be directly admitted into active student master roster, assigned a unique admission number (<code className="font-mono text-emerald-200">SIA-YYYY-XXXX</code>), and assigned classroom sections immediately upon import.
                  </span>
                </div>
              )}
            </div>

            {/* Ingestion Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center rounded-lg border border-border-default bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setImportMode("csv")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    importMode === "csv"
                      ? "bg-action-primary text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("paste")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    importMode === "paste"
                      ? "bg-action-primary text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Paste CSV / Text
                </button>
              </div>

              {parsedRows.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                      {invalidCount} Invalid
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mode 1: File Upload */}
            {importMode === "csv" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-border-default hover:border-brand-primary rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-canvas/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <FileSpreadsheet className="w-8 h-8 text-brand-primary" />
                <span className="text-xs font-semibold text-text-primary">
                  {fileName ? fileName : "Click to select a CSV file or drag and drop here"}
                </span>
                <span className="text-[11px] text-text-muted">
                  Supports comma-separated .csv format with headers
                </span>
              </div>
            )}

            {/* Mode 2: Paste Raw CSV */}
            {importMode === "paste" && (
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Paste Raw CSV Rows (Comma Separated)
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Applicant Name,Date of Birth,Gender,Grade Applying,Guardian Name,Guardian Phone,Guardian Email,Entrance Score,Fee Amount,Fee Status,Notes\nRohit Verma,2015-05-14,male,Grade 7,Suresh Verma,9876543210,suresh.verma@example.com,88,5000,paid,Transfer candidate`}
                  className="w-full px-3 py-2 text-xs font-mono bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary resize-none"
                />
              </div>
            )}

            {/* Preview Table */}
            {parsedRows.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-text-primary font-mono tracking-wider">
                  Live Parsing Preview ({parsedRows.length} Rows Detected)
                </span>

                <div className="border border-border-default rounded-lg overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-subtle text-text-secondary border-b border-border-default">
                      <tr>
                        <th className="p-2 font-mono">#</th>
                        <th className="p-2">Applicant</th>
                        <th className="p-2 font-mono">DOB</th>
                        <th className="p-2">Grade</th>
                        <th className="p-2">Guardian</th>
                        <th className="p-2 font-mono">Phone</th>
                        <th className="p-2">Fee (₹)</th>
                        <th className="p-2">Payment</th>
                        <th className="p-2">Intake</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-surface">
                      {parsedRows.slice(0, 15).map((row) => (
                        <tr key={row.rowNumber} className={row.isValid ? "" : "bg-red-500/5"}>
                          <td className="p-2 font-mono text-text-muted">{row.rowNumber}</td>
                          <td className="p-2 font-semibold text-text-primary">{row.applicantName || "—"}</td>
                          <td className="p-2 font-mono text-text-secondary">{row.dateOfBirth || "—"}</td>
                          <td className="p-2 text-text-secondary">{row.gradeApplying || "Default"}</td>
                          <td className="p-2 text-text-primary">{row.guardianName || "—"}</td>
                          <td className="p-2 font-mono text-text-secondary">{row.guardianPhone || "—"}</td>
                          <td className="p-2 font-mono text-text-primary font-medium">
                            ₹{Number(row.feeAmount || defaultFeeAmount || 0).toLocaleString()}
                          </td>
                          <td className="p-2">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase font-mono ${
                                (row.feeStatus || defaultFeeStatus) === "paid"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {row.feeStatus || defaultFeeStatus}
                            </span>
                          </td>
                          <td className="p-2">
                            {defaultStage === "enrolled" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 font-mono">
                                ⚡ Direct Enroll
                              </span>
                            ) : (
                              <span className="text-[11px] text-text-secondary font-mono">
                                Pipeline
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {row.isValid ? (
                              <Badge variant="positive">Ready</Badge>
                            ) : (
                              <Badge variant="error">{row.errors[0]}</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border-default">
              <Button type="button" variant="secondary" size="dense" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>

              <button
                type="button"
                disabled={validCount === 0 || isProcessing}
                onClick={handleImport}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  defaultStage === "enrolled"
                    ? "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-900/30"
                    : "bg-action-primary hover:bg-action-primary/90 text-white"
                }`}
              >
                {defaultStage === "enrolled" ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {isProcessing
                    ? defaultStage === "enrolled"
                      ? "Enrolling & Assigning Student IDs..."
                      : "Importing Applicants..."
                    : defaultStage === "enrolled"
                    ? `⚡ Directly Enroll ${validCount} Students`
                    : `Import ${validCount} Applicants to Pipeline`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
