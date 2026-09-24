-- Close the events trust boundary. Applied only after log-event was deployed
-- and verified writing, per the migration order: ingestion first, revoke last.
--
-- WHAT WAS WRONG
-- `allow insert` (WITH CHECK true) and `allow select` (USING true) were
-- permissive policies, and permissive policies are OR-combined. They therefore
-- subsumed the narrower authenticated_insert_own and authenticated_read_events
-- entirely, making those dead code. Anyone holding the public anon key could
-- insert an event with any actor_id, type, contract_id and prev_event_hash, and
-- read every row including other actors' runtime snapshots. The hash chain and
-- TSA fields proved nothing about authorship because authorship was whatever
-- the browser typed.

-- 1. Writes: service_role only, through the log-event Edge Function.
--    (The no_update_events / no_delete_events rules already discard UPDATE and
--    DELETE for every role; revoking them too removes the misleading grant.)
revoke insert, update, delete, truncate on events from anon, authenticated;

-- 2. Remove the policies that made the table world-writable and world-readable.
drop policy if exists "allow insert"              on events;
drop policy if exists "allow select"              on events;
drop policy if exists "authenticated_insert_own"  on events;
drop policy if exists "authenticated_read_events" on events;

-- 3. Reads: parties to the contract only.
--    contract_id is TEXT and holds non-UUID values from the pre-migration
--    demo flow ('1', 'mock', 'runtime'), so the contract's uuid is cast to
--    text rather than the other way round — casting the column to uuid would
--    error on those rows instead of simply not matching.
--
--    A guest Hirer has no auth.users row and so cannot be recognised here;
--    they read their contract's history through an Edge Function or not at
--    all. Legacy rows whose contract_id matches no contract match no party
--    and are therefore no longer client-readable — they are preserved in the
--    table (the append-only rules make deletion impossible anyway) but they
--    are fixture noise, not evidence.
drop policy if exists "party_read_contract_events" on events;
create policy "party_read_contract_events"
  on events for select to authenticated
  using (
    exists (
      select 1 from contracts c
      where c.id::text = events.contract_id
        and (
          c.earner_user_id = (select auth.uid())
          or c.hirer_email = (select auth.jwt() ->> 'email')
        )
    )
  );
