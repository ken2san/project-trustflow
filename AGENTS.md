# AGENTS.md

## TL;DR — Critical Rules

- **Self-healing limit:** Max 3 fix attempts on any error, then stop and escalate with a structured report.
- **Verify before done:** Run tests and build before marking any task complete. Never commit unverified code.
- **Stay in scope:** Only touch files directly related to the current task. Do not refactor unrelated code.
- **No masking:** Never suppress errors, skip tests, or modify assertions to force a green result.
- **Escalate clearly:** When blocked, report the exact error, what was tried, and what human decision is needed.

---

## Intellectual Honesty Policy

- Agreement must be earned, not offered.
- **Before agreeing to any significant decision** (architecture, product strategy, scope change):
  state at least one concrete objection or risk first.
  If no objection can be found, say so explicitly — that is itself information.
- If the user's reasoning has a flaw, name it directly — even mid-discussion, even if the user seems committed.
- Silence is not neutrality — it is implicit endorsement.
- Before writing code for any non-trivial task: identify and state potential edge cases, memory leaks, or unintended side effects first.
- Before acting on a non-trivial request: state what you understand to be the underlying goal. Do not wait for confirmation — proceed, but make the interpretation explicit so it can be corrected.
- The goal is the best outcome, not a comfortable conversation.

## Scope Policy

- Always consider the entire project and all relevant files, not just the currently open file.
- All changes must be aware of global requirements, cross-file dependencies, and protocol compliance.
- Proactively search for and eliminate inconsistencies, redundant logic, or protocol violations across the codebase.

## Optimization Policy

- Eliminate redundancy and duplication in code and documentation.
- Optimize for clarity, maintainability, and minimalism without sacrificing intent.

## Code Quality Policy

- Do not introduce dead code, commented-out blocks, or unused imports.
- Do not add packages or dependencies without explicit user approval.
- All code, comments, and UI text must be in English.
- Follow the existing naming conventions and file structure of the project.

## Self-Healing Loop Policy

When code, a test, or a build fails, enter the self-healing loop:

1. **Diagnose first** — read the full error output before touching any file.
2. **One fix at a time** — apply a single targeted change, then re-run the failing command to verify.
3. **Hard limit: 3 attempts** — after 3 distinct fix attempts on the same error, stop and escalate. Do not retry the same approach twice.
4. **Scope constraint** — only modify files directly implicated by the error. Do not refactor unrelated passing code as part of a fix.
5. **No masking** — do not suppress errors, skip assertions, mock external calls, or modify tests to match broken code unless that is explicitly the task.

### Escalate when (stop, report, wait for instruction):

- 3 attempts exhausted with no progress
- The fix requires adding a dependency, changing a DB schema, or altering the architecture
- The error is ambiguous or the requirement is contradictory
- The fix would touch security-sensitive code (auth, credentials, encryption, access control)

### Escalation report format:

```
Blocked after N attempt(s).
Error: <exact error message>
Tried:
  1. <approach 1> — result
  2. <approach 2> — result
Needs: <specific human decision required to unblock>
```

## Verification Policy

Before marking any task complete:

1. The code must build or compile without errors.
2. If a test suite exists, run it — do not complete with failing tests.
3. For UI changes, verify in the browser at the dev URL.
4. If the environment is not running or verification is impossible, state this explicitly — do not silently skip it.
5. Do not commit code that has not been verified to run.

## Git Policy

- Commit messages: `type(scope): description` (e.g. `feat(auth): add login flow`)
- One logical change per commit — do not bundle unrelated changes.
- Do not commit secrets, credentials, or `.env` files.
- Do not force-push to main/master without explicit instruction.

## Structure

- Project context and workspace rules: `.github/copilot-instructions.md`
- Role-specific instructions: `.github/instructions/*.instructions.md`
- Project-specific overrides (safe from template upgrades): `.github/instructions/global.custom.instructions.md`
