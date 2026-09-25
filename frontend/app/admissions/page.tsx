"use client"

import React, { useState } from "react"
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
} from "lucide-react"
import { useAdmissions } from "@/lib/api/hooks"
import { Applicant, AdmissionStage } from "@/types"

const STAGES: { key: AdmissionStage; label: string; color: string }[] = [
  { key: "INQUIRY", label: "Inquiry", color: "bg-neutral-500" },
  { key: "APPLIED", label: "Applied", color: "bg-blue-500" },
  { key: "DOCUMENT_VERIFICATION", label: "Doc Verification", color: "bg-amber-500" },
  { key: "INTERVIEW", label: "Interview / Exam", color: "bg-purple-500" },
  { key: "APPROVED", label: "Approved", color: "bg-brand-primary" },
  { key: "ENROLLED", label: "Enrolled (Active)", color: "bg-emerald-600" },
]

export default function AdmissionsPage() {
  const router = useRouter()
  const { data: applicants = [], isLoading, updateStage } = useAdmissions()

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("ALL")
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [enrollingApplicant, setEnrollingApplicant] = useState(false)

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
          {item.feePaid ? "PAID ₹2,500" : "UNPAID"}
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
        <Button
          size="dense"
          variant="secondary"
          onClick={() => setSelectedApplicant(item)}
        >
          Inspect
        </Button>
      ),
    },
  ]

  const handleEnroll = async (applicant: Applicant) => {
    setEnrollingApplicant(true)
    // Update stage to ENROLLED
    await updateStage({ applicantId: applicant.id, newStage: "ENROLLED" })
    setEnrollingApplicant(false)
    setSelectedApplicant(null)
    // Redirect to newly generated Student Master Profile (PRD Rule 1)
    router.push(`/students/${applicant.id}`)
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
      await updateStage({ applicantId: applicant.id, newStage: nextStage })
      setSelectedApplicant({ ...applicant, stage: nextStage })
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
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
            New Applicant
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Filter Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or application #..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-action-primary"
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
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
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
                              {applicant.feePaid ? "Fee Paid" : "Unpaid"}
                            </Badge>
                          </div>

                          <div className="font-mono text-xs text-text-secondary mt-1">
                            {applicant.applicationNumber}
                          </div>

                          <div className="flex items-center justify-between text-xs text-text-muted mt-2 pt-2 border-t border-border-subtle">
                            <span>{applicant.gradeApplying}</span>
                            <span className="font-mono">{applicant.appliedDate}</span>
                          </div>

                          {applicant.documentsSubmitted && (
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
                {selectedApplicant.stage === "APPROVED" ? (
                  <Button
                    variant="primary"
                    size="dense"
                    disabled={enrollingApplicant}
                    className="bg-brand-primary text-black hover:bg-emerald-400"
                    leadingIcon={<UserCheck className="w-4 h-4" />}
                    onClick={() => handleEnroll(selectedApplicant)}
                  >
                    {enrollingApplicant ? "Creating Master Record..." : "1-Click Enroll Student"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="dense"
                    trailingIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => handleAdvanceStage(selectedApplicant)}
                  >
                    Advance Stage
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
                    {selectedApplicant.parentEmail}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Applied Date:</span>
                  <span className="font-mono text-text-primary">
                    {selectedApplicant.appliedDate}
                  </span>
                </div>
                {selectedApplicant.entranceScore && (
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
                {selectedApplicant.documentsSubmitted?.map((doc) => (
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
                ))}
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
    </AppShell>
  )
}
