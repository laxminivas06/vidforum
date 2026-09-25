"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { AppShell } from "@/components/layout/AppShell"
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SpotHeroPanel,
  Button,
  Badge,
  Table,
  TableColumn,
  ConfirmDialog,
} from "@/components/ui"
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
  Plus,
  Send,
  Building2,
  Cpu,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
} from "lucide-react"
import { useInstitutions, useAdmissions, useFinance } from "@/lib/api/hooks"
import { Institution, Applicant } from "@/types"

export default function DashboardPage() {
  const { role, institutionName, user } = useAuth()

  if (role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />
  }

  return <InstitutionAdminDashboard />
}

// ─────────────────────────────────────────────────────────────
// 1. INSTITUTION ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
function InstitutionAdminDashboard() {
  const { institutionName } = useAuth()
  const { data: applicants, isLoading: appsLoading } = useAdmissions()
  const { data: fees } = useFinance()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string>("")

  const applicantColumns: TableColumn<Applicant>[] = [
    {
      header: "Applicant",
      key: "studentName",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.studentName}</div>
          <div className="text-xs text-text-secondary">{item.applicationNumber}</div>
        </div>
      ),
    },
    {
      header: "Grade",
      key: "gradeApplying",
      render: (item) => <span className="font-mono text-xs">{item.gradeApplying}</span>,
    },
    {
      header: "Applied Date",
      key: "appliedDate",
      render: (item) => <span className="font-mono text-xs text-text-secondary">{item.appliedDate}</span>,
    },
    {
      header: "Status",
      key: "stage",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "error" | "neutral"> = {
          APPROVED: "positive",
          ENROLLED: "positive",
          DOCUMENT_VERIFICATION: "warning",
          INTERVIEW: "warning",
          INQUIRY: "neutral",
          APPLIED: "neutral",
          REJECTED: "error",
        }
        return (
          <Badge variant={variants[item.stage] || "neutral"}>
            {item.stage.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <Link
          href={`/admissions?appId=${item.id}`}
          className="text-xs font-semibold text-action-primary hover:underline flex items-center gap-1"
        >
          Inspect <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Institution Command Center"
      breadcrumbs={[{ label: "Overview" }, { label: "Command Center" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Link href="/admissions">
            <Button size="dense" variant="secondary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
              New Admission
            </Button>
          </Link>
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Send className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedAction("Broadcast Emergency Notice")
              setConfirmDialogOpen(true)
            }}
          >
            Emergency Broadcast
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Welcome & Term Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-subtle border border-border-default flex items-center justify-center text-brand-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-text-primary">
                  {institutionName}
                </h1>
                <Badge variant="positive">CAMPUS SYNCED</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Academic Year 2026-2027 • Term 1 • Current Period: 03 (Morning Session)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
            <div>
              <span className="text-text-muted">Biometric Decks: </span>
              <span className="text-brand-primary font-semibold">12/12 Online</span>
            </div>
            <div className="hidden sm:block text-border-default">•</div>
            <div>
              <span className="text-text-muted">Server Sync: </span>
              <span className="text-text-primary">24s ago</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Enrolled Students"
            value="2,450"
            delta="+3.2% vs last term"
            deltaType="increase"
            icon={<Users className="w-5 h-5" />}
            description="Active roll across 12 grades"
          />
          <StatCard
            label="Daily Attendance Pace"
            value="94.8%"
            delta="+1.1% vs yesterday"
            deltaType="increase"
            icon={<CalendarCheck className="w-5 h-5" />}
            description="2,322 verified present today"
          />
          <StatCard
            label="Fee Realization"
            value="₹1.84 Cr"
            delta="82.4% collected"
            deltaType="neutral"
            icon={<CreditCard className="w-5 h-5" />}
            description="₹39.2L pending for Term 1"
          />
          <StatCard
            label="Faculty On Duty"
            value="142 / 145"
            delta="3 on approved leave"
            deltaType="neutral"
            icon={<Activity className="w-5 h-5" />}
            description="Zero unattended classrooms"
          />
        </div>

        {/* Spot Hero Dark Panel — AI Yantra Telemetry */}
        <SpotHeroPanel
          badgeText="AI YANTRA GLOBAL ENGINE // LIVE TELEMETRY"
          headline="Autonomous Campus Intelligence Operational"
          description="Facial attendance streams active across 12 campus terminals. Voice Agent AI dispatched 48 fee follow-up calls today with an 88% resolution rate."
          className="border border-neutral-800"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/ai-attendance/monitoring">
                <Button size="dense" variant="primary" className="bg-brand-primary text-black hover:bg-emerald-400">
                  Inspect Camera Decks
                </Button>
              </Link>
              <Link href="/voice-agent/campaigns">
                <Button size="dense" variant="secondary" className="border-neutral-700 text-white bg-neutral-900 hover:bg-neutral-800">
                  Voice Agent Log
                </Button>
              </Link>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-neutral-400 font-mono">
                  Vision Attendance
                </div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  1,842 Scans
                </div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-neutral-400 font-mono">
                  Voice Agent Outbound
                </div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  48 Calls / 92% Ack
                </div>
              </div>
              <Radio className="w-4 h-4 text-brand-primary" />
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-neutral-400 font-mono">
                  AI Tutor Inquiries
                </div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  312 Concepts Solved
                </div>
              </div>
              <Cpu className="w-4 h-4 text-brand-primary" />
            </div>
          </div>
        </SpotHeroPanel>

        {/* 2-Column Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 Cols: Admissions Inflow Table */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Recent Admissions Inflow
                </h2>
                <p className="text-xs text-text-secondary">
                  Applicants in active review for upcoming intake
                </p>
              </div>
              <Link href="/admissions">
                <Button size="dense" variant="ghost">
                  View Kanban →
                </Button>
              </Link>
            </div>

            <Table
              data={applicants || []}
              columns={applicantColumns}
              keyExtractor={(item) => item.id}
              loading={appsLoading}
              cardTitle={(item) => item.studentName}
              cardSubtitle={(item) => item.applicationNumber}
              cardBadge={(item) => (
                <Badge variant={item.stage === "APPROVED" ? "positive" : "warning"}>
                  {item.stage}
                </Badge>
              )}
            />
          </div>

          {/* Side 1 Col: Action Center & Quick Triggers */}
          <div className="flex flex-col gap-6">
            {/* Critical Action Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <CardTitle className="text-sm">Administrative Action Queue</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800">
                      3 Fee Waivers Pending
                    </span>
                    <Badge variant="warning">Requires Signoff</Badge>
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    Sibling concessions requested by Bursar office for Grade 9.
                  </p>
                  <Link href="/finance/dashboard" className="text-xs font-semibold text-amber-800 hover:underline mt-1">
                    Review Invoices →
                  </Link>
                </div>

                <div className="p-3 rounded-lg bg-subtle border border-border-default flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">
                      2 Admission Final Approvals
                    </span>
                    <Badge variant="neutral">Merit List</Badge>
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    Interviews completed for Grade 11 Science batch.
                  </p>
                  <Link href="/admissions" className="text-xs font-semibold text-action-primary hover:underline mt-1">
                    Open Admissions Desk →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Workspace Navigators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Direct Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link href="/admissions" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                  <span>Admissions Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
                <Link href="/academics/hierarchy" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                  <span>Academics & Sections</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
                <Link href="/faculty/dashboard" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                  <span>Faculty Roll-Call</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
                <Link href="/finance/dashboard" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                  <span>Fee Collections & Dues</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
                <Link href="/settings" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                  <span>Institution Settings Shell</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialogOpen}
        title="Confirm Emergency Broadcast"
        description="Are you sure you want to dispatch a critical SMS and push broadcast to all 2,450 guardians? This action cannot be revoked once queued."
        confirmLabel="Authorize Broadcast"
        danger
        onConfirm={() => setConfirmDialogOpen(false)}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. SUPER ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const { data: institutions, isLoading } = useInstitutions()

  const instColumns: TableColumn<Institution>[] = [
    {
      header: "Institution Name",
      key: "name",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.name}</div>
          <div className="text-xs font-mono text-text-secondary">{item.domain}</div>
        </div>
      ),
    },
    {
      header: "Code",
      key: "code",
      render: (item) => <span className="font-mono text-xs">{item.code}</span>,
    },
    {
      header: "Plan",
      key: "plan",
      render: (item) => (
        <Badge variant={item.plan === "ENTERPRISE" ? "positive" : "neutral"}>
          {item.plan}
        </Badge>
      ),
    },
    {
      header: "Students",
      key: "studentsCount",
      render: (item) => <span className="font-mono text-xs font-semibold">{item.studentsCount.toLocaleString()}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (item) => (
        <Badge variant={item.status === "ACTIVE" ? "positive" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <Link
          href={`/institutions?id=${item.id}`}
          className="text-xs font-semibold text-action-primary hover:underline"
        >
          Manage Tenant
        </Link>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Super Administrator Platform Console"
      breadcrumbs={[{ label: "Platform" }, { label: "Multi-Tenant Fleet" }]}
      rightHeaderAction={
        <Link href="/institutions">
          <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
            Provision Tenant
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Institutions"
            value="24"
            delta="+2 provisioning"
            deltaType="increase"
            icon={<Building2 className="w-5 h-5" />}
            description="Multi-tenant cluster health: 100%"
          />
          <StatCard
            label="Platform Students"
            value="48,200"
            delta="+1,420 this month"
            deltaType="increase"
            icon={<Users className="w-5 h-5" />}
            description="Across 6 global education hubs"
          />
          <StatCard
            label="Platform MRR"
            value="₹1.42 Cr"
            delta="99.4% SLA uptime"
            deltaType="increase"
            icon={<CreditCard className="w-5 h-5" />}
            description="Enterprise tier retention: 98%"
          />
          <StatCard
            label="AI Yantra Minutes"
            value="128.4k"
            delta="+18% vs last week"
            deltaType="increase"
            icon={<Cpu className="w-5 h-5" />}
            description="Autonomous voice & vision models"
          />
        </div>

        {/* Institutions Fleet Table */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Provisioned Institutional Tenants
              </h2>
              <p className="text-xs text-text-secondary">
                Live isolation clusters partitioned by tenant ID
              </p>
            </div>
            <Link href="/institutions">
              <Button size="dense" variant="secondary">
                View All Tenants →
              </Button>
            </Link>
          </div>

          <Table
            data={institutions || []}
            columns={instColumns}
            keyExtractor={(item) => item.id}
            loading={isLoading}
            cardTitle={(item) => item.name}
            cardSubtitle={(item) => item.domain}
            cardBadge={(item) => (
              <Badge variant={item.status === "ACTIVE" ? "positive" : "warning"}>
                {item.status}
              </Badge>
            )}
          />
        </div>
      </div>
    </AppShell>
  )
}
