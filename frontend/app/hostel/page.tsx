"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { Home, Plus, Users, Bed } from "lucide-react"

export default function HostelPage() {
  return (
    <AppShell
      pageTitle="Residential Hostel Management"
      breadcrumbs={[{ label: "Optional" }, { label: "Hostel" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Allocate Room
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Boys Dormitory (Block A)</CardTitle>
                <Badge variant="positive">92% Full</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Warden:</span>
                <span className="font-semibold text-text-primary">Mr. Someshwar Rao</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Beds Occupied:</span>
                <span className="font-mono text-text-primary font-bold">184 / 200</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Girls Dormitory (Block B)</CardTitle>
                <Badge variant="positive">88% Full</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Warden:</span>
                <span className="font-semibold text-text-primary">Mrs. Geeta Nayak</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Beds Occupied:</span>
                <span className="font-mono text-text-primary font-bold">176 / 200</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
