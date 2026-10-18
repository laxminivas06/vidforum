"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select, Input, ConfirmDialog } from "@/components/ui"
import {
  useFaceSections,
  useFaceGalleryAdmin,
  useEnrollFaces,
  useDeleteFaceEnrollment,
  useRegisterTerminal,
  fetchFaceGallery,
} from "@/lib/api/hooks"
import { Camera, FileUp, ScanFace, Trash2, CheckCircle2, AlertTriangle, Router, Download } from "lucide-react"
import { ACCEPT_SCORE, MODEL_VERSION, cropFace, detectFaces, getEngine, similarity } from "@/lib/face/engine"
import { readStudentDocument, resolveStudent, findSection, downloadSampleDocx, DocRow, DocIssue, RosterStudent } from "@/lib/face/doc-enroll"
import { registerFaceServiceWorker } from "@/lib/face/sync"
import { useCamera, grabFrame } from "@/lib/face/useCamera"

const ISSUE_LABEL: Record<DocIssue | "duplicate" | "assigned_twice", string> = {
  ok: "Ready",
  name_mismatch: "Name does not match the roll number's student",
  roll_not_found: "Roll number not found in that section",
  section_not_found: "Class / section not found",
  student_not_found: "No student with this name in that section",
  no_label: "No student details found – choose student",
  no_face: "No face found in the photo",
  multiple_faces: "More than one face in the photo",
  low_quality: "Photo quality too low",
  duplicate: "Looks like another enrolled student",
  assigned_twice: "Same student appears twice",
}

type DocItem = DocRow & { studentId: string | null; flags: string[]; include: boolean }

const BATCH = 25

