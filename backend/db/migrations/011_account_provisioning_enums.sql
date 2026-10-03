-- 011_account_provisioning_enums.sql
-- Step R4: Ensure profile_status enum supports 'inactive' alongside 'active' and 'suspended'

ALTER TYPE profile_status ADD VALUE IF NOT EXISTS 'inactive';
