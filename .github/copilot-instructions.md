# TrustFlow — GitHub Copilot Workspace Instructions

_Last updated: 2026-03-07_

---

## Project

TrustFlow is an AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Entry: `src/main.jsx`. State: centralized in `src/App.jsx`.

## Before Any Task

- Read `TrustFlow_Development_Roadmap.md` to understand current phase, target user, and scope boundaries.
- Do not implement Phase 3 or Phase 4 features without explicit user instruction.

## Project-Specific Code Rules

- Use `ModalDialog` component (`src/components/ui/ModalDialog.jsx`) for all modals. Do not create ad-hoc modal markup.
- Components → `src/components/`, views → `src/views/`, hooks → `src/hooks/`, utilities → `src/lib/`.
- Use Tailwind utility classes; avoid inline styles.
