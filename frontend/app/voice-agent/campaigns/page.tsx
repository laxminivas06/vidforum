"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  SpotHeroPanel,
  Button,
  Badge,
  Table,
  TableColumn,
  ConfirmDialog,
  SlideOver,
} from "@/components/ui"
import {
  PhoneCall,
  Play,
  Pause,
  Plus,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
} from "lucide-react"

interface Campaign {
  id: string
  title: string
  trigger: "FEE_OVERDUE" | "UNEXCUSED_ABSENCE" | "ADMISSION_INVITATION"
  targetCount: number
  completedCalls: number
  connectedRate: string
  language: string
  status: "ACTIVE_DISPATCH" | "COMPLETED" | "SCHEDULED"
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    title: "Term 1 Overdue Fee Courtesy Reminder",
    trigger: "FEE_OVERDUE",
    targetCount: 48,
    completedCalls: 44,
    connectedRate: "91.6%",
    language: "English / Hindi / Kannada",
    status: "ACTIVE_DISPATCH",
  },
  {
    id: "camp-2",
    title: "Morning Unexcused Absence Automated Check",
    trigger: "UNEXCUSED_ABSENCE",
    targetCount: 16,
    completedCalls: 16,
    connectedRate: "100%",
    language: "Multilingual Adaptive",
    status: "COMPLETED",
  },
  {
    id: "camp-3",
    title: "Grade 11 Entrance Interview Schedule Confirmation",
    trigger: "ADMISSION_INVITATION",
    targetCount: 32,
    completedCalls: 0,
    connectedRate: "0%",
    language: "English",
    status: "SCHEDULED",
  },
]

export default function VoiceAgentCampaignsPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const columns: TableColumn<Campaign>[] = [
    {
      header: "Campaign Title",
      key: "title",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.title}</div>
          <div className="text-xs text-text-secondary">{item.language}</div>
        </div>
      ),
    },
    {
      header: "Trigger Type",
      key: "trigger",
      render: (item) => <Badge variant="neutral">{item.trigger.replace("_", " ")}</Badge>,
    },
    {
      header: "Calls Dispatched",
      key: "completedCalls",
      render: (item) => (
        <span className="font-mono text-xs font-semibold">
          {item.completedCalls} / {item.targetCount}
        </span>
      ),
    },
    {
      header: "Connection Rate",
      key: "connectedRate",
      render: (item) => (
        <span className="font-mono text-xs font-bold text-brand-primary">
          {item.connectedRate}
        </span>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (item) => (
        <Badge
          variant={
            item.status === "ACTIVE_DISPATCH"
              ? "warning"
              : item.status === "COMPLETED"
              ? "positive"
              : "neutral"
          }
        >
          {item.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <Button size="dense" variant="secondary">
          {item.status === "ACTIVE_DISPATCH" ? "Pause" : "Logs"}
        </Button>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="AI Yantra — Autonomous Voice Agent"
      breadcrumbs={[{ label: "AI Yantra" }, { label: "Voice Campaigns" }]}
      rightHeaderAction={
        <Button
          size="dense"
          variant="primary"
          className="bg-brand-primary text-black hover:bg-emerald-400"
          leadingIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setConfirmOpen(true)}
        >
          Dispatch New Campaign
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Spot Hero */}
        <SpotHeroPanel
          badgeText="VOICE ENGINE ACTIVE // 8 TELEPHONY CHANNELS"
          headline="Natural Conversational Outbound Dispatch"
          description="Autonomous multi-lingual telephonic agent supporting Hindi, English, Kannada, Telugu, and Tamil with natural emotion synthesis and zero latency."
          actions={
            <Button size="dense" variant="primary" className="bg-brand-primary text-black hover:bg-emerald-400">
              Listen to Synthetic Audio Sample
            </Button>
          }
        />

        {/* Campaigns Table */}
        <Table
          data={MOCK_CAMPAIGNS}
          columns={columns}
          keyExtractor={(item) => item.id}
          cardTitle={(item) => item.title}
          cardSubtitle={(item) => item.language}
          cardBadge={(item) => <Badge variant="neutral">{item.status}</Badge>}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Dispatch Autonomous Voice Campaign"
        description="Launch real-time AI telephony agent to dial all 48 guardians with pending fees? All calls are recorded and transcribed for audit compliance."
        confirmLabel="Authorize Voice Dispatch"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  )
}
