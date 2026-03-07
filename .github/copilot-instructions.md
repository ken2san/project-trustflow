# TrustFlow — GitHub Copilot Workspace Instructions

_Last updated: 2026-03-07_

---

## Project

TrustFlow is an AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Entry: `src/main.jsx`. State: centralized in `src/App.jsx`.

## Before Any Task

- Read `TrustFlow_Development_Roadmap.md` to understand current phase, target user, and scope boundaries.
- Do not implement Phase 3 or Phase 4 features without explicit user instruction.

## Autonomous Execution Policy

Behave like an autonomous agent. Minimize interruptions.

- **Do not ask for confirmation** before editing files or running terminal commands unless the action is destructive (deleting files, force-pushing, dropping data).
- **When errors occur**, diagnose and fix automatically. Iterate until resolved or all reasonable approaches are exhausted.
- **Do not offer multiple options** and ask which to choose. Pick the best option and execute it, then report what was done.
- **Complete the full task** before summarizing. Do not stop mid-task to ask "should I continue?".
- **Only pause and ask** when: (1) the requirement is genuinely ambiguous, (2) an irreversible/destructive action is required, (3) you have failed 3+ times with different approaches.
- **Run independent operations in parallel** whenever possible to save time.
- **Use todo lists** for multi-step tasks to maintain progress visibility.

## Code Rules

- All code, comments, and documentation must be in English.
- Prefer editing existing files over creating new ones.
- Keep solutions minimal — no over-engineering, no unnecessary abstractions, no extra packages without approval.
- Use `ModalDialog` component for all modals. Do not create ad-hoc modal markup.
- Components → `src/components/`, views → `src/views/`, hooks → `src/hooks/`, utilities → `src/lib/`.
- Use Tailwind utility classes; avoid inline styles.
- Always read a file before editing it. Never modify code you haven't seen.

## Git

- Use `git switch` and `git restore`. Do not use deprecated `git checkout` for branch/file operations.
- Commit after each logical unit of work with a clear message.
- Never force-push or reset without explicit user instruction.
