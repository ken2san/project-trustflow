# MVP Slimdown Procedure (TrustFlow)

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

_Last updated: 2026-02-10_# Skill: MVP Slimdown Procedure

## Purpose
Standardize the process for reducing a project to its Minimum Viable Product (MVP) core, ensuring maintainability and clarity.

## When to Use
- When you want to minimize project features and structure
- When you need to temporarily archive unused components or visual effects
- When preparing for an MVP release and need to clean up

## Steps
1. **Create a working branch**
   - `git switch -c chore/mvp-slimdown`
2. **List up unused/redundant components and modals**
3. **Create an archive/ directory and move unnecessary files there**
4. **Remove all imports and usage references**
5. **Skip or simplify flows outside MVP (e.g., BiometricModal)**
6. **Clean up props and dummy/mock data**
7. **Update documentation to match the current state**
8. **Commit at each logical milestone**

## Tips
- Archived files can be restored from archive/ at any time
- Make small, frequent commits
- Centralize rules and guidelines in copilot-instructions.md

---
