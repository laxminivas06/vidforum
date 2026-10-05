"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Button,
  Badge,
  Table,
  TableColumn,
  ConfirmDialog,
  ProgressBar,
} from "@/components/ui"
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Users,
  Camera,
  ArrowRight,
  ClipboardList,
} from "lucide-react"

interface SessionItem {
  id: string
  gradeSection: string
  period: string
  subject: string
  teacher: string
  present: number
  total: number
  status: "VERIFIED" | "PENDING" | "ANOMALY"
  method: "BIOMETRIC_VISION" | "MANUAL_TEACHER"
}

export default function AttendanceSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null)

  const totalPresent = sessions.reduce((acc, s) => acc + s.present, 0)
  const totalStudents = sessions.reduce((acc, s) => acc + s.total, 0)
  const verifiedCount = sessions.filter((s) => s.status === "VERIFIED").length

  const columns: TableColumn<SessionItem>[] = [
    {
      header: "Class & Section",
      key: "gradeSection",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.gradeSection}</div>
          <div className="text-xs text-text-secondary">{item.subject}</div>
        </div>
      ),
    },
    {
      header: "Period / Time",
      key: "period",
      render: (item) => <span className="font-mono text-xs">{item.period}</span>,
    },
    {
      header: "Teacher",
      key: "teacher",
      render: (item) => <span className="text-xs">{item.teacher}</span>,
    },
    {
      header: "Pace / Ratio",
      key: "present",
      render: (item) => {
        const pct = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
        return (
          <div className="w-32">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span>
                {item.present}/{item.total}
              </span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <ProgressBar value={item.present} max={item.total || 1} />
          </div>
        )
      },
    },
    {
      header: "Capture Mode",
      key: "method",
      render: (item) => (
        <Badge variant={item.method === "BIOMETRIC_VISION" ? "positive" : "neutral"}>
          {item.method === "BIOMETRIC_VISION" ? "AI Vision Deck" : "Teacher Roll"}
        </Badge>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (item) => (
        <Badge variant={item.status === "VERIFIED" ? "positive" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Attendance Daily Roll"
      breadcrumbs={[{ label: "Core" }, { label: "Attendance Roll" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Daily Register
          </Button>
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400"
            leadingIcon={<Camera className="w-3.5 h-3.5" />}
          >
            Sync Vision Cameras
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Overall Daily Attendance"
            value={totalStudents > 0 ? `${Math.round((totalPresent / totalStudents) * 100)}%` : "0%"}
            delta={totalStudents > 0 ? `${totalPresent} / ${totalStudents} students` : "No sessions active"}
            deltaType="neutral"
            icon={<CalendarCheck className="w-5 h-5" />}
            description="Accounted for today"
          />
          <StatCard
            label="AI Vision Logged"
            value="0"
            delta="0 automated"
            deltaType="neutral"
            icon={<Camera className="w-5 h-5" />}
            description="Camera terminals standby"
          />
          <StatCard
            label="Unexcused Absences"
            value="0"
            delta="Standby"
            deltaType="neutral"
            icon={<AlertTriangle className="w-5 h-5" />}
            description="Parent notification queue"
          />
          <StatCard
            label="Verified Sessions"
            value={`${verifiedCount} / ${sessions.length}`}
            delta={sessions.length > 0 ? `${sessions.length - verifiedCount} in progress` : "0 scheduled"}
            deltaType="neutral"
            icon={<CheckCircle2 className="w-5 h-5" />}
            description="Periods running on schedule"
          />
        </div>

        {/* Sessions Table or Clean Empty State */}
        {sessions.length > 0 ? (
          <Table
            data={sessions}
            columns={columns}
            keyExtractor={(item) => item.id}
            cardTitle={(item) => item.gradeSection}
            cardSubtitle={(item) => `${item.subject} • ${item.teacher}`}
            cardBadge={(item) => (
              <Badge variant={item.status === "VERIFIED" ? "positive" : "warning"}>
                {item.status}
              </Badge>
            )}
          />
        ) : (
          <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                No Attendance Sessions Recorded Today
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                Attendance records will automatically appear here once teachers start daily roll-call or biometric AI vision turnstiles stream turnstile check-ins.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
