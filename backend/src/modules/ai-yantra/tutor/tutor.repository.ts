import { randomUUID } from 'node:crypto';
import { PoolClient } from 'pg';
import { db } from '../../../config/database';

/** Who owns tutor data: a real student, or a staff member previewing a class. */
export interface Owner {
  studentId: string | null;
  profileId: string;
}

const ownerSql = (o: Owner, col: number, a = '') =>
  o.studentId ? `${a}student_id = $${col}` : `${a}student_id IS NULL AND ${a}profile_id = $${col}`;
const ownerVal = (o: Owner) => o.studentId ?? o.profileId;

export const vecLiteral = (v: number[]) => `[${v.map((x) => x.toFixed(6)).join(',')}]`;

export interface RetrievedChunk {
  id: string;
  content: string;
  kind: 'text' | 'figure';
  page_start: number;
  page_end: number;
  chapter_id: string;
  topic_id: string | null;
  textbook_file_id: string;
  chapter_no: number;
  chapter_title: string;
  book_title: string;
  image_key: string | null;
  page_has_figures: boolean;
  page_figure_description: string | null;
  figure_index: number | null;
  page_figures: { caption: string; image_key: string | null }[] | null;
  sim: number;
}

export class TutorRepository {
  // ---------- scope ----------

  static async getStudentByProfile(institutionId: string, profileId: string) {
    const r = await db.query(
      `SELECT s.id, s.current_class_id AS class_id, c.name AS class_name, c.sequence_order
         FROM students s JOIN classes c ON c.id = s.current_class_id
        WHERE s.institution_id = $1 AND (s.profile_id = $2 OR s.user_id = $2) AND s.deleted_at IS NULL
        LIMIT 1`,
      [institutionId, profileId],
    );
    return r.rows[0] ?? null;
  }

  static async getClass(institutionId: string, classId: string) {
    const r = await db.query(
      `SELECT id AS class_id, name AS class_name, sequence_order FROM classes WHERE institution_id = $1 AND id = $2`,
      [institutionId, classId],
    );
    return r.rows[0] ?? null;
  }

  /** (class, subject) pairs a faculty member teaches, from current faculty_assignments. */
  static async getFacultyScope(institutionId: string, profileId: string): Promise<{ class_id: string; subject_id: string }[]> {
    const r = await db.query(
      `SELECT DISTINCT sec.class_id, fa.subject_id
         FROM faculty_assignments fa
         JOIN staff st ON st.id = fa.staff_id
         JOIN sections sec ON sec.id = fa.section_id
        WHERE fa.institution_id = $1 AND st.profile_id = $2
          AND (fa.effective_to IS NULL OR fa.effective_to >= CURRENT_DATE)`,
      [institutionId, profileId],
    );
    return r.rows;
  }

  static async listClassesWithBooks(institutionId: string) {
    const r = await db.query(
      `SELECT c.id, c.name, c.sequence_order, count(tf.id) FILTER (WHERE tf.status = 'published')::int AS published_books
         FROM classes c
         LEFT JOIN textbook_files tf ON tf.class_id = c.id AND tf.institution_id = c.institution_id
        WHERE c.institution_id = $1
        GROUP BY c.id ORDER BY c.sequence_order, c.name`,
      [institutionId],
    );
    return r.rows;
  }

  static async listSubjectsForClass(institutionId: string, classId: string) {
    const r = await db.query(
      `SELECT DISTINCT s.id, s.name, s.code
         FROM subjects s
         LEFT JOIN grade_subjects gs ON gs.subject_id = s.id AND gs.class_id = $2
         LEFT JOIN class_subjects cs ON cs.subject_id = s.id AND cs.class_id = $2
        WHERE s.institution_id = $1 AND (gs.id IS NOT NULL OR cs.class_id IS NOT NULL)
        ORDER BY s.name`,
      [institutionId, classId],
    );
    return r.rows;
  }

