-- History reconciliation only. No schema change.
--
-- The five migrations dated 20260921000004 and 20260924000000-3 were applied
-- through the Supabase management API rather than `supabase db push`, and the
-- API stamps its own timestamp version for each call. That left the local
-- files and supabase_migrations.schema_migrations describing the same schema
-- under different version numbers, so a later `db push` would have replayed
-- every one of them.
--
-- This migration records the local versions as applied and removes the
-- generated rows. On a fresh database it is inert: the inserts collide with
-- versions db push is already recording (hence ON CONFLICT DO NOTHING) and the
-- delete matches nothing.

insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260921000004', 'events_prev_hash'),
  ('20260924000000', 'runtime_snapshots_table'),
  ('20260924000001', 'events_server_authoritative'),
  ('20260924000002', 'events_lockdown'),
  ('20260924000003', 'small_security_fixes')
on conflict (version) do nothing;

delete from supabase_migrations.schema_migrations
where version in ('20260924122303','20260924122315','20260924122326',
                  '20260924122413','20260924122810','20260924122818',
                  '20260924122859','20260924123713');
