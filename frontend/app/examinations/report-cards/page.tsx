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
  SlideOver,
} from "@/components/ui"
import {
  Award,
  Download,
  Printer,
  FileText,
  Search,
  CheckCircle2,
  GraduationCap,
  Building2,
  User,
} from "lucide-react"

interface ReportCardStudent {
  studentId: string
  rollNumber: string
  name: string
  admissionNo: string
  totalMarks: number
  maxTotal: number
  percentage: number
  overallGrade: string
  rank: number
  subjects: { name: string; theory: number; practical: number; total: number; grade: string }[]
}

const REPORT_CARD_DATA: ReportCardStudent[] = [
  {
    studentId: "std-001",
    rollNumber: "10-A-01",
    name: "Sai Teja Chary",
    admissionNo: "NGS-HYD-2026-001",
    totalMarks: 462,
    maxTotal: 500,
    percentage: 92.4,
    overallGrade: "A1",
    rank: 2,
    subjects: [
      { name: "Mathematics Standard (041)", theory: 76, practical: 19, total: 95, grade: "A1" },
      { name: "Science & Technology (086)", theory: 74, practical: 19, total: 93, grade: "A1" },
      { name: "Social Science (087)", theory: 71, practical: 20, total: 91, grade: "A1" },
      { name: "English Language & Lit (184)", theory: 73, practical: 19, total: 92, grade: "A1" },
      { name: "Computer Applications (165)", theory: 45, practical: 46, total: 91, grade: "A1" },
    ],
  },
  {
    studentId: "std-002",
    rollNumber: "10-A-02",
    name: "Ananya Reddy",
    admissionNo: "NGS-HYD-2026-002",
    totalMarks: 478,
    maxTotal: 500,
    percentage: 95.6,
    overallGrade: "A1",
    rank: 1,
    subjects: [
      { name: "Mathematics Standard (041)", theory: 78, practical: 20, total: 98, grade: "A1" },
      { name: "Science & Technology (086)", theory: 76, practical: 20, total: 96, grade: "A1" },
      { name: "Social Science (087)", theory: 74, practical: 20, total: 94, grade: "A1" },
      { name: "English Language & Lit (184)", theory: 75, practical: 19, total: 94, grade: "A1" },
      { name: "Computer Applications (165)", theory: 47, practical: 49, total: 96, grade: "A1" },
    ],
  },
  {
    studentId: "std-003",
    rollNumber: "10-A-03",
    name: "Rohan Kumar",
    admissionNo: "NGS-HYD-2026-003",
    totalMarks: 418,
    maxTotal: 500,
    percentage: 83.6,
    overallGrade: "A2",
    rank: 4,
    subjects: [
      { name: "Mathematics Standard (041)", theory: 68, practical: 17, total: 85, grade: "A2" },
      { name: "Science & Technology (086)", theory: 65, practical: 18, total: 83, grade: "A2" },
      { name: "Social Science (087)", theory: 67, practical: 19, total: 86, grade: "A2" },
      { name: "English Language & Lit (184)", theory: 64, practical: 18, total: 82, grade: "A2" },
      { name: "Computer Applications (165)", theory: 40, practical: 42, total: 82, grade: "A2" },
    ],
  },
  {
    studentId: "std-004",
    rollNumber: "10-A-04",
    name: "Sana Fathima",
    admissionNo: "NGS-HYD-2026-004",
    totalMarks: 446,
    maxTotal: 500,
    percentage: 89.2,
    overallGrade: "A1",
    rank: 3,
    subjects: [
      { name: "Mathematics Standard (041)", theory: 72, practical: 18, total: 90, grade: "A1" },
      { name: "Science & Technology (086)", theory: 70, practical: 19, total: 89, grade: "A1" },
      { name: "Social Science (087)", theory: 71, practical: 19, total: 90, grade: "A1" },
      { name: "English Language & Lit (184)", theory: 70, practical: 18, total: 88, grade: "A1" },
      { name: "Computer Applications (165)", theory: 44, practical: 45, total: 89, grade: "A1" },
    ],
  },
]

