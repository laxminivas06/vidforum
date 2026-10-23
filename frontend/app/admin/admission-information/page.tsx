"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdmissionInformationRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/settings?tab=admission-info")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm text-muted-foreground animate-pulse">
        Redirecting to Institute Settings (Admission Information)...
      </p>
    </div>
  )
}
