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
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

interface ConflictItem {
  id: string
  type: "FACULTY_DOUBLE_BOOKING" | "ROOM_COLLISION" | "PERIOD_OVERLAP"
  severity: "HIGH" | "MEDIUM" | "LOW"
  title: string
  description: string
  affectedFaculty?: string
  affectedRoom?: string
  period: string
  day: string
  status: "OPEN" | "RESOLVED"
}

const INITIAL_CONFLICTS: ConflictItem[] = [
  {
    id: "conf-1",
    type: "FACULTY_DOUBLE_BOOKING",
    severity: "HIGH",
    title: "Faculty Double Booking",
    description: "Sri T. Ramesh Chary scheduled simultaneously in Class 10-A (Maths) and Class 9-B (Mathematics Support).",
    affectedFaculty: "Sri T. Ramesh Chary (PGT Maths)",
    period: "Period 2 (09:50 - 10:35 AM)",
    day: "Monday",
    status: "OPEN",
  },
  {
    id: "conf-2",
    type: "ROOM_COLLISION",
    severity: "HIGH",
    title: "Laboratory Room Collision",
    description: "CV Raman Physics Lab assigned to Class 10-A Practical and Class 9-A Demonstration at the same period.",
    affectedRoom: "CV Raman Physics Lab B-204",
    period: "Period 4 (11:35 - 12:20 PM)",
    day: "Wednesday",
    status: "OPEN",
  },
  {
    id: "conf-3",
    type: "PERIOD_OVERLAP",
    severity: "MEDIUM",
    title: "Sports Period Ground Allocation",
    description: "Main Playfield assigned to both High School Football and Middle School Athletics.",
    affectedRoom: "Main Athletics Ground",
    period: "Period 7 (02:15 - 03:00 PM)",
    day: "Friday",
    status: "RESOLVED",
  },
]

export default function TimetableConflictsPage() {
  const [conflicts, setConflicts] = useState<ConflictItem[]>(INITIAL_CONFLICTS)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)

  const handleScan = () => {
    setIsScanning(true)
    setScanMessage(null)
    setTimeout(() => {
      setIsScanning(false)
      setScanMessage("Timetable Matrix Scanned: 2 active collisions identified across 48 weekly slots.")
    }, 1000)
  }

  const handleResolve = (id: string) => {
    setConflicts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "RESOLVED" } : c))
    )
  }

  const columns: TableColumn<ConflictItem>[] = [
    {
      header: "Conflict Description",
      key: "title",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary text-xs flex items-center gap-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${item.severity === "HIGH" ? "text-red-500" : "text-amber-500"}`} />
            <span>{item.title}</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 max-w-md">{item.description}</p>
        </div>
      ),
    },
    {
      header: "Day & Slot",
      key: "period",
      render: (item) => (
        <div>
          <span className="font-semibold text-text-primary text-xs block">{item.day}</span>
          <span className="text-[11px] font-mono text-text-secondary">{item.period}</span>
        </div>
      ),
    },
    {
      header: "Resource Affected",
      key: "affectedFaculty",
      render: (item) => (
        <span className="text-xs text-text-secondary font-medium">
          {item.affectedFaculty || item.affectedRoom}
        </span>
      ),
    },
    {
      header: "Severity",
      key: "severity",
      render: (item) => {
        const variants: Record<string, "error" | "warning" | "neutral"> = {
          HIGH: "error",
          MEDIUM: "warning",
          LOW: "neutral",
        }
        return <Badge variant={variants[item.severity]}>{item.severity}</Badge>
      },
    },
    {
      header: "Status",
      key: "status",
      render: (item) => (
        <Badge variant={item.status === "RESOLVED" ? "positive" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      key: "id",
      render: (item) => (
        <div>
          {item.status === "OPEN" ? (
            <Button
              size="dense"
              variant="primary"
              onClick={() => handleResolve(item.id)}
            >
              Auto-Resolve
            </Button>
          ) : (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </span>
          )}
        </div>
      ),
    },
  ]

  const openCount = conflicts.filter((c) => c.status === "OPEN").length

  return (
    <AppShell
      pageTitle="Timetable Conflict Detection"
      breadcrumbs={[{ label: "Timetable", href: "/timetable/matrix" }, { label: "Conflict Detector" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Link href="/timetable/matrix">
            <Button size="dense" variant="secondary">
              View Timetable Matrix
            </Button>
          </Link>
          <Button
            size="dense"
            variant="primary"
            disabled={isScanning}
            leadingIcon={<RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />}
            onClick={handleScan}
          >
            {isScanning ? "Scanning Matrix..." : "Scan Timetable"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Open Conflicts</span>
                <p className="text-2xl font-bold text-red-600 mt-1">{openCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Faculty Collisions</span>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {conflicts.filter((c) => c.type === "FACULTY_DOUBLE_BOOKING" && c.status === "OPEN").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Resolved Collisions</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {conflicts.filter((c) => c.status === "RESOLVED").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {scanMessage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Conflicts Table */}
        <Table
          data={conflicts}
          columns={columns}
          keyExtractor={(item) => item.id}
          cardTitle={(item) => item.title}
          cardSubtitle={(item) => `${item.day} • ${item.period}`}
          emptyMessage="No timetable scheduling collisions detected."
        />
      </div>
    </AppShell>
  )
}
