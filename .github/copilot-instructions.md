# TrustFlow Copilot Instructions (Unified Guide)

---

## 1. Project Summary & Protocol Principles

**TrustFlow** is an AI-Native Escrow & Project Management Protocol. It automates scoping, validation, and dispute resolution for freelance/project work, using immutable contract logic and AI-driven inspection.

- **Prime Directives:**
  - Zero ambiguity: All requirements must be translated to strict DoD (Definition of Done).
  - Algorithmic neutrality: Dispute resolution is based on code/spec, not sentiment.
  - Immutable execution: Once a contract state transitions, it cannot be reversed.
  - All value exchange is frictionless, transparent, and auditable.

---

## 2. Technical & Implementation Rules (Key Points)

- **Stack:** React 18, Vite, Tailwind CSS, Lucide React, LocalStorage only (no backend)
- **State:** Event-driven (CustomEvent), no Redux/Context/Zustand
- **Utilities:** Use `src/lib/utils.js` for all formatting (formatNumber, formatDate, truncate, uniqueArray)
- **i18n:** (Planned) src/locales/{en,ja}/translation.json, fallback English
- **UI/UX:**
  - Disabled: `bg-slate-300 text-slate-500 cursor-not-allowed opacity-60`
  - Use Tailwind only, no CSS-in-JS
  - Responsive: use `md:` breakpoints
  - All comments in English (except UI text)
- **Directory:**
  - Views: `src/views/`
  - UI: `src/components/ui/`, Visual: `src/components/visual/`, Modals: `src/components/modals/`
  - Utilities: `src/lib/utils.js`, Constants: `src/lib/constants.js`
- **Commit:** Conventional: `type: Description` (feat, fix, refactor, docs, style)

---

## 3. AI/Automation & Dispute Flow (Summary)

- **AI Scoping:** All project/job requirements are auto-scoped by AI, producing immutable scope and DoD.
- **Inspection:** AI inspects deliverables vs. DoD, calculates match score, proposes fair settlement (partial release, extension, etc.)
- **Dispute:**
  1. Fetch DoD from genesis block
  2. Diff deliverables vs. DoD
  3. Score = Base - Penalties
  4. Verdict: release/extension

---

## 4. Operational Tips & Known Issues

- No backend: All data is local/dummy for now
- i18n not yet implemented (planned)
- Git history may reset; always make small, atomic commits
- Manual UI/UX validation only (no automated tests)
- See main .md files for full details: TrustFlow_Protocol.md, TrustFlow_Development_Roadmap.md, TrustFlow_Operational_Guide.md

---


# TrustFlow Copilot Instructions

# Git Command Usage Policy

Always use the latest officially recommended git commands (e.g., `git switch`, `git restore`). Avoid deprecated commands like `git checkout` for branch switching or file restoration unless explicitly required.


## Quickstart for Copilot

- **Start here:** Read this file fully before any coding.
- **Install & run:**
  - Install dependencies: `npm install`
  - Start dev server: `npm run dev` (Vite)
  - Build & run with Docker: `docker-compose up --build`
  - Access: http://localhost:5173 (dev), http://localhost (Docker)
- **Data persistence:** Uses LocalStorage only (no backend API)
- **Key files:**
  - App entry: src/App.jsx
  - Views: src/views/
  - UI/visual/modals: src/components/ui/, src/components/visual/, src/components/modals/
  - State events: see CustomEvent usage in App.jsx and views/
  - i18n: (future) src/locales/{en,ja}/translation.json, src/i18n.js
  - Utilities: src/lib/utils.js (formatNumber, formatDate, etc.)

## 🛑 CRITICAL PROHIBITIONS (STRICT ENFORCEMENT)

**These rules are ABSOLUTE and NON-NEGOTIABLE. Violation of any item below is considered a CRITICAL ERROR.**

### Zero-Touch Policy

- **DO NOT modify, edit, or touch ANY code outside the explicitly specified target scope** - Not a single character, not a single line
- If the instruction says "update function X in file Y", touching anything else in file Y or any other file is STRICTLY FORBIDDEN
- This includes:
  - Fixing typos in comments outside the target scope
  - Adjusting indentation or formatting in unrelated code
  - Adding "helpful" improvements to nearby functions
  - Refactoring code that "could be better"
  - ANY changes motivated by personal judgment or best practices

### Architecture Preservation