  /** Published books → in-syllabus chapters → topics for one class (the student's whole syllabus). */
  static async getSyllabus(institutionId: string, classId: string) {
    const r = await db.query(
      `SELECT tf.id AS book_id, tf.title AS book_title, tf.subject_id, sub.name AS subject_name,
              ch.id AS chapter_id, ch.chapter_no, ch.title AS chapter_title,
              COALESCE(json_agg(json_build_object('id', t.id, 'title', t.title) ORDER BY t.sort_order)
                       FILTER (WHERE t.id IS NOT NULL), '[]') AS topics
         FROM textbook_files tf
         JOIN subjects sub ON sub.id = tf.subject_id
         JOIN textbook_chapters ch ON ch.textbook_file_id = tf.id AND ch.in_syllabus
         LEFT JOIN textbook_topics t ON t.chapter_id = ch.id
        WHERE tf.institution_id = $1 AND tf.class_id = $2 AND tf.status = 'published'
        GROUP BY tf.id, sub.name, ch.id
        ORDER BY sub.name, tf.title, ch.chapter_no`,
      [institutionId, classId],
    );
    return r.rows;
  }

  static async publishedBookIds(institutionId: string, classId: string, subjectId?: string | null): Promise<string[]> {
    const r = await db.query(
      `SELECT id FROM textbook_files
        WHERE institution_id = $1 AND class_id = $2 AND status = 'published' AND ($3::uuid IS NULL OR subject_id = $3)`,
      [institutionId, classId, subjectId ?? null],
    );
    return r.rows.map((x) => x.id);
  }

  /** Hybrid (vector + keyword) retrieval fused with reciprocal rank, fenced to in-syllabus chapters. */
  static async retrieve(
    institutionId: string,
    bookIds: string[],
    queryVec: number[],
    queryText: string,
    opts: { chapterId?: string | null; topicIds?: string[]; limit?: number } = {},
  ): Promise<RetrievedChunk[]> {
    if (!bookIds.length) return [];
    const r = await db.query(
      `WITH scope AS (
         SELECT c.* FROM textbook_chunks c
           JOIN textbook_chapters ch ON ch.id = c.chapter_id
          WHERE c.institution_id = $1 AND c.textbook_file_id = ANY($2::uuid[]) AND ch.in_syllabus
            AND ($3::uuid IS NULL OR c.chapter_id = $3)
            AND (cardinality($7::uuid[]) = 0 OR c.topic_id = ANY($7::uuid[]))
       ),
       vec AS (
         SELECT id, 1 - (embedding <=> $4::halfvec) AS sim,
                row_number() OVER (ORDER BY embedding <=> $4::halfvec) AS r
           FROM scope WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $4::halfvec LIMIT 40
       ),
       kw AS (
         SELECT s.id, row_number() OVER (ORDER BY ts_rank_cd(s.tsv, q) DESC) AS r
           FROM scope s, websearch_to_tsquery('english', $5) q
          WHERE s.tsv @@ q
          ORDER BY ts_rank_cd(s.tsv, q) DESC LIMIT 40
       )
       SELECT s.id, s.content, s.kind, s.page_start, s.page_end, s.chapter_id, s.topic_id, s.textbook_file_id,
              ch.chapter_no, ch.title AS chapter_title, tf.title AS book_title, p.image_key,
              COALESCE(p.has_figures, false) AS page_has_figures, p.figure_description AS page_figure_description,
              s.figure_index, p.figures AS page_figures,
              COALESCE(vec.sim, 0) AS sim
         FROM scope s
         JOIN textbook_chapters ch ON ch.id = s.chapter_id
         JOIN textbook_files tf ON tf.id = s.textbook_file_id
         LEFT JOIN textbook_pages p ON p.textbook_file_id = s.textbook_file_id AND p.page_no = s.page_start
         LEFT JOIN vec ON vec.id = s.id
         LEFT JOIN kw ON kw.id = s.id
        WHERE vec.id IS NOT NULL OR kw.id IS NOT NULL
        ORDER BY COALESCE(1.0 / (60 + vec.r), 0) + COALESCE(1.0 / (60 + kw.r), 0) DESC
        LIMIT $6`,
      [institutionId, bookIds, opts.chapterId ?? null, vecLiteral(queryVec), queryText, opts.limit ?? 8, opts.topicIds ?? []],
    );
    return r.rows.map((x) => ({ ...x, sim: Number(x.sim) }));
  }

