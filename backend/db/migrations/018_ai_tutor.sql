-- Migration 018: Yantra AI Tutor (syllabus-locked, textbook-grounded)
-- Extends the tutor tables from schema.sql §989:
--   * uploaded textbook PDFs -> pages -> chapters/topics -> embedded chunks (pgvector)
--   * tutor sessions/messages with citations, figures and scope verdicts
--   * generated tests (answer keys stay server-side) and per-topic mastery
--   * staff "preview as class" sessions (profile_id, no student row)

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS textbook_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  preferred_textbook_id uuid REFERENCES preferred_textbooks(id) ON DELETE SET NULL,
  title text NOT NULL,
  storage_key text NOT NULL,
  file_sha256 text,
  page_count int,
  processed_pages int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'review', 'published', 'failed')),
  error text,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, storage_key)
);
CREATE INDEX IF NOT EXISTS idx_textbook_files_scope ON textbook_files (institution_id, class_id, subject_id, status);
CREATE INDEX IF NOT EXISTS idx_textbook_files_queue ON textbook_files (status, updated_at);
CREATE INDEX IF NOT EXISTS idx_textbook_files_sha ON textbook_files (file_sha256);

CREATE TABLE IF NOT EXISTS textbook_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  textbook_file_id uuid NOT NULL REFERENCES textbook_files(id) ON DELETE CASCADE,
  chapter_no int NOT NULL,
  title text NOT NULL,
  start_page int NOT NULL,
  end_page int NOT NULL,
  in_syllabus boolean NOT NULL DEFAULT true,
  UNIQUE (textbook_file_id, chapter_no)
);
CREATE INDEX IF NOT EXISTS idx_textbook_chapters_inst ON textbook_chapters (institution_id, textbook_file_id);

CREATE TABLE IF NOT EXISTS textbook_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  chapter_id uuid NOT NULL REFERENCES textbook_chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_textbook_topics_chapter ON textbook_topics (institution_id, chapter_id, sort_order);

CREATE TABLE IF NOT EXISTS textbook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  textbook_file_id uuid NOT NULL REFERENCES textbook_files(id) ON DELETE CASCADE,
  page_no int NOT NULL,
  text_content text NOT NULL DEFAULT '',
  image_key text,
  has_figures boolean NOT NULL DEFAULT false,
  figure_description text,
  ocr_used boolean NOT NULL DEFAULT false,
  UNIQUE (textbook_file_id, page_no)
);
CREATE INDEX IF NOT EXISTS idx_textbook_pages_inst ON textbook_pages (institution_id, textbook_file_id);

CREATE TABLE IF NOT EXISTS textbook_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  textbook_file_id uuid NOT NULL REFERENCES textbook_files(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES textbook_chapters(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES textbook_topics(id) ON DELETE SET NULL,
  page_start int NOT NULL,
  page_end int NOT NULL,
  kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'figure')),
  content text NOT NULL,
  embedding halfvec(768),
  embedding_model text,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);
CREATE INDEX IF NOT EXISTS idx_textbook_chunks_file ON textbook_chunks (institution_id, textbook_file_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_textbook_chunks_tsv ON textbook_chunks USING gin (tsv);

-- Sessions: students own them; staff previews carry profile_id + the previewed class instead
ALTER TABLE tutor_sessions
  ALTER COLUMN student_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES textbook_chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS title text;
DO $$ BEGIN
  ALTER TABLE tutor_sessions ADD CONSTRAINT tutor_sessions_owner_chk CHECK (student_id IS NOT NULL OR profile_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_owner ON tutor_sessions (institution_id, student_id, profile_id, started_at DESC);

ALTER TABLE tutor_messages
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES institutions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS citations jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS figures jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS scope_verdict text,
  ADD COLUMN IF NOT EXISTS action jsonb,
  ADD COLUMN IF NOT EXISTS usage jsonb,
  ADD COLUMN IF NOT EXISTS provider text;
UPDATE tutor_messages m SET institution_id = s.institution_id
  FROM tutor_sessions s WHERE s.id = m.tutor_session_id AND m.institution_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_tutor_messages_session ON tutor_messages (tutor_session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_inst_time ON tutor_messages (institution_id, created_at);

-- Reuse of near-identical questions per class + tone band (saves model calls)
CREATE TABLE IF NOT EXISTS tutor_answer_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  band text NOT NULL,
  question text NOT NULL,
  embedding halfvec(768) NOT NULL,
  answer text NOT NULL,
  citations jsonb NOT NULL DEFAULT '[]',
  figures jsonb NOT NULL DEFAULT '[]',
  hits int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tutor_answer_cache_scope ON tutor_answer_cache (institution_id, class_id, band);

CREATE TABLE IF NOT EXISTS tutor_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  tutor_session_id uuid REFERENCES tutor_sessions(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id uuid REFERENCES textbook_chapters(id) ON DELETE SET NULL,
  topic_ids uuid[] NOT NULL DEFAULT '{}',
  quiz_type text NOT NULL CHECK (quiz_type IN ('mcq', 'short', 'long', 'mixed')),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'submitted', 'graded')),
  score numeric,
  max_score numeric,
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  CHECK (student_id IS NOT NULL OR profile_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_tutor_quizzes_owner ON tutor_quizzes (institution_id, student_id, profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tutor_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  quiz_id uuid NOT NULL REFERENCES tutor_quizzes(id) ON DELETE CASCADE,
  q_no int NOT NULL,
  type text NOT NULL CHECK (type IN ('mcq', 'short', 'long')),
  question text NOT NULL,
  options jsonb,
  answer_key text NOT NULL,
  rubric jsonb NOT NULL DEFAULT '[]',
  marks numeric NOT NULL CHECK (marks > 0),
  topic_id uuid REFERENCES textbook_topics(id) ON DELETE SET NULL,
  source_chunk_ids uuid[] NOT NULL DEFAULT '{}',
  student_answer text,
  awarded_marks numeric,
  feedback jsonb,
  UNIQUE (quiz_id, q_no)
);
ALTER TABLE tutor_quiz_questions ADD COLUMN IF NOT EXISTS explanation text;

-- Row-level security, same institution pattern as schema.sql (backend connects as the DB owner)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['textbook_files','textbook_chapters','textbook_topics','textbook_pages',
                           'textbook_chunks','tutor_answer_cache','tutor_quizzes','tutor_quiz_questions'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    BEGIN
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (institution_id IN (SELECT public.my_institution_ids()))', t || '_tenant_select', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Cropped figures per page ([{caption, description, image_key}]) and which figure a FIGURE chunk describes
ALTER TABLE textbook_pages ADD COLUMN IF NOT EXISTS figures jsonb NOT NULL DEFAULT '[]';
ALTER TABLE textbook_chunks ADD COLUMN IF NOT EXISTS figure_index int;
