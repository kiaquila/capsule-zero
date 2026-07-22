# AGENTS.md — Capsule Zero Onboarding

> Universal onboarding document for any AI agent (Claude Code, Codex, Gemini CLI, Cursor, etc.)

## What Is Capsule Zero?

**Capsule Zero** is a premium fashion-tech platform — "the Aesop of wardrobe apps". It helps affluent users (25–40 yo) build maximally productive capsule wardrobes using a proprietary color and wardrobe methodology. Core metric: **Outfit Productivity Ratio** (wearable outfits ÷ (core + accessory items); structural layers are measured separately by Layering Coverage). Canonical counting model: `docs_capsule_zero/project/methodology/outfit-generation.md` §3.

**Tech stack:** Next.js 14+ App Router web frontend (`/app`), React Native mobile app (iOS + Android), Go modular monolith backend, nginx 1.27 reverse proxy / API gateway, Ory Kratos auth, PostgreSQL 16 (plain `postgres:16` in v0.1 — pgvector deferred to the semantic-search slice, see ADR-007), Redis, Hetzner Object Storage, Cloudflare front-door/CDN (deferred to Stage 2), all wired through docker-compose on a Hetzner Cloud server (migrated from DigitalOcean on 2026-07-02).
**Languages:** EN (primary) and RU are active in v0.1 — i18n from Day 1. ES-AR is retained as reference copy and deferred to v0.2.
**Target:** Buenos Aires-based startup, global premium segment.

## Always Work From Fresh Git State

Before research, doc edits, code changes, or even quick lookups, run:

```bash
git fetch --all --prune
```

Then start from `origin/main` (or the named PR head). Local working state is untrusted until reconciled with `origin`. If the working tree has uncommitted changes that block a checkout, stash them with `git stash push -u -m "..."` — do not lose work, but do not let stale state contaminate analysis either.

## Current Phase & Status

