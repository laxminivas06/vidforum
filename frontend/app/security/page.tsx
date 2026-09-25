"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui"
import { ShieldCheck, Lock, Key, AlertTriangle } from "lucide-react"

export default function SecurityPage() {
  return (
    <AppShell
      pageTitle="Platform Security & Master Roles"
      breadcrumbs={[{ label: "System & AI" }, { label: "Security & Roles" }]}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-primary" />
                <CardTitle className="text-sm">Two-Tier RBAC Policy Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-3">
              <div className="flex justify-between border-b border-border-default pb-2">
                <span className="font-semibold text-text-primary">Super Administrator</span>
                <Badge variant="positive">Cross-Tenant Global</Badge>
              </div>
              <div className="flex justify-between border-b border-border-default pb-2">
                <span className="font-semibold text-text-primary">Institution Administrator</span>
                <Badge variant="neutral">Tenant Partition Scoped</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-text-primary">Faculty / Student</span>
                <Badge variant="neutral">Record-Level Scoped</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-primary" />
                <CardTitle className="text-sm">Master Encryption Keys</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-2">
              <p className="text-text-secondary">
                Hardware-backed Cloud KMS key encryption active across all tenant database volumes.
              </p>
              <div className="p-3 rounded-lg bg-subtle font-mono text-[11px] text-text-secondary">
                ACTIVE KEY RING: vid-kms-prod-asia-south1 (Rotated 14 days ago)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
