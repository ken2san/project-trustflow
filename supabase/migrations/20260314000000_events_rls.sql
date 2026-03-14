-- ──────────────────────────────────────────────────────────────────────────────
-- TrustFlow: Row Level Security for the `events` table
-- Apply via Supabase Dashboard → SQL Editor, or `supabase db push` if CLI is set up.
--
-- Access model:
--   INSERT  — authenticated users can only insert rows where actor_id = their own uid
--   SELECT  — contract audit events (all types except runtime.snapshot) are readable
--             by any authenticated user (they form a shared, immutable contract log)
--           — runtime.snapshot events are private: only the owner can read them
--
-- Fallback behavior:
--   If signInAnonymously() fails, actor_id is a localStorage device UUID (not auth.uid()).
--   In that case the INSERT policy rejects Supabase writes — non-fatal, app continues
--   in local-only mode (see persistEvent() in eventLog.js).
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Enable RLS (idempotent)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to allow idempotent re-application
DROP POLICY IF EXISTS "authenticated_insert_own"   ON events;
DROP POLICY IF EXISTS "authenticated_read_events"  ON events;

-- 3. INSERT: authenticated users (including anon auth) may only write as themselves
CREATE POLICY "authenticated_insert_own"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid()::text);

-- 4. SELECT: contract audit events are shared; runtime snapshots are owner-only
CREATE POLICY "authenticated_read_events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    -- All non-snapshot event types are shared within the contract audit log
    type != 'runtime.snapshot'
    OR
    -- Runtime snapshots are private to the actor who created them
    actor_id = auth.uid()::text
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- Realtime: enable postgres_changes for the events table so subscriptions work.
-- This must be set in the Supabase Dashboard → Database → Replication, or via:
-- ──────────────────────────────────────────────────────────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE events;
-- (Uncomment the line above if events is not already in the realtime publication)
