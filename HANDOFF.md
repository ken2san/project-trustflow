# TrustFlow — AI Session Handoff

_Last updated: 2026-05-22_

> Use this file to brief a new AI session on the current project state.
> Update before ending a session. Paste the contents as your first message.

---

## Project Summary

TrustFlow is AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Live: not yet deployed

## Current Phase

Phase 2 (UX Flow) — see `TrustFlow_Development_Roadmap.md` for full scope and open items.

## What Was Done Last Session

- Applied project-template v1.0.0 via `init-project.sh --apply` (AGENTS.md, .vscode/settings.json updated)
- Created `.github/instructions/` with 5 TrustFlow-specific `.instructions.md` files
- Added `.github/prompts/init.prompt.md`; fixed script to include it in future `--apply` runs

## Current State

- Prototype functional — Supabase integration active (auth, realtime, Edge Function: `timestamp-event`)
- Agent config updated to template v1.0.0 — all `.github/instructions/` files in place

## Active Constraints

- Do not implement Phase 3 or later without explicit instruction.
- Do not modify `supabase/migrations` or the Edge Function schema without explicit instruction.

## Next Priority

Review remaining Phase 2 (UX Flow) items in `TrustFlow_Development_Roadmap.md` and select the next highest-priority task.

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `TrustFlow_Development_Roadmap.md` — current phase and open items
- `TrustFlow_Protocol.md` — system protocol rules
- `Decisions.md` — architectural decisions (do not reverse without instruction)
