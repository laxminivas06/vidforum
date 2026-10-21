import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../../config/env';
import { createSignedReadUrl, deletePrivateObject, putPrivateObject, storageConfigured } from '../../../utils/object-storage';
import type { AuthenticatedUser } from '../../../middleware/auth.middleware';
import { Owner, RetrievedChunk, TutorRepository } from './tutor.repository';
import { ChatTurn, embed, generateJson, streamAnswer, tutorConfigured, TutorUnavailableError, Usage } from './llm';
import { localPdfPath } from './ingest.worker';
import {
  AnswerMode, Band, bandOf, GeneratedQuiz, gradeOf, GradeSchema, gradeSystem, QuizSchema, quizPrompt, quizSystem, answerPrompt,
  simplerStyleNote, tutorSystemPrompt,
} from './prompts';

export class TutorError extends Error {
  constructor(message: string, public status = 400, public code = 'TUTOR_ERROR') {
    super(message);
  }
}

const STAFF_ROLES = ['INSTITUTION_ADMIN', 'ACADEMIC_COORDINATOR', 'FACULTY'];
const norm = (r: string) => r.toUpperCase().replace(/\s+/g, '_');
const isStudent = (u: AuthenticatedUser) => norm(u.role) === 'STUDENT';
const isFaculty = (u: AuthenticatedUser) => norm(u.role) === 'FACULTY';
export const isTutorStaff = (u: AuthenticatedUser) => STAFF_ROLES.includes(norm(u.role)) || norm(u.role) === 'SUPER_ADMIN';

/** Retrieval similarity below which an "in syllabus" verdict is treated as unsupported by the books. */
const MIN_SUPPORT_SIM = 0.5;
const CACHE_MIN_SIM = 0.95;
/** A FIGURE excerpt this close to the question is shown even if the answer didn't cite it. */
const RELATED_FIGURE_SIM = 0.6;

export interface TutorContext {
  institutionId: string;
  owner: Owner;
  classId: string;
  className: string;
  band: Band;
  preview: boolean;
}

/**
 * Resolves who is asking and which class syllabus applies — always on the server.
 * Students: their own current class. Staff: "preview as class", limited to classes they may see.
 */
export async function resolveContext(user: AuthenticatedUser, institutionId: string, previewClassId?: string): Promise<TutorContext> {
  if (isStudent(user)) {
    const s = await TutorRepository.getStudentByProfile(institutionId, user.id);
    if (!s) throw new TutorError('Your login is not linked to a student record yet. Please contact your school office.', 403, 'NO_STUDENT_RECORD');
    return { institutionId, owner: { studentId: s.id, profileId: user.id }, classId: s.class_id, className: s.class_name, band: bandOf(gradeOf(s.class_name, s.sequence_order)), preview: false };
  }
  if (!isTutorStaff(user)) throw new TutorError('AI Tutor is available to students and teaching staff only', 403, 'FORBIDDEN');
  if (!previewClassId) throw new TutorError('Choose a class to preview the tutor', 400, 'CLASS_REQUIRED');
  if (isFaculty(user)) {
    const scope = await TutorRepository.getFacultyScope(institutionId, user.id);
    if (!scope.some((p) => p.class_id === previewClassId)) throw new TutorError('You can only preview classes you teach', 403, 'FORBIDDEN');
  }
  const c = await TutorRepository.getClass(institutionId, previewClassId);
  if (!c) throw new TutorError('Class not found', 404, 'NOT_FOUND');
  return { institutionId, owner: { studentId: null, profileId: user.id }, classId: c.class_id, className: c.class_name, band: bandOf(gradeOf(c.class_name, c.sequence_order)), preview: true };
}

function requireAi() {
  if (!tutorConfigured()) throw new TutorError('AI Tutor is not configured on the server yet (GEMINI_API_KEY)', 503, 'TUTOR_UNAVAILABLE');
}

// ---------- syllabus & mastery ----------

export async function getSyllabus(ctx: TutorContext) {
  const rows = await TutorRepository.getSyllabus(ctx.institutionId, ctx.classId);
  const mastery = await computeMastery(ctx);
  const subjects = new Map<string, any>();
  for (const r of rows) {
    if (!subjects.has(r.subject_id)) subjects.set(r.subject_id, { id: r.subject_id, name: r.subject_name, books: new Map() });
    const books = subjects.get(r.subject_id).books as Map<string, any>;
    if (!books.has(r.book_id)) books.set(r.book_id, { id: r.book_id, title: r.book_title, chapters: [] });
    books.get(r.book_id).chapters.push({
      id: r.chapter_id,
      chapterNo: r.chapter_no,
      title: r.chapter_title,
      topics: (r.topics as { id: string; title: string }[]).map((t) => ({ ...t, mastery: mastery.get(t.id)?.mastery ?? null })),
    });
  }
  return {
    classId: ctx.classId,
    className: ctx.className,
    band: ctx.band,
    preview: ctx.preview,
    aiReady: tutorConfigured(),
    subjects: [...subjects.values()].map((s) => ({ ...s, books: [...s.books.values()] })),
  };
}

