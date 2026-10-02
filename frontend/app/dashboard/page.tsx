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
  UserPlus,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Settings,
  Layers,
  Package,
} from "lucide-react"
import { useInstitutions, useAdmissions, useFinance } from "@/lib/api/hooks"
import { Institution, Applicant } from "@/types"
import { PLATFORM_WORKSPACES } from "@/config/workspaces"

const WORKSPACE_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard: GraduationCap,
  UserPlus,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  CreditCard,
  FileText,
  Briefcase,
  Clock,
  Settings,
  Building2,
  Package,
  Layers,
}

export default function DashboardPage() {
  const { role } = useAuth()

  if (role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />
  }

  if (role === "INSTITUTION_ADMIN") {
    return <InstitutionAdminDashboard />
  }

  if (typeof window !== "undefined") {
    if (role === "FACULTY") {
      window.location.href = "/faculty/dashboard"
      return null
    }
    if (role === "STUDENT" || role === "PARENT") {
      window.location.href = "/students/cccccccc-cccc-cccc-cccc-cccccccccc01"
      return null
    }
    if (role === "ADMISSION_TEAM") {
      window.location.href = "/admissions"
      return null
    }
    if (role === "FINANCE_TEAM") {
      window.location.href = "/finance/dashboard"
      return null
    }
    if (role === "EXAM_TEAM") {
      window.location.href = "/examinations/schedules"
      return null
    }
    if (role === "ACADEMIC_COORDINATOR") {
      window.location.href = "/academics/hierarchy"
      return null
    }
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

        {/* Core Isolated Workspaces Launchpad */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-surface border border-border-default shadow-card">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-primary" />
                <h2 className="text-base font-bold text-text-primary">
                  Select Dedicated Workspace
                </h2>
                <Badge variant="neutral" className="text-[10px] font-mono">
                  Strictly Isolated Workstations
                </Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Each workspace loads exclusively with its dedicated sub-tools, rosters, and data workflows. Other workspaces remain hidden to prevent clutter and distraction.
              </p>
            </div>
            <div className="text-xs font-mono text-text-muted shrink-0">
              10 Isolated Workspaces Configured
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PLATFORM_WORKSPACES.filter((ws) => ws.id !== "dashboard").map((ws) => {
              const IconComp = WORKSPACE_ICONS[ws.iconName] || Briefcase
              return (
                <div
                  key={ws.id}
                  className="group relative flex flex-col justify-between p-4 rounded-xl bg-surface border border-border-default hover:border-brand-primary/60 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-subtle border border-border-default/80 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                        <IconComp className="w-4.5 h-4.5" />
                      </div>
                      <Badge variant="neutral" className="text-[9px] uppercase tracking-wider font-mono">
                        {ws.category}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {ws.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-border-subtle/80 space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Sub-Tools ({ws.navItems.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ws.navItems.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-block text-[11px] px-1.5 py-0.5 rounded bg-subtle text-text-secondary truncate max-w-[130px]"
                          >
                            {item.title}
                          </span>
                        ))}
                        {ws.navItems.length > 3 && (
                          <span className="inline-block text-[10px] px-1 py-0.5 text-text-muted">
                            +{ws.navItems.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <Link
                      href={ws.primaryRoute}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-action-black text-canvas hover:bg-neutral-800 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Enter {ws.shortName}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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
