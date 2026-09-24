-- Server ownership of security-critical contract columns.
--
-- PROVEN EXPLOITABLE before this migration: a client holding only the public
-- anon key could sign in anonymously and INSERT a contracts row while choosing
-- its own invite_token, a 10-year invite_token_expires_at, and state = 'SETTLED'.
--
-- A SETTLED row with attacker-chosen hirer_email / project_name / amount_jpy /
-- dod is enough to make send-acceptance-email deliver arbitrary content from
-- the platform's own sending domain. Rewriting that function to derive its
-- content from the contract row (20260921000000..4) removed *payload* trust but
-- not *row* trust — the row itself was client-writable.
--
-- Column-level REVOKE alone would have done nothing here: both client roles
-- held table-level INSERT, which covers every column, including columns added
-- later. The fix is to drop the broad table-level write grants first, then
-- grant INSERT back on exactly the columns a client is allowed to supply.
--
-- RLS is kept as well, not replaced: grants decide which columns may be
-- written at all, RLS decides which rows.

-- 1. Remove broad client write privileges. SELECT is deliberately retained —
--    parties_read_own_contracts depends on it.
revoke insert, update, delete on contracts from anon, authenticated;

-- 2. Re-grant INSERT on business fields only, and only to authenticated.
--    `anon` gets nothing: an unauthenticated visitor must not create contracts.
--
--    Everything omitted here is server-owned and can no longer be supplied by
--    a client at all: state, invite_token, invite_token_expires_at,
--    guest_access_token, guest_access_token_expires_at, hirer_email,
--    hirer_user_id, settlement_claimed_at, stripe_payment_intent_id,
--    stripe_transfer_id, stripe_refund_id, delivered_at, created_at, updated_at.
grant insert (
  earner_user_id,
  project_name,
  dod,
  dod_hash,
  amount_jpy,
  currency,
  deadline
) on contracts to authenticated;

-- 3. Invite expiry is now server-owned, so it needs a server-side value:
--    without this default the column would be NULL on every new row, and
--    validate-invite-token skips its expiry check when the value is NULL —
--    i.e. removing client control without this line would create
--    never-expiring invites.
alter table contracts
  alter column invite_token_expires_at set default now() + interval '72 hours';
