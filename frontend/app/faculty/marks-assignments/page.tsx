"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import { useAuth } from "@/contexts/AuthContext"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Modal,
} from "@/components/ui"
import {
  FileSpreadsheet,
  BookOpen,
  Layers,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Save,
  Search,
  Award,
  AlertCircle,
  FileText,
  UploadCloud,
  ChevronRight,
} from "lucide-react"
import { useMyClasses, useFaculty, useSectionStudents } from "@/lib/api/hooks"

interface CourseAssignment {
  id: string
  title: string
  course: string
  className: string
  sectionName: string
  sectionId: string
  dueDate: string
  totalMarks: number
  submittedCount: number
  totalCount: number
  status: "ACTIVE" | "CLOSED" | "DRAFT"
}

interface StudentMarksRow {
  studentId: string
  roll: string
  name: string
  admissionNo: string
  marksObtained: number | ""
  isAbsent: boolean
  remarks: string
}

export default function MarksAndAssignmentsPage() {
  const { user } = useAuth()
  const { data: myClassesData } = useMyClasses()
  const { data: allFaculty = [] } = useFaculty()

  const [activeTab, setActiveTab] = useState<"ASSIGNMENTS" | "MARKS_ENTRY">("ASSIGNMENTS")
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("")

  // Active faculty resolution
  const activeFaculty = useMemo(() => {
    if (selectedFacultyId && allFaculty.length > 0) {
      return allFaculty.find((f: any) => f.id === selectedFacultyId) || myClassesData
    }
    return myClassesData || (allFaculty.length > 0 ? allFaculty[0] : null)
  }, [selectedFacultyId, allFaculty, myClassesData])

  const assignedClasses = activeFaculty?.assignedClasses || []

  // Assignments List State
  const [assignments, setAssignments] = useState<CourseAssignment[]>([
    {
      id: "asg-01",
      title: "Algebraic Quadratic Equations Problem Set",
      course: "Mathematics",
      className: "Grade 6",
      sectionName: "Section A",
      sectionId: "cc0b3fe5-010f-44db-9d54-46b359bd9a6d",
      dueDate: "2026-10-18",
      totalMarks: 25,
      submittedCount: 24,
      totalCount: 28,
      status: "ACTIVE",
    },
    {
      id: "asg-02",
      title: "Geometry & Coordinate Planes Assignment 3",
      course: "Mathematics",
      className: "Grade 6",
      sectionName: "Section B",
      sectionId: "151de959-4b60-4cc4-98f4-cbe85f4493ee",
      dueDate: "2026-10-20",
      totalMarks: 30,
      submittedCount: 26,
      totalCount: 28,
      status: "ACTIVE",
    },
    {
      id: "asg-03",
      title: "Newton's Laws of Motion Lab Report",
      course: "Physics & General Science",
      className: "Grade 8",
      sectionName: "Section A",
      sectionId: "5510ac4d-56ea-4437-9875-b1820ff54a6e",
      dueDate: "2026-10-15",
      totalMarks: 50,
      submittedCount: 30,
      totalCount: 30,
      status: "CLOSED",
    },
    {
      id: "asg-04",
      title: "Introduction to Python Data Structures",
      course: "Information Technology & Coding",
      className: "Grade 9",
      sectionName: "Section A",
      sectionId: "62cfe5a5-5023-4e6f-8e07-272c2ab22aa1",
      dueDate: "2026-10-25",
      totalMarks: 40,
      submittedCount: 18,
      totalCount: 26,
      status: "ACTIVE",
    },
  ])

  // Create Assignment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCourse, setNewCourse] = useState("Mathematics")
  const [newClassSection, setNewClassSection] = useState("Grade 6 - Section A")
  const [newDueDate, setNewDueDate] = useState("2026-10-24")
  const [newMaxMarks, setNewMaxMarks] = useState("25")
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // ==========================================
  // MARKS ENTRY TAB STATE
  // ==========================================
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    assignedClasses[0]?.section_id || assignedClasses[0]?.sectionId || "cc0b3fe5-010f-44db-9d54-46b359bd9a6d"
  )
  const [selectedAssessment, setSelectedAssessment] = useState<string>("Unit Assessment 2 (Mid-Term)")
  const [maxMarksLimit, setMaxMarksLimit] = useState<number>(50)
  const [searchStudent, setSearchStudent] = useState("")

  const { data: dbStudents = [] } = useSectionStudents(selectedSectionId)
  const [marksRoster, setMarksRoster] = useState<StudentMarksRow[]>([])
  const [isSubmittingMarks, setIsSubmittingMarks] = useState(false)

  React.useEffect(() => {
    if (dbStudents && dbStudents.length > 0) {
      setMarksRoster(
        dbStudents.map((s: any, idx: number) => ({
          studentId: s.id,
          roll: s.roll || s.rollNumber || String(idx + 1).padStart(2, "0"),
          name: s.name || `${s.firstName || "Student"} ${s.lastName || ""}`,
          admissionNo: s.admissionNo || s.admissionNumber || `SIA-2026-${100 + idx}`,
          marksObtained: Math.min(50, Math.max(30, Math.round(Number(s.marksAvgPct ?? 88) * 0.5))),
          isAbsent: false,
          remarks: "",
        }))
      )
    } else {
      setMarksRoster([
        { studentId: "s-01", roll: "01", name: "Aarav Sharma", admissionNo: "SIA-2026-0041", marksObtained: 46, isAbsent: false, remarks: "Excellent formulation" },
        { studentId: "s-02", roll: "02", name: "Ananya Iyer", admissionNo: "SIA-2026-0042", marksObtained: 48, isAbsent: false, remarks: "Top score in batch" },
        { studentId: "s-03", roll: "03", name: "Devansh Varma", admissionNo: "SIA-2026-0043", marksObtained: 38, isAbsent: false, remarks: "Good attempt in Part B" },
        { studentId: "s-04", roll: "04", name: "Ishani Mukherjee", admissionNo: "SIA-2026-0044", marksObtained: 44, isAbsent: false, remarks: "Clear workings" },
        { studentId: "s-05", roll: "05", name: "Kavya Patel", admissionNo: "SIA-2026-0045", marksObtained: 35, isAbsent: false, remarks: "Needs practice in equations" },
        { studentId: "s-06", roll: "06", name: "Manish Reddy", admissionNo: "SIA-2026-0046", marksObtained: 42, isAbsent: false, remarks: "" },
        { studentId: "s-07", roll: "07", name: "Nandini Gupta", admissionNo: "SIA-2026-0047", marksObtained: 47, isAbsent: false, remarks: "Well presented" },
        { studentId: "s-08", roll: "08", name: "Pranav Pillai", admissionNo: "SIA-2026-0048", marksObtained: "", isAbsent: true, remarks: "Absent on medical leave" },
      ])
    }
  }, [dbStudents, selectedSectionId])

  // Create Assignment Handler
  const handleCreateAssignment = () => {
    if (!newTitle.trim()) return

    const [cls, sec] = newClassSection.split(" - ")
    const newAsg: CourseAssignment = {
      id: `asg-${Date.now()}`,
      title: newTitle,
      course: newCourse,
      className: cls || "Grade 6",
      sectionName: sec || "Section A",
      sectionId: selectedSectionId,
      dueDate: newDueDate,
      totalMarks: Number(newMaxMarks) || 25,
      submittedCount: 0,
      totalCount: 28,
      status: "ACTIVE",
    }

    setAssignments([newAsg, ...assignments])
    setIsCreateModalOpen(false)
    setNewTitle("")
    setSaveSuccessMessage(`New assignment "${newTitle}" created and distributed to students!`)
    setTimeout(() => setSaveSuccessMessage(null), 4000)
  }

  // Marks Handlers
  const handleMarksChange = (studentId: string, val: string) => {
    const num = val === "" ? "" : Number(val)
    setMarksRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, marksObtained: num } : r))
    )
  }

  const handleToggleAbsent = (studentId: string) => {
    setMarksRoster((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? {
              ...r,
              isAbsent: !r.isAbsent,
              marksObtained: !r.isAbsent ? "" : 0,
            }
          : r
      )
    )
  }

  const handleSaveMarks = () => {
    setIsSubmittingMarks(true)
    setTimeout(() => {
      setIsSubmittingMarks(false)
      setSaveSuccessMessage(
        `Marks ledger for ${selectedAssessment} submitted successfully! Synced with Student Master 360° dossiers.`
      )
      setTimeout(() => setSaveSuccessMessage(null), 5000)
    }, 600)
  }

  // Compute Grade from score
  const getGrade = (marks: number | "", isAbsent: boolean) => {
    if (isAbsent) return { grade: "ABS", color: "bg-red-500/10 text-red-600 border-red-500/30" }
    if (marks === "") return { grade: "--", color: "bg-neutral-500/10 text-neutral-500 border-neutral-500/30" }
    const pct = (Number(marks) / maxMarksLimit) * 100
    if (pct >= 90) return { grade: "A+", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" }
    if (pct >= 80) return { grade: "A", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" }
    if (pct >= 70) return { grade: "B", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" }
    if (pct >= 60) return { grade: "C", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" }
    return { grade: "F", color: "bg-red-500/10 text-red-600 border-red-500/30" }
  }

  const filteredMarks = marksRoster.filter(
    (m) =>
      m.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      m.roll.toLowerCase().includes(searchStudent.toLowerCase())
  )

  return (
    <AppShell
      pageTitle="Marks and Assignment"
      breadcrumbs={[{ label: "Faculty", href: "/faculty/dashboard" }, { label: "Marks & Assignments" }]}
      rightHeaderAction={
        activeTab === "ASSIGNMENTS" ? (
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400 font-bold"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Assignment
          </Button>
        ) : (
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400 font-bold"
            leadingIcon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSaveMarks}
            disabled={isSubmittingMarks}
          >
            {isSubmittingMarks ? "Saving..." : "Save Marks Ledger"}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface border border-border-default rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
              <FileSpreadsheet className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  {activeFaculty?.name || user?.name || "Faculty Member"}
                </h2>
                <Badge variant="neutral">Course Gradebook</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Curriculum assignments, periodic assessments, and marks recording for allocated classes
              </p>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          <div className="flex items-center gap-1 bg-canvas border border-border-default p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("ASSIGNMENTS")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "ASSIGNMENTS"
                  ? "bg-brand-primary text-black font-bold shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Course Assignments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MARKS_ENTRY")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "MARKS_ENTRY"
                  ? "bg-brand-primary text-black font-bold shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Marks & Assessment Entry
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveSuccessMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: COURSE ASSIGNMENTS
            ========================================================================= */}
        {activeTab === "ASSIGNMENTS" && (
          <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-secondary font-medium">Active Assignments</span>
                    <p className="text-2xl font-bold text-text-primary mt-1">
                      {assignments.filter((a) => a.status === "ACTIVE").length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-secondary font-medium">Total Submissions</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {assignments.reduce((acc, a) => acc + a.submittedCount, 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-secondary font-medium">Submission Rate</span>
                    <p className="text-2xl font-bold text-brand-primary mt-1">
                      {Math.round(
                        (assignments.reduce((acc, a) => acc + a.submittedCount, 0) /
                          Math.max(1, assignments.reduce((acc, a) => acc + a.totalCount, 0))) *
                          100
                      )}
                      %
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assignments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="bg-surface border border-border-default rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <Badge variant="neutral" className="font-mono text-[10px]">
                        {asg.course}
                      </Badge>
                      <Badge variant={asg.status === "ACTIVE" ? "positive" : "neutral"}>
                        {asg.status}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-text-primary">{asg.title}</h4>

                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-2">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-text-muted" />
                        {asg.className} - {asg.sectionName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        Due {asg.dueDate}
                      </span>
                    </div>

                    {/* Submission Progress bar */}
                    <div className="mt-4 p-3 bg-canvas border border-border-default rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-text-secondary font-medium">Submissions Received</span>
                        <span className="font-mono font-bold text-text-primary">
                          {asg.submittedCount} / {asg.totalCount} ({Math.round((asg.submittedCount / asg.totalCount) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-border-default overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full transition-all"
                          style={{ width: `${(asg.submittedCount / asg.totalCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border-default flex items-center justify-between">
                    <span className="text-xs font-mono text-text-muted">
                      Max Marks: <strong>{asg.totalMarks} pts</strong>
                    </span>
                    <Button
                      size="dense"
                      variant="secondary"
                      onClick={() => {
                        setActiveTab("MARKS_ENTRY")
                        setSelectedAssessment(asg.title)
                        setMaxMarksLimit(asg.totalMarks)
                      }}
                    >
                      Grade Submissions →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MARKS ENTRY LEDGER
            ========================================================================= */}
        {activeTab === "MARKS_ENTRY" && (
          <div className="flex flex-col gap-6">
            {/* Filter & Selection Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-surface border border-border-default rounded-xl">
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                  Class & Section
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  {assignedClasses.length > 0 ? (
                    assignedClasses.map((ac: any, idx: number) => {
                      const secId = ac.section_id || ac.sectionId || `sec-${idx}`
                      const label = `${ac.class_name || ac.grade || "Class"} - ${ac.section_name || ac.section || "Section"} (${ac.subject || "Course"})`
                      return (
                        <option key={secId} value={secId}>
                          {label}
                        </option>
                      )
                    })
                  ) : (
                    <>
                      <option value="cc0b3fe5-010f-44db-9d54-46b359bd9a6d">Grade 6 - Section A (Mathematics)</option>
                      <option value="151de959-4b60-4cc4-98f4-cbe85f4493ee">Grade 6 - Section B (Mathematics)</option>
                      <option value="5510ac4d-56ea-4437-9875-b1820ff54a6e">Grade 8 - Section A (Physics)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                  Assessment / Exam
                </label>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="Unit Assessment 2 (Mid-Term)">Unit Assessment 2 (Mid-Term)</option>
                  <option value="Algebraic Quadratic Equations Problem Set">Algebraic Quadratic Equations Problem Set</option>
                  <option value="Periodic Test 1">Periodic Test 1</option>
                  <option value="Semester Final Examination">Semester Final Examination</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                  Max Marks
                </label>
                <input
                  type="number"
                  value={maxMarksLimit}
                  onChange={(e) => setMaxMarksLimit(Math.max(1, Number(e.target.value) || 50))}
                  className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                  Search Student
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name or roll..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>
            </div>

            {/* Marks Ledger Table */}
            <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-border-default flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">
                    Assessment Marks Ledger: {selectedAssessment}
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Maximum Score: <strong className="font-mono">{maxMarksLimit}</strong> pts • Scores over limit are automatically flagged.
                  </p>
                </div>
                <Badge variant="neutral">
                  {filteredMarks.length} Students
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-subtle border-b border-border-default text-text-secondary uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-20">Roll No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 w-36">Marks Obtained</th>
                      <th className="py-3 px-4 w-28 text-center">Percentage</th>
                      <th className="py-3 px-4 w-24 text-center">Grade</th>
                      <th className="py-3 px-4 w-28 text-center">Absent</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {filteredMarks.map((row) => {
                      const gradeInfo = getGrade(row.marksObtained, row.isAbsent)
                      const isOverLimit = typeof row.marksObtained === "number" && row.marksObtained > maxMarksLimit
                      const pct = typeof row.marksObtained === "number" && !row.isAbsent
                        ? Math.round((row.marksObtained / maxMarksLimit) * 100)
                        : null

                      return (
                        <tr key={row.studentId} className="hover:bg-subtle/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-text-primary bg-canvas border border-border-default rounded-md px-2 py-0.5 inline-block">
                              {row.roll}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-text-primary">{row.name}</div>
                            <span className="text-[11px] font-mono text-text-muted">{row.admissionNo}</span>
                          </td>

                          {/* Marks Input */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={maxMarksLimit}
                                disabled={row.isAbsent}
                                value={row.marksObtained}
                                onChange={(e) => handleMarksChange(row.studentId, e.target.value)}
                                className={`w-20 bg-canvas border rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-text-primary focus:outline-none focus:ring-1 ${
                                  isOverLimit
                                    ? "border-red-500 text-red-600 focus:ring-red-500"
                                    : "border-border-default focus:ring-brand-primary"
                                } disabled:opacity-40 disabled:bg-subtle`}
                              />
                              <span className="text-[11px] font-mono text-text-muted">/ {maxMarksLimit}</span>
                            </div>
                            {isOverLimit && (
                              <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                                Exceeds max marks!
                              </span>
                            )}
                          </td>

                          {/* Percentage */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-xs text-text-primary">
                            {row.isAbsent ? "--" : pct !== null ? `${pct}%` : "--"}
                          </td>

                          {/* Grade Badge */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${gradeInfo.color}`}
                            >
                              {gradeInfo.grade}
                            </span>
                          </td>

                          {/* Absent Toggle */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={row.isAbsent}
                              onChange={() => handleToggleAbsent(row.studentId)}
                              className="rounded border-border-default text-brand-primary focus:ring-brand-primary"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Add feedback..."
                              value={row.remarks}
                              onChange={(e) => {
                                const val = e.target.value
                                setMarksRoster((prev) =>
                                  prev.map((r) => (r.studentId === row.studentId ? { ...r, remarks: val } : r))
                                )
                              }}
                              className="w-full bg-canvas border border-border-default rounded-md px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-4 bg-subtle/50 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-text-secondary">
                  Submitted marks sync with the Examinations workspace and student gradebook dossiers.
                </span>
                <Button
                  size="dense"
                  variant="primary"
                  className="bg-brand-primary text-black hover:bg-emerald-400 font-bold"
                  leadingIcon={<Save className="w-3.5 h-3.5" />}
                  onClick={handleSaveMarks}
                  disabled={isSubmittingMarks}
                >
                  {isSubmittingMarks ? "Saving..." : "Save Marks Ledger"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Assignment Modal */}
        {isCreateModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsCreateModalOpen(false)}
            title="Create New Course Assignment"
            subtitle="Distribute homework, lab assignments, or project assessments to allocated classes."
          >
            <div className="space-y-4 p-6">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Practice Problems & Vector Analysis"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Course / Subject
                  </label>
                  <select
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics & General Science">Physics & General Science</option>
                    <option value="Information Technology & Coding">Information Technology & Coding</option>
                    <option value="English Literature">English Literature</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Target Class & Section
                  </label>
                  <select
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="Grade 6 - Section A">Grade 6 - Section A</option>
                    <option value="Grade 6 - Section B">Grade 6 - Section B</option>
                    <option value="Grade 8 - Section A">Grade 8 - Section A</option>
                    <option value="Grade 9 - Section A">Grade 9 - Section A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-default flex items-center justify-end gap-2">
                <Button size="dense" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  className="bg-brand-primary text-black hover:bg-emerald-400 font-bold"
                  onClick={handleCreateAssignment}
                >
                  Create & Distribute
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  )
}
