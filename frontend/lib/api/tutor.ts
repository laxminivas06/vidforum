"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api/hooks"

const BASE = `${API_BASE_URL}/ai-yantra/tutor`

// ---------- types ----------

export interface TutorTopic { id: string; title: string; mastery: number | null }
export interface TutorChapter { id: string; chapterNo: number; title: string; topics: TutorTopic[] }
export interface TutorBook { id: string; title: string; chapters: TutorChapter[] }
export interface TutorSubject { id: string; name: string; books: TutorBook[] }
export interface TutorSyllabus {
  classId: string
  className: string
  band: string
  preview: boolean
  aiReady: boolean
  subjects: TutorSubject[]
}

export interface TutorCitation { ref: string; bookId: string; chapterNo: number; chapterTitle: string; page: number; label: string }
export interface TutorFigure { bookId: string; page: number; figure?: number | null; caption: string; hasImage: boolean }
export interface TutorAction { type: "start_test"; chapterId: string | null; topicIds: string[]; label: string }

export interface TutorMessage {
  id: string
  sender: "student" | "ai"
  content: string
  citations: TutorCitation[]
  figures: TutorFigure[]
  scope_verdict: string | null
  action: TutorAction | null
  created_at: string
}

export interface TutorSession { id: string; title: string; subject_id: string | null; chapter_id: string | null; started_at: string; last_message_at: string | null }

export interface QuizQuestion {
  qNo: number
  type: "mcq" | "short" | "long"
  question: string
  options: string[] | null
  marks: number
  topicTitle: string | null
  studentAnswer?: string | null
  awarded?: number
  answerKey?: string
  explanation?: string | null
  feedback?: any
  pages?: string[]
}

export interface TutorQuiz {
  id: string
  type: string
  difficulty: string
  status: "generated" | "submitted" | "graded"
  chapterId: string | null
  chapterTitle: string | null
  subjectName: string | null
  score: number | null
  maxScore: number
  summary: {
    topics: { topicId: string; title: string; scored: number; max: number; pct: number }[]
    nextSteps: { topicId: string; title: string; chapterId: string }[]
  } | null
  questions: QuizQuestion[]
}

export interface StaffTextbook {
  id: string
  title: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  status: "uploaded" | "processing" | "review" | "published" | "failed"
  page_count: number | null
  processed_pages: number
  error: string | null
  chapter_count: number
}

export interface StaffChapter {
  id: string
  chapter_no: number
  title: string
  start_page: number
  end_page: number
  in_syllabus: boolean
  topics: { id: string; title: string }[]
  chunk_count: number
}

export interface StaffClassOption { id: string; name: string; publishedBooks: number; subjects: { id: string; name: string }[] }

export class TutorApiError extends Error {
  constructor(message: string, public code?: string, public status?: number) {
    super(message)
  }
}

// ---------- fetch helpers ----------

const withClass = (path: string, classId?: string) =>
  classId ? `${BASE}${path}${path.includes("?") ? "&" : "?"}classId=${encodeURIComponent(classId)}` : `${BASE}${path}`

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...getAuthHeaders(), ...(init.headers || {}) } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) throw new TutorApiError(json.message || "Request failed", json.error?.code, res.status)
  return json.data as T
}

// ---------- learner ----------

/** `classId` is only used by staff previewing a class; students always get their own class. */
export function useTutorSyllabus(classId?: string, enabled = true) {
  return useQuery({
    queryKey: ["tutor-syllabus", classId ?? "me"],
    queryFn: () => call<TutorSyllabus>(withClass("/me/syllabus", classId)),
    enabled,
    retry: false,
    staleTime: 60_000,
  })
}

export function useTutorSessions(classId?: string, enabled = true) {
  return useQuery({
    queryKey: ["tutor-sessions", classId ?? "me"],
    queryFn: () => call<TutorSession[]>(withClass("/sessions", classId)),
    enabled,
    retry: false,
  })
}

export function useTutorMessages(sessionId: string | null, classId?: string) {
  return useQuery({
    queryKey: ["tutor-messages", sessionId],
    queryFn: () => call<{ messages: TutorMessage[] }>(withClass(`/sessions/${sessionId}/messages`, classId)).then((d) => d.messages),
    enabled: !!sessionId,
    retry: false,
    staleTime: Infinity,
  })
}

export function createTutorSession(body: { subjectId?: string | null; chapterId?: string | null; title: string }, classId?: string) {
  return call<TutorSession>(withClass("/sessions", classId), { method: "POST", body: JSON.stringify(body) })
}

export interface AskHandlers {
  onStatus?: (stage: string) => void
  onDelta: (text: string) => void
  onDone: (msg: Omit<TutorMessage, "sender" | "created_at" | "scope_verdict"> & { verdict: string }) => void
  onError: (err: TutorApiError) => void
}

