-- Turns the event log into an actual hash chain. Previously each event's
-- event_hash was computed independently (no reference to any prior event),
-- so deleting, reordering, or inserting a forged event went undetected by
-- the "recompute and compare" verification auditExport.js already did —
-- every remaining event would still self-verify. prev_event_hash lets a
-- verifier confirm unbroken linkage (like a git commit chain), which a
-- deletion or reorder breaks and a forged insert can't fake without
-- knowing the real chain tip's hash.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS prev_event_hash TEXT;
