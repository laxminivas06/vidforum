"use client"

import React, { useState } from "react"
import Link from "next/link"
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
} from "@/components/ui"
import {
  Users,
  Search,
  Phone,
  Mail,
  GraduationCap,
  CalendarCheck,
  Award,
  ChevronRight,
  User,
} from "lucide-react"

interface FacultyStudentItem {
  id: string
  roll: string
  name: string
  admissionNo: string
  grade: string
  section: string
  attendancePct: number
  marksAvgPct: number
  parentName: string
  parentPhone: string
  academicStatus: "EXCELLING" | "STEADY" | "NEEDS_SUPPORT"
}

const FACULTY_STUDENTS: FacultyStudentItem[] = [
  {
    id: "std-001",
    roll: "10-A-01",
    name: "Sai Teja Chary",
    admissionNo: "NGS-HYD-2026-001",
    grade: "Class 10",
    section: "Section A - Ramanujan",
    attendancePct: 96,
    marksAvgPct: 92.4,
    parentName: "Sri T. Ramesh Chary",
    parentPhone: "+91 98480 11223",
    academicStatus: "EXCELLING",
  },
  {
    id: "std-002",
    roll: "10-A-02",
    name: "Ananya Reddy",
    admissionNo: "NGS-HYD-2026-002",
    grade: "Class 10",
    section: "Section A - Ramanujan",
    attendancePct: 98,
    marksAvgPct: 95.6,
    parentName: "Sri K. Mahender Reddy",
    parentPhone: "+91 98490 22334",
    academicStatus: "EXCELLING",
  },
  {
    id: "std-003",
    roll: "10-A-03",
    name: "Rohan Kumar",
    admissionNo: "NGS-HYD-2026-003",
    grade: "Class 10",
    section: "Section A - Ramanujan",
    attendancePct: 88,
    marksAvgPct: 83.6,
    parentName: "Sri Vijay Kumar",
    parentPhone: "+91 97010 33445",
    academicStatus: "STEADY",
  },
  {
    id: "std-004",
    roll: "10-A-04",
    name: "Sana Fathima",
    admissionNo: "NGS-HYD-2026-004",
    grade: "Class 10",
    section: "Section A - Ramanujan",
    attendancePct: 94,
    marksAvgPct: 89.2,
    parentName: "Dr. Mohammed Tariq",
    parentPhone: "+91 99880 44556",
    academicStatus: "EXCELLING",
  },
  {
    id: "std-005",
    roll: "10-A-05",
    name: "Karthik Verma",
    admissionNo: "NGS-HYD-2026-005",
    grade: "Class 10",
    section: "Section A - Ramanujan",
    attendancePct: 82,
    marksAvgPct: 74.0,
    parentName: "Sri Rajesh Verma",
    parentPhone: "+91 98660 55667",
    academicStatus: "NEEDS_SUPPORT",
  },
]

export default function FacultyMyStudentsPage() {
  const [selectedSection, setSelectedSection] = useState("Section A - Ramanujan")
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = FACULTY_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns: TableColumn<FacultyStudentItem>[] = [
    {
      header: "Roll & Student",
      key: "name",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary text-xs flex items-center gap-1.5">
            <span className="font-mono text-text-muted text-[11px] font-bold">{item.roll}</span>
            <span>{item.name}</span>
          </div>
          <div className="text-[11px] font-mono text-text-secondary">{item.admissionNo}</div>
        </div>
      ),
    },
    {
      header: "Attendance",
      key: "attendancePct",
      render: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <CalendarCheck className="w-3.5 h-3.5 text-brand-primary" />
          <span className="font-bold text-text-primary">{item.attendancePct}%</span>
        </div>
      ),
    },
    {
      header: "Academic Progress",
      key: "marksAvgPct",
      render: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-emerald-600">{item.marksAvgPct}%</span>
        </div>
      ),
    },
    {
      header: "Status",
      key: "academicStatus",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "neutral"> = {
          EXCELLING: "positive",
          STEADY: "neutral",
          NEEDS_SUPPORT: "warning",
        }
        return <Badge variant={variants[item.academicStatus]}>{item.academicStatus.replace("_", " ")}</Badge>
      },
    },
    {
      header: "Guardian Contact",
      key: "parentPhone",
      render: (item) => (
        <div className="text-xs">
          <div className="text-text-primary">{item.parentName}</div>
          <div className="text-text-muted font-mono text-[11px] flex items-center gap-1">
            <Phone className="w-2.5 h-2.5" />
            <span>{item.parentPhone}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Dossier",
      key: "id",
      render: (item) => (
        <Link href={`/students?search=${encodeURIComponent(item.name)}`}>
          <Button size="dense" variant="secondary" leadingIcon={<User className="w-3.5 h-3.5" />}>
            360° Profile
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="My Classes & Assigned Students"
      breadcrumbs={[{ label: "Faculty", href: "/faculty/dashboard" }, { label: "My Students" }]}
    >
      <div className="flex flex-col gap-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">Class Assigned:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-medium"
            >
              <option value="Section A - Ramanujan">Class 10 - Section A (Ramanujan)</option>
              <option value="Section B - Aryabhata">Class 9 - Section B (Aryabhata)</option>
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Student Table */}
        <Table
          data={filtered}
          columns={columns}
          keyExtractor={(item) => item.id}
          cardTitle={(item) => item.name}
          cardSubtitle={(item) => `${item.roll} • Attendance: ${item.attendancePct}%`}
        />
      </div>
    </AppShell>
  )
}
