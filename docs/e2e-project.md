# The E2E Supabase project

The live E2E suites used to run against the same project the deployed site uses.
Since 2026-09-26 they run against a separate one.

| | ref | role |
|---|---|---|
| `trustflow` | `fqgpzhwvvfsxswlnbbgg` | production; the deployed site and `.env` |
| `trustflow-e2e` | `yqjtawffpesplqyurlpj` | live E2E only; `.env.e2e` |

Both are in organization `wavfjqgbnahqfhgeleqe` (free plan), Mumbai / `ap-south-1`.

## Why

Every one of the 1272 contracts in production belonged to the QA Earner — there
was no real data — but that was the reason to act, not to wait. `events` carries
`no_delete_events` and `no_update_events` as **`DO INSTEAD NOTHING`** rules, so a
`DELETE` on events *succeeds and deletes nothing*. `contracts` has no such rule and
`events.contract_id` is `text` rather than a foreign key, so contracts can be
deleted while their events survive: 814 of 2310 events were already orphaned that
way. Once one real contract exists, its events are permanent by design and could
never be separated from test rows sharing the table, so the split had to happen
first.

A second, independent reason: the per-IP signup cap is a property of the project.
Three back-to-back full runs saturated it on 2026-09-24 through anonymous
`/signup` and took the whole project — including the live site — offline until a
manual restart. The suites now spend their own budget.

**Production's existing test data was deliberately left in place.** The goal was a
boundary against new writes, not a cleanup.

## How the boundary is enforced

- `tests/e2e/liveEnv.js` is the single source of the four live credentials, loads
  `.env.e2e` itself, and throws rather than skipping when one is absent.
- `playwright.config.js` passes `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` into
  the dev server through `webServer.env`. Without this, the four browser-driving
  suites (`contracts-home`, `earner-signin`, `guest-evidence`,
  `invite-persistence`) would act through an app Vite built from `.env` — a
  different file — and would have kept writing to production while the API-level
  suites moved.
- `tests/e2e/00-backend-guard.spec.js` asserts that the page under test reports the
  expected Supabase URL, reading `window.__TF_SUPABASE_URL__`. Needed because
  `reuseExistingServer: true` lets an already-running dev server serve the tests
  without ever seeing those values. Named `00-` so it runs first.

Verified with data rather than inference: production's newest contract is
`07:15:46Z`, the last run before the switch. The E2E project's contracts start at
`07:30:57Z`. Nothing has landed in production since.

## Rebuilding from migrations — and what that test found

`supabase db push` has **no `--project-ref` flag**. Either link, or pass a
connection string. The repo stays linked to production so that a bare
`supabase db push` still means production; the E2E project is targeted explicitly:

```
supabase db push --db-url "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" \
                 --include-all --yes
```

All 28 migrations then run in order against an empty database. This was the rebuild
capability that had never been executed — the claim had rested on static analysis
because no Docker or local Postgres is installed. Running it for real found two
faults that static reading had not:

1. **The chain stopped at 22 of 28.**
   `20260924132813_reconcile_fixture_migration` records version `20260924140000`,
   which is dated *after* it, so on an empty database `db push` had not reached that
   migration yet: the insert succeeded, then `db push` failed applying the very
   migration it had just declared applied — `duplicate key value violates unique
   constraint "schema_migrations_pkey"`. History claimed the fixture was in place
   while its DDL had never run. The file's own comment asserted the opposite. Now
   guarded on the real precondition: a history repair does nothing unless the
   generated row it exists to remove is actually present. Fixed in `a19c6c8`.

2. **The expired-guest-token fixture named one production account.**
   `contracts.earner_user_id` is a foreign key into `auth.users`, so
   `20260924140000` needs a real account, and it selected a hardcoded address. On
   any other project it inserted nothing and `guest-evidence`'s expiry test failed
   with `invalid_guest_token` instead of `guest_token_expired`. It now takes the
   earliest non-anonymous account — which introduces the **ordering requirement
   below**.

