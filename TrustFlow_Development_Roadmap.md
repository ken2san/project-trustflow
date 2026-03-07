---
# TrustFlow Development Roadmap & Strategy

_Last updated: 2026-03-07_
---

## 0. Mission

**Make trust the default, not the exception.**

The freelance economy runs on broken trust infrastructure. Scope disputes, ghosting, and unpaid work are not edge cases — they are the norm. TrustFlow is not a product. It is a piece of social infrastructure: a protocol that makes exploitation structurally harder and cooperation structurally easier.

This is not about profit. It is about changing how people work together.

---

## 1. Product Strategy

### Target User

**Professionals — freelancers and clients — who have been burned by scope creep or broken agreements.**

- Has experienced "it's not what I asked for" after delivery
- Wants protection without bureaucracy
- Already has an existing relationship with the counterparty ("Bring Your Own Client" model)
- Values audit trails and enforceable agreements over convenience

### Core Value Proposition

TrustFlow converts ambiguous project briefs into structured, AI-generated Definitions of Done — creating a mutual agreement that is logged, locked, and enforceable before any money moves. Both parties are protected symmetrically.

**Not competing on:** Price, talent discovery, or ease of onboarding light users.
**Competing on:** Making fair outcomes the structural default for both sides.

### Design Principles

1. **Symmetric protection** — Both Earner and Hirer carry stakes and responsibilities equally
2. **Behavior over credentials** — What you do matters more than what you claim
3. **Transparency as prevention** — Make problems visible before they escalate
4. **Friction as a feature** — A little friction at the start prevents enormous friction later

### What We Are NOT Building (Scope Boundaries)

- A general-purpose freelance marketplace (Upwork, Lancers)
- A payment processor or wallet (regulated territory)
- A tool for one-off, low-stakes transactions

---

## 2. Prototype Status (as of 2026-03-06)

### Implemented & Working

- Dual-mode (Earner / Hirer) switching
- Marketplace with AI-scored job/talent matching
- AI Architect: text prompt → Acceptance Criteria generation
- Definition of Done display and lock protocol
- Negotiation chat with export capability
- Full contract state machine (4 steps: Protocol → Escrow → Inspect → Rating)
- Smart contract update proposals (budget modification flow)
- File upload simulation with progress bar
- Mid-contract cancellation with reason logging
- Payment delay simulation and retry flow
- Dispute modal
- Profile system with level, EXP, badges, skill endorsements
- Feature unlock system (level-gated)
- Toast notifications, Command Palette (Cmd+K)
- Trust Passport modal

### Known Gaps (not yet implemented)

- Auto-Release Timer (72h unresponsive client → auto fund release)
- Milestone / partial payment
- Human Arbiter Escalation UI
- Contract Pause / Resume
- Deadline enforcement with penalty flow
- Re-hire / Contract Template from prior relationship
- Persistent Notification Center (audit log)
- Social/GitHub import for Trust Score bootstrap
- Firebase persistence (currently React state / mock data only)
- Real Gemini API integration (currently mock responses)

---

## 3. Feature Vision

Features are organized by their role in the mission: protecting both parties, building verifiable trust, and preventing exploitation.

### 🔴 Critical — Trust Infrastructure (platform cannot function without these)

| #   | Feature                             | Purpose                                                                                                   |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | **Auto-Release Timer**              | 72–96h after delivery with no client response → funds auto-release. Earners cannot be ghosted.            |
| 2   | **Mutual Stake (Symmetric Escrow)** | Earner also deposits a small stake. Both parties have skin in the game. Abandonment costs both sides.     |
| 3   | **Milestone Payment**               | Multi-step escrow for large projects. 70%+ of real freelance work is milestone-based.                     |
| 4   | **Human Arbiter Escalation**        | When AI cannot resolve a dispute, a human arbiter is summoned. AI is the first line; humans are the last. |

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

- [ ] First-run onboarding screen: explain the core problem and why TrustFlow exists
- [ ] "Bring Your Own Client" entry point: skip marketplace, jump straight to Scoping with a counterparty invite
- [ ] Deadline field on contract creation with enforcement logic (Feature #9)
- [ ] Persistent Activity Log panel replacing ephemeral toasts (Feature #15)
- [ ] Blind Simultaneous Rating flow (Feature #5)

### Phase 3 — Feature Additions (priority: MEDIUM, code impact: HIGH)

Implement only after Phase 1 & 2 are validated by user feedback.

- [ ] Auto-Release Timer — Feature #1
- [ ] Mutual Stake (Symmetric Escrow) — Feature #2
- [ ] Milestone Payment — Feature #3
- [ ] Human Arbiter Escalation modal — Feature #4
- [ ] Behavior Signals on profile — Feature #6
- [ ] Progressive Trust Ladder — Feature #7
- [ ] Contract Health Score — Feature #10
- [ ] Staged Delivery — Feature #11
- [ ] Vouching System — Feature #12
- [ ] Re-hire / Contract Template — Feature #13
- [ ] Contract Pause / Resume — Feature #14

### Phase 4 — Infrastructure (priority: LOW until validated)

- Firebase Firestore persistence
- Gemini API integration (real DoD generation, inspection scoring)
- eKYC identity verification
- AML / KYC compliance

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

- Edit Terms（条件修正）とCancel（契約中止）は、Definition of Done（DoD）提示～Commitment Locked前までのみ利用可能。
- Commitment Locked以降は契約条件が不可逆的に確定し、原則として条件変更や中止は不可。
- 詳細なルール・根拠はTrustFlow_Protocol.mdを参照。

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