  // ---------- textbooks (staff) ----------

  static async createTextbook(
    institutionId: string,
    d: { academicYearId: string | null; classId: string; subjectId: string; preferredTextbookId: string | null; title: string; uploadedBy: string },
  ) {
    const r = await db.query(
      `INSERT INTO textbook_files (institution_id, academic_year_id, class_id, subject_id, preferred_textbook_id, title, storage_key, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $8, $7)
       RETURNING *`,
      [institutionId, d.academicYearId, d.classId, d.subjectId, d.preferredTextbookId, d.title, d.uploadedBy,
       `${institutionId}/textbooks/${randomUUID()}.pdf`],
    );
    return r.rows[0];
  }

  static async listTextbooks(institutionId: string, f: { classId?: string; subjectId?: string; pairs?: { class_id: string; subject_id: string }[] }) {
    const params: any[] = [institutionId, f.classId ?? null, f.subjectId ?? null];
    let pairFilter = '';
    if (f.pairs) {
      params.push(f.pairs.map((p) => `${p.class_id}:${p.subject_id}`));
      pairFilter = `AND (tf.class_id::text || ':' || tf.subject_id::text) = ANY($4::text[])`;
    }
    const r = await db.query(
      `SELECT tf.id, tf.title, tf.class_id, c.name AS class_name, tf.subject_id, s.name AS subject_name,
              tf.status, tf.page_count, tf.processed_pages, tf.error, tf.created_at, tf.updated_at,
              (SELECT count(*) FROM textbook_chapters ch WHERE ch.textbook_file_id = tf.id)::int AS chapter_count
         FROM textbook_files tf
         JOIN classes c ON c.id = tf.class_id
         JOIN subjects s ON s.id = tf.subject_id
        WHERE tf.institution_id = $1 AND ($2::uuid IS NULL OR tf.class_id = $2) AND ($3::uuid IS NULL OR tf.subject_id = $3) ${pairFilter}
        ORDER BY c.sequence_order, c.name, s.name, tf.created_at DESC`,
      params,
    );
    return r.rows;
  }

  static async getTextbook(institutionId: string, id: string) {
    const r = await db.query(`SELECT * FROM textbook_files WHERE institution_id = $1 AND id = $2`, [institutionId, id]);
    return r.rows[0] ?? null;
  }

  static async getChapters(institutionId: string, textbookId: string) {
    const r = await db.query(
      `SELECT ch.id, ch.chapter_no, ch.title, ch.start_page, ch.end_page, ch.in_syllabus,
              COALESCE(json_agg(json_build_object('id', t.id, 'title', t.title) ORDER BY t.sort_order)
                       FILTER (WHERE t.id IS NOT NULL), '[]') AS topics,
              (SELECT count(*) FROM textbook_chunks k WHERE k.chapter_id = ch.id)::int AS chunk_count
         FROM textbook_chapters ch
         LEFT JOIN textbook_topics t ON t.chapter_id = ch.id
        WHERE ch.institution_id = $1 AND ch.textbook_file_id = $2
        GROUP BY ch.id ORDER BY ch.chapter_no`,
      [institutionId, textbookId],
    );
    return r.rows;
  }

  static async updateChapters(institutionId: string, textbookId: string, chapters: { id: string; title: string; inSyllabus: boolean }[]) {
    await db.transaction(async (client) => {
      for (const c of chapters) {
        await client.query(
          `UPDATE textbook_chapters SET title = $4, in_syllabus = $5
            WHERE institution_id = $1 AND textbook_file_id = $2 AND id = $3`,
          [institutionId, textbookId, c.id, c.title, c.inSyllabus],
        );
      }
    });
  }

  static async setStatus(institutionId: string, id: string, status: string, extra: { error?: string | null; fileSha256?: string } = {}) {
    await db.query(
      `UPDATE textbook_files
          SET status = $3, error = $4, file_sha256 = COALESCE($5, file_sha256),
              updated_at = CASE WHEN $3 = 'processing' THEN now() - interval '1 hour' ELSE now() END
        WHERE institution_id = $1 AND id = $2`,
      [institutionId, id, status, extra.error ?? null, extra.fileSha256 ?? null],
    );
  }

