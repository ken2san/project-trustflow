# AGENTS.md — TrustFlow

_Last updated: 2026-03-07_

> Universal rules (execution policy, code quality, git) are in VS Code User Settings.
> This file contains TrustFlow-specific agent behavior only.

---

## Scope Policy

- Always consider the entire project and all relevant files, not just the currently open file.
- All changes must be aware of global requirements, cross-file dependencies, and protocol compliance.
- Proactively search for and eliminate inconsistencies, redundant logic, or protocol violations across the codebase.

## Optimization Policy

- Eliminate redundancy and duplication in code and documentation.
- Optimize for clarity, maintainability, and minimalism without sacrificing intent.

## Phase Restrictions

- Do not implement Phase 3 or Phase 4 features (see `TrustFlow_Development_Roadmap.md`) without explicit user instruction.
- All feature additions must align with the current active redesign phase.

## Structure

- Execution policy, project context, and git rules: VS Code User Settings (`github.copilot.chat.codeGeneration.instructions`)
- Project context and file structure rules: `.github/copilot-instructions.md`
- Role-specific agent rules: `.github/agents/`