| Phase                         | Status                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Founder Vision             | COMPLETE — `.specify/memory/constitution.md`                                                                                                                                       |
| 1. Market Research            | COMPLETE — `docs_capsule_zero/marketing/go-to-market.md`                                                                                                                           |
| 2. Product Definition         | COMPLETE — `.specify/specs/001-capsule-zero-mvp/spec.md`, `docs_capsule_zero/project/methodology/`, `docs_capsule_zero/ux/emotion-map.md`, `docs_capsule_zero/ux/ux-validation.md` |
| 3. UX/UI Design               | COMPLETE — all 16 v0.1 logical screens designed and implemented in the `/app` frontend                                                                                             |
| **4. Technical Architecture** | **PIVOTED TO PRODUCTION STACK** — Go modular monolith + nginx + Ory Kratos + Postgres + Redis + Hetzner Object Storage + Cloudflare Stage 2 + Resend; React Native replaces Flutter                     |
| 5. Development Sprint         | IN PROGRESS — **product work now follows [`PRODUCT-PLAN.md`](PRODUCT-PLAN.md) until MVP is done**; runtime Phases 1–2 landed (nginx + web; Postgres + Kratos + Go API + `api` provider, PR #57); storage slice `.specify/specs/040-object-storage-upload-foundation/`; every merge to `main` deploys to `https://capsulezero.app` via prod CD (spec 033) |
| 6. QA & Soft Launch           | Upcoming                                                                                                                                                                           |
| 7. Commercial Launch          | Upcoming                                                                                                                                                                           |

**Product rebuild decision, 2026-07-16 ([`PRODUCT-PLAN.md`](PRODUCT-PLAN.md)):** product work is simplified around the outfit-combination algorithm (OPR) and re-sequenced into four stages: (1) selling landing + free pre-signup loop, (2) algorithm incl. garment cut/basicity, (3) simplification of the post-registration product, (4) unit economics and monetization. **Until MVP is done, `PRODUCT-PLAN.md` is canonical for product decisions** — where it and any other doc disagree on a product decision, the plan wins and the drift is fixed in the same change. Three consequences bind immediately: **first value is delivered before registration** (Duolingo pattern — guest onboarding, then a save-your-progress gate); **coins are cancelled as the monetization hypothesis** — do not design features, specs, schemas, API, codegen, env, provisioning, or UI around coins until Stage 4 decides the model; the active coin/Lava OpenAPI, generated-client, env, and provisioning surface was removed in Stage 0, while retained provider/runtime references are explicitly superseded legacy for Stage-4 deletion or replacement; **the algorithm must account for garment cut, not only colour** — the `basicity` score already defined in `capsule-methodology.md` §6 is currently unimplemented and must become a real algorithm input in Stage 2. The plan does not change the engineering contract (spec-kit, SENAR, TDD, PR gates), the stack, or AGENTS §8. Founder decisions Q1/Q2/Q3/Q6 that gated Stage 1 are closed (2026-07-21); only Q5 remains open and gates Stage 2.

**Locale scope decision, 2026-06-07:** Spanish / ES-AR is removed from active v0.1 scope and moved globally to v0.2. Keep Spanish source copy as future reference only; do not expose ES-AR in active routing, language switchers, profile language persistence, OpenAPI enums, generated clients, or launch acceptance criteria until v0.2 locale scope is reopened.

**Production-stack pivot decision, 2026-06-27:** Phase 4 architecture was rewritten from a Supabase BaaS posture to a production-grade self-hosted stack. The mock-first Stage 1 posture (previously ADR-006) is dropped entirely — implementation goes straight to real services behind production-shape contracts.

**Frontend / provider decision, 2026-06-30 (spec 024 follow-up — PR #57):** `/app` **stays** as the canonical, provider-abstracted Next.js frontend — there is no `/app` → `/web` rename, and `/app` is **not** slated for deletion. Current `/app` modes are `api` (production Go/Kratos backend), `mock` (local/CI fixtures), and the frozen `supabase` legacy mode. Supabase auth/profile ports are retired; the remaining legacy domains are removed **domain by domain** as the Go API absorbs each bounded context. Postgres ships as plain `postgres:16`; pgvector is deferred (ADR-007).

**Storage provider decision, 2026-07-10 (spec 039):** DigitalOcean Spaces is superseded by **Hetzner Object Storage**. v0.1 storage uses S3-compatible Hetzner buckets, not the server root disk, a one-node MinIO, or a Cloud Volume. There is no built-in object-storage CDN in v0.1; public catalog assets use native object URLs until the Stage-2 CDN/front-door work. Hetzner Object Storage has no default data-at-rest encryption, so encrypted database backups are mandatory and personal-photo storage needs the explicit ADR-003 security posture.

**Storage implementation decision, 2026-07-10 (spec 040; key hardening 2026-07-11):** direct presigned PUT/GET for private personal-photo originals is founder-accepted with the ADR-003 controls. Asset buckets are provisioned in HEL under Hetzner project `15203114`; the Object-Locked backup bucket is isolated in FSN under project `15296835`. Runtime and backup-writer credentials now live in bucketless key-only projects `15302873` and `15302925`. The runtime policy grants private-bucket listing and put/get/delete only for `item-originals/*` plus `smoke/spec-040/*`, while public catalog keeps anonymous reads and denies that runtime principal `s3:*`. The backup policy is a hybrid boundary: normal puts under `postgres/*` work; live probes deny object/version reads, ACL/retention/legal-hold get/put, deletes, governance bypass, bucket/version/multipart listing, and policy/CORS/lock-config reads, while header conditions reject dangerous canned ACLs and AllUsers grant-read. Hetzner/RGW nevertheless accepts a `PutObject` carrying Object Lock mode, retain-until, or legal-hold headers despite the related action denies. This does not permit reading or deleting existing data, but it leaves a bounded write-time storage-DoS/cost-amplification residual. Backup automation therefore remains gated on sanitizing/forbidding those headers plus explicit risk acceptance or a provider fix, in addition to encryption, scheduling, retention, and restore verification. Policy/CORS readback, the caveated live audits, protected env rotation, old runtime/backup keys plus both temporary policy-operator deletions, exact-origin/attacker-origin CORS probes, and the post-revocation signed 10 MiB PUT/HEAD/GET/checksum/delete smoke passed with `OBJECT_STORAGE_UPLOADS_ENABLED=false`. Upload routes remain disabled until owner quota, orphan cleanup, and wardrobe attachment land. Credential and presigned-URL values must never enter repo/chat/evidence.

## Where to Find Specifications

```
.specify/
  memory/
    constitution.md      ← Project principles, methodology, design rules (READ FIRST)
    design-system.md     ← Glass tokens, colors, typography, components
    market-context.md    ← Competitors, persona, market size, pricing
  specs/
    001-capsule-zero-mvp/
      spec.md            ← Full v0.1 spec: 25 user stories, flows, requirements
      prototype-map.md   ← Maps v0.1 screens → spec sections (cross-cutting + backend-only stories)
    024-production-stack-runtime/
      spec.md            ← Production runtime delivery spec (next implementation iteration)
      plan.md            ← Verification table for the runtime delivery
      tasks.md           ← Process Memory
    040-object-storage-upload-foundation/
      spec.md            ← Go S3 adapter + authenticated original-photo upload foundation
      plan.md            ← TDD, contract, provisioning, and signed-smoke verification
      tasks.md           ← Process Memory
```

> The folder name `001-capsule-zero-mvp` is historical and remains for git stability; the content is the v0.1 product spec. Do not rename grandfathered spec folders.

## Key Principles to ALWAYS Respect

### 1. Glassmorphism UI Language (NON-NEGOTIABLE)

The interface uses frosted glass surfaces. Two variants: main panels (blur 40px) and nav/bottom sheets (blur 44px).

- **Never** use opaque solid backgrounds for containers. **Always** use glass.
- → Exact token values: `docs_capsule_zero/project/frontend/styling.md`

### 2. Achromatic Interface

- UI colors: black / white / grey, plus ONE signal accent — the gold family `#EFBF04→#FFDD00`, reserved for the primary CTA and logo accent only (Q4 closed 2026-07-16, spec 043; constitution §III v1.5)
- All other color enters ONLY through user's garment photos and color dots
- Error color: `#FF5449` (signal red; text on scrim chips `#FF7A70`) — the former yellow `#FFD600` is retired so errors can never collide with the gold CTA

### 3. Capsule Methodology (Color Rules)

- Palette is immutable once created
- Colors must be compatible either by temperature or by saturation
- Achromats always compatible
- Incompatible items blocked with explanation

### 4. "Direct, Not Dictate"

- System suggests, explains, offers alternatives
- Never force user decisions
- Blocks come with explanations and alternative paths

### 5. Premium Quality Bar

- "Screenshot test": every screen must be worth screenshotting
- Interface must stand next to Aesop / ZARA / COS
- Screens match designs to 2px precision
- Lighthouse: Performance 90+, Accessibility 95+

### 6. Three Upload Methods

Photo upload, marketplace link import, semantic search from shared DB. All three are critical — they solve the #1 competitor pain point (upload friction).

### 7. Engineering Reuse Rule (DRY/SOLID) & Module-Size Discipline

If a product or technical object type already exists in code, reuse its component, service, adapter, schema, helper, and CSS/API contract before adding a new variant. This applies across frontend, backend, API, data, and mobile layers.

- UI examples: item cards, item detail panels, bottom navigation, glass buttons, filters, color dots, and repeated wardrobe actions.
- Backend/API examples: provider adapters, route handlers, validation schemas, DTOs, repository helpers, domain services, and fixture builders.
- Shared structure belongs in a shared abstraction; feature-specific screens or endpoints should pass only section-specific labels, metadata, behavior, and policy.
- Code review must reject copy-pasted markup, logic, schemas, or one-off classes/modules when an established object type can cover the same responsibility.

**Mandatory reuse-check (before writing new code).** Before creating a new module, function, component, service, adapter, schema, or helper, first search for an existing one that already covers the responsibility and try to extend it. If you still add a new unit, the PR description must state, in one line, which existing unit you checked and why it did not fit. "I didn't find one" is not evidence — name the search. Reviewers reject new units that duplicate an existing responsibility without this note.

**Module-size discipline (soft gate — a signal to split, not a hard CI failure).** The real criterion is single responsibility; the line counts below are the review trigger. Exceeding them is allowed only with a one-line justification in the PR.

| Layer                          | Function / component | File / module | Cyclomatic complexity |
| ------------------------------ | -------------------- | ------------- | --------------------- |
| Go (`/api`, `/worker`)         | ≤ ~60 lines          | ≤ ~500 lines  | ≤ 15                  |
| TS / React (`/app`, `/mobile`) | ≤ ~60 lines          | ≤ ~300 lines  | ≤ 15                  |

Thresholds are wired as **warnings** (never CI failures): ESLint `max-lines` / `max-lines-per-function` / `complexity` in `app/eslint.config.mjs`, and opt-in `funlen` / `gocyclo` in `api/.golangci.yml` (schema-validated with `golangci-lint config verify`; full run waits until `/api` has a Go module). The Go file-size row (≤ ~500 lines) has no linter wired — `funlen` is function-level — so it stays review-only until a file-length linter is added. Generated clients (`**/generated/**`) and tests are exempt.

### 8. No Supabase / Legacy-Backend Recoupling (NON-NEGOTIABLE)

Supabase is **retired** (production-stack pivot, 2026-06-27). The legacy Supabase provider is frozen and being deleted domain by domain — **do not extend it, and do not re-introduce it into anything new.**

- No new spec, `docker-compose*.yml`, GitHub workflow, deploy/provisioning script, infra/nginx config, or doc may add or re-introduce Supabase coupling: no `SUPABASE_*` env, no Supabase client imports.
- The **dev edge** (`dev.capsulezero.app`, spec 026) was **decommissioned on 2026-07-02** with the Hetzner migration — DNS record deleted, `docker-compose.dev-server.yml` and the dev vhost removed. There is no separate dev environment: every merge to `main` deploys the full production stack to `https://capsulezero.app` via `.github/workflows/cd-prod.yml` (runbook: `docs_capsule_zero/project/devops/prod-cd-pipeline.md`). The no-Supabase rule applies to the prod pipeline unchanged.
- Exception, by design: the **production stack** (`docker-compose.yml`) is where the Go / Postgres / Kratos backend lands and wires **its own** env behind production-shape contracts (`CAPSULE_PROVIDER_MODE=api`, `/api/*` routing). That is the sanctioned arrival this rule anticipates — it is not a Supabase recoupling.
- **Reviewers must reject** any diff that recouples deployment, CI/CD, or runtime to the retired **Supabase** backend. Regression that motivated this rule: PR #53 (spec 026) grafted a full `SUPABASE_*` env contract + `/api/health` healthcheck into the brand-new `docker-compose.dev-server.yml` instead of mirroring the web-only `docker-compose.yml`, silently breaking dev CD.

### 9. Docs Are the Single Source of Truth

When you change an architecture or implementation decision, actualize **all** affected docs in the **same** change — ADRs, `.specify/specs/**`, `docs_capsule_zero/**`, AGENTS.md, CLAUDE.md, constitution. No doc drift. (Cautionary example: Traefik → nginx.)

## Source Documentation

| Document                                                               | Content                                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **`PRODUCT-PLAN.md`**                                                  | **Canonical product plan until MVP** — accepted decisions, open founder questions, four delivery stages, doc-debt table |
| `PRODUCT-RESEARCH.md`                                                  | Evidence base behind the plan — competitor/landing reference gallery, PLG conversion data, algorithm grounding |
| `.specify/specs/001-capsule-zero-mvp/spec.md`                          | 25 user stories (24 MUST + 1 NICE), user flow, screen inventory                                                |
| `docs_capsule_zero/project/methodology/capsule-methodology.md`         | Capsule methodology, compatibility rules, palette logic, limits                                                |
| `docs_capsule_zero/project/methodology/colors.md`                      | 51-color system, HEX values, compatibility matrix                                                              |
| `docs_capsule_zero/project/methodology/categories.md`                  | Garment categories and classification                                                                          |
| `docs_capsule_zero/project/methodology/outfit-generation.md`           | 7-layer outfit structure, OPR formula, combination algorithm                                                   |
| `docs_capsule_zero/project/methodology/gap-analysis.md`                | Gap detection rules, shopping list format, validation constraints                                              |
| `docs_capsule_zero/project/frontend/styling.md`                        | Glass tokens, colors, typography, component patterns (source of truth for visual tokens and component styling) |
| `docs_capsule_zero/project/frontend/frontend-docs.md`                  | Web frontend architecture, libraries, state management, env vars                                               |
| `docs_capsule_zero/project/frontend/components.md`                     | Component conventions, glass patterns, mobile-first rules                                                      |
| `docs_capsule_zero/project/backend/backend-docs.md`                    | Go monolith stack, API structure, DB schema, env vars                                                          |
| `docs_capsule_zero/project/mobile/mobile-docs.md`                      | React Native app architecture, mobile auth/deep links, mobile payment constraints                              |
| `docs_capsule_zero/project/architecture/phase-4-council.md`            | Architecture council decision register (production-stack pivot)                                                |
| `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` | Production runtime entrance gate                                                                               |
| `docs_capsule_zero/adr/`                                               | ADRs for stack, auth, storage, and API contract                                                                |
| `docs_capsule_zero/glossary.md`                                        | Domain terminology with active RU equivalents                                                                  |
| `docs_capsule_zero/i18n/ui-texts.md`                                   | i18n content (EN and RU active in v0.1; ES-AR retained as reference) — all 16 screens                          |
| `docs_capsule_zero/ux/emotion-map.md`                                  | Emotional targets per screen, UX principles                                                                    |
| `docs_capsule_zero/ux/ux-validation.md`                                | Competitor analysis, UX benchmarks, 6 critical insights                                                        |
| `docs_capsule_zero/features/f-XXX-name.md`                             | Per-feature requirements, acceptance criteria, edge cases (15 files)                                           |
| `docs_capsule_zero/screens/screen-name.md`                             | Per-screen layout, component details, states (11 files)                                                        |
| `docs_capsule_zero/marketing/go-to-market.md`                          | TAM/SAM/SOM, competitor matrix, persona, pricing                                                               |
| `docs_capsule_zero/launch/launch-plan.md`                              | Full launch plan, phases 0-7, quality gates                                                                    |
| `.specify/specs/001-capsule-zero-mvp/prototype-map.md`                 | Prototype-to-story map, cross-cutting stories, backend-only stories                                            |

### Reading Route — Implementing a Feature

When assigned to implement a specific feature, read in this order:

1. The implemented screen in the `/app` frontend — the current reference for approved behavior, layout, and scope
2. `docs_capsule_zero/features/f-XXX-name.md` — requirements, acceptance criteria, edge cases
3. `docs_capsule_zero/screens/screen-name.md` — layout, component details, states
4. `.specify/specs/001-capsule-zero-mvp/spec.md` — user stories and acceptance criteria
5. `.specify/specs/001-capsule-zero-mvp/prototype-map.md` — cross-cutting stories and backend-only stories

**Feature → Screen mapping:**
| Feature | Screen file |
|---|---|
| f-001-landing | screen-landing |
| f-002-auth | screen-auth |
| f-003-dashboard | screen-dashboard |
| f-004-profile | screen-profile |
| f-005-my-items | screen-my-items |
| f-006-guided-journey | screen-guided-journey |
| f-007-marketplace-import | screen-guided-journey (tab) |
| f-008-semantic-search | screen-guided-journey (tab) |
| f-009-capsule-result | screen-capsule-result |
| f-010-capsule-management | screen-capsule-result |
| f-011-photo-upload | screen-guided-journey, my-items |
| f-012-i18n | all screens |
| f-013-favorites | screen-favorites |
| f-014-wardrobe-management | screen-my-items, uncapsulated, for-sale, for-repair |
| f-015-opr | screen-dashboard, capsule-result |

## Repository Layout

```
/app/             ← Next.js App Router web frontend — canonical, provider-abstracted (`api` prod; `mock` local/CI; frozen `supabase` legacy domains)
/api/             ← Go modular monolith (bounded contexts: auth, wardrobe, capsule, search, billing)
/worker/          ← Go background worker (Redis-queue consumer for image jobs, embeddings, webhooks)
/mobile/          ← React Native iOS + Android app
/infra/           ← nginx conf.d + Kratos config + Postgres init + service configs
/deploy/          ← compose env templates + deploy artifacts
/scripts/         ← repo tooling (API-client codegen, contract/feature-memory checks)
/docs_capsule_zero/ ← Product, methodology, devops, architecture docs
/.specify/        ← spec-kit feature memory
```

`/app` is the single web frontend — there is no separate `/web`, and no `/app` → `/web` rename is planned. The Supabase provider under `app/src/lib/providers/supabase/` is frozen and will be retired **domain by domain** as the Go API absorbs each bounded context (see the Frontend / provider decision above). Root `docker-compose.yml` currently wires the Phase 1 nginx/web stack.

## Delivery Workflow

- Product code lands through pull requests only.
- Required GitHub checks are `baseline-checks`, `guard`, `AI Review`, `test`, and `osv-scan`.
- `AI Review` runs on GitHub-hosted `ubuntu-latest` and validates native Codex review for the current PR head; it must never depend on a local or self-hosted runner.
- Durable workflow docs live under `docs_capsule_zero/project/devops/`.
- CI and branch-protection requirements are documented in `docs_capsule_zero/project/devops/github-ci-and-branch-protection.md`.
- A human remains the final review and merge authority.

## Tests

User-flow suites live under `tests/`; Go package tests are co-located under
`api/**`:

- `tests/e2e/` — Playwright web e2e (TypeScript). Targets the `/app` frontend. Gated by the required GitHub check **`test`** (`.github/workflows/test.yml`).
- `api/**/*_test.go` — Go API unit/package tests; run `cd api && go vet ./... && go test ./...`.
- `tests/unit/` — reserved for a future genuine cross-package Go integration suite; do not duplicate package tests here.
- `tests/mobile/` — Detox e2e for the React Native app. Stub today; populated once `/mobile/` ships its first build.

When adding or changing a test, read [`tests/README.md`](tests/README.md) — it owns the TDD loop, POM/selector rules, and run commands. **TDD is mandatory for every spec ≥ 025, but only for application code** (web UI, React Native, Go API behaviors): write the failing test first, commit it, then make it pass. Infrastructure and delivery wiring (CI/CD workflows, Dockerfiles, `docker-compose`, nginx config, deploy scripts), docs, and other support changes are out of scope for the failing-test-first loop — verify them with config validation and smoke/health checks recorded in the `## Verification` table instead.

## SENAR Completion Contract

Capsule Zero adds a lightweight supervised-verification layer (SENAR) on top of the spec-first PR workflow. Full mapping: `docs_capsule_zero/project/devops/senar-mapping.md`.

A task is **not complete** until the current PR head SHA has:

- Feature memory that names goal and scope (`## Goal`, `## Scope` in `spec.md`).
- Evidence for every acceptance criterion in the `## Verification` table of `plan.md` (command, test, screenshot, diff, or linked check — **not** an AI-written summary).
- At least one negative scenario covered, or an explicit one-line waiver in `spec.md`.
- `## Process Memory` (Dead Ends / Decisions / Known Issues) updated in `tasks.md` _before_ declaring the work complete.
- The SENAR Done Gate checklist filled in the PR description.
- The standard merge-ready conditions: green `baseline-checks` / `guard` / `AI Review` / `test` / `osv-scan`, no blocking review findings, no merge conflicts.

**Scope of application:** SENAR fields are required for every spec authored after the SENAR layer shipped (i.e. starting with `005-…`). Specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are grandfathered and keep their original shape; do not retrofit them.

---

## Phase 4 — Technical Architecture (PIVOTED TO PRODUCTION STACK)

Phase 4 was rerun on 2026-06-27 against new founder constraints: target high-load production from Day 1, no BaaS lock-in, single server running docker-compose, self-hosted observability, React Native instead of Flutter, and a self-hosted Capsule Zero image-processing model in place of external Photoroom/remove.bg. Phase 5 starts directly with the production runtime (no Stage 1 mock-first posture). Hosting moved to Hetzner on 2026-07-02 (spec 033), and storage moved to Hetzner Object Storage on 2026-07-10 (spec 039).

### What's already done

| Item                         | Status                                            | Location                                                               |
| ---------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| Frontend framework           | ✅ Next.js 14+ App Router, React, TypeScript      | `/app` (canonical, provider-abstracted frontend)                       |
| Styling                      | ✅ Tailwind CSS v4 with custom @theme tokens      | `app/src/styles/tokens.css`                                            |
| Design tokens                | ✅ Glass tokens, colors, typography               | `docs_capsule_zero/project/frontend/styling.md`                        |
| Production-stack ADR refresh | ✅ Rewritten in-place                             | `docs_capsule_zero/adr/adr-001-stack.md`–`adr-003-storage.md`, `adr-006-…`, `adr-007-…` |
| Architecture council         | ✅ Decisions + validation (updated for the pivot) | `docs_capsule_zero/project/architecture/phase-4-council.md`            |
| Phase 5 entrance checklist   | ✅ Updated for production runtime gate            | `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` |
| API spec                     | ✅ Product contract                               | `docs_capsule_zero/adr/api-spec.md`                                    |
| Backend docs                 | ✅ Go modular monolith                            | `docs_capsule_zero/project/backend/backend-docs.md`                    |
| Frontend docs                | ✅ Next.js against Go API                         | `docs_capsule_zero/project/frontend/frontend-docs.md`                  |
| Components guide             | ✅ Component conventions, glass patterns          | `docs_capsule_zero/project/frontend/components.md`                     |
| Mobile docs                  | ✅ React Native stack                             | `docs_capsule_zero/project/mobile/mobile-docs.md`                      |

### Accepted Phase 4 decisions

| Decision                | Accepted option                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**             | Go modular monolith (single binary, bounded contexts inside the same process)                                                       |
| **Database**            | PostgreSQL 16 — plain `postgres:16` in v0.1; pgvector (semantic), Postgres FTS (full-text) and PgBouncer pooling deferred (ADR-007) |
| **Cache / queue**       | Redis 7 (cache, sessions, Redis-based job queue — Kafka deferred until multi-service split)                                         |
| **Auth**                | Ory Kratos with email/password + Google sign-in in v0.1 (spec 037, native-flow OIDC); Apple Sign-In deferred to Stage 2             |
| **File Storage**        | Hetzner Object Storage (S3-compatible; no built-in CDN in v0.1; public catalog CDN deferred to Stage 2)                              |
| **Image processing**    | Self-hosted Capsule Zero model behind a worker (deferred — first ship core wardrobe flows with manual/placeholder behavior)         |
| **API gateway**         | nginx 1.27 with Let's Encrypt TLS (certbot on host), `limit_req_zone` rate-limit, `auth_request` into Kratos                        |
| **Hosting**             | Single Hetzner Cloud server (CX23: 2 vCPU / 4 GB / 40 GB, Ubuntu 26.04) running docker-compose — migrated from DigitalOcean 2026-07-02; Cloudflare front-door deferred to Stage 2 (founder decision 2026-07-02) |
| **Email**               | Resend for transactional email (verification, password reset, security notifications)                                               |
| **Observability**       | syslog file logs + tracing in v0.1; Grafana dashboards, Sentry, and Prometheus deferred                                             |
| **State Management**    | Zustand for local Journey/UI state; TanStack Query for interactive server-state                                                     |
| **API Client**          | Next.js Server Components/Actions and Route Handlers call the Go API through nginx (typed fetch + TanStack Query)                   |
| **Forms**               | React Hook Form + Zod                                                                                                               |
| **i18n**                | next-intl                                                                                                                           |
| **Payments**            | ON HOLD — neither a monetization model nor a payment rail is accepted. Stage 4 decides both; Lava.top is research input only, not an integration target |
| **Mobile App**          | React Native (iOS + Android) sharing the Go API contract                                                                            |
| **Coins/image enhance** | **Coins CANCELLED** as the monetization hypothesis (PRODUCT-PLAN D2, 2026-07-16) — model reworked in plan Stage 4. Image enhance stays backlog |

### Required Sprint 0 follow-ups before Phase 5 production-stack runtime work

- Founder approval on the rewritten Phase 4 ADRs.
- ~~DigitalOcean droplet upgrade to at least 4 GB RAM / 2 vCPU / 80 GB disk~~ — resolved 2026-07-02 by migrating to a Hetzner CX23 (2 vCPU / 4 GB / 40 GB; capacity budget verified in spec 033).
- ~~Spaceship DNS pointed at Cloudflare; Cloudflare proxy enabled for `capsulezero.app`~~ — deferred to Stage 2 (founder decision 2026-07-02); v0.1 pre-launch runs direct DNS → host nginx, and the realip/CF-ranges edge config stays inert until activation.
- ~~Resend account created and SPF/DKIM published on `capsulezero.app`~~ — done 2026-07-03: domain verified in Resend (eu-west-1), SPF/DKIM/DMARC live at Spaceship DNS, sending key installed on the prod host (`KRATOS_SMTP_CONNECTION_URI`, port 2465 — Hetzner blocks outbound 25/465).
- Hetzner Object Storage bucket provisioning, exact `https://capsulezero.app` asset CORS, absent backup CORS, bucketless key-only projects, cross-project policies, caveated live audits, protected env rotation, superseded-key revocation, and the post-revocation signed 10 MiB smoke are complete (assets: `15203114` / HEL; backups: `15296835` / FSN; runtime keys: `15302873`; backup keys: `15302925`). Uploads still wait for quota/cleanup/wardrobe attachment. Backup automation additionally waits for Object Lock header sanitization plus explicit residual-risk acceptance/provider fix, encryption, scheduling, retention, and restore verification.
- Ship the remaining `.specify/specs/024-production-stack-runtime/` phases. Phases 1–2 deploy via prod CD (spec 033), and spec 040 advances the Object Storage subset; Redis, imgproxy, backup automation, and observability remain.
- Retire the Supabase provider domain by domain as the Go API absorbs each bounded context — no wholesale `/app` deletion.

### Provider integration gates before real-provider QA/staging/launch

- Google OAuth client configured per `docs_capsule_zero/project/devops/google-oauth-setup.md` before enabling Google sign-in in prod (spec 037; ships off by default). Apple Sign-In stays a Stage 2 gate.
- Payment-provider provisioning and purchase QA are suspended until plan Stage 4 selects both the monetization model and payment rail. Do not create provider products, keys, webhooks, or purchase flows before that decision.
- Self-hosted image processing model: training/inference spike against the < 5 sec latency gate before enabling real image processing.
- Production credentials must be stored only in the protected plaintext
  `/opt/capsule-zero/.env` (`root:root`, mode `600`) or production dashboards
  and must not be shared with agents. Filesystem encryption is not proven.

### Phase 4 quality gate (from launch-plan.md)

- All stack decisions documented as ADRs: ✅ done (rewritten for the production-stack pivot)
- CI/CD pipeline set up (auto-build, preview deployments): ✅ baseline GitHub checks documented and configured
- Local dev setup documented (env vars, seed data): ✅ documented in backend/frontend docs
- Repository has linting configured: ✅ ESLint (`/app`) + module-size soft-gate lints (`app/eslint.config.mjs`, `api/.golangci.yml`); commit hooks pending Sprint 0 follow-up
- Founder approval on the production-stack pivot: pending

### Key constraints for architecture decisions

- **Monetization is UNDECIDED** — superseded 2026-07-16 by [`PRODUCT-PLAN.md`](PRODUCT-PLAN.md) D2: coins are cancelled as the working hypothesis and the model is reworked from scratch in plan Stage 4. Do not design features, specs, schemas, or API around coins (or any other model) until Stage 4 decides. Previously: "no subscription model — coins only (Lava.top one-time purchases), coins in v0.2 backlog"
- **3 upload methods:** photo upload · marketplace link import · semantic search (shared DB)
- **Background removal < 5 sec** per quality gate (gated by self-hosted model delivery in Stage 2)
- **Multilingual from Day 1:** EN and RU in v0.1 — use `next-intl`; ES-AR is globally deferred to v0.2
- **i18n strings:** `docs_capsule_zero/i18n/ui-texts.md`
- **Mobile-first:** phone UX first on web and React Native; iPhone 14+ (375px), Android small/standard, iPad/tablet (768px), Desktop 1280px+
- **Native mobile app:** React Native iOS + Android consumes the same Go API contract through nginx
- **Mobile payments:** ON HOLD with the rest of monetization. Do not assume a balance, purchase CTA, external payment link, or provider contract on iOS/Android until plan Stage 4 defines the model, rail, and platform-compliance path.
