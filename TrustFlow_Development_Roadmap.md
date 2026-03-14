---
# TrustFlow Development Roadmap & Strategy

_Last updated: 2026-03-14 (bug fixes, Trust Passport, invite round-trip, BYOC layout, runtime snapshot persistence)_
---

## 0. Mission

**Make trust the default, not the exception.**

The freelance economy runs on broken trust infrastructure. Scope disputes, ghosting, and unpaid work are not edge cases — they are the norm. TrustFlow is not a product. It is a piece of social infrastructure: a protocol that makes exploitation structurally harder and cooperation structurally easier.

This is not about profit. It is about changing how people work together.

### The deeper problem

The proof of a person's capability and integrity has always been controlled by intermediaries — academic institutions, certification bodies, employers, hiring agencies. These intermediaries profit from being the sole translators of human ability into something others will trust. The individual accumulates the track record; the institution captures the value.

This asymmetry is not accidental. It is structural, and those who benefit from it have little incentive to fix it.

TrustFlow is a protocol-level response: every completed contract, every honored deadline, every fairly resolved dispute becomes a tamper-evident, portable record that belongs to the individual — not to the platform, not to any institution. A public notary does not own what they witness. Neither does TrustFlow.

**The entry point is freelance contracts. The destination is a portable trust infrastructure that individuals carry across every context — work, credit, collaboration — without asking anyone's permission.**

---

## 1. Product Strategy

### Target User

TrustFlow has two distinct user types who arrive with fundamentally different contexts. Both must be designed for explicitly.

#### Type 1: The Initiator (primary acquisition target)

**A professional who has been burned and is actively seeking a better way.**

- Has experienced "it's not what I asked for" after delivery
- Motivated to change how they work — willing to convince their counterparty
- Already has an existing relationship with the counterparty ("Bring Your Own Client" model)
- Values audit trails and enforceable agreements over convenience
- Entry point: discovers TrustFlow, sets up a contract, sends an invite link

#### Type 2: The Invited Counterparty (retention-critical)

**Someone who receives an invite link from the Initiator — with zero prior context.**

- Has no existing motivation to use TrustFlow
- Potential objection: "Why do you need a system? Don't you trust me?"
- If the first screen they see doesn't immediately show _what they gain_, they leave
- Entry point: invite link → must land on a screen that explains value, not mechanics
- Key insight: this person also accumulates a portable Trust Passport from day one — that is the hook

**We are NOT targeting:**

- Professionals looking to browse and discover new work opportunities (Type A / Upwork model)
- This profile is the future state after the data flywheel turns; it is not the entry point

### Core Value Proposition

TrustFlow converts ambiguous project briefs into structured, AI-generated Definitions of Done — creating a mutual agreement that is logged, locked, and enforceable before any money moves. Both parties are protected symmetrically.

Most contract disputes do not start from bad intent. They start from ambiguity — "done" meant different things to each side. TrustFlow eliminates that ambiguity before money moves, and holds the record of what was agreed so neither side can rewrite history.

**The platform takes responsibility for the quality of the agreement, not just its existence.** A user should not need to read legal language or understand contract law. TrustFlow's AI is the expert in the room — it detects vague terms, fills structural gaps, and flags conditions that could cause disputes. The user's only job is a final "yes, this is what I want."

**Not competing on:** Price, talent discovery, or ease of onboarding light users.
**Competing on:** Making fair outcomes the structural default for both sides.

### Design Principles

