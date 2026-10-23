"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PaymentsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/settings?tab=payments")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm text-muted-foreground animate-pulse">
        Redirecting to Institute Settings (Payments)...
      </p>
    </div>
  )
}
