-- =====================================================================
-- 010_auth_hardening.sql
-- Enforce must_change_password, login lockout tracking, and purge plain_password_hint
-- =====================================================================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

-- Purge all plain_password_hint occurrences from auth.users metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'plain_password_hint'
WHERE raw_user_meta_data ? 'plain_password_hint';
