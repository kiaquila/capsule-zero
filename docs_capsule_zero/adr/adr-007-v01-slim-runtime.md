# ADR-007: v0.1 Slim Runtime — Defer Non-Critical Services

## Status

Accepted (2026-06-29).

## Context

[ADR-001](adr-001-stack.md) accepted the full production stack as the long-term target: Traefik, Kratos, Postgres + pgvector, PgBouncer, Redis, Go API, Go worker, Next.js web, imgproxy, Grafana, MailHog (dev-only). That set is the right shape for steady-state operation, but the v0.1 launch sits on a single DigitalOcean droplet (4 GB RAM / 2 vCPU / 80 GB disk) and ships before there is any real load to defend against.

Three services in the full stack are not load-bearing for v0.1 traffic and add operational surface, RAM, and image-pull weight without paying for themselves yet:

- **PgBouncer** — Go's `pgx` driver pools connections natively. At the expected v0.1 RPS the API's in-process pool comfortably handles concurrency. PgBouncer adds a network hop and another container to operate.
- **Grafana** — there are no dashboards configured against real production traffic yet. `journalctl` and syslog files cover the early observability needs. Grafana idles around 100 MB RAM and 300 MB image — not free on a 4 GB droplet.
- **Standalone `worker` container** — the only Stage 1 background work is webhook fanout and (eventually) embedding refresh. The self-hosted Capsule Zero image model that justifies an independently-scaled worker is deferred per [ADR-003](adr-003-storage.md). Running the worker loop as goroutines inside the `api` process removes one container without changing the job-queue contract.

## Decision

For v0.1, the docker-compose runtime ships **without** PgBouncer, Grafana, and a standalone worker container. The job-queue consumer runs as goroutines inside the `api` process, behind the same Redis-queue contract described in [backend-docs](../project/backend/backend-docs.md).

This is a v0.1 bootstrap decision, not a long-term stack change. Each deferred service has an explicit "promote when" trigger.

### Deferred services and promotion triggers

| Service           | v0.1 stance                                                     | Promote back when                                                                                                  |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pgbouncer`       | Not deployed. API pools via `pgx`.                              | Postgres `pg_stat_activity` shows sustained connection pressure, or API horizontal scaling crosses 2+ replicas.    |
| `grafana`         | Not deployed. Logs go to syslog file + `journalctl`.            | First live incident that requires correlated dashboards, or before commercial launch (Phase 7).                    |
| Standalone `worker` | Job-queue consumer runs as goroutines in `api`.                | Self-hosted image model lands (separate scaling profile), or job latency starts blocking request handlers.         |

### Services that stay in v0.1

`traefik`, `kratos`, `postgres` (with `pgvector`), `redis`, `api`, `web`, `imgproxy` (for derived image sizes). `mailhog` stays as a dev-only override.

## Consequences

Positive:

- Three fewer containers to operate, debug, and pull on deploy. Compose file shorter, dependency graph simpler.
- Roughly 400–500 MB less RAM at idle on the droplet, leaving more headroom for Postgres and Next.js SSR.
- One less network hop in the DB path (no PgBouncer between `api` and `postgres`).
- Job-queue producer/consumer share the same process, so failures surface in one log stream instead of two.

Negative:

- No connection pool decoupling. If API is forcibly killed mid-request, Postgres connections are reclaimed by Postgres itself, not by PgBouncer. Tolerable at v0.1 scale.
- No dashboards. Operational visibility is `journalctl` and log files until Grafana comes back. The team must read logs for incident triage.
- Worker workload competes for the same Go runtime as request handlers. Long-running jobs (e.g. image processing) must not be added to the in-process worker — the standalone `worker` must come back first.

Reverse path is mechanical for all three: add the `services:` block back, re-point env vars, redeploy. No data migration, no contract change.

## Scope

This ADR amends [ADR-001](adr-001-stack.md)'s service list for v0.1 only. The full production stack remains the long-term target.

The matching change to `docker-compose.yml`, the services table in [backend-docs](../project/backend/backend-docs.md), and the `.specify/specs/024-production-stack-runtime/` deliverables lands in the implementation PR that ships spec 024 — this ADR records the decision ahead of that work.

## Out of scope

- `imgproxy` stays in v0.1 — it serves derived image sizes for the wardrobe grid and is on the user-visible path.
- The Supabase code under `/app` and the legacy `docker-compose.legacy-supabase.yml` are not touched here; their removal is owned by the post-spec-024 follow-up PR per [ADR-006](adr-006-mock-first-mvp-stage-one.md).
- Self-hosted Capsule Zero image model and its dedicated worker remain Stage 2 per [ADR-003](adr-003-storage.md).

## References

- [ADR-001 Stack Overview](adr-001-stack.md)
- [ADR-003 Storage](adr-003-storage.md)
- [ADR-006 Production-First Implementation Posture](adr-006-mock-first-mvp-stage-one.md)
- [backend-docs Production Runtime](../project/backend/backend-docs.md)
- [Spec 024 Production Stack Runtime](../../.specify/specs/024-production-stack-runtime/spec.md)
