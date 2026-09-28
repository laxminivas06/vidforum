"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { RoleType } from "@/config/navigation"
import { Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react"

// Background RBAC Workspace Redirection Map
const ROLE_WORKSPACE_MAP: Record<RoleType, string> = {
  SUPER_ADMIN: "/dashboard",
  INSTITUTION_ADMIN: "/dashboard",
  FACULTY: "/faculty/dashboard",
  STUDENT: "/students/cccccccc-cccc-cccc-cccc-cccccccccc01",
  PARENT: "/students/cccccccc-cccc-cccc-cccc-cccccccccc01",
  ADMISSION_TEAM: "/admissions",
  FINANCE_TEAM: "/finance/dashboard",
  EXAM_TEAM: "/examinations/schedules",
  ACADEMIC_COORDINATOR: "/academics/hierarchy",
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError("Please enter your User ID or Email.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Background RBAC role resolution: backend resolves role from user identity
      const assignedRole = await login(identifier.trim(), password)
      const workspaceRoute = ROLE_WORKSPACE_MAP[assignedRole] || "/dashboard"
      router.push(workspaceRoute)
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate Google OAuth SSO: resolve user in background via Google account
      const googleAccount = identifier.trim()
        ? (identifier.includes("@") ? identifier.trim() : `${identifier.trim().toLowerCase()}@gmail.com`)
        : "admin@springfield.edu"

      const assignedRole = await login(googleAccount, "google_oauth_verified")
      const workspaceRoute = ROLE_WORKSPACE_MAP[assignedRole] || "/dashboard"
      router.push(workspaceRoute)
    } catch (err: any) {
      setError("Google Sign-In failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      {/* Central Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-9">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm mb-3">
            VID
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to VID
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your credentials to access your workspace
          </p>
        </div>

        {/* 3) Signin with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-sm transition-all shadow-sm hover:border-slate-300 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider text-slate-400">
            <span className="bg-white px-3 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* 1) User ID and Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              User ID or Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. name@institution.edu or student ID"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 2) Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault()
                  alert("Please contact your institutional administrator or IT desk to reset your credentials.")
                }}
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all pl-10 pr-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-slate-900 hover:bg-black text-white font-medium py-3 px-5 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by Role-Based Access Control (RBAC)
        </p>
      </div>
    </div>
  )
}
