-- Bind the whole agreed deal to an acceptance, not only its completion criteria.
--
-- THE DEFECT
-- canonical v3 binds dod_hash, which covers `dod` alone. amount_jpy, deadline,
-- performed_by and the offering party's name were bound by nothing. `contracts`
-- carries no append-only protection (unlike `events`), so a privileged writer
-- could change the price of an accepted agreement and no hash would notice.
-- TrustFlow could prove which completion criteria were accepted and could not
-- prove what was agreed to be paid for them.
--
-- TWO SEPARATE FIXES, DELIBERATELY BOTH
--
--   agreement_hash (v4)  — the evidence mechanism. The acceptance event carries
--                          a hash of the meaningful deal, and the acceptance
--                          payload carries the snapshot itself, so the historical
--                          terms can be SHOWN and not merely compared. Evidence
--                          stays valid even if the contract row is later changed
--                          by any means.
--
--   freeze_accepted_terms — defence in depth. Once a counterparty has accepted,
--                          the agreed columns stop changing. This is not the
--                          evidence mechanism and must never be relied on as
--                          one; it narrows the window in which a mutation can
--                          happen at all.
--
-- WHY NOT MAKE THE WHOLE ROW IMMUTABLE
-- Protocol state must keep moving — the events trigger updates `state` on every
-- performance assertion. Only the agreed terms are frozen.

-- ── 1. The evidence mechanism ───────────────────────────────────────────────

alter table events
  add column if not exists agreement_hash text;

-- Existing rows keep the version they were written under and are NOT
-- backfilled. A v3 row is a v3 row permanently; TrustFlow did not bind the
-- whole agreement at the time, and writing a hash now would imply that it had.
alter table events alter column hash_version set default 4;

-- ── 2. Defence in depth ─────────────────────────────────────────────────────

create or replace function public.freeze_accepted_terms()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Before anyone has accepted, the owner is still drafting. Terms may change.
  if old.state in ('DRAFTING', 'AWAITING_ACCEPTANCE') then
    return new;
  end if;

  if new.project_name       is distinct from old.project_name
     or new.dod             is distinct from old.dod
     or new.amount_jpy      is distinct from old.amount_jpy
     or new.currency        is distinct from old.currency
     or new.deadline        is distinct from old.deadline
     or new.performed_by    is distinct from old.performed_by
     or new.earner_display_name is distinct from old.earner_display_name
  then
    raise exception
      'agreed terms cannot change after acceptance (contract %); record a new agreement instead',
      old.id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists contracts_freeze_accepted_terms on contracts;
create trigger contracts_freeze_accepted_terms
  before update on contracts
  for each row
  execute function public.freeze_accepted_terms();

revoke execute on function public.freeze_accepted_terms() from public, anon, authenticated;
