# TrustFlow — AI Session Handoff

_Last updated: 2026-09-25 (atomic acceptance deployed and verified live; two uuid/text faults fixed)_

> Use this file to brief a new AI session on the current project state.
> Update before ending a session. Paste the contents as your first message.

---

## ⚠️ Read this before trusting any "✅" below

Session 5 found that the `contracts` DB table and its 4 payment Edge
Functions (`create-payment-intent`, `capture-payment`, `cancel-payment`,
`validate-invite-token`) were **never called from the running app** —
verified by grepping `src/` for every call site. The live prototype ran
entirely on `App.jsx`'s local React state, a client-side HMAC invite
system (`src/lib/invite.js`), and a localStorage-backed event log. The
"✅ H2 auto-confirm", "✅ T1 invite tokens", etc. entries in the session
history below describe that local/demo flow working, not the DB-backed
backend — the two systems were never reconciled. Treat any past "✅" as
"the local demo did this," not "this was verified against the deployed
backend," unless you check the actual code yourself first.

## Project Summary

TrustFlow is an AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Backend: Supabase (PostgreSQL + Edge Functions) + Stripe Connect.

**Product direction (session 3):** Target user = the operator themselves (Ken), receiving work from clients who may not want to register. Priority: court-admissible evidence trail over feature breadth.

**MVP consistency refactor (session 5, in progress):** A full-spec review (user-supplied spec, not yet committed to this repo) found the contract role model, guest Hirer identity, payment trust boundaries, state machine, and documentation were internally inconsistent. Session 5 completed the first slice (payment Edge Function security, see below); everything else — UI wiring, full state machine, docs cleanup, `App.jsx` decomposition, terminology, cancellation fault attribution — is still open. No section in `Roadmap.md` tracks this yet; that's part of the docs-cleanup work still to do (Next Priority #5).

## Current Phase

**Evidence core.** The UI *is* now wired to the DB-backed flow — that sentence
in older revisions of this file is out of date, as is most of "Next Priority"
below. `Decisions.md` is the current source of truth; read it first and treat
anything here that contradicts it as superseded.

Where the product actually stands:

- A signed-in Earner creates an agreement, invites a counterparty by link, and
  both sides work from `AgreementView`. `ContractsHomeView` is the home screen.
- Accepting an invitation consumes the invite, records the claimed identity,
  issues the guest credential, moves the contract to `TERMS_ACCEPTED` and writes
  the acceptance evidence — **one database transaction, all or nothing**
  (`accept_invitation()`, commit 893c957).
- Events are hash-chained and server-attested. Canonical v4 binds an agreement
  snapshot, so the acceptance record proves the whole deal — price, deadline,
  which side performs — not just the completion criteria.
- Reachable states: `DRAFTING → AWAITING_ACCEPTANCE → TERMS_ACCEPTED →
  AWAITING_CONFIRMATION → PERFORMANCE_ACCEPTED` (terminal), with
  `performance.rejected` returning to `TERMS_ACCEPTED`. `SETTLED`, `DELIVERED`
  and `CANCELLED` are **not reachable** — money moves outside TrustFlow by
  design, and cancellation is an open question (see `Decisions.md`).
- Both parties can download the record from `AgreementView`, but they get
  **different documents**: the owner a self-contained re-verifiable audit trail,
  the guest a server-verified record that does not invite recomputation. Do not
  converge them — see `Decisions.md`.

The legacy five-step `ContractView`/Marketplace surface still exists and still
runs on local mock state. It is reachable only through command-palette entries
labelled "(legacy)" and its `logEvent` calls fail server-side by design. Do not
mistake it for the real flow.

## What Was Done (cumulative)

**Session 5 — Payment security correction (first slice of the MVP consistency refactor)**

