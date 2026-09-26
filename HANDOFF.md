# TrustFlow — AI Session Handoff

_Last updated: 2026-09-26 (E2E split onto its own Supabase project; two public
endpoints deleted; silent test skips closed)_

> Brief a new session with this file. It describes where the project **is**, not
> what each past session did. `Decisions.md` is the source of truth for
> architectural decisions; if this file contradicts it, `Decisions.md` wins.

---

## What TrustFlow is

An AI-native escrow and contract prototype. React 18 + Vite + TailwindCSS on
Vercel; Supabase (PostgreSQL + Edge Functions) behind it; Stripe Connect as the
payment rail, not currently wired to the live flow.

Target user is the operator themselves, receiving work from clients who may not
want to register. **The priority is a court-admissible evidence trail over feature
breadth**, and that ordering has decided most of what follows.

## Where the product stands

**Evidence core.** The UI is wired to the DB-backed flow.

- A signed-in Earner creates an agreement, invites a counterparty by link, and both
  sides work from `AgreementView`. `ContractsHomeView` is the home screen.
- Accepting an invitation consumes the invite, records the claimed identity, issues
  the guest credential, moves the contract to `TERMS_ACCEPTED` and writes the
  acceptance evidence — **one database transaction, all or nothing**
  (`accept_invitation()`).
- Events are hash-chained and server-attested. Canonical v4 binds an agreement
  snapshot, so an acceptance proves the whole deal — price, deadline, which side
  performs — not only the completion criteria.
- Reachable states: `DRAFTING → AWAITING_ACCEPTANCE → TERMS_ACCEPTED →
  AWAITING_CONFIRMATION → PERFORMANCE_ACCEPTED` (terminal), with
  `performance.rejected` returning to `TERMS_ACCEPTED`. `SETTLED`, `DELIVERED` and
  `CANCELLED` are **not reachable** — money moves outside TrustFlow by design, and
  cancellation is undecided.
- Both parties can download the record, and they get **different documents**: the
  owner a self-contained re-verifiable audit trail, the guest a server-verified
  record that does not invite recomputation. Do not converge them — see
  `Decisions.md`.

The legacy five-step `ContractView` / Marketplace surface still exists on local
mock state, reachable only through command-palette entries labelled "(legacy)".
Its `logEvent` calls fail server-side by design. Do not mistake it for the real
flow, and do not read its "✅" history as evidence of anything working.

## Current State

- Branch **`main`**, HEAD **`6bd6a48`**, in sync with `origin/main`, tree clean.
- Build ✓ 0 errors (`index-*.js` 599 kB, css 62 kB). Unit tests **197 passing**
  across 12 files (`npm test`).
- **Two Supabase projects**, both in org `wavfjqgbnahqfhgeleqe` (free), Mumbai:

  | | ref | used by |
  |---|---|---|
  | `trustflow` | `fqgpzhwvvfsxswlnbbgg` | the deployed site, `.env` |
  | `trustflow-e2e` | `yqjtawffpesplqyurlpj` | live E2E only, `.env.e2e` |

  The split landed 2026-09-26 and is confirmed by where rows went, not by
  inference: production's newest contract is `07:15:46Z`, the E2E project's start
  at `07:30:57Z`. See `docs/e2e-project.md` for the whole arrangement.
- **28 migrations**, fully applied to both projects, all matching local filenames,
  nothing pending. **Rebuild from migrations is now verified** — all 28 applied in
  order to an empty database, which is how the two faults in `20260924132813` and
  `20260924140000` were found. The rebuilt schema matches production: both
  acceptance functions with `execute` to `service_role` only, both append-only
  rules on `events`, 10 policies, 5 tables, `invite_token` uuid, `hash_version`
  default 4.
- **Edge Functions.** Production has six: `log-event`, `validate-invite-token`,
  `guest-contract-events` (all called from `src/`), plus `create-payment-intent`,
  `capture-payment`, `cancel-payment` (deployed and current, but unreachable from
  the app). The E2E project has the first three. Every deployed source has been
  downloaded back and diffed against local — do that rather than reading
  `updated_at`, which has shown a secrets re-bundle as if it were a deploy.
- **`send-acceptance-email` and `timestamp-event` were deleted** from Supabase on
  2026-09-26; both endpoints now 404. Sources stay in the repo with a header
  explaining why they must not be redeployed.