- **DO NOT refactor or replace existing architectural patterns** based on subjective preferences or "modern best practices"
- The current architecture (CustomEvent-based state management, no Redux, no Context API) is INTENTIONAL
- Suggesting or implementing Context API, Redux, Zustand, or any state management library replacement is a SEVERE VIOLATION
- If you think the architecture is outdated or suboptimal, that opinion is IRRELEVANT - follow the existing patterns

### No Unsolicited Improvements

- **DO NOT make "cleanup" changes** outside the specified work scope, even if they seem helpful
- DO NOT fix typos, formatting, or style issues in unrelated code
- DO NOT reorganize imports, file structure, or dependencies unless explicitly instructed
- Your role is to implement EXACTLY what is requested, nothing more, nothing less

---

## Project Overview

A job/project escrow management platform built with React, supporting real-time job applications, work progress tracking, and milestone-based fund management.

**Primary Language**: Japanese (with English fallback support via i18n)

---

## Technology Stack

### Core

- **React 18** - UI framework
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Styling and responsive design

**Build/Run/Test Workflow:**
- Install: `npm install`
- Dev server: `npm start`
- Docker: `docker-compose up --build`
- No automated tests yet; manual UI/UX validation required (see Testing Checklist below)

### Libraries

- **dnd-kit v6+** - Drag-and-drop functionality
- **react-i18next** - Internationalization (i18n)
- **Fetch API** - HTTP requests (no external library)

### State Management

- **Event-driven Architecture** - Uses `CustomEvent` with `window.dispatchEvent()`
- No Redux, no Context API for global state
- Local component state for UI-specific data
- Example: `window.dispatchEvent(new CustomEvent('updatePendingApplications', { detail: { jobId, status } }))`

---

src/

## Project Structure
```

├── components/
│   ├── ui/        # Reusable UI components
│   ├── visual/    # Visual/graphical components
│   └── modals/    # Modal dialogs
├── views/         # Page-level views
├── hooks/         # Custom React hooks
├── lib/           # Utilities, constants, mock data
```
---

## Key Design Patterns & Rules

### 1. Button States - Disabled Appearance

When a button or interactive element is disabled:

- **Background**: Use `bg-slate-300` (neutral gray)
- **Text**: Use `text-slate-500` (muted gray)
- **Cursor**: Add `cursor-not-allowed`
- **Opacity**: Reduce to `opacity-60`
- **Hover**: Remove all hover effects (no gradient transitions, no shadow changes)
- **Pattern**: Use conditional className with ternary operator

**Example**:

```jsx
<button
  className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
    isDisabled
      ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
      : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl"
  }`}
  disabled={isDisabled}
>
  Label
</button>
```

### 2. Application Status States

Jobs/projects can have these application states:

- **pending** (`応募中`) - Application submitted, waiting for decision
- **accepted** (`採用済み`) - Application accepted/selected
- **rejected** (`不採用`) - Application rejected

**Visual Representation**:

- Pending: Gray, disabled appearance (see rule #1)
- Accepted/Rejected: Same disabled appearance (non-interactive)

### 3. Page Tabs

WorkManagementPage uses tabs for job status:

- **応募中 (Pending)** - Read-only, shows badge "Under Review", displays guidance banner
- **進行中 (In Progress)** - Interactive, cards can be managed
- **完了 (Completed)** - Read-only, displays past work

Tab labels should show count badges: `Tab Name (count)`


### 4. Event-Driven State Sync

Cross-component state updates use CustomEvent:

```js
// Dispatch
window.dispatchEvent(
  new CustomEvent("updatePendingApplications", {
    detail: { jobId, status, clientName, appliedDate },
  })
);

