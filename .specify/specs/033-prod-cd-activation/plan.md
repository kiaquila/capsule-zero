# Plan 033 — Production CD Activation

## Approach

Same delivery model as spec 026's dev pipeline, retargeted at production and widened to
the full stack: **build-in-CI, pull-on-server**. GitHub Actions builds the web and api
images and pushes them to GHCR; the server only pulls SHA-pinned images and rolls the
`capsule-zero` compose project. The server never builds (RAM/CPU contention with running
services + CI provenance).

The pipeline reuses the proven spec-026 security posture unchanged: the CI SSH identity is
an unprivileged `deploy` user whose sudo grant covers exactly one root-owned wrapper; the
wrapper validates every argument against immutable-ref patterns before touching state; the
checkout and env file are root-owned so a leaked CI key cannot alter what the wrapper
executes; host-nginx syncs are marker-based with automatic backup/rollback.

Deliberate differences from the dev pipeline:

1. **Two images.** `cd-prod.yml` builds and pushes `capsule-zero-web` and
   `capsule-zero-api`; the wrapper takes both refs and exports
   `CAPSULE_WEB_IMAGE`/`CAPSULE_API_IMAGE` over the compose defaults.
2. **Full-stack up.** `up -d --no-build --remove-orphans` brings up
   `postgres → kratos-migrate → kratos → api → web` per the compose dependency graph;
   health waits are generous (first boot runs Postgres init + Kratos migrations).
3. **Provider-backed smoke.** `/api/health` through the TLS edge is part of every deploy's
   success criteria (it proves nginx → Go API → Postgres/Kratos), alongside `/en` on
   loopback and through the edge.
4. **No dev vhost anywhere.** The edge serves `capsulezero.app` only.

### Edge topology

```
Internet → host nginx :80/:443 (TLS: capsulezero.app; Hetzner CX23, Ubuntu 26.04)
   ├─ /                            → http://127.0.0.1:3000  (web)
   ├─ /api/*                       → http://127.0.0.1:8080  (api; auth writes limit_req 10r/m)
   └─ /self-service/*, /sessions/* → 404
compose `capsule-zero`: web → api:8080 → kratos:4433/4434 + postgres:5432 (internal only)
```

### Capacity budget (CX23: 2 vCPU / 4 GB / 40 GB)

Steady-state RSS ≈ 0.9–1.3 GB (postgres + kratos + api + web + host nginx) against
3.7 GiB + 2 G swap; disk ≈ 8–10 GB used (OS + images + volumes) against 38 GB. Image
history on GHCR, not on the server; `docker system prune` headroom is ample.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Server meets the capacity gate (≥ 2 vCPU / 4 GB) | `free -h; nproc; df -h /` output recorded in the PR |
| 2 | Compose renders with the prod env contract, no secrets committed | `docker compose --env-file deploy/compose.env.example config` exits 0 |
| 3 | CD builds and pushes both images on merge | link to the green **CD Prod** run |
| 4 | Full stack healthy on the server | `docker compose -p capsule-zero ps` — postgres/kratos/api/web healthy, kratos-migrate exited 0 |
| 5 | Web + API live through the TLS edge | `curl https://capsulezero.app/en` → 200; `curl https://capsulezero.app/api/health` → 200 |
| 6 | Registration works end-to-end on prod | curl session: `POST /api/auth/registration` → 200 + session token |
| 7 | Login + whoami + logout work on prod | curl session: `POST /api/auth/login` → 200; `GET /api/auth/whoami` → identity; `POST /api/auth/logout` → 200 |
| 8 | Kratos public bypass closed at the edge (negative) | `curl -i https://capsulezero.app/self-service/login/api` → 404 |
| 9 | Auth writes throttled at the edge (negative) | 11 rapid `POST /api/auth/login` → at least one 429 |
| 10 | Docs-only merge skips deploy (negative) | a docs-only merge's CD run shows gate `run=false` |
| 11 | Wrapper rejects non-allowlisted refs (negative) | manual wrapper invocation with a bad ref exits non-zero |
| 12 | Rollback path works | `workflow_dispatch` with a prior `image_sha` redeploys that tag (exercised when first needed) |
| 13 | Docs actualized in the same change | AGENTS.md / CLAUDE.md / constitution / runbook diffs in this PR |