export default function ReportCardsPage() {
  const [selectedTerm, setSelectedTerm] = useState("Mid-Term Examination 2026")
  const [selectedClass, setSelectedClass] = useState("Class 10")
  const [selectedSection, setSelectedSection] = useState("Section A - Ramanujan")
  const [activePreviewStudent, setActivePreviewStudent] = useState<ReportCardStudent | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStudents = REPORT_CARD_DATA.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell
      pageTitle="Report Cards & Scholastic Ledger"
      breadcrumbs={[{ label: "Examinations", href: "/examinations/schedules" }, { label: "Report Cards" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => alert("Batch PDF archive generated: All Class 10 Report Cards downloaded!")}
          >
            Download All (ZIP / PDF)
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Examination Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="Mid-Term Examination 2026">Mid-Term Examination 2026</option>
              <option value="Periodic Assessment I">Periodic Assessment I</option>
              <option value="Annual CBSE Board Assessment">Annual CBSE Board Assessment</option>
            </select>
          </div>
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
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Quick Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-canvas border border-border-default rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>

        {/* Student Cards List */}
        <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-subtle border-b border-border-default text-text-secondary uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Dossier</th>
                  <th className="py-3 px-4">Aggregate Marks</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">CBSE Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredStudents.map((st) => (
                  <tr key={st.studentId} className="hover:bg-subtle/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">
                      <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary inline-flex items-center justify-center text-xs">
                        #{st.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-text-secondary">{st.rollNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-brand-primary" />
                        <span>{st.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-text-muted">{st.admissionNo}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">
                      {st.totalMarks} / {st.maxTotal}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{st.percentage}%</td>
                    <td className="py-3 px-4">
                      <Badge variant="positive" className="font-mono font-bold">
                        {st.overallGrade}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="dense"
                        variant="secondary"
                        leadingIcon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => setActivePreviewStudent(st)}
                      >
                        Preview Card
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Card Preview Drawer */}
      <SlideOver
        open={activePreviewStudent !== null}
        onClose={() => setActivePreviewStudent(null)}
        title="CBSE Scholastic Progress Card"
        subtitle={activePreviewStudent ? `${activePreviewStudent.name} • ${activePreviewStudent.rollNumber}` : ""}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              size="dense"
              variant="secondary"
              leadingIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print Card
            </Button>
            <Button
              size="dense"
              variant="primary"
              leadingIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => alert("Report Card PDF downloaded successfully!")}
            >
              Download Signed PDF
            </Button>
          </div>
        }
      >
        {activePreviewStudent && (
          <div className="py-4 space-y-6">
            {/* Institution Letterhead */}
            <div className="text-center p-4 bg-canvas rounded-xl border border-border-default">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold text-sm text-text-primary">Narayana e-Techno School</h3>
              </div>
              <p className="text-[11px] text-text-secondary">Affiliated to CBSE, New Delhi (Affiliation No: 3630128)</p>
              <p className="text-[10px] text-text-muted mt-0.5">Madhapur Campus, Hyderabad, Telangana - 500081</p>
              <div className="mt-2 pt-2 border-t border-border-default">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Academic Session 2026-27 • {selectedTerm}
                </span>
              </div>
            </div>

            {/* Student Dossier Summary */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-subtle rounded-xl text-xs">
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-semibold">Student Name</span>
                <span className="font-bold text-text-primary">{activePreviewStudent.name}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-semibold">Admission Number</span>
                <span className="font-mono text-text-primary">{activePreviewStudent.admissionNo}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-semibold">Class & Section</span>
                <span className="text-text-primary">{selectedClass} - {selectedSection}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-semibold">Roll Number</span>
                <span className="font-mono text-text-primary">{activePreviewStudent.rollNumber}</span>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="border border-border-default rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-border-default text-text-secondary font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Theory (80)</th>
                    <th className="py-2.5 px-3 text-center">IA / Pract (20)</th>
                    <th className="py-2.5 px-3 text-center">Total (100)</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {activePreviewStudent.subjects.map((sub, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-medium text-text-primary">{sub.name}</td>
                      <td className="py-2 px-3 text-center font-mono">{sub.theory}</td>
                      <td className="py-2 px-3 text-center font-mono">{sub.practical}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-text-primary">{sub.total}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="positive" className="text-[10px] font-mono font-bold">
                          {sub.grade}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-canvas font-bold text-text-primary">
                    <td className="py-2.5 px-3">Aggregate Scholastic Score</td>
                    <td colSpan={2} className="py-2.5 px-3 text-center font-mono">
                      {activePreviewStudent.percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-600">
                      {activePreviewStudent.totalMarks} / {activePreviewStudent.maxTotal}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="positive">{activePreviewStudent.overallGrade}</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Principal & Class Teacher Sign-off */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-default text-center text-xs">
              <div>
                <div className="h-10 flex items-end justify-center font-serif italic text-text-muted">
                  Smt. K. Ananya Reddy
                </div>
                <div className="border-t border-border-default pt-1 font-semibold text-text-secondary">
                  Class Teacher
                </div>
              </div>
              <div>
                <div className="h-10 flex items-end justify-center font-serif italic text-text-muted">
                  Dr. P. Venkata Subba Rao
                </div>
                <div className="border-t border-border-default pt-1 font-semibold text-text-secondary">
                  Principal & Head of Institution
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}