  /** Clears processed output so a re-uploaded file is processed from scratch. */
  static async resetProcessing(institutionId: string, id: string) {
    await db.transaction(async (client) => {
      await client.query(`DELETE FROM textbook_chapters WHERE institution_id = $1 AND textbook_file_id = $2`, [institutionId, id]);
      await client.query(`DELETE FROM textbook_pages WHERE institution_id = $1 AND textbook_file_id = $2`, [institutionId, id]);
      await client.query(`UPDATE textbook_files SET processed_pages = 0, page_count = NULL WHERE institution_id = $1 AND id = $2`, [institutionId, id]);
    });
  }

  static async deleteTextbook(institutionId: string, id: string) {
    const r = await db.query(
      `DELETE FROM textbook_files WHERE institution_id = $1 AND id = $2 RETURNING storage_key, class_id`,
      [institutionId, id],
    );
    return r.rows[0] ?? null;
  }

  static async pageImageKeys(institutionId: string, textbookId: string): Promise<string[]> {
    const r = await db.query(
      `SELECT image_key FROM textbook_pages WHERE institution_id = $1 AND textbook_file_id = $2 AND image_key IS NOT NULL`,
      [institutionId, textbookId],
    );
    return r.rows.map((x) => x.image_key);
  }

  static async getPage(institutionId: string, textbookId: string, pageNo: number) {
    const r = await db.query(
      `SELECT p.page_no, p.image_key, p.figure_description, p.figures, tf.class_id, tf.subject_id, tf.status
         FROM textbook_pages p JOIN textbook_files tf ON tf.id = p.textbook_file_id
        WHERE p.institution_id = $1 AND p.textbook_file_id = $2 AND p.page_no = $3`,
      [institutionId, textbookId, pageNo],
    );
    return r.rows[0] ?? null;
  }

  static async clearAnswerCache(institutionId: string, classId: string) {
    await db.query(`DELETE FROM tutor_answer_cache WHERE institution_id = $1 AND class_id = $2`, [institutionId, classId]);
  }

  // ---------- ingestion worker ----------

  /** Claims one textbook to process: new uploads, or ones whose worker stopped heart-beating. */
  static async claimNextTextbook() {
    const r = await db.query(
      `UPDATE textbook_files SET updated_at = now()
        WHERE id = (SELECT id FROM textbook_files
                     WHERE status = 'processing' AND updated_at < now() - interval '3 minutes'
                     ORDER BY updated_at LIMIT 1 FOR UPDATE SKIP LOCKED)
        RETURNING *`,
    );
    return r.rows[0] ?? null;
  }

  static async heartbeat(id: string, processedPages: number, pageCount?: number) {
    await db.query(
      `UPDATE textbook_files SET updated_at = now(), processed_pages = $2, page_count = COALESCE($3, page_count) WHERE id = $1`,
      [id, processedPages, pageCount ?? null],
    );
  }

  static async getPages(textbookId: string) {
    const r = await db.query(
      `SELECT page_no, text_content, figure_description, has_figures, figures FROM textbook_pages WHERE textbook_file_id = $1 ORDER BY page_no`,
      [textbookId],
    );
    return r.rows as { page_no: number; text_content: string; figure_description: string | null; has_figures: boolean; figures: unknown[] }[];
  }

  static async upsertPage(
    institutionId: string,
    textbookId: string,
    p: { pageNo: number; text: string; imageKey: string | null; hasFigures: boolean; figureDescription: string | null; figures: unknown[]; ocrUsed: boolean },
  ) {
    await db.query(
      `INSERT INTO textbook_pages (institution_id, textbook_file_id, page_no, text_content, image_key, has_figures, figure_description, figures, ocr_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (textbook_file_id, page_no) DO UPDATE
         SET text_content = EXCLUDED.text_content, image_key = EXCLUDED.image_key, has_figures = EXCLUDED.has_figures,
             figure_description = EXCLUDED.figure_description, figures = EXCLUDED.figures, ocr_used = EXCLUDED.ocr_used`,
      [institutionId, textbookId, p.pageNo, p.text, p.imageKey, p.hasFigures, p.figureDescription, JSON.stringify(p.figures), p.ocrUsed],
    );
  }

