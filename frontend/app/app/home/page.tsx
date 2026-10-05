"use client"

import React from "react"
import Link from "next/link"
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
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Bot,
  BookOpen,
  Clock,
  Award,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react"

export default function StudentParentHomePage() {
  const student = {
    name: "Sai Teja Chary",
    grade: "Class 10 - Section A (Ramanujan)",
    admissionNo: "NGS-HYD-2026-001",
    attendancePct: 96,
    daysPresent: 72,
    totalWorkingDays: 75,
    gpa: "9.2 / 10",
  }

  const todayClasses = [
    { period: "Period 1", time: "09:00 - 09:45 AM", subject: "Mathematics Standard", teacher: "Sri T. Ramesh Chary", room: "Aryabhata Hall A-101" },
    { period: "Period 2", time: "09:50 - 10:35 AM", subject: "Science & Technology", teacher: "Dr. P. Venkata Subba Rao", room: "CV Raman Physics Lab" },
    { period: "Period 3", time: "10:45 - 11:30 AM", subject: "English Language & Lit", teacher: "Smt. S. Kavitha Rao", room: "Tagore Room 102" },
    { period: "Period 4", time: "11:35 - 12:20 PM", subject: "Computer Applications", teacher: "Sri M. Aditya Nandan", room: "Turing Lab" },
  ]

  return (
    <AppShell
      pageTitle="Student & Parent Portal"
      breadcrumbs={[{ label: "Portal Home" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Link href="/ai-tutor/chat">
            <Button size="dense" variant="primary" leadingIcon={<Sparkles className="w-3.5 h-3.5" />}>
              Open AI Tutor 24/7
            </Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Welcome Hero Card */}
        <div className="p-6 rounded-2xl bg-action-black text-canvas flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="text-xs font-semibold text-brand-green uppercase tracking-wider block">
              Active Student Portal
            </span>
            <h2 className="text-xl font-bold mt-1 text-canvas flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-brand-green" />
              <span>Welcome back, {student.name}</span>
            </h2>
            <p className="text-xs text-text-muted mt-1 font-mono">
              {student.grade} • Roll No: 10-A-01 • {student.admissionNo}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/app/academics">
              <Button size="dense" variant="secondary">
                View Academic Ledger
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Attendance Record</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{student.attendancePct}%</p>
                <span className="text-[11px] text-text-muted mt-0.5 block font-mono">
                  {student.daysPresent} of {student.totalWorkingDays} days present
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Term 1 Assessment</span>
                <p className="text-2xl font-bold text-brand-primary mt-1">92.4% (A1)</p>
                <span className="text-[11px] text-text-muted mt-0.5 block font-mono">Class Rank: #2</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Fee Clearance</span>
                <p className="text-2xl font-bold text-text-primary mt-1">100% Cleared</p>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Zero pending dues
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule & Announcements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule Timeline (2 cols) */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 border-b border-border-default flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary" />
                <span>Today's Class Schedule</span>
              </CardTitle>
              <Badge variant="neutral">Monday Schedule</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {todayClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-subtle/60 border border-border-default flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-[11px] font-mono font-bold text-text-muted">
                      {cls.period}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{cls.subject}</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {cls.teacher} • <span className="font-mono">{cls.room}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-text-muted font-medium">
                    {cls.time}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* School Notice Feed (1 col) */}
          <Card>
            <CardHeader className="pb-3 border-b border-border-default">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-primary" />
                <span>Institutional Bulletins</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-canvas border border-border-default space-y-1">
                <span className="text-[10px] text-brand-primary font-bold uppercase">CBSE Update</span>
                <p className="font-semibold text-text-primary">Mid-Term Examination Schedules Published</p>
                <p className="text-text-secondary text-[11px]">Assessments start October 15, 2026. Hall tickets available next week.</p>
              </div>
              <div className="p-3 rounded-xl bg-canvas border border-border-default space-y-1">
                <span className="text-[10px] text-purple-600 font-bold uppercase">Campus Event</span>
                <p className="font-semibold text-text-primary">Annual Telangana State Science Exhibition</p>
                <p className="text-text-secondary text-[11px]">Submit science project abstracts to Dr. Subba Rao by Friday.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
