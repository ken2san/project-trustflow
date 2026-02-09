# SKILL.md

## Purpose

Concrete, actionable procedures and checklists for AI agents to execute in this project.

---

### MVP Slimdown Procedure

1. Create a working branch: `git switch -c chore/mvp-slimdown`
2. List unused/redundant components and modals
3. Move unnecessary files to archive/
4. Remove all imports and usage references
5. Skip/simplify flows outside MVP (e.g., BiometricModal)
6. Clean up props and dummy/mock data
7. Update documentation to match current state
8. Commit at each logical milestone

_Tips:_

- Archived files can be restored from archive/
- Make small, frequent commits
- Centralize rules in copilot-instructions.md

---

## Add New View

1. Create component in src/views/
2. Import and render in src/App.jsx
3. Add navigation logic if needed
4. (Future) Add i18n keys in en/translation.json and ja/translation.json

---

_Last updated: 2026-02-10_