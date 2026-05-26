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

_Add new decisions above this line, newest first._
