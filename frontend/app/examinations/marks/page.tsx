"use client"

import React, { useState, useMemo } from "react"
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
} from "@/components/ui"
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Lock,
  Download,
  Filter,
  Calculator,
  Award,
  AlertCircle,
  GraduationCap,
} from "lucide-react"

interface StudentMarksRow {
  studentId: string
  rollNumber: string
  studentName: string
  maxMarks: number
  marksObtained: number | ""
  remarks: string
  locked: boolean
}

const INITIAL_ROSTER: StudentMarksRow[] = [
  {
    studentId: "std-001",
    rollNumber: "10-A-01",
    studentName: "Sai Teja Chary",
    maxMarks: 80,
    marksObtained: 76,
    remarks: "Exceptional algebraic reasoning",
    locked: false,
  },
  {
    studentId: "std-002",
    rollNumber: "10-A-02",
    studentName: "Ananya Reddy",
    maxMarks: 80,
    marksObtained: 78,
    remarks: "Perfect trigonometry solutions",
    locked: false,
  },
  {
    studentId: "std-003",
    rollNumber: "10-A-03",
    studentName: "Rohan Kumar",
    maxMarks: 80,
    marksObtained: 68,
    remarks: "Good conceptual clarity",
    locked: false,
  },
  {
    studentId: "std-004",
    rollNumber: "10-A-04",
    studentName: "Sana Fathima",
    maxMarks: 80,
    marksObtained: 72,
    remarks: "Well structured geometry proofs",
    locked: false,
  },
  {
    studentId: "std-005",
    rollNumber: "10-A-05",
    studentName: "Karthik Verma",
    maxMarks: 80,
    marksObtained: 64,
    remarks: "Needs practice in coordinate geometry",
    locked: false,
  },
]

function calculateCbseGrade(marks: number, max: number): { grade: string; color: string } {
  const pct = (marks / max) * 100
  if (pct >= 91) return { grade: "A1", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" }
  if (pct >= 81) return { grade: "A2", color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40" }
  if (pct >= 71) return { grade: "B1", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" }
  if (pct >= 61) return { grade: "B2", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" }
  if (pct >= 51) return { grade: "C1", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" }
  if (pct >= 41) return { grade: "C2", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40" }
  if (pct >= 33) return { grade: "D", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40" }
  return { grade: "E (Re-test)", color: "text-red-600 bg-red-50 dark:bg-red-950/40" }
}

export default function MarksEntryPage() {
  const [selectedClass, setSelectedClass] = useState("Class 10")
  const [selectedSection, setSelectedSection] = useState("Section A - Ramanujan")
  const [selectedExam, setSelectedExam] = useState("Mid-Term Examination 2026")
  const [selectedSubject, setSelectedSubject] = useState("Mathematics Standard (041)")
  const [roster, setRoster] = useState<StudentMarksRow[]>(INITIAL_ROSTER)
  const [isSaved, setIsSaved] = useState(false)
  const [isLockedAll, setIsLockedAll] = useState(false)

  const handleMarkChange = (studentId: string, val: string) => {
    const num = val === "" ? "" : Math.min(80, Math.max(0, Number(val)))
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, marksObtained: num } : r))
    )
    setIsSaved(false)
  }

  const handleRemarkChange = (studentId: string, remark: string) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks: remark } : r))
    )
    setIsSaved(false)
  }

  const stats = useMemo(() => {
    const validMarks = roster
      .map((r) => (typeof r.marksObtained === "number" ? r.marksObtained : null))
      .filter((m): m is number => m !== null)

    if (validMarks.length === 0) return { avg: 0, highest: 0, passPct: 100 }
    const sum = validMarks.reduce((a, b) => a + b, 0)
    const avg = Math.round(sum / validMarks.length)
    const highest = Math.max(...validMarks)
    const passed = validMarks.filter((m) => m >= 27).length
    const passPct = Math.round((passed / validMarks.length) * 100)

    return { avg, highest, passPct }
  }, [roster])

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleLockMarks = () => {
    setIsLockedAll(true)
    setRoster((prev) => prev.map((r) => ({ ...r, locked: true })))
  }

  return (
    <AppShell
      pageTitle="Marks Entry & Ledger"
      breadcrumbs={[{ label: "Examinations", href: "/examinations/schedules" }, { label: "Marks Entry" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => alert("Marks ledger exported to Excel successfully!")}
          >
            Export Sheet
          </Button>
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Lock className="w-3.5 h-3.5" />}
            disabled={isLockedAll}
            onClick={handleLockMarks}
          >
            {isLockedAll ? "Marks Locked" : "Lock Ledger"}
          </Button>
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSave}
          >
            Save Marks
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Students Evaluated</span>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {roster.filter((r) => r.marksObtained !== "").length} / {roster.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Class Average</span>
                <p className="text-2xl font-bold text-text-primary mt-1">{stats.avg} / 80</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Top Score</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.highest} / 80</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Passing Rate</span>
                <p className="text-2xl font-bold text-text-primary mt-1">{stats.passPct}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Class / Grade</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="Class 10">Class 10</option>
              <option value="Class 9">Class 9</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="Section A - Ramanujan">Section A - Ramanujan</option>
              <option value="Section B - Aryabhata">Section B - Aryabhata</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Examination Term</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="Mid-Term Examination 2026">Mid-Term Examination 2026</option>
              <option value="Periodic Assessment II">Periodic Assessment II</option>
              <option value="Pre-Board Examination">Pre-Board Examination</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="Mathematics Standard (041)">Mathematics Standard (041)</option>
              <option value="Science & Technology (086)">Science & Tech (086)</option>
              <option value="English Literature (184)">English Literature (184)</option>
            </select>
          </div>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Marks Ledger saved and synced with student academic history!</span>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-subtle border-b border-border-default text-text-secondary uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4 w-32">Marks Obtained</th>
                  <th className="py-3 px-4 w-28">CBSE Grade</th>
                  <th className="py-3 px-4">Evaluator Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {roster.map((row) => {
                  const cbse =
                    typeof row.marksObtained === "number"
                      ? calculateCbseGrade(row.marksObtained, row.maxMarks)
                      : { grade: "—", color: "text-text-muted bg-subtle" }

                  return (
                    <tr key={row.studentId} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-text-secondary">{row.rollNumber}</td>
                      <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-brand-primary" />
                        <span>{row.studentName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-text-muted">{row.maxMarks}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          max={row.maxMarks}
                          disabled={row.locked || isLockedAll}
                          value={row.marksObtained}
                          onChange={(e) => handleMarkChange(row.studentId, e.target.value)}
                          className="w-24 bg-canvas border border-border-default rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-brand-primary disabled:opacity-60"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${cbse.color}`}>
                          {cbse.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          disabled={row.locked || isLockedAll}
                          value={row.remarks}
                          onChange={(e) => handleRemarkChange(row.studentId, e.target.value)}
                          className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-primary disabled:opacity-60"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
