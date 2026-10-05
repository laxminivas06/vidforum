"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
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
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Download,
  Eye,
  Plus,
  ChevronRight,
  AlertCircle,
  X,
  User,
  Building2,
  RefreshCw,
} from "lucide-react"
import {
  useAdmissionDocuments,
  useAdmissions,
  useAcademics,
} from "@/lib/api/hooks"
import { AdmissionDocumentItem } from "@/types"

export default function AdmissionDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedDoc, setSelectedDoc] = useState<AdmissionDocumentItem | null>(null)
  const [previewDoc, setPreviewDoc] = useState<AdmissionDocumentItem | null>(null)
  const [rejectDocId, setRejectDocId] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Upload Form State
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>("")
  const [docType, setDocType] = useState<string>("Birth Certificate")
  const [uploadedFileName, setUploadedFileName] = useState<string>("")

  const { data: documents = [], isLoading, updateStatus, isUpdating, addDocument, isAdding } = useAdmissionDocuments()
  const { data: applicants = [] } = useAdmissions()
  const { data: grades = [] } = useAcademics()

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || doc.status.toUpperCase() === statusFilter.toUpperCase()

      const matchesGrade =
        selectedGrade === "ALL" || doc.gradeApplying.toLowerCase().includes(selectedGrade.toLowerCase())

      return matchesSearch && matchesStatus && matchesGrade
    })
  }, [documents, searchQuery, statusFilter, selectedGrade])

  // Aggregate stats
  const stats = useMemo(() => {
    const total = documents.length
    const verified = documents.filter((d) => d.status === "VERIFIED").length
    const pending = documents.filter((d) => d.status === "PENDING").length
    const rejected = documents.filter((d) => d.status === "REJECTED").length
    const complianceRate = total > 0 ? Math.round((verified / total) * 100) : 100

    return { total, verified, pending, rejected, complianceRate }
  }, [documents])

  const handleVerify = async (doc: AdmissionDocumentItem) => {
    try {
      setActionError(null)
      await updateStatus({ documentId: doc.id, status: "verified" })
      setActionSuccess(`Verified "${doc.title}" for ${doc.applicantName}`)
      if (previewDoc?.id === doc.id) {
        setPreviewDoc({ ...previewDoc, status: "VERIFIED" })
      }
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      setActionError(err.message || "Failed to verify document")
      setTimeout(() => setActionError(null), 5000)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectDocId) return
    try {
      setActionError(null)
      await updateStatus({ documentId: rejectDocId, status: "rejected" })
      setActionSuccess("Document marked as rejected. Guardian will be alerted to re-upload.")
      setRejectDocId(null)
      if (previewDoc?.id === rejectDocId) {
        setPreviewDoc({ ...previewDoc, status: "REJECTED" })
      }
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      setActionError(err.message || "Failed to reject document")
      setTimeout(() => setActionError(null), 5000)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApplicantId) {
      setActionError("Please select an applicant from the pipeline")
      return
    }
    try {
      setActionError(null)
      const fileName = uploadedFileName.trim() || `${docType.toLowerCase().replace(/[^a-z0-9]/g, "_")}_scan.pdf`
      await addDocument({
        applicationId: selectedApplicantId,
        documentType: docType,
        storageKey: fileName,
        status: "pending",
      })
      setActionSuccess(`Attached "${docType}" to applicant dossier`)
      setIsUploadModalOpen(false)
      setSelectedApplicantId("")
      setUploadedFileName("")
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err: any) {
      setActionError(err.message || "Failed to upload document")
      setTimeout(() => setActionError(null), 5000)
    }
  }

  const tableColumns: TableColumn<AdmissionDocumentItem>[] = [
    {
      header: "Applicant",
      key: "applicantName",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary text-xs sm:text-sm">{item.applicantName}</div>
          <div className="text-[11px] text-text-muted font-mono">{item.applicationNumber}</div>
        </div>
      ),
    },
    {
      header: "Grade Applying",
      key: "gradeApplying",
      render: (item) => (
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border-default">
          {item.gradeApplying}
        </span>
      ),
    },
    {
      header: "Document Title",
      key: "title",
      render: (item) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-primary shrink-0" />
          <div>
            <div className="font-medium text-text-primary text-xs">{item.title}</div>
            <div className="text-[10px] text-text-secondary font-mono truncate max-w-[160px]">
              {item.fileName}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Upload Date",
      key: "uploadDate",
      render: (item) => <span className="text-xs text-text-secondary font-mono">{item.uploadDate || "N/A"}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (item) => {
        if (item.status === "VERIFIED") {
          return <Badge variant="positive">Verified</Badge>
        }
        if (item.status === "REJECTED") {
          return <Badge variant="error">Rejected</Badge>
        }
        return <Badge variant="warning">Pending Review</Badge>
      },
    },
    {
      header: "Verification Actions",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          {item.status !== "VERIFIED" && (
            <Button
              size="dense"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              leadingIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation()
                handleVerify(item)
              }}
              disabled={isUpdating}
              title="Verify Document"
            >
              Verify
            </Button>
          )}

          {item.status !== "REJECTED" && (
            <Button
              size="dense"
              variant="secondary"
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={(e) => {
                e.stopPropagation()
                setRejectDocId(item.id)
              }}
              title="Reject Document"
            >
              Reject
            </Button>
          )}

          <Button
            size="dense"
            variant="ghost"
            leadingIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setPreviewDoc(item)}
            title="Inspect / Preview File"
          >
            Preview
          </Button>

          <Button
            size="dense"
            variant="ghost"
            onClick={() => setSelectedDoc(item)}
            title="Applicant Dossier"
          >
            Dossier
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Document Verification Desk"
      breadcrumbs={[
        { label: "Admissions", href: "/admissions" },
        { label: "Document Verification" },
      ]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Link href="/admissions">
            <Button size="dense" variant="secondary">
              Applications Kanban
            </Button>
          </Link>
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Success Alert */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-between text-xs font-semibold animate-in fade-in shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="p-1 hover:bg-emerald-500/20 rounded-md">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs font-semibold animate-in fade-in shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="p-1 hover:bg-rose-500/20 rounded-md">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stats Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Documents</span>
              <FileText className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-text-primary font-mono">{stats.total}</div>
            <div className="text-[11px] text-text-muted mt-0.5">Across admissions pipeline</div>
          </Card>

          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Verified Docs</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">{stats.verified}</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              {stats.complianceRate}% compliance rate
            </div>
          </Card>

          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-500 font-mono">{stats.pending}</div>
            <div className="text-[11px] text-text-muted mt-0.5">Awaiting staff sign-off</div>
          </Card>

          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-500 font-mono">{stats.rejected}</div>
            <div className="text-[11px] text-text-muted mt-0.5">Re-upload requested</div>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-lg border border-border-default overflow-x-auto">
            {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === tab
                    ? "bg-action-primary text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab === "ALL" ? "All Documents" : tab === "PENDING" ? "Pending (Review)" : tab === "VERIFIED" ? "Verified" : "Rejected"}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applicant or doc name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
            </div>

            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs bg-canvas border border-border-default rounded-lg px-3 py-1.5 font-medium text-text-primary focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Grades</option>
              {grades.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <Table
          data={filteredDocs}
          columns={tableColumns}
          keyExtractor={(item) => item.id}
          loading={isLoading}
          cardTitle={(item) => item.applicantName}
          cardSubtitle={(item) => `${item.title} • ${item.gradeApplying}`}
          cardBadge={(item) => (
            <Badge variant={item.status === "VERIFIED" ? "positive" : item.status === "REJECTED" ? "error" : "warning"}>
              {item.status}
            </Badge>
          )}
        />
      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-surface border border-border-default rounded-2xl p-6 shadow-xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Attach Admission Document</h3>
                  <p className="text-xs text-text-secondary">Upload verification proof for an applicant dossier</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Select Applicant <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedApplicantId}
                  onChange={(e) => setSelectedApplicantId(e.target.value)}
                  required
                  className="w-full text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                >
                  <option value="">-- Choose an Applicant from Pipeline --</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.studentName} ({a.applicationNumber} - {a.gradeApplying})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                >
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Transfer Certificate (TC)">Transfer Certificate (TC)</option>
                  <option value="Previous Year Marksheet">Previous Year Marksheet</option>
                  <option value="Aadhaar Card / ID Proof">Aadhaar Card / National ID Proof</option>
                  <option value="Medical Fitness Certificate">Medical Fitness Certificate</option>
                  <option value="Address Proof (Utility Bill / Passport)">Address Proof</option>
                  <option value="Passport Size Photographs">Passport Size Photographs</option>
                  <option value="Caste / Category Certificate">Caste / Category Certificate</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Upload Scanned File (PDF or Image)
                </label>
                <div className="border-2 border-dashed border-border-default rounded-xl p-4 text-center hover:border-brand-primary/50 transition-colors bg-subtle">
                  <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadedFileName(e.target.files[0].name)
                      }
                    }}
                    className="block w-full text-xs text-text-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-primary file:text-white hover:file:opacity-90 cursor-pointer"
                  />
                  {uploadedFileName && (
                    <span className="text-xs font-semibold text-brand-primary mt-2 block font-mono">
                      Selected: {uploadedFileName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-default">
                <Button
                  type="button"
                  variant="secondary"
                  size="dense"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="dense"
                  leadingIcon={<Upload className="w-3.5 h-3.5" />}
                  disabled={isAdding}
                >
                  {isAdding ? "Attaching..." : "Save to Dossier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview & Verification Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface border border-border-default rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-border-default flex items-center justify-between bg-subtle">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{previewDoc.title}</h3>
                  <p className="text-xs text-text-secondary">
                    {previewDoc.applicantName} • {previewDoc.applicationNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={previewDoc.status === "VERIFIED" ? "positive" : previewDoc.status === "REJECTED" ? "error" : "warning"}>
                  {previewDoc.status}
                </Badge>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Viewer Canvas */}
            <div className="p-8 bg-canvas flex flex-col items-center justify-center min-h-[260px] border-b border-border-default text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border-default flex items-center justify-center text-brand-primary shadow-sm mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-sm text-text-primary">{previewDoc.fileName}</h4>
              <p className="text-xs text-text-muted mt-1 font-mono">
                Uploaded: {previewDoc.uploadDate || "2026-10-05"} • PDF Document (Certified Digital Scan)
              </p>
              {previewDoc.verifiedAt && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified on {new Date(previewDoc.verifiedAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Modal Footer with Verification Controls */}
            <div className="p-4 flex items-center justify-between bg-surface">
              <a
                href={`#download-${previewDoc.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  alert(`Downloading certified copy: ${previewDoc.fileName}`)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </a>

              <div className="flex items-center gap-2">
                {previewDoc.status !== "REJECTED" && (
                  <Button
                    size="dense"
                    variant="secondary"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setRejectDocId(previewDoc.id)
                    }}
                  >
                    Reject File
                  </Button>
                )}
                {previewDoc.status !== "VERIFIED" && (
                  <Button
                    size="dense"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    leadingIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleVerify(previewDoc)}
                    disabled={isUpdating}
                  >
                    Verify & Approve
                  </Button>
                )}
                <Button size="dense" variant="secondary" onClick={() => setPreviewDoc(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(rejectDocId)}
        title="Reject Verification Document"
        description="Are you sure you want to mark this document as rejected? The guardian will receive an automated request to upload a fresh, valid document."
        confirmLabel="Reject Document"
        danger
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectDocId(null)}
      />

      {/* Applicant Dossier SlideOver */}
      <SlideOver
        open={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc ? `Dossier: ${selectedDoc.applicantName}` : "Applicant Dossier"}
      >
        {selectedDoc && (
          <div className="flex flex-col gap-6 text-xs">
            {/* Applicant Summary Card */}
            <div className="p-4 rounded-xl bg-surface border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-text-primary">{selectedDoc.applicantName}</h4>
                  <span className="font-mono text-text-muted text-[11px]">{selectedDoc.applicationNumber}</span>
                </div>
                <Badge variant="neutral">Grade {selectedDoc.gradeApplying}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-default text-text-secondary">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-muted block">Guardian</span>
                  <span className="font-medium text-text-primary">{selectedDoc.guardianName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-muted block">Phone</span>
                  <span className="font-mono text-text-primary">{selectedDoc.guardianPhone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Selected Document Details */}
            <div className="p-4 rounded-xl bg-subtle border border-border-default space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                Inspected Document
              </span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary text-sm">{selectedDoc.title}</span>
                <Badge variant={selectedDoc.status === "VERIFIED" ? "positive" : selectedDoc.status === "REJECTED" ? "error" : "warning"}>
                  {selectedDoc.status}
                </Badge>
              </div>
              <div className="text-text-secondary font-mono text-[11px]">
                File: {selectedDoc.fileName}
              </div>
              <div className="text-text-muted text-[11px]">
                Uploaded on: {selectedDoc.uploadDate}
              </div>

              <div className="pt-2 flex items-center gap-2">
                {selectedDoc.status !== "VERIFIED" && (
                  <Button
                    size="dense"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white w-full"
                    leadingIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleVerify(selectedDoc)}
                  >
                    Verify Document
                  </Button>
                )}
                <Button
                  size="dense"
                  variant="secondary"
                  className="w-full"
                  leadingIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setPreviewDoc(selectedDoc)
                    setSelectedDoc(null)
                  }}
                >
                  Preview File
                </Button>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}
