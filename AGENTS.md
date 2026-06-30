# AGENTS.md — Capsule Zero Onboarding

> Universal onboarding document for any AI agent (Claude Code, Codex, Gemini CLI, Cursor, etc.)

## What Is Capsule Zero?

**Capsule Zero** is a premium fashion-tech platform — "the Aesop of wardrobe apps". It helps affluent users (25–40 yo) build maximally productive capsule wardrobes using a proprietary color and wardrobe methodology. Core metric: **Outfit Productivity Ratio** (outfits / items).

**Tech stack:** Next.js 14+ App Router web frontend, React Native mobile app (iOS + Android), Go modular monolith backend, nginx 1.27 reverse proxy / API gateway, Ory Kratos auth, PostgreSQL + pgvector, Redis, DigitalOcean Spaces, Cloudflare front-door, all wired through docker-compose on a DigitalOcean droplet.
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
| 3. UX/UI Design               | COMPLETE — 16 logical screens across 12 HTML files + `html-prototypes/design-system.html`, `html-prototypes/color-system.html` — all in `html-prototypes/`                         |
| **4. Technical Architecture** | **PIVOTED TO PRODUCTION STACK** — Go modular monolith + nginx + Ory Kratos + Postgres/pgvector + Redis + DO Spaces + Cloudflare + Resend; React Native replaces Flutter        |
| 5. Development Sprint         | Upcoming — starts with `.specify/specs/024-production-stack-runtime/`                                                                                                              |
| 6. QA & Soft Launch           | Upcoming                                                                                                                                                                           |
| 7. Commercial Launch          | Upcoming                                                                                                                                                                           |

**Locale scope decision, 2026-06-07:** Spanish / ES-AR is removed from active v0.1 scope and moved globally to v0.2. Keep Spanish source copy as future reference only; do not expose ES-AR in active routing, language switchers, profile language persistence, OpenAPI enums, generated clients, or launch acceptance criteria until v0.2 locale scope is reopened.

**Production-stack pivot decision, 2026-06-27:** Phase 4 architecture was rewritten from a Supabase BaaS posture to a production-grade self-hosted stack. The previous Supabase-based code under `/app` is treated as legacy and will be removed in the implementation iteration after `.specify/specs/024-production-stack-runtime/` ships. The mock-first Stage 1 posture (previously ADR-006) is dropped entirely — implementation goes straight to real services behind production-shape contracts.

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
      prototype-map.md   ← Maps HTML files → spec sections → screens
    024-production-stack-runtime/
      spec.md            ← Production runtime delivery spec (next implementation iteration)
      plan.md            ← Verification table for the runtime delivery
      tasks.md           ← Process Memory
```

> The folder name `001-capsule-zero-mvp` is historical and remains for git stability; the content is the v0.1 product spec. Do not rename grandfathered spec folders.

## HTML Prototypes

Located in `html-prototypes/`. These are **pixel-perfect hi-fi prototypes** (pure HTML+CSS, no frameworks) representing the approved Phase 3 design. The folder also contains the design system and color palette references used for development.

**Current source of truth:** the HTML prototypes in `html-prototypes/` are the most up-to-date product reference for product behavior, layout, and scope. If an older doc conflicts with an approved HTML prototype, follow the prototype and then align the docs.

| File                                  | Screen                                       | User Stories           |
| ------------------------------------- | -------------------------------------------- | ---------------------- |
| `html-prototypes/index.html`          | Landing + Auth popup                         | US-001, US-002, US-003 |
| `html-prototypes/auth.html`           | Standalone Auth                              | US-002, US-003         |
| `html-prototypes/dashboard.html`      | Dashboard                                    | US-004, US-005         |
| `html-prototypes/guided-journey.html` | Guided Journey (3 steps)                     | US-008–012, US-017     |
| `html-prototypes/capsule-result.html` | Capsule Result                               | US-013–016             |
| `html-prototypes/my-items.html`       | My Items                                     | US-006, US-007         |
| `html-prototypes/uncapsulated.html`   | Uncapsulated                                 | US-020                 |
| `html-prototypes/favorites.html`      | Favorites                                    | US-019                 |
| `html-prototypes/for-sale.html`       | For Sale                                     | US-021                 |
| `html-prototypes/for-repair.html`     | For Repair                                   | US-024                 |
| `html-prototypes/profile.html`        | Profile                                      | US-005, US-018         |
| `html-prototypes/design-system.html`  | Design System (tokens, components, patterns) | —                      |
| `html-prototypes/color-system.html`   | Color Palette (51 colors, capsule palette)   | —                      |

**To view:** `python3 -m http.server 3100` from `html-prototypes/`, then `http://localhost:3100/<file>.html`

