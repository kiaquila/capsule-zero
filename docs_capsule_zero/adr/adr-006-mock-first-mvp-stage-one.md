# ADR-006: Mock-First MVP Stage 1

## Status

Accepted.

## Context

The accepted Phase 4 stack remains Supabase, Next.js/Vercel, Flutter,
Lava.top web purchases, and Photoroom behind an adapter. However, registering
and wiring every external provider before product implementation would slow the
team before the product shell, domain flows, and UI contracts need real
provider behavior.

The founder approved a staged implementation posture:

- build the application now with mocked provider adapters and fixtures;
- register test/staging services only when a feature needs real persistence,
  OAuth, payment, image processing, or launch evidence;
- keep production credentials out of local development and away from agents;
- move Google OAuth and Apple Sign-In out of MVP Stage 1 and into MVP Stage 2.

## Decision

Capsule Zero MVP Stage 1 is mock-first for external services.

Stage 1 product work may begin without registering real Supabase, Google,
Apple, Lava.top, Photoroom, remove.bg, or production Vercel credentials, as
long as the implementation preserves the accepted provider boundaries:

| Surface                 | Stage 1 posture                                                                                      | Integration gate                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Auth                    | Email/password only. Local development may use a mock auth adapter until Supabase staging is needed. | Supabase email auth before multi-session persistence testing; Google OAuth and Apple Sign-In in MVP Stage 2. |
| Database                | Use migration-backed schema, fixtures, and local/mock repositories for feature development.          | Supabase local/staging before cross-user RLS, persistence, or shared QA evidence.                            |
| Storage                 | Use local/mock storage adapters for UI and upload flow development.                                  | Supabase Storage before private asset, signed URL, and catalog-public validation.                            |
| Marketplace import      | Mock parser responses from representative URLs and failure fixtures.                                 | Real parser/provider calls before broad import QA.                                                           |
| Semantic catalog search | Use seeded fixtures and deterministic search stubs.                                                  | Supabase Postgres FTS/pgvector before real catalog search QA.                                                |
| Background removal      | Mock processed-image responses and failure/timeout states.                                           | Photoroom latency and quality spike before enabling paid/real image processing.                              |
| Payments                | Mock coin packs, invoice creation, webhook replay, and ledger effects.                               | Lava.top products, API key, and webhook verification before paid coin purchase QA.                           |
| Production runtime      | No production secrets in local files or agent sessions.                                              | Production credentials are installed only in the deployment provider by the owner/operator.                  |

Mocks must sit behind the same domain/provider interfaces as the real
integrations. UI code should not branch directly on fake one-off data shapes.

## Auth Scope Change

MVP Stage 1 supports:

- email/password registration;
- email/password login;
- password recovery;
- session persistence;
- optional profile fields.

MVP Stage 2 adds:

- Google OAuth;
- Apple Sign-In;
- web and mobile OAuth callback/deep-link verification.

Stage 1 screens should not expose active Google or Apple buttons. If an older
HTML prototype shows social buttons, treat them as a Stage 2 variant and follow
the updated feature/spec docs for Stage 1 implementation.

## Credential Policy

- Test/staging credentials may be stored locally in ignored `.env.local` files
  and may be shared with agents when the owner explicitly permits that work.
- Production credentials must be stored only in the production deployment
  provider or relevant production dashboard.
- Production service-role, secret, payment, OAuth, and image API credentials
  must not be given to agents.
- Committed `.env.example` files may contain placeholders only.

## Consequences

Positive:

- Product screens, domain state, i18n, design parity, and route contracts can
  move forward immediately.
- Provider setup becomes just-in-time and evidence-driven instead of a broad
  up-front registration task.
- The app can be tested against deterministic success, failure, empty, timeout,
  and insufficient-balance scenarios before real services exist.
- Production access remains tightly controlled.

Tradeoffs:

- Mock adapters must be kept honest against the OpenAPI, Supabase migration,
  and provider boundary contracts.
- Before launch, every mocked provider-dependent flow needs an explicit
  integration gate with real credentials and evidence.
- Social auth is no longer part of MVP Stage 1 scope, so any UI copy or
  prototype reference to Google/Apple auth must be treated as Stage 2.

## References

- ADR-001: `docs_capsule_zero/adr/adr-001-stack.md`
- ADR-002: `docs_capsule_zero/adr/adr-002-auth.md`
- Phase 5 checklist:
  `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md`
- Runtime provisioning:
  `docs_capsule_zero/project/devops/sprint-0-runtime-provisioning.md`
