"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, StatCard, Button, Badge } from "@/components/ui"
import { Bus, Plus, MapPin, Radio } from "lucide-react"

export default function TransportPage() {
  const routes = [
    { number: "Route 01", driver: "Manjunath K.", bus: "KA-04-E-1042", capacity: 42, boarded: 39, status: "EN_ROUTE" },
    { number: "Route 02", driver: "Ramesh Babu", bus: "KA-04-E-1088", capacity: 42, boarded: 41, status: "EN_ROUTE" },
    { number: "Route 03", driver: "Suresh Gowda", bus: "KA-04-E-1120", capacity: 36, boarded: 35, status: "ARRIVED_CAMPUS" },
  ]

  return (
    <AppShell
      pageTitle="Fleet & Student Transport"
      breadcrumbs={[{ label: "Optional" }, { label: "Transport" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Add Bus Route
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((r, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-brand-primary" />
                    <CardTitle className="text-sm font-semibold">{r.number}</CardTitle>
                  </div>
                  <Badge variant={r.status === "EN_ROUTE" ? "warning" : "positive"}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Vehicle:</span>
                  <span className="font-mono font-semibold text-text-primary">{r.bus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Driver:</span>
                  <span className="text-text-primary">{r.driver}</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-2">
                  <span className="text-text-secondary">Students Boarded:</span>
                  <span className="font-mono font-bold text-brand-primary">
                    {r.boarded} / {r.capacity}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
