## Challenges and Solution Feature Roadmap for Real Operation

---

### 1. The Subjectivity Gap (Discrepancy Between Subjective Judgment and AI Evaluation)

**Issue:**
AI can determine whether something meets the specifications (DoD), but cannot fully guarantee subjective qualities like "good design sense" or "readable code." When a client says, "AI says OK, but I don't like it, so I won't pay," it leads to major disputes.

**Solution Features:**

- **Human Arbiter Escalation**
  - If there is dissatisfaction with the AI's judgment, summon certified experts (third parties) for each category (design, development, etc.) to make the final decision.
  - UI image: From the "Dispute" button in chat, create an effect as if calling an arbitrator.
- **Partial Release**
  - Instead of all-or-nothing, AI proposes a settlement such as "I accept 80% progress, so I'll pay for that portion."

---

### 2. The Ghosting Issue (Unresponsive Clients)

**Issue:**
Common in freelance work: after delivery, the client is too busy to press the acceptance button, or communication is cut off. Funds remain frozen in escrow, killing the creator's cash flow.

**Solution Features:**

- **Auto-Release Timer**
  - After delivery, if the client does not take action (approve or request revision) within "72 hours," AI considers it tacit approval and automatically releases funds to the creator.
  - UI image: Display a countdown timer (with a tense design like bomb defusal) on the acceptance screen.

---

### 3. Money Laundering and Identity Verification (AML & KYC)

**Issue:**
If large sums can be transferred anonymously, there is a risk of use for criminal money laundering. Passing payment processor (e.g., Stripe) screening is also essential.

**Solution Features:**

- **eKYC Integration (Online Identity Verification)**
  - Scan ID cards and face photos with a smartphone camera to guarantee identity.
  - Link the "Professional Verified" badge in the current UI to actual authentication status, not just decoration.
- **Trust Score History**
  - Record "how much was paid in the past" and "dispute rate" in a blockchain-like (tamper-proof) manner, and present it to the other party when starting a new transaction.

---

### 4. Security and Operation Guarantee of Deliverables (Security & Sandbox)

**Issue:**
Problems such as viruses in delivered zip files or code not running in the user's environment (blaming the environment).

**Solution Features:**

- **Cloud Sandbox Preview**
  - Automatically build and run delivered code on isolated containers (e.g., AWS), not the user's local environment, and display the preview screen in the browser.
  - Require pressing the acceptance button only after the system proves "it works."
- **Virus Scan Shield**
  - Perform malware scans at upload and allow only safe files to pass through as a gatekeeper.

---

## Next Implementation Priorities

UI/UX is nearly complete, so the next step is to focus on backend features for "trouble avoidance."

- **Auto-Release Timer** (Implementation difficulty: Low / Effect: Huge)
  - Gives creators peace of mind that "it's okay even if left unattended."
- **Escalation UI** (Implementation difficulty: Medium)
  - Provides an escape route: "If something happens, humans can help."
- **eKYC** (Implementation difficulty: High / Essential)
  - If you want to launch as a service, this is unavoidable.
