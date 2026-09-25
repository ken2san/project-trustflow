# TrustFlow — AI Session Handoff

_Last updated: 2026-09-25 (chain-tip fix, verifier ordering, counterparty record export)_

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

- Branch: **`main`**, HEAD **`c245152`**, in sync with `origin/main`, working tree clean.
- Build: ✓ 0 errors (`dist/assets/index-*.js` 599 kB, css 62 kB)
- Tests: **197 unit tests passing** across 12 files. The Playwright E2E suites have
  NOT been run since the outage — see the rate-limit constraint below.
- Supabase: project `trustflow` (ref `fqgpzhwvvfsxswlnbbgg`, Mumbai) — **healthy**,
  verified 2026-09-25 by a real `/auth/v1/health` 200 (GoTrue v2.197.0), a real
  PostgREST query, and a DB query (PostgreSQL 17.6), not by the management API,
  which reported `ACTIVE_HEALTHY` throughout the outage. It had been unreachable
  from 2026-09-24 20:56 until a user-initiated restart; the cause was three
  back-to-back full E2E runs saturating the auth rate limit via `/signup`
  anonymous sign-in.
- DB: **24 migrations recorded**, all matching local filenames. Migration history
  was normalized on 2026-09-25 (`70421f5`) after a second round of drift.
  **Pending: exactly two** — `20260927235959_reconcile_evidence_migrations`
  (inert by design) and `20260928000000_atomic_acceptance`. Nothing out of order.
  `accept_invitation()` and `invite_acceptance_context()` do not exist yet.
  **Push with `supabase db push`, never the management API** — the API stamps its
  own version numbers, which is what caused both drifts.
- Edge Functions: the deployed source of `validate-invite-token` and `log-event`
  was fetched and read on 2026-09-25 — both are the **old pre-atomic-acceptance
  versions**. All three of `log-event`, `validate-invite-token` and
  `guest-contract-events` show `updated_at` 2026-09-24 20:34 UTC; the identical
  timestamps are a secrets-update re-bundle, not a deploy of current source.
  `guest-contract-events` also has the event-ordering fix (`3e2e60b`) undeployed.
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

1. **Deploy is unblocked — the three pre-deploy checks are answered.** The
   project recovered after a restart on 2026-09-25 (`/auth/v1/health` 200,
   GoTrue v2.197.0; PostgREST 200; PostgreSQL 17.6), and all three questions
   this entry used to ask have been settled by read-only capture:

   - `accept_invitation()` and `invite_acceptance_context()` **do not exist**,
     so `20260928000000` is definitively unapplied and the corrected file
     (fbf1b63) is what will land.
   - `events` has NOT NULL on only `id, type, contract_id, actor_id, payload,
     created_at` — every one supplied by `buildEventRecord` — and no GENERATED
     column. The `jsonb_populate_record` risk is retired.
   - Migration history had drifted again and is now normalized (70421f5). It
     holds 24 versions, all matching local filenames. Pending is exactly
     `20260927235959_reconcile_evidence_migrations` (inert) and
     `20260928000000_atomic_acceptance`, with nothing out of order.

   `events` is now in source control (438b94d), including the two append-only
   RULES and `rls_auto_enable()`, so a fresh project can be rebuilt from
   migrations. That rebuild has not actually been run — it needs Docker or a
   local Postgres, neither of which was available.

   So: `supabase db push`, then Edge Functions. Migration first —
   `validate-invite-token` against a database without `accept_invitation()`
   breaks acceptance outright. The chain-tip fix coalesces both sides, so that
   function no longer has to be deployed in step with its caller, but the
   ordering still holds.

   **Push with `supabase db push`, never the management API.** Applying through
   the API is what caused the history drift twice, and each repair costs another
   reconcile migration.

2. **Run the live suites once, not repeatedly**: `atomic-acceptance.spec.js`
   (14 tests, never yet executed — they are what would have caught the chain-tip
   bug) and `agreement-binding.spec.js`. Three back-to-back full-suite runs
   saturated the auth rate limit on 2026-09-24 and took the project offline;
   that is the outage still in effect. Targeted suites first, full suite only
   once and deliberately.

3. **Cancellation: build only the withdraw-before-acceptance half.** Decided
   2026-09-25, not implemented. Voiding an *accepted* agreement remains
   undecided. Deliberately deferred so no database change is added while the
   backlog above is unapplied — it needs `derive_contract_state()` to project
   the withdrawal.

4. **Docs**: `Protocol.md` and `Roadmap.md` are still stale legacy documents
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
