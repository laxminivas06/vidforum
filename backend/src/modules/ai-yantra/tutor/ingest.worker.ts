/**
 * Textbook ingestion worker. Postgres status is the queue (no Redis): a poller claims one
 * `processing` textbook at a time, works page by page (resumable via processed_pages), then
 * builds chapters → topics → embedded chunks and parks the book in `review` for faculty.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { env } from '../../../config/env';
import { getPrivateObject, putPrivateObject, storageConfigured, ensureBucket } from '../../../utils/object-storage';
import { TutorRepository } from './tutor.repository';
import { describeImage, embed, embeddingModel, generateJson, tutorConfigured } from './llm';
import { CHAPTERS_SYSTEM, ChaptersSchema, FIGURES_PROMPT, FIGURES_SYSTEM, FiguresSchema, OCR_INSTRUCTION, TOPICS_SYSTEM, TopicsSchema } from './prompts';

/** Local working copy, used when Supabase Storage isn't configured (single-instance demo). */
export const localPdfPath = (id: string) => path.join(os.tmpdir(), 'vid-textbooks', `${id}.pdf`);

// pdfjs-dist is ESM-only; load it without TypeScript rewriting import() to require()
const importEsm = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
let pdfjsPromise: Promise<any> | null = null;
function pdfjs() {
  return (pdfjsPromise ??= importEsm('pdfjs-dist/legacy/build/pdf.mjs').then((m) => {
    m.GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
    return m;
  }));
}

const PDFJS_DIR = path.dirname(require.resolve('pdfjs-dist/package.json'));

export async function openPdf(data: Buffer) {
  const lib = await pdfjs();
  return lib.getDocument({
    data: new Uint8Array(data),
    standardFontDataUrl: path.join(PDFJS_DIR, 'standard_fonts') + path.sep,
    cMapUrl: path.join(PDFJS_DIR, 'cmaps') + path.sep,
    cMapPacked: true,
    isEvalSupported: false,
  }).promise;
}

async function pageText(page: any): Promise<string> {
  const content = await page.getTextContent();
  return content.items
    .map((it: any) => (it.str ?? '') + (it.hasEOL ? '\n' : ''))
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Which pages carry a figure worth describing. Images repeated on most pages (scanned page
 * backgrounds, watermarks) are ignored; a page counts when it has its own sizeable image,
 * many image strips (sliced illustrations) or many vector paths (drawn diagrams).
 */
async function figurePages(doc: any, OPS: any): Promise<Set<number>> {
  const perPage: { dims: string[]; paths: number }[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const ops = await page.getOperatorList();
    const dims: string[] = [];
    let paths = 0;
    ops.fnArray.forEach((fn: number, i: number) => {
      if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) {
        const a = ops.argsArray[i];
        dims.push(`${a?.[1] ?? a?.[0]?.width ?? 0}x${a?.[2] ?? a?.[0]?.height ?? 0}`);
      }
      if (fn === OPS.constructPath) paths++;
    });
    perPage.push({ dims, paths });
    page.cleanup();
  }
  const seenOn = new Map<string, number>();
  for (const p of perPage) for (const d of new Set(p.dims)) seenOn.set(d, (seenOn.get(d) ?? 0) + 1);
  const background = (d: string) => perPage.length >= 3 && (seenOn.get(d) ?? 0) >= perPage.length * 0.6;
  const result = new Set<number>();
  perPage.forEach((p, i) => {
    const own = p.dims.filter((d) => !background(d));
    const big = own.some((d) => { const [w, h] = d.split('x').map(Number); return w * h >= 10_000; });
    if (big || own.length > 20 || p.paths > 120) result.add(i + 1);
  });
  return result;
}

