"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from "@/components/ui"
import { 
  Play, 
  Square, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ShieldCheck, 
  Users, 
  Clock, 
  GraduationCap, 
  Filter, 
  Search, 
  RefreshCw,
  Video,
  ScanFace,
  CheckCheck,
  UserX,
  FileSpreadsheet
} from "lucide-react"
import { 
  loadInstitutionGallery, 
  recordGroupAttendance, 
  loadLiveRecords, 
  LiveAttendanceRecord, 
  InstitutionGalleryStudent 
} from "@/lib/face/sync"
import { 
  detectFaces, 
  matchFace, 
  ACCEPT_SCORE 
} from "@/lib/face/engine"

export default function AutomatedFaceAttendancePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [gallery, setGallery] = useState<InstitutionGalleryStudent[]>([])
  const [liveRecords, setLiveRecords] = useState<LiveAttendanceRecord[]>([])
  const [tableLoading, setTableLoading] = useState(false)

  // Session stats
  const [sessionDetectedCount, setSessionDetectedCount] = useState(0)
  const [sessionNewPresentCount, setSessionNewPresentCount] = useState(0)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  // Proof Modal
  const [selectedProofRecord, setSelectedProofRecord] = useState<LiveAttendanceRecord | null>(null)
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)

  // Post-Recognition Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterClass, setFilterClass] = useState("all")
  const [filterSession, setFilterSession] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Refs for video & loop
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopActiveRef = useRef(false)
  const markedTodaySetRef = useRef<Set<string>>(new Set())

  // Load Gallery and Initial Records on mount
  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        setTableLoading(true)
        const [gal, recs] = await Promise.all([
          loadInstitutionGallery(),
          loadLiveRecords({ date: new Date().toISOString().split("T")[0] }),
        ])
        if (mounted) {
          setGallery(gal)
          setLiveRecords(recs)
          // Pre-populate marked student IDs to prevent duplicate requests
          recs.forEach((r) => markedTodaySetRef.current.add(`${r.student_id}_${r.session_type}`))
        }
      } catch (err) {
        console.error("Failed to initialize face gallery:", err)
      } finally {
        if (mounted) setTableLoading(false)
      }
    }
    init()
    return () => {
      mounted = false
      stopCapture()
    }
  }, [])

  // Start Attendance
  const startCapture = async () => {
    try {
      setCameraLoading(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Ensure gallery is loaded
      if (gallery.length === 0) {
        const gal = await loadInstitutionGallery()
        setGallery(gal)
      }

      loopActiveRef.current = true
      setIsRunning(true)
      setCameraLoading(false)
      setSessionDetectedCount(0)
      setSessionNewPresentCount(0)

      // Begin continuous multi-face recognition loop
      runDetectionLoop()
    } catch (err: any) {
      setCameraLoading(false)
      setIsRunning(false)
      alert("Camera initialization failed: " + (err.message || "Please allow webcam access"))
    }
  }

  // Stop Attendance
  const stopCapture = () => {
    loopActiveRef.current = false
    setIsRunning(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (sessionDetectedCount > 0) {
      setShowSummaryModal(true)
    }
  }

  // Continuous Detection Loop
  const runDetectionLoop = useCallback(async () => {
    if (!loopActiveRef.current || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState >= 2 && video.videoWidth > 0) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          // Detect all faces concurrently in the current frame
          const detected = await detectFaces(canvas, { liveCheck: false })

          if (detected.length > 0) {
            setSessionDetectedCount((prev) => prev + detected.length)
            const currentSession: "AM" | "PM" = new Date().getHours() < 12 ? "AM" : "PM"
            const newHits: Array<{
              studentId: string
              confidence: number
              proofThumbnailUrl: string
              sessionType: "AM" | "PM"
              status: "PRESENT" | "NEEDS_REVIEW"
            }> = []

            for (const face of detected) {
              const match = await matchFace(face.embedding, gallery)
              if (match && match.accepted) {
                const key = `${match.student.id}_${currentSession}`
                if (!markedTodaySetRef.current.has(key)) {
                  markedTodaySetRef.current.add(key)

                  // Generate lightweight thumbnail for proof
                  const thumbCanvas = document.createElement("canvas")
                  thumbCanvas.width = 160
                  thumbCanvas.height = 160
                  const tCtx = thumbCanvas.getContext("2d")
                  if (tCtx) {
                    const [bx, by, bw, bh] = face.box
                    tCtx.drawImage(
                      canvas,
                      Math.max(0, bx - 20),
                      Math.max(0, by - 20),
                      Math.min(canvas.width, bw + 40),
                      Math.min(canvas.height, bh + 40),
                      0,
                      0,
                      160,
                      160
                    )
                  }

                  newHits.push({
                    studentId: match.student.id,
                    confidence: Math.round(match.score * 100),
                    proofThumbnailUrl: thumbCanvas.toDataURL("image/jpeg", 0.75),
                    sessionType: currentSession,
                    status: "PRESENT",
                  })
                }
              }
            }

            if (newHits.length > 0) {
              // Commit newly recognized faces to cloud database
              const created = await recordGroupAttendance(newHits)
              if (created && created.length > 0) {
                setLiveRecords((prev) => [...created, ...prev])
                setSessionNewPresentCount((prev) => prev + created.length)
              }
            }
          }
        } catch (err) {
          console.warn("Frame analysis error:", err)
        }
      }
    }

    // Next frame tick with 400ms throttle to prevent CPU thrashing
    if (loopActiveRef.current) {
      setTimeout(() => {
        requestAnimationFrame(runDetectionLoop)
      }, 400)
    }
  }, [gallery])

  // Distinct classes for filtering
  const distinctClasses = React.useMemo(() => {
    const set = new Set<string>()
    liveRecords.forEach((r) => {
      if (r.class_name) set.add(r.class_name)
    })
    return Array.from(set)
  }, [liveRecords])

  // Filtered live records
  const filteredRecords = React.useMemo(() => {
    return liveRecords.filter((r) => {
      const matchesSearch =
        r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.roll_number || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesClass = filterClass === "all" || r.class_name === filterClass
      const matchesSession = filterSession === "all" || r.session_type === filterSession
      const matchesStatus = filterStatus === "all" || r.status === filterStatus

      return matchesSearch && matchesClass && matchesSession && matchesStatus
    })
  }, [liveRecords, searchQuery, filterClass, filterSession, filterStatus])

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Modules 13 - 16: Zero-Config Automated Attendance
              </span>
              <Badge variant="outline" className="text-muted-foreground text-xs font-mono">
                {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Automated Group Face Attendance
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Zero-configuration AI attendance kiosk. Start the camera and students are recognized simultaneously across all classes.
            </p>
          </div>

          {/* Primary Controls (Module 13: Minimal Controls - START / STOP only) */}
          <div className="flex items-center gap-3">
            {!isRunning ? (
              <Button
                onClick={startCapture}
                disabled={cameraLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 h-11 shadow-sm transition-all flex items-center gap-2.5"
              >
                <Play className="w-4 h-4 fill-current" />
                {cameraLoading ? "INITIALIZING CAMERA..." : "START ATTENDANCE"}
              </Button>
            ) : (
              <Button
                onClick={stopCapture}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-6 py-2.5 h-11 shadow-sm transition-all flex items-center gap-2.5 animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" />
                STOP ATTENDANCE
              </Button>
            )}
          </div>
        </div>

        {/* Live Camera Viewport & Stream Status Banner */}
        <Card className="border border-border/70 shadow-sm overflow-hidden bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRunning ? "bg-emerald-500 animate-ping" : "bg-muted-foreground/40"
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {isRunning ? "AI Group Scanner Active (Running)" : "Kiosk Standby (Stopped)"}
              </span>
              <Badge variant={isRunning ? "success" : "secondary"} className="text-[10px]">
                {isRunning ? "Live Stream" : "Hardware Released"}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-muted-foreground">
                Biometric Gallery: <strong className="text-foreground">{gallery.length}</strong> students
              </span>
              <span className="text-muted-foreground">
                Current Session: <strong className="text-primary">{new Date().getHours() < 12 ? "AM Session" : "PM Session"}</strong>
              </span>
            </div>
          </div>

          <div className="relative bg-black flex items-center justify-center min-h-[360px] md:min-h-[440px] overflow-hidden">
            {/* Live Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full max-h-[500px] object-cover ${!isRunning ? "hidden" : "block"}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Standby Placeholder */}
            {!isRunning && (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-muted-foreground">
                  <ScanFace className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-white">Automated Attendance Ready</h3>
                <p className="text-xs text-white/60 max-w-sm mx-auto">
                  Click <strong className="text-emerald-400">START ATTENDANCE</strong> above to activate the hardware camera. No class or section selection required.
                </p>
              </div>
            )}

            {/* Live HUD Overlay when Running */}
            {isRunning && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Multi-Face Scanner Active</span>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-mono">
                  Recognized This Session: <strong className="text-emerald-400">{sessionNewPresentCount}</strong>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Live Attendance Table & Post-Recognition Filters (Module 15) */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Live Attendance Records</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {filteredRecords.length} Records
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Authoritative biometric marks automatically verified against student registry.
              </p>
            </div>

            {/* Post-Recognition Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, roll..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="all">All Classes</option>
                {distinctClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="all">All Sessions (AM/PM)</option>
                <option value="AM">AM Session</option>
                <option value="PM">PM Session</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="NEEDS_REVIEW">Needs Review</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Card className="border border-border/60 shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Grade & Section</th>
                    <th className="py-3 px-4 text-center">Roll No.</th>
                    <th className="py-3 px-4">Attendance Date</th>
                    <th className="py-3 px-4 text-center">Session</th>
                    <th className="py-3 px-4">Detected Time</th>
                    <th className="py-3 px-4 text-center">Biometric Proof</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tableLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                        Loading live attendance stream...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                        No attendance records found for today. Click 'START ATTENDANCE' to begin recognizing students.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground text-xs block">{r.student_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{r.admission_number}</span>
                        </td>

                        <td className="py-3 px-4 text-xs">
                          <span className="font-medium text-foreground">{r.class_name}</span>
                          <span className="text-muted-foreground ml-1">Sec {r.section_name}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-xs text-foreground">
                          {r.roll_number || "—"}
                        </td>

                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                          {r.attendance_date}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">
                            {r.session_type}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-xs font-mono text-foreground">
                          {new Date(r.detected_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProofRecord(r)
                              setIsProofModalOpen(true)
                            }}
                            className="h-7 text-xs text-primary hover:text-primary/90 flex items-center gap-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Proof
                          </Button>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={r.status === "PRESENT" ? "success" : "warning"}
                            className="text-[10px] font-bold uppercase"
                          >
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* MODAL: VIEW BIOMETRIC PROOF (MODULE 15) */}
        <Modal
          isOpen={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          title="Biometric Attendance Verification Proof"
        >
          {selectedProofRecord && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                <div className="w-36 h-36 rounded-xl border border-border overflow-hidden bg-black shrink-0 flex items-center justify-center">
                  {selectedProofRecord.proof_thumbnail_url ? (
                    <img
                      src={selectedProofRecord.proof_thumbnail_url}
                      alt="Captured Face Crop"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ScanFace className="w-12 h-12 text-muted-foreground/40" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div>
                    <span className="text-sm font-bold text-foreground block">
                      {selectedProofRecord.student_name}
                    </span>
                    <span className="font-mono text-primary font-semibold">
                      {selectedProofRecord.admission_number}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/60">
                    <div>
                      <span className="text-muted-foreground block">Grade & Section:</span>
                      <span className="font-medium text-foreground">
                        {selectedProofRecord.class_name} - {selectedProofRecord.section_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Roll Number:</span>
                      <span className="font-mono font-medium text-foreground">
                        {selectedProofRecord.roll_number || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Match Confidence:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedProofRecord.confidence}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Session Timestamp:</span>
                      <span className="font-mono text-foreground">
                        {new Date(selectedProofRecord.detected_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>
                  Cryptographic verification snapshot preserved for institutional compliance and anti-fraud auditing.
                </span>
              </div>

              {/* Modal Footer - Strictly clean buttons without keybinding badges */}
              <div className="flex items-center justify-end pt-3 border-t border-border">
                <Button variant="outline" onClick={() => setIsProofModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: SESSION SUMMARY (MODULE 13) */}
        <Modal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          title="Attendance Session Summary"
        >
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">Attendance Loop Concluded</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hardware camera stream released. Attendance records synced to database.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Faces Scanned</span>
                <span className="text-xl font-bold font-mono text-foreground">{sessionDetectedCount}</span>
              </div>
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 block">Marked Present</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{sessionNewPresentCount}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setShowSummaryModal(false)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  )
}
