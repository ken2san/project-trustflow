-- Check if events table is in supabase_realtime publication.
-- If the result is empty, run:
--   ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- This migration adds events to realtime publication if not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;
END $$;
