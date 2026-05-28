# TrustFlow — AI Session Handoff

_Last updated: 2026-05-28 (session 4)_

> Use this file to brief a new AI session on the current project state.
> Update before ending a session. Paste the contents as your first message.

---

## Project Summary

TrustFlow is an AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Backend: Supabase (PostgreSQL + Edge Functions) + Stripe Connect.

**Product direction (session 3):** Target user = the operator themselves (Ken), receiving work from clients who may not want to register. Priority: court-admissible evidence trail over feature breadth.

## Current Phase

Phase 2 (UX Flow + Backend) — `main` deployed to Supabase as of 2026-05-27.

## What Was Done (cumulative)

**Session 1 — Architecture pivot: Stripe Connect escrow + TrustPoints**

- Payment rail: Stripe Connect (immediate capture, Transfer on DoD confirm)
- Reputation: TrustPoints (non-redeemable, airline miles model)
- DB migrations, 3 Edge Functions, `src/lib/stripe.js`, `src/lib/trustpoints.js`
- Tests: 69 passing

**Session 2 — Threat modeling + guest Hirer path wiring**

- Threat model: 10 threats, H1/H2/T1 MVP-required
- `App.jsx` wiring: WalletView, PaymentModal, guestEmail state
- `InviteView.jsx`: JPY amounts, optional email Stage 2

**Session 4 — End-to-end email confirmed + InviteView fix + Cloud Run deploy**

- **Email delivery ✅** — Full BYOC flow tested: acceptance email delivered to `ken2san@gmail.com` via Resend (`noreply@kenji.com.hk`). Confirmed in Resend dashboard log.
- **`send-acceptance-email` wired ✅** — `handleNextStep` step 4 fires Edge Function with `hirer_email`, `project_name`, DoD, amount, contract ID
- **InviteView bug fixed ✅** — `runtimeState` hydration was overwriting `view='invite'` (set from URL `?token=`) with persisted `view='marketplace'`. Fixed: skip `setView(snapshot.view)` when invite URL params are present
- **Supabase secrets updated ✅** — `RESEND_API_KEY`, `EMAIL_FROM=TrustFlow <noreply@kenji.com.hk>`, `INVITE_SECRET`, `STRIPE_SECRET_KEY` all set via `supabase secrets set`
- **Anonymous auth enabled ✅** — Supabase dashboard → Authentication → anonymous sign-ins ON
- **Cloud Run deployed ✅** — revision `trustflow-web-00051-vw6`; GCP project `trustflow-project`, region `us-central1`
- **Resend domain** — verified domain: `kenji.com.hk` (DNS records on `send.kenji.com.hk` subdomain; FROM must be `@kenji.com.hk`, not `@send.kenji.com.hk`)
- Tests: **87/87 passing** (no regression)

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

## Current State

- Branch: **`main`** — latest commit (session 4)
- Build: ✓ 1554 modules, 0 errors
- Tests: 87/87 passing
- Supabase: **deployed** — project `trustflow` (ref: `fqgpzhwvvfsxswlnbbgg`, Mumbai)
- DB: **4 migrations applied** in production
- Edge Functions: **6 functions live** in production
- Cloud Run: **`https://trustflow-web-526623258424.us-central1.run.app`** (revision `trustflow-web-00051-vw6`)
- Email: **✅ working end-to-end** — Resend delivering from `noreply@kenji.com.hk`
- Anonymous auth: **✅ enabled** in Supabase
- Supabase secrets: **✅ all set** (`RESEND_API_KEY`, `EMAIL_FROM`, `INVITE_SECRET`, `STRIPE_SECRET_KEY`)
- Stripe key: **not set in `.env`** — PaymentModal runs in Test Mode until `VITE_STRIPE_PUBLISHABLE_KEY` is set
  - `EMAIL_FROM` — set to `TrustFlow <noreply@kenji.com.hk>` ✅
  - `INVITE_SECRET` — set ✅

## Active Constraints

- Do not implement Phase 3 or later without explicit instruction.
- Do not add npm packages without explicit user approval.
- Constraint removed: Supabase deploy is now live and permitted.

## Next Priority (in order)

1. **TSA CORS (secondary)** — `freetsa.org` blocks browser CORS in production. Move TSA call from `src/lib/tsa.js` (frontend) to a Supabase Edge Function (e.g. `timestamp-event` already exists — route TSA through it). Non-blocking: app continues if TSA fails.
2. **Stripe live keys** — set `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` + `STRIPE_SECRET_KEY` in Supabase secrets to enable real payments
3. **eKYC** — Phase 4 prerequisite for Sybil resistance
4. **Gemini API** — DoD AI generation + AI dispute arbitration (Phase 4)

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `TrustFlow_Development_Roadmap.md` — design principles (incl. Principle #8), flywheel model
- `Decisions.md` — architectural decisions (do not reverse without instruction)
- `src/lib/trustpoints.js` — TrustPoints earn/spend rules
- `src/lib/invite.js` — HMAC invite token utilities
- `src/lib/auditExport.js` — audit trail export (includes `counterparty_consent`)
- `supabase/functions/` — 6 deployed Edge Functions
