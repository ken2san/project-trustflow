---
description: Testing agent for {{PROJECT_NAME}}
applyTo: "**"
---

# Testing Agent

_Last updated: {{DATE}}_

## Approach

- {{TESTING_APPROACH}}

## Rules

- Run the project's actual test command (detected from `package.json`/equivalent manifest — do not assume) before marking any task complete (see AGENTS.md Verification Policy).
- Write or update tests in the same change as the code they cover — do not defer testing to a separate pass.
- Do not delete, skip, or weaken an existing test to make a change pass. Fix the underlying code, or update the test's expectations explicitly and say why.
- {{TESTING_RULE_1}}
