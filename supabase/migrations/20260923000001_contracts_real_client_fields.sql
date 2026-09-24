-- Fields the real-client flow needs, plus the verified-Earner gate.
--
-- earner_display_name: who the invite is from. Until now the invite carried
-- USER_PROFILE.name — a demo fixture from src/lib/constants.js — so the Hirer
-- was shown a made-up name as "who invited you". An anonymous-turned-permanent
-- Earner has an email but no name, so the Earner types it at creation.
--
-- invited_hirer_email vs hirer_email: deliberately two columns, because they
-- are two different facts. invited_hirer_email is the address the Earner
-- addressed the invite to; hirer_email (already used downstream by
-- capture-payment and send-acceptance-email) is the identity that actually
-- accepted. They can legitimately differ — an invite sent to a work address
-- and opened from a personal one — and acceptance is NOT rejected when they
-- do; both are kept as evidence.

alter table contracts
  add column if not exists earner_display_name text,
  add column if not exists invited_hirer_email  text;

-- These two are Earner-supplied business fields, so they join the narrow
-- INSERT grant from 20260923000000. Everything else stays server-owned.
grant insert (earner_display_name, invited_hirer_email) on contracts to authenticated;

-- The first persisted state of a real contract. Named for the business
-- reality — who has to act next — rather than for what the Earner just did
-- ("SENT" would be untrue when the Earner copies the link instead of sending
-- it, and says nothing about what the contract is waiting for).
alter table contracts alter column state set default 'AWAITING_ACCEPTANCE';

-- Only a verified (non-anonymous) Earner may create a contract.
--
-- RESTRICTIVE is required, not optional: permissive policies are OR-ed, so a
-- plain policy here would simply sit beside creator_insert_contract and never
-- block anything.
--
-- Measured behaviour this relies on (2026-09-23, this project):
--   signInAnonymously            -> is_anonymous=true
--   updateUser({email})          -> is_anonymous STAYS true, even after a
--                                   token refresh; only email_change is set
--   after OTP verification       -> is_anonymous=false
-- so the gate fails closed while verification is pending. A missing claim
-- also fails closed (null is false -> false).
drop policy if exists "verified_earner_only_insert" on contracts;
create policy "verified_earner_only_insert" on contracts
  as restrictive for insert to authenticated
  with check ((select (auth.jwt() ->> 'is_anonymous')::boolean) is false);
