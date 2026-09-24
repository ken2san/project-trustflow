-- Evidence core: integrity-protected assertions, and state derived from them.
--
-- Three changes, each closing a gap found by an adversarial review of the
-- existing chain:
--
--   payload_hash  — the canonical bound who acted, on what, under which terms,
--                   when, and the chain link. It did NOT bind `payload`, so the
--                   substance of every disagreement — a rejection reason, a
--                   contested claim — was recorded but not tamper-evident. For
--                   a product whose value is evidence, that was the wrong half
--                   to leave unprotected.
--
--   derive_contract_state — contracts.state was written only by the Stripe
--                   Edge Functions, while the event log recorded the very
--                   transitions the state column was missing. The two never
--                   met, which is why nothing has ever written 'DELIVERED' and
--                   no contract has ever reached 'SETTLED'. State becomes a
--                   projection of the log, defined once, here, in SQL — not
--                   duplicated between Deno and the browser, which is how the
--                   canonical drifted before.
--
--   dod_hash      — revoked from client INSERT. It is derived from the
--                   agreement's own terms; a party choosing it defeats the
--                   point of pinning terms at all.
--
-- WHAT THE PROJECTION DELIBERATELY DOES NOT DO
-- It does not decide who is right. 'AWAITING_CONFIRMATION' says the Earner has
-- asserted performance and the protocol is waiting on the Hirer. It does not say
-- the work was delivered — TrustFlow cannot observe that. The state answers
-- "what may happen next", never "what is true".

-- ── 1. Integrity for the substance of an assertion ──────────────────────────

alter table events
  add column if not exists payload_hash text;

-- Existing rows keep hash_version 2 (or NULL for pre-chain rows) and verify
-- under the rules they were written with. They are NOT backfilled: TrustFlow
-- did not attest their payloads at the time, and writing a hash now would imply
-- that it had.
alter table events alter column hash_version set default 3;

-- ── 2. State as a projection of the attested log ────────────────────────────

-- Assertions that move the protocol. Everything else is recorded without
-- changing where the protocol stands.
create or replace function public.derive_contract_state(
  p_contract_id text,
  p_current     text
)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  latest text;
begin
  -- Terminal positions are not re-derived: settlement and cancellation are
  -- facts about something that already happened, not opinions to revise.
  if p_current in ('SETTLED', 'CANCELLED') then
    return p_current;
  end if;

  -- Performance can only be asserted against terms the counterparty accepted.
  if p_current not in ('TERMS_ACCEPTED', 'AWAITING_CONFIRMATION', 'PERFORMANCE_ACCEPTED') then
    return p_current;
  end if;

  select e.type into latest
  from public.events e
  where e.contract_id = p_contract_id
    and e.type in ('performance.asserted', 'performance.accepted', 'performance.rejected')
  order by e.created_at desc, e.id desc
  limit 1;

  return case latest
    -- The Earner says they performed. The protocol now waits on the Hirer.
    -- This is emphatically not "delivered".
    when 'performance.asserted' then 'AWAITING_CONFIRMATION'
    -- The Hirer confirmed. This is the only route to an irreversible exchange.
    when 'performance.accepted' then 'PERFORMANCE_ACCEPTED'
    -- The Hirer disagreed. The Earner may assert again; the disagreement stays
    -- in the log rather than being represented as a verdict.
    when 'performance.rejected' then 'TERMS_ACCEPTED'
    else p_current
  end;
end;
$$;

create or replace function public.project_contract_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.type in ('performance.asserted', 'performance.accepted', 'performance.rejected') then
    update public.contracts c
       set state = public.derive_contract_state(new.contract_id, c.state)
     where c.id::text = new.contract_id;
  end if;
  return new;
end;
$$;

drop trigger if exists events_project_contract_state on events;
create trigger events_project_contract_state
  after insert on events
  for each row
  execute function public.project_contract_state();

-- Only service_role writes events, so the trigger only ever runs as the server.
-- Neither function is SECURITY DEFINER and neither is callable by a client.
revoke execute on function public.derive_contract_state(text, text) from public, anon, authenticated;
revoke execute on function public.project_contract_state() from public, anon, authenticated;

-- ── 3. Terms pinning is the server's to decide ──────────────────────────────

-- dod_hash is derived from `dod`. Letting a client insert its own value allows
-- an agreement whose recorded terms and recorded terms-hash disagree.
revoke insert (dod_hash) on contracts from anon, authenticated;
