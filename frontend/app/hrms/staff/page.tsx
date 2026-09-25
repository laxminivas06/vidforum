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
  SlideOver,
} from "@/components/ui"
import {
  Users,
  Plus,
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
} from "lucide-react"
import { useFaculty } from "@/lib/api/hooks"
import { FacultyMember } from "@/types"

export default function HRMSStaffPage() {
  const { data: staff = [], isLoading } = useFaculty()
  const [selectedMember, setSelectedMember] = useState<FacultyMember | null>(null)

  const columns: TableColumn<FacultyMember>[] = [
    {
      header: "Staff Member",
      key: "name",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.name}</div>
          <div className="text-xs text-text-secondary font-mono">{item.employeeCode}</div>
        </div>
      ),
    },
    {
      header: "Designation & Role",
      key: "designation",
      render: (item) => (
        <div>
          <div className="text-xs font-medium text-text-primary">{item.designation}</div>
          <div className="text-[11px] text-text-secondary">{item.department}</div>
        </div>
      ),
    },
    {
      header: "Contact",
      key: "email",
      render: (item) => (
        <div>
          <div className="text-xs text-text-secondary font-mono">{item.email}</div>
          <div className="text-[11px] text-text-muted font-mono">{item.phone}</div>
        </div>
      ),
    },
    {
      header: "Workload",
      key: "assignedClasses",
      render: (item) => (
        <span className="font-mono text-xs font-semibold">
          {item.assignedClasses.length} Course Sections
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
      header: "Action",
      key: "id",
      render: (item) => (
        <Button size="dense" variant="secondary" onClick={() => setSelectedMember(item)}>
          Profile
        </Button>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Staff Roster & HRMS"
      breadcrumbs={[{ label: "Core" }, { label: "HRMS" }, { label: "Staff Roster" }]}
      rightHeaderAction={
        <Button
          size="dense"
          variant="primary"
          leadingIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Staff Member
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <Table
          data={staff}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={isLoading}
          cardTitle={(item) => item.name}
          cardSubtitle={(item) => item.designation}
          cardBadge={(item) => <Badge variant="positive">{item.status}</Badge>}
        />
      </div>

      <SlideOver
        open={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name || "Staff Details"}
        subtitle={selectedMember?.employeeCode}
      >
        {selectedMember && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-lg bg-surface border border-border-default flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Department:</span>
                <span className="font-semibold text-text-primary">
                  {selectedMember.department}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Designation:</span>
                <span className="font-semibold text-text-primary">
                  {selectedMember.designation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Email:</span>
                <span className="font-mono text-text-primary">{selectedMember.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Direct Phone:</span>
                <span className="font-mono text-text-primary">{selectedMember.phone}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-semibold uppercase text-text-primary font-mono tracking-wider">
                Assigned Subject Sections
              </span>
              {selectedMember.assignedClasses.map((ac, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-subtle border border-border-default flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-text-primary">
                      {ac.grade} • {ac.section}
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      {ac.subject} (Room {ac.room})
                    </div>
                  </div>
                  <span className="text-xs font-mono text-text-muted">{ac.schedule}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}