/** Exponential moving average of scores per topic (newer tests weigh more). */
async function computeMastery(ctx: TutorContext) {
  const history = await TutorRepository.gradedTopicHistory(ctx.institutionId, ctx.owner, ctx.classId);
  // one score per topic per test (rows arrive oldest test first), then the moving average across tests
  const perTest = new Map<string, { topic: string; at: string; scored: number; max: number }>();
  for (const h of history) {
    const key = `${h.topic_id}|${h.graded_at}`;
    const t = perTest.get(key) ?? { topic: h.topic_id, at: h.graded_at, scored: 0, max: 0 };
    t.scored += Number(h.awarded_marks ?? 0);
    t.max += Number(h.marks);
    perTest.set(key, t);
  }
  const m = new Map<string, { mastery: number; attempts: number; last: string }>();
  for (const t of perTest.values()) {
    const score = t.max > 0 ? t.scored / t.max : 0;
    const prev = m.get(t.topic);
    m.set(t.topic, { mastery: prev ? 0.5 * prev.mastery + 0.5 * score : score, attempts: (prev?.attempts ?? 0) + 1, last: t.at });
  }
  return m;
}

/** Topic refs (T1..Tn) for prompts, so the model never handles raw ids. */
async function topicCatalog(ctx: TutorContext, subjectId: string | null) {
  const rows = await TutorRepository.getSyllabus(ctx.institutionId, ctx.classId);
  const list: { ref: string; id: string; chapterId: string; label: string }[] = [];
  for (const r of rows) {
    if (subjectId && r.subject_id !== subjectId) continue;
    for (const t of r.topics as { id: string; title: string }[]) {
      list.push({ ref: `T${list.length + 1}`, id: t.id, chapterId: r.chapter_id, label: `${r.subject_name} › Ch ${r.chapter_no} ${r.chapter_title} › ${t.title}` });
    }
  }
  return list;
}

// ---------- sessions ----------

export async function createSession(ctx: TutorContext, body: { subjectId?: string | null; chapterId?: string | null; title?: string }) {
  const syllabus = await TutorRepository.getSyllabus(ctx.institutionId, ctx.classId);
  if (body.subjectId && !syllabus.some((r) => r.subject_id === body.subjectId)) throw new TutorError('That subject has no published textbook for this class', 400);
  if (body.chapterId && !syllabus.some((r) => r.chapter_id === body.chapterId)) throw new TutorError('That chapter is not in this class syllabus', 400);
  return TutorRepository.createSession(ctx.institutionId, ctx.owner, {
    classId: ctx.classId,
    subjectId: body.subjectId ?? null,
    chapterId: body.chapterId ?? null,
    title: (body.title ?? 'New chat').slice(0, 80),
  });
}

export async function getSessionMessages(ctx: TutorContext, sessionId: string) {
  const session = await TutorRepository.getSession(ctx.institutionId, ctx.owner, sessionId);
  if (!session || session.class_id !== ctx.classId) throw new TutorError('Chat not found', 404, 'NOT_FOUND');
  return { session, messages: await TutorRepository.listMessages(ctx.institutionId, sessionId) };
}

// ---------- ask (streamed) ----------

export type Emit = (event: 'status' | 'delta' | 'done' | 'error', data: unknown) => void;

interface Citation { ref: string; chunkId: string; bookId: string; chapterNo: number; chapterTitle: string; page: number; label: string }
interface Figure { bookId: string; page: number; figure: number | null; caption: string; hasImage: boolean }

function excerptBlock(chunks: RetrievedChunk[]) {
  return chunks
    .map((c, i) => `[S${i + 1}] (${c.book_title} — Ch ${c.chapter_no} "${c.chapter_title}", page ${c.page_start})${c.kind === 'figure' ? ' FIGURE' : ''}\n${c.content}`)
    .join('\n\n');
}

/** Keeps only [S#] tags that match a given excerpt; returns cleaned text + citations + cited figures. */
export function resolveCitations(text: string, chunks: RetrievedChunk[]) {
  const used = new Set<number>();
  // "[S1, S3]" / "[S1,3]" → "[S1][S3]"
  const split = text.replace(/\[(S\d+(?:\s*,\s*S?\d+)+)\]/g, (_m, list: string) =>
    list.split(',').map((x) => `[S${x.replace(/\D/g, '')}]`).join(''));
  const cleaned = split.replace(/\[S(\d+)\]/g, (tag, n) => {
    const i = Number(n) - 1;
    if (!chunks[i]) return '';
    used.add(i);
    return tag;
  });
  const citations: Citation[] = [...used].sort((a, b) => a - b).map((i) => {
    const c = chunks[i];
    return { ref: `S${i + 1}`, chunkId: c.id, bookId: c.textbook_file_id, chapterNo: c.chapter_no, chapterTitle: c.chapter_title, page: c.page_start, label: `${shortTitle(c.chapter_title)} · p.${c.page_start}` };
  });
  // Figures: every cited page that has one, then the strongest related figure (max 2)
  const figurePages = [...used].map((i) => chunks[i]).filter((c) => c.kind === 'figure' || c.page_has_figures);
  const related = chunks.find((c) => c.kind === 'figure' && c.sim >= RELATED_FIGURE_SIM);
  const figures: Figure[] = [];
  for (const c of related ? [...figurePages, related] : figurePages) {
    // a FIGURE excerpt names its figure; a cited text passage on a figure page shows that page's first figure
    const index = c.kind === 'figure' ? c.figure_index : c.page_figures?.length ? 0 : null;
    if (figures.length >= 2 || figures.some((f) => f.bookId === c.textbook_file_id && f.page === c.page_start && f.figure === index)) continue;
    const crop = index !== null ? c.page_figures?.[index] : null;
    const caption = c.kind === 'figure' ? c.content.replace(/^FIGURE \(page \d+\):\s*/, '') : crop?.caption ?? c.page_figure_description ?? '';
    figures.push({ bookId: c.textbook_file_id, page: c.page_start, figure: index, caption: caption.slice(0, 300), hasImage: Boolean(crop?.image_key || c.image_key) });
  }
  return { text: cleaned.replace(/[ \t]{2,}/g, ' '), citations, figures };
}

