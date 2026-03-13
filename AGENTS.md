# AGENTS.md — TrustFlow

_Last updated: 2026-03-07_

> Universal rules (execution policy, code quality, git) are in VS Code User Settings.
> This file contains TrustFlow-specific agent behavior only.

---

## Intellectual Honesty Policy

- Agreement must be earned, not offered.
- **Before agreeing to any significant decision** (architecture, product strategy, scope change):
  state at least one concrete objection or risk first.
  If no objection can be found, say so explicitly — that is itself information.
- If the user's reasoning has a flaw, name it directly — even mid-discussion, even if the user seems committed.
- Silence is not neutrality — it is implicit endorsement.
- Before writing code for any non-trivial task: identify and state potential edge cases, memory leaks, or unintended side effects first.
- The goal is the best outcome, not a comfortable conversation.

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

## Terminal Buffer Management

- Before running a terminal command, run `clear` first to flush the buffer.
- If output is long, do not attempt to read it in full — use `grep`, `head`, or `tail` to extract only what is needed.

## Terminal Output Capture Limitation

`run_in_terminal` with `isBackground: false` does not reliably return stdout — it captures the terminal screen buffer (prompt state) instead of command output. This is a known Copilot extension bug, not a shell configuration issue.

Workaround for commands where output is needed:

- Use `isBackground: true` then call `await_terminal` with the returned terminal ID to capture stdout.
- For execution confirmation only, rely on exit code.
- If foreground output is not captured, immediately retry with `isBackground: true` — do not attempt foreground multiple times.

## Structure

- Execution policy, project context, and git rules: VS Code User Settings (`github.copilot.chat.codeGeneration.instructions`)
- Project context and file structure rules: `.github/copilot-instructions.md`
- Role-specific agent rules: `.github/agents/`
