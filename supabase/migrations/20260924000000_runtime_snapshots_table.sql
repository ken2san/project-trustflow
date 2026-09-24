-- Move runtime snapshots out of the evidentiary `events` table.
--
-- runtime.snapshot rows are application state, not contractual evidence:
-- contract_id is the literal 'runtime', there is no dod_hash, no event_hash
-- and no TSA token, and actor_id is often a localStorage device UUID rather
-- than an authenticated identity. They were 776 of the 826 rows in `events`
-- (94%), they are append-only with no upsert so they grow without bound, and
-- they are the sole reason the events SELECT policy needed a
-- `type <> 'runtime.snapshot'` carve-out.
--
-- Separating them lets the events table carry one narrow, party-based read
-- policy with no type exceptions, and lets snapshots have the simple
-- owner-only policy they actually want.
--
-- Historical rows are COPIED, not moved: the originals stay in `events`
-- untouched (see 20260924000002 for how the pre-migration trust boundary is
-- recorded). Nothing reads them from `events` after this migration.

create table if not exists runtime_snapshots (
  id         uuid primary key default gen_random_uuid(),
  actor_id   text        not null,
  payload    jsonb       not null,
  created_at timestamptz not null default now()
);

create index if not exists runtime_snapshots_actor_created_idx
  on runtime_snapshots (actor_id, created_at desc);

alter table runtime_snapshots enable row level security;

-- Owner-only, both directions. actor_id may be a device UUID rather than an
-- auth uid (see ensureActorIdentity's fallback), in which case these policies
-- reject the write and the app stays on its localStorage cache — the same
-- non-fatal degradation as before.
drop policy if exists "own_runtime_snapshot_insert" on runtime_snapshots;
create policy "own_runtime_snapshot_insert"
  on runtime_snapshots for insert to authenticated
  with check (actor_id = auth.uid()::text);

drop policy if exists "own_runtime_snapshot_read" on runtime_snapshots;
create policy "own_runtime_snapshot_read"
  on runtime_snapshots for select to authenticated
  using (actor_id = auth.uid()::text);

-- Snapshots are append-only from the client, like events were.
revoke update, delete, truncate on runtime_snapshots from anon, authenticated;

-- Copy existing snapshots so cross-device restore keeps working for rows
-- written before this migration. Idempotent: re-running copies nothing new.
insert into runtime_snapshots (id, actor_id, payload, created_at)
select e.id, e.actor_id, e.payload, e.created_at
from events e
where e.type = 'runtime.snapshot'
  and e.payload is not null
on conflict (id) do nothing;
