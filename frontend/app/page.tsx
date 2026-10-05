"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function RootPage() {
  const router = useRouter()
  const { isInitialized } = useAuth()

  useEffect(() => {
    // Prefetch login route immediately for instant transition
    router.prefetch("/login")
  }, [router])

  useEffect(() => {
    if (isInitialized) {
      router.replace("/login")
    }
  }, [isInitialized, router])

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center select-none">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-action-black flex items-center justify-center text-canvas font-bold text-2xl tracking-wider shadow-lg">
            <span className="text-brand-green font-extrabold text-3xl">V</span>ID
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-brand-green/30 border-t-brand-green animate-spin pointer-events-none" />
        </div>
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <p className="text-sm font-semibold text-text-primary tracking-wide">
            VID Educational Platform
          </p>
          <p className="text-xs text-text-secondary font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            Initializing platform engine...
          </p>
        </div>
      </div>
    </div>
  )
}

