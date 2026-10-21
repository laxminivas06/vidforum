"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AppShell } from "@/components/layout/AppShell"
import { Badge, Button, EmptyState, ErrorState, LoadingSkeleton, Modal, Select } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { TutorMarkdown } from "@/components/tutor/TutorMarkdown"
import {
  askTutor, createTutorSession, fetchPageImage, TutorChapter, TutorCitation, TutorFigure, TutorMessage,
  useCreateQuiz, useTutorMessages, useTutorQuizzes, useTutorSessions, useTutorStaffOptions, useTutorSyllabus,
} from "@/lib/api/tutor"
import { Bot, BookOpen, ClipboardCheck, ImageIcon, Lightbulb, MessageSquarePlus, RefreshCw, Send, Sparkles, User, Wand2 } from "lucide-react"

const STAGE_LABEL: Record<string, string> = {
  searching: "Looking through your textbook…",
  checking: "Checking your syllabus…",
  answering: "Writing your explanation…",
}

function masteryDot(m: number | null) {
  if (m === null) return "bg-border-default"
  if (m >= 0.8) return "bg-emerald-500"
  if (m >= 0.6) return "bg-amber-400"
  return "bg-rose-500"
}

function TutorChat() {
  const { role } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const qc = useQueryClient()
  const isStudent = role === "STUDENT"

  // Staff preview a class; students always get their own class from the server
  const staffOptions = useTutorStaffOptions(!isStudent)
  const [previewClassId, setPreviewClassId] = useState<string | undefined>(params.get("classId") || undefined)
  useEffect(() => {
    if (!isStudent && !previewClassId && staffOptions.data?.length) {
      setPreviewClassId((staffOptions.data.find((c) => c.publishedBooks > 0) ?? staffOptions.data[0]).id)
    }
  }, [isStudent, previewClassId, staffOptions.data])
  const classId = isStudent ? undefined : previewClassId
  const ready = isStudent || !!previewClassId

  const syllabus = useTutorSyllabus(classId, ready)
  const sessions = useTutorSessions(classId, ready)
  const quizzes = useTutorQuizzes(classId, ready)

  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [chapterId, setChapterId] = useState<string | null>(params.get("chapter"))
  const [sessionId, setSessionId] = useState<string | null>(params.get("session"))
  const messages = useTutorMessages(sessionId, classId)

  const [input, setInput] = useState("")
  const [streamText, setStreamText] = useState("")
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ bookId: string; page: number; caption?: string } | null>(null)
  const [testDialog, setTestDialog] = useState<{ chapterId: string | null; topicIds: string[] } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const learnHandled = useRef(false)

  const subjects = syllabus.data?.subjects ?? []
  const allChapters = useMemo(
    () => subjects.flatMap((s) => s.books.flatMap((b) => b.chapters.map((c) => ({ ...c, subjectId: s.id, subjectName: s.name })))),
    [subjects],
  )
  const visibleChapters = subjectId ? allChapters.filter((c) => c.subjectId === subjectId) : allChapters
  const chapterById = (id: string | null) => allChapters.find((c) => c.id === id)

  const list: TutorMessage[] = messages.data ?? []
  const busy = !!pendingQuestion

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [list.length, streamText, pendingQuestion])

  const send = async (text: string, mode: "explain" | "simplify" | "example" = "explain", forceNew = false) => {
    const message = text.trim()
    if (!message || busy) return
    setError(null)
    let sid = forceNew ? null : sessionId
    try {
      if (!sid) {
        const ch = chapterById(chapterId)
        const s = await createTutorSession({ subjectId: ch?.subjectId ?? subjectId, chapterId, title: message.slice(0, 70) }, classId)
        sid = s.id
        qc.setQueryData(["tutor-messages", sid], [])
        setSessionId(sid)
        qc.invalidateQueries({ queryKey: ["tutor-sessions"] })
      }
    } catch (e: any) {
      setError(e.message)
      return
    }
    const studentMsg: TutorMessage = {
      id: `local-${Date.now()}`, sender: "student", content: message, citations: [], figures: [], scope_verdict: null, action: null, created_at: new Date().toISOString(),
    }
    qc.setQueryData<TutorMessage[]>(["tutor-messages", sid], (old) => [...(old ?? []), studentMsg])
    setInput("")
    setPendingQuestion(message)
    setStreamText("")
    await askTutor(sid!, { message, mode }, {
      onStatus: setStage,
      onDelta: (t) => setStreamText((s) => s + t),
      onDone: (m) => {
        qc.setQueryData<TutorMessage[]>(["tutor-messages", sid], (old) => [
          ...(old ?? []),
          { id: m.id, sender: "ai", content: m.content, citations: m.citations, figures: m.figures, scope_verdict: m.verdict, action: m.action, created_at: new Date().toISOString() },
        ])
      },
      onError: (e) => setError(e.message),
    }, classId)
    setPendingQuestion(null)
    setStreamText("")
    setStage(null)
  }

  // "Learn this again" from test results: open a fresh chat on the weak topic
  useEffect(() => {
    const topic = params.get("learn")
    if (!topic || learnHandled.current || !syllabus.data) return
    learnHandled.current = true
    send(`Teach me "${topic}" again step by step. I got it wrong in my test.`, "explain", true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syllabus.data])

  const startNewChat = (chId: string | null = null, subId: string | null = subjectId) => {
    setSessionId(null)
    setChapterId(chId)
    setSubjectId(subId)
    setError(null)
  }

  const lastAiId = [...list].reverse().find((m) => m.sender === "ai")?.id
  const canFollowUp = (m: TutorMessage) => m.id === lastAiId && ["in_syllabus", "linked", "cached"].includes(m.scope_verdict ?? "")
  const chapterOfMessage = (m: TutorMessage) => {
    const c = m.citations[0]
    return allChapters.find((ch) => ch.chapterNo === c?.chapterNo && ch.title === c?.chapterTitle)?.id ?? chapterId
  }

  const suggestions = useMemo(() => {
    const topics = visibleChapters.flatMap((c) => c.topics.map((t) => ({ t: t.title, c: c.title }))).slice(0, 40)
    return topics.filter((_, i) => i % Math.max(1, Math.floor(topics.length / 4)) === 0).slice(0, 4).map((x) => `Explain ${x.t}`)
  }, [visibleChapters])

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      {!isStudent && (
        <>
          <Badge variant="info" size="sm">Preview as class</Badge>
          <div className="w-44">
            <Select
              value={previewClassId}
              onChange={(v) => {
                setPreviewClassId(v)
                startNewChat(null, null)
              }}
              options={(staffOptions.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: `${c.publishedBooks} published book(s)` }))}
              placeholder="Choose class"
            />
          </div>
        </>
      )}
      {syllabus.data && <Badge variant="neutral" size="sm">{syllabus.data.className}</Badge>}
    </div>
  )

  let body: React.ReactNode
  if (!ready || syllabus.isLoading) body = <LoadingSkeleton variant="dashboard" />
  else if (syllabus.isError) body = <ErrorState message={(syllabus.error as Error).message} onRetry={() => syllabus.refetch()} />
  else if (!subjects.length)
    body = (
      <EmptyState
        icon={<BookOpen className="h-6 w-6" />}
        title="No textbooks published yet"
        description={isStudent ? "Your teachers haven't published textbooks for your class yet. Please check back soon." : "Upload and publish a textbook for this class in Tutor Textbooks to start the tutor."}
        actionLabel={isStudent ? undefined : "Open Tutor Textbooks"}
        onAction={isStudent ? undefined : () => router.push("/ai-tutor/textbooks")}
      />
    )
  else
    body = (
      <div className="grid h-[calc(100vh-150px)] grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Syllabus rail */}
        <aside className="hidden flex-col gap-3 overflow-y-auto rounded-2xl border border-border-default bg-surface p-3 lg:flex">
          <Button size="dense" variant="secondary" leadingIcon={<MessageSquarePlus className="h-3.5 w-3.5" />} onClick={() => startNewChat()}>
            New chat
          </Button>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => startNewChat(null, null)} className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${!subjectId ? "bg-action-black text-canvas" : "border border-border-default text-text-secondary"}`}>
              All subjects
            </button>
            {subjects.map((s) => (
              <button key={s.id} type="button" onClick={() => startNewChat(null, s.id)} className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${subjectId === s.id ? "bg-action-black text-canvas" : "border border-border-default text-text-secondary"}`}>
                {s.name}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Chapters</p>
            {visibleChapters.map((c: TutorChapter & { subjectId: string }) => (
              <div key={c.id} className={`rounded-lg p-2 ${chapterId === c.id ? "bg-purple-50 dark:bg-purple-950/40" : ""}`}>
                <button type="button" onClick={() => startNewChat(c.id, c.subjectId)} className="w-full text-left text-[11px] font-semibold text-text-primary hover:text-purple-700">
                  Ch {c.chapterNo}. {c.title}
                </button>
                {chapterId === c.id && (
                  <ul className="mt-1 space-y-0.5">
                    {c.topics.map((t) => (
                      <li key={t.id}>
                        <button type="button" disabled={busy} onClick={() => send(`Explain ${t.title}`)} className="flex w-full items-center gap-1.5 text-left text-[11px] text-text-secondary hover:text-text-primary">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${masteryDot(t.mastery)}`} />
                          {t.title}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button type="button" onClick={() => setTestDialog({ chapterId: c.id, topicIds: [] })} className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                        <ClipboardCheck className="h-3 w-3" /> Take a test
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ))}
          </div>
          {!!sessions.data?.length && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Recent chats</p>
              {sessions.data.slice(0, 8).map((s) => (
                <button key={s.id} type="button" onClick={() => { setSessionId(s.id); setChapterId(s.chapter_id); setSubjectId(s.subject_id) }} className={`block w-full truncate rounded-md px-2 py-1 text-left text-[11px] ${sessionId === s.id ? "bg-canvas font-semibold" : "text-text-secondary hover:bg-canvas"}`}>
                  {s.title}
                </button>
              ))}
            </div>
          )}
          {!!quizzes.data?.length && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">My tests</p>
              {quizzes.data.slice(0, 6).map((q) => (
                <button key={q.id} type="button" onClick={() => router.push(`/ai-tutor/quiz/${q.id}${classId ? `?classId=${classId}` : ""}`)} className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-[11px] text-text-secondary hover:bg-canvas">
                  <span className="truncate">{q.chapter_title ?? q.subject_name}</span>
                  <span className="font-mono">{q.status === "graded" ? `${Number(q.score)}/${Number(q.max_score)}` : "open"}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Conversation */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface">
          <div className="flex items-center justify-between border-b border-border-default bg-canvas p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">VID AI Tutor</p>
                <p className="text-[11px] text-text-secondary">
                  {chapterById(chapterId) ? `Ch ${chapterById(chapterId)!.chapterNo}: ${chapterById(chapterId)!.title}` : subjects.find((s) => s.id === subjectId)?.name ?? "All your subjects"} · answers only from your textbooks
                </p>
              </div>
            </div>
            {!syllabus.data?.aiReady && <Badge variant="warning" size="sm">AI not configured</Badge>}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-canvas/40 p-4">
            {!list.length && !busy && (
              <div className="mx-auto max-w-md py-8 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-purple-500" />
                <p className="mt-2 text-sm font-bold text-text-primary">Ask anything from your syllabus</p>
                <p className="mt-1 text-xs text-text-secondary">I explain topics from your textbooks with examples, diagrams and page references, and I can test you.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-border-default bg-surface px-3 py-1 text-[11px] text-text-secondary hover:border-purple-400 hover:text-text-primary">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {list.map((m) => (
              <div key={m.id} className={`flex max-w-[88%] gap-2.5 ${m.sender === "student" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${m.sender === "student" ? "bg-brand-primary text-canvas" : "bg-purple-600 text-white"}`}>
                  {m.sender === "student" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className={`rounded-2xl p-3.5 ${m.sender === "student" ? "rounded-tr-xs bg-action-black text-xs text-canvas" : "rounded-tl-xs border border-border-default bg-surface shadow-xs"}`}>
                  {m.sender === "student" ? (
                    <p className="whitespace-pre-line text-xs leading-relaxed">{m.content}</p>
                  ) : (
                    <>
                      <TutorMarkdown content={m.content} citations={m.citations} onCite={(c: TutorCitation) => setViewer({ bookId: c.bookId, page: c.page })} />
                      {!!m.figures.length && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {m.figures.map((f: TutorFigure) => (
                            <FigureCard key={`${f.bookId}-${f.page}`} figure={f} classId={classId} onOpen={() => setViewer({ bookId: f.bookId, page: f.page, caption: f.caption })} />
                          ))}
                        </div>
                      )}
                      {m.action?.type === "start_test" && (
                        <div className="mt-3">
                          <Button size="dense" variant="primary" leadingIcon={<ClipboardCheck className="h-3.5 w-3.5" />} onClick={() => setTestDialog({ chapterId: m.action!.chapterId, topicIds: m.action!.topicIds })}>
                            Start a test on {m.action.label}
                          </Button>
                        </div>
                      )}
                      {canFollowUp(m) && !busy && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border-default pt-2">
                          <Button size="dense" variant="ghost" leadingIcon={<Wand2 className="h-3.5 w-3.5" />} onClick={() => send("Explain that more simply, please.", "simplify")}>
                            Explain simpler
                          </Button>
                          <Button size="dense" variant="ghost" leadingIcon={<Lightbulb className="h-3.5 w-3.5" />} onClick={() => send("Give me another example.", "example")}>
                            Another example
                          </Button>
                          <Button size="dense" variant="ghost" leadingIcon={<ClipboardCheck className="h-3.5 w-3.5" />} onClick={() => setTestDialog({ chapterId: chapterOfMessage(m), topicIds: [] })}>
                            Test me on this
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="mr-auto flex max-w-[88%] gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-xs border border-border-default bg-surface p-3.5 shadow-xs">
                  {streamText ? (
                    <TutorMarkdown content={streamText} streaming />
                  ) : (
                    <p className="flex items-center gap-2 text-xs italic text-text-muted">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-600" />
                      {STAGE_LABEL[stage ?? ""] ?? "Thinking…"}
                    </p>
                  )}
                </div>
              </div>
            )}
            {error && <p className="text-center text-xs text-rose-600">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border-default bg-surface p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={2000}
                placeholder="Ask a doubt from your textbook…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-xl border border-border-default bg-canvas px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
              />
              <Button size="default" variant="primary" type="submit" disabled={!input.trim() || busy} leadingIcon={<Send className="h-3.5 w-3.5" />}>
                Ask
              </Button>
            </form>
          </div>
        </section>
      </div>
    )

  return (
    <AppShell pageTitle="AI Tutor" breadcrumbs={[{ label: "AI Yantra" }, { label: "AI Tutor" }]} rightHeaderAction={header} fullWidth>
      {body}
      <PageViewer target={viewer} classId={classId} onClose={() => setViewer(null)} />
      <TestDialog
        target={testDialog}
        chapters={allChapters}
        classId={classId}
        sessionId={sessionId}
        onClose={() => setTestDialog(null)}
        onCreated={(id) => router.push(`/ai-tutor/quiz/${id}${classId ? `?classId=${classId}` : ""}`)}
      />
    </AppShell>
  )
}

/** Inline textbook figure: the real page image with its caption (falls back to the caption only). */
function FigureCard({ figure, classId, onOpen }: { figure: TutorFigure; classId?: string; onOpen: () => void }) {
  const [url, setUrl] = useState<string | null | undefined>(figure.hasImage ? undefined : null)
  useEffect(() => {
    if (figure.hasImage) fetchPageImage(figure.bookId, figure.page, classId, figure.figure).then((r) => setUrl(r.url)).catch(() => setUrl(null))
  }, [figure.bookId, figure.page, figure.figure, figure.hasImage, classId])
  return (
    <button type="button" onClick={onOpen} className="overflow-hidden rounded-xl border border-border-default bg-canvas text-left hover:border-purple-400">
      {url === undefined ? (
        <div className="h-56 animate-pulse bg-surface" />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`Textbook page ${figure.page}`} className="h-56 w-full bg-white object-contain p-1" />
      ) : null}
      <span className="flex items-start gap-1.5 p-2 text-[11px] text-text-secondary">
        <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600" />
        <span>
          <span className="font-semibold text-text-primary">Textbook figure · p.{figure.page}</span> — {figure.caption.slice(0, 110)}
        </span>
      </span>
    </button>
  )
}

function PageViewer({ target, classId, onClose }: { target: { bookId: string; page: number; caption?: string } | null; classId?: string; onClose: () => void }) {
  const [state, setState] = useState<{ url: string | null; description: string | null } | null>(null)
  useEffect(() => {
    setState(null)
    if (target) fetchPageImage(target.bookId, target.page, classId).then(setState).catch(() => setState({ url: null, description: null }))
  }, [target, classId])
  return (
    <Modal isOpen={!!target} onClose={onClose} title={target ? `Textbook page ${target.page}` : ""} className="max-w-3xl">
      {!state ? (
        <div className="h-64 animate-pulse rounded-xl bg-canvas" />
      ) : state.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={state.url} alt={`Textbook page ${target?.page}`} className="mx-auto max-h-[70vh] rounded-lg border border-border-default" />
      ) : (
        <p className="text-xs text-text-secondary">{target?.caption || state.description || "The page image isn't available yet. Open your textbook at this page."}</p>
      )}
    </Modal>
  )
}

function TestDialog({
  target, chapters, classId, sessionId, onClose, onCreated,
}: {
  target: { chapterId: string | null; topicIds: string[] } | null
  chapters: (TutorChapter & { subjectName: string })[]
  classId?: string
  sessionId: string | null
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const create = useCreateQuiz(classId)
  const [chapterId, setChapterId] = useState("")
  const [type, setType] = useState("mcq")
  const [count, setCount] = useState("5")
  const [difficulty, setDifficulty] = useState("medium")
  useEffect(() => {
    if (target) {
      setChapterId(target.chapterId ?? chapters[0]?.id ?? "")
      create.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  const submit = () => {
    if (!chapterId || create.isPending) return
    create.mutate(
      { chapterId, topicIds: target?.chapterId === chapterId ? target.topicIds : [], type, count: Number(count), difficulty, sessionId },
      { onSuccess: (q) => onCreated(q.id) },
    )
  }
  return (
    <Modal isOpen={!!target} onClose={onClose} onSubmit={submit} title="Take a practice test" subtitle="Questions come only from your textbook">
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Chapter</p>
          <Select value={chapterId} onChange={setChapterId} options={chapters.map((c) => ({ value: c.id, label: `Ch ${c.chapterNo}. ${c.title}`, sublabel: c.subjectName }))} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold text-text-secondary">Type</p>
            <Select value={type} onChange={setType} options={[{ value: "mcq", label: "MCQ" }, { value: "short", label: "Short answer" }, { value: "long", label: "Long answer" }, { value: "mixed", label: "Mixed" }]} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-text-secondary">Questions</p>
            <Select value={count} onChange={setCount} options={["5", "10", "15", "20"].map((v) => ({ value: v, label: v }))} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-text-secondary">Difficulty</p>
            <Select value={difficulty} onChange={setDifficulty} options={[{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]} />
          </div>
        </div>
        {create.isError && <p className="text-xs text-rose-600">{(create.error as Error).message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="dense" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="dense" isLoading={create.isPending} disabled={!chapterId} onClick={submit}>
            {create.isPending ? "Preparing test…" : "Start test"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function AiTutorChatPage() {
  return (
    <Suspense fallback={null}>
      <TutorChat />
    </Suspense>
  )
}
