# TrustFlow — Architecture Decisions

_Last updated: 2026-05-22_

> This file records significant design decisions and the reasoning behind them.
> AI agents must read this before proposing changes to established patterns.
> Do not reverse a decision without explicit user instruction.

---

## Decision Log

### [2026-03-06] — State management: App.jsx + custom hooks

**Decision**: All state centralized in `src/App.jsx`; logic exceeding ~50 lines extracted into custom hooks in `src/hooks/`. No external state library.

**Context**: Prototype-phase solo dev project. External libraries add a dependency with no benefit at current scale (<10 stores).

**Alternatives considered**:

- Zustand — rejected because it adds a dependency without solving any current problem
- Redux — rejected because overhead is unjustifiable for a prototype

**Consequences**: Simple and auditable now. If state grows beyond ~10 stores, migrate to Zustand.

---

### [2026-03-06] — Modal system: single ModalDialog component

**Decision**: All modal dialogs rendered through `src/components/ui/ModalDialog.jsx`. No ad-hoc modal markup anywhere else.

**Context**: Early development saw z-index stacking conflicts from inline modal markup. Centralizing ensures consistent backdrop, animation, and keyboard behavior.

**Alternatives considered**:

- Inline ad-hoc modal markup — rejected; caused z-index conflicts in early development
- React portals per component — rejected; harder to audit and test

**Consequences**: All modal content must flow through ModalDialog. New modal UI belongs in `src/components/modals/`.

---

### [2026-03-14] — Timestamp integrity: Supabase Edge Function + RFC 3161 TSA

**Decision**: Contract lifecycle events timestamped via the `timestamp-event` Supabase Edge Function, which calls an RFC 3161-compliant TSA. Clients must never write timestamps directly.

**Context**: Core protocol requirement — the event log must be tamper-evident and verifiable by third parties without trusting TrustFlow servers.

**Alternatives considered**:

- Client-side timestamps — rejected; trivially forgeable
- DB `created_at` only — rejected; mutable by DB admin, not independently verifiable
- On-chain timestamping — deferred to Phase 4+ (cost and complexity unjustified at prototype stage)

**Consequences**: All contract events must go through the Edge Function. `src/lib/tsa.js` handles client-side TSA interaction.

---

---

### [2026-05-27] — Payment rail: Stripe Connect (no internal payment token)

**Decision**: All contract payments flow through Stripe Connect. TrustFlow never holds funds. The platform account holds payments and transfers to Earner's Connected Account on DoD confirmation.

**Context**: Internal payment token ("deposit PTS and exchange for cash") would require 資金移動業 or 前払式支払手段 registration under Japanese payment law. Stripe is already a licensed 資金移動業 operator.

**Alternatives considered**:

- Stripe manual capture — rejected: 7-day auth hold limit makes it unsuitable for long contracts
- Immediate capture + platform balance — selected: funds sit in Stripe platform account; Transfer issued at completion. No hold expiry.
- Internal escrow token — rejected: regulatory registration required

**Consequences**:

- `supabase/functions/create-payment-intent` must be deployed before payment flows work
- `VITE_STRIPE_PUBLISHABLE_KEY` must be set in `.env`
- Contract amounts are in JPY integers (Stripe uses smallest currency unit = 円 = no subunit)

---

### [2026-05-27] — Reputation layer: TrustPoints (non-redeemable)

**Decision**: TrustPoints are a non-redeemable reputation score. They cannot be converted to cash or fiat equivalents. Earned through good behavior; spent on platform benefits (fee discounts, priority arbitration).

**Context**: Redeemable points would trigger 前払式支払手段 registration. Non-redeemable system (like airline miles) has no such requirement as long as points cannot be exchanged for legal tender.

**Alternatives considered**:

- Redeemable PTS — rejected: regulatory overhead
- Pure Trust Score (no spend mechanic) — deferred; spend mechanic adds a loop that makes score meaningful

**Consequences**:

- TrustPoints logic in `src/lib/trustpoints.js`
- Ledger persisted in Supabase `trustpoints_ledger` table (append-only)
- WalletView now shows Trust Passport (TrustPoints + Trust Score + badges) instead of fiat wallet

---

_Add new decisions above this line, newest first._
