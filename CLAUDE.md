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
- **No Supabase / legacy-backend recoupling** (NON-NEGOTIABLE): `/app` is the canonical provider-abstracted frontend; `api` is the production Go/Kratos mode, `mock` is local/CI only, and frozen `supabase` legacy domains are retired **domain by domain** as real Go API contexts land. Never re-introduce `SUPABASE_*` env or Supabase clients into any new spec, `docker-compose*.yml`, workflow, infra config, or doc. Full rule + the PR-#53 regression: AGENTS.md §8.

## Design Principles (NON-NEGOTIABLE)

- **Glassmorphism UI** — frosted glass surfaces, backdrop blur, translucent layers; never opaque containers.
- **Achromatic interface** — black / white / grey; color comes ONLY from the user's items. Error color `#FFD600` (yellow, not red).
- **8px grid** for spacing; the "screenshot test" (every screen worth screenshotting); "direct, not dictate" (guide, never impose).
- Exact tokens: @.specify/memory/design-system.md and `docs_capsule_zero/project/frontend/styling.md`.

## UI & Design work

- For any UI/design task, run the two-role loop: `ui-ux-designer` (owns scenario, visual
  system, states, consistency, live review) ↔ `frontend` (owns implementation,
  reusable components, a11y, responsiveness, tech constraints).
- Start every UI task with the `design-system` skill's Step 0 (classify this project's
  system state) before designing or coding.
- This project's design system is declared in: `.specify/memory/design-system.md`
  (+ state/governance annex: `.specify/memory/design-system-state.md`).
- Token changes are proposed by frontend, ratified by ui-ux-designer. Fix at the right
  level (screen / component / token). No off-scale spacing, no stray hex.
- Hand off with `design-handoff`; review the LIVE screen with `design-review` before done.

## Current Phase

**Phase 5 — Development Sprint, in progress.** Runtime Phases 1–2 have landed (nginx + web; Postgres + Kratos + Go API + the `api` provider, PR #57); the current application slice is `.specify/specs/040-object-storage-upload-foundation/`. Asset buckets exist in project `15203114` / HEL and the Object-Locked backup bucket in project `15296835` / FSN. Runtime and backup-writer credentials live in bucketless key-only projects `15302873` and `15302925`, with cross-project policies. The runtime audit passed; the backup hybrid-policy audit proved normal puts plus read/delete/control/list/ACL denies and dangerous ACL header guards, but Hetzner/RGW still accepts Object Lock mode/retain-until/legal-hold headers on `PutObject`. That bounded write-time storage-DoS/cost residual does not expose or delete existing data and keeps backup automation gated on header sanitization plus explicit acceptance/provider fix alongside the Phase-5 backup controls. Policy/CORS readback, absent backup CORS, protected env rotation, superseded-key revocation, and the post-revocation signed 10 MiB PUT/HEAD/GET/checksum/delete smoke passed. Upload routes remain production-disabled by default until quota/cleanup and wardrobe attachment land. Every merge to `main` auto-deploys to `https://capsulezero.app` through `.github/workflows/cd-prod.yml` (spec 033) — there is no separate dev environment. Postgres is plain `postgres:16` (pgvector deferred, ADR-007). Full status and decisions: AGENTS.md → "Current Phase & Status" and "Phase 4 — Technical Architecture".

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

Web/mobile suites live under `tests/`; Go package tests are co-located as
`api/**/*_test.go` and run with `cd api && go vet ./... && go test ./...`.
`tests/unit/` is reserved for a future cross-package suite. Required GitHub
check: **`test`**. Follow [`tests/README.md`](tests/README.md) for the TDD loop,
POM/selector rules, and run commands.

## Delivery

Product code lands through pull requests only. Required checks: `baseline-checks`, `guard`, `AI Review`, and `test`. `AI Review` is GitHub-hosted and validates native Codex review; it is not a local-runner workflow. A human remains the final review and merge authority. Full workflow: AGENTS.md → "Delivery Workflow" and `docs_capsule_zero/project/devops/github-ci-and-branch-protection.md`.