1. **Symmetric protection** — Both Earner and Hirer carry stakes and responsibilities equally
2. **Behavior over credentials** — What you do matters more than what you claim
3. **Transparency as prevention** — Make problems visible before they escalate
4. **Friction as a feature** — A little friction at the start prevents enormous friction later
5. **Trust as a portable asset** — Every completed contract builds a verifiable record that belongs to the user, not the platform. This is the answer to "why should I join?" — participation compounds in the user's favor, permanently
6. **Agreement quality is the platform's responsibility** — Users are not contract lawyers. TrustFlow's AI must ensure the DoD is unambiguous, complete, and dispute-resistant before either party signs. Asking users to "read carefully" is a failure of design.
7. **Invisible enforcement** — The protection mechanisms must work without the user understanding them. A surgeon does not explain anesthesia to the patient before operating. TrustFlow's mutual stakes, append-only logs, blind ratings, and DoD hashes operate silently in the background. The user's only awareness should be: "if I act in good faith, I am protected; if I don't, I will pay for it." The system is the expert — not the user.

### Canonical Contract State Machine

Principles #6 and #7 are not just UX guidelines — they have a direct consequence for system architecture. If the platform is responsible for agreement quality, and protections operate silently, then most of the complexity in a typical contract system is caused by the platform _not_ taking that responsibility. Ambiguous DoDs produce subjective disputes. Subjective disputes require negotiation loops. Negotiation loops require pause states, renegotiation flows, and admin override buttons.

**The correct state machine for a DoD-quality-guaranteed contract is linear:**

```
DRAFTING ──(AI validates DoD quality)──▶ LOCKED ──▶ IN_PROGRESS ──▶ DELIVERED
                                                                          │
                                              ┌───────────────────────────┤
                                              ▼                           ▼
                                         CONFIRMED                   DISPUTED
                                              │                           │
                                              └───────────┬───────────────┘
                                                          ▼
                                                       SETTLED
```

One branch. One direction. No loops.

**What this eliminates — and why:**

| Mechanism                               | Why it exists today                                             | Why it disappears                                              |
| --------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| Renegotiation flow                      | DoD was vague; parties disagree mid-contract on what was agreed | AI-validated DoD cannot be vague; re-scoping = a new contract  |
| Pause / Resume                          | Parties are confused or blocked; no clear next action           | Clear DoD always defines the next action; pausing is avoidance |
| Rejection loops (unlimited)             | Subjective "done" criteria allow endless dispute                | AI-generated DoD produces objective binary pass/fail           |
| Multiple-rejection-forced-dispute logic | Escalation heuristic for unresolvable loops                     | Loops don't exist; DISPUTED is entered on explicit trigger     |
| Admin Intervention button               | Human override for states the system cannot exit                | System always has an exit; unresolvable → AI arbitration       |

