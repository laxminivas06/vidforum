"use client"

import React, { Suspense, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { Badge, Button, ConfirmDialog, ErrorState, LoadingSkeleton, ProgressBar } from "@/components/ui"
import { TutorMarkdown } from "@/components/tutor/TutorMarkdown"
import { QuizQuestion, useSubmitQuiz, useTutorQuiz } from "@/lib/api/tutor"
import { ArrowLeft, BookOpenCheck, CheckCircle2, GraduationCap, XCircle } from "lucide-react"

function QuizView() {
  const { id } = useParams<{ id: string }>()
  const params = useSearchParams()
  const router = useRouter()
  const classId = params.get("classId") || undefined
  const quiz = useTutorQuiz(id, classId)
  const submit = useSubmitQuiz(id, classId)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)

  const chatHref = (extra = "") => `/ai-tutor/chat?${classId ? `classId=${classId}&` : ""}${extra}`

  if (quiz.isLoading) return <LoadingSkeleton variant="form" />
  if (quiz.isError || !quiz.data) return <ErrorState message={(quiz.error as Error)?.message ?? "Test not found"} onRetry={() => quiz.refetch()} />
  const q = quiz.data
  const graded = q.status === "graded"
  const answered = q.questions.filter((x) => (answers[x.qNo] ?? "").trim() !== "").length
  const pct = graded && q.maxScore ? Math.round(((q.score ?? 0) / q.maxScore) * 100) : 0

  const doSubmit = () => {
    setConfirming(false)
    submit.mutate(answers, { onSuccess: () => window.scrollTo({ top: 0, behavior: "smooth" }) })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="dense" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => router.push(chatHref(q.chapterId ? `chapter=${q.chapterId}` : ""))}>
        Back to tutor
      </Button>

      <div className="rounded-2xl border border-border-default bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info" size="sm">{q.subjectName}</Badge>
          <Badge variant="neutral" size="sm">{q.type.toUpperCase()} · {q.difficulty}</Badge>
          <Badge variant={graded ? "positive" : "warning"} size="sm">{graded ? "Evaluated" : "In progress"}</Badge>
        </div>
        <h2 className="mt-2 text-lg font-bold text-text-primary">{q.chapterTitle}</h2>
        {graded ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-text-primary">{q.score}<span className="text-lg text-text-muted">/{q.maxScore}</span></p>
              <p className="pb-1 text-sm font-semibold text-text-secondary">{pct}% · {pct >= 80 ? "Excellent work! 🌟" : pct >= 60 ? "Good effort — a little more practice!" : "Let's strengthen these topics together 💪"}</p>
            </div>
            {!!q.summary?.topics.length && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Topic-wise result</p>
                {q.summary.topics.map((t) => (
                  <ProgressBar key={t.topicId} label={t.title} valueLabel={`${t.scored}/${t.max}`} value={Math.round(t.pct * 100)} variant={t.pct >= 0.8 ? "green" : t.pct >= 0.6 ? "warning" : "error"} />
                ))}
              </div>
            )}
            {!!q.summary?.nextSteps.length && (
              <div className="rounded-xl border border-border-default bg-canvas p-3">
                <p className="text-xs font-bold text-text-primary">Topics to revise</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.summary.nextSteps.map((s) => (
                    <Button key={s.topicId} size="dense" variant="primary" leadingIcon={<GraduationCap className="h-3.5 w-3.5" />}
                      onClick={() => router.push(chatHref(`chapter=${s.chapterId}&learn=${encodeURIComponent(s.title)}`))}>
                      Learn “{s.title}” again
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-text-secondary">{q.questions.length} questions · {q.maxScore} marks · answered {answered}/{q.questions.length}</p>
        )}
      </div>

      {q.questions.map((x) => (
        <QuestionCard key={x.qNo} q={x} graded={graded} value={answers[x.qNo] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [x.qNo]: v }))} />
      ))}

      {!graded && (
        <div className="flex items-center justify-end gap-3 pb-8">
          {submit.isError && <p className="text-xs text-rose-600">{(submit.error as Error).message}</p>}
          <Button variant="primary" isLoading={submit.isPending} leadingIcon={<BookOpenCheck className="h-4 w-4" />}
            onClick={() => (answered < q.questions.length ? setConfirming(true) : doSubmit())}>
            {submit.isPending ? "Evaluating your answers…" : "Submit test"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={doSubmit}
        title="Submit with unanswered questions?"
        description={`You answered ${answered} of ${q.questions.length} questions. Unanswered questions get 0 marks.`}
        confirmText="Submit anyway"
        cancelText="Keep answering"
      />
    </div>
  )
}

const plain = (t: string) => String(t ?? "").replace(/\*\*|__/g, "")

function QuestionCard({ q, graded, value, onChange }: { q: QuizQuestion; graded: boolean; value: string; onChange: (v: string) => void }) {
  const fb = q.feedback ?? {}
  const full = graded && (q.awarded ?? 0) >= q.marks
  return (
    <div className="rounded-2xl border border-border-default bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Q{q.qNo} · {q.type === "mcq" ? "Multiple choice" : q.type === "short" ? "Short answer" : "Long answer"}{q.topicTitle ? ` · ${q.topicTitle}` : ""}</p>
          <div className="mt-1 font-semibold"><TutorMarkdown content={q.question} /></div>
        </div>
        <Badge variant={!graded ? "neutral" : full ? "positive" : (q.awarded ?? 0) > 0 ? "warning" : "error"} size="sm">
          {graded ? `${q.awarded}/${q.marks}` : `${q.marks} mark${q.marks > 1 ? "s" : ""}`}
        </Badge>
      </div>

      {q.type === "mcq" && q.options ? (
        <div className="mt-3 space-y-2">
          {q.options.map((opt, i) => {
            const picked = graded ? fb.picked === i : value === String(i)
            const correct = graded && fb.correctIndex === i
            return (
              <label key={i} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-xs ${correct ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : picked && graded ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30" : picked ? "border-purple-400 bg-purple-50 dark:bg-purple-950/30" : "border-border-default hover:border-purple-300"}`}>
                <input type="radio" name={`q${q.qNo}`} className="mt-0.5" disabled={graded} checked={picked} onChange={() => onChange(String(i))} />
                <span className="flex-1"><TutorMarkdown content={opt} /></span>
                {correct && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {picked && graded && !correct && <XCircle className="h-4 w-4 text-rose-600" />}
              </label>
            )
          })}
        </div>
      ) : graded ? (
        <div className="mt-3 rounded-xl bg-canvas p-3 text-xs text-text-secondary">
          <p className="text-[10px] font-semibold uppercase text-text-muted">Your answer</p>
          <p className="mt-1 whitespace-pre-line">{q.studentAnswer || "—"}</p>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={q.type === "long" ? 7 : 3}
          maxLength={4000}
          placeholder="Write your answer…"
          className="mt-3 w-full rounded-xl border border-border-default bg-canvas p-3 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
        />
      )}

      {graded && (
        <div className="mt-3 space-y-2 border-t border-border-default pt-3 text-xs">
          {q.type === "mcq" ? (
            q.explanation && <p className="text-text-secondary"><span className="font-semibold text-text-primary">Why: </span>{q.explanation}</p>
          ) : (
            <>
              {fb.what_was_right && <p className="text-emerald-700 dark:text-emerald-400"><span className="font-semibold">What you got right: </span>{plain(fb.what_was_right)}</p>}
              {fb.what_was_missing && <p className="text-amber-700 dark:text-amber-400"><span className="font-semibold">What was missing: </span>{plain(fb.what_was_missing)}</p>}
              {fb.misconception && <p className="text-rose-700 dark:text-rose-400"><span className="font-semibold">Watch out: </span>{plain(fb.misconception)}</p>}
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-[10px] font-semibold uppercase text-text-muted">Model answer</p>
                <TutorMarkdown content={fb.model_answer || q.answerKey || ""} />
              </div>
            </>
          )}
          {!!q.pages?.length && <p className="text-[11px] text-text-muted">Revise: {q.pages.join(", ")}</p>}
        </div>
      )}
    </div>
  )
}

export default function QuizPage() {
  return (
    <AppShell pageTitle="Practice Test" breadcrumbs={[{ label: "AI Tutor", href: "/ai-tutor/chat" }, { label: "Practice Test" }]}>
      <Suspense fallback={<LoadingSkeleton variant="form" />}>
        <QuizView />
      </Suspense>
    </AppShell>
  )
}
