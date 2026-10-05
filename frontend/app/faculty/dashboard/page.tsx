"use client"

import React, { useState } from "react"
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
  Table,
  TableColumn,
  ConfirmDialog,
  SlideOver,
} from "@/components/ui"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  BookOpen,
  ArrowRight,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react"
import { useFaculty, useMyClasses } from "@/lib/api/hooks"
import { FacultyAssignment } from "@/types"

export default function FacultyDashboardPage() {
  const { user } = useAuth()
  const { data: facultyInfo, isLoading } = useMyClasses()
  const [activeRollCall, setActiveRollCall] = useState<string | null>(null)
  const [rollCallSuccess, setRollCallSuccess] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "FM"

  const toggleStudentAttendance = (id: string) => {
    setAttendanceRecords((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "PRESENT" ? "ABSENT" : "PRESENT" }
          : s
      )
    )
  }

  const handleCompleteRollCall = () => {
    setRollCallSuccess(true)
    setTimeout(() => {
      setActiveRollCall(null)
      setRollCallSuccess(false)
    }, 1500)
  }

  return (
    <AppShell
      pageTitle="Faculty Workspace"
      breadcrumbs={[{ label: "Faculty" }, { label: "My Classes & Schedule" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400"
            leadingIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
            onClick={() => setActiveRollCall("Assigned Section")}
          >
            Launch Active Roll-Call
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Faculty Bio Banner */}
        <div className="p-5 rounded-xl bg-surface border border-border-default shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-action-primary text-white flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-text-primary">
                  {user?.name || "Faculty Member"}
                </h1>
                <Badge variant="positive">ON DUTY</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {facultyInfo?.designation || user?.role?.replace("_", " ") || "Faculty"} •{" "}
                {facultyInfo?.department || "Academic Division"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-subtle border border-border-default">
              <span className="text-text-muted">Assigned Batches: </span>
              <span className="font-semibold text-text-primary">
                {facultyInfo?.batchesCount || 0} Sections
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-subtle border border-border-default">
              <span className="text-text-muted">Students Taught: </span>
              <span className="font-semibold text-text-primary">
                {facultyInfo?.studentsCount || 0} Pupils
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Faculty Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Today's Teaching Schedule */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Today's Teaching Schedule
                </h2>
                <p className="text-xs text-text-secondary">
                  Strictly scoped to your assigned timetable periods
                </p>
              </div>
              <span className="text-xs font-mono text-text-secondary">
                Current Academic Session
              </span>
            </div>

            {facultyInfo?.todayClasses && facultyInfo.todayClasses.length > 0 ? (
              <div className="flex flex-col gap-3">
                {facultyInfo.todayClasses.map((item: any, idx: number) => {
                  const isCurrent = item.status === "IN_PROGRESS"
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-surface border-brand-primary shadow-md ring-1 ring-brand-primary/20"
                          : "bg-surface border-border-default"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isCurrent
                                ? "bg-brand-primary/10 text-brand-primary"
                                : "bg-subtle text-text-secondary"
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-text-primary">
                                {item.period}: {item.subject}
                              </span>
                              <Badge variant={isCurrent ? "positive" : "neutral"} size="sm">
                                {item.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="text-xs text-text-secondary mt-1 flex items-center gap-3">
                              <span>Class: {item.gradeSection}</span>
                              <span>Room: {item.room}</span>
                              <span>Timing: {item.time}</span>
                            </div>
                          </div>
                        </div>

                        {isCurrent && (
                          <Button
                            size="dense"
                            variant="primary"
                            className="bg-brand-primary text-black hover:bg-emerald-400 shrink-0"
                            onClick={() => setActiveRollCall(item.gradeSection)}
                          >
                            Take Attendance
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-10 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-2">
                <Clock className="w-6 h-6 text-text-muted" />
                <h4 className="text-sm font-semibold text-text-primary">
                  No Classes Scheduled Today
                </h4>
                <p className="text-xs text-text-secondary max-w-sm">
                  Teaching allocations and periodic timetable slots will populate here once assigned by the academic coordinator.
                </p>
              </div>
            )}
          </div>

          {/* Right 1 Col: Quick Tools & Exam Grading Queue */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-primary" />
                  <CardTitle className="text-sm">Grading & Assessment Queue</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <div className="p-4 text-center rounded-lg bg-subtle/50 border border-border-subtle text-text-muted">
                  No pending papers or mark sheets awaiting submission.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assigned Class Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-xs">
                <Link
                  href="/timetable/matrix"
                  className="p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default flex items-center justify-between font-medium text-text-primary"
                >
                  <span>My Weekly Timetable</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
                <Link
                  href="/attendance/sessions"
                  className="p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default flex items-center justify-between font-medium text-text-primary"
                >
                  <span>Attendance History</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SlideOver: Roll Call Modal */}
      <SlideOver
        open={activeRollCall !== null}
        onClose={() => setActiveRollCall(null)}
        title="Session Attendance Roll-Call"
        subtitle={activeRollCall || "Current Period"}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-mono text-text-secondary">
              {attendanceRecords.filter((s) => s.status === "PRESENT").length} Present /{" "}
              {attendanceRecords.length} Enrolled
            </span>
            <Button
              size="dense"
              variant="primary"
              disabled={attendanceRecords.length === 0}
              className="bg-brand-primary text-black hover:bg-emerald-400"
              onClick={handleCompleteRollCall}
            >
              {rollCallSuccess ? "Submitted!" : "Submit & Lock Attendance"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          {attendanceRecords.length > 0 ? (
            <>
              <p className="text-text-secondary">
                Click on a student's status pill to toggle between Present and Absent.
              </p>
              <div className="flex flex-col gap-2">
                {attendanceRecords.map((stu) => {
                  const isPresent = stu.status === "PRESENT"
                  return (
                    <div
                      key={stu.id}
                      onClick={() => toggleStudentAttendance(stu.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isPresent
                          ? "bg-surface border-border-default"
                          : "bg-red-50/50 border-red-200"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-text-primary">{stu.name}</div>
                        <div className="text-[10px] font-mono text-text-secondary">
                          Roll: {stu.roll}
                        </div>
                      </div>
                      <Badge variant={isPresent ? "positive" : "error"}>
                        {stu.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center bg-subtle rounded-xl border border-border-default text-text-secondary">
              No students enrolled in this section yet.
            </div>
          )}
        </div>
      </SlideOver>
    </AppShell>
  )
}
