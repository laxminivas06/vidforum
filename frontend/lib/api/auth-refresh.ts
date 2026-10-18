"use client"

import { API_BASE_URL } from "./hooks"
import { readAuthMirror, saveAuthMirror } from "@/lib/face/offline-store"

// Access tokens live 15 minutes; this keeps the session alive with the rotating refresh token.
// Only auth session tokens are kept in localStorage (vid_auth_token / vid_refresh_token), per AGENTS.md.
const ACCESS_KEY = "vid_auth_token"
const REFRESH_KEY = "vid_refresh_token"
const UPDATED_KEY = "vid_auth_updated_at"
const RENEW_BEFORE_MS = 3 * 60 * 1000

function expiresAt(token: string | null): number {
  if (!token) return 0
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    return (payload.exp || 0) * 1000
  } catch {
    return 0
  }
}

/** Copies the current session tokens to the encrypted store used by the Background Sync worker. */
export async function mirrorAuthTokens() {
  const token = localStorage.getItem(ACCESS_KEY)
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!token || !refreshToken) return
  const updatedAt = Number(localStorage.getItem(UPDATED_KEY)) || Date.now()
  // Never overwrite newer tokens the worker rotated while the app was closed (they are adopted instead)
  const mirror = await readAuthMirror().catch(() => null)
  if (mirror && mirror.updatedAt > updatedAt) return
  await saveAuthMirror({ token, refreshToken, apiBase: API_BASE_URL, updatedAt }).catch(() => undefined)
}

/** The worker may have rotated the tokens while the app was closed: adopt them so ours aren't stale. */
async function adoptNewerTokens() {
  const mirror = await readAuthMirror().catch(() => null)
  if (mirror && mirror.updatedAt > (Number(localStorage.getItem(UPDATED_KEY)) || 0) && mirror.refreshToken !== localStorage.getItem(REFRESH_KEY)) {
    localStorage.setItem(ACCESS_KEY, mirror.token)
    localStorage.setItem(REFRESH_KEY, mirror.refreshToken)
    localStorage.setItem(UPDATED_KEY, String(mirror.updatedAt))
  }
}

async function doRefresh(force: boolean): Promise<boolean> {
  await adoptNewerTokens()
  // Another tab (or the sync worker) may have refreshed already: re-check inside the lock
  if (!force && expiresAt(localStorage.getItem(ACCESS_KEY)) - Date.now() > RENEW_BEFORE_MS) return true
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.success) return false
    localStorage.setItem(ACCESS_KEY, json.data.token)
    localStorage.setItem(REFRESH_KEY, json.data.refreshToken)
    localStorage.setItem(UPDATED_KEY, String(Date.now()))
    await mirrorAuthTokens()
    return true
  } catch {
    return false // offline: try again later
  }
}

let inFlight: Promise<boolean> | null = null

/**
 * Renews the access token when it is close to expiry (or always, with force=true after a 401).
 * Web Locks serialise refreshes across tabs, because each refresh token can be used only once.
 */
export function refreshAccessToken(force = false): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (!inFlight) {
    const run = () => doRefresh(force)
    const locked = async (): Promise<boolean> => (navigator.locks ? await navigator.locks.request("vid-token-refresh", run) : run())
    inFlight = locked().finally(() => {
      inFlight = null
    })
  }
  return inFlight!
}

/** Keeps the session fresh while the app is open; returns a cleanup function. */
export function startTokenAutoRefresh(): () => void {
  const tick = () => {
    if (navigator.onLine && localStorage.getItem(REFRESH_KEY)) refreshAccessToken()
  }
  mirrorAuthTokens() // covers a fresh login
  tick()
  const timer = window.setInterval(tick, 60 * 1000)
  window.addEventListener("online", tick)
  document.addEventListener("visibilitychange", tick)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener("online", tick)
    document.removeEventListener("visibilitychange", tick)
  }
}
