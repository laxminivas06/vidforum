"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Table, TableColumn, Badge, Button } from "@/components/ui"
import { Users, Plus } from "lucide-react"

interface PlatformUser {
  id: string
  name: string
  email: string
  role: string
  institution: string
  status: "ACTIVE" | "INACTIVE"
}

const MOCK_USERS: PlatformUser[] = [
  { id: "u-1", name: "Dr. Alistair Vance", email: "admin@springfield.edu", role: "INSTITUTION_ADMIN", institution: "Springfield Academy", status: "ACTIVE" },
  { id: "u-2", name: "Sister Maria Joseph", email: "principal@stjude.edu", role: "INSTITUTION_ADMIN", institution: "St. Jude Heritage", status: "ACTIVE" },
  { id: "u-3", name: "Revathi Raman", email: "revathi.raman@springfield.edu", role: "FACULTY", institution: "Springfield Academy", status: "ACTIVE" },
  { id: "u-4", name: "Arvind Rao", email: "arvind.rao@springfield.edu", role: "FACULTY", institution: "Springfield Academy", status: "ACTIVE" },
]

export default function UsersPage() {
  const columns: TableColumn<PlatformUser>[] = [
    {
      header: "User",
      key: "name",
      render: (u) => (
        <div>
          <div className="font-semibold text-text-primary">{u.name}</div>
          <div className="text-xs text-text-secondary font-mono">{u.email}</div>
        </div>
      ),
    },
    {
      header: "Assigned Role",
      key: "role",
      render: (u) => <Badge variant="neutral">{u.role.replace("_", " ")}</Badge>,
    },
    {
      header: "Institution Tenant",
      key: "institution",
      render: (u) => <span className="text-xs">{u.institution}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (u) => <Badge variant="positive">{u.status}</Badge>,
    },
  ]

  return (
    <AppShell
      pageTitle="Platform Global Users"
      breadcrumbs={[{ label: "Platform" }, { label: "Users" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Invite User
        </Button>
      }
    >
      <Table
        data={MOCK_USERS}
        columns={columns}
        keyExtractor={(u) => u.id}
        cardTitle={(u) => u.name}
        cardSubtitle={(u) => u.institution}
        cardBadge={(u) => <Badge variant="positive">{u.role}</Badge>}
      />
    </AppShell>
  )
}
