"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from "@/components/ui"
import { useQuery } from "@tanstack/react-query"
import { ScanFace, Camera, CloudOff, RefreshCw, UserCheck, UserX, ShieldAlert, Users, CheckCircle2 } from "lucide-react"
import {
  ACCEPT_SCORE,
  MODEL_VERSION,
  GalleryStudent,
  cropFace,
  detectFaces,
  getEngine,
  matchFrame,
  similarity,
} from "@/lib/face/engine"
import {
  ensureDeviceId,
  flushQueue,
  loadGallery,
  loadSections,
  loadTerminalEvents,
  pendingCount,
  registerFaceServiceWorker,
  submitFaceAttendance,
  FaceSubmitPayload,
} from "@/lib/face/sync"
import { purgeExpired, saveDraft, readDraft, clearDraft } from "@/lib/face/offline-store"
import { useCamera, grabFrame } from "@/lib/face/useCamera"

type Step = "setup" | "scan" | "review" | "done"
type Mode = "walkup" | "snap"

interface Recognition {
  score: number
  clientEventId: string
  detectedAt: string
  thumb?: string
  template?: number[]
  via: "camera" | "terminal"
}

interface UnknownFace {
  clientEventId: string
  detectedAt: string
  embedding: number[]
  thumb: string
}

/** Unsubmitted scan/review state, autosaved (encrypted) so a power cut or closed browser loses nothing. */
interface Draft {
  date: string
  sectionId: string
  period: 1 | 2
  mode: Mode
  deviceId: string
  offline: boolean
  step: "scan" | "review"
  recognized: Array<[string, Recognition]>
  unknown: UnknownFace[]
  spoofCount: number
  statuses: Array<[string, "present" | "absent"]>
  overridden: string[]
  savedAt: string
}

/** On-video confirmation shown right after a student is recognised. */
interface Confirmation {
  key: string
  name: string
  rollNumber: string | null
  thumb?: string
  repeat: boolean
}

const CONFIRM_MS = 2500 // how long a confirmation card stays on screen
const REPEAT_NOTICE_MS = 5000 // "already marked" shown at most this often per student
const MAX_CONFIRMATIONS = 3

const STABLE_FRAMES = 2 // same student must win consecutive frames in walk-up mode
const LEARN_SCORE = ACCEPT_SCORE + 0.1 // only very confident, teacher-verified captures become new templates
const MAX_UNKNOWN = 20

const today = () => new Date().toLocaleDateString("en-CA") // YYYY-MM-DD in local time

function sessionWindow(period: 1 | 2): [Date, Date] {
  const start = new Date()
  start.setHours(period === 1 ? 0 : 12, 0, 0, 0)
  const end = new Date(start)
  end.setHours(period === 1 ? 12 : 24, 0, 0, 0)
  return [start, end]
}

