# Plan 031: Agent Instructions Cleanup

## Summary

Update the repository onboarding and support-tooling contract to match the current production-stack direction: `/app` is canonical, `/web` leftovers are removed, Claude-specific context is slimmed, and reuse/module-size discipline is documented with non-blocking warning configuration.

## Technical Context

- runtime changes: none
- application behavior changes: none
- dependencies: none
- product paths: `app/eslint.config.mjs`, `api/.golangci.yml`, `api/README.md`, deleted `web/**`
- support paths: `AGENTS.md`, `CLAUDE.md`, `.github/workflows/cd-dev.yml`, `scripts/generate-api-clients.mjs`, `infra/README.md`, `docs_capsule_zero/**`, `.specify/specs/**`, `tests/**`, `.specify/specs/031-agent-instructions-cleanup/`

## Scope Boundaries

- in scope: onboarding docs, advisory lint configuration, obsolete `/web` cleanup, source-doc actualization, feature-memory evidence
- out of scope: UI/API/runtime behavior, Supabase recoupling, generated-client regeneration for active consumers, required CI hard-gating of module-size warnings

## Constitution Check

- Spec-first: this feature folder records goal, scope, verification, and process memory before the PR is declared complete.
- Testable boundaries: verification uses existing repository checks and config inspection suitable for docs/support-tooling scope.
- PR-only: the change is prepared on the existing PR branch `docs/agent-instructions-cleanup`.
- Simplicity: update the canonical docs and remove stale paths directly instead of adding new indirection.
- Product quality: clearer onboarding reduces stale AI-agent work and documents reuse expectations before future implementation slices.
- No Supabase recoupling: the diff does not add Supabase env keys, clients, workflows, or runtime wiring.

## Verification

| Acceptance criterion | Evidence                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001               | V-001 shows `/app` as canonical and no `/app` to `/web` migration instruction.                                                                 |
| AC-002               | V-002 shows implementation routing starts from `/app` screens and no active `html-prototypes/` source-of-truth section remains.                |
| AC-003               | V-003 shows the reuse-check contract.                                                                                                          |
| AC-004               | V-004 shows thresholds are advisory review signals.                                                                                            |
| AC-005               | V-005 shows `CLAUDE.md` is slimmed and links back to canonical `AGENTS.md` rules.                                                              |
| AC-006               | V-006 exits 0 with module-size warnings only; V-007 verifies the optional Go linter config against golangci-lint v2.                           |
| AC-007               | V-008 verifies obsolete `/web` files and codegen target are gone.                                                                              |
| AC-008               | V-009 verifies the dev CD regex keeps `app/` and no longer includes `web/`.                                                                    |
| AC-009               | V-010 passes and reports feature-memory coverage via `.specify/specs/031-agent-instructions-cleanup/{spec,plan,tasks}.md`.                     |
| AC-010               | V-011 returns no current stale guidance hits; remaining `/web` mentions are explicit no-`/web` policy, superseded history, or API route names. |

Verification commands:

```bash
# V-001
rg -n "/web|canonical.*app|Frontend / provider decision" AGENTS.md

# V-002
rg -n "html-prototypes|implemented screen|/app frontend" AGENTS.md

# V-003
rg -n "Mandatory reuse-check|Before creating a new module" AGENTS.md CLAUDE.md

# V-004
rg -n "Module-size discipline|soft gate|warnings" AGENTS.md CLAUDE.md

# V-005
wc -l CLAUDE.md && rg -n "AGENTS.md" CLAUDE.md

# V-006
cd app && npm run lint

# V-007
docker run --rm -v "$PWD:/repo" -w /repo/api golangci/golangci-lint:v2.1.6 golangci-lint config verify

# V-008
test ! -e web && ! rg -n 'web/src/lib/api/generated|target: "web"' scripts/generate-api-clients.mjs

# V-009
rg -n "deploy_path_pattern" .github/workflows/cd-dev.yml

# V-010
node scripts/check-feature-memory.mjs origin/main HEAD

# V-011
! rg -n 'golang-migrate|Traefik forward|through Traefik|behind Traefik|with Traefik|\+ Traefik|Traefik \+|future home is .*/web|web/src/lib/api/generated|local build of .*/web|new home for the web frontend is .*/web' docs_capsule_zero AGENTS.md CLAUDE.md .specify tests --glob '!.specify/specs/024-production-stack-runtime/tasks.md' --glob '!.specify/specs/031-agent-instructions-cleanup/**'
! rg -n 'golang-migrate|traefik/|Traefik dynamic|CREATE EXTENSION pgvector|FTS \+ pgvector' api infra
```

Negative scenario evidence:

- NS-001: Diff review confirms Supabase references are policy text only; no workflow, lint config, codegen target, compose file, or runtime file adds `SUPABASE_*`, `@supabase`, or Supabase client wiring.
- NS-002: ESLint rules are configured as `warn`, and `api/.golangci.yml` is not invoked by required CI.
- NS-003: `git diff --name-only origin/main...HEAD` shows only obsolete `web/**` deletions and support/onboarding files; active `/app`, `/api`, `/mobile`, `/infra`, `docs_capsule_zero`, and existing `.specify` roots remain.
- NS-004: No UI, API handler, schema migration, provider, or runtime business-logic file is changed.
- Review P2: The stale `/web` source-of-truth documentation thread is addressed by updating `docs_capsule_zero`, `.specify`, and test docs to the `/app` canonical path.

## Risks

- Risk: A future agent may treat module-size thresholds as hard requirements and over-split code.
  Mitigation: document the thresholds as review signals and configure automated checks as warnings/optional only.

- Risk: Removing `/web` could be mistaken for removing the current frontend.
  Mitigation: `AGENTS.md` explicitly states `/app` is canonical and no `/app` to `/web` rename is planned.

- Risk: Docs/support-tooling changes under product roots trigger the guard.
  Mitigation: add complete feature memory for this PR and verify with `scripts/check-feature-memory.mjs`.
