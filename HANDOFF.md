# TrustFlow — AI Session Handoff

_Last updated: 2026-05-27_

> Use this file to brief a new AI session on the current project state.
> Update before ending a session. Paste the contents as your first message.

---

## Project Summary

TrustFlow is AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Live: not yet deployed

## Current Phase

Phase 2 (UX Flow) + feat/stripe-hybrid-payment branch— see `TrustFlow_Development_Roadmap.md` for full scope.

## What Was Done Last Session (2026-05-27)

**Architecture pivot: Stripe Connect escrow + TrustPoints reputation system**

Key decisions made:
- Payment rail: **Stripe Connect** (Stripe holds funds; TrustFlow sends release/refund signal)
  - No 資金移動業 registration needed (Stripe is the licensed entity)
  - Immediate capture model — funds sit in platform Stripe balance until DoD confirmed
- Reputation: **TrustPoints** (non-redeemable for cash → avoids 前払式支払手段 regulation)
  - Equivalent to airline miles; earned by good behavior, spent on platform benefits

New files committed (607f279 on feat/stripe-hybrid-payment):
- `supabase/migrations/20260527000000_contracts_table.sql` — contract persistence
- `supabase/migrations/20260527000001_trustpoints_ledger.sql` — append-only ledger
- `supabase/functions/create-payment-intent/index.ts` — Stripe PaymentIntent creation
- `supabase/functions/capture-payment/index.ts` — releases funds + awards TrustPoints
- `supabase/functions/cancel-payment/index.ts` — refund + TrustPoints penalty
- `src/lib/stripe.js` — client-side Edge Function callers
- `src/lib/trustpoints.js` — earn/spend rules, badge logic, computeBalance

Updated:
- `src/views/WalletView.jsx` → **Trust Passport** (TrustPoints balance, progress bar, badge gallery, ledger)
- `src/components/modals/PaymentModal.jsx` → Stripe Elements escrow UI + Test Mode fallback
- `src/views/contract/ContractStep1.jsx` → stake fields renamed to “Reputation Stake (pts)”, milestone amounts labeled ¥
- `src/lib/constants.js` → TRUST_LADDER limits in JPY + TRUST_LADDER_THRESHOLDS added
- `src/lib/eventLog.js` → PAYMENT_INTENT_CREATED, PAYMENT_CAPTURED, PAYMENT_REFUNDED, TRUSTPOINTS_EARNED, TRUSTPOINTS_SPENT added

## Current State

- Branch: `feat/stripe-hybrid-payment` (commit 607f279)
- Build: passes clean (✓ 1553 modules, 0 errors)
- WalletView wiring to App.jsx: **NOT yet done** (see Next Priority below)
- Stripe key: **not set in .env** — PaymentModal runs in Test Mode until `VITE_STRIPE_PUBLISHABLE_KEY` is added
- Supabase Edge Functions `create-payment-intent`, `capture-payment`, `cancel-payment`: created locally, **not yet deployed**

## Active Constraints

- Do not implement Phase 3 or later without explicit instruction.
- Do not add npm packages without explicit user approval.
- Do not deploy Supabase Edge Functions or DB migrations without explicit instruction.

## Next Priority

1. **App.jsx wiring** — wire new WalletView props (`trustPointsLedger`, `contractsCompleted`) and PaymentModal new props (`contractId`, `amountJpy`, `projectName`, `onSuccess`). Remove old `isFlipped`, `userPoints`, `transactions` props.
2. **Run `make check`** (unit tests + build) on the branch before merge.
3. **Merge feat/stripe-hybrid-payment → main** after wiring verified.
4. Set `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` for live Stripe Elements.
5. Deploy Edge Functions: `supabase functions deploy create-payment-intent capture-payment cancel-payment`

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `TrustFlow_Development_Roadmap.md` — current phase and open items
- `TrustFlow_Protocol.md` — system protocol rules
- `Decisions.md` — architectural decisions (do not reverse without instruction)
- `src/lib/trustpoints.js` — TrustPoints earn/spend rules
- `src/lib/stripe.js` — Stripe client helpers
