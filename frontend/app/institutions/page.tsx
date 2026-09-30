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
  Shield,
  Users,
  Layers,
  CheckCircle2,
  UserPlus,
  Mail,
  SlidersHorizontal,
} from "lucide-react"
import { useInstitutions, useInstitutionAdmins, useUpdateInstitutionStatus } from "@/lib/api/hooks"
import { Institution } from "@/types"
import { ProvisionTenantModal } from "@/components/institutions/ProvisionTenantModal"
import { AddInstituteAdminModal } from "@/components/institutions/AddInstituteAdminModal"
import { EditAdminWorkspacesModal } from "@/components/institutions/EditAdminWorkspacesModal"

export default function InstitutionsPage() {
  const { data: institutions = [], isLoading } = useInstitutions()
  const updateStatusMutation = useUpdateInstitutionStatus()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"suspend" | "activate">("suspend")
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)
  const [isProvisionOpen, setIsProvisionOpen] = useState(false)
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<any | null>(null)
  const [isEditWorkspacesOpen, setIsEditWorkspacesOpen] = useState(false)

  const { data: instituteAdmins = [], refetch: refetchAdmins } = useInstitutionAdmins(selectedInst?.id)

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
      render: (item) => {
        const isAct = item.status === "ACTIVE"
        const isSusp = item.status === "SUSPENDED"
        return (
          <Badge variant={isAct ? "positive" : isSusp ? "warning" : "neutral"}>
            {item.status}
          </Badge>
        )
      },
    },
    {
      header: "Actions",
      key: "id",
      render: (item) => {
        const isSuspendedOrInactive = item.status === "SUSPENDED" || item.status === "INACTIVE"
        return (
          <div className="flex items-center gap-2">
            <Button
              size="dense"
              variant="secondary"
              onClick={() => setSelectedInst(item)}
            >
              Inspect
            </Button>
            {isSuspendedOrInactive ? (
              <Button
                size="dense"
                variant="secondary"
                onClick={() => {
                  setSelectedInst(item)
                  setActionType("activate")
                  setSuspendDialogOpen(true)
                }}
              >
                Activate
              </Button>
            ) : (
              <Button
                size="dense"
                variant="ghost"
                onClick={() => {
                  setSelectedInst(item)
                  setActionType("suspend")
                  setSuspendDialogOpen(true)
                }}
              >
                Suspend
              </Button>
            )}
          </div>
        )
      },
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
          onClick={() => setIsProvisionOpen(true)}
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
          onRowClick={(item) => setSelectedInst(item)}
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
              {selectedInst.boardAffiliation && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Affiliation:</span>
                  <span className="font-semibold text-text-primary">{selectedInst.boardAffiliation}</span>
                </div>
              )}
              {selectedInst.contactEmail && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Admin Contact:</span>
                  <span className="font-mono text-text-primary">{selectedInst.contactEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Provisioned On:</span>
                <span className="font-mono text-text-secondary">{selectedInst.createdAt}</span>
              </div>
            </div>

            {/* Tenant Administrators Section (Requirement 1) */}
            <div className="p-3.5 rounded-xl bg-surface border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-primary" />
                  <span className="font-semibold text-text-primary text-xs">
                    Tenant Administrators ({instituteAdmins.length})
                  </span>
                </div>
                <Button
                  size="dense"
                  variant="primary"
                  leadingIcon={<UserPlus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddAdminOpen(true)}
                >
                  Add Institute Admin
                </Button>
              </div>

              {instituteAdmins.length === 0 ? (
                <div className="p-4 rounded-lg bg-subtle/60 border border-dashed border-border-default text-center">
                  <p className="text-text-secondary text-[11px]">
                    No administrators provisioned for this tenant yet.
                  </p>
                  <Button
                    size="dense"
                    variant="secondary"
                    className="mt-2 text-xs"
                    leadingIcon={<Plus className="w-3 h-3" />}
                    onClick={() => setIsAddAdminOpen(true)}
                  >
                    Provision First Admin
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {instituteAdmins.map((adm: any) => (
                    <div
                      key={adm.id || adm.userId}
                      className="p-2.5 rounded-lg bg-canvas border border-border-default space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text-primary text-xs">
                            {adm.name || adm.userId}
                          </span>
                          <Badge variant="neutral" className="text-[10px] font-mono">
                            {adm.userId}
                          </Badge>
                        </div>
                        <Badge variant="positive" className="text-[9px]">
                          INSTITUTE ADMIN
                        </Badge>
                      </div>

                      <div className="text-[11px] text-text-secondary font-mono flex items-center gap-1">
                        <Mail className="w-3 h-3 text-text-muted" />
                        <span>{adm.email}</span>
                      </div>

                      {/* Permitted Workspaces */}
                      <div className="pt-1 border-t border-border-subtle">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-[10px] text-text-secondary uppercase font-mono">
                            Permitted Workspaces ({adm.workspaces?.length || 0}):
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAdminForEdit(adm)
                              setIsEditWorkspacesOpen(true)
                            }}
                            className="text-[10px] font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-2.5 h-2.5" />
                            <span>Edit Workspaces</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(adm.workspaces || []).map((wsId: string) => (
                            <Badge
                              key={wsId}
                              variant="neutral"
                              className="text-[9px] px-1.5 py-0 capitalize"
                            >
                              {wsId.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Provision New Tenant Modal */}
      <ProvisionTenantModal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        onSuccess={(newInst) => {
          setSelectedInst(newInst)
        }}
      />

      {/* Add Institute Admin Modal */}
      <AddInstituteAdminModal
        isOpen={isAddAdminOpen}
        institution={selectedInst}
        onClose={() => setIsAddAdminOpen(false)}
        onSuccess={() => refetchAdmins()}
      />

      {/* Edit Admin Workspaces Modal */}
      <EditAdminWorkspacesModal
        isOpen={isEditWorkspacesOpen}
        institution={selectedInst}
        admin={selectedAdminForEdit}
        onClose={() => {
          setIsEditWorkspacesOpen(false)
          setSelectedAdminForEdit(null)
        }}
        onSuccess={() => refetchAdmins()}
      />

      {/* Suspend / Reactivate Confirmation Dialog */}
      <ConfirmDialog
        open={suspendDialogOpen}
        title={actionType === "suspend" ? "Suspend Institutional Tenant" : "Reactivate Institutional Tenant"}
        description={
          actionType === "suspend"
            ? `Are you sure you want to suspend tenant access for ${selectedInst?.name}? All users and staff on domain ${selectedInst?.domain} will be blocked from accessing their workspace immediately.`
            : `Are you sure you want to reactivate ${selectedInst?.name}? Tenant workspaces and operational services will be restored immediately.`
        }
        confirmLabel={
          isSubmittingStatus
            ? "Updating Cloud DB..."
            : actionType === "suspend"
            ? "Suspend Tenant"
            : "Reactivate Tenant"
        }
        danger={actionType === "suspend"}
        onConfirm={async () => {
          if (!selectedInst) return
          try {
            setIsSubmittingStatus(true)
            await updateStatusMutation.mutateAsync({
              id: selectedInst.id,
              status: actionType === "suspend" ? "suspended" : "active",
            })
            setSuspendDialogOpen(false)
            setSelectedInst(null)
          } catch (err) {
            console.error("Failed to update institution status in cloud DB:", err)
          } finally {
            setIsSubmittingStatus(false)
          }
        }}
        onCancel={() => {
          if (isSubmittingStatus) return
          setSuspendDialogOpen(false)
          setSelectedInst(null)
        }}
      />
    </AppShell>
  )
}
