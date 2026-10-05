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
const INITIAL_EXAMS: ExamSchedule[] = [
  {
    id: "ex-001",
    title: "Mid-Term Examination 2026",
    grade: "Class 10 (CBSE)",
    subject: "Mathematics Standard (041)",
    date: "2026-10-15",
    time: "09:30 AM - 12:30 PM",
    maxMarks: 80,
    hall: "Aryabhata Hall A-101",
    status: "SCHEDULED",
  },
  {
    id: "ex-002",
    title: "Mid-Term Examination 2026",
    grade: "Class 10 (CBSE)",
    subject: "Science & Technology (086)",
    date: "2026-10-18",
    time: "09:30 AM - 12:30 PM",
    maxMarks: 80,
    hall: "CV Raman Lab B-204",
    status: "SCHEDULED",
  },
  {
    id: "ex-003",
    title: "Periodic Assessment II",
    grade: "Class 9 (CBSE)",
    subject: "Computer Applications (165)",
    date: "2026-10-12",
    time: "10:00 AM - 11:30 AM",
    maxMarks: 50,
    hall: "Turing Computing Lab",
    status: "MARKS_UPLOADED",
  },
  {
    id: "ex-004",
    title: "Periodic Assessment I",
    grade: "Class 10 (CBSE)",
    subject: "English Language & Literature (184)",
    date: "2026-09-20",
    time: "09:30 AM - 12:30 PM",
    maxMarks: 80,
    hall: "Tagore Memorial Hall",
    status: "PUBLISHED",
  },
  {
    id: "ex-005",
    title: "Periodic Assessment I",
    grade: "Class 9 (CBSE)",
    subject: "Social Science (087)",
    date: "2026-09-22",
    time: "09:30 AM - 12:30 PM",
    maxMarks: 80,
    hall: "Visvesvaraya Auditorium",
    status: "PUBLISHED",
  },
]

export default function ExaminationsPage() {
  const [exams, setExams] = useState<ExamSchedule[]>(INITIAL_EXAMS)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  // Create form state
  const [newTitle, setNewTitle] = useState("")
  const [newGrade, setNewGrade] = useState("Class 10 (CBSE)")
  const [newSubject, setNewSubject] = useState("Mathematics Standard (041)")
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("09:30 AM - 12:30 PM")
  const [newMaxMarks, setNewMaxMarks] = useState(80)
  const [newHall, setNewHall] = useState("Main Examination Hall")

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
            onClick={() => setCreateModalOpen(true)}
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

      {/* Create Exam Schedule Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-border-default rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <span>Configure Exam Schedule</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-sm p-1"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newTitle.trim() || !newDate) return
                const newExam: ExamSchedule = {
                  id: `ex-${Date.now()}`,
                  title: newTitle.trim(),
                  grade: newGrade,
                  subject: newSubject,
                  date: newDate,
                  time: newTime,
                  maxMarks: Number(newMaxMarks) || 80,
                  hall: newHall.trim() || "Main Hall",
                  status: "SCHEDULED",
                }
                setExams([newExam, ...exams])
                setCreateModalOpen(false)
                setNewTitle("")
                setNewDate("")
              }}
              className="space-y-3 mt-4"
            >
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Examination Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE Term 2 Board Mock"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Grade / Class *
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                  >
                    <option value="Class 10 (CBSE)">Class 10 (CBSE)</option>
                    <option value="Class 9 (CBSE)">Class 9 (CBSE)</option>
                    <option value="Class 8 (CBSE)">Class 8 (CBSE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Subject *
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                  >
                    <option value="Mathematics Standard (041)">Mathematics (041)</option>
                    <option value="Science & Technology (086)">Science (086)</option>
                    <option value="Social Science (087)">Social Science (087)</option>
                    <option value="English Language & Literature (184)">English (184)</option>
                    <option value="Computer Applications (165)">Computers (165)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Exam Hall / Room
                  </label>
                  <input
                    type="text"
                    value={newHall}
                    onChange={(e) => setNewHall(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default mt-4">
                <Button size="dense" variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="dense" variant="primary" type="submit">
                  Publish Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
