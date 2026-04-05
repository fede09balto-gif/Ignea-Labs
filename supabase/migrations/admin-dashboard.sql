-- Admin Dashboard Migration
-- Run this in Supabase SQL Editor after initial schema.sql

-- 1. Expand status options
ALTER TABLE diagnostics DROP CONSTRAINT IF EXISTS diagnostics_status_check;
ALTER TABLE diagnostics ADD CONSTRAINT diagnostics_status_check
  CHECK (status IN ('new', 'analyzed', 'reviewed', 'report_generated', 'proposal_sent', 'closed_won', 'closed_lost'));

-- 2. Add admin-specific columns
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS consulting_report JSONB;
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS build_prompts JSONB;
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Allow anon SELECT on diagnostics (admin page uses password gate at app layer)
CREATE POLICY "anon_read_diagnostics" ON diagnostics
  FOR SELECT USING (true);

-- 4. Allow anon UPDATE on diagnostics (for status changes, report storage)
CREATE POLICY "anon_update_diagnostics" ON diagnostics
  FOR UPDATE USING (true);

-- 5. Index for admin queries
CREATE INDEX IF NOT EXISTS idx_diag_industry ON diagnostics(industry);
CREATE INDEX IF NOT EXISTS idx_diag_level ON diagnostics(level);