const shortTitle = (t: string) => (t.length > 22 ? `${t.slice(0, 21).trimEnd()}…` : t);

/** Up to 3 syllabus topics to suggest: those nearest the question first, then the syllabus order. */
function nearestTopics(chunks: RetrievedChunk[], catalog: { id: string; label: string }[]) {
  const near = chunks.map((c) => catalog.find((t) => t.id === c.topic_id)).filter(Boolean) as { id: string; label: string }[];
  const picked = [...new Map([...near, ...catalog].map((t) => [t.id, t])).values()].slice(0, 3);
  return picked.map((t) => t.label.split(' › ').slice(-2).join(' › '));
}

export async function ask(
  ctx: TutorContext,
  sessionId: string,
  body: { message: string; mode?: AnswerMode },
  emit: Emit,
) {
  requireAi();
  const message = body.message.trim().slice(0, 2000);
  const mode: AnswerMode = body.mode ?? 'explain';
  if (!message) throw new TutorError('Message is empty');
  const session = await TutorRepository.getSession(ctx.institutionId, ctx.owner, sessionId);
  if (!session || session.class_id !== ctx.classId) throw new TutorError('Chat not found', 404, 'NOT_FOUND');

  const usage = await TutorRepository.usageLast24h(ctx.institutionId, ctx.owner);
  if (usage.messages >= env.TUTOR_DAILY_MESSAGES) {
    throw new TutorError(`You've reached today's limit of ${env.TUTOR_DAILY_MESSAGES} questions. Please come back tomorrow!`, 429, 'DAILY_LIMIT');
  }

  const past = await TutorRepository.listMessages(ctx.institutionId, sessionId, 500);
  await TutorRepository.addMessage(ctx.institutionId, sessionId, { sender: 'student', content: message });
  const history: ChatTurn[] = past.slice(-8).map((m) => ({ role: m.sender === 'student' ? 'student' : 'tutor', text: String(m.content).slice(0, 1500) }));

  const reply = async (content: string, extra: { verdict: string; action?: unknown; citations?: Citation[]; figures?: Figure[]; usage?: Usage }) => {
    const saved = await TutorRepository.addMessage(ctx.institutionId, sessionId, {
      sender: 'ai', content, citations: extra.citations, figures: extra.figures, scopeVerdict: extra.verdict,
      action: extra.action, usage: extra.usage, provider: extra.usage?.provider ?? null,
    });
    emit('done', { id: saved.id, content, citations: extra.citations ?? [], figures: extra.figures ?? [], verdict: extra.verdict, action: extra.action ?? null });
  };

  const bookIds = await TutorRepository.publishedBookIds(ctx.institutionId, ctx.classId, session.subject_id);
  if (!bookIds.length) {
    return reply(`There are no published textbooks for **${ctx.className}**${session.subject_id ? ' in this subject' : ''} yet. Your teacher needs to upload and publish them first.`, { verdict: 'no_books' });
  }

  // "Explain simpler" / "Another example" re-teach the last answered question
  let question = message;
  let inheritedVerdict: string | null = null;
  if (mode !== 'explain') {
    const lastAi = [...past].reverse().find((m) => m.sender === 'ai' && ['in_syllabus', 'linked', 'cached'].includes(m.scope_verdict));
    const lastQ = lastAi ? [...past].slice(0, past.indexOf(lastAi)).reverse().find((m) => m.sender === 'student') : null;
    if (lastQ) {
      question = String(lastQ.content);
      inheritedVerdict = lastAi!.scope_verdict === 'linked' ? 'linked' : 'in_syllabus';
    }
  }

  emit('status', { stage: 'searching' });
  const [qVec] = await embed([question], 'query');

  // A near-identical question answered before for this class + tone band (only in-syllabus answers are stored)
  if (mode === 'explain') {
    const cached = await TutorRepository.findCachedAnswer(ctx.institutionId, ctx.classId, ctx.band, qVec, CACHE_MIN_SIM);
    if (cached) {
      emit('delta', { text: cached.answer });
      return reply(cached.answer, { verdict: 'cached', citations: cached.citations, figures: cached.figures });
    }
  }

  const chunks = await TutorRepository.retrieve(ctx.institutionId, bookIds, qVec, question, { chapterId: session.chapter_id, limit: 8 });
  const catalog = await topicCatalog(ctx, session.subject_id);
  const maxSim = chunks.reduce((m, c) => Math.max(m, c.sim), 0);
  const refuse = () => {
    const ideas = nearestTopics(chunks, catalog);
    return reply(
      `That question isn't part of your **${ctx.className}** syllabus, so I can't answer it here. 📚 I can help you with topics from your textbooks${ideas.length ? ', such as:\n\n' + ideas.map((t) => `- ${t}`).join('\n') : '.'}`,
      { verdict: 'out_of_syllabus' },
    );
  };
  if (!chunks.length) return refuse();

  // One model call: it must open with a verdict header; no text reaches the student until the header is checked
  emit('status', { stage: 'answering' });
  let header: VerdictHeader | null = null;
  let buffered = '';
  let full = '';
  let used: Usage | undefined;
  let verdict: string = inheritedVerdict ?? 'in_syllabus';
  try {
    for await (const t of streamAnswer({
      system: tutorSystemPrompt(ctx.band),
      history,
      prompt: answerPrompt({
        question, excerpts: excerptBlock(chunks), mode, inheritedVerdict, simplerStyle: simplerStyleNote(ctx.band),
        topics: catalog.slice(0, 200).map((t) => `${t.ref}: ${t.label}`).join('\n'),
      }),
      onUsage: (u) => (used = u),
    })) {
      if (header) {
        full += t;
        emit('delta', { text: t });
        continue;
      }
      buffered += t;
      const parsed = parseVerdictHeader(buffered);
      if (!parsed && buffered.length < 400) continue;
      header = parsed ?? { verdict: maxSim >= MIN_SUPPORT_SIM ? 'in_syllabus' : 'out_of_syllabus', topics: [], supports: null, rest: buffered };

      if (!inheritedVerdict) {
        if (header.verdict === 'unsafe') {
          return reply("I can't help with that one. If something is worrying you, please talk to a parent, teacher or school counsellor — they really want to help. 💙 Shall we get back to your lessons?", { verdict: 'unsafe' });
        }
        if (header.verdict === 'chitchat') {
          const ideas = nearestTopics(chunks, catalog);
          return reply(`Hi! 👋 I'm your AI Tutor for **${ctx.className}**. Ask me anything from your textbooks${ideas.length ? `, for example:\n\n${ideas.map((x) => `- ${x}`).join('\n')}` : '.'}`, { verdict: 'chitchat' });
        }
        if (header.verdict === 'test_request') {
          const topicIds = header.topics.map((r) => catalog.find((x) => x.ref === r)?.id).filter(Boolean) as string[];
          const chapterId = catalog.find((x) => x.id === topicIds[0])?.chapterId ?? chunks[0]?.chapter_id ?? session.chapter_id ?? null;
          const chapter = chunks.find((c) => c.chapter_id === chapterId);
          const label = chapter ? `Ch ${chapter.chapter_no}: ${chapter.chapter_title}` : 'this chapter';
          return reply(`Great idea! Let's test what you know about **${label}**. Pick the type of test and I'll prepare it from your textbook.`, {
            verdict: 'in_syllabus', action: { type: 'start_test', chapterId, topicIds, label },
          });
        }
        verdict = header.verdict;
        if (verdict === 'in_syllabus' && maxSim < MIN_SUPPORT_SIM) verdict = 'out_of_syllabus';
        if (verdict === 'linked' && !catalog.some((x) => x.ref === header!.supports)) verdict = 'out_of_syllabus';
        if (verdict !== 'in_syllabus' && verdict !== 'linked') return refuse();
      }
      full = header.rest;
      if (full) emit('delta', { text: full });
    }
  } catch (err: any) {
    if (err instanceof TutorUnavailableError) throw new TutorError(err.message, 503, 'TUTOR_UNAVAILABLE');
    console.error('[AI TUTOR] answer failed:', err?.message);
    return reply('The tutor is very busy right now. Please try again in a minute. 🙏', { verdict: 'busy' });
  }
  if (!header) {
    // short reply that never produced a header: only trust it if retrieval supports the question
    if (inheritedVerdict || maxSim < MIN_SUPPORT_SIM || /@@/.test(buffered)) return refuse();
    full = buffered;
  }
  if (!full.trim()) return reply("I couldn't prepare an answer this time. Please try asking in a different way.", { verdict: 'empty' });

  const { text, citations, figures } = resolveCitations(full.trim(), chunks);
  if (!citations.length && verdict === 'in_syllabus') console.warn(`[AI TUTOR] grounding miss (no valid citation) session=${sessionId}`);
  await reply(text, { verdict, citations, figures, usage: used });
  if (mode === 'explain' && verdict === 'in_syllabus' && citations.length) {
    await TutorRepository.saveCachedAnswer(ctx.institutionId, { classId: ctx.classId, band: ctx.band, question, vec: qVec, answer: text, citations, figures }).catch(() => {});
  }
}