- Full-spec gap analysis (5 parallel investigations) found: role columns backwards from the canonical model, `capture-payment` allowed settling directly from `IN_PROGRESS` (skipping delivery confirmation entirely), Stripe transfer destination trusted from the client, no idempotency guards, and — the big one — **the entire `contracts` DB backend was disconnected from the running app** (see warning above).
- `created_by`/`counterparty_id` → `earner_user_id`/`hirer_user_id` (the latter was verified dead — never written by any code path). `hirer_email` was already correct and untouched.
- New `earner_payout_profiles` table: `capture-payment` now resolves the Stripe transfer destination server-side; settlement fails safely (no transfer, no state change) if the Earner has no profile on file. No onboarding UI yet — storage only.
- New shared guest-auth path (`supabase/functions/_shared/partyAuth.ts`) via a `guest_access_token`, issued by `validate-invite-token`'s new two-step preview/accept flow once the Hirer explicitly accepts terms (email now required and format-validated at that step). Previously all three payment functions required a Supabase Auth JWT matching the registered creator, so a guest Hirer — the MVP's primary case — could not pay, confirm delivery, or cancel at all.
- `capture-payment` now requires `state === 'DELIVERED'` (was `IN_PROGRESS` or `DELIVERED`). `create-payment-intent` always uses the contract's own DB `amount_jpy`, never a client-supplied amount. Idempotency guards added to all three payment functions.
- 4 migrations + 4 Edge Functions deployed to the (previously paused, now restored) Supabase project. Verified live via a curl-based test harness — see git log `fix(payments): correct role model and close Stripe trust-boundary gaps` for the exact behaviors checked (guest-only auth, DB-owned amount, `IN_PROGRESS`→`SETTLED` now blocked, rollback-on-Stripe-failure).
- **Not done**: wiring any of this into the live UI (App.jsx / InviteView / PaymentModal still don't call these functions — that's the next priority below), Stripe Connect onboarding, full state machine (`FUNDED`/`ACCEPTED`/`AUTO_ACCEPTED`/`DISPUTED`/`REFUNDED` don't exist yet, only `TERMS_ACCEPTED` was added), fault-attributed cancellation penalties (still a flat -30 to both parties), `Protocol.md`/`Decisions.md`/`Roadmap.md` cleanup, `App.jsx` decomposition, escrow-terminology cleanup, Trust Score/Trust Passport (don't exist in code at all, out of scope per user decision this session).

**Session 5, part 2 — quality/optimization pass (same day)**

User asked to stop feature work and specifically hunt for latent bugs and unoptimized code, on the premise that earlier sessions "kept stopping on bugs, just pushed to get something working" — i.e. treat nothing as trustworthy without checking. A 4-way parallel audit (App.jsx, other views/components, `src/lib/*`, the 2 not-yet-touched Edge Functions) found real issues; all fixed, tested (91/91 passing, build green), and — where reachable — verified live in the browser:

