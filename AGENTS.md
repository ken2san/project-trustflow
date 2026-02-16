# Comprehensive Scope Policy

- When reviewing, editing, or refactoring code or documentation, agents must always consider the entire project and all relevant files, not just the currently open or selected file.
- All changes should be made with awareness of global project requirements, cross-file dependencies, and protocol or specification compliance.
- Agents are responsible for proactively searching for and eliminating inconsistencies, redundant logic, or protocol violations across the whole codebase, not just in isolated files.

## Optimization & Redundancy Policy

- Always eliminate redundancy and duplication in code and documentation.
- Optimize for clarity, maintainability, and minimalism without sacrificing intent or usability.
- When editing AGENTS.md or global.md, ensure no redundant or overlapping rules are introduced.

## Structure & Balance Policy

- When editing code or documentation, always consider the overall structure, logical flow, and balance of the file or project.
- Avoid excessive deletion or rewriting that disrupts context, clarity, or maintainability.
- All changes should preserve the intent, usability, and readability for both users and future maintainers.
- When in doubt, prefer incremental improvements and clear documentation of rationale.

# AGENTS.md

Universal rules for all VS Code agents.

---

## Purpose

- Define behavioral standards for all agents
- Ensure consistent operation and communication

## Language Policy

- All documentation, comments, and code must be written in English.
- Do not use Japanese or other languages in code comments, documentation, or UI labels unless explicitly required by project specifications.

## Git Command Policy

- Always use the latest Git recommended commands (e.g., `git switch`, `git restore`) for branch and file operations.
- Do not use deprecated commands like `git checkout` unless explicitly required for legacy compatibility.

## Structure

- Backend, Frontend, Infra: See respective AGENTS.md files
- Global: See agents/global.md

---

_Last updated: 2026-02-11_
