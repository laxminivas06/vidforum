"use client"

import { API_BASE_URL, getAuthHeaders } from "@/lib/api/hooks"
import { refreshAccessToken } from "@/lib/api/auth-refresh"
import { usableTemplates, type GalleryStudent } from "./engine"
import type { FaceSection } from "@/lib/api/hooks"
import {
  cacheSections,
  readCachedSections,
  cacheGallery,
  readCachedGallery,
  getDeviceCode,
  readDeviceId,
  saveDeviceId,
  enqueueSubmission,
  listQueuedSubmissions,
  removeQueuedSubmission,
} from "./offline-store"

const FACE_API = `${API_BASE_URL}/attendance/face`

export interface FaceSubmitPayload {
  sectionId: string
  sessionDate: string
  periodNumber: 1 | 2
  deviceId: string
  modelVersion: string
  events: Array<{ clientEventId: string; studentId: string | null; confidence: number; detectedAt: string }>
  records: Array<{
    studentId: string
    status: "present" | "absent"
    source: "ai_face" | "manual"
    clientEventId?: string
    template?: number[]
  }>
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const send = () => fetch(`${FACE_API}${path}`, { ...init, headers: { ...getAuthHeaders(), ...(init?.headers || {}) } })
  let res = await send()
  // Expired access token (e.g. after working offline): renew once and retry
  if (res.status === 401 && (await refreshAccessToken(true))) res = await send()
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) {
    const err = new Error(json.message || `Request failed (${res.status})`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return json.data as T
}

/** Network failure (offline / server unreachable), as opposed to a rejected request. */
export const isNetworkError = (err: unknown) => err instanceof TypeError

/** Sections the caller may take attendance for; cached for offline use. */
export async function loadSections(): Promise<FaceSection[]> {
  try {
    const sections = await api<FaceSection[]>("/sections")
    await cacheSections(sections)
    return sections
  } catch (err) {
    if (!isNetworkError(err)) throw err
    return (await readCachedSections<FaceSection[]>()) || []
  }
}

/** Section roster with face templates. Falls back to the encrypted on-device copy when offline. */
export async function loadGallery(sectionId: string): Promise<{ students: GalleryStudent[]; offline: boolean }> {
  try {
    const students = (await api<GalleryStudent[]>(`/gallery/${sectionId}`)).map((st) => ({ ...st, templates: usableTemplates(st.templates) }))
    await cacheGallery(sectionId, students)
    return { students, offline: false }
  } catch (err) {
    if (!isNetworkError(err)) throw err
    const cached = await readCachedGallery<GalleryStudent[]>(sectionId)
    if (!cached) throw new Error("You are offline and this section has not been opened on this device today.")
    return { students: cached, offline: true }
  }
}

/** This browser's camera_devices id; registered once, then reused offline. */
export async function ensureDeviceId(): Promise<string> {
  const existing = await readDeviceId()
  if (existing) return existing
  const device = await api<{ id: string }>("/devices", {
    method: "POST",
    body: JSON.stringify({
      deviceCode: await getDeviceCode(),
      deviceType: "web",
      metadata: { userAgent: navigator.userAgent },
    }),
  })
  await saveDeviceId(device.id)
  return device.id
}

/**
 * Asks the browser to upload the queue in the background when connectivity returns, even if the
 * app is closed (Background Sync: Chrome/Edge/Samsung on Android, Windows, macOS, ChromeOS).
 * Safari/iOS and Firefox don't support it; there the queue uploads the next time the app is opened.
 */
async function requestBackgroundSync() {
  try {
    const reg: any = await navigator.serviceWorker?.ready
    await reg?.sync?.register("vid-face-queue")
  } catch {
    /* unsupported: foreground sync still covers it */
  }
}

/** Submits the teacher-verified list; queues it on-device when offline. */
export async function submitFaceAttendance(payload: FaceSubmitPayload): Promise<"synced" | "queued"> {
  try {
    await api("/submit", { method: "POST", body: JSON.stringify(payload) })
    return "synced"
  } catch (err) {
    if (!isNetworkError(err)) throw err
    await enqueueSubmission(crypto.randomUUID(), payload)
    await requestBackgroundSync()
    return "queued"
  }
}

let flushing: Promise<{ synced: number; pending: number; error?: string }> | null = null

/**
 * Replays queued submissions, one flush at a time across this page, other tabs and the Background Sync
 * worker (same Web Lock), so a submission is never sent twice concurrently.
 */
export function flushQueue(): Promise<{ synced: number; pending: number; error?: string }> {
  if (!flushing) {
    const run = () => flushQueueNow()
    const locked = async () => (navigator.locks ? await navigator.locks.request("vid-face-queue", run) : run())
    flushing = locked().finally(() => {
      flushing = null
    })
  }
  return flushing
}

async function flushQueueNow(): Promise<{ synced: number; pending: number; error?: string }> {
  const items = await listQueuedSubmissions<FaceSubmitPayload>()
  let synced = 0
  let error: string | undefined
  for (const item of items) {
    try {
      await api("/submit", { method: "POST", body: JSON.stringify(item.payload) })
      await removeQueuedSubmission(item.id)
      synced++
    } catch (err: any) {
      if (isNetworkError(err)) {
        await requestBackgroundSync()
        break
      }
      // 401: keep it queued until the user signs in again; other rejections are surfaced
      error = err.status === 401 ? "Session ended. Sign in again to sync pending attendance." : err.message
    }
  }
  return { synced, pending: items.length - synced, error }
}

export async function pendingCount(): Promise<number> {
  return (await listQueuedSubmissions()).length
}

/** Detections pushed by dedicated terminals for this section today. */
export async function loadTerminalEvents(sectionId: string, from: Date, to: Date) {
  const qs = new URLSearchParams({ sectionId, from: from.toISOString(), to: to.toISOString() })
  return api<Array<{ studentId: string; confidence: number | null; deviceCode: string; deviceType: string }>>(`/events?${qs}`)
}

/**
 * Registers the offline service worker (only from Face Attendance pages, production builds only: in `next dev`
 * chunk URLs aren't content-hashed, so caching them would serve stale code to developers).
 */
export function registerFaceServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
  if (process.env.NODE_ENV !== "production") {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => undefined)
    return
  }
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => caches.open("vid-face-v3"))
    .then((cache) => {
      // Chunks loaded before the worker took control are cached now, so the very first
      // online visit is enough for the page to open offline later.
      const urls = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((u) => u.startsWith(`${location.origin}/_next/static/`))
      return Promise.allSettled([...urls, location.pathname].map((u) => cache.add(u)))
    })
    .catch((err) => console.warn("Service worker registration failed:", err))
}