  /** Replaces chapters/topics/chunks for a textbook in one transaction. */
  static async replaceStructure(
    institutionId: string,
    textbookId: string,
    chapters: {
      chapterNo: number; title: string; startPage: number; endPage: number;
      topics: { title: string; startPage: number }[];
      chunks: { pageStart: number; pageEnd: number; kind: 'text' | 'figure'; content: string; figureIndex: number | null; topicIndex: number | null; embedding: number[] }[];
    }[],
    embeddingModel: string,
  ) {
    await db.transaction(async (client: PoolClient) => {
      await client.query(`DELETE FROM textbook_chapters WHERE textbook_file_id = $1`, [textbookId]);
      for (const ch of chapters) {
        const chRow = await client.query(
          `INSERT INTO textbook_chapters (institution_id, textbook_file_id, chapter_no, title, start_page, end_page)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [institutionId, textbookId, ch.chapterNo, ch.title, ch.startPage, ch.endPage],
        );
        const chapterId = chRow.rows[0].id;
        const topicIds: string[] = [];
        for (const [i, t] of ch.topics.entries()) {
          const tr = await client.query(
            `INSERT INTO textbook_topics (institution_id, chapter_id, title, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`,
            [institutionId, chapterId, t.title, i],
          );
          topicIds.push(tr.rows[0].id);
        }
        for (const k of ch.chunks) {
          await client.query(
            `INSERT INTO textbook_chunks (institution_id, textbook_file_id, chapter_id, topic_id, page_start, page_end, kind, content, figure_index, embedding, embedding_model)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::halfvec, $11)`,
            [institutionId, textbookId, chapterId, k.topicIndex === null ? null : topicIds[k.topicIndex] ?? null,
             k.pageStart, k.pageEnd, k.kind, k.content, k.figureIndex, vecLiteral(k.embedding), embeddingModel],
          );
        }
      }
    });
  }

  /** Same PDF already processed (any institution)? Its rows can be copied instead of re-running AI. */
  static async findProcessedTwin(sha: string, excludeId: string) {
    const r = await db.query(
      `SELECT id, page_count FROM textbook_files
        WHERE file_sha256 = $1 AND id <> $2 AND status IN ('review', 'published')
        ORDER BY created_at LIMIT 1`,
      [sha, excludeId],
    );
    return r.rows[0] ?? null;
  }

  /** Copies pages/chapters/topics/chunks of a processed twin into this institution's textbook. */
  static async copyFromTwin(institutionId: string, textbookId: string, twinId: string) {
    await db.transaction(async (client) => {
      await client.query(`DELETE FROM textbook_chapters WHERE textbook_file_id = $1`, [textbookId]);
      await client.query(`DELETE FROM textbook_pages WHERE textbook_file_id = $1`, [textbookId]);
      await client.query(
        `INSERT INTO textbook_pages (institution_id, textbook_file_id, page_no, text_content, image_key, has_figures, figure_description, figures, ocr_used)
         SELECT $1, $2, page_no, text_content, NULL, has_figures, figure_description,
                COALESCE((SELECT jsonb_agg(f || '{"image_key": null}') FROM jsonb_array_elements(figures) f), '[]'), ocr_used
           FROM textbook_pages WHERE textbook_file_id = $3`,
        [institutionId, textbookId, twinId],
      );
      await client.query(
        `CREATE TEMP TABLE _ch ON COMMIT DROP AS
           SELECT id AS old_id, gen_random_uuid() AS new_id, chapter_no, title, start_page, end_page FROM textbook_chapters WHERE textbook_file_id = $1`,
        [twinId],
      );
      await client.query(
        `INSERT INTO textbook_chapters (id, institution_id, textbook_file_id, chapter_no, title, start_page, end_page)
         SELECT new_id, $1, $2, chapter_no, title, start_page, end_page FROM _ch`,
        [institutionId, textbookId],
      );
      await client.query(
        `CREATE TEMP TABLE _tp ON COMMIT DROP AS
           SELECT t.id AS old_id, gen_random_uuid() AS new_id, c.new_id AS chapter_id, t.title, t.sort_order
             FROM textbook_topics t JOIN _ch c ON c.old_id = t.chapter_id`,
      );
      await client.query(
        `INSERT INTO textbook_topics (id, institution_id, chapter_id, title, sort_order)
         SELECT new_id, $1, chapter_id, title, sort_order FROM _tp`,
        [institutionId],
      );
      await client.query(
        `INSERT INTO textbook_chunks (institution_id, textbook_file_id, chapter_id, topic_id, page_start, page_end, kind, content, figure_index, embedding, embedding_model)
         SELECT $1, $2, c.new_id, tp.new_id, k.page_start, k.page_end, k.kind, k.content, k.figure_index, k.embedding, k.embedding_model
           FROM textbook_chunks k JOIN _ch c ON c.old_id = k.chapter_id LEFT JOIN _tp tp ON tp.old_id = k.topic_id
          WHERE k.textbook_file_id = $3`,
        [institutionId, textbookId, twinId],
      );
    });
  }

  static async setPageImage(textbookId: string, pageNo: number, imageKey: string, figures?: unknown[]) {
    await db.query(
      `UPDATE textbook_pages SET image_key = $3, figures = COALESCE($4::jsonb, figures) WHERE textbook_file_id = $1 AND page_no = $2`,
      [textbookId, pageNo, imageKey, figures ? JSON.stringify(figures) : null],
    );
  }

  // ---------- sessions & messages ----------

  static async createSession(institutionId: string, o: Owner, d: { classId: string; subjectId: string | null; chapterId: string | null; title: string }) {
    const r = await db.query(
      `INSERT INTO tutor_sessions (institution_id, student_id, profile_id, class_id, subject_id, chapter_id, title)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [institutionId, o.studentId, o.profileId, d.classId, d.subjectId, d.chapterId, d.title],
    );
    return r.rows[0];
  }

  static async getSession(institutionId: string, o: Owner, id: string) {
    const r = await db.query(
      `SELECT * FROM tutor_sessions WHERE institution_id = $1 AND id = $2 AND ${ownerSql(o, 3)}`,
      [institutionId, id, ownerVal(o)],
    );
    return r.rows[0] ?? null;
  }

  static async listSessions(institutionId: string, o: Owner, classId: string) {
    const r = await db.query(
      `SELECT s.id, s.title, s.subject_id, s.chapter_id, s.started_at,
              (SELECT max(created_at) FROM tutor_messages m WHERE m.tutor_session_id = s.id) AS last_message_at
         FROM tutor_sessions s
        WHERE s.institution_id = $1 AND s.class_id = $3 AND ${ownerSql(o, 2)}
        ORDER BY COALESCE((SELECT max(created_at) FROM tutor_messages m WHERE m.tutor_session_id = s.id), s.started_at) DESC
        LIMIT 30`,
      [institutionId, ownerVal(o), classId],
    );
    return r.rows;
  }

  static async listMessages(institutionId: string, sessionId: string, limit = 200) {
    const r = await db.query(
      `SELECT id, sender, content, citations, figures, scope_verdict, action, created_at
         FROM tutor_messages WHERE institution_id = $1 AND tutor_session_id = $2
        ORDER BY created_at, id LIMIT $3`,
      [institutionId, sessionId, limit],
    );
    return r.rows;
  }

  static async addMessage(
    institutionId: string,
    sessionId: string,
    m: { sender: 'student' | 'ai'; content: string; citations?: unknown[]; figures?: unknown[]; scopeVerdict?: string | null; action?: unknown; usage?: unknown; provider?: string | null },
  ) {
    const r = await db.query(
      `INSERT INTO tutor_messages (institution_id, tutor_session_id, sender, content, citations, figures, scope_verdict, action, usage, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at`,
      [institutionId, sessionId, m.sender, m.content, JSON.stringify(m.citations ?? []), JSON.stringify(m.figures ?? []),
       m.scopeVerdict ?? null, m.action ? JSON.stringify(m.action) : null, m.usage ? JSON.stringify(m.usage) : null, m.provider ?? null],
    );
    return r.rows[0];
  }

  /** Rolling 24h usage for daily caps. */
  static async usageLast24h(institutionId: string, o: Owner) {
    const r = await db.query(
      `SELECT
         (SELECT count(*) FROM tutor_messages m JOIN tutor_sessions s ON s.id = m.tutor_session_id
           WHERE m.institution_id = $1 AND m.sender = 'student' AND m.created_at > now() - interval '24 hours' AND ${ownerSql(o, 2, 's.')})::int AS messages,
         (SELECT count(*) FROM tutor_quizzes q
           WHERE q.institution_id = $1 AND q.created_at > now() - interval '24 hours' AND ${ownerSql(o, 2, 'q.')})::int AS tests`,
      [institutionId, ownerVal(o)],
    );
    return r.rows[0] as { messages: number; tests: number };
  }

  // ---------- answer reuse ----------

  static async findCachedAnswer(institutionId: string, classId: string, band: string, vec: number[], minSim: number) {
    const r = await db.query(
      `SELECT id, answer, citations, figures, 1 - (embedding <=> $4::halfvec) AS sim
         FROM tutor_answer_cache
        WHERE institution_id = $1 AND class_id = $2 AND band = $3
        ORDER BY embedding <=> $4::halfvec LIMIT 1`,
      [institutionId, classId, band, vecLiteral(vec)],
    );
    const row = r.rows[0];
    if (!row || Number(row.sim) < minSim) return null;
    await db.query(`UPDATE tutor_answer_cache SET hits = hits + 1 WHERE id = $1`, [row.id]);
    return row;
  }

  static async saveCachedAnswer(institutionId: string, d: { classId: string; band: string; question: string; vec: number[]; answer: string; citations: unknown[]; figures: unknown[] }) {
    await db.query(
      `INSERT INTO tutor_answer_cache (institution_id, class_id, band, question, embedding, answer, citations, figures)
       VALUES ($1, $2, $3, $4, $5::halfvec, $6, $7, $8)`,
      [institutionId, d.classId, d.band, d.question, vecLiteral(d.vec), d.answer, JSON.stringify(d.citations), JSON.stringify(d.figures)],
    );
  }

  // ---------- tests ----------

  static async createQuiz(
    institutionId: string,
    o: Owner,
    q: { classId: string; sessionId: string | null; subjectId: string | null; chapterId: string | null; topicIds: string[]; quizType: string; difficulty: string },
    questions: { type: string; question: string; options: string[] | null; answerKey: string; rubric: unknown[]; explanation: string; marks: number; topicId: string | null; sourceChunkIds: string[] }[],
  ) {
    return db.transaction(async (client) => {
      const qr = await client.query(
        `INSERT INTO tutor_quizzes (institution_id, student_id, profile_id, class_id, tutor_session_id, subject_id, chapter_id, topic_ids, quiz_type, difficulty, max_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [institutionId, o.studentId, o.profileId, q.classId, q.sessionId, q.subjectId, q.chapterId, q.topicIds, q.quizType, q.difficulty,
         questions.reduce((s, x) => s + x.marks, 0)],
      );
      const quizId = qr.rows[0].id;
      for (const [i, x] of questions.entries()) {
        await client.query(
          `INSERT INTO tutor_quiz_questions (institution_id, quiz_id, q_no, type, question, options, answer_key, rubric, explanation, marks, topic_id, source_chunk_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [institutionId, quizId, i + 1, x.type, x.question, x.options ? JSON.stringify(x.options) : null, x.answerKey,
           JSON.stringify(x.rubric), x.explanation, x.marks, x.topicId, x.sourceChunkIds],
        );
      }
      return quizId as string;
    });
  }

  static async getQuiz(institutionId: string, o: Owner, id: string) {
    const r = await db.query(
      `SELECT q.*, ch.title AS chapter_title, s.name AS subject_name
         FROM tutor_quizzes q
         LEFT JOIN textbook_chapters ch ON ch.id = q.chapter_id
         LEFT JOIN subjects s ON s.id = q.subject_id
        WHERE q.institution_id = $1 AND q.id = $2 AND ${ownerSql(o, 3, 'q.')}`,
      [institutionId, id, ownerVal(o)],
    );
    return r.rows[0] ?? null;
  }

  static async getQuizQuestions(institutionId: string, quizId: string) {
    const r = await db.query(
      `SELECT qq.*, t.title AS topic_title
         FROM tutor_quiz_questions qq LEFT JOIN textbook_topics t ON t.id = qq.topic_id
        WHERE qq.institution_id = $1 AND qq.quiz_id = $2 ORDER BY qq.q_no`,
      [institutionId, quizId],
    );
    return r.rows;
  }

  static async saveGrades(
    institutionId: string,
    quizId: string,
    graded: { qNo: number; studentAnswer: string; awarded: number; feedback: unknown }[],
    score: number,
    summary: unknown,
  ) {
    await db.transaction(async (client) => {
      for (const g of graded) {
        await client.query(
          `UPDATE tutor_quiz_questions SET student_answer = $4, awarded_marks = $5, feedback = $6
            WHERE institution_id = $1 AND quiz_id = $2 AND q_no = $3`,
          [institutionId, quizId, g.qNo, g.studentAnswer, g.awarded, JSON.stringify(g.feedback)],
        );
      }
      await client.query(
        `UPDATE tutor_quizzes SET status = 'graded', score = $3, summary = $4, graded_at = now() WHERE institution_id = $1 AND id = $2`,
        [institutionId, quizId, score, JSON.stringify(summary)],
      );
    });
  }

  /** Graded answers per topic, oldest first (for mastery). */
  static async gradedTopicHistory(institutionId: string, o: Owner, classId: string) {
    const r = await db.query(
      `SELECT qq.topic_id, qq.awarded_marks, qq.marks, q.graded_at
         FROM tutor_quiz_questions qq JOIN tutor_quizzes q ON q.id = qq.quiz_id
        WHERE q.institution_id = $1 AND q.class_id = $3 AND q.status = 'graded' AND qq.topic_id IS NOT NULL AND ${ownerSql(o, 2, 'q.')}
        ORDER BY q.graded_at, qq.q_no`,
      [institutionId, ownerVal(o), classId],
    );
    return r.rows as { topic_id: string; awarded_marks: string; marks: string; graded_at: string }[];
  }

  static async listQuizzes(institutionId: string, o: Owner, classId: string) {
    const r = await db.query(
      `SELECT q.id, q.quiz_type, q.difficulty, q.status, q.score, q.max_score, q.created_at, q.graded_at,
              ch.title AS chapter_title, s.name AS subject_name
         FROM tutor_quizzes q
         LEFT JOIN textbook_chapters ch ON ch.id = q.chapter_id
         LEFT JOIN subjects s ON s.id = q.subject_id
        WHERE q.institution_id = $1 AND q.class_id = $3 AND ${ownerSql(o, 2, 'q.')}
        ORDER BY q.created_at DESC LIMIT 20`,
      [institutionId, ownerVal(o), classId],
    );
    return r.rows;
  }

  static async saveLearningProfile(institutionId: string, studentId: string, weakTopics: unknown) {
    await db.query(
      `INSERT INTO learning_profiles (institution_id, student_id, weak_topics, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (student_id) DO UPDATE SET weak_topics = EXCLUDED.weak_topics, updated_at = now()`,
      [institutionId, studentId, JSON.stringify(weakTopics)],
    );
  }

  static async chunksByIds(institutionId: string, ids: string[]) {
    const r = await db.query(
      `SELECT k.id, k.page_start, ch.chapter_no, ch.title AS chapter_title
         FROM textbook_chunks k JOIN textbook_chapters ch ON ch.id = k.chapter_id
        WHERE k.institution_id = $1 AND k.id = ANY($2::uuid[])`,
      [institutionId, ids],
    );
    return r.rows;
  }
}
