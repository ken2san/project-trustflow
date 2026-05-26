---
description: Project-specific customizations for TrustFlow — safe from template upgrades
applyTo: "**"
---

# Custom Agent Rules

_Last updated: 2026-05-22_

<!--
DESIGN PATTERN — read this before editing (applies to AI agents too):

There are two global instruction files. Their roles are deliberately separate:

  global.instructions.md        — MANAGED BY TEMPLATE
                                  Overwritten when `init-project.sh --apply` is run.
                                  Contains universal rules sourced from project-template.
                                  Do NOT add project-specific content here — it will be lost on the next template upgrade.

  global.custom.instructions.md — OWNED BY THIS PROJECT (this file)
                                  Never touched by `init-project.sh --apply`.
                                  Add all project-specific rules, exceptions, and context HERE.
                                  This is the only file safe to accumulate project knowledge in.

If you are an AI agent deciding where to add a rule:
  - Generic / reusable rule → belongs upstream in project-template, not here.
  - Project-specific exception or context → add it in this file.
-->

## Project-Specific Overrides

_Last updated: 2026-05-26_

## Testing Gate

- Run `make check` (unit tests + build) before every commit. Do not commit if either fails.
- Unit tests live in `tests/unit/`. Pure functions only — no React, no DOM, no Supabase.
- Before extracting logic from `src/App.jsx` into a lib file, the extracted function must have at least one test.
