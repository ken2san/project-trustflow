# Moving the live E2E suites off the production project

## Why

The live suites run against the same Supabase project the deployed site uses. Every
one of the 1272 contracts in that project belongs to the QA Earner — there is no
real data in it yet — but that is the reason to act rather than a reason not to.
`events` carries `no_delete_events` and `no_update_events` as `DO INSTEAD NOTHING`
rules, so events cannot be removed at all; a `DELETE` on them succeeds and deletes
nothing. `contracts` has no such rule and `events.contract_id` is `text` rather than
a foreign key, so contracts can be deleted while their events survive — 814 of the
2310 events are already orphaned that way.

Once one real contract exists, its events are permanent by design and could never
be separated from test rows sharing the table. So the separation has to happen
before that, not after.

The existing test data is **not** to be deleted. The goal is a boundary that stops
new test data being written into the production project.

## What already enforces the boundary

Two mechanisms landed 2026-09-26, before any second project exists. Today they are
no-ops because `.env.e2e` still names the production project; the moment it names
another one, the whole suite follows.

- `playwright.config.js` passes `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` into
  the dev server through `webServer.env`. Without this, four suites that drive the
  browser (`contracts-home`, `earner-signin`, `guest-evidence`,
  `invite-persistence`) would act through an app that Vite built from `.env` — a
  different file from the `.env.e2e` the test process reads — and would keep writing
  into production while the API-level suites had moved.
- `tests/e2e/00-backend-guard.spec.js` asserts that the page under test reports the
  same Supabase URL the tests expect, reading `window.__TF_SUPABASE_URL__`. It is
  needed because `reuseExistingServer: true` means an already-running dev server,
  with whatever `.env` gave it, can serve the tests and never see those values. It
  is named `00-` so it runs first. Verified by deliberately pointing a dev server at
  another project: the guard fails and names both URLs.

## Checklist for the new project

Nothing here has been done. Creating a Supabase project may incur cost, so the
create step needs the user's go-ahead.

### 1. Create and link

- Create the project (organization `wavfjqgbnahqfhgeleqe`, the same one the
  production project lives in — Mumbai / South Asia, to match).
- Do **not** `supabase link` the repo to it. The repo stays linked to production so
  that an ordinary `supabase db push` still means production. Pass the E2E project
  explicitly with `--project-ref` instead, so targeting the test project is always a
  deliberate act.

### 2. Apply the migrations — this is also the rebuild test

```
supabase db push --project-ref <new-ref> --include-all
```

All 28 migrations then run in order against an empty database for the first time.
This is the rebuild capability that has never actually been verified: the claim so
far rests on static analysis, because no Docker or local Postgres is installed.

Expect these to be the failure candidates:

- `20260313000000_events_table.sql` creates an **event trigger**, which is normally
  superuser-only. It works in production only because the existing one is already
  owned by `postgres`. On a fresh project this is the statement most likely to fail.
- `20260924123733`, `20260924132813` and `20260927235959` are the three
  history-reconciliation migrations. They are written to be inert on a fresh
  project — `on conflict do nothing` inserts and a delete that matches nothing — but
  that has only been reasoned about, not executed.
- `20260929000000` and `20260929000100` must both land, or acceptance is broken the
  same way it was in production on 2026-09-25.

Afterwards, confirm from the new project that `accept_invitation()` and
`invite_acceptance_context()` exist and that `execute` is granted to `service_role`
only.

### 3. Auth settings

- **Anonymous sign-ins: on.** The app signs in anonymously on load, and
  `invite-persistence` mints an anonymous identity for its negative-auth cases.
- **A non-anonymous Earner account.** `contracts`'s `verified_earner_only_insert`
  policy requires `auth.jwt() ->> 'is_anonymous'` to be false, so the test Earner
  must be a real password account. Create it through the admin API with
  `email_confirm: true` rather than turning off email confirmation project-wide —
  the suites sign in with a password grant, and no mail is involved.
- **No SMTP needed.** The app's own Earner sign-in is magic-link OTP, but
  `earner-signin` injects a session into `localStorage` instead of going through
  mail.
- Note the per-IP signup cap that caused the 2026-09-24 outage: 30/hr. It is a
  property of the project, so a second project gives the E2E runs their own budget
  and stops them competing with the live site's anonymous sign-ins. That is a second
  reason for the separation, independent of data hygiene.

### 4. Edge Functions

Deploy with `--project-ref <new-ref>`. Six exist; the suites need the first three,
and `evidence-core` additionally calls `capture-payment`:

| function | needed by the suites | notes |
|---|---|---|
| `log-event` | yes | |
| `validate-invite-token` | yes | must be deployed *after* the migrations |
| `guest-contract-events` | yes | |
| `capture-payment` | yes, `evidence-core` | needs `STRIPE_SECRET_KEY` |
| `cancel-payment` | no | deploy only if a suite starts using it |
| `create-payment-intent` | no | same |

`send-acceptance-email` and `timestamp-event` must **not** be deployed — they were
deleted from production on 2026-09-26 as unreachable and unauthenticated. Their
sources carry a header saying so.

### 5. Secrets

Only one is not auto-injected. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
provided by the platform.

- `STRIPE_SECRET_KEY` — a **test-mode** key, required only if `capture-payment`
  is deployed.
- `INVITE_SECRET` is **not** needed. Nothing among the remaining functions reads it;
  it belonged to the legacy client-side HMAC invite system.
- `RESEND_API_KEY` / `EMAIL_FROM` are **not** needed, since the only function that
  used them is gone.

### 6. `.env.e2e` — what changes

The file is gitignored and loaded automatically by `tests/e2e/liveEnv.js`. Switching
projects means replacing all four values; there is nothing else to change.

```
VITE_SUPABASE_URL=https://<new-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<new project's anon key>
TF_TEST_EARNER_EMAIL=<the new project's QA earner>
TF_TEST_EARNER_PASSWORD=<its password>
```

Also delete the two cached session files, which hold tokens for the old project and
would otherwise be presented to the new one:

```
rm -f tests/e2e/.earner-session.json tests/e2e/.anon-fixture.json
```

`.env` — which the deployed site and ordinary `npm run dev` use — must keep pointing
at production. Only the test path moves.

### 7. Confirm the boundary actually moved

```
npx playwright test 00-backend-guard      # must pass, naming the new URL
npx playwright test atomic-acceptance     # 10/10
npx playwright test agreement-binding     # 15/15
npx playwright test guest-evidence        # 11/11, and browser-driven
```

Then verify from the production project that its contract count has not grown, and
from the new one that it has. That is the only evidence that the separation holds;
the guard proves what the app was built with, not where every row ended up.

Run the remaining suites — `contracts-home`, `earner-signin`, `invite-persistence`,
`event-ingestion`, `evidence-core` — once, deliberately, after that. They have not
run since the 2026-09-24 outage.