interface VerdictHeader { verdict: string; topics: string[]; supports: string | null; rest: string }

/** Parses the opening "@@ verdict=… topics=… supports=… @@" line the model must emit first. */
export function parseVerdictHeader(text: string): VerdictHeader | null {
  const m = text.match(/^\s*@@([^@]*)@@[ \t]*\n?/);
  if (!m) return null;
  const field = (k: string) => m[1].match(new RegExp(`${k}\\s*=\\s*([^\\s@]+)`))?.[1] ?? '';
  const verdict = field('verdict').toLowerCase();
  const allowed = ['in_syllabus', 'linked', 'out_of_syllabus', 'unsafe', 'chitchat', 'test_request'];
  return {
    verdict: allowed.includes(verdict) ? verdict : 'out_of_syllabus',
    topics: field('topics').split(',').map((x) => x.trim()).filter((x) => /^T\d+$/.test(x)),
    supports: /^T\d+$/.test(field('supports')) ? field('supports') : null,
    rest: text.slice(m[0].length).replace(/^\s+/, ''),
  };
}

// ---------- page images ----------

/** Signed image URL for a textbook page, or for one cropped figure on it (`figure` index). */
export async function getPageImage(ctx: TutorContext, bookId: string, pageNo: number, figure?: number) {
  const page = await TutorRepository.getPage(ctx.institutionId, bookId, pageNo);
  if (!page || page.class_id !== ctx.classId || page.status !== 'published') throw new TutorError('Page not found', 404, 'NOT_FOUND');
  const crop = figure !== undefined && Number.isInteger(figure) ? (page.figures ?? [])[figure] : null;
  const key = crop?.image_key ?? page.image_key;
  const url = key ? await createSignedReadUrl(key, env.TEXTBOOK_BUCKET, 900) : null;
  return { url, page: page.page_no, description: crop ? `${crop.caption}: ${crop.description}` : page.figure_description };
}