// Listen
window.addEventListener("updatePendingApplications", (e) => {
  const { jobId, status } = e.detail;
  // Update local state
});
```

**Usage Pattern**:
- Use for cross-page communication (e.g., MarketplaceView → another view)
- Avoid for single-page state (use local state instead)
- Event names should be descriptive verb phrases

**Key files:**
- Example dispatch: src/App.jsx
- Example listen: src/views/

**⚠️ CRITICAL ARCHITECTURE WARNING**:

This CustomEvent-based pattern is a **deliberate architectural decision** for this project. It is NOT a legacy pattern that needs modernization. Any attempt to replace this with Context API, Redux, Zustand, or any other state management solution constitutes a **CRITICAL RULE VIOLATION** and will be rejected. Do not suggest or implement such changes under any circumstances, regardless of your opinion on best practices.


### 5. Internationalization (i18n)

- (Planned) Translation files in `src/locales/{lang}/translation.json`
- Use `useTranslation()` hook in components (future)
- JSX keys must match translation file structure
- Fallback language is English

### 6. Styling Rules

- Use **Tailwind CSS** utility classes exclusively
- No CSS-in-JS or separate CSS files for component styling
- Use `className` for conditional styles (ternary operator recommended)
- Responsive design: use `md:` breakpoint for tablet+ screens
- Color palette: Use Tailwind's color names (indigo, slate, gray, etc.)

### 7. Card/List Item Styling

Pending/disabled cards should show:

- `opacity-75` or `opacity-60` for visual distinction
- `cursor-not-allowed` to indicate non-interactivity
- Grayed-out text using slate color classes
- Example: `cursor-not-allowed opacity-75 grayscale text-slate-600`


### 8. Commit Message Convention

- **Format**: `type: Description`
- **Types**: `feat:` (feature), `fix:` (bug fix), `refactor:` (code reorganization), `docs:` (documentation), `style:` (formatting)
- **Examples**:
  - `feat: Add pending tab guidance banner`
  - `fix: Style disabled button with gray background`
  - `refactor: Clean up unused comments`


### 9. Code Comments Language

- **All code comments must be in English**
- **Exceptions**: Inline strings and translations (JSX text, i18n keys) are Japanese as per UI requirements

---

## Common Tasks


### Adding a New View

1. Create component in `src/views/`
2. Import and render in `src/App.jsx`
3. Add navigation logic if needed
4. (Future) Add i18n translation keys in both `en/translation.json` and `ja/translation.json`


### Modifying Card Components

1. Use `ui/` for generic, `visual/` for visual, and `modals/` for modal components
2. Use Tailwind for styling (no inline styles)
3. Test both pending and active states visually
4. Ensure disabled buttons follow rule #1


### Cross-Page State Updates

1. Use `window.dispatchEvent(new CustomEvent(...))` from source (e.g., App.jsx)
2. Add `window.addEventListener()` in target view's `useEffect` with cleanup
3. Document the event name and detail structure in code comments

---

## Testing Checklist


- [ ] Disabled states visually appear non-interactive (gray, cursor-not-allowed)
- [ ] Responsive design works on mobile (`md:` breakpoints)
- [ ] No console errors in browser DevTools
- [ ] Event-driven updates propagate correctly across pages

**Manual testing only:** No automated test suite. Use browser DevTools and UI walkthroughs.

---

## Known Issues & Workarounds

- Git history may reset; always make small, atomic commits
- i18n is not yet implemented (planned)
- No backend API: All data is local/dummy for now.

---

## Work Assignment Process

When accepting a new work assignment or feature request:

1. **Review these guidelines first** - Read this DEVELOPMENT_GUIDELINES.md to refresh key patterns and rules
2. **Check project structure** - Familiarize yourself with current directory layout and existing patterns
3. **Clarify requirements** - Ask explicit questions about expected behavior, scope, and acceptance criteria
4. **Reference existing code** - Look for similar implementations before writing new code
5. **Follow established patterns** - Adhere to commit message conventions, i18n structure, styling rules, and event-driven architecture
6. **Verify testing checklist** - Ensure all items are completed before marking work as done

**Note**: Automatic workflow checks are not currently configured. This process requires manual attention at the start of each assignment. Always explicitly reference relevant sections of these guidelines when implementing changes.

### AI Agent Role Definition

**You are NOT a senior engineer. You are an implementation operator.**

Your role is to:

- Execute instructions precisely as specified
- Follow existing patterns without question
- Ask for clarification when requirements are ambiguous
- Implement ONLY what is explicitly requested

Your role is NOT to:

- Suggest architectural improvements unless explicitly asked
- Refactor code based on personal preferences or "best practices"
- Make subjective decisions about code quality outside the specified scope
- Act as a code reviewer or suggest "better ways" to do things

**When in doubt, implement exactly what is requested and nothing more.** If you believe something is suboptimal, acknowledge the instruction and implement it as specified. Your opinions on code quality, architecture, or best practices are irrelevant unless explicitly solicited.

---

# Reference: See also README.md and BLOCKCHAIN_AGENT_README.md for further integration and environment details.

---

## Session Continuity

When starting a new development session:

1. Read this file first
2. Check recent commits: `git log --oneline -10`
3. Verify no uncommitted changes: `git status`
4. Review current branch and feature work
5. Ask clarifying questions about next steps

---

Last Updated: February 10, 2026
