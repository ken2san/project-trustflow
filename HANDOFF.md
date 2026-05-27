# TrustFlow — AI Session Handoff

_Last updated: 2026-05-27 (session 3)_

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

- Branch: **`main`** — latest commit `4c58896`
- Build: ✓ 1554 modules, 0 errors
- Tests: 87/87 passing
- Supabase: **deployed** — project `trustflow` (ref: `fqgpzhwvvfsxswlnbbgg`, Mumbai)
- DB: **4 migrations applied** in production
- Edge Functions: **6 functions live** in production
- Stripe key: **not set in .env** — PaymentModal runs in Test Mode until `VITE_STRIPE_PUBLISHABLE_KEY` is set
- **Env vars required on Supabase dashboard** (not yet set):
  - `STRIPE_SECRET_KEY` — Stripe secret key
  - `STRIPE_WEBHOOK_SECRET` — for `capture-payment` webhook verification
  - `RESEND_API_KEY` — for `send-acceptance-email`
  - `EMAIL_FROM` — optional (default: `TrustFlow <noreply@trustflow.app>`)
  - `INVITE_SECRET` — for HMAC invite token signing (must match `src/lib/invite.js` default `tf-dev-secret-v1` in dev; use a strong random value in prod)

## Active Constraints

- Do not implement Phase 3 or later without explicit instruction.
- Do not add npm packages without explicit user approval.
- Constraint removed: Supabase deploy is now live and permitted.

## Next Priority (in order)

1. **Get API keys** (user action required):
   - Stripe: [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) → Publishable key (`pk_test_...`) + Secret key (`sk_test_...`)
   - Resend: [resend.com](https://resend.com) → sign up (free tier: 3,000/month) → API Keys → `re_...`
2. **Set `VITE_STRIPE_PUBLISHABLE_KEY` in `.env`** — enables live Stripe Elements
3. **Set Supabase secrets** — `supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_... RESEND_API_KEY=re_... INVITE_SECRET=<random>`
3. **Frontend hosting** — deploy Vite build (Vercel/Netlify/Cloudflare Pages) so real users can access via URL
4. **eKYC** — Phase 4 prerequisite for Sybil resistance (bilateral self-cleansing only works reliably post-eKYC)
5. **Gemini API** — DoD AI generation + AI dispute arbitration (Phase 4)

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `TrustFlow_Development_Roadmap.md` — design principles (incl. Principle #8), flywheel model
- `Decisions.md` — architectural decisions (do not reverse without instruction)
- `src/lib/trustpoints.js` — TrustPoints earn/spend rules
- `src/lib/invite.js` — HMAC invite token utilities
- `src/lib/auditExport.js` — audit trail export (includes `counterparty_consent`)
- `supabase/functions/` — 6 deployed Edge Functions
