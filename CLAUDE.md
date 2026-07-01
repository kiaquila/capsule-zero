# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Capsule Zero** — premium fashion-tech platform, "the Aesop of wardrobe apps". A system for creating maximally productive capsule wardrobes using proprietary color methodology.

- **Audience:** 25–40, upper-middle income, "new money mindset meets old money taste"
- **Languages:** EN (primary) and RU active in v0.1; ES-AR retained as reference copy, deferred to v0.2
- **Core metric:** Outfit Productivity Ratio (outfits / items)

## Always Work From Fresh Git State

Before every task — including research, doc edits, code changes, and even quick lookups — pull the latest state from origin:

```bash
git fetch --all --prune
```

Then start work from `origin/main` (or the named PR head) rather than whatever happens to be in the working tree. Stale local state silently produces wrong answers: a "missing" file may have been renamed last week, a "broken" check may have been fixed yesterday, a doc you're about to edit may already have been rewritten on `main`. Treat local working state as untrusted until reconciled with `origin`.

If the working tree has uncommitted changes that block a checkout, stash them (`git stash push -u -m "..."`) — do not lose work, but do not let stale state contaminate analysis either.

## Docs Are the Single Source of Truth

When you change an architecture or implementation decision, actualize **all** affected docs in the **same** change (ADRs, `.specify/specs/**`, `docs_capsule_zero/**`, AGENTS.md, CLAUDE.md, constitution). No doc drift — stale docs silently produce wrong work. Cautionary example: Traefik → nginx.

## Read Before Coding

1. @.specify/memory/constitution.md — project principles, methodology, design rules
2. @AGENTS.md — universal agent onboarding
3. @.specify/memory/design-system.md — glass tokens, typography, components
4. @.specify/memory/market-context.md — competitors, persona, pricing

## Current Phase

**Phase 4 — Technical Architecture (PIVOTED TO PRODUCTION STACK).** Phase 3 (UX/UI Design) is complete. All 16 v0.1 logical screens have approved hi-fi prototypes, implemented across 12 HTML files (some files contain multiple screens as tabs/modals). Phase 5 starts with the production stack runtime — there is no Stage 1 mock-first posture.

**Phase 4 status:**

- ✅ Production stack accepted: Go modular monolith, PostgreSQL + pgvector, Redis, nginx gateway, Ory Kratos auth, DigitalOcean Spaces, self-hosted observability
- ✅ Mobile decision: React Native (Flutter previously considered, dropped before implementation)
- ✅ Frontend remains Next.js App Router for web, but talks to the Go API through nginx instead of Supabase clients
- ✅ Payments: Lava.top web purchases, stubbed at first and integrated later
- ✅ ADRs rewritten for production stack under `docs_capsule_zero/adr/`
- ✅ CI/CD baseline configured via GitHub Actions (`baseline-checks`, `guard`, `test`, `AI Review`)
- ⚠️ Remaining Sprint 0 gate: founder approval on rewritten ADRs, DigitalOcean VM upgrade, Cloudflare anti-DDoS, Resend email account, `.specify/specs/024-production-stack-runtime/` implementation, deletion of the legacy `/app` Supabase code

**See AGENTS.md → "Phase 4" section** for full task list and deliverables.

## Spec-Driven Development (.specify)

This project uses spec-kit for structured development. **Always read the relevant .specify files before implementing.**

```
.specify/
  memory/
    constitution.md      ← Project principles, methodology, design rules (READ FIRST)
    design-system.md     ← Glass tokens, colors, typography, component patterns
    market-context.md    ← Competitors, persona, market size, pricing
  specs/
    001-capsule-zero-mvp/
      spec.md            ← Full v0.1 spec: 25 user stories, acceptance criteria, requirements
      prototype-map.md   ← Maps HTML prototypes → spec sections → screens
```

> The folder name `001-capsule-zero-mvp` is historical and remains for git stability; the content is the v0.1 product spec. Do not rename grandfathered spec folders.

