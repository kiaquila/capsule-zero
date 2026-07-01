# Tasks 030: Agent Instructions Cleanup

## Setup

- [x] Refresh git state from GitHub.
- [x] Inspect PR #60 metadata, changed files, and failing checks.
- [x] Read the guard failure log.
- [x] Work from the existing PR worktree at `worktrees/docs-agent-review`.

## Implementation

- [x] Update `AGENTS.md` to reflect `/app` as canonical and document reuse/module-size discipline.
- [x] Slim `CLAUDE.md` to Claude-specific pointers.
- [x] Add warning-only `/app` ESLint module-size/complexity rules.
- [x] Add optional `/api` golangci-lint module-size/complexity configuration.
- [x] Remove the obsolete `/web` directory and generated-client target.
- [x] Remove `web/**` from the dev CD deploy-relevant path filter.
- [x] Add complete feature memory for this support-tooling PR.
- [x] Address the AI Review P2 by actualizing stale `/web`, Traefik, and migration-tool references across source docs/specs/tests.
- [x] Address the fresh AI Review P2s for golangci-lint v2 schema, malformed SENAR verification tables, and deferred pgvector Phase 2 evidence.
- [x] Address the fresh AI Review P2s for premature Phase 2 landed status and unsupported `api` provider-mode guidance.
- [x] Address the fresh AI Review P2s for stale PgBouncer/pgvector/Grafana active-runtime language in ADR/runbook docs.
- [x] Address the fresh AI Review P2 for stale canonical-frontend deletion guidance in spec-024 process memory.
- [x] Address the fresh AI Review P2 for stale `web/**` deploy-relevant guidance in the dev CD runbook/spec.

## Verification

- [x] Run `node scripts/check-feature-memory.mjs --worktree` before commit and `node scripts/check-feature-memory.mjs origin/main HEAD` after commit.
- [x] Run `cd app && npm run lint`.
- [x] Validate `api/.golangci.yml` parses as YAML.
- [x] Verify obsolete `/web` paths and codegen target are absent.
- [x] Verify the dev CD path filter no longer includes `web/`.
- [x] Run focused stale-reference scans for `/web`, Traefik-as-current-gateway, and obsolete migration-tool guidance.
- [x] Validate `.golangci.yml` with `golangci/golangci-lint:v2.1.6` `config verify`.
- [ ] Re-check PR #60 GitHub checks after pushing the fix.

## Process Memory

### Dead Ends

- Treating the PR as docs-only was insufficient because the diff also touches product-root support files under `app/`, `api/`, and `web/`; the guard correctly required complete feature memory.
- Relaxing or bypassing the guard was rejected. The safer fix is to add the missing spec/plan/tasks evidence for the support-tooling scope.
- Updating only `AGENTS.md` was insufficient after AI Review found older source docs still pointing agents toward `/web`; the fix expanded to the affected docs/spec/test guidance instead of narrowing the review comment away.
- Running `golangci-lint run` is not meaningful until `/api` has a Go module; the config is still validated against golangci-lint v2 so the optional future soft gate will not fail at schema load.

### Decisions

- Use a new spec folder, `030-agent-instructions-cleanup`, because the existing specs stop at 029 on the PR branch and this PR has its own support-tooling scope.
- Keep module-size enforcement advisory: ESLint rules are warnings, and golangci-lint remains opt-in rather than part of required CI.
- Keep the `/web` removal in scope because `/app` is the accepted canonical frontend and the deleted `/web` files were obsolete scaffolding/generated client leftovers.
- Use config validation and existing checks instead of failing-test-first TDD because this spec does not change application behavior.
- Treat `/web` mentions as acceptable only when they are explicit "do not use `/web`" policy, superseded history, or unrelated API route names such as `/api/webhooks/lava`.
- Keep spec-024 Phase 2 on plain `postgres:16`; pgvector remains documented only as deferred ADR-007 work.
- Keep current onboarding aligned to the repository tree: Phase 1 has landed, Phase 2 is pending, and `/app` currently supports only `mock`/`supabase` provider modes until the API provider is implemented.
- Keep active v0.1 runtime docs limited to plain Postgres, direct `pgx` pooling, in-process queue workers, and syslog/traces; pgvector, PgBouncer, standalone `worker`, and Grafana stay deferred until ADR-007 promotion triggers fire.
- Treat old frontend-deletion notes as superseded history: `/app` stays canonical, and only Supabase env/provider code is retired domain by domain.
- Keep the dev CD deploy-relevant path docs aligned with `.github/workflows/cd-dev.yml`: `app/**` is active, `web/**` is absent.

### Known Issues

- GitHub checks must be re-run on the pushed commit before the PR can be considered merge ready.
- The prior AI Review P2 about stale `/web` source docs and the fresh P2s on golangci-lint, SENAR tables, pgvector evidence, Phase 2 status, provider-mode guidance, deferred runtime wording, stale canonical-frontend deletion wording, and dev CD runbook filtering are addressed locally; a fresh AI Review must run on the new pushed SHA.
- Local `npm run lint` passes with 73 module-size/complexity warnings and 0 errors, matching the warning-only scope of this PR.
