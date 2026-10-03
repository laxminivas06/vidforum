"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, changePassword, isAuthenticated } = useAuth()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isMinLength = newPassword.length >= 8
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword
  const isDifferentFromCurrent = newPassword.length > 0 && newPassword !== currentPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      setError("Please enter your current password.")
      return
    }

    if (!isMinLength) {
      setError("New password must be at least 8 characters long.")
      return
    }

    if (!isMatching) {
      setError("New password and confirmation do not match.")
      return
    }

    if (!isDifferentFromCurrent) {
      setError("New password must be different from your current password.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please check your current password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-9">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Change Password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.mustChangePassword
              ? "Your account requires an immediate password update before continuing."
              : "Set a strong, private password for your account."}
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Password updated successfully!</p>
              <p className="text-xs text-emerald-700 mt-0.5">Redirecting to your workspace...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>

            {/* Requirements list */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className={`flex items-center gap-2 ${isMinLength ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 8 characters long</span>
              </div>
              <div className={`flex items-center gap-2 ${isMatching ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passwords match</span>
              </div>
              <div className={`flex items-center gap-2 ${isDifferentFromCurrent ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Different from current password</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isMinLength || !isMatching}
              className="w-full mt-2 bg-slate-900 hover:bg-black text-white font-medium py-3 px-5 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? "Updating..." : "Update Password & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
