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
  const { data: facultyInfo, isLoading } = useMyClasses()
  const [activeRollCall, setActiveRollCall] = useState<string | null>(null)
  const [rollCallSuccess, setRollCallSuccess] = useState(false)

  // Sample students in current session for attendance
  const sampleStudents = [
    { id: "stu-1", name: "Aarav Sharma", roll: "10A-01", status: "PRESENT" },
    { id: "stu-2", name: "Ananya Iyer", roll: "10A-02", status: "PRESENT" },
    { id: "stu-3", name: "Devansh Patel", roll: "10A-03", status: "PRESENT" },
    { id: "stu-4", name: "Rhea Nair", roll: "10A-04", status: "ABSENT" },
    { id: "stu-5", name: "Zaid Khan", roll: "10A-05", status: "PRESENT" },
  ]
  const [attendanceRecords, setAttendanceRecords] = useState(sampleStudents)

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
            onClick={() => setActiveRollCall("Grade 10 - Section B")}
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
              RR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-text-primary">
                  {facultyInfo?.name || "Mrs. Revathi Raman"}
                </h1>
                <Badge variant="positive">ON DUTY</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {facultyInfo?.designation || "Senior Mathematics Lecturer & HOD"} •{" "}
                {facultyInfo?.department || "Department of Mathematics"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-subtle border border-border-default">
              <span className="text-text-muted">Assigned Batches: </span>
              <span className="font-semibold text-text-primary">2 Sections</span>
            </div>
            <div className="p-2.5 rounded-lg bg-subtle border border-border-default">
              <span className="text-text-muted">Students Taught: </span>
              <span className="font-semibold text-text-primary">77 Pupils</span>
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
                  Strictly scoped to your assigned timetable periods (PRD Rule 26)
                </p>
              </div>
              <span className="text-xs font-mono text-text-secondary">
                Friday, Sep 25, 2026
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {facultyInfo?.todayClasses.map((item, idx) => {
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
                              {item.subject}
                            </span>
                            <Badge
                              variant={
                                item.status === "COMPLETED"
                                  ? "positive"
                                  : item.status === "IN_PROGRESS"
                                  ? "warning"
                                  : "neutral"
                              }
                            >
                              {item.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-xs text-text-secondary mt-1">
                            {item.grade} • {item.section}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono text-xs font-semibold text-text-primary">
                          {item.time}
                        </span>
                        {isCurrent && (
                          <Button
                            size="dense"
                            variant="primary"
                            className="bg-brand-primary text-black hover:bg-emerald-400"
                            onClick={() =>
                              setActiveRollCall(`${item.grade} - ${item.section}`)
                            }
                          >
                            Mark Roll-Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Assigned Subject Modules Card */}
            <div className="mt-2">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Assigned Classes & Timetable Allocation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {facultyInfo?.assignedClasses.map((assign, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {assign.grade} • {assign.section}
                        </CardTitle>
                        <Badge variant="neutral">Room {assign.room}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Subject:</span>
                        <span className="font-semibold text-text-primary">
                          {assign.subject}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Slot:</span>
                        <span className="font-mono text-text-secondary">
                          {assign.schedule}
                        </span>
                      </div>
                      <Link
                        href={`/students/stu-101`}
                        className="text-xs font-semibold text-action-primary hover:underline mt-2 pt-2 border-t border-border-subtle flex items-center justify-between"
                      >
                        <span>View Class Student Register</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
                <div className="p-3 rounded-lg bg-subtle border border-border-default flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">
                      Term 1 Mid-Term Calculus
                    </span>
                    <Badge variant="warning">38 Pending</Badge>
                  </div>
                  <p className="text-text-secondary text-[11px]">
                    Grade 10 Section A test papers awaiting marks entry.
                  </p>
                  <Button size="dense" variant="secondary" className="mt-1">
                    Enter Marks →
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-subtle border border-border-default flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">
                      Grade 11 Physics Lab Reports
                    </span>
                    <Badge variant="positive">Verified</Badge>
                  </div>
                  <p className="text-text-secondary text-[11px]">
                    44 reports checked and synced to student master dossier.
                  </p>
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
              className="bg-brand-primary text-black hover:bg-emerald-400"
              onClick={handleCompleteRollCall}
            >
              {rollCallSuccess ? "Submitted!" : "Submit & Lock Attendance"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-text-secondary">
            Click on a student's status pill to toggle between Present and Absent. Changes are synchronized directly to the student master attendance record.
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
        </div>
      </SlideOver>
    </AppShell>
  )
}
