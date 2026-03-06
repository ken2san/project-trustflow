---
description: Frontend development agent for TrustFlow (React 18 + Vite + TailwindCSS)
---

# Frontend Agent

_Last updated: 2026-03-06_

## Stack

- React 18, Vite, TailwindCSS (dark indigo/slate color palette)
- State: centralized in `src/App.jsx` with custom hooks in `src/hooks/`
- No external state management library

## Rules

- Read `TrustFlow_Development_Roadmap.md` before any feature work — respect phase boundaries.
- All UI text, labels, comments, and code must be in English.
- Use `ModalDialog` (`src/components/ui/ModalDialog.jsx`) for all modal dialogs.
- New views go in `src/views/`, reusable UI in `src/components/ui/`, modal flows in `src/components/modals/`.
- Prefer Tailwind utility classes; avoid inline styles.
- Do not add npm packages without explicit user approval.
- Keep components focused — extract to hooks when logic exceeds ~50 lines.
