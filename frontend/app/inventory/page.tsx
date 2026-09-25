"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { Package, Plus } from "lucide-react"

export default function InventoryPage() {
  return (
    <AppShell
      pageTitle="Inventory & Asset Management"
      breadcrumbs={[{ label: "Optional" }, { label: "Inventory" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Add Asset Item
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Classroom Smart Projectors</CardTitle>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-1.5">
              <div>Total Count: 48 Units</div>
              <div>Maintenance Status: All Operational</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Science Lab Consumables</CardTitle>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-1.5">
              <div>Stock Level: 84% Reorder Level</div>
              <Badge variant="positive">Adequate Stock</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