// ---------- tests ----------

const QUIZ_TYPES = ['mcq', 'short', 'long', 'mixed'] as const;
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export async function createQuiz(
  ctx: TutorContext,
  body: { chapterId: string; topicIds?: string[]; type: string; count: number; difficulty?: string; sessionId?: string | null },
) {
  requireAi();
  const type = QUIZ_TYPES.includes(body.type as any) ? body.type : 'mcq';
  const difficulty = DIFFICULTIES.includes(body.difficulty as any) ? body.difficulty! : 'medium';
  const count = Math.min(20, Math.max(3, Math.round(Number(body.count) || 5)));

  const usage = await TutorRepository.usageLast24h(ctx.institutionId, ctx.owner);
  if (usage.tests >= env.TUTOR_DAILY_TESTS) throw new TutorError(`You've reached today's limit of ${env.TUTOR_DAILY_TESTS} tests. Please come back tomorrow!`, 429, 'DAILY_LIMIT');

  const syllabus = await TutorRepository.getSyllabus(ctx.institutionId, ctx.classId);
  const chapter = syllabus.find((r) => r.chapter_id === body.chapterId);
  if (!chapter) throw new TutorError('That chapter is not in this class syllabus', 400);
  const chapterTopics = chapter.topics as { id: string; title: string }[];
  const topicIds = (body.topicIds ?? []).filter((id) => chapterTopics.some((t) => t.id === id));
  const topics = topicIds.length ? chapterTopics.filter((t) => topicIds.includes(t.id)) : chapterTopics;

  const query = `${chapter.chapter_title}. ${topics.map((t) => t.title).join('. ')}`;
  const [qVec] = await embed([query], 'query');
  const chunks = await TutorRepository.retrieve(ctx.institutionId, [chapter.book_id], qVec, query, {
    chapterId: chapter.chapter_id, topicIds, limit: Math.min(24, count * 2 + 6),
  });
  if (chunks.length < 2) throw new TutorError('Not enough textbook content found for this chapter to make a test', 400);
  const topicRefs = topics.map((t, i) => ({ ref: `T${i + 1}`, ...t }));

  const want = (t: string) => type === 'mixed' || t === type;
  let valid: ReturnType<typeof validateQuestion>[] = [];
  for (let attempt = 0; attempt < 2 && valid.length < count; attempt++) {
    const generated = await generateJson({
      system: quizSystem(ctx.band),
      tier: 'smart',
      schema: QuizSchema,
      prompt: quizPrompt({
        excerpts: excerptBlock(chunks),
        topics: topicRefs.map((t) => `${t.ref}: ${t.title}`).join('\n'),
        count: count - valid.length,
        type,
        difficulty,
      }),
    });
    const fresh = generated.questions.map((q) => validateQuestion(q, chunks, topicRefs)).filter((q) => q && want(q.type));
    valid = [...valid, ...fresh].filter((q, i, arr) => arr.findIndex((x) => x!.question === q!.question) === i);
  }
  const questions = valid.filter(Boolean).slice(0, count) as NonNullable<ReturnType<typeof validateQuestion>>[];
  if (!questions.length) throw new TutorError('Could not prepare a good test right now. Please try again.', 502, 'QUIZ_GENERATION_FAILED');

  const quizId = await TutorRepository.createQuiz(ctx.institutionId, ctx.owner, {
    classId: ctx.classId, sessionId: body.sessionId ?? null, subjectId: chapter.subject_id, chapterId: chapter.chapter_id,
    topicIds: topics.map((t) => t.id), quizType: type, difficulty,
  }, questions);
  return getQuiz(ctx, quizId);
}

