"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { PlanCard, Button, Badge } from "@/components/ui"
import { Layers, Plus } from "lucide-react"

export default function PlansPage() {
  return (
    <AppShell
      pageTitle="Platform Subscription Plans"
      breadcrumbs={[{ label: "Platform" }, { label: "Subscription Plans" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Create Plan Tier
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard
            tierName="Basic Academy"
            price="₹25,000"
            billingCycle="per institution / month"
            features={[
              "Up to 500 Students",
              "Core Admissions & Attendance",
              "Standard Grade & Section Hierarchy",
              "Standard Email Support",
            ]}
          />
          <PlanCard
            tierName="Pro Institution"
            price="₹65,000"
            billingCycle="per institution / month"
            highlighted
            badgeText="MOST POPULAR"
            features={[
              "Up to 2,000 Students",
              "Examinations & Excel Import",
              "Finance Invoicing & Dues Tracker",
              "Immutable Documents Vault",
              "Priority Technical SLA",
            ]}
          />
          <PlanCard
            tierName="Enterprise Global"
            price="₹1,50,000"
            billingCycle="per institution / month"
            features={[
              "Unlimited Students & Campuses",
              "Full AI Yantra Suite (Voice + Vision + Tutor)",
              "All 6 Modular Extensions Included",
              "Dedicated Database Cluster & SLA",
              "24/7 Priority Operations Deck",
            ]}
          />
        </div>
      </div>
    </AppShell>
  )
}
