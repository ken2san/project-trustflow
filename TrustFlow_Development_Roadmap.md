---
# TrustFlow Development Roadmap & Strategy

_Last updated: 2026-03-06_

---

## 1. Product Strategy

### Target User

**Professional freelancers and clients who have been burned by scope creep.**

- Monthly transaction volume: ¥50,000–¥500,000 per contract
- Has experienced disputes over "it's not what I asked for" after delivery
- Already has an existing relationship with the counterparty (not cold-matching)
- Values audit trails and enforceable agreements over convenience

### Core Value Proposition

TrustFlow converts ambiguous project briefs into structured, AI-generated Definitions of Done — creating a mutual agreement that is logged, locked, and enforceable before any money moves.

**Not competing on:** Price, talent discovery, or ease of onboarding light users.
**Competing on:** Eliminating scope disputes and protecting both parties through transparent contract logic.

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

## 3. Redesign Phases

### Phase 1 — Message & Copy (priority: HIGH, code impact: LOW)

Reframe language from "tech demo" to "tool for professionals who've been burned".

- [ ] Rewrite onboarding / landing copy: lead with the problem (scope disputes), not the solution
- [ ] Rename or reframe "AI Architect" to emphasize evidence / audit trail benefit
- [ ] Update placeholder text in marketplace to reflect "Bring Your Own Client" model
- [ ] Ensure every UI label speaks to trust, accountability, and transparency

### Phase 2 — UX Flow (priority: MEDIUM, code impact: MEDIUM)

- [ ] Add a first-run onboarding screen explaining the core problem and flow
- [ ] "Bring Your Own Client" entry point: skip marketplace, jump straight to Scoping with a counterparty invite
- [ ] Deadline field on contract creation with enforcement logic
- [ ] Persistent Notification / Activity Log panel replacing ephemeral toasts

### Phase 3 — Feature Additions (priority: MEDIUM, code impact: HIGH)

Implement only after Phase 1 & 2 are validated by user feedback.

- [ ] Auto-Release Timer (72h ghosting protection) — high value, low complexity
- [ ] Contract Pause / Resume
- [ ] Milestone payment (multi-step escrow)
- [ ] Human Arbiter Escalation modal
- [ ] Re-hire / Contract Template flow
- [ ] PDF Audit Trail export

### Phase 4 — Infrastructure (priority: LOW until validated)

- Firebase Firestore persistence
- Gemini API integration
- eKYC identity verification
- AML / KYC compliance

---

## 4. Real-World Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ghosting (client unresponsive) | Fund locked indefinitely | Auto-Release Timer (72h) |
| Subjectivity gap ("not what I envisioned") | Endless rejection loop | Human Arbiter Escalation; partial release option |
| Cold Start (no reputation) | Platform unusable for new users | Social/GitHub import; small-stake first contract limits |
| Regulatory (fund custody) | Legal liability | Point system abstraction; avoid real money movement in prototype |
| Malware in deliverables | Security incident | Virus scan + Cloud Sandbox preview (future phase) |

## 8. Development Tips

- Use Copilot/VSCode context for best results.
- Store API keys in `.env` files.
- Use prompts to guide Copilot for modularization, AI, and backend logic.
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
