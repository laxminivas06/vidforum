-- Migration 016: AI Voice Guardian Preferences & Opt-Out Support
ALTER TABLE guardians
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'te-IN',
ADD COLUMN IF NOT EXISTS do_not_call BOOLEAN DEFAULT FALSE;

-- Ensure ai_voice_recipients has retry and status tracking
ALTER TABLE ai_voice_recipients
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'queued',
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ;

-- Add index for efficient sequential worker pickup
CREATE INDEX IF NOT EXISTS idx_voice_recipients_worker ON ai_voice_recipients (campaign_id, status, next_retry_at);
