-- A permanently-expired guest credential, so the expiry branch of
-- guest-contract-events is testable on every run without a service-role key.
--
-- Why a seeded row rather than a per-test one: guest_access_token_expires_at
-- is server-owned. validate-invite-token sets it 90 days out, and the client
-- has no UPDATE privilege on contracts, so a test cannot age a token it just
-- obtained. Without this fixture the expiry path could only ever be checked by
-- hand, which means in practice it would stop being checked.
--
-- This row grants nothing. Its credential is expired, so the only thing it can
-- ever produce is the 403 guest_token_expired that the test asserts. The token
-- is a fixed, obviously-synthetic uuid; there are no real terms in the row.
--
-- The earner is the QA account the E2E suites already sign in as. If that
-- account is absent (a fresh database), this migration inserts nothing and the
-- test skips rather than failing.

insert into contracts (
  id, earner_user_id, earner_display_name, project_name, dod,
  amount_jpy, currency, state,
  invited_hirer_email, hirer_email,
  guest_access_token, guest_access_token_expires_at
)
select
  'fffffff0-0000-4000-8000-000000000000'::uuid,
  u.id,
  'Expired Fixture Earner',
  'Expired Guest Credential Fixture',
  '["fixture"]'::jsonb,
  1,
  'JPY',
  'TERMS_ACCEPTED',
  'fixture@example.test',
  'fixture@example.test',
  'fffffff0-0000-4000-8000-000000000001'::uuid,
  timestamptz '2020-01-01 00:00:00+00'
from auth.users u
where u.email = 'trustflow.qa.1790033400@gmail.com'
on conflict (id) do nothing;
