# TrustFlow — GitHub Copilot Workspace Instructions

_Last updated: 2026-03-06_

---

## Project

TrustFlow is an AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Entry: `src/main.jsx`. State: centralized in `src/App.jsx`.

## Before Any Task

- Read `TrustFlow_Development_Roadmap.md` to understand current phase, target user, and scope boundaries.
- Do not implement Phase 3 or Phase 4 features without explicit user instruction.

## Code Rules

- All code, comments, and documentation must be in English.
- Prefer editing existing files over creating new ones.
- Keep solutions minimal — no over-engineering, no unnecessary abstractions, no extra packages without approval.
- Use `ModalDialog` component for all modals. Do not create ad-hoc modal markup.
- Components → `src/components/`, views → `src/views/`, hooks → `src/hooks/`, utilities → `src/lib/`.
- Use Tailwind utility classes; avoid inline styles.

## Git

- Use `git switch` and `git restore`. Do not use deprecated `git checkout` for branch/file operations.
