# Backend Docs

## Current State

Backend architecture is still in Phase 4 design. Final stack ADRs are pending.

## Interim Decisions

- The repository already enforces a PR-first delivery workflow.
- CI/CD, AI review, and worker orchestration are part of the delivery architecture.
- Backend-facing docs and ADRs must be updated before implementation work introduces APIs, storage, auth, or background jobs.

## Operating Rules

- Document backend decisions under `docs_capsule_zero/adr/`.
- Keep API, storage, auth, and infra decisions explicit before shipping backend code.
- Any backend implementation PR must update durable backend docs together with code changes.
