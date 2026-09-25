-- History reconciliation only. No schema change.
--
-- The same drift as 20260924123733 and 20260924132813 has happened again, for
-- the same reason: evidence_core, performed_by and agreement_snapshot were
-- applied through the Supabase management API, which assigns its own timestamp
-- version per call. The database therefore records
--
--   20260924163727 evidence_core        20260924174241 performed_by
--   20260924202410 agreement_snapshot
--
-- while the local files are dated 20260925000000, 20260926000000 and
-- 20260927000000. supabase_migrations.schema_migrations stores no checksum, so
-- the CLI matches on version alone and would have replayed all three.
--
-- WHY REPLAY WAS NOT AN ACCEPTABLE OUTCOME
-- Not because the statements are unsafe on their own — they are `add column if
-- not exists` and `create or replace function` — but because of the order they
-- run in. evidence_core sets the hash_version default to 3 and
-- agreement_snapshot sets it back to 4. A push that failed anywhere between the
-- two would leave the default at 3, and every event written afterwards would be
-- hashed under a canonical that does not bind agreement_hash. Nothing would
-- error; the evidence would just quietly stop covering amount and deadline.
-- Correcting migration history is cheap, and that failure is not.
--
-- THE CORRESPONDENCE WAS VERIFIED, NOT ASSUMED
-- Each recorded statement was read back from schema_migrations and compared
-- with its local file after stripping comments and collapsing whitespace. The
-- MD5s are identical, so the three local files describe schema changes the
-- database has already had applied:
--
--   20260924163727 = 20260925000000_evidence_core.sql      45ba9abc797931ac4ad3a1c68e4856ae
--   20260924174241 = 20260926000000_performed_by.sql       83adde3a4ec5315ff9d3598f26438468
--   20260924202410 = 20260927000000_agreement_snapshot.sql a224a3a5e6a6dbc506aba7fd756535ae
--
-- 20260313000000_events_table is recorded here too. It is dated before every
-- other migration so that a fresh project builds in the right order, but the
-- objects it creates have existed in this database since before the migration
-- directory did, so it must not be treated as pending work here.
--
-- WHY THIS FILE IS DATED AFTER THE MIGRATIONS IT RECORDS
-- On a fresh project db push reaches this file only after applying and
-- recording 20260313000000 and 20260925000000-20260927000000 itself, so every
-- insert below collides and does nothing and the delete matches nothing —
-- inert, exactly like its two predecessors. Dating it earlier would invert
-- that: the inserts would land first and db push would then skip the three
-- migrations as already applied, silently building a project without them.

insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260313000000', 'events_table'),
  ('20260925000000', 'evidence_core'),
  ('20260926000000', 'performed_by'),
  ('20260927000000', 'agreement_snapshot')
on conflict (version) do nothing;

delete from supabase_migrations.schema_migrations
where version in ('20260924163727', '20260924174241', '20260924202410');
