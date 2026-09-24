-- Who is doing the work.
--
-- The model assumed the account holder always performs and the invited guest
-- always receives. That makes an ordinary transaction backwards: someone hiring
-- a translator is the receiver, and under the old assumption the *translator*
-- would have had to create an account and send the link.
--
-- This records the one fact that was missing. It does not restructure the
-- parties: `earner_user_id` still means "the account that created and owns this
-- agreement", which is all `creator_insert_contract` and
-- `parties_read_own_contracts` ever used it for. The name is now misleading —
-- an owner who is not the performer is not an "earner" — and that is recorded
-- here as debt rather than fixed by schema surgery in this pass.
--
-- Defaults to 'creator', so every existing row and every existing caller keeps
-- exactly the behaviour it had.
--
-- AUTHORITY IS UNCHANGED IN SHAPE. log-event still requires that only the
-- performing party may assert performance and only the receiving party may
-- accept or reject it. What this column changes is which side of the
-- account/guest divide those two roles land on — not whether the distinction is
-- enforced. A party must never be able to assert and then accept its own
-- assertion, in either direction.

alter table contracts
  add column if not exists performed_by text not null default 'creator';

alter table contracts drop constraint if exists contracts_performed_by_check;
alter table contracts
  add constraint contracts_performed_by_check
  check (performed_by in ('creator', 'counterparty'));

-- The creator chooses this once, at creation, alongside the other business
-- columns. It is not server-owned (it is a term of the deal, not a security
-- field), but it is also not something either party may revise afterwards:
-- clients hold no UPDATE on contracts at all.
grant insert (performed_by) on contracts to authenticated;
