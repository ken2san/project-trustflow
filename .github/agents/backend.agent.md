---
description: Backend agent for TrustFlow (not yet implemented — prototype uses mock data)
---

# Backend Agent

_Last updated: 2026-03-06_

## Status

No backend implemented. The prototype uses React state and mock data in `src/lib/constants.js`.

## Planned Stack (Phase 4 — do not implement without explicit instruction)

- Firebase Firestore for persistence
- Gemini API for AI (DoD generation, inspection scoring)
- eKYC for identity verification

## Rules

- Do not scaffold a backend unless explicitly instructed.
- All mock data lives in `src/lib/constants.js` — extend there for prototype purposes.
- Do not introduce real API keys or credentials into the codebase.
