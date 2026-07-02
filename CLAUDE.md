# CLAUDE.md

Claude Code's repository context for **Capsule Zero**. The canonical, agent-agnostic onboarding is **[AGENTS.md](AGENTS.md)** — read it first. This file only adds Claude-specific pointers and the few rules Claude must never miss; it deliberately does **not** duplicate AGENTS.md (tech stack, repo layout, key principles, delivery workflow, source-doc index all live there). If something here and AGENTS.md ever disagree, AGENTS.md wins — fix the drift.

## Project Overview

**Capsule Zero** — premium fashion-tech platform, "the Aesop of wardrobe apps": maximally productive capsule wardrobes built from a proprietary color methodology. Audience 25–40, upper-middle income ("new money mindset meets old money taste"). Core metric: Outfit Productivity Ratio (outfits / items). Languages EN + RU active in v0.1; ES-AR deferred to v0.2. Full context: [AGENTS.md](AGENTS.md).

## Always Work From Fresh Git State

Before every task — research, doc edits, code changes, even quick lookups — run `git fetch --all --prune` and start from `origin/main` (or the named PR head). Stale local state silently produces wrong answers: a "missing" file may have been renamed, a "broken" check may have been fixed, a doc you're about to edit may already be rewritten on `main`. If uncommitted changes block a checkout, stash them (`git stash push -u -m "..."`) — don't lose work, don't contaminate analysis.

## Docs Are the Single Source of Truth

When you change an architecture or implementation decision, actualize **all** affected docs in the **same** change (ADRs, `.specify/specs/**`, `docs_capsule_zero/**`, AGENTS.md, CLAUDE.md, constitution). No doc drift — stale docs silently produce wrong work. Cautionary example: Traefik → nginx. Full rule: AGENTS.md §9.

## Docs Are the Single Source of Truth

When you change an architecture or implementation decision, actualize **all** affected docs in the **same** change (ADRs, `.specify/specs/**`, `docs_capsule_zero/**`, AGENTS.md, CLAUDE.md, constitution). No doc drift — stale docs silently produce wrong work. Cautionary example: Traefik → nginx.

## Read Before Coding

1. @.specify/memory/constitution.md — project principles, methodology, design rules
2. @AGENTS.md — universal agent onboarding (phase status, repo layout, key principles, delivery workflow, source-doc index)
3. @.specify/memory/design-system.md — glass tokens, typography, components
4. @.specify/memory/market-context.md — competitors, persona, pricing

## Engineering Discipline

- **Reuse before you add — check before you write.** Before creating any new module / function / component / service / adapter / schema / helper, search for an existing one that already owns the responsibility and extend it. If you still add a new unit, state in the PR — in one line — which existing unit you checked and why it didn't fit. Full contract: **AGENTS.md §7 (Engineering Reuse Rule & Module-Size Discipline)**.
- **Module-size soft gate** (a signal to split, not a hard CI failure): functions ≤ ~60 lines; files ≤ ~300 (TS/React) / ~500 (Go); cyclomatic complexity ≤ 15. Wired as **warnings** in `app/eslint.config.mjs` and opt-in `api/.golangci.yml` — they never fail CI; the Go file-size row is review-only (no file-length linter wired). Exceeding a threshold needs a one-line justification in the PR. Details: AGENTS.md §7.
- **No Supabase / legacy-backend recoupling** (NON-NEGOTIABLE): `/app` is the canonical provider-abstracted frontend; current provider modes are `mock` and `supabase`, and the frozen Supabase provider is retired **domain by domain** only as real Go API contexts land. Never re-introduce `SUPABASE_*` env or Supabase clients into any new spec, `docker-compose*.yml`, workflow, infra config, or doc. Full rule + the PR-#53 regression: AGENTS.md §8.

## Design Principles (NON-NEGOTIABLE)

- **Glassmorphism UI** — frosted glass surfaces, backdrop blur, translucent layers; never opaque containers.
- **Achromatic interface** — black / white / grey; color comes ONLY from the user's items. Error color `#FFD600` (yellow, not red).
- **8px grid** for spacing; the "screenshot test" (every screen worth screenshotting); "direct, not dictate" (guide, never impose).
- Exact tokens: @.specify/memory/design-system.md and `docs_capsule_zero/project/frontend/styling.md`.

## Current Phase

**Phase 5 — Development Sprint, in progress** against `.specify/specs/024-production-stack-runtime/`. Phase 1 (nginx + web compose) has landed; Phase 2 (Postgres + Kratos) remains pending, and the Go API / `api` provider arrives in later spec-024 phases. Postgres is plain `postgres:16` (pgvector deferred, ADR-007). Full status and decisions: AGENTS.md → "Current Phase & Status" and "Phase 4 — Technical Architecture".

## Build & Dev Commands

Web app (`/app`):

```bash
cd app
npm run dev          # Development server
npm run typecheck    # TypeScript validation
npm run lint         # ESLint (includes module-size warnings)
npm run build        # Production build
```

Full runtime:

```bash
docker compose up -d                 # Production-shape stack (needs the droplet env file)
# Dev with MailHog, hot-reload, debug logging (--env-file supplies dev credentials):
docker compose --env-file deploy/compose.dev.env -f docker-compose.yml -f docker-compose.dev.yml up
```

## Spec-Driven Development & SENAR

This project uses spec-kit (`.specify/`). Read the relevant spec folder under `.specify/specs/` before implementing. SENAR fields are required for specs authored from `005-…` onward: `## Goal`/`## Scope` in `spec.md`, a `## Verification` table in `plan.md`, `## Process Memory` in `tasks.md`, plus the SENAR Done Gate in the PR. Only `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are grandfathered. **TDD is mandatory for spec ≥ 025 application code** (web / React Native / Go API) — commit the failing test first; infrastructure and docs are exempt (config validation + smoke checks instead). Full contract: AGENTS.md → "SENAR Completion Contract" and `docs_capsule_zero/project/devops/senar-mapping.md`.

## Tests

All tests live under `tests/` (`tests/e2e/` Playwright → `/app`; `tests/unit/` Go; `tests/mobile/` Detox stub). Required GitHub check: **`test`**. Follow [`tests/README.md`](tests/README.md) for the TDD loop, POM/selector rules, and run commands.

## Delivery

Product code lands through pull requests only. Required checks: `baseline-checks`, `guard`, `test`, `AI Review`. Claude implements via `@claude ...`; review via `@claude review once`. Full workflow: AGENTS.md → "Delivery Workflow" and `docs_capsule_zero/project/devops/ai-pr-workflow.md`.
