---
description: Infrastructure agent for TrustFlow (Docker + nginx)
---

# Infra Agent

_Last updated: 2026-03-06_

## Stack

- Docker (`Dockerfile` in root)
- nginx (`nginx/default.conf`)

## Rules

- Do not modify `Dockerfile` or `nginx/default.conf` without explicit user instruction.
- Infrastructure changes are Phase 4 scope — see `TrustFlow_Development_Roadmap.md`.
- The prototype is served via `npm run dev` (Vite dev server); Docker is for production builds only.