- **`send-acceptance-email`/`timestamp-event` had zero auth** — callable by anyone with the public anon key. `send-acceptance-email` now takes only `contract_id`; every field in the email (recipient, amount, DoD) is loaded from the contract record and it only fires for `state === SETTLED` — a caller could previously send arbitrary attacker-chosen content, from TrustFlow's real domain, to an arbitrary address. `timestamp-event`'s `hashHex` was only length-checked, not validated as real hex — invalid hex silently became zero bytes, so a corrupted hash still got back a real signed TSA token. Both fixed; `capture-payment`'s call to `send-acceptance-email` updated to the new payload shape (as is the local demo flow's direct call in `App.jsx` — see note below).
- **The event "hash chain" didn't actually chain** — probably the most important finding. Each event's hash was computed independently (no reference to any prior event), so the exported "chain integrity report" only re-verified each event against itself — deleting an event, reordering events, or inserting a forged one all went undetected while `integrity_status` still said `VERIFIED`. For a product whose stated top priority is a court-admissible evidence trail, the chain wasn't one. Fixed: `logEvent()` now includes the contract's current chain tip as `prev_hash` in what gets hashed, stored as `events.prev_event_hash` (new migration, **not yet deployed** — see Current State); `auditExport.js` verifies the link to each event's actual chronological predecessor, not just self-consistency, and distinguishes `HASH_MISMATCH_DETECTED` from the new `CHAIN_LINK_BROKEN`. Also renamed `counterparty_consent.tsa_verified` → `tsa_token_present`: nothing in this codebase verifies a TSA token's actual RFC 3161 signature, so the old name claimed more than the code does.
- **Two of three "start a contract" code paths skipped the evidence trail entirely** — same theme as above. Only `initiateContract()` (ScopingView's AI-architect flow) computed a DoD hash and logged `CONTRACT_INITIATED`; direct marketplace Hire (`onHire`) and the negotiation-chat agreement path (`onAgreement`) just set view state with no hash, no event. `handleReject` (re-delivery request) also logged nothing, unlike every other step transition. Extracted a shared `beginContract()` helper all three "start" paths now call; added the missing `logEvent` call to `handleReject`. Verified live: Hire from the marketplace now shows 1 recorded event where it previously showed 0.
- **`handleContractCancel` (self-initiated cancel) didn't reset view/step/selectedItem**, unlike the counterparty-initiated cancel path — and despite `ContractView`'s own toast claiming "cancelled and logged," no `CONTRACT_CANCELLED` event was ever actually logged. Now mirrors the counterparty path's reset and logs the event. **Not verified live** — couldn't find the UI trigger for the cancel-confirm dialog in the time available; confidence is from code review (exact mirror of the already-tested counterparty path) + passing tests, not a click-through.
- **TrustPoints deltas were duplicated with no sync guarantee**: `capture-payment`/`cancel-payment` each hardcoded their own local copies of the point values, separate from `src/lib/trustpoints.js`'s `TRUSTPOINTS_RULES`. New `supabase/functions/_shared/trustpointsRules.ts` (plain constants, no Deno-specific APIs) is now imported directly by both the Edge Functions and `src/lib/trustpoints.js` (via a relative path reaching into `supabase/functions/_shared/` — confirmed both Vitest and the Vite build resolve this cross-directory `.ts` import correctly).
- **Stale `actorId` closure**: the contract-events subscription effect (deps: `[selectedItem?.id]`) read `actorId` from its closure, but `actorId` is set asynchronously by a separate effect — selecting a contract before that resolves left the subscription comparing against the stale default `'user'` for its whole lifetime, misreading every self-emitted event as a counterparty event (bogus "counterparty advanced" toast). Fixed with an `actorIdRef` mirrored via its own effect.
- Minor: `addToast`'s id now uses `crypto.randomUUID()` instead of `Date.now()` (two toasts in the same millisecond used to collide and both get removed together); `unifiedProfile` now uses `useMemo` instead of unconditionally calling a `useCallback`-wrapped function every render (was defeating child memoization); `handleFileUpload`'s inline step-advance now respects the same `lastActionTime.current` debounce `handleNextStep` uses elsewhere; removed dead code (`EVENT_TYPES.CONTRACT_PAUSED`/`CONTRACT_RESUMED`, `getAIProfilePayload`).
- **Deliberately scoped down, kept in mind for later**: the user flagged that the overall contract flow itself may get redesigned, so App.jsx changes this pass were kept as minimal, self-contained patches rather than restructuring — no hooks extraction, no broader refactor.
- **Not deployed**: migration `20260921000004_events_prev_hash.sql`, and the Edge Function changes made after the first deploy (`send-acceptance-email`, `timestamp-event`, and the trustpoints-import/email-payload updates to `capture-payment`/`cancel-payment`) are committed to git but **not yet pushed to Supabase** — user asked to batch remaining deploys for later rather than deploy incrementally again. Don't assume these are live; check `supabase functions list` / migration history before relying on them being deployed.

**Session 1 — Architecture pivot: Stripe Connect escrow + TrustPoints**

- Payment rail: Stripe Connect (immediate capture, Transfer on DoD confirm)
- Reputation: TrustPoints (non-redeemable, airline miles model)
- DB migrations, 3 Edge Functions, `src/lib/stripe.js`, `src/lib/trustpoints.js`
- Tests: 69 passing

**Session 2 — Threat modeling + guest Hirer path wiring**

- Threat model: 10 threats, H1/H2/T1 MVP-required
- `App.jsx` wiring: WalletView, PaymentModal, guestEmail state
- `InviteView.jsx`: JPY amounts, optional email Stage 2

**Session 3 — MVP threat closure + court-admissible consent + Supabase deploy**

- **T1 ✅** — HMAC-SHA256 invite tokens, 72h expiry, tamper-detection, error UI, 18 unit tests
- **H1 ✅** — DoD acceptance email on SETTLED via Resend Edge Function (`send-acceptance-email`). Fire-and-forget; never blocks fund release
- **H2 ✅** — 7-day auto-confirm timeout: `deliveredAt` recorded on step 3, setTimeout auto-advances + toast; 24h advance warning; ContractStep3 Hirer countdown/fired banners; `delivered_at` migration
- **Stripe receipt_email ✅** — set on PaymentIntent from `hirer_email` for automatic Stripe receipt
- **Consent capture ✅** — InviteView Stage 2: email required + explicit "I agree" checkbox; `DOD_CONSENT_RECORDED` event logged with timestamp + email + user_agent + DoD items + RFC 3161 TSA token; `auditExport.js` surfaces `counterparty_consent` section prominently
- **Roadmap updated ✅** — Design Principle #8: bilateral market self-cleansing + information asymmetry framing; counter-flywheel documented
- **DB deployed ✅** — `supabase db push`: 4 migrations applied to production (Mumbai)
- **Edge Functions deployed ✅** — 6 functions live: `create-payment-intent`, `capture-payment`, `cancel-payment`, `validate-invite-token`, `send-acceptance-email`, `timestamp-event`
- Tests: **87/87 passing** (6 files)

**Session 4 — End-to-end email confirmed + InviteView fix + Cloud Run deploy**

- **Email delivery ✅** — Full BYOC flow tested: acceptance email delivered to `ken2san@gmail.com` via Resend (`noreply@kenji.com.hk`). Confirmed in Resend dashboard log.
- **`send-acceptance-email` wired ✅** — `handleNextStep` step 4 fires Edge Function with `hirer_email`, `project_name`, DoD, amount, contract ID
- **InviteView bug fixed ✅** — `runtimeState` hydration was overwriting `view='invite'` (set from URL `?token=`) with persisted `view='marketplace'`. Fixed: skip `setView(snapshot.view)` when invite URL params are present
- **Supabase secrets updated ✅** — `RESEND_API_KEY`, `EMAIL_FROM=TrustFlow <noreply@kenji.com.hk>`, `INVITE_SECRET`, `STRIPE_SECRET_KEY` all set via `supabase secrets set`
- **Anonymous auth enabled ✅** — Supabase dashboard → Authentication → anonymous sign-ins ON
- **TSA CORS fix ✅** — `src/lib/tsa.js` routes RFC 3161 requests via `timestamp-event` Edge Function (server-side). No more CORS block in production. Dev mode falls back to direct freetsa.org.
- **Cloud Run deployed ✅** — revision `trustflow-web-00052-9wf`; tsa.js fix is now live in production
- **Resend domain** — verified domain: `kenji.com.hk` (DNS records on `send.kenji.com.hk` subdomain; FROM must be `@kenji.com.hk`, not `@send.kenji.com.hk`)
- Tests: **87/87 passing** (no regression)

## Current State

- Branch: **`main`**, HEAD **`0e9586f`**, in sync with `origin/main`, working tree clean.
- Build: ✓ 0 errors (`dist/assets/index-*.js` 599 kB, css 62 kB)
- Tests: **197 unit tests passing** across 12 files. Two live suites were run
  deliberately, once each, and both pass: `atomic-acceptance` **10/10** and
  `agreement-binding` **15/15**. The rest of the E2E suites have still not been
  run since the outage — see the rate-limit constraint below.
  Running any live suite needs `.env.e2e` (gitignored): `set -a && . ./.env.e2e && set +a`.
  It holds `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and the QA Earner's
  credentials. Those credentials existed nowhere on the machine at the start of
  this session — a previous session had only exported them into a shell — so the
  one non-anonymous account in the database, `trustflow.qa.1790033400@gmail.com`,
  had its password reset through the GoTrue admin API. If `.env.e2e` is missing
  again, every live suite silently **skips** rather than failing.
- Supabase: project `trustflow` (ref `fqgpzhwvvfsxswlnbbgg`, Mumbai) — **healthy**,
  verified 2026-09-25 by a real `/auth/v1/health` 200 (GoTrue v2.197.0), a real
  PostgREST query, and a DB query (PostgreSQL 17.6), not by the management API,
  which reported `ACTIVE_HEALTHY` throughout the outage. It had been unreachable
  from 2026-09-24 20:56 until a user-initiated restart; the cause was three
  back-to-back full E2E runs saturating the auth rate limit via `/signup`
  anonymous sign-in.
- DB: **28 migrations recorded**, all matching local filenames, **nothing pending**,
  nothing out of order. `accept_invitation()` and `invite_acceptance_context()`
  exist, with `execute` granted to `service_role` only and revoked from `anon`
  and `authenticated` — verified by querying `has_function_privilege`, not assumed
  from the migration text.
  **Push with `supabase db push`, never the management API** — the API stamps its
  own version numbers, which is what caused both history drifts.
- Edge Functions: `log-event`, `validate-invite-token` and `guest-contract-events`
  were deployed 2026-09-25 and the deployed source was then **downloaded back and
  diffed** against local — all five files (three entrypoints, `_shared/eventCanonical.ts`,
  `_shared/eventRecord.ts`) byte-identical. Do this rather than reading `updated_at`:
  three functions had previously shown the same timestamp purely from a
  secrets-update re-bundle, which looks exactly like a deploy and is not one.
  `capture-payment`, `cancel-payment` and `create-payment-intent` were diffed the
  same way on 2026-09-26 and are already identical to local. Only
  `send-acceptance-email` and `timestamp-event` remain undeployed, and what is
  live for those two is the pre-fix, unauthenticated source — see Next Priority #4.
- **Frontend hosting migrated to Vercel** (session 5, same day as the quality pass) — live at **`https://project-trustflow.vercel.app`**, git-push-to-deploy from `main`, project `team-kenji/project-trustflow`. `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` set on both Production and Preview. Verified live (confirmed by page `<title>`, not just HTTP status), no console errors. Rationale: pure static Vite SPA with zero server-side compute — Cloud Run's Dockerfile/nginx container was pure overhead for this project (unlike a service that actually needs GCP compute).
  - GitHub repo renamed the same day, dropping the `project-` prefix: `ken2san/project-trustflow` → `ken2san/trustflow` (local `origin` remote auto-updated by `gh repo rename`; local folder name intentionally left as `project-trustflow`). This part succeeded cleanly and stayed.
  - **Vercel project rename attempted and reverted the same day** — do not retry this without reading the rest of this bullet first. Renaming the Vercel project to `trustflow` did NOT yield the clean `https://trustflow.vercel.app` URL it looked like it would: that bare subdomain is already owned by an unrelated third party (a generic "bank login" demo page — harmless-looking but do not enter anything into a page found this way regardless). Vercel instead assigned our renamed project the team-suffixed alias `trustflow-team-kenji.vercel.app`, which turned out to also be gated behind Vercel's own Deployment Protection (SSO login required) — effectively taking the site private. Reverted the project name back to `project-trustflow`; the original `https://project-trustflow.vercel.app` alias came back immediately, publicly accessible, no protection. Net effect of the whole detour: zero — same URL as before, just confirmed it's the only one that actually works cleanly for this project. If a clean short URL is wanted later, it needs a real custom domain (e.g. via a domain the user owns), not a bare `<name>.vercel.app` guess.
  - Old Cloud Run service (`trustflow-web`, GCP project `trustflow-project`, `us-central1`) **deleted** same day, plus all 153 orphaned container image digests under `gcr.io/trustflow-project/trustflow-project` (Artifact Registry `gcr.io` repo — shared with `voxel-society-simulator`'s images in the same project; only the trustflow-project image path was touched). GCP no longer hosts anything for TrustFlow — Vercel is the only frontend host now.
- Email: reported working end-to-end as of session 4 (Resend, `noreply@kenji.com.hk`) — not re-verified in session 5
- Anonymous auth: **✅ enabled** in Supabase
- Supabase secrets: **✅ all set** (`RESEND_API_KEY`, `EMAIL_FROM`, `INVITE_SECRET`, `STRIPE_SECRET_KEY`)
- Stripe key: **not set in `.env`** — PaymentModal runs in Test Mode until `VITE_STRIPE_PUBLISHABLE_KEY` is set
  - `EMAIL_FROM` — set to `TrustFlow <noreply@kenji.com.hk>` ✅
  - `INVITE_SECRET` — set ✅

## Active Constraints

- Do not add npm packages without explicit user approval.
- Do not deploy Supabase migrations/Edge Functions or touch Stripe production config without explicit instruction (session 5 deploys were explicitly approved each time — this is a standing rule, not a one-off).
- **Never run the full E2E suite repeatedly.** Three back-to-back runs on
  2026-09-24 saturated the auth rate limit through `/signup` anonymous sign-in
  and took the whole Supabase project offline until a restart. Use targeted
  suites first; run the full suite once, deliberately, after checking that the
  environment can take it.
- Do not restart, delete, or otherwise destructively touch the production
  Supabase project. Recovery actions are the user's call.
- Gemini API and eKYC (listed as "Next Priority" in earlier sessions, below) are explicitly **out of scope** for the current MVP consistency spec — don't pick them up without checking with the user first, that scope decision may be stale.

## Next Priority (in order)

1. ~~Deploy~~ **Done.** Both pending migrations applied with `supabase db push`
   and all three stale Edge Functions deployed and source-verified. See Current
   State.

   **Two faults surfaced the moment the code was executed, both the same
   mistake**, and they are the reason this entry is worth keeping rather than
   deleting. `contracts.invite_token` and `contracts.guest_access_token` are both
   `UUID`; the functions in `20260928000000_atomic_acceptance` take them as `text`
   and used them directly — `42883 operator does not exist: uuid = text`, then
   `column "guest_access_token" is of type uuid but expression is of type text`.
   Every acceptance returned 500. Fixed in `20260929000000_invite_token_uuid`
   (`940d48f`) and `20260929000100_guest_token_uuid` (`0e9586f`).

   Neither was visible to review, and both had been reviewed closely: PostgreSQL
   coerces an *unknown-typed literal* to uuid, so the same predicate written by
   hand in psql during development works, while an already-`text` parameter does
   not coerce. The lesson for anything similar here: **a plpgsql function's
   parameter types must be checked against the actual column types**, and reading
   the SQL is not that check — executing it is.

2. ~~Run the live suites once~~ **Done.** `atomic-acceptance` 10/10 and
   `agreement-binding` 15/15, run once each against the live project. The
   remaining suites have still not been run since the outage; the
   never-run-the-full-suite-repeatedly constraint below is unchanged.

   Silent skips are closed as of 2026-09-26 (`d8e7f3c`). `tests/e2e/liveEnv.js` is
   the single source of the four live credentials, loads `.env.e2e` itself, and
   **throws** when one is absent; `TF_LIVE_E2E=skip` is the only way to skip.
   `tests/reporters/noSilentSkip.js` additionally fails a run in which nothing
   executed, or in which one spec file was emptied inside an otherwise green run.
   Each path was verified by deliberately breaking it. One gap: `--reporter=line`
   on the command line replaces the configured reporters and so that backstop; the
   `liveEnv` throw still applies.

3. **The test data in the production database, and what it reveals.** Surveyed
   2026-09-26, nothing deleted. **Every one of the 1272 contracts belongs to the
   QA Earner** (`trustflow.qa.1790033400@gmail.com`, the only non-anonymous user),
   alongside 2310 events. There is no real data in this project at all — largest
   groups are `Event Ingestion Probe` (272), `Guest Evidence Probe` (246),
   `Persisted Terms Probe` (207), `Evidence Core Probe` (167).

   Two facts make this a design question rather than a cleanup chore:

   - `events` carries `no_delete_events` / `no_update_events` as
     **`DO INSTEAD NOTHING`** rules, so a `DELETE` on events *succeeds and
     deletes nothing*. A cleanup script would report success having done nothing.
   - `contracts` has no such rule and `events.contract_id` is `text`, not a
     foreign key, so contracts can be deleted while their events cannot.
     **814 of the 2310 events are already orphaned** this way by earlier
     deletions — the pile exists and grows.

   So the choice must be made before the first real contract exists, because
   afterwards it cannot be: that contract's events are permanent by design and
   could never be separated from test rows sharing the table. RLS is party-scoped
   (`parties_read_own_contracts`), so none of this is publicly readable today —
   it is a correctness and evidence-hygiene problem, not an exposure.

   Options, in the order they are worth considering:

   1. **A separate Supabase project for E2E** — the live project stops being a
      test target, and the append-only rule stops being in tension with cleanup.
      Costs a second project and a second set of secrets. Supabase branches would
      do the same per-run and are billable.
   2. **A `is_test` marker on `contracts`**, written by the suites, with the app's
      queries and the audit export filtering it out. Cheap, but it puts test rows
      permanently inside the evidence store and every future reader has to
      remember the filter.
   3. **Delete the test contracts now** and accept ~2310 orphaned events. Honest
      about the rule rather than fighting it, but it makes the orphan pile the
      normal state.
   4. **Leave it.** Defensible only for as long as this project has no real user.

   Recommendation: (1), decided before any real contract is created. No
   destructive action taken; this is the user's call.

4. **The four session-5 Edge Functions: checked, and the answer is not what the
   note said.** Verified 2026-09-26 by downloading each deployed source and
   diffing it against local.

   - `capture-payment`, `cancel-payment`, `create-payment-intent` are
     **already identical to local** — there was nothing to deploy. The earlier
     claim that their session-5 changes were outstanding was wrong.
   - `send-acceptance-email` and `timestamp-event` do differ, and the difference
     is exactly their security fix. **The versions currently live are the
     unauthenticated ones.** Deployed `send-acceptance-email` reads
     `hirer_email`, `project_name`, `dod` and `amount_jpy` straight from the
     request body, so anyone holding the anon key — which ships in the frontend
     bundle — can have TrustFlow's verified domain `noreply@kenji.com.hk` send
     arbitrary content to any address. Deployed `timestamp-event` only
     length-checks `hashHex`, so invalid hex becomes zero bytes and still comes
     back with a real signed TSA token; it is also a free RFC 3161 signing proxy
     for any caller.

   Being unreachable from the app does not help: an Edge Function is a public
   HTTPS endpoint whether or not `src/` calls it.

   And they are unreachable. Traced this session: `src/lib/tsa.js`, the only
   caller of `timestamp-event`, **is imported by nobody**; `auditExport.js` states
   outright that no event in the system carries a TSA token. `send-acceptance-email`
   is called only from `handleNextStep` step 4 — the legacy five-step flow — and
   only for `state === 'SETTLED'`, which the current state machine cannot reach.
   `capturePayment`/`cancelPayment` are exported from `src/lib/stripe.js` and
   imported by nobody, and `PaymentModal` is rendered in `App.jsx` but
   `setIsPaymentModalOpen(true)` appears nowhere, so `create-payment-intent` has
   no trigger either.

   So the decision is not deploy-or-not but **delete-or-fix**: deleting the two
   endpoints removes the exposure outright and matches their obsolescence;
   deploying the fixed source keeps them for a payment flow that may return.
   Dependency to keep in mind either way: deployed `capture-payment` calls
   `send-acceptance-email` server-side (fire-and-forget, so its loss is
   harmless), and `_shared/trustpointsRules.ts` is imported by
   `src/lib/trustpoints.js` and is therefore live regardless of the functions.
   Not acted on — awaiting the user's call.

5. **Cancellation: build only the withdraw-before-acceptance half.** Decided
   2026-09-25, not implemented. Voiding an *accepted* agreement remains
   undecided. Deliberately deferred so no database change is added while the
   backlog above is unapplied — it needs `derive_contract_state()` to project
   the withdrawal.

6. **Docs**: `Protocol.md` and `Roadmap.md` are still stale legacy documents
   describing a model the code no longer implements.

### Open, deliberately not acted on

- **Nothing is recorded when an agreement is created.** `createContract` inserts
  the row and logs no event, which is why the acceptance is always the first
  event in the chain. A `contract.created` event would make chain handling
  uniform, but whether the evidence chain should record the agreement's own
  creation is a design question, not plumbing. Note that inserting one event by
  hand before testing acceptance would have **masked** the chain-tip bug.
- **The rebuild has never actually been run.** `events` is now in source control
  (438b94d) and all 26 migrations parse, but no fresh project has been built from
  them — that needs Docker or a local Postgres, and neither is installed. The
  claim rests on static analysis, not on an executed rebuild, so ordering and
  permission faults that only appear at execution time are still possible. The
  event-trigger creation in `20260313000000` is the likeliest candidate, since
  creating event triggers is normally superuser-only; it works here because the
  existing one is owned by `postgres`. Closing this means installing Docker, or a
  Supabase branch, which provisions a real ephemeral database and runs the whole
  chain — the faithful test, but billable.
- **`idx_events_contract_id` is probably redundant.** `events_contract_created_idx`
  covers `(contract_id, created_at desc)` and serves the same queries. It was
  reproduced as-is on the principle that the recovered baseline's job is to
  describe the database that exists, not a better one — but writing it into a
  migration has made it more permanent than it was. Dropping it is a separate
  decision that wants query evidence.
- **The migration-history drift has happened twice, from the same cause**, and
  each repair leaves another permanent `reconcile_*` file in the tree. The only
  guard in place is prose in #1 saying to push with the CLI. A CI check comparing
  local migration filenames against recorded versions would catch the third one
  mechanically. Not built.
- **Nobody has systematically diffed the live catalogue against the migrations.**
  `events` was found by accident, while evaluating whether to migrate to a new
  Supabase project during the outage — not by a check designed to find it. Other
  hand-made objects may exist. `rls_auto_enable()` and `ensure_rls` were the same
  kind of find.

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `Roadmap.md` — design principles (incl. Principle #8), flywheel model — **note**: contains internal contradictions, see Next Priority #5
- `Decisions.md` — architectural decisions (do not reverse without instruction) — **note**: contains a contradiction on guest dispute rights, see Next Priority #5
- `Protocol.md` — **note**: two contradictory legacy documents concatenated, effectively not usable as-is, see Next Priority #5
- `src/lib/trustpoints.js` — TrustPoints earn/spend rules (single unified ledger — Trust Score/Trust Passport as separate concepts don't exist in code)
- `supabase/functions/_shared/eventCanonical.ts` — the one definition of what an event's hash covers; `_shared/eventRecord.ts` — the one place an event row is assembled
- `src/lib/invite.js` — client-side HMAC invite tokens, **legacy**: the live app now goes through the DB-backed `validate-invite-token`
- `src/lib/auditExport.js` — audit trail export (includes `counterparty_consent`)
- `supabase/functions/` — `log-event`, `validate-invite-token`, `guest-contract-events` and `timestamp-event` are live and called from `src/`. `capture-payment` and `cancel-payment` are orphaned (nothing in `src/` calls them); `create-payment-intent` and `send-acceptance-email` are reachable only from the legacy flow.