## Key Principles to ALWAYS Respect

### 1. Glassmorphism UI Language (NON-NEGOTIABLE)

The interface uses frosted glass surfaces. Two variants: main panels (blur 40px) and nav/bottom sheets (blur 44px).

- **Never** use opaque solid backgrounds for containers. **Always** use glass.
- → Exact token values: `docs_capsule_zero/project/frontend/styling.md`

### 2. Achromatic Interface

- UI colors: black / white / grey only
- Color enters ONLY through user's garment photos and color dots
- Error color: `#FFD600` (yellow), NOT red

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

### 7. Engineering Reuse Rule (DRY/SOLID)

If a product or technical object type already exists in code, reuse its component, service, adapter, schema, helper, and CSS/API contract before adding a new variant. This applies across frontend, backend, API, data, and mobile layers.

- UI examples: item cards, item detail panels, bottom navigation, glass buttons, filters, color dots, and repeated wardrobe actions.
- Backend/API examples: provider adapters, route handlers, validation schemas, DTOs, repository helpers, domain services, and fixture builders.
- Shared structure belongs in a shared abstraction; feature-specific screens or endpoints should pass only section-specific labels, metadata, behavior, and policy.
- Code review must reject copy-pasted markup, logic, schemas, or one-off classes/modules when an established object type can cover the same responsibility.

### 8. No Supabase / Legacy-Backend Recoupling (NON-NEGOTIABLE)

Supabase is **retired** (production-stack pivot, 2026-06-27). The legacy Supabase provider is frozen and being deleted domain by domain — **do not extend it, and do not re-introduce it into anything new.**

- No new spec, `docker-compose*.yml`, GitHub workflow, deploy/provisioning script, infra/nginx config, or doc may add or re-introduce Supabase coupling: no `SUPABASE_*` env, no Supabase client imports.
- The **dev edge** (`dev.capsulezero.app` via `docker-compose.dev-server.yml`) stays web-only and provider-free — deploys preview the **frontend only** and smoke **provider-free routes (`/en`)**, never provider-backed `/api/*`, until the Go / Postgres / Kratos backend is wired into the dev edge in its own slice.
- Exception, by design: the **production stack** (`docker-compose.yml`) is where the Go / Postgres / Kratos backend lands and wires **its own** env behind production-shape contracts (`CAPSULE_PROVIDER_MODE=api`, `/api/*` routing). That is the sanctioned arrival this rule anticipates — it is not a Supabase recoupling.
- **Reviewers must reject** any diff that recouples deployment, CI/CD, or runtime to the retired **Supabase** backend. Regression that motivated this rule: PR #53 (spec 026) grafted a full `SUPABASE_*` env contract + `/api/health` healthcheck into the brand-new `docker-compose.dev-server.yml` instead of mirroring the web-only `docker-compose.yml`, silently breaking dev CD.

### 9. Docs Are the Single Source of Truth

When you change an architecture or implementation decision, actualize **all** affected docs in the **same** change — ADRs, `.specify/specs/**`, `docs_capsule_zero/**`, AGENTS.md, CLAUDE.md, constitution. No doc drift. (Cautionary example: Traefik → nginx.)

## Source Documentation

| Document                                                               | Content                                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
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

