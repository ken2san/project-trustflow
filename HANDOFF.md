# TrustFlow — AI Session Handoff

_Last updated: 2026-09-21 (session 5, part 2 — quality/optimization pass)_

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

Mid MVP-consistency refactor. Backend payment security (this session) is done and deployed; UI is not yet wired to the DB-backed contract flow at all.

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

- Branch: **`main`** — latest local commit is 24 commits ahead of `origin/main` as of session 5's end; push status depends on whether the end-of-session `git push` in this session's history actually ran — check `git status -sb` before assuming parity.
- Build: ✓ ~1555 modules, 0 errors
- Tests: **91/91 passing** (up from 87 — 4 new chain-linkage regression tests in `tests/unit/eventLog.test.js`)
- Supabase: project `trustflow` (ref: `fqgpzhwvvfsxswlnbbgg`, Mumbai) — was **paused** (inactivity) at the start of session 5, restored mid-session. Check dashboard if it silently pauses again.
- DB: **9 migrations applied** to Supabase (4 from session 3 + 4 from session 5's first half). **1 migration NOT yet applied**: `20260921000004_events_prev_hash.sql` (committed to git, part of the quality pass — see above). Run `supabase db push` to catch it up when doing the next batched deploy.
- Edge Functions: **6 functions live**, but only 4 reflect session 5's changes (`create-payment-intent`, `capture-payment`, `cancel-payment`, `validate-invite-token` — deployed during session 5's first half). **`send-acceptance-email` and `timestamp-event` are NOT deployed with their session-5 fixes** (unauthenticated-relay fix, hex validation) — committed to git only. `capture-payment`/`cancel-payment` also have a second round of un-deployed changes (trustpoints-constants import, email payload shape) on top of what's live. Run `supabase functions deploy` for all 6 when doing the next batched deploy — the currently-live versions of 2 of them still have the open-relay hole.
- Cloud Run: **`https://trustflow-web-526623258424.us-central1.run.app`** (revision `trustflow-web-00052-9wf`) — **stale**, predates all of session 5's changes; irrelevant either way since the frontend it serves never called this backend (see warning above)
- Email: reported working end-to-end as of session 4 (Resend, `noreply@kenji.com.hk`) — not re-verified in session 5
- Anonymous auth: **✅ enabled** in Supabase
- Supabase secrets: **✅ all set** (`RESEND_API_KEY`, `EMAIL_FROM`, `INVITE_SECRET`, `STRIPE_SECRET_KEY`)
- Stripe key: **not set in `.env`** — PaymentModal runs in Test Mode until `VITE_STRIPE_PUBLISHABLE_KEY` is set
  - `EMAIL_FROM` — set to `TrustFlow <noreply@kenji.com.hk>` ✅
  - `INVITE_SECRET` — set ✅

## Active Constraints

- Do not add npm packages without explicit user approval.
- Do not deploy Supabase migrations/Edge Functions or touch Stripe production config without explicit instruction (session 5 deploys were explicitly approved each time — this is a standing rule, not a one-off).
- Gemini API and eKYC (listed as "Next Priority" in earlier sessions, below) are explicitly **out of scope** for the current MVP consistency spec — don't pick them up without checking with the user first, that scope decision may be stale.

## Next Priority (in order)

0. **Deploy the pending migration + Edge Function updates** (`supabase db push` + `supabase functions deploy`) — user deliberately deferred this at the end of session 5 to batch it with whatever comes next, not because anything is wrong with the changes. See Current State above for exactly what's pending. Confirm with the user before running (standing deploy-approval rule, Active Constraints).
1. **Wire the UI to the DB-backed contract flow** — the biggest gap. `App.jsx` contract creation, `InviteView.jsx` acceptance, and `PaymentModal.jsx` need to actually call `contracts` INSERT / `validate-invite-token` / `create-payment-intent` / `capture-payment` / `cancel-payment` for the first time. This is entangled with completing the state machine (below), since the UI has no DB state to drive off of otherwise.
2. **Complete the state machine** — only `DRAFTING`/`TERMS_ACCEPTED`/`IN_PROGRESS`/`DELIVERED`/`CANCELLED`/`SETTLED` exist. Still missing: `INVITED`, `FUNDED` (separate from `IN_PROGRESS`), `ACCEPTED`/`AUTO_ACCEPTED` (separate from `SETTLED` — capture-payment currently conflates "Hirer confirms delivery" and "funds released" into one step), `DISPUTED`, `REFUNDED` (separate from `CANCELLED`). The 7-day auto-accept timeout needs a scheduling mechanism (pg_cron availability on this Supabase plan is unconfirmed) — `delivered_at` column + index already anticipate this (see `20260527000003_contracts_delivered_at.sql`).
3. **Stripe Connect onboarding** — `earner_payout_profiles` table exists (session 5) but nothing populates it. Needed before `capture-payment` can ever succeed for a real Earner.
4. **Fault-attributed cancellation penalties** — `cancel-payment` still applies a flat -30 TrustPoints to both parties regardless of fault.
5. **Docs cleanup** — `Protocol.md` is two contradictory legacy documents concatenated (Pause/Resume, AI arbitration, blockchain terminology — none of it matches the current model); `Decisions.md` self-contradicts on guest dispute rights; `Roadmap.md` self-contradicts on whether Pause/Resume/Renegotiation are eliminated or required, and still lists Gemini API/eKYC/blockchain anchoring as near-term.
6. **`App.jsx` decomposition** — 1234 lines, 52 `useState`, 6 `useEffect`. Extract `useInviteFlow`/`usePaymentFlow`/`useContractState` once the DB wiring above lands (extracting before the logic is correct just means redoing it).
7. Stripe live keys (`VITE_STRIPE_PUBLISHABLE_KEY`), RLS hardening beyond what session 5 touched — unchanged from earlier sessions, still open.

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `Roadmap.md` — design principles (incl. Principle #8), flywheel model — **note**: contains internal contradictions, see Next Priority #5
- `Decisions.md` — architectural decisions (do not reverse without instruction) — **note**: contains a contradiction on guest dispute rights, see Next Priority #5
- `Protocol.md` — **note**: two contradictory legacy documents concatenated, effectively not usable as-is, see Next Priority #5
- `src/lib/trustpoints.js` — TrustPoints earn/spend rules (single unified ledger — Trust Score/Trust Passport as separate concepts don't exist in code)
- `src/lib/invite.js` — client-side HMAC invite tokens — **this is what the live app actually uses today**; `validate-invite-token` (the real, DB-backed, session-5-hardened version) is not yet called from the UI
- `src/lib/auditExport.js` — audit trail export (includes `counterparty_consent`)
- `supabase/functions/` — 6 deployed Edge Functions, 4 rewritten session 5 — not yet called from `src/` except `create-payment-intent` (Test-Mode-only path)