export default function FaceEnrollmentPage() {
  const { data: sections = [] } = useFaceSections()
  const [sectionId, setSectionId] = useState("")
  const { data: roster = [], isLoading: rosterLoading } = useFaceGalleryAdmin(sectionId || undefined)
  const enroll = useEnrollFaces()
  const remove = useDeleteFaceEnrollment()
  const camera = useCamera()
  const queryClient = useQueryClient()

  const [message, setMessage] = useState<{ tone: "positive" | "error" | "warning" | "info"; text: string } | null>(null)
  const [capturing, setCapturing] = useState<string | null>(null) // studentId being captured
  const [busy, setBusy] = useState(false)
  const [docFaces, setDocFaces] = useState<DocItem[]>([])
  const [docRosters, setDocRosters] = useState<Map<string, RosterStudent[]>>(new Map())
  const [docProgress, setDocProgress] = useState<string | null>(null)
  const [removeId, setRemoveId] = useState<string | null>(null)

  useEffect(() => {
    registerFaceServiceWorker()
    getEngine().catch((err) => setMessage({ tone: "error", text: `Face engine failed to load: ${err.message}` }))
  }, [])

  const enrolledCount = roster.filter((s) => s.templates.length > 0).length
  const studentLabel = (id: string | null) => {
    const s = roster.find((r) => r.id === id)
    return s ? `${s.rollNumber ? `${s.rollNumber}. ` : ""}${s.name}` : "—"
  }

  /** Returns the other student this face already matches, if any (zero-duplicate policy). */
  const findDuplicate = async (embedding: number[], studentId: string, pool: RosterStudent[] = roster) => {
    for (const other of pool) {
      if (other.id === studentId) continue
      for (const t of other.templates) {
        if ((await similarity(embedding, t)) >= ACCEPT_SCORE) return other
      }
    }
    return null
  }

  // ---------- Single photo via camera ----------
  const openCapture = async (studentId: string) => {
    setMessage(null)
    setCapturing(studentId)
    await camera.start(camera.cameraId || undefined)
  }

  const capture = async () => {
    const video = camera.videoRef.current
    if (!video || !capturing) return
    setBusy(true)
    try {
      const frame = grabFrame(video)
      const faces = await detectFaces(frame, { liveCheck: true })
      if (faces.length !== 1) throw new Error(faces.length === 0 ? "No face found. Face the camera in good light." : "More than one face in view. Only the student should be in the frame.")
      const [face] = faces
      if (face.spoof) throw new Error("This looks like a photo or a screen. The student must be in front of the camera.")
      if (!face.frontal) throw new Error("Please look straight at the camera.")
      if (face.quality < 0.6) throw new Error("Photo is not clear enough. Hold still in good light and try again.")
      const dup = await findDuplicate(face.embedding, capturing)
      if (dup) throw new Error(`This face already matches ${dup.name}. Check that the right student is selected.`)

      await enroll.mutateAsync({
        modelVersion: MODEL_VERSION,
        items: [{ studentId: capturing, embedding: face.embedding, quality: face.quality, photo: cropFace(frame, face.box, 256) }],
      })
      setMessage({ tone: "positive", text: `${studentLabel(capturing)} enrolled.` })
      camera.stop()
      setCapturing(null)
    } catch (err: any) {
      setMessage({ tone: "error", text: err.message })
    } finally {
      setBusy(false)
    }
  }

  // ---------- Bulk: one document (.docx / .pdf): Photo | Student Name | Roll No | Class | Section ----------
  const sectionLabel = (id: string) => {
    const sec = sections.find((x) => x.id === id)
    return sec ? `${sec.className} – ${sec.sectionName}` : ""
  }
  const docStudents = useMemo(() => Array.from(docRosters.values()).flat(), [docRosters])
  const docStudentSection = useMemo(() => {
    const m = new Map<string, string>()
    docRosters.forEach((list, secId) => list.forEach((st) => m.set(st.id, secId)))
    return m
  }, [docRosters])

  const flagFaces = async (items: DocItem[], pool: RosterStudent[]) => {
    const counts = new Map<string, number>()
    items.forEach((f) => f.studentId && counts.set(f.studentId, (counts.get(f.studentId) || 0) + 1))
    return Promise.all(
      items.map(async (f) => {
        const flags: string[] = []
        if (f.issue !== "ok") flags.push(f.issue)
        if (f.studentId && (counts.get(f.studentId) || 0) > 1) flags.push("assigned_twice")
        if (f.studentId && f.face) {
          // Same face already enrolled for someone else, or used for a different student elsewhere in this document
          const inDoc = await Promise.all(
            items.map(async (o) => o !== f && !!o.face && !!o.studentId && o.studentId !== f.studentId && (await similarity(f.face!.embedding, o.face.embedding)) >= ACCEPT_SCORE)
          )
          if (inDoc.some(Boolean) || (await findDuplicate(f.face.embedding, f.studentId, pool))) flags.push("duplicate")
        }
        const usable = !!f.face && !!f.studentId && !["no_face", "multiple_faces", "low_quality"].includes(f.issue)
        return { ...f, flags, include: usable && flags.length === 0 }
      })
    )
  }

  const downloadSample = async () => {
    const sec = sections.find((x) => x.id === sectionId)
    const rows =
      sec && roster.length > 0
        ? roster.map((st) => ({ name: st.name, roll: st.rollNumber || "", className: sec.className, sectionName: sec.sectionName }))
        : [{ name: "Full name as in school records", roll: "Roll no. as in records", className: sections[0]?.className || "Grade 1", sectionName: sections[0]?.sectionName || "Section A" }]
    const file = sec ? `face-enrollment-${sec.className}-${sec.sectionName}.docx`.replace(/\s+/g, "-").toLowerCase() : "face-enrollment-sample.docx"
    await downloadSampleDocx(rows, file)
  }

  const onDocument = async (file?: File) => {
    if (!file) return
    setMessage(null)
    setBusy(true)
    try {
      const rows = await readStudentDocument(file, setDocProgress)
      if (rows.length === 0) throw new Error("No student rows found in this document.")

      // Load the roster of every section the document mentions (plus the selected one, for free-form PDFs)
      const ids = new Set<string>(sectionId ? [sectionId] : [])
      rows.forEach((r) => {
        const sec = findSection(r.fields, sections)
        if (sec) ids.add(sec.id)
      })
      const rosters = new Map<string, RosterStudent[]>()
      for (const id of Array.from(ids)) {
        rosters.set(id, await queryClient.fetchQuery({ queryKey: ["face-gallery", id], queryFn: () => fetchFaceGallery(id) }))
      }

      const items: DocItem[] = rows.map((r) => {
        const match = resolveStudent(r, sections, rosters, sectionId || undefined)
        return { ...r, studentId: match.studentId, issue: r.issue !== "ok" ? r.issue : match.issue, flags: [], include: false }
      })
      setDocRosters(rosters)
      setDocFaces(await flagFaces(items, Array.from(rosters.values()).flat()))
    } catch (err: any) {
      setMessage({ tone: "error", text: err.message })
    } finally {
      setDocProgress(null)
      setBusy(false)
    }
  }

  const reassign = async (key: string, studentId: string) => {
    const updated = docFaces.map((f) =>
      f.key === key ? { ...f, studentId, issue: ["no_face", "multiple_faces", "low_quality"].includes(f.issue) ? f.issue : ("ok" as const) } : f
    )
    setDocFaces(await flagFaces(updated, docStudents))
  }

  const saveDocument = async () => {
    const chosen = docFaces.filter((f) => f.include && f.studentId && f.face)
    setBusy(true)
    try {
      for (let i = 0; i < chosen.length; i += BATCH) {
        await enroll.mutateAsync({
          modelVersion: MODEL_VERSION,
          items: chosen.slice(i, i + BATCH).map((f) => ({
            studentId: f.studentId!,
            embedding: f.face!.embedding,
            quality: f.face!.quality,
            photo: f.photo,
          })),
        })
      }
      setMessage({ tone: "positive", text: `${chosen.length} student(s) enrolled from the document.` })
      setDocFaces([])
    } catch (err: any) {
      setMessage({ tone: "error", text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const rosterOptions = useMemo(
    () =>
      docStudents.map((st) => ({
        value: st.id,
        label: `${st.rollNumber ? `${st.rollNumber}. ` : ""}${st.name}`,
        sublabel: `${sectionLabel(docStudentSection.get(st.id) || "")} · ${st.admissionNumber}`,
      })),
    [docStudents, docStudentSection, sections]
  )

  return (
    <AppShell
      pageTitle="Face Enrollment"
      breadcrumbs={[{ label: "Core" }, { label: "Attendance", href: "/attendance/sessions" }, { label: "Face Enrollment" }]}
      rightHeaderAction={
        <Link href="/attendance/face">
          <Button size="dense" variant="secondary" leftIcon={<ScanFace className="w-3.5 h-3.5" />}>
            Take Face Attendance
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {message && (
          <Badge variant={message.tone} className="w-full justify-start py-2 px-3 text-sm whitespace-normal">
            {message.text}
          </Badge>
        )}

        <Card>
          <CardContent className="pt-6 grid gap-4 md:grid-cols-[1fr_auto] items-end">
            <div>
              <label className="text-xs font-medium text-text-secondary">Section</label>
              <Select
                value={sectionId}
                onChange={(v) => {
                  setSectionId(v)
                  setDocFaces([])
                }}
                placeholder="Choose section"
                options={sections.map((s) => ({
                  value: s.id,
                  label: `${s.className} – ${s.sectionName}`,
                  sublabel: `${s.enrolledCount}/${s.studentCount} enrolled`,
                }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={downloadSample}>
                Download sample (.docx)
              </Button>
              <label
                className={`inline-flex items-center gap-2 rounded-full border border-border-default px-4 py-2 text-sm cursor-pointer hover:bg-subtle ${busy ? "opacity-50 pointer-events-none" : ""}`}
              >
                <FileUp className="w-4 h-4" /> Bulk upload (Word / PDF)
                <input
                  type="file"
                  accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    onDocument(e.target.files?.[0] || undefined)
                    e.target.value = ""
                  }}
                />
              </label>
            </div>
            <p className="md:col-span-2 text-xs text-text-muted">
              Bulk upload: one Word or PDF document with a table of <b>Photo | Student Name | Roll No | Class | Section</b>, one row per
              student (several sections allowed). Download the sample to get the format; choosing a section first pre-fills it with that
              section&apos;s students.
            </p>
          </CardContent>
        </Card>

        {docProgress && <Badge variant="info">{docProgress}</Badge>}

        {docFaces.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle>Check document results ({docFaces.filter((f) => f.include && f.studentId && f.face).length} ready)</CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setDocFaces([])}>
                  Cancel
                </Button>
                <Button onClick={saveDocument} isLoading={busy} disabled={!docFaces.some((f) => f.include && f.studentId && f.face)}>
                  Save enrollments
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border-default">
                {docFaces.map((f) => (
                  <li key={f.key} className="py-2 flex items-center gap-3 flex-wrap">
                    <input
                      type="checkbox"
                      checked={f.include}
                      disabled={!f.face}
                      onChange={(e) => setDocFaces((all) => all.map((x) => (x.key === f.key ? { ...x, include: e.target.checked } : x)))}
                      aria-label="Include this face"
                    />
                    {f.thumb ? (
                      <img src={f.thumb} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-subtle flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-xs text-text-muted truncate">
                        {f.where} ·{" "}
                        {[f.fields.name, f.fields.roll && `Roll ${f.fields.roll}`, [f.fields.className, f.fields.sectionName].filter(Boolean).join(" – ")]
                          .filter(Boolean)
                          .join(" · ") || `“${f.text || "no text"}”`}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {f.flags.length === 0 ? (
                          <Badge variant="positive" size="sm">
                            {ISSUE_LABEL.ok}
                          </Badge>
                        ) : (
                          f.flags.map((flag) => (
                            <Badge key={flag} variant="warning" size="sm">
                              {ISSUE_LABEL[flag as keyof typeof ISSUE_LABEL]}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="w-64">
                      <Select value={f.studentId || ""} onChange={(v) => reassign(f.key, v)} placeholder="Choose student" options={rosterOptions} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {capturing && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle>Capture: {studentLabel(capturing)}</CardTitle>
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
              <div className="bg-black rounded-lg overflow-hidden aspect-video max-w-xl">
                <video ref={camera.videoRef} className="w-full h-full object-contain" playsInline muted />
              </div>
              {camera.error && <Badge variant="error">{camera.error}</Badge>}
              <p className="text-xs text-text-muted">One clear photo: face the camera, good light, no cap or mask.</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    camera.stop()
                    setCapturing(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={capture} isLoading={busy} disabled={!camera.active} leftIcon={<Camera className="w-4 h-4" />}>
                  Capture & save
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sectionId && (
          <Card>
            <CardHeader>
              <CardTitle>
                Students · {enrolledCount}/{roster.length} enrolled
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rosterLoading ? (
                <p className="text-sm text-text-muted">Loading students...</p>
              ) : (
                <ul className="divide-y divide-border-default">
                  {roster.map((s) => {
                    const enrolled = s.templates.length > 0
                    return (
                      <li key={s.id} className="py-2 flex items-center gap-3">
                        {enrolled ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        <span className="flex-1 text-sm truncate">
                          {s.rollNumber ? `${s.rollNumber}. ` : ""}
                          {s.name} <span className="text-xs text-text-muted">· {s.admissionNumber}</span>
                        </span>
                        <Button size="dense" variant="secondary" leftIcon={<Camera className="w-3.5 h-3.5" />} onClick={() => openCapture(s.id)}>
                          {enrolled ? "Re-capture" : "Capture"}
                        </Button>
                        {enrolled && (
                          <Button size="dense" variant="ghost" aria-label="Remove face data" onClick={() => setRemoveId(s.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <TerminalRegistration />
      </div>

      <ConfirmDialog
        isOpen={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={async () => {
          if (removeId) await remove.mutateAsync(removeId)
          setRemoveId(null)
        }}
        title="Remove face data?"
        description={`The stored face template and photo for ${studentLabel(removeId)} will be deleted. They will need to be enrolled again to use face attendance.`}
        confirmLabel="Remove"
        isDestructive
        isLoading={remove.isPending}
      />
    </AppShell>
  )
}

/** Dedicated biometric terminals (ZKTeco / Hikvision / eSSL bridges) push detections with a per-device key. */
function TerminalRegistration() {
  const register = useRegisterTerminal()
  const [code, setCode] = useState("")
  const [result, setResult] = useState<{ deviceCode: string; apiKey: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Router className="w-4 h-4" /> Attendance terminals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-text-muted">
          For dedicated face-recognition devices. Register the device, then configure it (or its bridge) to POST detections to
          <code className="mx-1">/api/v1/attendance/face/device-events</code> with header <code>x-device-key</code>. Students are matched by
          admission number.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Device code, e.g. GATE-1" className="max-w-xs" />
          <Button
            isLoading={register.isPending}
            disabled={!code.trim()}
            onClick={async () => {
              setError(null)
              try {
                setResult(await register.mutateAsync({ deviceCode: code.trim() }))
                setCode("")
              } catch (err: any) {
                setError(err.message)
              }
            }}
          >
            Register terminal
          </Button>
        </div>
        {error && <Badge variant="error">{error}</Badge>}
        {result && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-medium">Key for {result.deviceCode} — copy it now, it will not be shown again:</p>
            <code className="break-all select-all">{result.apiKey}</code>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
