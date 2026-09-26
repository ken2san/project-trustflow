-- History reconciliation only. No schema change.
--
-- Same situation as 20260924123733: the fixture migration was applied through
-- the management API, which assigns its own timestamp version, so the local
-- file and the recorded version disagreed. This records the local version and
-- removes the generated row.
--
-- This file exists because a reconciliation applied that way records ITSELF
-- under a generated version too, which is a loop — the only way out is a local
-- file carrying the last generated version, which is what this is. Applying
-- future migrations with `supabase db push` rather than the management API
-- avoids needing another one.
--
-- WHY THIS IS GUARDED, AND WHAT IT GOT WRONG BEFORE
-- This file used to claim it was "inert on a fresh database: the insert collides
-- with the version db push is already recording". That is backwards, and a real
-- rebuild proved it on 2026-09-26. The version it records, 20260924140000, is
-- dated AFTER this file, so on a fresh database db push has not reached it yet:
-- the insert below succeeds, and then db push fails applying the migration it
-- just pretended was applied —
--
--   duplicate key value violates unique constraint "schema_migrations_pkey"
--   Key (version)=(20260924140000) already exists.
--
-- The chain stopped at 22 of 28, and the fixture's actual DDL never ran while
-- history said it had. The other two reconcile files only record versions dated
-- before themselves, which is why they really are inert and this one was not.
--
-- The guard states the real precondition rather than relying on an ordering
-- coincidence: a history repair should do nothing unless there is a history to
-- repair. 20260924125106 is the generated row this file exists to remove, so its
-- presence is exactly the condition. On a fresh database it does not exist and
-- nothing here runs; on the database this was written for it has already been
-- removed, so nothing runs there either and re-applying is safe.
do $$
begin
  if exists (
    select 1 from supabase_migrations.schema_migrations
     where version = '20260924125106'
  ) then
    insert into supabase_migrations.schema_migrations (version, name)
    values ('20260924140000', 'expired_guest_token_fixture')
    on conflict (version) do nothing;

    delete from supabase_migrations.schema_migrations
    where version in ('20260924125106', '20260924132813');
  end if;
end $$;
