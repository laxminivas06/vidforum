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

const MOCK_SESSIONS: SessionItem[] = [
  {
    id: "sess-1",
    gradeSection: "Grade 10 - Section A",
    period: "Period 1 (08:30 - 09:30 AM)",
    subject: "Mathematics",
    teacher: "Mrs. Revathi Raman",
    present: 38,
    total: 38,
    status: "VERIFIED",
    method: "BIOMETRIC_VISION",
  },
  {
    id: "sess-2",
    gradeSection: "Grade 10 - Section B",
    period: "Period 1 (08:30 - 09:30 AM)",
    subject: "English Literature",
    teacher: "Ms. Shalini Gupta",
    present: 36,
    total: 39,
    status: "VERIFIED",
    method: "MANUAL_TEACHER",
  },
  {
    id: "sess-3",
    gradeSection: "Grade 11 - Section A",
    period: "Period 2 (09:30 - 10:30 AM)",
    subject: "Advanced Physics",
    teacher: "Dr. Arvind Rao",
    present: 44,
    total: 44,
    status: "VERIFIED",
    method: "BIOMETRIC_VISION",
  },
  {
    id: "sess-4",
    gradeSection: "Grade 7 - Section C",
    period: "Period 2 (09:30 - 10:30 AM)",
    subject: "General Science",
    teacher: "Mr. Deepak Varma",
    present: 32,
    total: 35,
    status: "PENDING",
    method: "MANUAL_TEACHER",
  },
]

export default function AttendanceSessionsPage() {
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null)

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
        const pct = Math.round((item.present / item.total) * 100)
        return (
          <div className="w-32">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span>
                {item.present}/{item.total}
              </span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <ProgressBar value={item.present} max={item.total} />
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
            value="94.8%"
            delta="+1.1% vs yesterday"
            deltaType="increase"
            icon={<CalendarCheck className="w-5 h-5" />}
            description="2,322 / 2,450 students accounted"
          />
          <StatCard
            label="AI Vision Logged"
            value="1,842"
            delta="79% automated"
            deltaType="increase"
            icon={<Camera className="w-5 h-5" />}
            description="12 camera gates online"
          />
          <StatCard
            label="Unexcused Absences"
            value="48"
            delta="Voice AI notified"
            deltaType="neutral"
            icon={<AlertTriangle className="w-5 h-5" />}
            description="Automated parent alerts queued"
          />
          <StatCard
            label="Verified Sessions"
            value="24 / 28"
            delta="4 in progress"
            deltaType="neutral"
            icon={<CheckCircle2 className="w-5 h-5" />}
            description="Periods running on schedule"
          />
        </div>

        {/* Sessions Table */}
        <Table
          data={MOCK_SESSIONS}
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
      </div>
    </AppShell>
  )
}
