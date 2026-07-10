# Spec 039 — Plan & Verification

## Approach

This is a narrow architecture cleanup before product storage code lands:

1. Refresh GitHub and official Hetzner docs/status.
2. Rewrite ADR-001/ADR-003 as the storage source of truth.
3. Sweep active docs and env examples.
4. Mark historical DigitalOcean Spaces evidence as superseded.
5. Validate compose config and grep for stale active references.
6. Open a PR and request Codex review.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Active docs name Hetzner Object Storage for v0.1 storage | Local 2026-07-10: `rg -n "DigitalOcean Spaces|DO Spaces|SPACES_" AGENTS.md .specify/memory docs_capsule_zero/adr docs_capsule_zero/project docs_capsule_zero/launch api deploy docker-compose.yml app/src/lib/legal-content.ts`; remaining matches are dated status/history/supersession notes only |
| 2 | Env/runbook contract uses provider-neutral keys | Local 2026-07-10: `rg -n "OBJECT_STORAGE_|BACKUP_S3_|SPACES_" deploy docs_capsule_zero/project/backend docs_capsule_zero/project/devops .specify/specs/024-production-stack-runtime`; active env/runbook matches use `OBJECT_STORAGE_*` / `BACKUP_S3_*`, with `SPACES_*` only in dated process-memory/supersession text |
| 3 | Built-in CDN claim removed from active storage docs | Local 2026-07-10: `rg -n "built-in CDN|Spaces CDN|SPACES_CDN_BASE|digitaloceanspaces" AGENTS.md .specify/memory docs_capsule_zero/adr docs_capsule_zero/project docs_capsule_zero/launch deploy api app/src/lib/legal-content.ts`; active matches are negative "no built-in CDN" statements, remaining positive CDN mentions are dated historical rows |
| 4 | Compose env template still validates | Local 2026-07-10: `docker compose --env-file deploy/compose.env.example config --quiet` exits 0 |
| 5 | Server state checked without mutation | Local 2026-07-10: `ssh cz 'hostname; df -h /; docker ps ...; test -f /etc/docker/daemon.json ...'` showed `cz-hz`, 28G free on `/`, healthy containers, and no Docker daemon log-rotation config |

## Risks

- **Historical grep noise.** Specs 033/038 and convergence notes intentionally
  preserve prior DigitalOcean/Spaces evidence. Mitigation: add dated
  supersession notes and keep active docs clean.
- **Hetzner Object Storage region choice can change.** Mitigation: docs require
  re-checking Hetzner status and smoke-testing signed uploads before bucket
  creation; HEL is recommended only while the current advisory remains active.
- **No default at-rest encryption.** Mitigation: docs explicitly gate personal
  photo storage acceptance and require encrypted backups before real user data.