**A rejection is still possible** — it signals "deliverable does not meet the DoD." That is a binary factual dispute, mediated by AI against the signed DoD hash. If AI cannot resolve it, a human arbiter is invoked (Feature #4). The system does not ask the user what to do next; it proceeds.

**One exception: emergency exit.** Cancellation remains available as a mutual-consent off-ramp, with symmetric stake penalty. It is not a user convenience; it is an acknowledgment that circumstances outside both parties' control sometimes require abandonment. But this is rare, and the penalty makes it non-trivial.

### What We Are NOT Building (Scope Boundaries)

- A general-purpose freelance marketplace (Upwork, Lancers)
- A payment processor or wallet (regulated territory)
- A tool for one-off, low-stakes transactions

### Go-To-Market Strategy: BYOC First

TrustFlow's matching engine is only as good as the trust data behind it. That data comes from completed contracts — which means matching must come _after_ the data flywheel has started turning.

**The flywheel:**

```
BYOC (bring existing relationships)
  → contracts complete
  → behavior data accumulates
  → matching recommendations gain meaning
  → new relationships form via matching
  → more contracts → more data
```

**Implication for the product:**

- Early users will find their own counterparties elsewhere and bring them to TrustFlow to use the protocol
- This is not a weakness — it is the correct entry point for a trust-infrastructure product
- The marketplace matching UI (Earner mode) is a _vision demo_ of what the platform becomes once data accumulates, not the primary user acquisition path
- "Zero matches" is not a failure state; it is a signal to go deeper into BYOC and build trust history first

**Implication for UI design:**

- BYOC flow and contract protocol are the highest-priority surfaces
- Matching UI should not mimic keyword-search marketplaces (Upwork model)
- When matching does surface candidates, the UI should speak as a trusted introducer: "Based on your history, here is why this person is the right fit" — not a ranked list for the user to filter

---

## Current Sprint (as of 2026-03-14)

### Decisions made

- **Canonical state machine established** — Platform guarantees DoD quality → contract flow becomes linear (DRAFTING → LOCKED → IN_PROGRESS → DELIVERED → CONFIRMED | DISPUTED → SETTLED). Renegotiation, Pause/Resume, and unlimited rejection loops are architecturally eliminated. See Design Principles #6/#7 section above.
- **Dead state removed from `ContractView.jsx`** ✅ — Removed: `showRenegotiate`, `isRenegotiating`, `pendingRenegotiation`, `isPaused`, `previewSubmitted`, `chatLocked` (local), `currentStep`, `stepFromProps`, and their associated UI (renegotiation modal, pause button, pause banner, Acceptance Protocol block). `stagedPhase` was listed in the original dead-state note but is actively used by the Staged Delivery feature (ContractStep2); it was intentionally kept.

### Next 3 tasks (priority order)

1. ~~**Trust Ladder upper limit enforcement**~~ ✅ — `ContractStep1.jsx`: `isOverLimit` computed from `tier.contractLimit`; HoldButton disabled + red warning banner when over limit.
2. ~~**Re-hire data carry-over**~~ ✅ — `handleRehire` in `App.jsx` now syncs `acceptanceCriteria` from `acceptanceProtocol`, resets `dodHash`/`contractEvents`, sets `isRehire` flag. ScopingView shows "Pre-filled" banner.
3. ~~**Counterparty Invite Flow**~~ ✅ — Full round-trip implemented.
   - **Sender side (A):** BYOC modal extended with Amount + DoD fields and a "Generate Link" button. Generates a `?invite=...` URL from form content; copy-to-clipboard with ✓ feedback. Can also "Start Myself →" to skip invite and go directly to ScopingView.
   - **Recipient side (B):** `InviteView.jsx` receives URL params, shows inviter + project + amount + DoD, 3-panel "what you gain" pitch (protection, Trust Passport, DoD lock). Accept → populates `selectedItem` and navigates to ScopingView. Decline → marketplace. URL params cleared via `history.replaceState` after either action.

### Bug fixes & missing connections (2026-03-14)

- **Trust Passport write-back** ✅ — Contract completion (Step 4→5) now updates `completedContracts`, `exp` (+500), `trustScore` (+5, capped 1000), `level` (derived from completedContracts at 1/3/5/10 thresholds), `totalEarned` (earner), `totalSpent` (hirer). `avgRating` computed as weighted average from blind rating reveal. `triggerLevelUp()` fires on completion.
- **`isCancelled` bug** ✅ — `handleAbortSequence` was calling `setIsCancelled(false)`, so contracts never entered the cancelled state. Fixed to `true`; cancel log now includes reason text.
- **Auto-Release Timer** ✅ — Was only firing if deadline had already passed at component mount. Rewritten to `setTimeout(delay)` so it fires at the correct future time. 24h advance warning toast added.
- **Scope Builder** ✅ — `handleAIArchitectSubmit` always returned hardcoded "React Native / Stripe / Biometric" DoD regardless of prompt. Now extracts tokens from the actual user input.
- **`totalSpent` tracking** ✅ — Hirer's `totalSpent` was not updated on escrow lock (Step 2 transition). Fixed alongside the existing points deduction.
- **Runtime snapshot persistence (Supabase-first)** ✅ — App runtime state now auto-saves as append-only `runtime.snapshot` events and restores on reload. Falls back to local cache when Supabase is unavailable.

### Demo: Complete Invite Round-Trip

**Sender side (A) — in-app:**

1. Marketplace → "Work with someone you know" (BYOC button)
2. Fill: project description, amount, DoD items (one per line)
3. Click "Generate Link" → copy URL
4. Send to counterparty via any channel

**Recipient side (B) — via link:**

```
http://localhost:5173/?invite=1&inviter=Felix&project=Mobile%20App%20Design%20System&amount=300000&dod=Definitive%20Figma%20Library,Dark%20Mode%20Tokens,Atomic%20Design%20Compliance
```

---

## 2. Prototype Status (as of 2026-03-06)

### Implemented & Working

- Dual-mode (Earner / Hirer) switching
- Marketplace with Scope Builder (prompt → DoD criteria extraction)
- Definition of Done display and lock protocol
- Negotiation chat with export capability
- Full contract state machine (5 steps: Commitment → Vault → Inspect → Blind Rating → Settled)
- Contract Health Score (real-time, based on events + deadline)
- Staged Delivery (Preview Phase → Approve → Full Delivery)
- Milestone / partial payment
- Auto-Release Timer (fires at deadline; 24h warning)
- Mutual Stake (symmetric escrow deduction)
- Deadline enforcement (past-deadline banner in Step 2; auto-release timer)
- Mid-contract cancellation with reason logging (isCancelled state correctly set)
- Human Arbiter Escalation modal
- File upload simulation with progress bar
- Payment delay simulation and retry flow
- Dispute modal
- Profile system with level (derived from completedContracts), EXP, badges, skill endorsements
- Trust Passport: completedContracts, avgRating, trustScore, totalEarned/Spent written back on completion
- Feature unlock system (level-gated)
- Progressive Trust Ladder (contract limit enforced at Step 1)
- Re-hire / Contract Template from prior contract
- Counterparty Invite Flow (URL params → InviteView)
- Toast notifications, Command Palette (Cmd+K)
- Trust Passport modal
- Supabase append-only event log, SHA-256 DoD hash, RFC 3161 TSA timestamps
- Signed audit trail export (tamper-evident JSON)

### Known Gaps (not yet implemented)

- Persistent Notification Center (audit log replacing ephemeral toasts)
- Social/GitHub import for Trust Score bootstrap
- Full multi-user persistence (Auth + RLS + realtime sync still required; current runtime snapshot persistence is single-device actor based)
- Real Gemini API integration (Scope Builder currently uses token extraction)
- Real Gemini API integration (currently mock responses)

---

## 3. Feature Vision

Features are organized by their role in the mission: protecting both parties, building verifiable trust, and preventing exploitation.

### 🔴 Critical — Trust Infrastructure (platform cannot function without these)

| #   | Feature                             | Purpose                                                                                                                                                                                                                                         |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Counterparty Invite Flow**        | Initiator sends a link → Invited user lands on a context-aware screen showing who invited them, what the project is, and — critically — what _they_ gain (Trust Passport from day one). Without this, BYOC adoption fails at the second person. |
| 1   | **Auto-Release Timer**              | 72–96h after delivery with no client response → funds auto-release. Earners cannot be ghosted.                                                                                                                                                  |
| 2   | **Mutual Stake (Symmetric Escrow)** | Earner also deposits a small stake. Both parties have skin in the game. Abandonment costs both sides.                                                                                                                                           |
| 3   | **Milestone Payment**               | Multi-step escrow for large projects. 70%+ of real freelance work is milestone-based.                                                                                                                                                           |
| 4   | **Human Arbiter Escalation**        | When AI cannot resolve a dispute, a human arbiter is summoned. AI is the first line; humans are the last.                                                                                                                                       |

### 🟡 High — Verifiable Trust (makes the platform worth joining)

| #   | Feature                       | Purpose                                                                                                                        |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 5   | **Blind Simultaneous Rating** | Both parties submit ratings before either sees the other's. Eliminates retaliation fear. Trust Scores become honest.           |
| 6   | **Behavior Signals**          | Replace opaque "Trust Score: 847" with legible signals: avg. response time, on-time delivery rate, lifetime cancellation rate. |
| 7   | **Progressive Trust Ladder**  | New users start at ¥50k contract limit. Limit rises automatically with verified track record. No KYC required to start.        |
| 8   | **Public Trust Passport**     | Other users can view your Behavior Signals and track record. The marketplace only works if people can make informed choices.   |
| 9   | **Deadline Enforcement**      | Contracts have deadlines. Approaching/missed deadlines trigger notifications and auto-dispute or extension proposals.          |

### 🟢 Medium — Structural Prevention (stop problems before they start)

| #   | Feature                         | Purpose                                                                                                                        |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 10  | **Contract Health Score**       | AI monitors conversation tone, response latency, scope drift in real time. Shows "contract risk level" before a dispute forms. |
| 11  | **Staged Delivery**             | Preview → Approve → Full delivery. Earner is not exposed to theft; Hirer is not exposed to non-delivery.                       |
| 12  | **Vouching System**             | Established users can vouch for new users, sharing trust transitively. Organic solution to Cold Start without eKYC.            |
| 13  | **Re-hire / Contract Template** | One-click re-contract with a known counterparty. Retention is the proof that the platform works.                               |
| 14  | **Contract Pause / Resume**     | Temporary halt for either party's legitimate reasons (illness, budget freeze). Better than forced cancellation.                |

### 🔵 Completion — Audit & Transparency

| #   | Feature                            | Purpose                                                                                                                        |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 15  | **Persistent Activity Log**        | Every action is logged chronologically. Replaces ephemeral toasts. This is the audit trail that protects both parties legally. |
| 16  | **First Contract Trust Bootstrap** | Small-stake first contracts, social/GitHub import for initial Trust Score. Solve the chicken-and-egg problem.                  |
| 17  | **PDF Audit Trail Export**         | Legal-grade export of the full contract history. For disputes that escalate beyond the platform.                               |

### ⚪ Future

- Multi-Earner / team contracts
- Streak & referral engagement loops
- eKYC integration (when regulated)
- **Trust Passport as Verifiable Credential** — self-sovereign, W3C VC standard; individual carries their record across any platform without TrustFlow's involvement

---

## 4. Redesign Phases

### Phase 1 — Message & Copy (priority: HIGH, code impact: LOW)

Reframe every UI string: lead with the mission (fair work), not the technology.

- [x] Rename or reframe "AI Architect" — now "Scope Builder", emphasizes agreement over AI novelty
- [x] Ensure every UI label speaks to protection, fairness, and accountability ("Decline & Return", "Evidence Archive", "Enforceable commitment")
- [x] Update placeholder text in marketplace to reflect "Bring Your Own Client" model
- [x] Rewrite onboarding / landing copy: lead with the problem (scope disputes), not the solution
- [x] Add mission statement to the first screen the user sees

### Phase 2 — UX Flow (priority: MEDIUM, code impact: MEDIUM)

- [x] First-run onboarding screen: explain the core problem and why TrustFlow exists
- [x] "Bring Your Own Client" entry point: skip marketplace, jump straight to Scoping with a counterparty invite
- [x] Deadline field on contract creation with enforcement logic (Feature #9)
- [x] Persistent Activity Log panel replacing ephemeral toasts (Feature #15)
- [x] Blind Simultaneous Rating flow (Feature #5)

### Phase 3 — Feature Additions (priority: MEDIUM, code impact: HIGH)

Implement only after Phase 1 & 2 are validated by user feedback.

- [x] Auto-Release Timer — Feature #1
- [x] Mutual Stake (Symmetric Escrow) — Feature #2
- [x] Milestone Payment — Feature #3
- [x] Human Arbiter Escalation modal — Feature #4
- [x] Behavior Signals on profile — Feature #6
- [x] Progressive Trust Ladder — Feature #7
- [x] Contract Health Score — Feature #10
- [x] Staged Delivery — Feature #11
- [x] Vouching System — Feature #12
- [x] Re-hire / Contract Template — Feature #13
- [x] Contract Pause / Resume — Feature #14

### Phase 4 — Record Integrity (priority: HIGH — this is the core differentiator)

> **Goal:** Make every action immutable, timestamped, and verifiable. "It happened" can never be disputed.
> This is not a backend convenience feature. It is the product's core promise.

#### Architecture: DB + Notary Layer

The trust model separates **data storage** from **proof of existence**.
The DB holds events; external notaries make those events impossible to deny — including by the platform operator.

```
[TrustFlow App]
  Hirer  ──signs──▶ Contract Event
  Earner ──signs──▶ Contract Event
                        │
                        ▼
              [Supabase DB — append-only events table]
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
    [RFC 3161 TSA             [Polygon / Base
     e.g. FreeTSA]             on-chain anchor]
     Proves: WHEN              Proves: WHAT
     (tamper-evident           (operator cannot
      timestamp)                deny the content)
              └─────────┬──────────┘
                        ▼
              [Anyone can verify:
               contract ID → raw events → recompute hash
               → compare against TSA token + on-chain tx]
```

**Threat model:**
| Attacker | DB trigger alone | + TSA | + Blockchain anchor |
|---|---|---|---|
| Regular user | blocked | blocked | blocked |
| Malicious employee (DB admin) | can bypass | blocked | blocked |
| Platform operator (self) | can bypass | blocked | blocked |
| Infrastructure failure / restore | can overwrite | blocked | blocked |

**Implementation order:**

1. Supabase DB + append-only trigger (blocks regular users)
2. RFC 3161 TSA per event (free, no account needed — freeTSA.org)
3. Polygon / Base anchoring of Merkle root per milestone (~$0.01/tx)

**Chain selection rationale:** Ethereum mainnet for legitimacy; Polygon or Base (Coinbase L2) for cost ($0.001–0.01/tx vs $5–50 on mainnet). Full smart-contract escrow is Phase 5+.

---

- [x] **Supabase backend** — append-only events table (no UPDATE/DELETE rules), Row Level Security, indexes; connection verified
- [x] **Immutable contract hash** — at initiation, the full Definition of Done is SHA-256 hashed (Web Crypto API) and stored; all subsequent events carry the same DoD hash
- [x] **RFC 3161 trusted timestamping** — every event receives a cryptographic timestamp from FreeTSA.org; DER-encoded TimeStampReq built in-browser + Edge Function proxy; token stored in events table
- [x] **Signed audit trail export** — full contract event chain exportable as tamper-evident JSON; re-verifies SHA-256 hashes at export time; downloadable from Step 5
- [x] **Portable reputation record** — bad-actor events (dispute loss, forced cancellation, ghosting) are permanently logged via append-only event log and displayed in Trust Passport; cannot be deleted or hidden

### Phase 5 — Full Infrastructure (priority: LOW until Phase 4 validated)

- [ ] Real payment layer (Stripe Escrow API or equivalent)
- [ ] Gemini API integration (real DoD generation, inspection scoring)
- [ ] eKYC identity verification
- [ ] AML / KYC compliance

### Phase 6 — Trust Passport as Public Utility (priority: VISION — defines the destination)

> **Goal:** The trust record an individual builds on TrustFlow becomes portable proof, usable outside the platform — by employers, banks, other platforms — without requiring TrustFlow as an intermediary.

This is the answer to the structural asymmetry that has always existed between institutions and individuals. Credentials have been owned by the institutions that issued them. TrustFlow behavior data is owned by the person who earned it.

**API model: consent-first, not platform-first**

Three tiers, in order of individual sovereignty:

| Tier | Model                         | Description                                                                                                                                                                                                     |
| ---- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Consent-gated API**         | Individual authorizes a third party (employer, bank, platform) to query their Trust Passport via OAuth-style consent. TrustFlow issues a scoped read token. Revenue: API access fee paid by the querying party. |
| 2    | **Self-presented credential** | Individual exports a signed JSON object (Trust Passport snapshot). Recipient verifies authenticity using TrustFlow's public key. No API call required — works even if TrustFlow is offline.                     |
| 3    | **W3C Verifiable Credential** | Trust Passport issued as a standards-compliant VC. Storable in any compatible digital wallet. Verifiable by anyone without contacting TrustFlow. Fully self-sovereign.                                          |

**Design constraint:** TrustFlow must never become a gatekeeper of its own data. Tier 1 is the business model; Tiers 2 and 3 are the insurance policy — proof that the platform does not own what it witnesses.

---

## 5. Real-World Risk Register

| Risk                                       | Impact                          | Mitigation                                           |
| ------------------------------------------ | ------------------------------- | ---------------------------------------------------- |
| Ghosting (client unresponsive)             | Fund locked indefinitely        | Auto-Release Timer (#1)                              |
| Earner abandonment                         | Hirer loses time and money      | Mutual Stake (#2)                                    |
| Subjectivity gap ("not what I envisioned") | Endless rejection loop          | Human Arbiter (#4); Staged Delivery (#11)            |
| Retaliation in ratings                     | Trust Scores become dishonest   | Blind Simultaneous Rating (#5)                       |
| Cold Start (no reputation)                 | Platform unusable for new users | Progressive Trust Ladder (#7); Vouching (#12)        |
| Scope drift mid-contract                   | Dispute that was preventable    | Contract Health Score (#10)                          |
| Regulatory (fund custody)                  | Legal liability                 | Point system abstraction; no real money in prototype |
| Malware in deliverables                    | Security incident               | Virus scan + Cloud Sandbox (future phase)            |

- For all formatting and data handling, use shared utility functions in `src/lib/utils.js`:
  - `formatNumber` for numbers
  - `formatDate` for dates
  - `truncate` for strings
  - `uniqueArray` for arrays
    This ensures robust, consistent, and maintainable code.

# 9. Edge Case & Exception Handling: Implementation Checklist & UI Design Principles

## 9.1. Required Edge Case & Exception Features (per Protocol)

- **Mid-Contract Cancellation:** Cancel during contract, input reason, record in history, lock progress
- **Payment Delay/Failure:** Simulate delay, remind, retry, contact admin
- **Renegotiation/Terms Modification:** Change deadline, amount, scope, agreement flow, record in history
- **Multiple Rejections/Forced Dispute:** Limit rejection count, auto-dispute, admin intervention
- **Pause/Resume:** Temporarily hold/resume progress, record in history
- **Admin Intervention UI:** Force end/resume button for disputes or exceptions

## 9.2. UI Design & Operational Guidelines (Protocol Alignment)

- Main flow actions are primary; edge cases are added as "sub-operations" (e.g., menu or small buttons)
- Show/hide buttons based on state; never display all buttons at once
- Always show a confirmation modal for edge case actions to prevent mistakes
- Use progress/history/toast notifications to clearly indicate state changes
- State transitions should be clear and limited (e.g., "in progress → cancelled", "in progress → paused → resumed")

> _First, add as sub-operations and test for usability. Adjust UI as needed based on user feedback._

---

## Edit Terms & Cancel Timing (Implementation)

- Edit Terms and Cancel are only available between DoD presentation and Commitment Locked.
- Once Commitment Locked, contract terms are irreversibly finalized; modifications and cancellations are not permitted in principle.
- See TrustFlow_Protocol.md for detailed rules and rationale.

---

# 10. Design Change & Correction Operation Rules

## 10.1. Design Change & Correction Flow

- When a design change or feature correction is required during implementation or user testing, first document the "change proposal, reason, and impact scope" in this Markdown file (in English).
- After documentation, confirm agreement (or self-approval) before starting implementation.
- After implementation, append a summary of "what was changed, why, and the diff" to this file to keep a clear history.

## 10.2. Operational Merits

- Prevents spec drift and misunderstandings, making future reviews and explanations easier.
- Useful for team development and future maintenance.

---
