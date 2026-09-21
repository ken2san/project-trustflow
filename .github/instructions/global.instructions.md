---
description: Global agent rules for TrustFlow — applies to all roles
applyTo: "**"
---

# Global Agent

_Last updated: 2026-09-21_

<!--
TEMPLATE-MANAGED FILE — read this before editing (applies to AI agents too):

This file is overwritten by `init-project.sh apply` on every template upgrade.
Do NOT add project-specific content here — use global.custom.instructions.md instead.

Purpose of this file:
- Provide project-wide operational context sourced from project-template.
- Rules in AGENTS.md always take precedence; do not duplicate them here.
-->

## Verification Commands

Do not assume the dev/test/build commands. Before running any of them, check the actual
manifest for this stack (`package.json` scripts, `Makefile`, `Cargo.toml`, `pyproject.toml`,
etc.) and use what it actually defines — pinned commands go stale the moment the stack changes
(package manager swap, monorepo restructure, script rename) and a stale command silently misleads
verification. If genuinely ambiguous (e.g. multiple candidate scripts), ask once rather than
guessing.

The self-healing loop must use the actual discovered commands for verification steps. If none
can be found, state that explicitly rather than skipping verification.
