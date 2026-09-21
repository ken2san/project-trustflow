#!/usr/bin/env bash
# pre-commit-verify.sh — PreToolUse hook, scoped to `git commit *` via the
# "if" filter in .claude/settings.json. Blocks the commit if the project's
# actual test command (detected from its manifest, not pinned) fails —
# turns AGENTS.md's "Never commit unverified code" into a mechanical gate
# instead of relying on the agent to remember to run tests first.
set -uo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0

# Detect the test command the same way global.instructions.md's
# Verification Commands section tells the agent to: from the stack's own
# manifest, never pinned. No manifest match means nothing to verify
# against, so allow the commit through rather than blocking on a guess.
TEST_CMD=""
if [[ -f package.json ]] && command -v jq &>/dev/null; then
  script="$(jq -r '.scripts.test // empty' package.json 2>/dev/null)"
  [[ -n "$script" && "$script" != *"no test specified"* ]] && TEST_CMD="npm test"
elif [[ -f Makefile ]] && grep -q '^test:' Makefile 2>/dev/null; then
  TEST_CMD="make test"
elif [[ -f pyproject.toml ]] && command -v pytest &>/dev/null; then
  TEST_CMD="pytest"
elif [[ -f Cargo.toml ]] && command -v cargo &>/dev/null; then
  TEST_CMD="cargo test"
fi

[[ -z "$TEST_CMD" ]] && exit 0

if ! OUTPUT="$(eval "$TEST_CMD" 2>&1)"; then
  echo "Blocked commit: \`$TEST_CMD\` failed. Fix the failing tests before committing." >&2
  echo "" >&2
  echo "$OUTPUT" | tail -n 60 >&2
  exit 2
fi

exit 0
