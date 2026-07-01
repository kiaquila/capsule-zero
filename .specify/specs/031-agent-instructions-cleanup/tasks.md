# Tasks 031: Agent Instructions Cleanup

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
- [x] Address the fresh AI Review P2 for deferred pgvector/PgBouncer drift in read-first source docs.
- [x] Address the fresh AI Review P2 for SENAR grandfathering drift in `CLAUDE.md`.
- [x] Resolve the `origin/main` merge conflict after the Flutter/Dart mobile shell removal landed.
- [x] Address the fresh AI Review P2s for spec-024 Phase 1 status and stale `api/`/`infra/` scaffold guidance.
- [x] Address the fresh AI Review P2/P3 for profiled nginx bootstrap commands and stale `/app` removal wording in e2e process memory.
- [x] Address the fresh AI Review P2 for profile-gated compose nginx in the steady-state Docker Compose runbook.
- [x] Address the fresh AI Review P2 for enabling rollback compose nginx in the normal production bootstrap runbook.

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

- Rename this support spec to `031-agent-instructions-cleanup` after merging `origin/main`, because `030-remove-stale-flutter-mobile-shell` landed first and now owns the `030` number.
- Keep module-size enforcement advisory: ESLint rules are warnings, and golangci-lint remains opt-in rather than part of required CI.
- Keep the `/web` removal in scope because `/app` is the accepted canonical frontend and the deleted `/web` files were obsolete scaffolding/generated client leftovers.
- Use config validation and existing checks instead of failing-test-first TDD because this spec does not change application behavior.
- Treat `/web` mentions as acceptable only when they are explicit "do not use `/web`" policy, superseded history, or unrelated API route names such as `/api/webhooks/lava`.
- Keep spec-024 Phase 2 on plain `postgres:16`; pgvector remains documented only as deferred ADR-007 work.
- Keep current onboarding aligned to the repository tree: Phase 1 has landed, Phase 2 is pending, and `/app` currently supports only `mock`/`supabase` provider modes until the API provider is implemented.
- Keep active v0.1 runtime docs limited to plain Postgres, direct `pgx` pooling, in-process queue workers, and syslog/traces; pgvector, PgBouncer, standalone `worker`, and Grafana stay deferred until ADR-007 promotion triggers fire.
- Treat old frontend-deletion notes as superseded history: `/app` stays canonical, and only Supabase env/provider code is retired domain by domain.
- Keep the dev CD deploy-relevant path docs aligned with `.github/workflows/cd-dev.yml`: `app/**` is active, `web/**` is absent.
- Keep active catalog-search docs FTS-first; hybrid pgvector ranking, embeddings, and vector indexes belong to the later semantic-search slice.
- Keep `CLAUDE.md` as a thin pointer to `AGENTS.md`: SENAR fields apply from spec `005-…` onward, while TDD starts at spec ≥ 025 application code.
- Preserve `origin/main`'s deferred React Native client-generation posture while keeping PR #60's canonical `/app` web client and no `/web` generator target.
- Include `api/` and `infra/` scaffold docs in stale-reference scans so future placeholder README drift is caught with source docs.
- Keep production compose commands that expect nginx on `--profile docker-edge`, because the edge service is intentionally profiled in `docker-compose.yml`.
- Keep `docker-compose-deploy.md` explicit about host nginx as the default edge and compose nginx as rollback-only under the `docker-edge` profile.
- Keep `sprint-0-runtime-provisioning.md` on the host-nginx production bootstrap path; `docker-edge` is rollback-only after host nginx is stopped.

### Known Issues

- GitHub checks must be re-run on the pushed commit before the PR can be considered merge ready.
- The prior AI Review P2 about stale `/web` source docs and the fresh P2s on golangci-lint, SENAR tables, pgvector evidence, Phase 2 status, provider-mode guidance, deferred runtime wording, stale canonical-frontend deletion wording, dev CD runbook filtering, read-first pgvector drift, and SENAR grandfathering drift are addressed locally; a fresh AI Review must run on the new pushed SHA.
- The `origin/main` merge conflict is resolved locally; PR checks must be re-run on the merge commit.
- The post-merge AI Review P2s about spec-024 Phase 1 status and stale scaffold docs are addressed locally; PR checks must be re-run on the new pushed SHA.
- The post-review P2/P3 about profiled nginx bootstrap commands and stale `/app` deletion wording is addressed locally; PR checks must be re-run on the new pushed SHA.
- The follow-up AI Review P2 about compose nginx being documented as default-active in `docker-compose-deploy.md` is addressed locally; PR checks must be re-run on the new pushed SHA.
- The follow-up AI Review P2 about enabling rollback compose nginx in the normal production bootstrap is addressed locally; PR checks must be re-run on the new pushed SHA.
- Local `npm run lint` passes with 73 module-size/complexity warnings and 0 errors, matching the warning-only scope of this PR.
- The 2026-07-01 review-iteration fixes (Phase 1 smoke row rewritten to host-nginx evidence in `024/plan.md`, Go file-size row documented as review-only in AGENTS.md/CLAUDE.md, host-edge update note in `024/tasks.md`, list-indentation repair in `dev-cd-pipeline.md`, rollback-profile clarification in `024/plan.md` Phase 1) are addressed locally; a fresh AI Review must run on the new pushed SHA.
- The 2026-07-01 iteration-2 AI Review P2s (compose `nginx` listed as active v0.1 service in `backend-docs.md` runtime table; rollback-edge command in `docker-compose-deploy.md` without a `systemctl stop nginx` precondition) are addressed locally; a fresh AI Review must run on the new pushed SHA.
