# TrustFlow — AI Session Handoff

_Last updated: 2026-05-26_

> Use this file to brief a new AI session on the current project state.
> Update before ending a session. Paste the contents as your first message.

---

## Project Summary

TrustFlow is AI-native escrow and contract platform prototype.
Stack: React 18, Vite, TailwindCSS. Live: not yet deployed

## Current Phase

Phase 2 (UX Flow) — see `TrustFlow_Development_Roadmap.md` for full scope and open items.

## What Was Done Last Session

- Resumed Supabase project (had been paused — auth, realtime, Edge Function `timestamp-event` now active again)
- Committed project-template v1.0.0 changes:
  - `AGENTS.md` updated with TL;DR, Self-Healing Loop, Verification, Git, Code Quality policies
  - Added `.github/instructions/` (5 role-specific instruction files) and `.github/prompts/init.prompt.md`
  - Added `.template-version` (1.0.0), `Decisions.md` (ADRs), `HANDOFF.md`
  - Moved Testing Gate rules to `global.custom.instructions.md`
  - Removed obsolete `agents/AGENTS.md` and `agents/global.md`
  - Updated `package-lock.json` (dependency upgrades)

## Current State

- Prototype functional — Supabase integration active (auth, realtime, Edge Function: `timestamp-event`)
- Agent config at template v1.0.0 — all `.github/instructions/` files in place
- All Phase 2 sprint tasks completed (see `TrustFlow_Development_Roadmap.md` Current Sprint)
- Known Gaps remaining: Notification Center, Social/GitHub Trust Score import, RLS hardening, Gemini API integration

## Active Constraints

- Do not implement Phase 3 or later without explicit instruction.
- Do not modify `supabase/migrations` or the Edge Function schema without explicit instruction.

## Next Priority

Select next task from Known Gaps in `TrustFlow_Development_Roadmap.md`:

1. Persistent Notification Center (audit log replacing ephemeral toasts)
2. RLS policy hardening (anonymous identity + realtime in place; access boundaries needed)
3. Real Gemini API integration (Scope Builder currently uses token extraction)
4. Social/GitHub import for Trust Score bootstrap

## Key Files to Read First

- `AGENTS.md` — agent behavior rules
- `TrustFlow_Development_Roadmap.md` — current phase and open items
- `TrustFlow_Protocol.md` — system protocol rules
- `Decisions.md` — architectural decisions (do not reverse without instruction)
