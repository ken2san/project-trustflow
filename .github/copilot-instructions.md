
# Copilot Instructions (TrustFlow)

## Purpose
TrustFlow-specific coding standards and operational rules. Swap or edit this file for other projects.

---

### 1. Stack & Directory
- React 18, Vite, Tailwind CSS, Lucide React
- LocalStorage only (no backend)
- Directory: views/, components/ui/, components/visual/, components/modals/, lib/

### 2. State Management
- Use CustomEvent-based event-driven state (no Redux, Context, Zustand)
- Local state for UI-specific data

### 3. Utilities & Formatting
- Use src/lib/utils.js for all formatting (formatNumber, formatDate, etc.)

### 4. UI/UX & Styling
- Disabled: bg-slate-300 text-slate-500 cursor-not-allowed opacity-60
- Tailwind only, no CSS-in-JS
- Responsive: use md: breakpoints
- All comments in English (except UI text)

### 5. Commit Convention
- Format: type: Description (feat, fix, refactor, docs, style)

### 6. i18n
- (Planned) src/locales/{en,ja}/translation.json, fallback English

### 7. Prohibitions
- Zero-Touch Policy: Do not edit outside specified scope
- No unsolicited improvements or refactors
- Do not replace CustomEvent with any state library

---

## Reference
See AGENT.md and skills/ for further details and rationale.

_Last updated: 2026-02-10_