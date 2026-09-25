"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { StudentProfile } from "@/components/student/StudentProfile"
import { Button } from "@/components/ui"
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react"

export default function StudentMasterPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params?.id as string || "STU-2026-042"

  return (
    <AppShell
      pageTitle="Student Master Entity"
      breadcrumbs={[
        { label: "Directory", href: "/admissions" },
        { label: "Students" },
        { label: studentId },
      ]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Print Dossier
          </Button>
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400"
            leadingIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Verify VID Credential
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Render Single Reusable Student Master Profile (PRD Rule 1) */}
        <StudentProfile studentId={studentId} />
      </div>
    </AppShell>
  )
}
