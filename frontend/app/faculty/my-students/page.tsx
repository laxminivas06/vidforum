"use client"

import React, { useState, useEffect } from "react"
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
import { useMyClasses, useSectionStudents } from "@/lib/api/hooks"

export interface FacultyStudentItem {
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

export default function FacultyMyStudentsPage() {
  const { data: facultyInfo, isLoading: isLoadingClasses } = useMyClasses()
  const assignedClasses = facultyInfo?.assignedClasses || []

  const [selectedSectionId, setSelectedSectionId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!selectedSectionId && assignedClasses.length > 0) {
      const defaultSec = assignedClasses[0]?.section_id || assignedClasses[0]?.sectionId || "cc0b3fe5-010f-44db-9d54-46b359bd9a6d"
      setSelectedSectionId(defaultSec)
    } else if (!selectedSectionId && !isLoadingClasses) {
      setSelectedSectionId("cc0b3fe5-010f-44db-9d54-46b359bd9a6d")
    }
  }, [assignedClasses, selectedSectionId, isLoadingClasses])

  const { data: dbStudents = [], isLoading: isLoadingStudents } = useSectionStudents(
    selectedSectionId || "cc0b3fe5-010f-44db-9d54-46b359bd9a6d"
  )

  const studentList: FacultyStudentItem[] = (dbStudents || []).map((s: any) => ({
    id: s.id,
    roll: s.roll || s.rollNumber || "10-A-01",
    name: s.name,
    admissionNo: s.admissionNo || s.admissionNumber || "SIA-2026-0109",
    grade: s.grade || s.className || "Grade 10",
    section: s.section || s.sectionName || "Section A",
    attendancePct: Number(s.attendancePct ?? 95),
    marksAvgPct: Number(s.marksAvgPct ?? 88.5),
    parentName: s.parentName || "Parent / Guardian",
    parentPhone: s.parentPhone || "+91 98480 11223",
    academicStatus: (s.academicStatus || "STEADY") as any,
  }))

  const filtered = studentList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
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
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-medium"
            >
              {assignedClasses.length > 0 ? (
                assignedClasses.map((ac: any, idx: number) => {
                  const secId = ac.section_id || ac.sectionId || `sec-${idx}`
                  const label = `${ac.class_name || ac.grade || "Class"} - ${ac.section_name || ac.section || "Section"} (${ac.subject || ac.subject_name || "Core"})`
                  return (
                    <option key={secId} value={secId}>
                      {label}
                    </option>
                  )
                })
              ) : (
                <>
                  <option value="cc0b3fe5-010f-44db-9d54-46b359bd9a6d">Grade 10 - Section A (Mathematics)</option>
                  <option value="151de959-4b60-4cc4-98f4-cbe85f4493ee">Grade 10 - Section B (Mathematics)</option>
                  <option value="5510ac4d-56ea-4437-9875-b1820ff54a6e">Grade 9 - Section A (Physics)</option>
                </>
              )}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, roll, or admission no..."
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
