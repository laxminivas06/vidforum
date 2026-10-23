"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { AdmissionWorkflowModule } from "@/components/admissions/AdmissionWorkflowModule"

export default function AdmissionControlPage() {
  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto">
        <AdmissionWorkflowModule showHeader={true} />
      </div>
    </AppShell>
  )
}