/** Server-side checks on generated questions; anything malformed is dropped. */
export function validateQuestion(
  q: GeneratedQuiz['questions'][number],
  chunks: RetrievedChunk[],
  topicRefs: { ref: string; id: string }[],
) {
  const sources = q.source_refs
    .map((r) => chunks[Number(String(r).replace(/\D/g, '')) - 1]?.id)
    .filter(Boolean) as string[];
  if (!sources.length || !q.question.trim() || !q.answer_key.trim()) return null;
  const topicId = topicRefs.find((t) => t.ref === q.topic_ref)?.id ?? null;
  if (q.type === 'mcq') {
    const options = q.options.map((o) => o.trim());
    if (options.length !== 4 || new Set(options.map((o) => o.toLowerCase())).size !== 4 || options.some((o) => !o)) return null;
    if (q.correct_option_index < 0 || q.correct_option_index > 3) return null;
    return { type: 'mcq', question: q.question.trim(), options, answerKey: options[q.correct_option_index], rubric: [], explanation: q.explanation, marks: 1, topicId, sourceChunkIds: sources };
  }
  const rubric = q.rubric.filter((r) => r.point.trim() && r.marks > 0);
  const marks = rubric.reduce((s, r) => s + r.marks, 0) || q.marks;
  if (!(marks > 0) || marks > 10) return null;
  return { type: q.type, question: q.question.trim(), options: null, answerKey: q.answer_key.trim(), rubric, explanation: q.explanation, marks, topicId, sourceChunkIds: sources };
}

export async function getQuiz(ctx: TutorContext, quizId: string) {
  const quiz = await TutorRepository.getQuiz(ctx.institutionId, ctx.owner, quizId);
  if (!quiz || quiz.class_id !== ctx.classId) throw new TutorError('Test not found', 404, 'NOT_FOUND');
  const graded = quiz.status === 'graded';
  const rows = await TutorRepository.getQuizQuestions(ctx.institutionId, quizId);
  const sourceIds = [...new Set(rows.flatMap((r) => r.source_chunk_ids as string[]))];
  const sources = graded ? new Map((await TutorRepository.chunksByIds(ctx.institutionId, sourceIds)).map((c) => [c.id, c])) : new Map();
  return {
    id: quiz.id,
    type: quiz.quiz_type,
    difficulty: quiz.difficulty,
    status: quiz.status,
    chapterId: quiz.chapter_id,
    chapterTitle: quiz.chapter_title,
    subjectName: quiz.subject_name,
    score: quiz.score === null ? null : Number(quiz.score),
    maxScore: Number(quiz.max_score),
    summary: quiz.summary,
    createdAt: quiz.created_at,
    questions: rows.map((r) => ({
      qNo: r.q_no,
      type: r.type,
      question: r.question,
      options: r.options,
      marks: Number(r.marks),
      topicTitle: r.topic_title,
      // answer keys, rubrics and explanations never leave the server before grading
      ...(graded ? {
        studentAnswer: r.student_answer,
        awarded: Number(r.awarded_marks ?? 0),
        answerKey: r.answer_key,
        explanation: r.explanation,
        feedback: r.feedback,
        pages: [...new Set((r.source_chunk_ids as string[]).map((id) => sources.get(id)).filter(Boolean).map((c: any) => `${shortTitle(c.chapter_title)} · p.${c.page_start}`))],
      } : {}),
    })),
  };
}

export async function listQuizzes(ctx: TutorContext) {
  return TutorRepository.listQuizzes(ctx.institutionId, ctx.owner, ctx.classId);
}

