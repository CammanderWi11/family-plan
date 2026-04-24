-- ============================================================
-- Family Plan: Shared tables for cross-account sync
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Shared Luca feeding log
CREATE TABLE shared_luca_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    text UNIQUE NOT NULL,
  type        text NOT NULL CHECK (type IN ('breast', 'pump', 'bottle')),
  side        text CHECK (side IN ('left', 'right') OR side IS NULL),
  started_at  timestamptz NOT NULL,
  duration_seconds int NOT NULL DEFAULT 0,
  ml          int,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_shared_luca_log_started ON shared_luca_log(started_at DESC);

-- RLS: all authenticated users can read, insert, delete
ALTER TABLE shared_luca_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all entries"
  ON shared_luca_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert entries"
  ON shared_luca_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete entries"
  ON shared_luca_log FOR DELETE
  TO authenticated
  USING (true);


-- 2. Shared Leo routine
CREATE TABLE shared_leo_routine (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocks      jsonb NOT NULL,
  claves      jsonb NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id)
);

ALTER TABLE shared_leo_routine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read routine"
  ON shared_leo_routine FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update routine"
  ON shared_leo_routine FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert routine"
  ON shared_leo_routine FOR INSERT
  TO authenticated
  WITH CHECK (true);