/** Streams an answer over SSE (fetch + ReadableStream so the Bearer token is sent). */
export async function askTutor(
  sessionId: string,
  body: { message: string; mode?: "explain" | "simplify" | "example" },
  handlers: AskHandlers,
  classId?: string,
  signal?: AbortSignal,
) {
  let res: Response
  try {
    res = await fetch(withClass(`/sessions/${sessionId}/ask`, classId), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      signal,
    })
  } catch {
    handlers.onError(new TutorApiError("Can't reach the tutor. Check your connection and try again."))
    return
  }
  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => ({}))
    handlers.onError(new TutorApiError(json.message || "The tutor is unavailable", json.error?.code, res.status))
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const event = raw.match(/^event: (.*)$/m)?.[1]
      const dataLine = raw.match(/^data: (.*)$/m)?.[1]
      if (!event || !dataLine) continue
      const data = JSON.parse(dataLine)
      if (event === "delta") handlers.onDelta(data.text)
      else if (event === "status") handlers.onStatus?.(data.stage)
      else if (event === "done") handlers.onDone(data)
      else if (event === "error") handlers.onError(new TutorApiError(data.message, data.code, data.status))
    }
  }
}

/** Page image, or one cropped figure on that page when `figure` is given. */
export function fetchPageImage(bookId: string, page: number, classId?: string, figure?: number | null) {
  const q = figure === undefined || figure === null ? "" : `?figure=${figure}`
  return call<{ url: string | null; page: number; description: string | null }>(withClass(`/pages/${bookId}/${page}${q}`, classId))
}

export function useTutorQuizzes(classId?: string, enabled = true) {
  return useQuery({
    queryKey: ["tutor-quizzes", classId ?? "me"],
    queryFn: () => call<any[]>(withClass("/quizzes", classId)),
    enabled,
    retry: false,
  })
}

export function useTutorQuiz(quizId: string, classId?: string, enabled = true) {
  return useQuery({
    queryKey: ["tutor-quiz", quizId],
    queryFn: () => call<TutorQuiz>(withClass(`/quizzes/${quizId}`, classId)),
    enabled,
    retry: false,
  })
}

export function useCreateQuiz(classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { chapterId: string; topicIds?: string[]; type: string; count: number; difficulty: string; sessionId?: string | null }) =>
      call<TutorQuiz>(withClass("/quizzes", classId), { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor-quizzes"] }),
  })
}

export function useSubmitQuiz(quizId: string, classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answers: Record<string, string>) =>
      call<TutorQuiz>(withClass(`/quizzes/${quizId}/submit`, classId), { method: "POST", body: JSON.stringify({ answers }) }),
    onSuccess: (quiz) => {
      qc.setQueryData(["tutor-quiz", quizId], quiz)
      qc.invalidateQueries({ queryKey: ["tutor-quizzes"] })
      qc.invalidateQueries({ queryKey: ["tutor-syllabus"] })
    },
  })
}

// ---------- staff ----------

export function useTutorStaffOptions(enabled = true) {
  return useQuery({
    queryKey: ["tutor-staff-options"],
    queryFn: () => call<StaffClassOption[]>(`${BASE}/staff/options`),
    enabled,
    retry: false,
    staleTime: 60_000,
  })
}

export function useStaffTextbooks() {
  return useQuery({
    queryKey: ["tutor-textbooks"],
    queryFn: () => call<{ textbooks: StaffTextbook[]; aiReady: boolean; storageReady: boolean }>(`${BASE}/textbooks`),
    // keep polling while any book is still being processed
    refetchInterval: (q) => (q.state.data?.textbooks.some((t) => t.status === "processing") ? 4000 : false),
  })
}

export function useStaffTextbook(id: string | null) {
  return useQuery({
    queryKey: ["tutor-textbook", id],
    queryFn: () => call<StaffTextbook & { chapters: StaffChapter[] }>(`${BASE}/textbooks/${id}`),
    enabled: !!id,
  })
}

export function useUploadTextbook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (d: { classId: string; subjectId: string; title: string; file: File }) => {
      const tb = await call<{ id: string }>(`${BASE}/textbooks`, {
        method: "POST",
        body: JSON.stringify({ classId: d.classId, subjectId: d.subjectId, title: d.title }),
      })
      return call<{ id: string; status: string; stored: boolean }>(`${BASE}/textbooks/${tb.id}/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: d.file,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor-textbooks"] }),
  })
}

function useTextbookMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor-textbooks"] })
      qc.invalidateQueries({ queryKey: ["tutor-textbook"] })
      qc.invalidateQueries({ queryKey: ["tutor-staff-options"] })
    },
  })
}

export const useSaveChapters = () =>
  useTextbookMutation((v: { id: string; chapters: { id: string; title: string; inSyllabus: boolean }[] }) =>
    call(`${BASE}/textbooks/${v.id}/chapters`, { method: "PUT", body: JSON.stringify({ chapters: v.chapters }) }))

export const usePublishTextbook = () =>
  useTextbookMutation((id: string) => call(`${BASE}/textbooks/${id}/publish`, { method: "POST" }))

export const useReprocessTextbook = () =>
  useTextbookMutation((id: string) => call(`${BASE}/textbooks/${id}/reprocess`, { method: "POST" }))

export const useDeleteTutorTextbook = () =>
  useTextbookMutation((id: string) => call(`${BASE}/textbooks/${id}`, { method: "DELETE" }))
