# /api — Go modular monolith (scaffold)

Implementation in [`.specify/specs/024-production-stack-runtime/`](../.specify/specs/024-production-stack-runtime/).

Target structure (from `docs_capsule_zero/project/backend/backend-docs.md`):

```
cmd/api/                        ← main.go: wiring + HTTP server
internal/
  auth/                         ← Kratos session validation, user resolution
  profile/                      ← profiles, language, avatar metadata
  wardrobe/                     ← items, wardrobe_entries, favorites, statuses
  capsule/                      ← capsules, palette, members, outputs
  methodology/                  ← color compatibility, OPR, gap analysis (pure logic)
  upload/                       ← signed PUT URLs, upload_jobs, asset attach
  marketplace/                  ← link parser adapters, import jobs
  catalog/                      ← FTS-first catalog search; pgvector deferred by ADR-007
  billing/                      ← Lava.top stub, invoice + webhook handlers, coin ledger
  moderation/                   ← admin moderation queue
  storage/                      ← Spaces client wrapper (S3 SDK)
  email/                        ← Resend client wrapper
  eventbus/                     ← Redis-backed job enqueue / consume
  httpapi/                      ← chi router, OpenAPI-typed handlers, middleware
  obs/                          ← logger, tracer, syslog sink
migrations/                     ← versioned SQL files
Dockerfile                      ← multi-stage Go build → distroless runtime
```

Until spec 024 lands, this directory is a placeholder. `docker compose up` is not expected to succeed.
