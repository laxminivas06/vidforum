"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { Trophy, Plus, Users } from "lucide-react"

export default function SportsPage() {
  return (
    <AppShell
      pageTitle="Sports & Athletics Desk"
      breadcrumbs={[{ label: "Optional" }, { label: "Sports" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Register Team
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Football Squad (Under-16)</CardTitle>
                <Badge variant="positive">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-1.5">
              <div>Coach: Mr. Rajesh Kumar</div>
              <div>Team Size: 18 Players</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Basketball Varsity</CardTitle>
                <Badge variant="positive">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs flex flex-col gap-1.5">
              <div>Coach: Ms. Tanya Sen</div>
              <div>Team Size: 12 Players</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