1. HTML prototype (`html-prototypes/`) — current source of truth for approved behavior, layout, and scope
2. `docs_capsule_zero/features/f-XXX-name.md` — requirements, acceptance criteria, edge cases
3. `docs_capsule_zero/screens/screen-name.md` — layout, component details, states
4. `.specify/specs/001-capsule-zero-mvp/spec.md` — user stories and acceptance criteria
5. `.specify/specs/001-capsule-zero-mvp/prototype-map.md` — cross-cutting stories and backend-only stories

**Feature → Screen mapping:**
| Feature | Screen file | HTML prototype |
|---|---|---|
| f-001-landing | screen-landing | html-prototypes/index.html |
| f-002-auth | screen-auth | html-prototypes/auth.html, html-prototypes/index.html (popup) |
| f-003-dashboard | screen-dashboard | html-prototypes/dashboard.html |
| f-004-profile | screen-profile | html-prototypes/profile.html |
| f-005-my-items | screen-my-items | html-prototypes/my-items.html |
| f-006-guided-journey | screen-guided-journey | html-prototypes/guided-journey.html |
| f-007-marketplace-import | screen-guided-journey (tab) | html-prototypes/guided-journey.html |
| f-008-semantic-search | screen-guided-journey (tab) | html-prototypes/guided-journey.html |
| f-009-capsule-result | screen-capsule-result | html-prototypes/capsule-result.html |
| f-010-capsule-management | screen-capsule-result | html-prototypes/capsule-result.html |
| f-011-photo-upload | screen-guided-journey, my-items | html-prototypes/guided-journey.html |
| f-012-i18n | all screens | all HTML files |
| f-013-favorites | screen-favorites | html-prototypes/favorites.html |
| f-014-wardrobe-management | screen-my-items, uncapsulated, for-sale, for-repair | html-prototypes/my-items.html + others |
| f-015-opr | screen-dashboard, capsule-result | html-prototypes/dashboard.html |

## Repository Layout (target after spec 024 ships)

```
/api/             ← Go modular monolith (bounded contexts: auth, wardrobe, capsule, search, billing)
/worker/          ← Go background worker (Redis-queue consumer for image jobs, embeddings, webhooks)
/web/             ← Next.js App Router web frontend
/mobile/          ← React Native iOS + Android app
/infra/           ← docker-compose.yml + service configs + nginx conf.d + Kratos config + migrations
/html-prototypes/ ← Phase 3 design source of truth
/docs_capsule_zero/ ← Product, methodology, devops, architecture docs
/.specify/        ← spec-kit feature memory
```

The current `/app` directory contains the legacy Supabase-based Next.js shell. It is scheduled for removal in the implementation iteration that follows `.specify/specs/024-production-stack-runtime/`.

## Delivery Workflow

- Product code lands through pull requests only.
- Required GitHub checks are `baseline-checks`, `guard`, `test`, and `AI Review`.
- Durable workflow docs live under `docs_capsule_zero/project/devops/`.
- The canonical orchestration contract is documented in `docs_capsule_zero/project/devops/ai-orchestration-protocol.md`.
- Cloud AI integration and review-gate requirements are documented in `docs_capsule_zero/project/devops/ai-runner.md`.
- Agent selection is policy-driven through repository variables:
  - `AI_IMPLEMENTATION_AGENT`
  - `AI_REVIEW_AGENT`
- Canonical execution uses the selected vendor's native remote surface:
  - `@claude ...` for Claude implementation
  - Codex app or Codex web task for Codex-owned implementation PRs
  - `@claude review once` on a top-level PR comment
  - `@codex review` on a top-level PR comment
- Only trusted repository actors may trigger AI workflows.
- Trusted actors are `OWNER`, `MEMBER`, and `COLLABORATOR`.
- Native review normalization is documented in `docs_capsule_zero/project/devops/review-contract.md`.
- Local PowerShell and worktree orchestration scripts are no longer part of the repository.

## Tests

All automated tests live under `tests/` at the repo root:

- `tests/e2e/` — Playwright web e2e (TypeScript). Currently targets `/app`; retargets to `/web` when `/app` is removed. Gated by the required GitHub check **`test`** (`.github/workflows/test.yml`).
- `tests/unit/` — `go test` for the Go API. Stub today; populated once spec-024 lands product code.
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
- The standard merge-ready conditions: green `baseline-checks` / `guard` / `test` / `AI Review`, no blocking review findings, no merge conflicts.

**Scope of application:** SENAR fields are required for every spec authored after the SENAR layer shipped (i.e. starting with `005-…`). Specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are grandfathered and keep their original shape; do not retrofit them.

## Review guidelines

- Codex review uses native GitHub PR review output plus `P0-P3` inline severity badges.
- Claude review uses a top-level `claude[bot]` comment with marker lines, not a formal GitHub PR review.
- When a Claude review request includes `AI_REVIEW_AGENT`, `AI_REVIEW_SHA`, and `AI_REVIEW_OUTCOME`, preserve those lines exactly at the start of the final top-level Claude comment.
- `AI_REVIEW_OUTCOME=pass` means no material findings.
- `AI_REVIEW_OUTCOME=advisory` means advisory-only findings that should not block merge.
- `AI_REVIEW_OUTCOME=block` means at least one finding should block merge.
- Treat low-severity-only findings as advisory and non-blocking.

---

## Phase 4 — Technical Architecture (PIVOTED TO PRODUCTION STACK)

Phase 4 was rerun on 2026-06-27 against new founder constraints: target high-load production from Day 1, no BaaS lock-in, single DigitalOcean droplet running docker-compose, self-hosted observability, React Native instead of Flutter, and a self-hosted Capsule Zero image-processing model in place of external Photoroom/remove.bg. Phase 5 starts directly with the production runtime (no Stage 1 mock-first posture).

### What's already done

| Item                                | Status                                            | Location                                                               |
| ----------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| Frontend framework                  | ✅ Next.js 14+ App Router, React, TypeScript      | `/app` (legacy, scheduled removal); future `/web`                      |
| Styling                             | ✅ Tailwind CSS v4 with custom @theme tokens      | `app/src/styles/tokens.css`                                            |
| Design tokens                       | ✅ Glass tokens, colors, typography               | `docs_capsule_zero/project/frontend/styling.md`                        |
| Production-stack ADR refresh        | ✅ Rewritten in-place                              | `docs_capsule_zero/adr/adr-001-stack.md` through `adr-006-…`            |
| Architecture council                | ✅ Decisions + validation (updated for the pivot) | `docs_capsule_zero/project/architecture/phase-4-council.md`            |
| Phase 5 entrance checklist          | ✅ Updated for production runtime gate            | `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` |
| API spec                            | ✅ Product contract                                | `docs_capsule_zero/adr/api-spec.md`                                    |
| Backend docs                        | ✅ Go modular monolith                            | `docs_capsule_zero/project/backend/backend-docs.md`                    |
| Frontend docs                       | ✅ Next.js against Go API                          | `docs_capsule_zero/project/frontend/frontend-docs.md`                  |
| Components guide                    | ✅ Component conventions, glass patterns          | `docs_capsule_zero/project/frontend/components.md`                     |
| Mobile docs                         | ✅ React Native stack                              | `docs_capsule_zero/project/mobile/mobile-docs.md`                      |

### Accepted Phase 4 decisions