/** App-wide: pushes queued offline attendance as soon as any page is open and the network is back. */
export function startFaceQueueSync(): () => void {
  const run = () => {
    if (navigator.onLine) flushQueue().catch(() => undefined)
  }
  run()
  window.addEventListener("online", run)
  return () => window.removeEventListener("online", run)
}

// =========================================================================
// ZERO-CONFIGURATION GROUP FACE ATTENDANCE (MODULES 13 - 16)
// =========================================================================

export interface InstitutionGalleryStudent extends GalleryStudent {
  classId?: string
  className?: string
  sectionId?: string
  sectionName?: string
}

export interface LiveAttendanceRecord {
  id: string
  institution_id: string
  student_id: string
  student_name: string
  roll_number: string | null
  admission_number: string
  class_name: string
  section_name: string
  attendance_date: string
  session_type: "AM" | "PM"
  detected_at: string
  confidence: number
  proof_thumbnail_url?: string | null
  status: "PRESENT" | "NEEDS_REVIEW"
}

export interface AttendanceReportSummary {
  date: string
  totalStudents: number
  presentCount: number
  absentCount: number
  attendanceRate: number
  amCount: number
  pmCount: number
  classBreakdown: Array<{
    class_name: string
    total_students: number
    present_students: number
  }>
}

export async function loadInstitutionGallery(): Promise<InstitutionGalleryStudent[]> {
  try {
    const raw = await api<InstitutionGalleryStudent[]>("/institution-gallery")
    return raw.map((st) => ({
      ...st,
      templates: usableTemplates(st.templates),
    }))
  } catch (err) {
    console.warn("Failed to load institution face gallery:", err)
    return []
  }
}

export async function recordGroupAttendance(detections: Array<{
  studentId: string
  confidence: number
  detectedAt?: string
  proofThumbnailUrl?: string
  sessionType?: "AM" | "PM"
  status?: "PRESENT" | "NEEDS_REVIEW"
}>): Promise<LiveAttendanceRecord[]> {
  return await api<LiveAttendanceRecord[]>("/group-record", {
    method: "POST",
    body: JSON.stringify({ detections }),
  })
}

export async function loadLiveRecords(filters?: {
  date?: string
  sessionType?: string
  classId?: string
  sectionId?: string
  status?: string
}): Promise<LiveAttendanceRecord[]> {
  const params = new URLSearchParams()
  if (filters?.date) params.append("date", filters.date)
  if (filters?.sessionType && filters.sessionType !== "all") params.append("sessionType", filters.sessionType)
  if (filters?.classId && filters.classId !== "all") params.append("classId", filters.classId)
  if (filters?.sectionId && filters.sectionId !== "all") params.append("sectionId", filters.sectionId)
  if (filters?.status && filters.status !== "all") params.append("status", filters.status)

  return await api<LiveAttendanceRecord[]>(`/live-records?${params.toString()}`)
}

export async function loadAttendanceReports(date?: string): Promise<AttendanceReportSummary> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : ""
  return await api<AttendanceReportSummary>(`/reports${qs}`)
}

