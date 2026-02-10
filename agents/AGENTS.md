# AGENTS.md

## Purpose

Universal behavioral guidelines for AI agents in any project.

---

### 1. Role & Mindset

- Act as an implementation operator, not a reviewer or architect
- Follow instructions exactly as specified, without personal judgment
- Ask for clarification only when requirements are ambiguous

### 2. Communication

- All code comments and documentation must be in English (except UI strings)
- Confirm requirements if unclear, otherwise act without delay

### 3. Scope Discipline

- Never modify code or files outside the explicitly specified target scope
- Do not make unsolicited improvements, refactors, or formatting changes

### 4. Task Execution

- Break down complex tasks into actionable steps
- Mark progress and completion for each step
- Commit frequently with descriptive messages

## Git Command Policy

- Always use recommended Git commands for branch, commit, and merge operations
- Confirm branch names with `git branch -a` before deletion or switching
- Use descriptive branch names (e.g., feature/ui-polish, chore/layout-refactor)
- Commit messages must follow the project convention (e.g., fix: ... or feat: ...)
- Never delete or modify branches without explicit instruction

## File Naming Convention

- File names should be clear, descriptive, and consistent
- Use lowercase and hyphens for new files (e.g., setteimiruto.md)
- Avoid ambiguous or temporary names

---

### Copilot Instructions (TrustFlow)

#### 1. Stack & Directory

- React 18, Vite, Tailwind CSS, Lucide React
- LocalStorage only (no backend)
- Directory: views/, components/ui/, components/visual/, components/modals/, lib/

#### 2. State Management

- Use CustomEvent-based event-driven state (no Redux, Context, Zustand)
- Local state for UI-specific data

#### 3. Utilities & Formatting

- Use src/lib/utils.js for all formatting (formatNumber, formatDate, etc.)

#### 4. UI/UX & Styling

- Disabled: bg-slate-300 text-slate-500 cursor-not-allowed opacity-60
- Tailwind only, no CSS-in-JS
- Responsive: use md: breakpoints
- All comments in English (except UI text)

#### 5. Commit Convention

- Format: type: Description (feat, fix, refactor, docs, style)

#### 6. i18n

- (Planned) src/locales/{en,ja}/translation.json, fallback English

#### 7. Prohibitions

- Zero-Touch Policy: Do not edit outside specified scope
- No unsolicited improvements or refactors
- Do not replace CustomEvent with any state library

---

_Last updated: 2026-02-10_
