"use client"

import React, { useState } from "react"
import {
  X,
  Users,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Key,
  FileSpreadsheet,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react"
import { Button, Badge } from "@/components/ui"
import { useBulkProvisionUsers } from "@/lib/api/hooks"

interface BulkProvisionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const BulkProvisionModal: React.FC<BulkProvisionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const bulkMutation = useBulkProvisionUsers()

  const [rawText, setRawText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<any | null>(null)
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null)

  // Keyboard navigation: Escape closes, Cmd/Ctrl+Enter submits
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(e as any)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, rawText])

  if (!isOpen) return null

  // 1. Download Sample CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      "name,email,roleTemplate,userId\n" +
      "Dr. Ramesh Sharma,ramesh.sharma@institution.edu,TEACHER,ramesh.sharma\n" +
      "Priya Verma,priya.verma@institution.edu,HR_OFFICER,priya.verma\n" +
      "Anil Kulkarni,anil.kulkarni@institution.edu,ADMISSION_OFFICER,anil.kulkarni\n" +
      "Sunita Rao,sunita.rao@institution.edu,FINANCE_OFFICER,sunita.rao\n" +
      "Vikram Singh,vikram.singh@institution.edu,ACADEMIC_COORDINATOR,vikram.singh\n" +
      "Meera Nair,meera.nair@institution.edu,EXAM_OFFICER,meera.nair\n"

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "bulk_account_provisioning_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. Parse CSV input
  const parseCsv = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) return []

    // Check if first line is header
    const firstLineLower = lines[0].toLowerCase()
    const startIndex =
      firstLineLower.includes("name") && firstLineLower.includes("email") ? 1 : 0

    const rows: Array<{
      name: string
      email: string
      roleTemplate: string
      userId?: string
    }> = []

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""))
      if (parts.length >= 2) {
        rows.push({
          name: parts[0],
          email: parts[1],
          roleTemplate: parts[2] || "TEACHER",
          userId: parts[3] || parts[1],
        })
      }
    }
    return rows
  }

  // 3. Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawText(content || "")
      setError(null)
    }
    reader.readAsText(file)
  }

  // 4. Submit Bulk Provisioning
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResultData(null)

    const parsed = parseCsv(rawText)
    if (parsed.length === 0) {
      setError("Please paste CSV data or upload a file with at least Name and Email columns.")
      return
    }

    try {
      const res = await bulkMutation.mutateAsync({ users: parsed })
      setResultData(res)
      if (res.successCount > 0) {
        onSuccess?.()
      }
    } catch (err: any) {
      setError(err.message || "Bulk provisioning execution failed")
    }
  }

  // 5. Download Credentials CSV for successful provisions
  const handleDownloadCredentialsCsv = () => {
    if (!resultData?.successful || resultData.successful.length === 0) return

    const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:3000/login"

    let csv = "Name,Email,Login User ID,Role Template,Temporary Password,Login Portal URL,Mandatory First Login Notice\n"

    for (const user of resultData.successful) {
      const escapedName = `"${(user.name || "").replace(/"/g, '""')}"`
      const pwd = user.initialPassword || "[Already set]"
      csv += `${escapedName},${user.email},${user.userId},${user.roleTemplate},${pwd},${loginUrl},"Password change mandatory on first login"\n`
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `provisioned_credentials_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDownloadSuccessToast("Credentials CSV downloaded! Distribute securely to users.")
    setTimeout(() => setDownloadSuccessToast(null), 4000)
  }

  const parsedPreview = parseCsv(rawText)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Bulk Account Provisioning Engine</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Batch create credentials using Section 10 Role Templates with row-by-row validation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {downloadSuccessToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{downloadSuccessToast}</span>
            </div>
          )}

          {/* Result Summary View */}
          {resultData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-subtle border border-border-default text-center">
                  <div className="text-xs text-text-secondary font-medium">Total Rows</div>
                  <div className="text-xl font-bold text-text-primary mt-1 font-mono">{resultData.total}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Succeeded</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1 font-mono">
                    {resultData.successCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                  <div className="text-xs text-red-700 dark:text-red-400 font-medium">Failed</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 font-mono">
                    {resultData.failedCount}
                  </div>
                </div>
              </div>

              {/* Download Credentials Button */}
              {resultData.successCount > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      {resultData.successCount} Accounts Provisioned Successfully!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Download the one-time credentials CSV to distribute login details to users.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="default"
                    onClick={handleDownloadCredentialsCsv}
                    leadingIcon={<Download className="w-4 h-4" />}
                  >
                    Download Credentials CSV
                  </Button>
                </div>
              )}

              {/* Failures Table if any */}
              {resultData.failedCount > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Failed Rows ({resultData.failed.length})</span>
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-red-500/30 bg-red-500/5 divide-y divide-red-500/20 text-xs">
                    {resultData.failed.map((f: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-text-primary mr-2">Row {f.row}:</span>
                          <span className="text-text-secondary">{f.name || "N/A"} • {f.email || "N/A"}</span>
                        </div>
                        <span className="text-red-600 dark:text-red-400 font-mono text-[11px] shrink-0">
                          {f.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => {
                    setResultData(null)
                    setRawText("")
                  }}
                >
                  Provision Another Batch
                </Button>
                <Button type="button" variant="primary" size="default" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Template Download Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-subtle border border-border-default">
                <div>
                  <div className="text-xs font-bold text-text-primary">Need the formatting standard?</div>
                  <div className="text-[11px] text-text-secondary">
                    Columns: <code className="font-mono text-brand-primary">name, email, roleTemplate, userId</code>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="dense"
                  onClick={handleDownloadTemplate}
                  leadingIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Sample CSV
                </Button>
              </div>

              {/* Upload Input */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default hover:bg-subtle text-xs font-semibold cursor-pointer text-text-primary transition-colors">
                  <Upload className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Upload CSV File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-text-muted">or paste CSV rows below</span>
              </div>

              {/* Paste Textarea */}
              <div>
                <textarea
                  rows={6}
                  placeholder={`name,email,roleTemplate,userId\nDr. Vikram Sen,vikram@school.edu,TEACHER,vikram.sen\nMeera Joshi,meera@school.edu,HR_OFFICER,meera.joshi`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-canvas border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              {/* Live Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-text-primary flex items-center justify-between">
                    <span>Parsed Preview ({parsedPreview.length} Accounts Detected)</span>
                    <span className="text-[11px] text-text-muted font-normal font-mono">Atomic row processing</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border-default bg-canvas divide-y divide-border-subtle text-xs">
                    {parsedPreview.slice(0, 10).map((r, i) => (
                      <div key={i} className="p-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-text-primary">{r.name}</span>
                          <span className="text-text-muted ml-2 font-mono text-[11px]">{r.email}</span>
                        </div>
                        <Badge variant="neutral" className="text-[10px] font-mono">
                          {r.roleTemplate}
                        </Badge>
                      </div>
                    ))}
                    {parsedPreview.length > 10 && (
                      <div className="p-2 text-center text-xs text-text-muted italic">
                        +{parsedPreview.length - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-border-default flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" size="default" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  isLoading={bulkMutation.isPending}
                  disabled={parsedPreview.length === 0}
                  leadingIcon={<FileSpreadsheet className="w-4 h-4" />}
                >
                  Start Bulk Provisioning ({parsedPreview.length})
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