The feared failure did not materialise: the event trigger in `20260313000000`,
normally superuser-only, applied without complaint.

The rebuilt schema matches production where it counts — 28 versions, both
acceptance functions with `execute` granted to `service_role` only, both
append-only rules on `events`, 10 policies, the same 5 tables, `invite_token` uuid,
`hash_version` default 4.

## Order of operations, if this is ever done again

1. Create the project.
2. **Create the test Earner account** — before the migrations, because
   `20260924140000` attaches its fixture to the earliest non-anonymous account and
   silently inserts nothing if none exists. Use the admin API with
   `email_confirm: true` rather than disabling email confirmation project-wide;
   `contracts`'s `verified_earner_only_insert` policy only requires that the JWT is
   not anonymous.
3. Apply the migrations.
4. Deploy the Edge Functions.
5. Enable anonymous sign-ins.
6. Switch `.env.e2e` and delete the cached session files.

## Edge Functions

Deploy with `--project-ref <ref>` (this one does take the flag). Deployed on the
E2E project: `log-event`, `validate-invite-token`, `guest-contract-events`.

`capture-payment` is additionally needed by `evidence-core`, and would need a
test-mode `STRIPE_SECRET_KEY`. `cancel-payment` and `create-payment-intent` are not
used by any suite. `send-acceptance-email` and `timestamp-event` must **never** be
deployed here — they were deleted from production on 2026-09-26 as unreachable and
unauthenticated, and their sources carry a header saying so.

## Secrets

Only one is not auto-injected. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` come
from the platform.

- `STRIPE_SECRET_KEY` — test mode, and only if `capture-payment` is deployed.
- `INVITE_SECRET` is **not** needed; nothing among the remaining functions reads it.
  It belonged to the legacy client-side HMAC invite system.
- `RESEND_API_KEY` / `EMAIL_FROM` are **not** needed; the only function that used
  them is gone.

## A platform difference worth knowing

The newer project's gateway rejects a request carrying only `apikey` with
`UNAUTHORIZED_NO_AUTH_HEADER`, while the older one accepts it. The suites' `api()`
helpers sent `apikey` alone unless a user token was supplied, so on the new project
every call 401'd at the gateway — and the negative-auth assertions would have
passed for the wrong reason, never reaching the function's own checks. The helpers
now always send a bearer: the user's token when there is one, otherwise the anon
key, which is what supabase-js does and what those tests' comments already claimed
("anon key only"). `verify_jwt` is `true` on every function in both projects; this
is gateway behaviour, not configuration.

## `.env.e2e`

Gitignored, loaded automatically by `tests/e2e/liveEnv.js`. Switching projects means
replacing all four values and nothing else:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
TF_TEST_EARNER_EMAIL=<the project's QA earner>
TF_TEST_EARNER_PASSWORD=<its password>
```

Also delete the cached sessions, which hold tokens for the previous project:

```
rm -f tests/e2e/.earner-session.json tests/e2e/.anon-fixture.json
```

`.env` — the deployed site and an ordinary `npm run dev` — keeps pointing at
production. Only the test path moved.

## Outstanding

- **Anonymous sign-ins are still disabled on the E2E project.** `/auth/v1/signup`
  answers "Anonymous sign-ins are disabled". `invite-persistence` mints an anonymous
  identity and cannot run until this is on; `guest-evidence` passes without it. It is
  a dashboard toggle (Authentication → Sign In / Providers → anonymous sign-ins);
  doing it from here would need the account-level access token, which is not
  something to reach into.
- **Suites not yet run against the new project**: `contracts-home`,
  `earner-signin`, `invite-persistence`, `event-ingestion`, `evidence-core`. The
  last two need `capture-payment` and a Stripe test key. None has run since the
  2026-09-24 outage. Run them once, deliberately.
- Passing so far on the new project: `00-backend-guard` 1/1,
  `atomic-acceptance` 10/10, `agreement-binding` 15/15, `guest-evidence` 11/11.
