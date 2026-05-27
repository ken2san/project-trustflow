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

### [2026-05-27] — Counterparty onboarding: asymmetric guest model (Type 2)

**Decision**: The invited counterparty (Hirer) does not need a TrustFlow account. They participate via a one-time invite link: review DoD → enter email → pay via Stripe. Email address is the identity anchor.

**Context**: Requiring the Hirer to register creates friction that kills adoption. The DocuSign/HoneyBook/Bonsai pattern proves "sign/pay without account" is legally and practically accepted. The core guarantee (Stripe escrow + DoD hash) does not require both parties to be registered users.

**Trade-offs accepted**:

- Hirer earns no TrustPoints (no reputation stake) — offset by financial stake in escrow
- Hirer has no dispute rights in-app — offset by timeout auto-refund and email token access to a confirmation page
- Hirer identity is email only — offset by Stripe card data (real name / billing address) as secondary identity

**Upgrade path**: If Hirer creates a TrustFlow account later (or on next contract), all prior contracts linked by email are attributed to that account.

**Alternatives considered**:

- Full registration required for both parties — rejected: adoption barrier too high for counterparty
- Guest checkout (card only, no email) — rejected: no DoD confirmation path, no audit record, TrustFlow's core value proposition disappears

**Consequences**:

- `contracts` table needs `hirer_email` and `invite_token` (one-time, 72h expiry) fields
- Invite token must be invalidated after first use
- DoD acceptance confirmation email must be sent to Hirer's email on payment (timestamped, DoD hash included)
- Guest Hirer needs an email-token-gated confirmation page to approve DoD or trigger dispute

---

### [2026-05-27] — Threat model: guest Hirer flows

**Decision**: Document accepted risks, required mitigations, and deferred items for the guest Hirer architecture. This is the binding security baseline for all Type 2 implementation.

**Threats and mitigations:**

| ID | Threat | Actor | Severity | Mitigation | Status |
|----|--------|-------|----------|-----------|--------|
| H1 | Chargeback after delivery | Hirer | 🔴 High | DoD acceptance email (timestamped + DoD hash) sent on payment; used as Stripe Dispute evidence | ❌ MVP required |
| H2 | Deliberate DoD non-confirmation | Hirer | 🔴 High | Timeout auto-capture: N days after Earner's delivery declaration → auto-release to Earner | ❌ MVP required |
| H3 | Retroactive scope expansion | Hirer | 🟡 Medium | DoD hash is immutable; additional scope = new contract | ✅ Design |
| H4 | Disposable email + chargeback | Hirer | 🟡 Medium | Stripe card data is real identity; disposable domain blocklist as secondary filter | ⚠️ Partial |
| T1 | Invite URL reuse / interception | 3rd party | 🔴 High | Invite token is one-time + 72h expiry; used_at recorded in DB | ❌ MVP required |
| T2 | Edge Function called directly | 3rd party | 🟡 Medium | All Edge Functions require Supabase Auth; unauthenticated requests → 401 | ❓ Verify |
| T3 | URL parameter tampering | 3rd party | 🟢 Low | Amount/DoD sanitized in App.jsx BYOC parsing | ✅ Implemented |
| E1 | Earner ghost after payment | Earner | 🟢 Low | Escrow: Earner cannot receive funds until DoD confirmed or timeout | ✅ Design |
| E2 | Fraudulent quality claim | Earner | 🟡 Medium | DoD granularity guidance in UI (acceptance criteria templates) | ⚠️ UX task |
| E3 | TrustPoints self-dealing | Earner | 🟢 Low | Real Stripe payment required (fee cost) makes self-dealing economically irrational | ✅ Design |

**DoD scope change policy (MVP)**: Changes handled as cancel + new contract. Amendment flow deferred to Phase 4.

**Stripe fee burden policy (MVP)**: Fees absorbed by Earner (deducted from transfer amount). Must be disclosed in PaymentModal and invite page before Hirer pays.

**Delivery deadline**: ContractStep1 must include a required `deadline` field. This is the trigger reference for timeout auto-refund (deadline + grace period).

**Deferred**:

- Disposable email domain blocklist
- Earner Stripe Connect KYC state check before contract creation
- Multi-milestone guest payment flows
- Guest Hirer in-app chat (replaced by email notifications for MVP)

---

_Add new decisions above this line, newest first._
