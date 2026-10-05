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
  Clock,
  XCircle,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react"

export default function StudentAttendancePage() {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [leaveReason, setLeaveReason] = useState("")
  const [leaveFrom, setLeaveFrom] = useState("")
  const [leaveTo, setLeaveTo] = useState("")
  const [leaveSubmitted, setLeaveSubmitted] = useState(false)

  const stats = {
    pct: 96,
    present: 72,
    absent: 1,
    late: 2,
    totalWorkingDays: 75,
    minEligibility: 75,
  }

  // Days for October 2026
  const octoberDays = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1
    const dayOfWeek = (dayNum + 3) % 7 // Oct 1 was Thursday (dummy shift)
    const isSunday = dayOfWeek === 0
    let status: "PRESENT" | "ABSENT" | "LATE" | "HOLIDAY" | "UPCOMING" = "PRESENT"
    if (isSunday) status = "HOLIDAY"
    else if (dayNum === 2) status = "HOLIDAY" // Gandhi Jayanti
    else if (dayNum === 20) status = "HOLIDAY" // Dussehra
    else if (dayNum > 5) status = "UPCOMING"
    else if (dayNum === 3) status = "LATE"

    return { dayNum, status }
  })

  return (
    <AppShell
      pageTitle="Attendance Record & Calendar"
      breadcrumbs={[{ label: "Portal", href: "/app/home" }, { label: "Attendance" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setLeaveModalOpen(true)}
          >
            Apply for Leave
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Overall Attendance</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{stats.pct}%</p>
                <span className="text-[10px] text-text-muted mt-0.5 block">CBSE Mandate: 75%</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Days Present</span>
                <p className="text-2xl font-bold text-text-primary mt-1 font-mono">
                  {stats.present} / {stats.totalWorkingDays}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Days Absent</span>
                <p className="text-2xl font-bold text-red-600 mt-1 font-mono">{stats.absent}</p>
                <span className="text-[10px] text-text-muted mt-0.5 block">Medical Excused: 1</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Late Marks</span>
                <p className="text-2xl font-bold text-amber-600 mt-1 font-mono">{stats.late}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Calendar View */}
        <Card>
          <CardHeader className="pb-3 border-b border-border-default flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span>October 2026 Attendance Grid</span>
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Present
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Late
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 inline-block" /> Holiday
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-center text-[11px] font-semibold text-text-muted uppercase py-1">
                  {day}
                </div>
              ))}
              {octoberDays.map((d) => {
                const colorMap = {
                  PRESENT: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                  ABSENT: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
                  LATE: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                  HOLIDAY: "bg-subtle text-text-muted border-border-default",
                  UPCOMING: "bg-canvas text-text-muted/40 border-border-default/40",
                }
                return (
                  <div
                    key={d.dayNum}
                    className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between text-xs font-mono font-medium transition-all ${colorMap[d.status]}`}
                  >
                    <span>{d.dayNum}</span>
                    <span className="text-[10px] font-sans block truncate text-right">
                      {d.status === "UPCOMING" ? "" : d.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Application Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-border-default rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-brand-primary" />
                <span>Submit Student Leave Application</span>
              </h3>
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-sm p-1"
              >
                ✕
              </button>
            </div>
            {leaveSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm text-text-primary">Leave Application Submitted!</p>
                <p className="text-xs text-text-secondary">
                  Forwarded to Principal Dr. P. Venkata Subba Rao for digital approval.
                </p>
                <Button
                  size="dense"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    setLeaveSubmitted(false)
                    setLeaveModalOpen(false)
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setLeaveSubmitted(true)
                }}
                className="space-y-3 mt-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">From Date *</label>
                    <input
                      type="date"
                      required
                      value={leaveFrom}
                      onChange={(e) => setLeaveFrom(e.target.value)}
                      className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">To Date *</label>
                    <input
                      type="date"
                      required
                      value={leaveTo}
                      onChange={(e) => setLeaveTo(e.target.value)}
                      className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">Reason for Leave *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Attending national level science competition / fever..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default mt-4">
                  <Button size="dense" variant="secondary" type="button" onClick={() => setLeaveModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="dense" variant="primary" type="submit">
                    Send to Principal
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
