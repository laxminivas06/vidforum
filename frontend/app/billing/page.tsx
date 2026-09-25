"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { StatCard, Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui"
import { CreditCard, DollarSign, Download } from "lucide-react"

export default function BillingPage() {
  return (
    <AppShell
      pageTitle="Platform Billing & Revenue Engine"
      breadcrumbs={[{ label: "System & AI" }, { label: "Billing & Revenue" }]}
      rightHeaderAction={
        <Button size="dense" variant="secondary" leadingIcon={<Download className="w-3.5 h-3.5" />}>
          Export Financial Report
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Monthly Recurring Revenue"
            value="₹1.42 Cr"
            delta="+14.2% vs last month"
            deltaType="increase"
            icon={<CreditCard className="w-5 h-5" />}
            description="24 subscribed tenants"
          />
          <StatCard
            label="Annual Run Rate (ARR)"
            value="₹17.04 Cr"
            delta="98% retention"
            deltaType="increase"
            icon={<DollarSign className="w-5 h-5" />}
            description="Contracted subscriptions"
          />
          <StatCard
            label="Average Revenue Per Tenant"
            value="₹59,166"
            delta="Across Basic/Pro/Enterprise"
            deltaType="neutral"
            icon={<CreditCard className="w-5 h-5" />}
            description="Upgrades trending to Enterprise"
          />
        </div>
      </div>
    </AppShell>
  )
}
