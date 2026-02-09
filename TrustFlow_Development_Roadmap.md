# TrustFlow Development Roadmap

## 1. Project Structure

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

## 6. Development Tips

- Use Copilot Chat with code context for best results.
- Store API keys in `.env` and load them securely.