**AGENTS.md** (project root) — universal onboarding for any AI agent.

### SENAR Layer (applies to specs created after 2026-04-30)

For every new spec (`005-…` and onward), feature memory must follow the SENAR shape:

- `spec.md` includes explicit `## Goal`, `## Scope` (in/out), and `## Negative Scenarios` sections.
- `plan.md` includes a `## Verification` table mapping every acceptance criterion to concrete evidence.
- `tasks.md` includes `## Process Memory` with `### Dead Ends`, `### Decisions`, `### Known Issues` written _before_ declaring work complete.
- The SENAR Done Gate in `.github/pull_request_template.md` is filled in the PR description.

Reference example: `.specify/specs/004-senar-process-layer/`. Full contract: `docs_capsule_zero/project/devops/senar-mapping.md`. Constitution principles VII (Supervised Verification, Process Memory) govern this.

Specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are grandfathered — do not retrofit them.

## Tech Stack

- **Web frontend:** Next.js 14+ App Router, React, TypeScript, Tailwind CSS v4 with custom @theme tokens (`app/src/styles/tokens.css`)
- **Mobile:** React Native (iOS + Android), production scaffold delivered in a later spec
- **API gateway:** nginx 1.27 with Let's Encrypt TLS (certbot on host), `limit_req_zone` rate-limit, `auth_request` into Ory Kratos
- **Backend:** Go modular monolith (single binary with bounded contexts), exposed behind nginx; separate image-processing worker introduced when the self-hosted image model lands
- **Auth:** Ory Kratos (email/password Stage 1; Google OAuth and Apple Sign-In in Stage 2)
- **Database:** PostgreSQL 16 with pgvector (semantic search) and Postgres FTS (full-text), PgBouncer for connection pooling
- **Cache / sessions / background queues:** Redis 7 (Redis-based job queue replaces Kafka for v0.1)
- **Object storage:** DigitalOcean Spaces (S3-compatible) with built-in CDN
- **Email:** Resend (transactional) for verification, password reset, security alerts
- **Image processing:** Self-hosted Capsule Zero model behind a worker service (deferred — scope decision recorded in ADR-003)
- **DNS / anti-DDoS:** Spaceship registrar with Cloudflare proxy for DDoS protection and CDN
- **Observability:** Grafana dashboards + syslog file logs + tracing exporter (Sentry and Prometheus deferred to Stage 2)
- **Hosting:** DigitalOcean droplet running docker-compose; all services declared as separate `services:` entries in one root `docker-compose.yml` plus environment overrides
- **Payments:** Lava.top web purchases (stubbed in v0.1, real integration after core wardrobe flows ship)
- **i18n:** next-intl for EN and RU
- **Local web state:** Zustand
- **Client server-state:** TanStack Query
- **Forms:** React Hook Form + Zod

## Build & Dev Commands

Web app (Next.js):

```bash
cd app
npm run dev          # Development server
npm run typecheck    # TypeScript validation
npm run build        # Production build
npm run ci:check     # CI baseline checks
```

Full runtime (after spec 024 ships):

```bash
docker compose up -d                 # Production-shape stack (needs the droplet env file)
# Dev with MailHog, hot-reload, debug logging (--env-file supplies dev credentials):
docker compose --env-file deploy/compose.dev.env -f docker-compose.yml -f docker-compose.dev.yml up
```

## Tests

All automated tests live under `tests/` at the repo root: `tests/e2e/` (Playwright web e2e, currently against `/app`), `tests/unit/` (Go API, stub), `tests/mobile/` (Detox, stub). The required GitHub check is **`test`** (`.github/workflows/test.yml`).

When adding or changing a test, follow [`tests/README.md`](tests/README.md) — it owns the TDD loop, POM/selector rules, and run commands. **TDD is mandatory for every spec ≥ 025, but only for application code** (web UI, React Native, Go API behaviors): write the failing test first, commit it, then make it pass. Infrastructure and delivery wiring (CI/CD workflows, Dockerfiles, `docker-compose`, nginx config, deploy scripts), docs, and other support changes are out of scope for the failing-test-first loop — verify them with config validation and smoke/health checks recorded in the `## Verification` table instead.

