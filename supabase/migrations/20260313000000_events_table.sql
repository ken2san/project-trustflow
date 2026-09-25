-- The `events` baseline, recovered from the live database.
--
-- WHY THIS FILE EXISTS
-- `events` is the table the whole product rests on, and until now it was
-- created by no migration and by no commit in this repository's history. It
-- was made by hand in the SQL editor before the migration directory existed,
-- and every later migration simply assumed it. The practical consequence was
-- that this project could not be rebuilt: `supabase db push` against a fresh
-- Supabase project failed on the first file, 20260314000000_events_rls.sql,
-- because there was nothing to ALTER. The definitions below were read back out
-- of the running database (pg_attribute, pg_rewrite, pg_indexes, pg_proc,
-- pg_event_trigger) rather than reconstructed from memory.
--
-- It is dated ahead of every other migration so that it lands first on a fresh
-- project, and every statement is written to be inert against the database
-- that already has these objects.
--
-- WHAT IS DELIBERATELY NOT HERE
-- Only objects that no migration owns. Everything already under source control
-- stays where it is, so nothing is described in two places:
--   - RLS is enabled and its policies defined by 20260314000000 and rewritten
--     by 20260924000002_events_lockdown
--   - prev_event_hash by 20260921000004
--   - hash_version, idempotency_key, server_recorded_at, and the three
--     events_* indexes by 20260924000001
--   - payload_hash and the events_project_contract_state trigger by
--     20260925000000; agreement_hash by 20260927000000
-- The columns below are therefore the table as it was originally created, not
-- the table as it stands today.

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Automatic RLS on new public tables.
--
-- This comes first because it is an event trigger: once it exists it fires on
-- every subsequent CREATE TABLE, which is how the tables made by later
-- migrations came to have RLS enabled without any of them saying so. Ordering
-- it ahead of the table reproduces the database that exists rather than a
-- tidier one that does not.
--
-- 20260924000003_small_security_fixes revokes EXECUTE on this function from
-- PUBLIC, anon and authenticated. That migration currently fails outright on a
-- fresh project, because you cannot revoke on a function that was never
-- created; this file is what makes it succeed.
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
     if cmd.schema_name is not null and cmd.schema_name in ('public') and cmd.schema_name not in ('pg_catalog','information_schema') and cmd.schema_name not like 'pg_toast%' and cmd.schema_name not like 'pg_temp%' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
     else
        raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     end if;
  end loop;
end;
$function$;

-- CREATE EVENT TRIGGER has no IF NOT EXISTS, so the guard is explicit.
do $$
begin
  if not exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
    create event trigger ensure_rls
      on ddl_command_end
      when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      execute function public.rls_auto_enable();
  end if;
end
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. The table.
--
-- contract_id and actor_id are text rather than uuid on purpose and must stay
-- that way: contract_id holds non-UUID values from the pre-migration demo flow
-- ('1', 'mock', 'runtime'), and actor_id holds both auth uids and guest
-- identifiers of the form 'guest:<email>'. 20260924000002 casts the contract's
-- uuid to text for exactly this reason.
--
-- Nothing here is generated and nothing added later is NOT NULL, which is why
-- the log-event Edge Function can insert through jsonb_populate_record without
-- losing a default: the six NOT NULL columns are all supplied by
-- buildEventRecord.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid        not null default gen_random_uuid(),
  type        text        not null,
  contract_id text        not null,
  actor_id    text        not null,
  payload     jsonb       not null default '{}'::jsonb,
  dod_hash    text,
  created_at  timestamptz not null default now(),
  event_hash  text,
  tsa_token   text,
  constraint events_pkey primary key (id)
);

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Append-only.
--
-- These two rules are the reason the evidence trail can be called
-- tamper-evident at all, and they were the single most important thing missing
-- from source control. A rewrite rule of DO INSTEAD NOTHING discards the
-- statement for every role without raising an error — postgres and
-- service_role included — so no credential in the system can revise or remove
-- a recorded event. 20260924000001 documents this in a comment and
-- 20260924000002 relies on it ("the no_update_events / no_delete_events rules
-- already discard UPDATE and DELETE for every role"), but neither created it.
--
-- The silence matters when reading application code: a DELETE that "succeeds"
-- against this table has done nothing, and reports zero rows affected.
-- ──────────────────────────────────────────────────────────────────────────
create or replace rule no_update_events as
  on update to public.events do instead nothing;

create or replace rule no_delete_events as
  on delete to public.events do instead nothing;

-- ──────────────────────────────────────────────────────────────────────────
-- 4. The two original indexes.
--
-- Both predate the migration directory. events_contract_created_idx
-- (20260924000001) covers (contract_id, created_at desc) and so makes
-- idx_events_contract_id redundant for most plans, but they are recorded here
-- as they are: this file's job is to reproduce the database, and dropping a
-- live index is a separate decision with its own evidence.
-- ──────────────────────────────────────────────────────────────────────────
create index if not exists idx_events_contract_id on public.events (contract_id);
create index if not exists idx_events_created_at  on public.events (created_at desc);