- **Live E2E suites cannot skip silently.** `tests/e2e/liveEnv.js` owns the four
  credentials, loads `.env.e2e` itself and throws when one is missing;
  `TF_LIVE_E2E=skip` is the only way to skip. `tests/reporters/noSilentSkip.js`
  fails a run in which nothing executed or one spec file was emptied.
  `tests/e2e/00-backend-guard.spec.js` asserts the page under test reports the
  expected Supabase URL.
- **Suite status on the E2E project — every live suite has now run there**, and
  stands at **91 of 92**: `00-backend-guard` 1/1, `atomic-acceptance` 10/10,
  `agreement-binding` 15/15, `guest-evidence` 11/11, `event-ingestion` 10/10,
  `earner-signin` 8/8, `contracts-home` 13/13, `evidence-core` 16/16,
  `invite-persistence` **7/8**. The single failure is "an unverified (anonymous)
  Earner cannot persist a contract at all", which needs an anonymous JWT to
  present and so cannot run while anonymous sign-ins are off — see Next
  Priority #1. No code is implicated.
- **Frontend**: Vercel, `https://project-trustflow.vercel.app`, git-push-to-deploy
  from `main`, project `team-kenji/project-trustflow`. `.env` still points at
  production, so the site is unaffected by the E2E split. GCP hosts nothing for
  TrustFlow any more.
