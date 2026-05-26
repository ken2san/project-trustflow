---
description: Global agent rules for TrustFlow — applies to all roles
applyTo: "**"
---

# Global Agent

_Last updated: 2026-05-22_

<!--
TEMPLATE-MANAGED FILE — read this before editing (applies to AI agents too):

This file is overwritten by `init-project.sh --apply` on every template upgrade.
Do NOT add project-specific content here — use global.custom.instructions.md instead.

Purpose of this file:
- Provide project-wide operational context sourced from project-template.
- Define verification commands (filled in during project init).
- Rules in AGENTS.md always take precedence; do not duplicate them here.
-->

## Verification Commands

| Purpose | Command |
| ------- | ------- |
| Start dev server | `npm run dev` → `http://localhost:5173` |
| Run tests | `npm test` |
| Build | `npm run build` |

The self-healing loop must use these commands for verification steps. If a command is not yet defined, state that explicitly rather than skipping verification.
