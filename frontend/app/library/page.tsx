"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { Library, Plus, Book, Search } from "lucide-react"

export default function LibraryPage() {
  return (
    <AppShell
      pageTitle="Library Catalog & Circulation"
      breadcrumbs={[{ label: "Optional" }, { label: "Library" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Issue Book
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Cataloged Volumes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-text-primary">14,280</div>
              <p className="text-xs text-text-secondary mt-1">Across 18 academic genres</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Books Currently Issued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-brand-primary">482</div>
              <p className="text-xs text-text-secondary mt-1">18 overdue reminder notices sent</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
