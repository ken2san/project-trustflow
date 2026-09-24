-- Schema support for server-authoritative event ingestion.
--
-- NOTE ON APPEND-ONLY: `events` carries two rules,
--   CREATE RULE no_update_events AS ON UPDATE TO events DO INSTEAD NOTHING;
--   CREATE RULE no_delete_events AS ON DELETE TO events DO INSTEAD NOTHING;
-- which silently discard every UPDATE and DELETE regardless of role — postgres
-- and service_role included. Existing rows therefore cannot be modified at all,
-- which is why nothing below backfills historical data. It also means the
-- UPDATE/DELETE grants held by anon/authenticated were already inert; revoking
-- them (20260924000002) is defence in depth, not the load-bearing control.
--
-- Three additions, each backing a specific guarantee the log-event Edge
-- Function makes:
--
--   hash_version     — the canonical format an event's event_hash was computed
--                      under. Rows written before 20260921000004 were hashed
--                      WITHOUT a prev_hash field; the current canonical
--                      includes one. Verifying a v1 row with the v2 canonical
--                      produces a mismatch, so auditExport.js was reporting
--                      HASH_MISMATCH_DETECTED on intact historical rows.
--                      New rows default to 2. Historical rows stay NULL — they
--                      cannot be updated, and NULL is itself the marker: no
--                      version recorded means pre-migration, which
--                      auditExport.js reads as v1 / client_asserted. That is
--                      the trust boundary, drawn without touching one old row.
--
--   idempotency_key  — a retried ingestion request returns the event it
--                      already wrote instead of appending a duplicate.
--
--   server_recorded_at — the server's own clock. created_at stays part of the
--                      hashed canonical (so the chain format is unchanged), but
--                      it is now assigned by the server, and this column
--                      records the ingestion instant independently.

alter table events
  add column if not exists hash_version       smallint,
  add column if not exists idempotency_key    text,
  add column if not exists server_recorded_at timestamptz;

alter table events alter column hash_version set default 2;

-- The chain cannot fork: within one contract, at most one event may claim a
-- given predecessor. Two concurrent writers that read the same chain tip
-- compute the same prev_event_hash, and this index rejects the second — which
-- then retries against the new tip. A hard database guarantee, replacing the
-- best-effort read-then-write the client-side chain documented as a known gap.
-- Partial, so historical rows (prev_event_hash IS NULL) are unaffected.
create unique index if not exists events_chain_no_fork_idx
  on events (contract_id, prev_event_hash)
  where prev_event_hash is not null;

-- A retry with the same key is the same event, not a new one.
create unique index if not exists events_idempotency_idx
  on events (contract_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists events_contract_created_idx
  on events (contract_id, created_at desc);
