# Spec 031: Agent Instructions Cleanup

## Goal

Keep the repository onboarding contract current after the spec-024 production-stack pivot by removing stale `/web` guidance, slimming duplicated Claude-specific context, documenting the reuse/module-size discipline, and deleting the leftover generated `/web` client path that no longer matches the canonical `/app` frontend.

## Scope

In scope:

- update `AGENTS.md` to reflect `/app` as the canonical provider-abstracted Next.js frontend
- update `AGENTS.md` phase/status language for the landed spec-024 Phase 1 runtime work
- remove obsolete HTML-prototype-as-current-source guidance from agent onboarding
- add the engineering reuse check and module-size discipline to `AGENTS.md`
- slim `CLAUDE.md` so Claude-specific context points back to canonical `AGENTS.md` rules instead of duplicating stale tables
- add non-blocking module-size/complexity warning configuration for `/app` ESLint and optional `/api` golangci-lint usage
- remove the leftover `/web` directory and its generated API-client codegen target
- keep dev CD path filtering aligned with the canonical `/app` frontend and the absence of `/web`
- add feature-memory evidence for the product-root support changes in this PR
- align affected source-of-truth docs, specs, tests, and generated-client references so they no longer instruct agents or tooling to use `/web`
- align stale scaffold README references under `api/` and `infra/` so placeholders do not reintroduce Traefik, golang-migrate, or active pgvector guidance

Out of scope:

- changing application behavior, routes, UI, API handlers, database schema, auth flows, or runtime provider logic
- reintroducing a `/web` frontend or planning an `/app` to `/web` rename
- enforcing module-size limits as required CI failures
- running or changing generated API-client contents outside the deleted obsolete `/web` path
- changing Supabase retirement policy beyond documenting the already accepted domain-by-domain removal path

## User Stories

### US1: Current Agent Onboarding

As a maintainer, I want `AGENTS.md` and `CLAUDE.md` to match the current repository shape so AI agents start from the correct `/app` frontend, production-stack status, and delivery rules.

### US2: Reuse Before New Code

As a reviewer, I want the engineering reuse rule and module-size discipline written into the onboarding contract so future implementation PRs can reject duplicated responsibilities and oversized modules early.

### US3: No Stale `/web` Surface

As a developer, I want leftover `/web` scaffolding and codegen references removed so tooling and deploy filters do not imply that a second web frontend still exists.

## Acceptance Criteria

- AC-001: `AGENTS.md` describes `/app` as the canonical web frontend and does not tell agents to migrate active work to `/web`.
- AC-002: `AGENTS.md` removes stale HTML-prototype source-of-truth routing for implementation work and points feature work at the implemented `/app` screens first.
- AC-003: `AGENTS.md` documents a mandatory reuse-check before adding new modules/functions/components/services/adapters/schemas/helpers.
- AC-004: `AGENTS.md` documents module-size and complexity thresholds as review signals, not hard CI failures.
- AC-005: `CLAUDE.md` is reduced to Claude-specific context and links back to canonical `AGENTS.md` sections instead of duplicating the full onboarding tables.
- AC-006: `/app` ESLint and optional `/api` golangci-lint configuration expose module-size/complexity warnings without failing required checks solely because warnings are present.
- AC-007: The obsolete `/web` directory and `/web` API-client generation target are removed.
- AC-008: The dev CD workflow path filter no longer treats `web/**` as deploy-relevant.
- AC-009: This PR includes complete feature memory (`spec.md`, `plan.md`, `tasks.md`) for the product-root support changes.
- AC-010: Affected source docs and specs describe `/app` as the canonical web frontend and do not instruct agents to build, generate, or retarget current web work under `/web`.

## Negative Scenarios

- NS-001: Do not add `SUPABASE_*` env, Supabase clients, or any retired Supabase coupling while updating agent instructions.
- NS-002: Do not make module-size warnings block the required `lint`, `baseline-checks`, `guard`, or `test` checks.
- NS-003: Do not remove active `/app`, `/api`, `/mobile`, `/infra`, `docs_capsule_zero`, or `.specify` source-of-truth paths while deleting the obsolete `/web` leftovers.
- NS-004: Do not claim application behavior changed; this is documentation and support-tooling cleanup only.

## TDD Waiver

This spec is documentation and support-tooling cleanup, plus deletion of an obsolete generated-client directory. It does not change web UI behavior, React Native behavior, Go API behavior, or runtime business logic. Per the project TDD rule for specs >= 025, the failing-test-first loop applies to application code only; this spec is verified with config validation, feature-memory guard evidence, and relevant existing checks recorded in `plan.md`.

## Requirements

- FR-001: Keep `AGENTS.md` as the canonical cross-agent onboarding document.
- FR-002: Keep `CLAUDE.md` as Claude-specific context only, with links back to canonical onboarding rules.
- FR-003: Keep module-size discipline advisory by using warnings or optional linters, not required hard failures.
- FR-004: Remove obsolete `/web` codegen and deploy references so the repository presents a single `/app` web frontend.
- FR-005: Preserve the No Supabase / legacy-backend recoupling rule.
- FR-006: Satisfy the feature-memory guard for product-root support changes by adding this complete spec folder.
- FR-007: Resolve review feedback by actualizing stale source docs and scaffold READMEs that still referenced `/web`, Traefik, active pgvector, or obsolete migration tooling as current guidance.

## Success Criteria

- SC-001: The PR guard accepts the feature-memory update for product-root changes.
- SC-002: Required checks complete without failures attributable to stale `/web` references or module-size warning configuration.
- SC-003: Reviewers can understand from the PR and feature memory why this is docs/support-tooling scope and why TDD is waived.

## Assumptions

- `/app` remains the canonical Next.js frontend after PR #57; spec-024 Phase 2 remains pending in the current tree.
- `/web` contained only obsolete scaffolding plus a generated client and is not used by current runtime, tests, or deploy paths.
- `eslint .` does not fail on warnings unless invoked with `--max-warnings`.
- `api/.golangci.yml` is optional configuration; required Go checks use `go vet` and `gofmt`.
