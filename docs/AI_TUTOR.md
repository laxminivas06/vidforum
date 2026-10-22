# Yantra AI Tutor

A syllabus-locked tutor. Faculty or admins upload each class's textbook PDFs. Students then ask doubts, get explanations at their class level with textbook page references, figures and diagrams, take MCQ or written practice tests, and get detailed feedback that tracks their weak topics.

## Running it

1. Set `GEMINI_API_KEY` in `backend/.env`; it is a free key from Google AI Studio. All other settings are listed in `backend/.env.example`.
2. Optional but recommended: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - With them, PDFs and page images are stored in the private `textbooks` bucket, which is created automatically.
   - Without them, PDFs are processed from a local temporary copy and students see figure captions instead of page images. This only works with a single backend instance.
3. Apply the migration: `npx tsx scripts/run-migration.ts 018_ai_tutor.sql`. It is idempotent.
4. Staff go to **AI Yantra → Tutor Textbooks**: upload a PDF, wait for processing, review the chapters (untick anything not in this year's syllabus), then publish.
5. Students open **AI Tutor 24/7**. Staff can use **AI Yantra → AI Tutor** with "Preview as class".

Without `GEMINI_API_KEY` the app still runs. The tutor returns `503 TUTOR_UNAVAILABLE` and textbook processing waits.

## How answers stay inside the syllabus

- **Scope comes from the server.** A student's class comes from `students.profile_id` (or `user_id`) and `current_class_id`, never from the request.
  - Staff previews are limited to all classes for admins and to the classes they teach for faculty.
  - Every query is filtered by `institution_id`.
- **Retrieval is fenced.** Hybrid search (pgvector plus Postgres full-text search) only looks at published books for that class, and only at chapters marked in syllabus.
- **A syllabus gate runs on every answer.** It is part of the same model call: the reply must open with a `@@ verdict=… @@` header, and the server shows nothing until it has checked that header. The header classifies the message as `in_syllabus`, `linked` (a prerequisite of a listed topic), `out_of_syllabus` or `unsafe`.
  - Out-of-syllabus and unsafe messages get a fixed reply; the model never answers them.
  - An "in syllabus" verdict with weak retrieval support is downgraded to a refusal.
- **Answers are grounded.** Textbook excerpts are numbered `[S1]…[Sn]` and the model must cite them. The server drops invalid tags and turns valid ones into page chips. An in-syllabus answer with no citation is logged as a grounding miss.
- **Prompt injection is handled.** Textbook text and student text are passed as data, and instructions inside them are ignored.

## Code map

| Concern | File |
|---|---|
| AI provider adapter (the only vendor code: Gemini, plus Groq fallback) | `backend/src/modules/ai-yantra/tutor/llm.ts` |
| Prompts, grade bands, output schemas | `backend/src/modules/ai-yantra/tutor/prompts.ts` |
| PDF processing worker (Postgres status is the queue, resumable per page) | `backend/src/modules/ai-yantra/tutor/ingest.worker.ts` |
| Chat, tests, grading, textbook management | `backend/src/modules/ai-yantra/tutor/tutor.service.ts` |
| SQL (every method takes `institutionId` first) | `backend/src/modules/ai-yantra/tutor/tutor.repository.ts` |
| Routes (`/api/v1/ai-yantra/tutor`, answers stream over SSE) | `backend/src/modules/ai-yantra/tutor/tutor.routes.ts` |
| Schema | `backend/db/migrations/018_ai_tutor.sql` |
| UI | `frontend/app/ai-tutor/{chat,quiz/[id],textbooks}`, `frontend/components/tutor/TutorMarkdown.tsx`, `frontend/lib/api/tutor.ts` |

**Moving to a paid provider:** add another implementation of the four functions in `llm.ts` (`streamAnswer`, `generateJson`, `describeImage`, `embed`) and set `TUTOR_LLM_PROVIDER`. If the embedding model changes, re-embed `textbook_chunks`; the `embedding_model` column records which model produced each row.

## Checks

- `npm run test:tutor` runs pure-logic checks: grade bands, chunking, citation parsing, and validation of generated questions.
- `npx tsx src/scripts/eval-ai-tutor.ts <institutionId> <staffProfileId> <classId> [n]` is the syllabus-lock eval. It makes live AI calls, and the target is 0 off-syllabus answers.

## Figures

While processing a book, figure pages go through one vision call. It returns each figure's caption, a description and a bounding box. The worker crops each figure into its own image (`textbook_pages.figures`), and a cited page with a figure shows that crop inline in the answer. Uploading the same PDF to another school reuses the saved boxes, so no new AI calls are made.

## Free-tier limits

- AI calls are paced by `TUTOR_RPM` (default 10 a minute, shared). Calls that hit 429/503 or time out are retried, then fall back to the other Flash model, then to Groq for chat.
- Model choice (measured 2026-10-21):
  - `gemini-3.5-flash-lite`, with minimal thinking, handles answers, the syllabus gate and figure detection. It starts replying in about 5–20 seconds.
  - `gemini-3.5-flash` handles tests and grading.
  - Avoid `gemini-3.8-flash`, which allows only 20 requests a day on the free tier.
  - Pro models have no free quota.
- Most of the remaining wait is the free tier queueing requests. A paid key removes it.
- Daily caps per student: `TUTOR_DAILY_MESSAGES` and `TUTOR_DAILY_TESTS`.
- The free tier may use prompts to improve Google's products. Prompts carry no student names, IDs or marks, only the question and textbook excerpts.