export async function submitQuiz(ctx: TutorContext, quizId: string, answers: Record<string, string>) {
  const quiz = await TutorRepository.getQuiz(ctx.institutionId, ctx.owner, quizId);
  if (!quiz || quiz.class_id !== ctx.classId) throw new TutorError('Test not found', 404, 'NOT_FOUND');
  if (quiz.status === 'graded') return getQuiz(ctx, quizId);
  const rows = await TutorRepository.getQuizQuestions(ctx.institutionId, quizId);
  const answerOf = (qNo: number) => String(answers[String(qNo)] ?? '').slice(0, 4000).trim();

  const graded: { qNo: number; studentAnswer: string; awarded: number; feedback: any }[] = [];
  const written = rows.filter((r) => r.type !== 'mcq' && answerOf(r.q_no));
  for (const r of rows) {
    const ans = answerOf(r.q_no);
    if (r.type === 'mcq') {
      const options = r.options as string[];
      const picked = ans === '' ? -1 : Number(ans);
      const correctIdx = options.indexOf(r.answer_key);
      const correct = picked === correctIdx;
      graded.push({
        qNo: r.q_no,
        studentAnswer: picked >= 0 && options[picked] !== undefined ? options[picked] : '',
        awarded: correct ? Number(r.marks) : 0,
        feedback: { correct, picked, correctIndex: correctIdx },
      });
    } else if (!ans) {
      graded.push({ qNo: r.q_no, studentAnswer: '', awarded: 0, feedback: { what_was_right: '', what_was_missing: 'No answer was given.', misconception: '', model_answer: r.answer_key } });
    }
  }

  if (written.length) {
    requireAi();
    const res = await generateJson({
      system: gradeSystem(ctx.band),
      tier: 'smart',
      schema: GradeSchema,
      prompt: `<answers>\n${written.map((r) => JSON.stringify({
        q_no: r.q_no, question: r.question, marks: Number(r.marks), rubric: r.rubric, model_answer: r.answer_key, student_answer: answerOf(r.q_no),
      })).join('\n')}\n</answers>`,
    });
    for (const r of written) {
      const g = res.results.find((x) => x.q_no === r.q_no);
      graded.push({
        qNo: r.q_no,
        studentAnswer: answerOf(r.q_no),
        awarded: g ? Math.min(Number(r.marks), Math.max(0, Math.round(g.awarded * 2) / 2)) : 0,
        feedback: g ?? { what_was_right: '', what_was_missing: 'Could not be graded automatically.', misconception: '', model_answer: r.answer_key },
      });
    }
  }

  const score = graded.reduce((s, g) => s + g.awarded, 0);
  const byTopic = new Map<string, { topicId: string; title: string; scored: number; max: number }>();
  for (const r of rows) {
    if (!r.topic_id) continue;
    const g = graded.find((x) => x.qNo === r.q_no)!;
    const t = byTopic.get(r.topic_id) ?? { topicId: r.topic_id, title: r.topic_title, scored: 0, max: 0 };
    t.scored += g.awarded;
    t.max += Number(r.marks);
    byTopic.set(r.topic_id, t);
  }
  const topics = [...byTopic.values()].map((t) => ({ ...t, pct: t.max ? t.scored / t.max : 0 }));
  const weak = topics.filter((t) => t.pct < 0.6).sort((a, b) => a.pct - b.pct);
  const summary = { topics, nextSteps: weak.slice(0, 3).map((t) => ({ topicId: t.topicId, title: t.title, chapterId: quiz.chapter_id })) };

  await TutorRepository.saveGrades(ctx.institutionId, quizId, graded, score, summary);
  if (ctx.owner.studentId) {
    const mastery = await computeMastery(ctx);
    await TutorRepository.saveLearningProfile(ctx.institutionId, ctx.owner.studentId,
      [...mastery.entries()].map(([topic_id, m]) => ({ topic_id, mastery: Number(m.mastery.toFixed(3)), attempts: m.attempts, last_assessed_at: m.last })));
  }
  return getQuiz(ctx, quizId);
}

// ---------- textbooks (staff) ----------

async function assertCanManage(user: AuthenticatedUser, institutionId: string, classId: string, subjectId: string) {
  if (!isTutorStaff(user)) throw new TutorError('Only school staff can manage tutor textbooks', 403, 'FORBIDDEN');
  if (isFaculty(user)) {
    const scope = await TutorRepository.getFacultyScope(institutionId, user.id);
    if (!scope.some((p) => p.class_id === classId && p.subject_id === subjectId)) {
      throw new TutorError('You can only manage textbooks for classes and subjects you teach', 403, 'FORBIDDEN');
    }
  }
}

async function loadManaged(user: AuthenticatedUser, institutionId: string, id: string) {
  const tb = await TutorRepository.getTextbook(institutionId, id);
  if (!tb) throw new TutorError('Textbook not found', 404, 'NOT_FOUND');
  await assertCanManage(user, institutionId, tb.class_id, tb.subject_id);
  return tb;
}

export async function listTextbooks(user: AuthenticatedUser, institutionId: string, f: { classId?: string; subjectId?: string }) {
  if (!isTutorStaff(user)) throw new TutorError('Only school staff can manage tutor textbooks', 403, 'FORBIDDEN');
  const pairs = isFaculty(user) ? await TutorRepository.getFacultyScope(institutionId, user.id) : undefined;
  return {
    textbooks: await TutorRepository.listTextbooks(institutionId, { ...f, pairs }),
    aiReady: tutorConfigured(),
    storageReady: storageConfigured(),
  };
}

export async function createTextbook(
  user: AuthenticatedUser,
  institutionId: string,
  body: { classId: string; subjectId: string; title: string; academicYearId?: string | null; preferredTextbookId?: string | null },
) {
  if (!body.classId || !body.subjectId || !body.title?.trim()) throw new TutorError('Class, subject and title are required');
  await assertCanManage(user, institutionId, body.classId, body.subjectId);
  const cls = await TutorRepository.getClass(institutionId, body.classId);
  if (!cls) throw new TutorError('Class not found', 404, 'NOT_FOUND');
  return TutorRepository.createTextbook(institutionId, {
    academicYearId: body.academicYearId ?? null,
    classId: body.classId,
    subjectId: body.subjectId,
    preferredTextbookId: body.preferredTextbookId ?? null,
    title: body.title.trim().slice(0, 200),
    uploadedBy: user.id,
  });
}

