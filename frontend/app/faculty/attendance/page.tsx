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
} from "@/components/ui"
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react"

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"

interface AttendanceRow {
  studentId: string
  roll: string
  name: string
  status: AttendanceStatus
}

const INITIAL_ATTENDANCE: AttendanceRow[] = [
  { studentId: "std-001", roll: "10-A-01", name: "Sai Teja Chary", status: "PRESENT" },
  { studentId: "std-002", roll: "10-A-02", name: "Ananya Reddy", status: "PRESENT" },
  { studentId: "std-003", roll: "10-A-03", name: "Rohan Kumar", status: "LATE" },
  { studentId: "std-004", roll: "10-A-04", name: "Sana Fathima", status: "PRESENT" },
  { studentId: "std-005", roll: "10-A-05", name: "Karthik Verma", status: "PRESENT" },
]

export default function FacultyAttendancePage() {
  const [date, setDate] = useState("2026-10-05")
  const [selectedClass, setSelectedClass] = useState("Class 10 - Section A (Ramanujan)")
  const [selectedPeriod, setSelectedPeriod] = useState("Period 1: Mathematics (09:00 - 09:45 AM)")
  const [roster, setRoster] = useState<AttendanceRow[]>(INITIAL_ATTENDANCE)
  const [isSaved, setIsSaved] = useState(false)

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)))
    setIsSaved(false)
  }

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((r) => ({ ...r, status: "PRESENT" })))
    setIsSaved(false)
  }

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const presentCount = roster.filter((r) => r.status === "PRESENT").length
  const absentCount = roster.filter((r) => r.status === "ABSENT").length
  const lateCount = roster.filter((r) => r.status === "LATE").length

  return (
    <AppShell
      pageTitle="Roll-Call Attendance Sheet"
      breadcrumbs={[{ label: "Faculty", href: "/faculty/dashboard" }, { label: "Attendance" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button size="dense" variant="secondary" onClick={handleMarkAllPresent}>
            Mark All Present
          </Button>
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSave}
          >
            Submit Roll-Call
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Roster</span>
                <p className="text-2xl font-bold text-text-primary mt-1">{roster.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Present Today</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Absent</span>
                <p className="text-2xl font-bold text-red-600 mt-1">{absentCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Late Arrival</span>
                <p className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Class / Section</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
            >
              <option value="Class 10 - Section A (Ramanujan)">Class 10 - Section A (Ramanujan)</option>
              <option value="Class 9 - Section B (Aryabhata)">Class 9 - Section B (Aryabhata)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-secondary block mb-1">Timetable Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
            >
              <option value="Period 1: Mathematics (09:00 - 09:45 AM)">Period 1: Mathematics (09:00 - 09:45 AM)</option>
              <option value="Period 2: Physics (09:50 - 10:35 AM)">Period 2: Physics (09:50 - 10:35 AM)</option>
            </select>
          </div>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Attendance submitted! Synchronized with Student 360° dossiers and automated SMS alerts.</span>
          </div>
        )}

        {/* Roll Call Table */}
        <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-subtle border-b border-border-default text-text-secondary uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Mark Attendance</th>
                <th className="py-3 px-4 text-right">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {roster.map((row) => (
                <tr key={row.studentId} className="hover:bg-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-text-secondary">{row.roll}</td>
                  <td className="py-3 px-4 font-semibold text-text-primary text-xs">{row.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {[
                        { key: "PRESENT", label: "P", full: "Present", color: "hover:border-emerald-500", active: "bg-emerald-600 text-white border-emerald-600" },
                        { key: "ABSENT", label: "A", full: "Absent", color: "hover:border-red-500", active: "bg-red-600 text-white border-red-600" },
                        { key: "LATE", label: "L", full: "Late", color: "hover:border-amber-500", active: "bg-amber-600 text-white border-amber-600" },
                        { key: "EXCUSED", label: "E", full: "Excused", color: "hover:border-blue-500", active: "bg-blue-600 text-white border-blue-600" },
                      ].map((btn) => (
                        <button
                          key={btn.key}
                          type="button"
                          onClick={() => handleStatusChange(row.studentId, btn.key as any)}
                          title={btn.full}
                          className={`w-7 h-7 rounded-lg border text-xs font-bold font-mono transition-all ${
                            row.status === btn.key
                              ? btn.active
                              : `bg-canvas border-border-default text-text-muted ${btn.color}`
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge
                      variant={
                        row.status === "PRESENT"
                          ? "positive"
                          : row.status === "ABSENT"
                          ? "error"
                          : "warning"
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
