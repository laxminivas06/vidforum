"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { RoleType } from "@/config/navigation"
import { ShieldCheck, Eye, EyeOff, Lock, ArrowRight, CheckCircle2, Server } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [domain, setDomain] = useState("springfield.vid.edu")
  const [email, setEmail] = useState("admin@springfield.edu")
  const [password, setPassword] = useState("••••••••••••••••••••")
  const [selectedRole, setSelectedRole] = useState<RoleType>("INSTITUTION_ADMIN")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(email, selectedRole, domain.split(".")[0])
      router.push("/dashboard")
    } catch (err: any) {
      setError("Authentication failed. Please verify credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Container */}
      <div className="w-full max-w-xl">
        {/* Spot Hero Panel */}
        <div className="relative rounded-2xl bg-[#0A0A0A] text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-neutral-800 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">
            {/* Header / Brand Mark */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-sm">
                  VID
                </div>
                <span className="font-semibold text-lg tracking-tight text-white">
                  Virtual Identification
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-[11px] font-semibold text-brand-primary tracking-wider uppercase">
                  GATEWAY ONLINE
                </span>
              </div>
            </div>

            {/* Protocol Title */}
            <div>
              <p className="text-[11px] font-semibold text-brand-primary tracking-widest uppercase">
                TENANT AUTHENTICATION PROTOCOL // SECURE GATEWAY
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                ENTER SECURE ACCESS CONSOLE
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Unified virtual identity infrastructure for multi-tenant educational institutions.
              </p>
            </div>

            {/* Telemetry / Encryption Pill */}
            <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span className="font-mono">ENCRYPTION: 256-BIT QUANTUM-RESISTANT</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-400 font-mono">
                <span>NODE:</span>
                <span className="text-brand-primary font-medium">IN-SOUTH-01</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              {/* Tenant Domain Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase">
                  INSTITUTION TENANT DOMAIN
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. springfield.vid.edu"
                    required
                    className="w-full bg-neutral-900 text-white placeholder-neutral-500 px-4 py-3 rounded-lg font-mono text-sm border border-neutral-800 focus:outline-none focus:border-brand-primary transition-colors"
                  />
                  <div className="absolute right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/20 border border-brand-primary/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                    <span className="text-[10px] font-semibold text-brand-primary tracking-wider uppercase">
                      RESOLVED
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase">
                  ADMINISTRATOR IDENTIFIER / EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.terminal@institution.edu"
                  required
                  className="w-full bg-neutral-900 text-white placeholder-neutral-500 px-4 py-3 rounded-lg font-mono text-sm border border-neutral-800 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              {/* Security Passphrase */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase">
                    SECURITY PASSPHRASE
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="font-mono text-xs text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? "CONCEAL HASH" : "REVEAL HASH"}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  required
                  className="w-full bg-neutral-900 text-white placeholder-neutral-500 px-4 py-3 rounded-lg font-mono text-sm border border-neutral-800 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              {/* Role Selection Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase">
                  OPERATIONAL PERSPECTIVE / ROLE
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                  className="w-full bg-neutral-900 text-white px-4 py-3 rounded-lg font-mono text-sm border border-neutral-800 focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
                >
                  <option value="INSTITUTION_ADMIN">Institution Administrator</option>
                  <option value="SUPER_ADMIN">Platform Super Administrator</option>
                  <option value="FACULTY">Faculty / Instructor</option>
                  <option value="ADMISSION_TEAM">Admissions Officer</option>
                  <option value="FINANCE_TEAM">Finance & Bursar Officer</option>
                  <option value="EXAM_TEAM">Examinations Controller</option>
                  <option value="ACADEMIC_COORDINATOR">Academic Coordinator</option>
                  <option value="STUDENT">Student Portal</option>
                  <option value="PARENT">Parent Portal</option>
                </select>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-brand-primary text-black font-semibold uppercase tracking-wider py-3.5 px-6 rounded-full hover:bg-emerald-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span>{isLoading ? "AUTHENTICATING..." : "AUTHORIZE & LAUNCH CONSOLE"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Actions / Recovery */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-y-2 text-center text-xs text-neutral-400">
              <a href="#provision" className="hover:text-brand-primary transition-colors uppercase">
                Request Tenant Provisioning
              </a>
              <span className="text-neutral-700 select-none hidden sm:inline">•</span>
              <a href="#recover" className="hover:text-brand-primary transition-colors uppercase">
                Recover Credentials
              </a>
              <span className="text-neutral-700 select-none hidden sm:inline">•</span>
              <a href="#token" className="hover:text-brand-primary transition-colors uppercase">
                Hardware Token SSO
              </a>
            </div>
          </div>
        </div>

        {/* Audited Institutional Badges */}
        <div className="w-full mt-8 flex flex-col items-center gap-3 px-4">
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            AUDITED INSTITUTIONAL VERIFICATION TRUST STANDARD
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border-default shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
              <span className="font-mono text-xs text-text-primary">SOC2 TYPE II VERIFIED</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border-default shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
              <span className="font-mono text-xs text-text-primary">FERPA / ED-COMPLIANT</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border-default shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
              <span className="font-mono text-xs text-text-primary">ISO-27001 CLOUD DECK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
