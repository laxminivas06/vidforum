"use client"

import React, { Suspense } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { AdmissionWorkflowModule } from "@/components/admissions/AdmissionWorkflowModule"

export default function AdmissionsPage() {
  return (
    <AppShell pageTitle="Admissions & Enrollment" breadcrumbs={[{ label: "Core" }, { label: "Admissions & Enrollment" }]}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Admissions Workspace...</div>}>
          <AdmissionWorkflowModule showHeader={true} />
        </Suspense>
      </div>
    </AppShell>
  )
}
