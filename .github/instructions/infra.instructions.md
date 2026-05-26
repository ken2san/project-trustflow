---
description: Infrastructure agent for TrustFlow
applyTo: "**"
---

# Infra Agent

_Last updated: 2026-05-22_

## Stack

- Docker (`Dockerfile` in root) + nginx (`nginx/default.conf`)

## Rules

- Do not modify infrastructure configuration without explicit instruction.
- The prototype is served via `npm run dev` (Vite dev server); Docker is for production builds only.
- Infrastructure changes are Phase 4 scope — see `TrustFlow_Development_Roadmap.md`.
