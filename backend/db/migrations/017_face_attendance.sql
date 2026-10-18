-- Migration 016: Face Attendance (on-device recognition, offline sync, terminal push)
-- Extends the Yantra AI Attendance tables (schema.sql §945) for real use:
--   * single-photo enrollment with optional photo storage (fail-open)
--   * teacher-verified templates learned after submission
--   * per-device API keys for dedicated biometric terminals
--   * idempotent offline event sync (client_event_id)

ALTER TABLE face_profiles
  ALTER COLUMN reference_photo_storage_key DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_face_profiles_institution ON face_profiles (institution_id);

ALTER TABLE face_embeddings
  ADD COLUMN IF NOT EXISTS quality numeric(4,3),
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'enrolled'
    CHECK (kind IN ('enrolled', 'verified'));

CREATE INDEX IF NOT EXISTS idx_face_embeddings_profile ON face_embeddings (face_profile_id, kind, created_at);

ALTER TABLE camera_devices
  ADD COLUMN IF NOT EXISTS device_type text NOT NULL DEFAULT 'web'
    CHECK (device_type IN ('web', 'terminal')),
  ADD COLUMN IF NOT EXISTS api_key_hash text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER TABLE ai_attendance_events
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_event_id uuid UNIQUE;

CREATE INDEX IF NOT EXISTS idx_ai_attendance_events_inst_time ON ai_attendance_events (institution_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_ai_attendance_events_student ON ai_attendance_events (student_id, detected_at);