| Decision               | Accepted option                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Backend**            | Go modular monolith (single binary, bounded contexts inside the same process)                                                |
| **Database**           | PostgreSQL 16 with pgvector (semantic) and Postgres FTS (full-text), PgBouncer for connection pooling                        |
| **Cache / queue**      | Redis 7 (cache, sessions, Redis-based job queue — Kafka deferred until multi-service split)                                  |
| **Auth**               | Ory Kratos with email/password Stage 1; Google OAuth and Apple Sign-In deferred to Stage 2                                   |
| **File Storage**       | DigitalOcean Spaces (S3-compatible, built-in CDN)                                                                            |
| **Image processing**   | Self-hosted Capsule Zero model behind a worker (deferred — first ship core wardrobe flows with manual/placeholder behavior)  |
| **API gateway**        | nginx 1.27 with Let's Encrypt TLS (certbot on host), `limit_req_zone` rate-limit, `auth_request` into Kratos                  |
| **Hosting**            | Single DigitalOcean droplet running docker-compose; Cloudflare in front of nginx for DDoS protection and CDN                  |
| **Email**              | Resend for transactional email (verification, password reset, security notifications)                                        |
| **Observability**      | Grafana dashboards + syslog file logs + tracing; Sentry and Prometheus deferred to Stage 2                                   |
| **State Management**   | Zustand for local Journey/UI state; TanStack Query for interactive server-state                                              |
| **API Client**         | Next.js Server Components/Actions and Route Handlers call the Go API through nginx (typed fetch + TanStack Query)            |
| **Forms**              | React Hook Form + Zod                                                                                                        |
| **i18n**               | next-intl                                                                                                                    |
| **Payments**           | Lava.top web purchases — stubbed in v0.1, integrated after the core wardrobe and capsule flows ship                          |
| **Mobile App**         | React Native (iOS + Android) sharing the Go API contract                                                                     |
| **Coins/image enhance**| Backlog — deferred until after v0.1 launch                                                                                   |

### Required Sprint 0 follow-ups before Phase 5 production-stack runtime work

- Founder approval on the rewritten Phase 4 ADRs.
- DigitalOcean droplet upgrade to at least 4 GB RAM / 2 vCPU / 80 GB disk (current 512 MB / 1 vCPU droplet cannot host the new stack).
- Spaceship DNS pointed at Cloudflare; Cloudflare proxy enabled for `capsulezero.app`.
- Resend account created and SPF/DKIM published on `capsulezero.app`.
- DigitalOcean Spaces bucket created with CORS configured for `capsulezero.app`.
- Ship `.specify/specs/024-production-stack-runtime/` to bring the stack up in docker-compose on the droplet, with every service health-checked end-to-end.
- After spec 024 ships: delete legacy `/app` Supabase code in a follow-up PR.

### Provider integration gates before real-provider QA/staging/launch

- Configure Google and Apple OAuth providers only for Stage 2 social auth.
- Configure Lava.top products/API key/webhook before real web purchases are tested.
- Self-hosted image processing model: training/inference spike against the < 5 sec latency gate before enabling real image processing.
- Production credentials must be stored only in the droplet's encrypted env file or production dashboards and must not be shared with agents.

### Phase 4 quality gate (from launch-plan.md)

- All stack decisions documented as ADRs: ✅ done (rewritten for the production-stack pivot)
- CI/CD pipeline set up (auto-build, preview deployments): ✅ baseline GitHub checks documented and configured
- Local dev setup documented (env vars, seed data): ✅ documented in backend/frontend docs
- Repository has linting + commit hooks configured: pending Sprint 0 follow-up
- Founder approval on the production-stack pivot: pending

### Key constraints for architecture decisions

- **No subscription model** — coins only (Lava.top one-time purchases), and coins are in v0.2 backlog
- **3 upload methods:** photo upload · marketplace link import · semantic search (shared DB)
- **Background removal < 5 sec** per quality gate (gated by self-hosted model delivery in Stage 2)
- **Multilingual from Day 1:** EN and RU in v0.1 — use `next-intl`; ES-AR is globally deferred to v0.2
- **i18n strings:** `docs_capsule_zero/i18n/ui-texts.md`
- **Mobile-first:** phone UX first on web and React Native; iPhone 14+ (375px), Android small/standard, iPad/tablet (768px), Desktop 1280px+
- **Native mobile app:** React Native iOS + Android consumes the same Go API contract through nginx
- **Mobile payments:** Lava.top is canonical for web purchases; iOS/Android v0.1 must not expose purchase CTAs or external payment links, only balance/status