export default function FaceAttendancePage() {
  const { data: sections = [], isLoading: sectionsLoading, error: sectionsError } = useQuery({
    queryKey: ["face-sections"],
    queryFn: loadSections,
  })
  const camera = useCamera()

  const [step, setStep] = useState<Step>("setup")
  const [sectionId, setSectionId] = useState("")
  const [period, setPeriod] = useState<1 | 2>(new Date().getHours() < 12 ? 1 : 2)
  const [mode, setMode] = useState<Mode>("walkup")
  const [gallery, setGallery] = useState<GalleryStudent[]>([])
  const [offline, setOffline] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [engineReady, setEngineReady] = useState(false)
  const [message, setMessage] = useState<{ tone: "info" | "error" | "warning" | "positive"; text: string } | null>(null)
  const [recognized, setRecognized] = useState<Map<string, Recognition>>(new Map())
  const [unknown, setUnknown] = useState<UnknownFace[]>([])
  const [spoofCount, setSpoofCount] = useState(0)
  const [statuses, setStatuses] = useState<Map<string, "present" | "absent">>(new Map())
  const [overridden, setOverridden] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(0)
  const [busy, setBusy] = useState(false)
  const [resumable, setResumable] = useState<Draft | null>(null)

  const scanning = useRef(false)
  const streaks = useRef<Map<string, number>>(new Map())
  const [confirmations, setConfirmations] = useState<Confirmation[]>([])
  const lastShown = useRef<Map<string, number>>(new Map())
  const recognizedRef = useRef(recognized)
  recognizedRef.current = recognized
  const unknownRef = useRef(unknown)
  unknownRef.current = unknown

  const sectionLabel = useMemo(() => {
    const s = sections.find((x) => x.id === sectionId)
    return s ? `${s.className} – ${s.sectionName}` : ""
  }, [sections, sectionId])

  // ---------- Offline plumbing ----------
  const sync = useCallback(async () => {
    const result = await flushQueue()
    setPending(result.pending)
    if (result.synced > 0) setMessage({ tone: "positive", text: `Synced ${result.synced} offline submission(s).` })
    if (result.error) setMessage({ tone: "warning", text: result.error })
  }, [])

  useEffect(() => {
    registerFaceServiceWorker()
    purgeExpired().catch(() => undefined)
    pendingCount().then(setPending).catch(() => undefined)
    readDraft<Draft>()
      .then((d) => (d && d.date === today() ? setResumable(d) : clearDraft()))
      .catch(() => undefined)
    if (navigator.onLine) sync().catch(() => undefined)
    window.addEventListener("online", sync)
    // Load models in the background so scanning starts instantly
    getEngine()
      .then(() => setEngineReady(true))
      .catch((err) => setMessage({ tone: "error", text: `Face engine failed to load: ${err.message}` }))
    return () => window.removeEventListener("online", sync)
  }, [sync])

  // Autosave the unsubmitted session (debounced) whenever it changes
  useEffect(() => {
    if ((step !== "scan" && step !== "review") || !deviceId) return
    const timer = window.setTimeout(() => {
      const draft: Draft = {
        date: today(),
        sectionId,
        period,
        mode,
        deviceId,
        offline,
        step,
        recognized: Array.from(recognized.entries()),
        unknown,
        spoofCount,
        statuses: Array.from(statuses.entries()),
        overridden: Array.from(overridden),
        savedAt: new Date().toISOString(),
      }
      saveDraft(draft).catch((err) => console.warn("Draft autosave failed:", err))
    }, 800)
    return () => window.clearTimeout(timer)
  }, [step, sectionId, period, mode, deviceId, offline, recognized, unknown, spoofCount, statuses, overridden])

  const resume = async (d: Draft) => {
    setBusy(true)
    setMessage(null)
    try {
      const { students, offline: isOffline } = await loadGallery(d.sectionId)
      setGallery(students)
      setOffline(isOffline || d.offline)
      setSectionId(d.sectionId)
      setPeriod(d.period)
      setMode(d.mode)
      setDeviceId(d.deviceId)
      setRecognized(new Map(d.recognized))
      setUnknown(d.unknown)
      setSpoofCount(d.spoofCount)
      setStatuses(new Map(d.statuses))
      setOverridden(new Set(d.overridden))
      streaks.current = new Map()
      setResumable(null)
      setStep(d.step)
      if (d.step === "scan") await camera.start()
    } catch (err: any) {
      setMessage({ tone: "error", text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const discardDraft = async () => {
    await clearDraft()
    setResumable(null)
  }

  // ---------- Setup ----------
  const startSession = async () => {
    if (!sectionId) return
    setBusy(true)
    setMessage(null)
    setResumable(null)
    try {
      const [{ students, offline: isOffline }, device] = await Promise.all([loadGallery(sectionId), ensureDeviceId()])
      if (students.every((s) => s.templates.length === 0)) {
        setMessage({ tone: "warning", text: "No student in this section is enrolled yet. Enroll faces first." })
        return
      }
      setGallery(students)
      setOffline(isOffline)
      setDeviceId(device)
      setRecognized(new Map())
      setUnknown([])
      setSpoofCount(0)
      streaks.current = new Map()
      lastShown.current = new Map()
      setConfirmations([])
      setStep("scan")
      await camera.start()
    } catch (err: any) {
      const text = /offline|Failed to fetch/i.test(err.message)
        ? "This device has not been set up online yet. Open this page once with internet, then it works offline."
        : err.message
      setMessage({ tone: "error", text })
    } finally {
      setBusy(false)
    }
  }

  // ---------- Recognition ----------
  const handleFrame = useCallback(
    async (source: HTMLVideoElement | HTMLCanvasElement, requireStable: boolean) => {
      const faces = await detectFaces(source, { liveCheck: true })
      const matches = await matchFrame(faces, gallery)
      const seen = new Set<string>()
      const now = new Date().toISOString()
      const additions = new Map(recognizedRef.current)
      let changed = false
      let spoofs = 0
      const newUnknown: UnknownFace[] = []
      const confirmed: Confirmation[] = []
      const nowMs = Date.now()
      const confirm = (student: GalleryStudent, thumb: string | undefined, repeat: boolean) => {
        lastShown.current.set(student.id, nowMs)
        confirmed.push({ key: `${student.id}-${nowMs}`, name: student.name, rollNumber: student.rollNumber, thumb, repeat })
      }

      for (const { face, match } of matches) {
        if (face.spoof) {
          spoofs++
          continue
        }
        if (!match) {
          if (face.frontal && unknownRef.current.length + newUnknown.length < MAX_UNKNOWN) {
            const known = [...unknownRef.current, ...newUnknown]
            const sims = await Promise.all(known.map((u) => similarity(u.embedding, face.embedding)))
            if (sims.every((s) => s < ACCEPT_SCORE)) {
              newUnknown.push({ clientEventId: crypto.randomUUID(), detectedAt: now, embedding: face.embedding, thumb: cropFace(source, face.box, 96) })
            }
          }
          continue
        }
        const id = match.student.id
        seen.add(id)
        const streak = (streaks.current.get(id) || 0) + 1
        streaks.current.set(id, streak)
        if (requireStable && streak < STABLE_FRAMES) continue

        const prev = additions.get(id)
        const learnable = match.score >= LEARN_SCORE && face.frontal ? face.embedding : undefined
        if (!prev) {
          const thumb = cropFace(source, face.box, 96)
          additions.set(id, {
            score: match.score,
            clientEventId: crypto.randomUUID(),
            detectedAt: now,
            thumb,
            template: learnable,
            via: "camera",
          })
          changed = true
          confirm(match.student, thumb, false)
        } else {
          if (match.score > prev.score) {
            additions.set(id, { ...prev, score: match.score, template: learnable || prev.template })
            changed = true
          }
          // Student stepped up again: tell them they're already counted (throttled)
          if (nowMs - (lastShown.current.get(id) || 0) > REPEAT_NOTICE_MS) confirm(match.student, prev.thumb, true)
        }
      }
      // Streaks only count consecutive frames
      for (const id of Array.from(streaks.current.keys())) if (!seen.has(id)) streaks.current.delete(id)

      if (changed) setRecognized(additions)
      if (confirmed.length) {
        setConfirmations((c) => [...c, ...confirmed].slice(-MAX_CONFIRMATIONS))
        const keys = new Set(confirmed.map((c) => c.key))
        window.setTimeout(() => setConfirmations((c) => c.filter((x) => !keys.has(x.key))), CONFIRM_MS)
      }
      if (newUnknown.length) setUnknown((u) => [...u, ...newUnknown])
      if (spoofs) setSpoofCount((c) => c + spoofs)
      return matches.length
    },
    [gallery]
  )

  // Walk-up mode: continuous loop on the live video
  useEffect(() => {
    if (step !== "scan" || mode !== "walkup" || !camera.active || !engineReady) return
    scanning.current = true
    const loop = async () => {
      while (scanning.current) {
        const video = camera.videoRef.current
        if (video && video.readyState >= 2) {
          try {
            await handleFrame(video, true)
          } catch (err) {
            console.warn("Frame skipped:", err)
          }
        }
        await new Promise((r) => setTimeout(r, 120))
      }
    }
    loop()
    return () => {
      scanning.current = false
    }
  }, [step, mode, camera.active, camera.videoRef, engineReady, handleFrame])

  // Group snap: one still of the whole class
  const snap = async () => {
    const video = camera.videoRef.current
    if (!video) return
    setBusy(true)
    try {
      const faces = await handleFrame(grabFrame(video), false)
      setMessage({ tone: "info", text: `Snap processed: ${faces} face(s) found.` })
    } finally {
      setBusy(false)
    }
  }

  // ---------- Review ----------
  const goToReview = async () => {
    scanning.current = false
    camera.stop()
    setConfirmations([])
    const merged = new Map(recognizedRef.current)
    if (!offline) {
      try {
        const [from, to] = sessionWindow(period)
        const events = await loadTerminalEvents(sectionId, from, to)
        for (const e of events) {
          if (!merged.has(e.studentId)) {
            merged.set(e.studentId, {
              score: Number(e.confidence ?? 1),
              clientEventId: crypto.randomUUID(),
              detectedAt: new Date().toISOString(),
              via: "terminal",
            })
          }
        }
      } catch {
        /* terminals are optional; review continues with camera results */
      }
    }
    setRecognized(merged)
    setStatuses(new Map(gallery.map((s) => [s.id, merged.has(s.id) ? "present" : "absent"])))
    setOverridden(new Set())
    setStep("review")
  }

  const toggle = (id: string) => {
    setStatuses((prev) => new Map(prev).set(id, prev.get(id) === "present" ? "absent" : "present"))
    setOverridden((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const submit = async () => {
    if (!deviceId) return
    setBusy(true)
    setMessage(null)
    const payload: FaceSubmitPayload = {
      sectionId,
      sessionDate: today(),
      periodNumber: period,
      deviceId,
      modelVersion: MODEL_VERSION,
      events: [
        ...Array.from(recognized.entries())
          .filter(([, r]) => r.via === "camera")
          .map(([studentId, r]) => ({ clientEventId: r.clientEventId, studentId, confidence: r.score, detectedAt: r.detectedAt })),
        ...unknown.map((u) => ({ clientEventId: u.clientEventId, studentId: null, confidence: 0, detectedAt: u.detectedAt })),
      ],
      records: gallery.map((s) => {
        const status = statuses.get(s.id) || "absent"
        const rec = recognized.get(s.id)
        const fromFace = status === "present" && !!rec && !overridden.has(s.id)
        return {
          studentId: s.id,
          status,
          source: fromFace ? "ai_face" : "manual",
          clientEventId: fromFace && rec!.via === "camera" ? rec!.clientEventId : undefined,
          template: fromFace ? rec!.template : undefined,
        }
      }),
    }
    try {
      const result = await submitFaceAttendance(payload)
      await clearDraft()
      setPending(await pendingCount())
      setMessage(
        result === "synced"
          ? { tone: "positive", text: "Attendance submitted and saved." }
          : { tone: "warning", text: "You are offline. Attendance is saved securely on this device and will sync automatically." }
      )
      setStep("done")
    } catch (err: any) {
      setMessage({ tone: "error", text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const presentCount = Array.from(statuses.values()).filter((s) => s === "present").length

  return (
    <AppShell
      pageTitle="Face Attendance"
      breadcrumbs={[{ label: "Core" }, { label: "Attendance", href: "/attendance/sessions" }, { label: "Face Attendance" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <Button size="dense" variant="secondary" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={sync}>
              {pending} pending sync
            </Button>
          )}
          <Link href="/attendance/face/enroll">
            <Button size="dense" variant="secondary" leftIcon={<Users className="w-3.5 h-3.5" />}>
              Face Enrollment
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {message && (
          <Badge variant={message.tone} className="w-full justify-start py-2 px-3 text-sm whitespace-normal">
            {message.text}
          </Badge>
        )}
        {offline && step !== "setup" && (
          <Badge variant="warning" className="py-1.5 px-3">
            <CloudOff className="w-3.5 h-3.5 mr-1 inline" /> Offline mode: using this device's encrypted copy
          </Badge>
        )}

        {step === "setup" && resumable && (
          <Card>
            <CardContent className="py-4 flex flex-wrap items-center gap-3">
              <p className="flex-1 min-w-[220px] text-sm">
                Unfinished attendance found
                {sections.find((s) => s.id === resumable.sectionId)
                  ? ` for ${sections.find((s) => s.id === resumable.sectionId)!.className} – ${sections.find((s) => s.id === resumable.sectionId)!.sectionName}`
                  : ""}{" "}
                ({resumable.period === 1 ? "Morning" : "Afternoon"}): {resumable.recognized.length} recognised, last saved{" "}
                {new Date(resumable.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
              </p>
              <Button variant="secondary" onClick={discardDraft}>
                Discard
              </Button>
              <Button onClick={() => resume(resumable)} isLoading={busy}>
                Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle>Start attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary">Section</label>
                  <Select
                    value={sectionId}
                    onChange={setSectionId}
                    placeholder={sectionsLoading ? "Loading sections..." : sections.length === 0 ? "No sections available" : "Choose section"}
                    options={sections.map((s) => ({
                      value: s.id,
                      label: `${s.className} – ${s.sectionName}`,
                      sublabel: `${s.enrolledCount}/${s.studentCount} faces enrolled`,
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Session</label>
                  <div className="flex gap-2 mt-1">
                    {([1, 2] as const).map((p) => (
                      <Button key={p} size="dense" variant={period === p ? "primary" : "secondary"} onClick={() => setPeriod(p)}>
                        {p === 1 ? "Morning" : "Afternoon"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Capture mode</label>
                  <div className="flex gap-2 mt-1">
                    <Button size="dense" variant={mode === "walkup" ? "primary" : "secondary"} onClick={() => setMode("walkup")}>
                      Walk-up
                    </Button>
                    <Button size="dense" variant={mode === "snap" ? "primary" : "secondary"} onClick={() => setMode("snap")}>
                      Group snap
                    </Button>
                  </div>
                </div>
              </div>
              {sectionsError && <Badge variant="error">{(sectionsError as Error).message}</Badge>}
              <p className="text-xs text-text-muted">
                Walk-up: students come to the camera one by one (door, kiosk, tablet). Group snap: take one or more photos of the whole class.
                Recognition runs on this device and works without internet once the section has been opened online today.
              </p>
              <Button onClick={startSession} isLoading={busy} disabled={!sectionId} leftIcon={<ScanFace className="w-4 h-4" />}>
                {engineReady ? "Start scanning" : "Start scanning (loading face engine...)"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "scan" && (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <CardTitle>
                  {sectionLabel} · {period === 1 ? "Morning" : "Afternoon"}
                </CardTitle>
                {camera.cameras.length > 1 && (
                  <select
                    className="text-xs border border-border-default rounded-md px-2 py-1 bg-canvas"
                    value={camera.cameraId}
                    onChange={(e) => camera.start(e.target.value)}
                  >
                    {camera.cameras.map((c, i) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video ref={camera.videoRef} className="w-full h-full object-contain" playsInline muted />
                  {!engineReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">Loading face engine...</div>
                  )}
                  <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2" aria-live="polite">
                    {confirmations.map((c) => (
                      <div
                        key={c.key}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white shadow-lg ${c.repeat ? "bg-black/70" : "bg-emerald-600/90"}`}
                      >
                        <CheckCircle2 className="w-6 h-6 shrink-0" />
                        {c.thumb && <img src={c.thumb} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/70" />}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-white/90">
                            {c.rollNumber ? `Roll ${c.rollNumber} · ` : ""}
                            {c.repeat ? "Already marked present" : "Marked present"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {camera.error && <Badge variant="error">{camera.error}</Badge>}
                <div className="flex flex-wrap gap-2">
                  {mode === "snap" && (
                    <Button onClick={snap} isLoading={busy} disabled={!camera.active || !engineReady} leftIcon={<Camera className="w-4 h-4" />}>
                      Take class photo
                    </Button>
                  )}
                  <Button variant={mode === "snap" ? "secondary" : "primary"} onClick={goToReview}>
                    Finish & review
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Recognised {recognized.size}/{gallery.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {spoofCount > 0 && (
                  <Badge variant="warning">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1 inline" /> {spoofCount} photo/screen attempt(s) ignored
                  </Badge>
                )}
                <ul className="space-y-1.5 max-h-[420px] overflow-y-auto">
                  {gallery
                    .filter((s) => recognized.has(s.id))
                    .map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        {recognized.get(s.id)?.thumb && (
                          <img src={recognized.get(s.id)!.thumb} alt="" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <span className="flex-1 truncate">
                          {s.rollNumber ? `${s.rollNumber}. ` : ""}
                          {s.name}
                        </span>
                        <span className="text-xs text-text-muted">{Math.round(recognized.get(s.id)!.score * 100)}%</span>
                      </li>
                    ))}
                </ul>
                {unknown.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Unrecognised faces ({unknown.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {unknown.map((u) => (
                        <img key={u.clientEventId} src={u.thumb} alt="Unrecognised face" className="w-8 h-8 rounded object-cover" />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "review" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle>
                Review · {sectionLabel} · {period === 1 ? "Morning" : "Afternoon"}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="positive">Present {presentCount}</Badge>
                <Badge variant="error">Absent {gallery.length - presentCount}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-text-muted">
                Tap a student to change their status. Nothing is saved to student records until you submit.
              </p>
              <ul className="divide-y divide-border-default">
                {gallery.map((s) => {
                  const rec = recognized.get(s.id)
                  const present = statuses.get(s.id) === "present"
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        className="w-full flex items-center gap-3 py-2 text-left hover:bg-subtle rounded-md px-2"
                      >
                        {rec?.thumb ? (
                          <img src={rec.thumb} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-subtle" />
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm truncate">
                            {s.rollNumber ? `${s.rollNumber}. ` : ""}
                            {s.name}
                          </span>
                          <span className="block text-xs text-text-muted">
                            {rec
                              ? rec.via === "terminal"
                                ? "Detected by terminal"
                                : `Face match ${Math.round(rec.score * 100)}%`
                              : s.templates.length === 0
                                ? "Face not enrolled"
                                : "Not detected"}
                            {overridden.has(s.id) ? " · changed by teacher" : ""}
                          </span>
                        </span>
                        <Badge variant={present ? "positive" : "error"}>
                          {present ? <UserCheck className="w-3.5 h-3.5 inline mr-1" /> : <UserX className="w-3.5 h-3.5 inline mr-1" />}
                          {present ? "Present" : "Absent"}
                        </Badge>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep("scan")
                    camera.start(camera.cameraId || undefined)
                  }}
                >
                  Back to scanning
                </Button>
                <Button onClick={submit} isLoading={busy}>
                  Submit attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card>
            <CardContent className="py-8 flex flex-col items-center gap-3">
              <p className="text-sm text-text-secondary">
                {sectionLabel} · {period === 1 ? "Morning" : "Afternoon"}: {presentCount} present, {gallery.length - presentCount} absent.
              </p>
              <Button
                onClick={() => {
                  setStep("setup")
                  setMessage(null)
                }}
              >
                Take another attendance
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
