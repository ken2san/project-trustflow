# TrustFlow — AI Session Handoff

_Last updated: 2026-05-27 (session 2)_

> Use this file to brief a new AI session on the current project state.
> Update before ending a session. Paste the contents as your first message.

---

## Project Summary

TrustFlow is AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Live: not yet deployed

## Current Phase

Phase 2 (UX Flow) — merged to `main` as of 2026-05-27.

## What Was Done This Session (2026-05-27)

**Session 1 — Architecture pivot: Stripe Connect escrow + TrustPoints**

- Payment rail: Stripe Connect (immediate capture, Transfer on DoD confirm). No 資金移動業 needed.
- Reputation: TrustPoints (non-redeemable, airline miles model, no expiry). Outside 前払式支払手段 scope.
- New: DB migrations, 3 Edge Functions, `src/lib/stripe.js`, `src/lib/trustpoints.js`
- Updated: WalletView → Trust Passport, PaymentModal → Stripe escrow, ContractStep1, constants.js, eventLog.js
- Tests: 69/69 passing (trustpoints + stripe unit tests added)
- ADRs: Stripe Connect, TrustPoints, guest Hirer model, threat model — all in `Decisions.md`

**Session 2 — Threat modeling + guest Hirer path wiring**

- Threat model completed (10 threats, H1/H2/T1 are MVP-required) — see `Decisions.md`
- `App.jsx`: WalletView wired to `trustPointsLedger`/`trustScore`/`contractsCompleted`; PaymentModal wired to `contractId`/`amountJpy`/`projectName`/`onSuccess`; removed `isFlipped`/`handleDeposit`; added `guestEmail` state
- `InviteView.jsx`: amount `PTS` → `¥JPY`; Stage 2 collects optional email (Type 2 guest path)
- `ContractStep1.jsx`: "Project Deadline (optional)" → "Delivery Deadline *" with auto-refund hint

## Current State

- Branch: **`main`** (feat/stripe-hybrid-payment merged)
- Build: ✓ 1553 modules, 0 errors
- Tests: 69/69 passing
- Stripe key: **not set in .env** — PaymentModal runs in Test Mode until `VITE_STRIPE_PUBLISHABLE_KEY` is added
- Supabase Edge Functions: created locally, **not yet deployed**
- DB migrations: created locally, **not yet applied**

## Active Constraints

- Do not implement Phase 3 or later without explicit instruction.
- Do not add npm packages without explicit user approval.
- Do not deploy Supabase Edge Functions or DB migrations without explicit instruction.

## Next Priority (in order)

1. **T1: Invite token hardening** — add `invite_token` (one-time, 72h expiry) + `hirer_email` + `deadline` to contracts migration; Edge Function to validate on accept
2. **H1: DoD acceptance email** — requires email provider choice (Resend recommended). Send on payment confirmation with DoD hash + amount as chargeback evidence
3. **Production setup** (explicit instruction required): `.env` Stripe key → `supabase functions deploy` → `supabase db push`

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `TrustFlow_Development_Roadmap.md` — current phase and open items
- `TrustFlow_Protocol.md` — system protocol rules
- `Decisions.md` — architectural decisions (do not reverse without instruction)
- `src/lib/trustpoints.js` — TrustPoints earn/spend rules
- `src/lib/stripe.js` — Stripe client helpers
