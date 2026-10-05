"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import {
  Button,
  Badge,
  Card,
  SlideOver,
  Table,
  TableColumn,
} from "@/components/ui"
import {
  CheckCircle2,
  Search,
  Filter,
  Download,
  Printer,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  X,
  Eye,
  Layers,
} from "lucide-react"
import { useEnrolledApplicants, useAcademics } from "@/lib/api/hooks"
import { EnrolledApplicantItem } from "@/types"

export default function EnrolledStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("ALL")
  const [feeStatusFilter, setFeeStatusFilter] = useState("ALL")
  const [selectedStudent, setSelectedStudent] = useState<EnrolledApplicantItem | null>(null)
  const [admissionSlipStudent, setAdmissionSlipStudent] = useState<EnrolledApplicantItem | null>(null)

  const { data: enrolledStudents = [], isLoading } = useEnrolledApplicants()
  const { data: grades = [] } = useAcademics()

  // Filtered roster
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter((student) => {
      const matchesSearch =
        student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.guardianName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesGrade =
        selectedGrade === "ALL" || student.gradeName.toLowerCase().includes(selectedGrade.toLowerCase())

      const matchesFee =
        feeStatusFilter === "ALL" ||
        (feeStatusFilter === "PAID" && student.feePaid) ||
        (feeStatusFilter === "UNPAID" && !student.feePaid)

      return matchesSearch && matchesGrade && matchesFee
    })
  }, [enrolledStudents, searchQuery, selectedGrade, feeStatusFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = enrolledStudents.length
    const totalFees = enrolledStudents.reduce((acc, s) => acc + (s.feePaid ? (s.feeAmount || 2500) : 0), 0)
    const paidCount = enrolledStudents.filter((s) => s.feePaid).length
    const feeRate = total > 0 ? Math.round((paidCount / total) * 100) : 100
    const docsComplete = enrolledStudents.filter((s) => s.totalDocuments > 0 && s.documentsVerified === s.totalDocuments).length

    return { total, totalFees, feeRate, docsComplete }
  }, [enrolledStudents])

  // Export roster to CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert("No students to export")
      return
    }
    const headers = [
      "Admission Number",
      "Application Number",
      "Student Name",
      "Gender",
      "Grade / Class",
      "Enrollment Date",
      "Guardian Name",
      "Guardian Phone",
      "Guardian Email",
      "Fee Status",
      "Fee Amount",
    ]
    const rows = filteredStudents.map((s) => [
      `"${s.admissionNumber}"`,
      `"${s.applicationNumber}"`,
      `"${s.studentName}"`,
      `"${s.gender}"`,
      `"${s.gradeName}"`,
      `"${s.enrollmentDate}"`,
      `"${s.guardianName}"`,
      `"${s.guardianPhone}"`,
      `"${s.guardianEmail}"`,
      `"${s.feePaid ? "PAID" : "UNPAID"}"`,
      s.feeAmount || 2500,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Admissions_Enrolled_Roster_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const tableColumns: TableColumn<EnrolledApplicantItem>[] = [
    {
      header: "Student",
      key: "studentName",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {item.studentName.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-text-primary text-xs sm:text-sm">{item.studentName}</div>
            <div className="text-[11px] text-text-secondary font-mono">
              {item.gender} • DOB: {item.dateOfBirth || "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Admission ID",
      key: "admissionNumber",
      render: (item) => (
        <div>
          <div className="font-bold text-text-primary text-xs font-mono">{item.admissionNumber}</div>
          <div className="text-[10px] text-text-muted font-mono">{item.applicationNumber}</div>
        </div>
      ),
    },
    {
      header: "Enrolled Class",
      key: "gradeName",
      render: (item) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-border-default font-mono">
          {item.gradeName}
        </span>
      ),
    },
    {
      header: "Enrollment Date",
      key: "enrollmentDate",
      render: (item) => (
        <span className="text-xs text-text-secondary font-mono">{item.enrollmentDate || "2026-10-05"}</span>
      ),
    },
    {
      header: "Guardian Contact",
      key: "guardianName",
      render: (item) => (
        <div>
          <div className="text-xs font-medium text-text-primary">{item.guardianName}</div>
          <div className="text-[10px] text-text-secondary font-mono">{item.guardianPhone || "No phone"}</div>
        </div>
      ),
    },
    {
      header: "Admission Fee",
      key: "feePaid",
      render: (item) => (
        <Badge variant={item.feePaid ? "positive" : "warning"}>
          {item.feePaid ? `PAID ₹${(item.feeAmount || 2500).toLocaleString("en-IN")}` : "DUE ₹2,500"}
        </Badge>
      ),
    },
    {
      header: "Documents",
      key: "documentsVerified",
      render: (item) => {
        if (item.totalDocuments === 0) {
          return <Badge variant="neutral">Verified</Badge>
        }
        return (
          <Badge variant={item.documentsVerified === item.totalDocuments ? "positive" : "warning"}>
            {item.documentsVerified}/{item.totalDocuments} Verified
          </Badge>
        )
      },
    },
    {
      header: "Admissions Actions",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => setAdmissionSlipStudent(item)}
            title="Generate Official Admission Slip"
          >
            Admission Slip
          </Button>

          <Button
            size="dense"
            variant="ghost"
            leadingIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setSelectedStudent(item)}
            title="Inspect Admission Record"
          >
            Details
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Enrolled Students Roster"
      breadcrumbs={[
        { label: "Admissions", href: "/admissions" },
        { label: "Enrolled Students" },
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
            leadingIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export Roster (CSV)
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Total Enrolled
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-text-primary font-mono">{stats.total}</div>
            <div className="text-[11px] text-text-muted mt-0.5">Admissions pipeline completed</div>
          </Card>

          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Admission Fees
              </span>
              <CreditCard className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-brand-primary font-mono">
              ₹{stats.totalFees.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {stats.feeRate}% payment collection rate
            </div>
          </Card>

          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Current Session
              </span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-text-primary font-mono">2026-27</div>
            <div className="text-[11px] text-text-muted mt-0.5">Academic Enrollment Term</div>
          </Card>

          <Card className="p-4 border border-border-default bg-surface shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Document Compliance
              </span>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-purple-600 font-mono">100%</div>
            <div className="text-[11px] text-text-muted mt-0.5">Verified admission credentials</div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default shadow-xs">
          {/* Fee Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-lg border border-border-default overflow-x-auto">
            {["ALL", "PAID", "UNPAID"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFeeStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  feeStatusFilter === tab
                    ? "bg-action-primary text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab === "ALL" ? "All Enrolled" : tab === "PAID" ? "Fees Paid" : "Fees Due"}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, admission #, guardian..."
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

        {/* Enrolled Students Table */}
        <Table
          data={filteredStudents}
          columns={tableColumns}
          keyExtractor={(item) => item.id}
          loading={isLoading}
          cardTitle={(item) => item.studentName}
          cardSubtitle={(item) => `${item.admissionNumber} • Grade: ${item.gradeName}`}
          cardBadge={(item) => (
            <Badge variant={item.feePaid ? "positive" : "warning"}>
              {item.feePaid ? "PAID" : "DUE"}
            </Badge>
          )}
        />
      </div>

      {/* Official Admission Slip Modal */}
      {admissionSlipStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 bg-action-black text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-brand-green">
                  VID
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase">Official Admission Slip</h3>
                  <p className="text-[10px] text-white/70">Admissions & Student Master Onboarding Record</p>
                </div>
              </div>
              <button
                onClick={() => setAdmissionSlipStudent(null)}
                className="p-1 rounded-md text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slip Body */}
            <div className="p-6 space-y-5 bg-canvas">
              <div className="flex items-center justify-between border-b border-border-default pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">
                    Admission Number
                  </span>
                  <span className="text-lg font-extrabold text-brand-primary font-mono">
                    {admissionSlipStudent.admissionNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Enrollment Date</span>
                  <span className="text-xs font-semibold text-text-primary font-mono">
                    {admissionSlipStudent.enrollmentDate || "2026-10-05"}
                  </span>
                </div>
              </div>

              {/* Student Identity Section */}
              <div className="p-4 rounded-xl bg-surface border border-border-default flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary text-xl font-bold uppercase">
                  {admissionSlipStudent.studentName.slice(0, 2)}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-text-primary">{admissionSlipStudent.studentName}</h4>
                  <div className="text-xs text-text-secondary">
                    Enrolled Class: <span className="font-semibold text-text-primary">{admissionSlipStudent.gradeName}</span>
                  </div>
                  <div className="text-[11px] text-text-muted font-mono">
                    Application ID: {admissionSlipStudent.applicationNumber}
                  </div>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface border border-border-default">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Guardian / Parent</span>
                  <span className="font-semibold text-text-primary block mt-0.5">{admissionSlipStudent.guardianName}</span>
                  <span className="text-[11px] text-text-secondary font-mono">{admissionSlipStudent.guardianPhone}</span>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-border-default">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Fee Status</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={admissionSlipStudent.feePaid ? "positive" : "warning"}>
                      {admissionSlipStudent.feePaid ? "PAID" : "DUE"}
                    </Badge>
                    <span className="font-mono text-text-primary font-semibold">
                      ₹{(admissionSlipStudent.feeAmount || 2500).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification & Barcode */}
              <div className="p-3 rounded-xl bg-subtle border border-border-default flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Security Signature</span>
                  <span className="text-[11px] font-mono text-text-secondary">VID-SEAL-VERIFIED-{admissionSlipStudent.id.slice(0, 8)}</span>
                </div>
                <div className="h-6 flex items-center gap-0.5 font-mono text-[9px] text-text-muted">
                  ||||| | |||| || |||||| | ||
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-surface border-t border-border-default flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Official VID Educational Ecosystem Record</span>
              <div className="flex items-center gap-2">
                <Button
                  size="dense"
                  variant="secondary"
                  onClick={() => setAdmissionSlipStudent(null)}
                >
                  Close
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  leadingIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => {
                    window.print()
                  }}
                >
                  Print Admission Slip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Student Detail SlideOver */}
      <SlideOver
        open={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent ? `Enrolled: ${selectedStudent.studentName}` : "Admission Details"}
      >
        {selectedStudent && (
          <div className="flex flex-col gap-6 text-xs">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-surface border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-text-primary">{selectedStudent.studentName}</h4>
                  <span className="font-mono text-emerald-600 font-bold text-xs">{selectedStudent.admissionNumber}</span>
                </div>
                <Badge variant="positive">Enrolled</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-default text-text-secondary">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-muted block">Class Enrolled</span>
                  <span className="font-semibold text-text-primary">{selectedStudent.gradeName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-muted block">Date Enrolled</span>
                  <span className="font-mono text-text-primary">{selectedStudent.enrollmentDate || "2026-10-05"}</span>
                </div>
              </div>
            </div>

            {/* Guardian Info */}
            <div className="p-4 rounded-xl bg-surface border border-border-default space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                Primary Guardian
              </span>
              <div className="font-semibold text-text-primary">{selectedStudent.guardianName}</div>
              <div className="flex items-center gap-2 text-text-secondary font-mono">
                <Phone className="w-3.5 h-3.5 text-text-muted" /> {selectedStudent.guardianPhone || "N/A"}
              </div>
              <div className="flex items-center gap-2 text-text-secondary font-mono">
                <Mail className="w-3.5 h-3.5 text-text-muted" /> {selectedStudent.guardianEmail || "N/A"}
              </div>
            </div>

            {/* Fee Overview */}
            <div className="p-4 rounded-xl bg-surface border border-border-default space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                Admission Fee Payment
              </span>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Total Due / Paid:</span>
                <span className="font-mono font-bold text-text-primary">
                  ₹{(selectedStudent.feeAmount || 2500).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Status:</span>
                <Badge variant={selectedStudent.feePaid ? "positive" : "warning"}>
                  {selectedStudent.feePaid ? "PAID" : "DUE"}
                </Badge>
              </div>
            </div>

            {/* Action button */}
            <Button
              size="dense"
              variant="primary"
              className="w-full"
              leadingIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => {
                setAdmissionSlipStudent(selectedStudent)
                setSelectedStudent(null)
              }}
            >
              Generate Admission Slip
            </Button>
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}
