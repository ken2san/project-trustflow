# TrustFlow — AI Session Handoff

_Last updated: 2026-09-21 (session 5)_

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

- Branch: **`main`** — latest commit (session 5)
- Build: ✓ 1554 modules, 0 errors
- Tests: 87/87 passing
- Supabase: project `trustflow` (ref: `fqgpzhwvvfsxswlnbbgg`, Mumbai) — was **paused** (inactivity) at the start of session 5, restored mid-session. Check dashboard if it silently pauses again.
- DB: **8 migrations applied** (4 from session 3, 4 new in session 5 — role rename, payout profiles table, guest_access_token, settlement_claimed_at)
- Edge Functions: **6 functions live**, 4 of them rewritten in session 5 (`create-payment-intent`, `capture-payment`, `cancel-payment`, `validate-invite-token`)
- Cloud Run: **`https://trustflow-web-526623258424.us-central1.run.app`** (revision `trustflow-web-00052-9wf`) — **stale**, predates session 5's backend changes; irrelevant either way since the frontend it serves never called this backend (see warning above)
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
