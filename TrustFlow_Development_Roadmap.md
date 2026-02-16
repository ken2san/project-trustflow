---
# TrustFlow Development Roadmap & Operational Guide

## Overview & Development Purpose

This document serves as the operational and implementation guide for the TrustFlow MVP Slimdown Skill, directly mapping to the TrustFlow Protocol specification. The goal is to:
  - Deliver only the essential contract workflow and edge case features as defined in the protocol
  - Ensure clarity, maintainability, and extensibility for future enhancements
  - Demonstrate best practices for robust exception and edge case handling
---

## 1. Protocol Feature Mapping & Project Structure

This implementation covers the following protocol features:

- Mid-Contract Cancellation
- Payment Delay/Failure Simulation
- Renegotiation & Terms Modification
- Multiple Rejections & Forced Dispute
- Pause & Resume
- Admin Intervention (Demo Only)

Project structure should modularize large files (e.g., App.jsx) into components, views, hooks, and libraries, following the protocol's directory structure for scalability.

- Modularize large files (e.g., App.jsx) into components, views, hooks, lib, etc.
- Follow the protocol's directory structure for scalability.

## 2. Data Persistence

- Use Firebase Firestore or similar to persist point balances and contract status.
- Example prompt: "Use Firebase Firestore to save and sync selectedJob and user point balance."

## 3. AI Logic

- Integrate Gemini API or similar for DoD generation and AI diagnosis.
- Example prompt: "Use Gemini API to generate 5 Acceptance Criteria from project summary."

## 4. Dispute Resolution

- Add logic to transition to Dispute view if AI Inspection Score is low.
- Notify admin for arbitration.

## 5. Export & Reporting

- Implement PDF export of Audit Trail and DoD using libraries like jspdf.

## 6. Real-World Operational Challenges & Solutions

### 6.1. Subjectivity Gap

- **Issue:** AI can check DoD, but not subjective quality (e.g., "good design").
- **Solution:**
  - Human Arbiter Escalation: Summon certified experts for final decision.
  - Partial Release: AI proposes partial payment for partial completion.

### 6.2. Ghosting (Unresponsive Clients)

- **Issue:** Client does not respond after delivery; funds frozen.
- **Solution:**
  - Auto-Release Timer: After 72h of no action, funds are released automatically.

### 6.3. AML & KYC

- **Issue:** Risk of money laundering, need for identity verification.
- **Solution:**
  - eKYC Integration: Online ID verification (ID scan, face photo).
  - Trust Score History: Record and present payment/dispute history.

### 6.4. Security & Deliverable Guarantee

- **Issue:** Malware or non-working code in deliverables.
- **Solution:**
  - Cloud Sandbox Preview: Run code in isolated containers, show preview.
  - Virus Scan Shield: Scan uploads for malware.

## 7. Implementation Priorities

- Auto-Release Timer (Low difficulty, high effect)
- Escalation UI (Medium)
- eKYC (High, essential)

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