## Design Principles (NON-NEGOTIABLE)

- **Glassmorphism UI** — frosted glass surfaces, backdrop blur, translucent layers. See `.specify/memory/design-system.md` for exact tokens.
- **Achromatic interface** — black / white / grey; color comes ONLY from user's items
- **8px grid** for all spacing
- **"Screenshot test"** — every screen must be worth screenshotting
- **"Direct, not dictate"** — system guides, never imposes
- **Emotional arc:** Attraction → Trust → Creativity → Satisfaction

## HTML Prototypes

Pixel-perfect Phase 3 prototypes in `html-prototypes/` (pure HTML+CSS). This folder contains:

- **All 16 approved v0.1 screens** — source of truth for approved behavior, layout, and scope
- **Design system** (`html-prototypes/design-system.html`) — all design tokens, glass panel variants, typography, component patterns, spacing grid
- **Color palette** (`html-prototypes/color-system.html`) — the full 51-color capsule palette with HEX values and compatibility groups

| File                                  | Screen                                     | User Stories       |
| ------------------------------------- | ------------------------------------------ | ------------------ |
| `html-prototypes/index.html`          | Landing + Auth popup                       | US-001, US-002/003 |
| `html-prototypes/auth.html`           | Standalone Auth                            | US-002, US-003     |
| `html-prototypes/dashboard.html`      | Dashboard                                  | US-004, US-005     |
| `html-prototypes/guided-journey.html` | Guided Journey (3 steps)                   | US-008–012, US-017 |
| `html-prototypes/capsule-result.html` | Capsule Result                             | US-013–016         |
| `html-prototypes/my-items.html`       | My Items                                   | US-006, US-007     |
| `html-prototypes/uncapsulated.html`   | Uncapsulated                               | US-020             |
| `html-prototypes/favorites.html`      | Favorites                                  | US-019             |
| `html-prototypes/for-sale.html`       | For Sale                                   | US-021             |
| `html-prototypes/for-repair.html`     | For Repair                                 | US-024             |
| `html-prototypes/profile.html`        | Profile                                    | US-005, US-018     |
| `html-prototypes/design-system.html`  | Design System (tokens, components)         | —                  |
| `html-prototypes/color-system.html`   | Color Palette (51 colors, capsule palette) | —                  |

**To view:** `python3 -m http.server 3100` from `html-prototypes/`.

## Product Documentation

- `.specify/specs/001-capsule-zero-mvp/spec.md` — 25 user stories + flows (v0.1 product spec)
- `docs_capsule_zero/project/methodology/` — Methodology, categories, colors, outfit generation, gap analysis
- `docs_capsule_zero/glossary.md` — Domain terminology (RU equivalents)
- `docs_capsule_zero/i18n/ui-texts.md` — i18n content (EN, RU active; ES-AR retained as reference)
- `docs_capsule_zero/ux/emotion-map.md` — Emotional targets per screen
- `docs_capsule_zero/ux/ux-validation.md` — Competitor UX analysis, 6 critical insights
- `docs_capsule_zero/marketing/go-to-market.md` — TAM/SAM/SOM, competitors, pricing
- `docs_capsule_zero/launch/launch-plan.md` — Full launch plan, phases 0-7
- `docs_capsule_zero/project/devops/ai-pr-workflow.md` — PR loop and merge gates
- `docs_capsule_zero/project/devops/ai-orchestration-protocol.md` — cloud-native agent routing and policy contract
- `docs_capsule_zero/project/devops/ai-runner.md` — cloud AI integrations and `AI Review` gate contract
- `docs_capsule_zero/project/architecture/phase-4-council.md` — architecture decision register
- `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` — production runtime entrance gate
- `docs_capsule_zero/adr/` — ADRs for stack, auth, storage, and API contract
- `docs_capsule_zero/project/mobile/mobile-docs.md` — React Native app architecture and mobile constraints

