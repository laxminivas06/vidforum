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

export default function VoiceAgentCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const columns: TableColumn<Campaign>[] = [
    {
      header: "Campaign Title",
      key: "title",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <div className="font-semibold text-text-primary text-xs">{item.title}</div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              Lang: {item.language}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Event Trigger",
      key: "trigger",
      render: (item) => (
        <Badge variant="neutral" className="text-[10px] font-mono">
          {item.trigger}
        </Badge>
      ),
    },
    {
      header: "Dispatched / Target",
      key: "targetCount",
      render: (item) => (
        <span className="font-mono text-xs text-text-primary">
          {item.completedCalls} / {item.targetCount} Calls
        </span>
      ),
    },
    {
      header: "Connect Success",
      key: "connectedRate",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-text-primary">
          {item.connectedRate}
        </span>
      ),
    },
    {
      header: "State",
      key: "status",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "neutral"> = {
          ACTIVE_DISPATCH: "positive",
          COMPLETED: "neutral",
          SCHEDULED: "warning",
        }
        return <Badge variant={variants[item.status]}>{item.status.replace("_", " ")}</Badge>
      },
    },
    {
      header: "Controls",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.status === "ACTIVE_DISPATCH" ? (
            <Button size="dense" variant="secondary" leadingIcon={<Pause className="w-3 h-3" />}>
              Pause
            </Button>
          ) : (
            <Button size="dense" variant="secondary" leadingIcon={<Play className="w-3 h-3" />}>
              Launch
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="AI Voice Agent — Outbound Dispatch"
      breadcrumbs={[{ label: "AI Yantra" }, { label: "Voice Agent Campaigns" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Volume2 className="w-3.5 h-3.5" />}
          >
            Preview Voice Synthesis
          </Button>
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setConfirmOpen(true)}
          >
            Create Voice Campaign
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Spot Hero */}
        <SpotHeroPanel
          badgeText="VOICE DISPATCHER ENGINE // TELEPHONY ACTIVE"
          headline="Conversational Voice Outbound Infrastructure"
          description="Automated multilingual telephony system for parent reminders, critical unexcused absence alerts, and fee due notifications."
          actions={
            <Button
              size="default"
              variant="primary"
              className="bg-brand-primary text-black hover:bg-emerald-400"
              onClick={() => setConfirmOpen(true)}
            >
              Configure Automated Trigger
            </Button>
          }
        />

        {/* Telephony KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Active Outbound Queue"
            value="0 Calls"
            delta="Queue clear"
            deltaType="neutral"
            icon={<PhoneCall className="w-5 h-5" />}
            description="Telephony SIP trunk idle"
          />
          <StatCard
            label="Average Connection Rate"
            value="—"
            delta="No active calls"
            deltaType="neutral"
            icon={<CheckCircle2 className="w-5 h-5" />}
            description="Across verified parent mobile numbers"
          />
          <StatCard
            label="Multilingual Coverage"
            value="12 Languages"
            delta="Zero-latency TTS"
            deltaType="neutral"
            icon={<Radio className="w-5 h-5" />}
            description="Indian regional language pipeline"
          />
        </div>

        {/* Campaigns Table */}
        {campaigns.length > 0 ? (
          <Table
            data={campaigns}
            columns={columns}
            keyExtractor={(item) => item.id}
            cardTitle={(item) => item.title}
            cardSubtitle={(item) => `${item.language} • ${item.completedCalls} calls`}
            cardBadge={(item) => <Badge variant="neutral">{item.status}</Badge>}
          />
        ) : (
          <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                No Automated Voice Campaigns Active
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                Configure outbound telephony campaigns to automate parental alerts for unexcused morning absences or term fee reminders.
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title="Create New Automated Campaign"
        description="This will configure a recurring telephony campaign connected to your school PBX SIP trunk. Outbound calls will strictly respect institutional calling hours (08:00 - 19:00)."
        confirmText="Proceed with Campaign Setup"
      />
    </AppShell>
  )
}
