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
-- Inert on a fresh database: the insert collides with the version db push is
-- already recording, and the delete matches nothing.

insert into supabase_migrations.schema_migrations (version, name)
values ('20260924140000', 'expired_guest_token_fixture')
on conflict (version) do nothing;

delete from supabase_migrations.schema_migrations
where version in ('20260924125106', '20260924132813');
