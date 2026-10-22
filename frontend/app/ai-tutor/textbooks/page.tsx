"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { Badge, Button, ConfirmDialog, EmptyState, FormField, Input, LoadingSkeleton, ProgressBar, Select, SlideOver } from "@/components/ui"
import {
  StaffChapter, StaffTextbook, useDeleteTutorTextbook, usePublishTextbook, useReprocessTextbook, useSaveChapters,
  useStaffTextbook, useStaffTextbooks, useTutorStaffOptions, useUploadTextbook,
} from "@/lib/api/tutor"
import { BookUp, Eye, FileText, RotateCcw, Trash2 } from "lucide-react"

const STATUS: Record<StaffTextbook["status"], { label: string; variant: "neutral" | "positive" | "warning" | "error" | "info" }> = {
  uploaded: { label: "Uploaded", variant: "neutral" },
  processing: { label: "Processing", variant: "info" },
  review: { label: "Ready for review", variant: "warning" },
  published: { label: "Published", variant: "positive" },
  failed: { label: "Failed", variant: "error" },
}

export default function TutorTextbooksPage() {
  const router = useRouter()
  const options = useTutorStaffOptions()
  const books = useStaffTextbooks()
  const upload = useUploadTextbook()
  const reprocess = useReprocessTextbook()
  const remove = useDeleteTutorTextbook()

  const [classId, setClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<StaffTextbook | null>(null)

  const cls = options.data?.find((c) => c.id === classId)
  const canUpload = classId && subjectId && title.trim() && file && !upload.isPending

  const doUpload = () => {
    if (!canUpload) return
    upload.mutate({ classId, subjectId, title: title.trim(), file: file! }, {
      onSuccess: () => {
        setTitle("")
        setFile(null)
        if (fileRef.current) fileRef.current.value = ""
      },
    })
  }

  return (
    <AppShell pageTitle="Tutor Textbooks" breadcrumbs={[{ label: "AI Yantra" }, { label: "Tutor Textbooks" }]}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-text-secondary">The AI Tutor answers only from textbooks published here, per class and subject.</p>
          {books.data && !books.data.aiReady && <Badge variant="error" size="sm">AI key missing on server</Badge>}
          {books.data && !books.data.storageReady && <Badge variant="warning" size="sm">File storage not configured — page images won&apos;t be shown</Badge>}
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-border-default bg-surface p-4">
          <p className="text-sm font-bold text-text-primary">Upload a textbook PDF</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_1.2fr_auto] md:items-end">
            <FormField label="Class" required>
              <Select value={classId} onChange={(v) => { setClassId(v); setSubjectId("") }} placeholder="Select class"
                options={(options.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
            </FormField>
            <FormField label="Subject" required>
              <Select value={subjectId} onChange={setSubjectId} placeholder={classId ? "Select subject" : "Pick a class first"} disabled={!classId}
                options={(cls?.subjects ?? []).map((s) => ({ value: s.id, label: s.name }))} />
            </FormField>
            <FormField label="Title" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NCERT Science Class 10" maxLength={200} />
            </FormField>
            <FormField label="PDF file" required helperText="Digital or scanned, up to 80 MB">
              <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-text-secondary file:mr-2 file:rounded-lg file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-xs file:font-semibold" />
            </FormField>
            <Button variant="primary" leadingIcon={<BookUp className="h-4 w-4" />} isLoading={upload.isPending} disabled={!canUpload} onClick={doUpload}>
              Upload
            </Button>
          </div>
          {upload.isError && <p className="mt-2 text-xs text-rose-600">{(upload.error as Error).message}</p>}
          {upload.isSuccess && <p className="mt-2 text-xs text-emerald-700">Uploaded. Processing has started — you can review chapters once it finishes.</p>}
        </div>

        {/* List */}
        {books.isLoading ? (
          <LoadingSkeleton variant="table" />
        ) : !books.data?.textbooks.length ? (
          <EmptyState icon={<FileText className="h-6 w-6" />} title="No textbooks yet" description="Upload the first textbook PDF above to power the AI Tutor for that class." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
            {books.data.textbooks.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 border-b border-border-default p-4 last:border-b-0">
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-semibold text-text-primary">{b.title}</p>
                  <p className="text-[11px] text-text-secondary">{b.class_name} · {b.subject_name}{b.page_count ? ` · ${b.page_count} pages` : ""}{b.chapter_count ? ` · ${b.chapter_count} chapters` : ""}</p>
                  {b.status === "failed" && b.error && <p className="mt-1 text-[11px] text-rose-600">{b.error}</p>}
                </div>
                <div className="w-48">
                  {b.status === "processing" ? (
                    <ProgressBar value={b.page_count ? Math.round((b.processed_pages / b.page_count) * 100) : 0} label="Processing"
                      valueLabel={b.page_count ? `${b.processed_pages}/${b.page_count} pages` : "starting…"} />
                  ) : (
                    <Badge variant={STATUS[b.status].variant} size="sm" showDot>{STATUS[b.status].label}</Badge>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {["review", "published"].includes(b.status) && (
                    <Button size="dense" variant={b.status === "review" ? "primary" : "secondary"} onClick={() => setReviewId(b.id)}>
                      {b.status === "review" ? "Review & publish" : "Chapters"}
                    </Button>
                  )}
                  {b.status === "published" && (
                    <Button size="dense" variant="ghost" leadingIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => router.push(`/ai-tutor/chat?classId=${b.class_id}`)}>
                      Preview
                    </Button>
                  )}
                  {["failed", "review"].includes(b.status) && (
                    <Button size="dense" variant="ghost" leadingIcon={<RotateCcw className="h-3.5 w-3.5" />} isLoading={reprocess.isPending && reprocess.variables === b.id} onClick={() => reprocess.mutate(b.id)}>
                      Reprocess
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" aria-label="Delete textbook" onClick={() => setDeleting(b)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReviewPanel id={reviewId} onClose={() => setReviewId(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        title="Delete this textbook?"
        description={`"${deleting?.title}" will be removed from the AI Tutor for ${deleting?.class_name}. Students' past chats stay, but new questions can't use it.`}
        confirmText="Delete"
        isDestructive
        isLoading={remove.isPending}
      />
    </AppShell>
  )
}

function ReviewPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const detail = useStaffTextbook(id)
  const save = useSaveChapters()
  const publish = usePublishTextbook()
  const [draft, setDraft] = useState<StaffChapter[]>([])
  useEffect(() => {
    if (detail.data) setDraft(detail.data.chapters)
  }, [detail.data])

  const changes = () => draft.map((c) => ({ id: c.id, title: c.title, inSyllabus: c.in_syllabus }))
  const isReview = detail.data?.status === "review"
  const err = (save.error || publish.error) as Error | null

  const onSave = () => id && save.mutate({ id, chapters: changes() })
  const onPublish = () =>
    id && save.mutate({ id, chapters: changes() }, { onSuccess: () => publish.mutate(id, { onSuccess: onClose }) })

  return (
    <SlideOver
      open={!!id}
      onClose={onClose}
      title={detail.data?.title ?? "Textbook"}
      subtitle="Untick chapters that are not in this year's syllabus — the tutor will never answer from them."
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="secondary" size="dense" onClick={onClose}>Cancel</Button>
          <Button variant={isReview ? "secondary" : "primary"} size="dense" isLoading={save.isPending && !publish.isPending} onClick={onSave}>Save</Button>
          {isReview && (
            <Button variant="primary" size="dense" isLoading={publish.isPending} disabled={!draft.some((c) => c.in_syllabus)} onClick={onPublish}>
              Publish to students
            </Button>
          )}
        </div>
      }
    >
      {detail.isLoading ? (
        <LoadingSkeleton variant="form" />
      ) : (
        <div className="space-y-3">
          {err && <p className="text-xs text-rose-600">{err.message}</p>}
          {draft.map((c, i) => (
            <div key={c.id} className={`rounded-xl border p-3 ${c.in_syllabus ? "border-border-default" : "border-dashed border-border-default opacity-60"}`}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={c.in_syllabus} aria-label="In syllabus"
                  onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, in_syllabus: e.target.checked } : x)))} />
                <span className="text-[11px] font-semibold text-text-muted">Ch {c.chapter_no}</span>
                <Input value={c.title} onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className="h-8 text-xs" />
              </div>
              <p className="mt-1 pl-6 text-[11px] text-text-muted">Pages {c.start_page}–{c.end_page} · {c.chunk_count} passages indexed</p>
              {!!c.topics.length && (
                <div className="mt-2 flex flex-wrap gap-1 pl-6">
                  {c.topics.map((t) => <Badge key={t.id} variant="neutral" size="sm">{t.title}</Badge>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SlideOver>
  )
}