- **Auth**: anonymous sign-ins **on** in production, **off** in the E2E project
  (see Next Priority #1). Production's only non-anonymous user is the QA Earner
  `trustflow.qa.1790033400@gmail.com`; the E2E project has its own.
- **Secrets**: production has `RESEND_API_KEY`, `EMAIL_FROM`, `INVITE_SECRET` and
  `STRIPE_SECRET_KEY` set; the first three are now unused by any deployed function.
  The E2E project needs only `STRIPE_SECRET_KEY`, and only if `capture-payment` is
  deployed there. `VITE_STRIPE_PUBLISHABLE_KEY` is unset, so `PaymentModal` would
  run in Test Mode — and nothing opens it.

## Active Constraints

- **Do not add npm packages** without explicit approval.
- **Do not deploy migrations or Edge Functions, or touch Stripe production config,
  without explicit instruction.** Each deploy is approved individually.
- **Push migrations with `supabase db push`, never the management API.** The API
  stamps its own version numbers; that caused the history drift twice, and each
  repair leaves another permanent `reconcile_*` file. Note that `db push` has no
  `--project-ref` — use `--db-url`, or the linked project.
- **Never run the full E2E suite repeatedly.** Three back-to-back runs on
  2026-09-24 saturated the per-IP signup cap through anonymous `/signup` and took
  production offline until a manual restart. The E2E project has its own budget
  now, which shrinks the blast radius but not the cost of a saturated cap.
- **Do not restart, delete or otherwise destructively touch the production Supabase
  project.** Recovery actions are the user's call.
- **Do not redeploy `send-acceptance-email` or `timestamp-event`.**
- **Do not delete production's existing test data.** A boundary against new writes
  was what was wanted; see Open Decisions.
- Gemini API and eKYC are out of scope for the current MVP spec. Check before
  picking either up — that decision may be stale.

## Next Priority (in order)

1. **Enable anonymous sign-ins on the E2E project, then run the remaining suites
   once.** `/auth/v1/signup` there answers "Anonymous sign-ins are disabled".
   `invite-persistence` mints an anonymous identity and cannot run without it;
   `guest-evidence` passes without it. It is a dashboard toggle (Authentication →
   Sign In / Providers); doing it from a session would need the account-level
   access token, which is deliberately not reached for. Afterwards run
   `contracts-home`, `earner-signin` and `invite-persistence` — and
   `event-ingestion` / `evidence-core`, which additionally need `capture-payment`
   deployed there with a test-mode `STRIPE_SECRET_KEY`.

2. **Cancellation: build only the withdraw-before-acceptance half.** Decided
   2026-09-25, not implemented. Voiding an *accepted* agreement remains undecided.
   Needs `derive_contract_state()` to project the withdrawal.

3. **Docs**: `Protocol.md` is two contradictory legacy documents concatenated and
   is not usable as-is. `Roadmap.md` describes a model the code no longer
   implements and contradicts itself. `Decisions.md` contains a contradiction on
   guest dispute rights. None of the three tracks the MVP consistency work.

4. **The rest of the MVP consistency refactor**, from a full-spec review whose spec
   is not in this repo: the full state machine (`FUNDED`, `ACCEPTED`,
   `AUTO_ACCEPTED`, `DISPUTED`, `REFUNDED` do not exist), fault-attributed
   cancellation penalties (currently a flat -30 to both parties), `App.jsx`
   decomposition, escrow-terminology cleanup. Trust Score / Trust Passport do not
   exist in code and are out of scope.

## Open Decisions

- **What to do with production's test data.** All 1272 contracts and 2310 events
  there belong to the QA Earner; there is no real data. Not deleted, and the
  boundary now stops new test writes, so this is no longer urgent — but it is not
  resolved. The mechanics that make it a decision rather than a chore:
  `no_delete_events` / `no_update_events` are **`DO INSTEAD NOTHING`**, so a
  `DELETE` on events *succeeds and deletes nothing*; `contracts` has no such rule
  and `events.contract_id` is `text`, not a foreign key, so **814 of the 2310
  events are already orphaned** by earlier contract deletions. Options: delete the
  contracts and accept the orphans, mark them with an `is_test` column and filter
  everywhere, or leave them. Deciding before a real contract exists is still the
  point, because after that its events are permanent by design.
- **Nothing is recorded when an agreement is created.** `createContract` inserts the
  row and logs no event, so the acceptance is always the chain's first event. A
  `contract.created` event would make chain handling uniform, but whether the
  evidence chain should record creation is a design question. Note that inserting
  one event by hand before testing acceptance would have **masked** the chain-tip
  bug.
- ~~A check for migration-history drift.~~ **Built** (`c8a18c2`):
  `scripts/check-migrations.mjs`, wired into `make check`. Offline it verifies
  filename shape, unique versions, and that no migration writes history for a
  version dated after itself — the fault that stopped the rebuild at 22 of 28.
  With `--live` it fails on any recorded version no local file claims, which is
  the management-API drift. Every path was verified by deliberately breaking it.
  What remains open is whether to run it in CI: this repository has no
  `.github/workflows` at all, and the offline half needs no credentials, so a
  workflow would be cheap — but adding one starts running checks on every push,
  which is a decision rather than plumbing.
- **Nobody has systematically diffed the live catalogue against the migrations.**
  `events` was found by accident during the outage, not by a check designed to find
  it; `rls_auto_enable()` and `ensure_rls` were the same kind of find. Other
  hand-made objects may exist.
- **`idx_events_contract_id` is probably redundant** — `events_contract_created_idx`
  covers `(contract_id, created_at desc)`. Reproduced as-is because the recovered
  baseline's job was to describe the database that exists; dropping it wants query
  evidence.
- **Whether to keep the two deleted functions' sources at all.** Kept for now
  because a payment flow may return. If it does not, deleting the files is tidier
  than a header explaining why they are inert.

## Lessons this project has already paid for

- **Check a plpgsql function's parameter types against the real column types.** Two
  uuid-vs-text faults shipped and broke acceptance completely in production.
  PostgreSQL coerces an unknown-typed *literal* to uuid, so the same predicate
  written by hand in psql works while an already-`text` parameter does not — which
  makes this invisible to review and visible only on execution.
- **A test suite that has never run is worth nothing**, and a skip that reports
  success is worse than a failure. `atomic-acceptance` said "10 skipped", exited 0,
  and the code it guards was entirely broken.
- **Verify a deploy by downloading the deployed source and diffing it.** An
  `updated_at` change can be a secrets re-bundle.
- **Being unreachable from `src/` protects nothing.** An Edge Function is a public
  HTTPS endpoint, and the anon key that authorizes it ships in the frontend bundle.
- **A comment asserting a behaviour is not that behaviour.** Several comments in
  this repo confidently described inertness, skipping and collision ordering that
  the code did not implement, and each was found only by running it.

## Key Files

- `AGENTS.md` — agent behaviour rules. `CLAUDE.md` only imports it.
- `Decisions.md` — architectural decisions; do not reverse without instruction.
- `docs/e2e-project.md` — the two-project arrangement, what enforces the boundary,
  and the order to rebuild in.
- `supabase/functions/_shared/eventCanonical.ts` — the one definition of what an
  event's hash covers. `_shared/eventRecord.ts` — the one place an event row is
  assembled.
- `src/lib/auditExport.js` — the owner's audit export.
  `src/lib/guestRecordExport.js` — the guest's.
- `src/lib/trustpoints.js` — earn/spend rules, one unified ledger.
- `tests/e2e/liveEnv.js` — credentials, and the refusal to run without them.
- `src/lib/invite.js` and `src/lib/tsa.js` — **dead**. The first is the legacy
  client-side HMAC invite system; the second is imported by nothing and its Edge
  Function is deleted.
- `Protocol.md`, `Roadmap.md` — stale, see Next Priority #3.
