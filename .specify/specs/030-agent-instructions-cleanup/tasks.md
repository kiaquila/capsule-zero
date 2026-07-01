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

## Verification

- [x] Run `node scripts/check-feature-memory.mjs --worktree` before commit and `node scripts/check-feature-memory.mjs origin/main HEAD` after commit.
- [x] Run `cd app && npm run lint`.
- [x] Validate `api/.golangci.yml` parses as YAML.
- [x] Verify obsolete `/web` paths and codegen target are absent.
- [x] Verify the dev CD path filter no longer includes `web/`.
- [x] Run focused stale-reference scans for `/web`, Traefik-as-current-gateway, and obsolete migration-tool guidance.
- [ ] Re-check PR #60 GitHub checks after pushing the fix.

## Process Memory

### Dead Ends

- Treating the PR as docs-only was insufficient because the diff also touches product-root support files under `app/`, `api/`, and `web/`; the guard correctly required complete feature memory.
- Relaxing or bypassing the guard was rejected. The safer fix is to add the missing spec/plan/tasks evidence for the support-tooling scope.
- Updating only `AGENTS.md` was insufficient after AI Review found older source docs still pointing agents toward `/web`; the fix expanded to the affected docs/spec/test guidance instead of narrowing the review comment away.

### Decisions

- Use a new spec folder, `030-agent-instructions-cleanup`, because the existing specs stop at 029 on the PR branch and this PR has its own support-tooling scope.
- Keep module-size enforcement advisory: ESLint rules are warnings, and golangci-lint remains opt-in rather than part of required CI.
- Keep the `/web` removal in scope because `/app` is the accepted canonical frontend and the deleted `/web` files were obsolete scaffolding/generated client leftovers.
- Use config validation and existing checks instead of failing-test-first TDD because this spec does not change application behavior.
- Treat `/web` mentions as acceptable only when they are explicit "do not use `/web`" policy, superseded history, or unrelated API route names such as `/api/webhooks/lava`.

### Known Issues

- GitHub checks must be re-run on the pushed commit before the PR can be considered merge ready.
- The prior AI Review P2 about stale `/web` source docs is addressed locally; a fresh AI Review must run on the new pushed SHA.
- Local `npm run lint` passes with 73 module-size/complexity warnings and 0 errors, matching the warning-only scope of this PR.
