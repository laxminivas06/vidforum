import express, { Request, Response, Router } from 'express';
import { sendError, sendSuccess } from '../../../utils/api-response';
import {
  ask, createQuiz, createSession, createTextbook, deleteTextbook, getPageImage, getQuiz, getSessionMessages, getSyllabus,
  getTextbookDetail, listQuizzes, listTextbooks, MAX_PDF_BYTES, publishTextbook, reprocessTextbook, resolveContext,
  staffOptions, submitQuiz, TutorError, updateTextbookChapters, uploadTextbookFile,
} from './tutor.service';
import { TutorRepository } from './tutor.repository';

// Mounted at /api/v1/ai-yantra/tutor behind authMiddleware (req.user + req.institutionId from the JWT)
const router = Router();

function fail(res: Response, err: any) {
  if (err instanceof TutorError) return sendError(res, err.message, err.status, err.code);
  console.error('[AI TUTOR]', err);
  return sendError(res, 'Something went wrong in the AI Tutor', 500, 'TUTOR_ERROR');
}

const h = (fn: (req: Request) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    sendSuccess(res, await fn(req));
  } catch (err) {
    fail(res, err);
  }
};

/** Students get their own class; staff pass ?classId= to preview a class. */
const ctxOf = (req: Request) =>
  resolveContext(req.user!, req.institutionId!, (req.query.classId as string) || (req.body?.classId as string) || undefined);

// ---------- learner (student, or staff previewing a class) ----------

router.get('/me/syllabus', h(async (req) => getSyllabus(await ctxOf(req))));

router.get('/sessions', h(async (req) => {
  const ctx = await ctxOf(req);
  return TutorRepository.listSessions(ctx.institutionId, ctx.owner, ctx.classId);
}));

router.post('/sessions', h(async (req) => createSession(await ctxOf(req), req.body ?? {})));

router.get('/sessions/:id/messages', h(async (req) => getSessionMessages(await ctxOf(req), String(req.params.id))));

// Server-Sent Events: status → delta* → done (or error)
router.post('/sessions/:id/ask', async (req: Request, res: Response) => {
  let ctx;
  try {
    ctx = await ctxOf(req);
  } catch (err) {
    return fail(res, err);
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const emit = (event: string, data: unknown) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  try {
    await ask(ctx, String(req.params.id), { message: String(req.body?.message ?? ''), mode: req.body?.mode }, emit);
  } catch (err: any) {
    if (!(err instanceof TutorError)) console.error('[AI TUTOR] ask failed:', err);
    emit('error', err instanceof TutorError ? { message: err.message, code: err.code, status: err.status } : { message: 'The tutor hit a problem. Please try again.', code: 'TUTOR_ERROR', status: 500 });
  } finally {
    res.end();
  }
});

router.get('/pages/:bookId/:pageNo', h(async (req) =>
  getPageImage(await ctxOf(req), String(req.params.bookId), Number(String(req.params.pageNo)), req.query.figure === undefined ? undefined : Number(req.query.figure))));

router.get('/quizzes', h(async (req) => listQuizzes(await ctxOf(req))));
router.post('/quizzes', h(async (req) => createQuiz(await ctxOf(req), req.body ?? {})));
router.get('/quizzes/:id', h(async (req) => getQuiz(await ctxOf(req), String(req.params.id))));
router.post('/quizzes/:id/submit', h(async (req) => submitQuiz(await ctxOf(req), String(req.params.id), req.body?.answers ?? {})));

// ---------- staff: textbook management ----------

router.get('/staff/options', h(async (req) => staffOptions(req.user!, req.institutionId!)));

router.get('/textbooks', h(async (req) =>
  listTextbooks(req.user!, req.institutionId!, { classId: req.query.classId as string, subjectId: req.query.subjectId as string })));

router.post('/textbooks', h(async (req) => createTextbook(req.user!, req.institutionId!, req.body ?? {})));

router.get('/textbooks/:id', h(async (req) => getTextbookDetail(req.user!, req.institutionId!, String(req.params.id))));

// Raw PDF body (the global JSON parser caps bodies at 10 MB)
router.put('/textbooks/:id/file', express.raw({ type: 'application/pdf', limit: MAX_PDF_BYTES }),
  h(async (req) => uploadTextbookFile(req.user!, req.institutionId!, String(req.params.id), req.body as Buffer)));

router.post('/textbooks/:id/reprocess', h(async (req) => reprocessTextbook(req.user!, req.institutionId!, String(req.params.id))));

router.put('/textbooks/:id/chapters', h(async (req) =>
  updateTextbookChapters(req.user!, req.institutionId!, String(req.params.id), req.body?.chapters)));

router.post('/textbooks/:id/publish', h(async (req) => publishTextbook(req.user!, req.institutionId!, String(req.params.id))));

router.delete('/textbooks/:id', h(async (req) => deleteTextbook(req.user!, req.institutionId!, String(req.params.id))));

export default router;
