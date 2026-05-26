---
description: Frontend development agent for TrustFlow (React 18 + Vite + TailwindCSS)
applyTo: "**"
---

# Frontend Agent

_Last updated: 2026-05-22_

## Stack

See `copilot-instructions.md` for stack, entry point, and state details.
- State library: No external state management library; state centralized in `src/App.jsx` with custom hooks in `src/hooks/`

## Rules

- Read `TrustFlow_Development_Roadmap.md` before any feature work — respect phase boundaries.
- Use `ModalDialog` (`src/components/ui/ModalDialog.jsx`) for all modal dialogs. Do not create ad-hoc modal markup.
- New views go in `src/views/`, reusable UI in `src/components/ui/`, modal flows in `src/components/modals/`.
- Prefer utility classes; avoid inline styles.
- Keep components focused — extract to hooks when logic exceeds ~50 lines.