## Backend Posture — No Supabase / Legacy-Backend Recoupling (NON-NEGOTIABLE)

Supabase is **retired** (production-stack pivot, 2026-06-27); the legacy `/app` provider is frozen and slated for deletion. **Never re-introduce it into anything new.** No new spec, `docker-compose*.yml`, workflow, deploy/provisioning script, infra/nginx config, or doc may add `SUPABASE_*` / `CAPSULE_PROVIDER_MODE` / provider env, Supabase client imports, or health/smoke checks against provider-backed routes (`/api/health`, other `/api/*`). New deploy/infra artifacts reuse the web-only `web` service contract from `docker-compose.yml` and stay provider-agnostic until the Go/Postgres/Kratos backend wires its own env. The dev edge deploys `main`'s frontend only — smoke `/en`, never `/api/*`. Full rule and the PR-#53 regression that prompted it: AGENTS.md → "Key Principles" #8.

## Repository Delivery Protocol

- Product code lands through pull requests only.
- Required GitHub checks are `baseline-checks`, `guard`, `test`, and `AI Review`.
- Claude is the default implementation agent, selected through `AI_IMPLEMENTATION_AGENT`.
- Review selection is separate and controlled through `AI_REVIEW_AGENT`.
- Canonical execution uses the selected vendor's native remote surface:
  - `@claude ...` for Claude implementation
  - Codex app or Codex web task for Codex-owned implementation PRs
  - `@claude review once` on a top-level PR comment
  - `@codex review` on a top-level PR comment
- Only trusted repository actors may trigger repository AI workflows.
- `AI Review` is a repository-owned fail-closed gate that normalizes native review output to Capsule Zero policy.
- Native review normalization rules live in `docs_capsule_zero/project/devops/review-contract.md`.
- Follow `docs_capsule_zero/project/devops/ai-pr-workflow.md` and `docs_capsule_zero/project/devops/ai-orchestration-protocol.md` for workflow behavior; this file is Claude's repository context, not the orchestration source of truth.

## Feature & Screen Specs

**Reading route for implementing a feature:**

1. HTML prototype (`html-prototypes/`) — current source of truth for approved behavior, layout, and scope
2. `docs_capsule_zero/features/f-XXX-name.md` — requirements, acceptance criteria, edge cases
3. `docs_capsule_zero/screens/screen-name.md` — layout, component details, states
4. `.specify/specs/001-capsule-zero-mvp/spec.md` — user stories and acceptance criteria
5. `.specify/specs/001-capsule-zero-mvp/prototype-map.md` — cross-cutting stories and backend-only stories

**Feature files** (`docs_capsule_zero/features/`):
`f-001-landing`, `f-002-auth`, `f-003-dashboard`, `f-004-profile`, `f-005-my-items`,
`f-006-guided-journey`, `f-007-marketplace-import`, `f-008-semantic-search`,
`f-009-capsule-result`, `f-010-capsule-management`, `f-011-photo-upload`,
`f-012-i18n`, `f-013-favorites`, `f-014-wardrobe-management`, `f-015-opr`

**Screen files** (`docs_capsule_zero/screens/`):
`screen-landing`, `screen-auth`, `screen-dashboard`, `screen-guided-journey`,
`screen-capsule-result`, `screen-my-items`, `screen-uncapsulated`,
`screen-favorites`, `screen-for-sale`, `screen-for-repair`, `screen-profile`

## Quality Gates

- Screens = designs to 2px precision (reference: HTML prototypes)
- Lighthouse: Performance 90+, Accessibility 95+
- Page load < 2 sec on 4G
- Upload + bg removal < 5 sec (self-hosted model SLA target; gated by Stage 2 image processing)
- Mobile-first web: iPhone 14+ (375px), iPad (768px), Desktop 1280px+
- React Native smoke tests: iOS and Android small/standard phone sizes
- Zero console errors, zero FOUC
- Every screen: min 3 states (default, loading, empty/error)
