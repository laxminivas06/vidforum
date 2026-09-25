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

const MOCK_EXAMS: ExamSchedule[] = [
  {
    id: "ex-1",
    title: "Term 1 Mid-Term Examination",
    grade: "Grade 10",
    subject: "Mathematics (MAT101)",
    date: "2026-10-05",
    time: "09:00 AM - 12:00 PM",
    maxMarks: 100,
    hall: "Block B Examination Hall",
    status: "SCHEDULED",
  },
  {
    id: "ex-2",
    title: "Term 1 Mid-Term Examination",
    grade: "Grade 10",
    subject: "Physics & Chemistry (SCI102)",
    date: "2026-10-07",
    time: "09:00 AM - 12:00 PM",
    maxMarks: 100,
    hall: "Block B Examination Hall",
    status: "SCHEDULED",
  },
  {
    id: "ex-3",
    title: "Practical Assessment 1",
    grade: "Grade 11",
    subject: "Advanced Physics (PHY201)",
    date: "2026-09-22",
    time: "01:30 PM - 03:30 PM",
    maxMarks: 50,
    hall: "Physics Lab 3",
    status: "MARKS_UPLOADED",
  },
]

export default function ExaminationsPage() {
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
        {/* Table */}
        <Table
          data={MOCK_EXAMS}
          columns={columns}
          keyExtractor={(item) => item.id}
          cardTitle={(item) => item.title}
          cardSubtitle={(item) => `${item.subject} • ${item.grade}`}
          cardBadge={(item) => <Badge variant="neutral">{item.status}</Badge>}
        />
      </div>

      {/* Excel Import SlideOver Flow */}
      <SlideOver
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Marks Ledger via Excel"
        subtitle="CBSE / State Board Standardized Spreadsheet Format"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-text-secondary">
              Template: VID_Marks_Grade10_v2.xlsx
            </span>
            <Button
              size="dense"
              variant="primary"
              disabled={!selectedFile || importSuccess}
              className="bg-brand-primary text-black hover:bg-emerald-400"
              onClick={handleSimulateImport}
            >
              {importSuccess ? "Import Processed!" : "Validate & Commit Marks"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 text-xs">
          <p className="text-text-secondary">
            Upload the graded spreadsheet containing Student Roll Numbers, Component Scores (Theory, Practical, Internal Assessment), and Examiner Signatures.
          </p>

          {/* Upload Dropzone */}
          <div
            onClick={() => setSelectedFile("Grade10A_Maths_MidTerm_2026.xlsx")}
            className="p-8 border-2 border-dashed border-border-default hover:border-brand-primary rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-subtle/50"
          >
            <FileSpreadsheet className="w-8 h-8 text-brand-primary" />
            <div className="font-semibold text-text-primary text-sm text-center">
              {selectedFile ? selectedFile : "Click to select or drop .xlsx / .csv file"}
            </div>
            <span className="text-text-muted text-[11px]">
              {selectedFile ? "File verified: 38 student rows parsed" : "Max file size: 10MB"}
            </span>
          </div>

          {selectedFile && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Zero validation errors found. Roll numbers matched against Student Master entities.
              </span>
            </div>
          )}
        </div>
      </SlideOver>
    </AppShell>
  )
}
