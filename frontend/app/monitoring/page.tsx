"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, StatCard, Badge } from "@/components/ui"
import { Activity, Server, Database, Cpu, CheckCircle2 } from "lucide-react"

export default function MonitoringPage() {
  return (
    <AppShell
      pageTitle="Platform Telemetry & Infrastructure Health"
      breadcrumbs={[{ label: "System & AI" }, { label: "Telemetry & Health" }]}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="API Gateway Health"
            value="99.98%"
            delta="42ms latency"
            deltaType="increase"
            icon={<Activity className="w-5 h-5" />}
            description="Global edge endpoints"
          />
          <StatCard
            label="Database Cluster"
            value="Healthy"
            delta="12% CPU load"
            deltaType="neutral"
            icon={<Database className="w-5 h-5" />}
            description="Multi-AZ replica sync active"
          />
          <StatCard
            label="AI Inference Fleet"
            value="32 Pods"
            delta="T4/A10G nodes"
            deltaType="neutral"
            icon={<Cpu className="w-5 h-5" />}
            description="Vision & voice accelerators"
          />
          <StatCard
            label="Tenant Isolation"
            value="Strict RLS"
            delta="0 policy violations"
            deltaType="increase"
            icon={<Server className="w-5 h-5" />}
            description="Tenant isolation check passed"
          />
        </div>
      </div>
    </AppShell>
  )
}
