"use client"

import React, { useState } from "react"
import Link from "next/link"
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
  SlideOver,
  FormField,
  Input,
} from "@/components/ui"
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Users,
  Layers,
  CheckCircle2,
} from "lucide-react"
import { useInstitutions } from "@/lib/api/hooks"
import { Institution } from "@/types"

export default function InstitutionsPage() {
  const { data: institutions = [], isLoading } = useInstitutions()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

  const filtered = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns: TableColumn<Institution>[] = [
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
      header: "Tenant Code",
      key: "code",
      render: (item) => <span className="font-mono text-xs">{item.code}</span>,
    },
    {
      header: "Region",
      key: "region",
      render: (item) => <span className="text-xs text-text-secondary">{item.region}</span>,
    },
    {
      header: "Plan Tier",
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
      render: (item) => (
        <span className="font-mono text-xs font-semibold">
          {item.studentsCount.toLocaleString()}
        </span>
      ),
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
      header: "Actions",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            onClick={() => setSelectedInst(item)}
          >
            Inspect
          </Button>
          <Button
            size="dense"
            variant="ghost"
            onClick={() => {
              setSelectedInst(item)
              setSuspendDialogOpen(true)
            }}
          >
            Suspend
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Institutions Directory"
      breadcrumbs={[{ label: "Platform" }, { label: "Institutions Fleet" }]}
      rightHeaderAction={
        <Button
          size="dense"
          variant="primary"
          leadingIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Provision New Tenant
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Search Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by institution name, code, domain..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-action-primary"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-text-secondary">
            <span>Partition Protocol:</span>
            <Badge variant="positive">ROW-LEVEL SECURITY (RLS) ACTIVE</Badge>
          </div>
        </div>

        {/* Table */}
        <Table
          data={filtered}
          columns={columns}
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

      {/* SlideOver for Tenant Deep Dive */}
      <SlideOver
        open={selectedInst !== null && !suspendDialogOpen}
        onClose={() => setSelectedInst(null)}
        title={selectedInst?.name || "Tenant Profile"}
        subtitle={selectedInst?.code}
      >
        {selectedInst && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-lg bg-subtle border border-border-default flex items-center justify-between">
              <div>
                <div className="text-[10px] text-text-secondary uppercase font-mono">
                  Domain Isolation
                </div>
                <div className="font-semibold text-text-primary text-sm mt-0.5 font-mono">
                  {selectedInst.domain}
                </div>
              </div>
              <Badge variant="positive">ACTIVE CLUSTER</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface border border-border-default">
                <span className="text-text-secondary">Enrolled Pupils</span>
                <div className="font-bold text-base text-text-primary mt-1 font-mono">
                  {selectedInst.studentsCount.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border-default">
                <span className="text-text-secondary">Faculty & Staff</span>
                <div className="font-bold text-base text-text-primary mt-1 font-mono">
                  {selectedInst.facultyCount}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border-default flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Region:</span>
                <span className="font-semibold text-text-primary">{selectedInst.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Subscription Plan:</span>
                <span className="font-semibold text-brand-primary">{selectedInst.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Provisioned On:</span>
                <span className="font-mono text-text-secondary">{selectedInst.createdAt}</span>
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        open={suspendDialogOpen}
        title="Suspend Institutional Tenant"
        description={`Are you sure you want to suspend tenant access for ${selectedInst?.name}? All users and staff on domain ${selectedInst?.domain} will be locked out immediately.`}
        confirmLabel="Suspend Tenant"
        danger
        onConfirm={() => {
          setSuspendDialogOpen(false)
          setSelectedInst(null)
        }}
        onCancel={() => {
          setSuspendDialogOpen(false)
          setSelectedInst(null)
        }}
      />
    </AppShell>
  )
}
