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
-- WHOSE ACCOUNT THIS HANGS OFF, AND WHY IT IS NOT NAMED
-- contracts.earner_user_id is a foreign key into auth.users, so the row needs a
-- real account. This used to name one address — the QA account of the original
-- project — which made the fixture unreproducible anywhere else: building a
-- second project from these migrations inserted nothing, and
-- guest-evidence's "an expired guest token fails closed" then failed with
-- invalid_guest_token instead of guest_token_expired. Found on 2026-09-26, while
-- standing up a separate E2E project.
--
-- It now takes the earliest non-anonymous account instead, which is that same QA
-- account on the original project and the new project's own test Earner
-- elsewhere. The consequence is an ORDERING REQUIREMENT: create the test Earner
-- before running these migrations. If no such account exists yet this inserts
-- nothing and the test fails — deliberately, not silently, since a hole in the
-- expiry check is the thing worth being told about. The earlier comment here
-- claimed the test would skip; it never had a skip to fall back on.

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
where u.is_anonymous is false
order by u.created_at
limit 1
on conflict (id) do nothing;