async function renderJpeg(page: any): Promise<Buffer> {
  const viewport = page.getViewport({ scale: 1.6 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;
  return canvas.encode('jpeg', 78);
}

const pageImageKey = (institutionId: string, textbookId: string, pageNo: number) =>
  `${institutionId}/textbooks/${textbookId}/p${pageNo}.jpg`;

export interface PageFigure { caption: string; description: string; box: number[]; image_key: string | null }

/** Crops one figure (box_2d = [ymin, xmin, ymax, xmax] on a 0-1000 grid) out of a rendered page. */
async function cropFigure(pageJpeg: Buffer, box: number[]): Promise<Buffer> {
  const img = await loadImage(pageJpeg);
  const [y0, x0, y1, x1] = box.map((v) => Math.min(1000, Math.max(0, v)) / 1000);
  const sx = Math.max(0, (x0 - 0.03) * img.width);
  const sy = Math.max(0, (y0 - 0.015) * img.height);
  const sw = Math.min(img.width, (x1 + 0.03) * img.width) - sx;
  const sh = Math.min(img.height, (y1 + 0.015) * img.height) - sy;
  const canvas = createCanvas(Math.max(1, Math.round(sw)), Math.max(1, Math.round(sh)));
  canvas.getContext('2d').drawImage(img as any, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.encode('jpeg', 85);
}

/** Uploads a crop for every figure that has a box (no-op without storage). */
async function storeFigureCrops(institutionId: string, textbookId: string, pageNo: number, pageJpeg: Buffer, figures: PageFigure[]) {
  for (const [i, f] of figures.entries()) {
    f.image_key = await putPrivateObject(`${institutionId}/textbooks/${textbookId}/p${pageNo}-f${i}.jpg`, await cropFigure(pageJpeg, f.box), 'image/jpeg', env.TEXTBOOK_BUCKET);
  }
}

async function loadPdfBytes(tb: any): Promise<Buffer | null> {
  const stored = await getPrivateObject(tb.storage_key, env.TEXTBOOK_BUCKET);
  if (stored) return stored;
  return fs.readFile(localPdfPath(tb.id)).catch(() => null);
}

// ---------- chunking ----------

interface PageRow { page_no: number; text_content: string; figure_description: string | null }

/** ~1600-char chunks with ~200-char overlap, split on sentence boundaries, tracking source pages. */
export function chunkPages(pages: PageRow[]): { pageStart: number; pageEnd: number; content: string }[] {
  const chunks: { pageStart: number; pageEnd: number; content: string }[] = [];
  let buf = '';
  let start = pages[0]?.page_no ?? 1;
  let end = start;
  const flush = () => {
    const content = buf.trim();
    if (content.length > 40) chunks.push({ pageStart: start, pageEnd: end, content });
    const tail = content.slice(-200);
    buf = tail.includes(' ') ? tail.slice(tail.indexOf(' ') + 1) + ' ' : '';
    start = end;
  };
  for (const p of pages) {
    const sentences = p.text_content.replace(/\s+/g, ' ').split(/(?<=[.!?;:])\s+/);
    for (const s of sentences) {
      if (!s) continue;
      if (!buf.trim()) start = p.page_no;
      buf += s + ' ';
      end = p.page_no;
      if (buf.length >= 1600) flush();
    }
  }
  if (buf.trim().length > 40) chunks.push({ pageStart: start, pageEnd: end, content: buf.trim() });
  return chunks;
}

// ---------- structure ----------

interface ChapterDraft { chapterNo: number; title: string; startPage: number; endPage: number }

async function outlineChapters(doc: any): Promise<{ title: string; startPage: number }[]> {
  const outline = await doc.getOutline().catch(() => null);
  if (!outline?.length) return [];
  const out: { title: string; startPage: number }[] = [];
  for (const item of outline) {
    try {
      const dest = typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest;
      if (!dest?.[0]) continue;
      out.push({ title: String(item.title).trim(), startPage: (await doc.getPageIndex(dest[0])) + 1 });
    } catch { /* unresolvable outline entry */ }
  }
  return out;
}

function finalizeChapters(raw: { title: string; startPage: number }[], pageCount: number, fallbackTitle: string): ChapterDraft[] {
  const sorted = raw
    .filter((c) => c.title && c.startPage >= 1 && c.startPage <= pageCount)
    .sort((a, b) => a.startPage - b.startPage)
    .filter((c, i, arr) => i === 0 || c.startPage !== arr[i - 1].startPage);
  if (!sorted.length) return [{ chapterNo: 1, title: fallbackTitle, startPage: 1, endPage: pageCount }];
  if (sorted[0].startPage > 1 && sorted.length === 1) sorted[0].startPage = 1;
  return sorted.map((c, i) => ({
    chapterNo: i + 1,
    title: c.title.slice(0, 200),
    startPage: c.startPage,
    endPage: i + 1 < sorted.length ? sorted[i + 1].startPage - 1 : pageCount,
  }));
}

async function detectChapters(doc: any, pages: PageRow[], fallbackTitle: string): Promise<ChapterDraft[]> {
  const fromOutline = await outlineChapters(doc);
  if (fromOutline.length >= 2) return finalizeChapters(fromOutline, pages.length, fallbackTitle);
  const heads = pages.map((p) => `[p${p.page_no}] ${p.text_content.replace(/\s+/g, ' ').slice(0, 220)}`).join('\n');
  const res = await generateJson({ system: CHAPTERS_SYSTEM, prompt: heads, schema: ChaptersSchema, tier: 'fast' });
  return finalizeChapters(res.chapters.map((c) => ({ title: c.title, startPage: c.start_pdf_page })), pages.length, fallbackTitle);
}

async function detectTopics(ch: ChapterDraft, pages: PageRow[]): Promise<{ title: string; startPage: number }[]> {
  const text = pages
    .filter((p) => p.page_no >= ch.startPage && p.page_no <= ch.endPage)
    .map((p) => `[p${p.page_no}] ${p.text_content}`)
    .join('\n')
    .slice(0, 150_000);
  if (text.length < 200) return [{ title: ch.title, startPage: ch.startPage }];
  const res = await generateJson({ system: TOPICS_SYSTEM, prompt: `Chapter: ${ch.title}\n\n${text}`, schema: TopicsSchema, tier: 'fast' });
  const topics = res.topics
    .filter((t) => t.title.trim())
    .map((t) => ({ title: t.title.trim().slice(0, 200), startPage: Math.min(Math.max(t.start_pdf_page, ch.startPage), ch.endPage) }))
    .sort((a, b) => a.startPage - b.startPage);
  return topics.length ? topics : [{ title: ch.title, startPage: ch.startPage }];
}

// ---------- pipeline ----------

async function processTextbook(tb: any): Promise<void> {
  const data = await loadPdfBytes(tb);
  if (!data) throw new Error('PDF file not found. Please upload it again.');
  const doc = await openPdf(data);
  const { OPS } = await pdfjs();
  const pageCount: number = doc.numPages;
  const store = storageConfigured();
  if (store) await ensureBucket(env.TEXTBOOK_BUCKET);

  // Same PDF already processed elsewhere: copy its text/structure/embeddings (no AI calls)
  const twin = tb.file_sha256 && tb.processed_pages === 0 ? await TutorRepository.findProcessedTwin(tb.file_sha256, tb.id) : null;
  if (twin) {
    await TutorRepository.copyFromTwin(tb.institution_id, tb.id, twin.id);
    const twinPages = new Map((await TutorRepository.getPages(tb.id)).map((p) => [p.page_no, p]));
    for (let n = 1; n <= pageCount && store; n++) {
      const jpeg = await renderJpeg(await doc.getPage(n));
      const key = await putPrivateObject(pageImageKey(tb.institution_id, tb.id, n), jpeg, 'image/jpeg', env.TEXTBOOK_BUCKET);
      const figures = (twinPages.get(n)?.figures ?? []) as PageFigure[];
      if (figures.length) await storeFigureCrops(tb.institution_id, tb.id, n, jpeg, figures);
      if (key) await TutorRepository.setPageImage(tb.id, n, key, figures);
      await TutorRepository.heartbeat(tb.id, n, pageCount);
    }
    await TutorRepository.heartbeat(tb.id, pageCount, pageCount);
    await TutorRepository.setStatus(tb.institution_id, tb.id, 'review');
    return;
  }

  const withFigures = await figurePages(doc, OPS);
  for (let n = (tb.processed_pages ?? 0) + 1; n <= pageCount; n++) {
    const page = await doc.getPage(n);
    let text = await pageText(page);
    const hasFigures = withFigures.has(n);
    const needsOcr = text.replace(/\s/g, '').length < 40;
    let jpeg: Buffer | null = null;
    if (store || needsOcr || hasFigures) jpeg = await renderJpeg(page);
    let ocrUsed = false;
    if (needsOcr && jpeg) {
      text = await describeImage({ imageJpeg: jpeg, instruction: OCR_INSTRUCTION });
      ocrUsed = true;
    }
    let figures: PageFigure[] = [];
    if (hasFigures && jpeg) {
      const found = await generateJson({
        tier: 'fast', system: FIGURES_SYSTEM, prompt: FIGURES_PROMPT, schema: FiguresSchema,
        images: [{ data: jpeg.toString('base64'), mime: 'image/jpeg' }],
      });
      figures = found.figures
        .filter((f) => f.caption.trim() && f.box_2d[2] - f.box_2d[0] > 30 && f.box_2d[3] - f.box_2d[1] > 30)
        .map((f) => ({ caption: f.caption.trim(), description: f.description.trim(), box: f.box_2d, image_key: null }));
      if (store) await storeFigureCrops(tb.institution_id, tb.id, n, jpeg, figures);
    }
    const figureDescription = figures.map((f) => `${f.caption}: ${f.description}`).join('\n\n') || null;
    const imageKey = store && jpeg ? await putPrivateObject(pageImageKey(tb.institution_id, tb.id, n), jpeg, 'image/jpeg', env.TEXTBOOK_BUCKET) : null;
    await TutorRepository.upsertPage(tb.institution_id, tb.id, { pageNo: n, text, imageKey, hasFigures: figures.length > 0, figureDescription, figures, ocrUsed });
    await TutorRepository.heartbeat(tb.id, n, pageCount);
    page.cleanup();
  }

  const pages = await TutorRepository.getPages(tb.id);
  const chapters = await detectChapters(doc, pages, tb.title);
  const built = [];
  for (const ch of chapters) {
    await TutorRepository.heartbeat(tb.id, pageCount, pageCount);
    const topics = await detectTopics(ch, pages);
    const chPages = pages.filter((p) => p.page_no >= ch.startPage && p.page_no <= ch.endPage);
    const drafts = [
      ...chunkPages(chPages).map((c) => ({ ...c, kind: 'text' as const })),
      ...chPages.flatMap((p) => ((p.figures ?? []) as PageFigure[]).map((f, i) => ({
        pageStart: p.page_no, pageEnd: p.page_no, kind: 'figure' as const, figureIndex: i,
        content: `FIGURE (page ${p.page_no}): ${f.caption} — ${f.description}`,
      }))),
    ];
    const vectors = drafts.length ? await embed(drafts.map((d) => `${ch.title}\n${d.content}`), 'document') : [];
    built.push({
      ...ch,
      topics,
      chunks: drafts.map((d, i) => {
        let topicIndex = 0;
        for (let ti = 0; ti < topics.length; ti++) if (topics[ti].startPage <= d.pageStart) topicIndex = ti;
        return { figureIndex: null, ...d, topicIndex, embedding: vectors[i] };
      }),
    });
  }
  await TutorRepository.replaceStructure(tb.institution_id, tb.id, built, embeddingModel());
  await TutorRepository.setStatus(tb.institution_id, tb.id, 'review');
  await doc.cleanup?.();
  if (store) await fs.rm(localPdfPath(tb.id), { force: true });
}

let busy = false;
let timer: NodeJS.Timeout | null = null;

async function tick() {
  if (busy || !tutorConfigured()) return;
  busy = true;
  let tb: any = null;
  try {
    tb = await TutorRepository.claimNextTextbook();
    if (tb) {
      console.log(`[TUTOR INGEST] processing "${tb.title}" (${tb.id}) from page ${tb.processed_pages + 1}`);
      await processTextbook(tb);
      console.log(`[TUTOR INGEST] "${tb.title}" ready for review`);
    }
  } catch (err: any) {
    console.error('[TUTOR INGEST] failed:', err?.message);
    if (tb) await TutorRepository.setStatus(tb.institution_id, tb.id, 'failed', { error: String(err?.message ?? err).slice(0, 500) }).catch(() => {});
  } finally {
    busy = false;
  }
}

/** Starts the poller (idempotent). Fail-open: idles when the AI key is missing. */
export function startTextbookWorker(): void {
  if (timer) return;
  timer = setInterval(() => void tick(), 5000);
  timer.unref();
  if (!tutorConfigured()) console.warn('[TUTOR INGEST] GEMINI_API_KEY not set — textbook processing is paused');
}
