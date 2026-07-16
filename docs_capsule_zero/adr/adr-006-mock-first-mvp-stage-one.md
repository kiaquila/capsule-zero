# ADR-006: Production-First Implementation Posture

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.

## Status

Accepted (rewritten 2026-06-27 — supersedes the previous "mock-first MVP Stage 1" decision).

## Context

The previous Phase 4 plan staged implementation behind mock provider adapters and fixtures, with real Supabase / Lava.top / Photoroom registration treated as integration gates. That posture made sense when the stack was Supabase-shaped and the team wanted to ship UI work before any external credentials were registered.

The production-stack pivot changes the calculus:

- the team owns the runtime end-to-end (docker-compose on a droplet), so there is no third-party registration overhead blocking work;
- Ory Kratos, Postgres, Redis, nginx, Hetzner Object Storage, and Resend all come up directly from the production runtime spec;
- the `/app` frontend stays (it is already built on a provider port/adapter abstraction); its Supabase provider is replaced by a real `api` provider that calls the Go API + Kratos, domain by domain, rather than being promoted from mock to real;
- coins, image enhancement, and the self-hosted image model are pushed to v0.2 backlog — there are no expensive vendor flows in v0.1 to defer.

Continuing to maintain a "mock-first" layer would now add structure for no benefit: the real services are cheaper to bring up than the fakes.

## Decision

Capsule Zero v0.1 implementation goes straight to real services from the first feature slice. There is no mock-first stage.

Concretely:

| Surface            | v0.1 posture                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Auth               | Ory Kratos email/password running in docker-compose from the production runtime spec. No mock auth.               |
| Database           | Real plain PostgreSQL with migrations applied at boot. No mock repositories.                                      |
| Storage            | Real Hetzner Object Storage buckets accessed via signed URLs. No mock storage.                                    |
| Email              | Real Resend account with SPF/DKIM published on `capsulezero.app`. MailHog only for local dev.                     |
| Marketplace import | Real best-effort parser inside the Go monolith. No mock parser.                                                   |
| Semantic search    | Real Postgres FTS first; pgvector/embeddings ship with the semantic-search slice per ADR-007.                     |
| Background removal | Deferred to v0.2 (Stage 2). v0.1 stores originals only.                                                           |
| Payments / coins   | Lava.top is **stubbed** in v0.1 — the API surface exists but no real money moves; full integration ships in v0.2. |
| Observability      | Real syslog + traces in docker-compose; Grafana is deferred by ADR-007.                                           |

External dependencies still sit behind Go interfaces (`internal/auth`, `internal/storage`, `internal/email`, `internal/billing`, …) so tests can substitute fakes per call site. Production code wires the real client; there is no "mode switch" that flips the whole app into fake-everything.

### Auth scope

v0.1 supports:

- email/password registration;
- email/password login;
- password recovery;
- session persistence;
- optional profile fields (`language`, `country`, `city`).

Stage 2 adds:

- Google OAuth;
- Apple Sign-In;
- web and mobile OAuth callback/deep-link verification.

v0.1 screens must not expose active Google or Apple buttons. The current standalone auth and landing auth popup HTML prototypes already hide those buttons; Stage 2 reintroduces them through an explicit social-auth prototype and implementation update.

### Credential policy

- Local development credentials live in `.env.local` files ignored by git.
- Production credentials live only in the protected plaintext
  `/opt/capsule-zero/.env` (`root:root`, mode `600`) and provider dashboards;
  host-level encryption has not been established.
- Production keys are never shared with agents or pasted into chat.
- Committed `.env.example` files contain placeholders only.

## Consequences

Positive:

- One implementation path. No fakes to keep honest against the real schema.
- The first storage feature PR exercises Kratos, Postgres, Hetzner Object Storage, nginx, and Resend end-to-end. Integration risk surfaces immediately, not at a deferred "gate".
- Test surface stays focused: contract tests against the real OpenAPI, integration tests against the real services running in docker-compose, no parallel fake suite.
- The "what's stubbed" list is small and explicit (Lava.top, image processing) instead of an open-ended fake matrix.

Tradeoffs:

- The production runtime spec (`.specify/specs/024-production-stack-runtime/`) is now a hard prerequisite for feature work — there is no fallback to "just mock it".
- A developer cannot work fully offline without the docker-compose stack running locally.
- The droplet must come up cleanly before the first feature slice merges; that responsibility moves earlier in the timeline.

## Related Decisions

- The Stage 2 list still acts as an explicit gate for the **product** features it covers (Google/Apple OAuth, Lava.top live payments, self-hosted image model). Those gates are no longer "promote mocks to real" — they are "this product feature is not in v0.1".

## References

- Phase 4 production-stack ADRs: `docs_capsule_zero/adr/adr-001-stack.md`, `adr-002-auth.md`, `adr-003-storage.md`
- Phase 5 entrance checklist: `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md`
- Production runtime spec: `.specify/specs/024-production-stack-runtime/`
