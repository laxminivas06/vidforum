"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableColumn,
  ConfirmDialog,
  SlideOver,
} from "@/components/ui"
import {
  FileSpreadsheet,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Plus,
  ArrowRight,
} from "lucide-react"

interface ExamSchedule {
  id: string
  title: string
  grade: string
  subject: string
  date: string
  time: string
  maxMarks: number
  hall: string
  status: "SCHEDULED" | "MARKS_UPLOADED" | "PUBLISHED"
}

export default function ExaminationsPage() {
  const [exams, setExams] = useState<ExamSchedule[]>([])
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const columns: TableColumn<ExamSchedule>[] = [
    {
      header: "Exam Title & Subject",
      key: "title",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.title}</div>
          <div className="text-xs text-text-secondary">{item.subject}</div>
        </div>
      ),
    },
    {
      header: "Grade",
      key: "grade",
      render: (item) => <span className="text-xs font-mono">{item.grade}</span>,
    },
    {
      header: "Date & Timing",
      key: "date",
      render: (item) => (
        <div>
          <div className="text-xs font-mono text-text-primary">{item.date}</div>
          <div className="text-[11px] text-text-secondary font-mono">{item.time}</div>
        </div>
      ),
    },
    {
      header: "Hall Location",
      key: "hall",
      render: (item) => <span className="text-xs text-text-secondary">{item.hall}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "neutral"> = {
          PUBLISHED: "positive",
          MARKS_UPLOADED: "warning",
          SCHEDULED: "neutral",
        }
        return <Badge variant={variants[item.status]}>{item.status.replace("_", " ")}</Badge>
      },
    },
    {
      header: "Actions",
      key: "id",
      render: (item) => (
        <Button size="dense" variant="secondary">
          {item.status === "MARKS_UPLOADED" ? "Verify Marks" : "Upload Sheet"}
        </Button>
      ),
    },
  ]

  const handleSimulateImport = () => {
    setImportSuccess(true)
    setTimeout(() => {
      setImportModalOpen(false)
      setImportSuccess(false)
      setSelectedFile(null)
    }, 1500)
  }

  return (
    <AppShell
      pageTitle="Examinations & Marks Entry"
      breadcrumbs={[{ label: "Core" }, { label: "Examinations" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setImportModalOpen(true)}
          >
            Import Marks (Excel)
          </Button>
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Exam Schedule
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {exams.length > 0 ? (
          <Table
            data={exams}
            columns={columns}
            keyExtractor={(item) => item.id}
            cardTitle={(item) => item.title}
            cardSubtitle={(item) => `${item.subject} • ${item.grade}`}
            cardBadge={(item) => <Badge variant="neutral">{item.status}</Badge>}
          />
        ) : (
          <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                No Examination Schedules Configured
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                Create term exam schedules or import board marks ledgers via Excel spreadsheet to view assessments and generate report cards.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Excel Import SlideOver Flow */}
      <SlideOver
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Marks Ledger via Excel"
        subtitle="Standardized Spreadsheet Format"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-text-secondary">
              Excel format (.xlsx, .csv)
            </span>
            <div className="flex items-center gap-2">
              <Button size="dense" variant="secondary" onClick={() => setImportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                disabled={!selectedFile}
                onClick={handleSimulateImport}
              >
                Validate & Ingest
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-6 py-4">
          <div className="p-4 rounded-xl bg-subtle border border-border-default flex items-start gap-3">
            <Calendar className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-text-primary">
                Standardized Exam Format
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Ensure columns match: Roll Number, Student Admission ID, Marks Obtained, Max Marks.
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-border-default rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-canvas text-center">
            <FileSpreadsheet className="w-8 h-8 text-text-secondary" />
            <div>
              <div className="text-sm font-semibold text-text-primary">
                {selectedFile ? selectedFile : "Select ledger spreadsheet to upload"}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Drag and drop your Excel spreadsheet (.xlsx, .csv)
              </p>
            </div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0]?.name || null)}
            />
            <Button
              size="dense"
              variant="secondary"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Choose Spreadsheet
            </Button>
          </div>

          {importSuccess && (
            <div className="p-3 bg-positive/10 border border-positive/20 rounded-xl text-positive text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Marks Ledger uploaded and validated with 0 discrepancies!</span>
            </div>
          )}
        </div>
      </SlideOver>
    </AppShell>
  )
}