export const MAX_PDF_BYTES = 80 * 1024 * 1024;

export async function uploadTextbookFile(user: AuthenticatedUser, institutionId: string, id: string, file: Buffer) {
  const tb = await loadManaged(user, institutionId, id);
  if (!file?.length || file.subarray(0, 5).toString('latin1') !== '%PDF-') throw new TutorError('Please upload a PDF file');
  if (file.length > MAX_PDF_BYTES) throw new TutorError('PDF is larger than 80 MB');
  const sha = crypto.createHash('sha256').update(file).digest('hex');
  const stored = await putPrivateObject(tb.storage_key, file, 'application/pdf', env.TEXTBOOK_BUCKET);
  if (!stored) {
    // Storage not configured: keep a local working copy so processing still works in the demo
    await fs.mkdir(path.dirname(localPdfPath(id)), { recursive: true });
    await fs.writeFile(localPdfPath(id), file);
  }
  await TutorRepository.resetProcessing(institutionId, id);
  await TutorRepository.setStatus(institutionId, id, 'processing', { fileSha256: sha });
  await TutorRepository.clearAnswerCache(institutionId, tb.class_id);
  return { id, status: 'processing', stored: Boolean(stored), aiReady: tutorConfigured() };
}

export async function reprocessTextbook(user: AuthenticatedUser, institutionId: string, id: string) {
  const tb = await loadManaged(user, institutionId, id);
  if (!['failed', 'review'].includes(tb.status)) throw new TutorError('Only failed or in-review textbooks can be reprocessed');
  await TutorRepository.resetProcessing(institutionId, id);
  await TutorRepository.setStatus(institutionId, id, 'processing');
  return { id, status: 'processing' };
}

export async function getTextbookDetail(user: AuthenticatedUser, institutionId: string, id: string) {
  const tb = await loadManaged(user, institutionId, id);
  return { ...tb, chapters: await TutorRepository.getChapters(institutionId, id) };
}

export async function updateTextbookChapters(user: AuthenticatedUser, institutionId: string, id: string, chapters: { id: string; title: string; inSyllabus: boolean }[]) {
  const tb = await loadManaged(user, institutionId, id);
  if (!['review', 'published'].includes(tb.status)) throw new TutorError('Chapters can be edited once processing has finished');
  if (!Array.isArray(chapters)) throw new TutorError('chapters must be an array');
  await TutorRepository.updateChapters(institutionId, id, chapters.map((c) => ({ id: c.id, title: String(c.title).trim().slice(0, 200) || 'Untitled', inSyllabus: Boolean(c.inSyllabus) })));
  await TutorRepository.clearAnswerCache(institutionId, tb.class_id);
  return getTextbookDetail(user, institutionId, id);
}

export async function publishTextbook(user: AuthenticatedUser, institutionId: string, id: string) {
  const tb = await loadManaged(user, institutionId, id);
  if (tb.status !== 'review') throw new TutorError('Only processed textbooks waiting for review can be published');
  const chapters = await TutorRepository.getChapters(institutionId, id);
  if (!chapters.some((c) => c.in_syllabus && c.chunk_count > 0)) throw new TutorError('Mark at least one chapter as in syllabus before publishing');
  await TutorRepository.setStatus(institutionId, id, 'published');
  await TutorRepository.clearAnswerCache(institutionId, tb.class_id);
  return { id, status: 'published' };
}

export async function deleteTextbook(user: AuthenticatedUser, institutionId: string, id: string) {
  const tb = await loadManaged(user, institutionId, id);
  const imageKeys = await TutorRepository.pageImageKeys(institutionId, id);
  await TutorRepository.deleteTextbook(institutionId, id);
  await TutorRepository.clearAnswerCache(institutionId, tb.class_id);
  await Promise.all([
    deletePrivateObject(tb.storage_key, env.TEXTBOOK_BUCKET),
    ...imageKeys.map((k) => deletePrivateObject(k, env.TEXTBOOK_BUCKET)),
    fs.rm(localPdfPath(id), { force: true }),
  ]);
  return { id, deleted: true };
}

/** Classes + subjects a staff member may pick (admin: all; faculty: taught pairs). */
export async function staffOptions(user: AuthenticatedUser, institutionId: string) {
  if (!isTutorStaff(user)) throw new TutorError('Forbidden', 403, 'FORBIDDEN');
  const classes = await TutorRepository.listClassesWithBooks(institutionId);
  const pairs = isFaculty(user) ? await TutorRepository.getFacultyScope(institutionId, user.id) : null;
  const visible = pairs ? classes.filter((c) => pairs.some((p) => p.class_id === c.id)) : classes;
  return Promise.all(visible.map(async (c) => ({
    id: c.id,
    name: c.name,
    publishedBooks: c.published_books,
    subjects: (await TutorRepository.listSubjectsForClass(institutionId, c.id)).filter((s) => !pairs || pairs.some((p) => p.class_id === c.id && p.subject_id === s.id)),
  })));
}
