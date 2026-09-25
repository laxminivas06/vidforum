"use client"

import React, { useState } from "react"
import {
  Card,
  StatCard,
  Badge,
  Button,
  ProgressBar,
  Table,
  Column,
} from "@/components/ui"
import {
  User,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  CreditCard,
  FileText,
  Clock,
  Bot,
  Mail,
  Phone,
  MapPin,
  Heart,
  Shield,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react"

export interface StudentMasterData {
  id: string
  studentIdNumber: string
  rollNumber: string
  firstName: string
  lastName: string
  gender: string
  dob: string
  bloodGroup: string
  emergencyContact: string
  currentClass: string
  currentSection: string
  academicYear: string
  photoUrl?: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED"
  parent: {
    fatherName: string
    motherName: string
    primaryPhone: string
    primaryEmail: string
    occupation: string
    address: string
  }
  academic: {
    department: string
    course: string
    enrollmentDate: string
    gpa: string
    rank: string
  }
  attendance: {
    percentage: number
    presentDays: number
    absentDays: number
    lateDays: number
  }
  fees: {
    totalAssigned: number
    paidAmount: number
    outstandingDue: number
    status: "PAID" | "PARTIAL" | "OVERDUE"
  }
  recentMarks: {
    subject: string
    examName: string
    marksObtained: number
    maxMarks: number
    grade: string
  }[]
  documents: {
    id: string
    title: string
    docType: string
    verified: boolean
    date: string
  }[]
  aiTutor: {
    totalDoubtsSolved: number
    masteryPercentage: number
    weakTopics: string[]
    recommendedPractice: string
  }
}

export const MOCK_STUDENT: StudentMasterData = {
  id: "std-9042",
  studentIdNumber: "VID-2026-0042",
  rollNumber: "10-A-042",
  firstName: "Aarav",
  lastName: "Sharma",
  gender: "Male",
  dob: "2010-05-14",
  bloodGroup: "O+",
  emergencyContact: "+91 98765 43210",
  currentClass: "Class 10",
  currentSection: "Section A",
  academicYear: "2026-2027",
  status: "ACTIVE",
  parent: {
    fatherName: "Rajesh Sharma",
    motherName: "Sunita Sharma",
    primaryPhone: "+91 98765 43210",
    primaryEmail: "rajesh.sharma@example.com",
    occupation: "Senior Architect",
    address: "742 Evergreen Gardens, Sector 4, New Delhi",
  },
  academic: {
    department: "Secondary Education",
    course: "CBSE Standard Curriculum",
    enrollmentDate: "2024-06-15",
    gpa: "3.85 / 4.0",
    rank: "4th in Section (out of 42)",
  },
  attendance: {
    percentage: 94.5,
    presentDays: 138,
    absentDays: 5,
    lateDays: 3,
  },
  fees: {
    totalAssigned: 85000,
    paidAmount: 85000,
    outstandingDue: 0,
    status: "PAID",
  },
  recentMarks: [
    { subject: "Mathematics", examName: "Midterm Assessment", marksObtained: 94, maxMarks: 100, grade: "A+" },
    { subject: "Physics", examName: "Midterm Assessment", marksObtained: 88, maxMarks: 100, grade: "A" },
    { subject: "Chemistry", examName: "Midterm Assessment", marksObtained: 82, maxMarks: 100, grade: "A" },
    { subject: "Computer Science", examName: "Midterm Assessment", marksObtained: 98, maxMarks: 100, grade: "A+" },
    { subject: "English Literature", examName: "Midterm Assessment", marksObtained: 89, maxMarks: 100, grade: "A" },
  ],
  documents: [
    { id: "doc-1", title: "Birth Certificate", docType: "Legal Proof", verified: true, date: "2024-06-10" },
    { id: "doc-2", title: "Transfer Certificate (TC)", docType: "Academic", verified: true, date: "2024-06-12" },
    { id: "doc-3", title: "Immunization & Medical Record", docType: "Health", verified: true, date: "2024-06-14" },
    { id: "doc-4", title: "Biometric Face Scan Reference", docType: "Identity", verified: true, date: "2026-01-08" },
  ],
  aiTutor: {
    totalDoubtsSolved: 142,
    masteryPercentage: 88,
    weakTopics: ["Quadratic Equations Word Problems", "Organic Chemistry Nomenclature"],
    recommendedPractice: "Complete 10 adaptive questions on Quadratic Formula derivations.",
  },
}

export interface StudentProfileProps {
  student?: StudentMasterData
  studentId?: string
  isSlideOver?: boolean
  onClose?: () => void
  onAction?: (actionName: string) => void
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  student: initialStudent = MOCK_STUDENT,
  studentId,
  isSlideOver = false,
  onClose,
  onAction,
}) => {
  const student = studentId
    ? { ...MOCK_STUDENT, id: studentId, studentIdNumber: studentId }
    : initialStudent
  const [activeTab, setActiveTab] = useState<
    "personal" | "academic" | "attendance" | "exams" | "fees" | "documents" | "timetable" | "ai"
  >("personal")

  const tabs = [
    { id: "personal", label: "Personal & Parents", icon: <User className="w-4 h-4" /> },
    { id: "academic", label: "Academic Profile", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "attendance", label: "Attendance Roll", icon: <CalendarCheck className="w-4 h-4" /> },
    { id: "exams", label: "Examinations", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "fees", label: "Fee Ledger", icon: <CreditCard className="w-4 h-4" /> },
    { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
    { id: "timetable", label: "Timetable", icon: <Clock className="w-4 h-4" /> },
    { id: "ai", label: "AI Tutor Radar", icon: <Bot className="w-4 h-4" /> },
  ]

  const marksColumns: Column<any>[] = [
    { key: "subject", header: "Subject", mobileTitle: true },
    { key: "examName", header: "Exam", mobileSubtitle: true },
    {
      key: "marksObtained",
      header: "Score",
      render: (r) => (
        <span className="font-semibold tabular-nums">
          {r.marksObtained} / {r.maxMarks}
        </span>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      render: (r) => (
        <Badge
          variant={r.grade.startsWith("A") ? "positive" : "neutral"}
          size="sm"
          showDot={false}
        >
          {r.grade}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 360° Identity Banner Card */}
      <div className="rounded-xl border border-border-default bg-canvas p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-action-black text-canvas font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md">
              {student.firstName.charAt(0)}
              {student.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                  {student.firstName} {student.lastName}
                </h2>
                <Badge variant="positive" size="sm">
                  {student.status}
                </Badge>
                <span className="text-xs font-mono bg-badge-neutral px-2 py-0.5 rounded text-text-secondary border border-border-default">
                  {student.studentIdNumber}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-text-secondary mt-1 flex items-center gap-3 flex-wrap">
                <span>
                  Roll No: <strong className="text-text-primary">{student.rollNumber}</strong>
                </span>
                <span>•</span>
                <span>
                  {student.currentClass} — {student.currentSection}
                </span>
                <span>•</span>
                <span className="text-text-muted">{student.academicYear}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="dense"
              onClick={() => onAction && onAction("PRINT_ID")}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Print ID
            </Button>
            <Button
              variant="primary"
              size="dense"
              onClick={() => onAction && onAction("EDIT_PROFILE")}
            >
              Edit Master Record
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Strip */}
      <div className="border-b border-border-default overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max pb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? "border-action-black text-text-primary font-semibold"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
                }`}
              >
                <span className={isActive ? "text-action-black" : "text-text-muted"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* Tab 1: Personal & Parents */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="standard" className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary pb-2 border-b border-border-default">
                Student Demographics
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Date of Birth</span>
                  <span className="font-medium text-text-primary">{student.dob}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Gender</span>
                  <span className="font-medium text-text-primary">{student.gender}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Blood Group</span>
                  <span className="font-medium text-text-primary flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    {student.bloodGroup}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Emergency Contact</span>
                  <span className="font-medium text-text-primary flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-text-muted" />
                    {student.emergencyContact}
                  </span>
                </div>
              </div>
            </Card>

            <Card variant="standard" className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary pb-2 border-b border-border-default">
                Parent & Guardian Information
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-text-muted block text-[11px] uppercase tracking-wider">Father</span>
                    <span className="font-medium text-text-primary">{student.parent.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px] uppercase tracking-wider">Mother</span>
                    <span className="font-medium text-text-primary">{student.parent.motherName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Primary Phone</span>
                  <span className="font-medium text-text-primary flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-text-muted" />
                    {student.parent.primaryPhone}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Email</span>
                  <span className="font-medium text-text-primary flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-text-muted" />
                    {student.parent.primaryEmail}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Residential Address</span>
                  <span className="text-text-secondary flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    {student.parent.address}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Academic Profile */}
        {activeTab === "academic" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Current GPA" value={student.academic.gpa} sublabel="CBSE Standard Grading" />
              <StatCard label="Section Rank" value={student.academic.rank} />
              <StatCard label="Enrollment Date" value={student.academic.enrollmentDate} sublabel="Continuous Tenure" />
            </div>

            <Card variant="standard" className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary pb-2 border-b border-border-default">
                Curriculum & Department Placement
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Department</span>
                  <span className="font-medium text-text-primary">{student.academic.department}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px] uppercase tracking-wider">Course Track</span>
                  <span className="font-medium text-text-primary">{student.academic.course}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Attendance Roll */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard
                label="Attendance Rate"
                value={`${student.attendance.percentage}%`}
                trend={{ value: "Compliant (>85%)", isPositive: true }}
              />
              <StatCard label="Present Days" value={student.attendance.presentDays} />
              <StatCard label="Absent Days" value={student.attendance.absentDays} />
              <StatCard label="Late Arrivals" value={student.attendance.lateDays} />
            </div>

            <Card variant="standard" className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Attendance Compliance Progress</h3>
              <ProgressBar
                value={student.attendance.percentage}
                variant="green"
                valueLabel={`${student.attendance.percentage}% (138 / 146 Days)`}
              />
              <p className="text-xs text-text-secondary leading-relaxed">
                Biometric face recognition verification active via Yantra AI Attendance. Zero proxy attendance events detected.
              </p>
            </Card>
          </div>
        )}

        {/* Tab 4: Examinations */}
        {activeTab === "exams" && (
          <div className="space-y-6">
            <Table
              data={student.recentMarks}
              columns={marksColumns}
              keyExtractor={(r, i) => `${r.subject}-${i}`}
            />
          </div>
        )}

        {/* Tab 5: Fee Ledger */}
        {activeTab === "fees" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Invoiced" value={`₹${student.fees.totalAssigned.toLocaleString()}`} />
              <StatCard label="Total Paid" value={`₹${student.fees.paidAmount.toLocaleString()}`} />
              <StatCard
                label="Outstanding Dues"
                value={`₹${student.fees.outstandingDue.toLocaleString()}`}
                badgeText={student.fees.status}
              />
            </div>

            <Card variant="standard" className="flex items-center justify-between p-5">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Annual Tuition & Laboratory Dues</h4>
                <p className="text-xs text-text-secondary mt-0.5">Receipt #VID-REC-2026-8812 • Verified via Gateway</p>
              </div>
              <Button
                variant="secondary"
                size="dense"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => onAction && onAction("DOWNLOAD_RECEIPT")}
              >
                Download Receipt PDF
              </Button>
            </Card>
          </div>
        )}

        {/* Tab 6: Documents */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {student.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-border-default bg-canvas p-4 flex items-center justify-between gap-3 shadow-sm hover:border-border-strong transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-subtle border border-border-default/60 text-text-secondary shrink-0">
                      <FileText className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                        <span>{doc.docType}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Badge variant="positive" size="sm">
                      Verified
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Timetable */}
        {activeTab === "timetable" && (
          <Card variant="standard" className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary pb-2 border-b border-border-default">
              Today's Schedule (Class 10-A)
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {[
                { period: "Period 1 (08:30 - 09:20)", subject: "Mathematics", teacher: "Dr. Sharma", room: "Room 204" },
                { period: "Period 2 (09:25 - 10:15)", subject: "Physics", teacher: "Prof. H. Verma", room: "Physics Lab 1" },
                { period: "Period 3 (10:20 - 11:10)", subject: "Chemistry", teacher: "Dr. N. Bose", room: "Chem Lab" },
                { period: "Break (11:10 - 11:40)", subject: "Recess / Nutrition", teacher: "-", room: "Cafeteria" },
                { period: "Period 4 (11:40 - 12:30)", subject: "Computer Science", teacher: "Mr. V. Patel", room: "CS Lab 2" },
              ].map((slot, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border-default/80 bg-subtle/50 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[11px] text-text-muted font-mono">{slot.period}</span>
                    <div className="font-semibold text-text-primary mt-0.5">{slot.subject}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-medium text-text-secondary">{slot.teacher}</div>
                    <div className="text-text-muted">{slot.room}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 8: AI Tutor Radar */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <Card variant="focal" className="space-y-3">
              <div className="flex items-center gap-2 text-brand-green text-xs font-semibold uppercase tracking-wider">
                <Bot className="w-4 h-4" /> Yantra AI Tutor Learning Radar
              </div>
              <h3 className="text-xl font-bold tracking-tight text-canvas">
                Subject Mastery Velocity: {student.aiTutor.masteryPercentage}%
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                Aarav has resolved {student.aiTutor.totalDoubtsSolved} academic doubts this semester. Context-scoped RAG algorithms indicate high proficiency in Computer Science and Calculus, with reinforcement needed in Quadratic Algebra.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="dense"
                  className="bg-canvas text-action-black hover:bg-neutral-100"
                  onClick={() => onAction && onAction("OPEN_AI_PRACTICE")}
                >
                  Generate Targeted Practice Session
                </Button>
              </div>
            </Card>

            <Card variant="standard" className="space-y-4">
              <h4 className="text-sm font-semibold text-text-primary">Detected Weak Topics</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {student.aiTutor.weakTopics.map((topic, i) => (
                  <li key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
