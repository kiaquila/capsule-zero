# GSD Architecture Convergence Validation

## Status

Advisory pilot complete. Stack direction confirmed. Formal native GSD
multi-reviewer convergence remains an optional follow-up, not a blocker for
merging this validation record.

This document records a GSD-style architecture convergence pass around founder
stack approval. It uses the current Capsule Zero source-of-truth documents and
the pinned GSD Core installer as evidence, but does not introduce `.planning/`
as a second durable planning surface.

## Goal

Validate whether `open-gsd/gsd-core` should be connected around stack approval,
record the confirmed Phase 4 stack posture, and identify remaining blockers
before real Supabase, OAuth, Lava.top, Flutter, and Photoroom provisioning.

## Source Inputs

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `.specify/specs/003-sprint-0-foundation/{spec,plan,tasks}.md`
- `docs_capsule_zero/project/architecture/phase-4-council.md`
- `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md`
- `docs_capsule_zero/adr/adr-001-stack.md`
- `docs_capsule_zero/adr/adr-002-auth.md`
- `docs_capsule_zero/adr/adr-003-storage.md`
- `docs_capsule_zero/adr/api-spec.md`
- `docs_capsule_zero/adr/openapi.yaml`
- `docs_capsule_zero/project/backend/backend-docs.md`
- `docs_capsule_zero/project/frontend/frontend-docs.md`
- `docs_capsule_zero/project/mobile/mobile-docs.md`
- `docs_capsule_zero/project/devops/sprint-0-runtime-provisioning.md`
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_storage_policies.sql`
- `supabase/tests/rls_contract.sql`
- `mobile/README.md`

## GSD Core Probe

| Check                | Result                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current docs         | Context7 resolved `/open-gsd/gsd-core` and confirmed existing-codebase mapping through `$gsd-map-codebase`, `.planning/codebase/*`, and plan-review convergence through `$gsd-plan-review-convergence`.                                       |
| Package freshness    | `npm view @opengsd/gsd-core@1.3.1 version dist-tags time --json` reported `latest = 1.3.1`, package created 2026-05-30, package modified 2026-06-04.                                                                                          |
| Installer smoke test | `npx --yes @opengsd/gsd-core@1.3.1 --help` completed and reported GSD Core `v1.3.1`.                                                                                                                                                          |
| Codex install probe  | `npx --yes @opengsd/gsd-core@1.3.1 --codex --global --config-dir /tmp/capsule-zero-gsd-codex-config --profile=standard` completed and installed 19 Codex skills, workflow assets, agents, hooks, and `VERSION = 1.3.1` under the temp config. |
| Repo safety          | No GSD-generated `.planning/`, `.codex/`, or workflow assets were committed.                                                                                                                                                                  |

Notes:

- The installer also wrote `~/.gsd/defaults.json` with
  `{"resolve_model_ids":"omit"}` even when a temp config dir was supplied.
- The current Codex App surface cannot reload those newly installed GSD slash
  skills inside the same session. A formal native GSD pass should be run from a
  fresh GSD-enabled Codex, Claude, or Gemini runtime.
- GSD's own `map-codebase` workflow allows sequential in-context mapping when a
  dedicated Agent tool is unavailable. This report follows that fallback pattern
  and commits the result as Capsule Zero architecture documentation.

## Repository Readiness Snapshot

| Area            | Current state                                                                                                              | Evidence                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Web baseline    | Next.js App Router app exists under `app/`; Tailwind v4 and frontend checks are wired.                                     | `docs_capsule_zero/project/frontend/frontend-docs.md`, `app/package.json`                                          |
| API contract    | OpenAPI is the implementation source for generated web and mobile metadata.                                                | `npm run check:api-contract` passed: 43 route-methods verified.                                                    |
| Supabase schema | Migration-backed tables, RLS enablement, seed methodology data, RPC signatures, and storage buckets exist.                 | `supabase/migrations/0001_initial_schema.sql`, `supabase/migrations/0002_storage_policies.sql`                     |
| RLS intent      | RLS test outline covers item ownership, public catalog reads, server-only Lava events, and ledger read-only client access. | `supabase/tests/rls_contract.sql`                                                                                  |
| Mobile shell    | Flutter scaffold and generated Dart API metadata exist; mobile payment posture is read-only.                               | `mobile/`, `mobile/lib/api/generated/openapi.dart`                                                                 |
| Runtime env     | Example env files cover web, mobile, billing, image, and embedding surfaces without secrets.                               | `npm run check:runtime-env -- --env app/.env.local.example --env mobile/.env.example --allow-placeholders` passed. |
| Runtime tooling | Node/npm/Docker are visible; Supabase CLI and Flutter SDK are missing on this machine.                                     | `npm run check:runtime-tooling -- --allow-missing` passed with expected missing-tool reports.                      |

## Convergence Summary

The accepted Phase 4 stack is confirmed and should be kept. The convergence pass
did not find a stack-replacement reason for Supabase, Flutter, Vercel, Lava.top
web purchases, Photoroom-with-adapter, or the shared OpenAPI/Supabase contract.

The main change is governance: Capsule Zero keeps an explicit architecture
convergence checkpoint. That checkpoint separates "architecture approved" from
"external services provisioned and verified".

### Decision Delta

| Decision area         | Result                  | Delta                                                                                                                                                 |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase backend      | Keep                    | Current migrations/RLS align with the accepted two-table item model. Do not replace with a custom backend for v0.1.                                   |
| PostgreSQL + pgvector | Keep                    | `item_embeddings.embedding vector(1536)` is already locked. Provider choice remains runtime config via `EMBEDDING_PROVIDER`.                          |
| Supabase Auth         | Keep                    | Web/mobile auth authority and RLS ownership remain coherent. OAuth dashboard configuration is still a user/provider action.                           |
| Supabase Storage      | Keep                    | Bucket split matches privacy and catalog needs. Real local/linked validation still requires Supabase CLI.                                             |
| Next.js/Vercel web    | Keep                    | Matches prototypes, i18n, web-only Lava purchase surface, and preview deployment needs.                                                               |
| Flutter mobile        | Keep                    | Native mobile scope remains justified by upload/camera workflow. Flutter SDK validation is still pending locally.                                     |
| Lava.top payments     | Keep with guard         | Web-only purchases plus mobile read-only balance remains the lowest-risk v0.1 posture. Do not add mobile purchase CTA without founder/legal approval. |
| Photoroom adapter     | Keep with gate          | Keep Photoroom primary and remove.bg fallback. Do not approve the image pipeline until real-image latency/quality evidence exists.                    |
| GSD Core              | Adopt as advisory pilot | Pin `@opengsd/gsd-core@1.3.1`; do not make it a required CI gate yet; do not commit `.planning/` as a source of truth until explicitly approved.      |

## Remaining Sprint 0 Blockers

These are not reasons to replace the stack. They are provider/setup blockers
before feature work can treat Sprint 0 as externally verified.

| ID          | Concern                                                                    | Required resolution                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCKER-001 | Real Supabase/OAuth/Lava.top/Photoroom provider evidence is still missing. | Complete the runtime provisioning evidence template before treating Sprint 0 as externally verified.                                                                 |
| BLOCKER-002 | Supabase CLI and Flutter SDK are missing in the current local environment. | Install/activate both tools before running `npm run check:supabase-local` and mobile boot validation, or collect equivalent evidence from another machine/CI runner. |

## Advisory Concerns

| ID      | Concern                                                                                                    | Disposition                                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ADV-001 | Generated API clients are currently operation metadata, not full payload clients.                          | Accept for Sprint 0 foundation; generate full payload clients before route-handler-heavy feature work.                     |
| ADV-002 | Photoroom spike needs at least 10 representative real wardrobe images and a real API key.                  | Defer to runtime provisioning; keep remove.bg fallback decision open.                                                      |
| ADV-003 | Mobile payment posture is deliberately conservative but still benefits from founder/legal acknowledgement. | Add explicit founder sign-off to stack approval evidence.                                                                  |
| ADV-004 | `.planning/` would duplicate `.specify`/ADR/SENAR if adopted uncritically.                                 | Keep Capsule Zero source of truth in existing docs; use GSD outputs as review inputs unless a later PR changes governance. |
| ADV-005 | Formal native GSD multi-reviewer convergence has not run in a fresh GSD-enabled runtime.                   | Optional follow-up only; run it later if the owner wants another reviewer loop, not as a merge or stack-approval blocker.  |

## Recommended Native GSD Runbook

Run this only after the owner chooses to perform a formal GSD pass.

```bash
npx --yes @opengsd/gsd-core@1.3.1 --codex --global --profile=standard
```

Then open a fresh GSD-enabled runtime in the repository and run:

```text
$gsd-map-codebase
$gsd-new-project
$gsd-plan-review-convergence 4 --codex --gemini --max-cycles 3
```

Use this repository policy while running it:

- Treat `.specify/`, `docs_capsule_zero/adr/`, and
  `docs_capsule_zero/project/architecture/` as the durable source of truth.
- Do not commit `.planning/` unless the owner explicitly accepts it as a
  durable planning surface.
- Translate any unresolved HIGH findings into
  `docs_capsule_zero/project/architecture/gsd-convergence-validation.md` or the
  Phase 5 entrance checklist before changing approved architecture decisions.

## Validation Commands

Commands run on branch `codex/gsd-architecture-validation`:

```bash
git fetch --all --prune
gh pr list --state open --json number,title,headRefName,baseRefName,isDraft,mergeStateStatus,url
gh run list --limit 5 --json databaseId,workflowName,status,conclusion,headBranch,event,createdAt,url
npx --yes @opengsd/gsd-core@1.3.1 --help
npx --yes @opengsd/gsd-core@1.3.1 --codex --global --config-dir /tmp/capsule-zero-gsd-codex-config --profile=standard
npm view @opengsd/gsd-core@1.3.1 version dist-tags time --json
npm ci --ignore-scripts
npm run check:repo
npm run check:api-contract
npm run check:runtime-tooling -- --allow-missing
npm run check:runtime-env -- --env app/.env.local.example --env mobile/.env.example --allow-placeholders
npm run check:feature-memory -- --worktree
npx prettier --check docs_capsule_zero/project/architecture/gsd-convergence-validation.md docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md .specify/specs/006-gsd-architecture-validation/spec.md .specify/specs/006-gsd-architecture-validation/plan.md .specify/specs/006-gsd-architecture-validation/tasks.md
git diff --check
```

## Stack Approval Recommendation

Proceed with the confirmed stack, but do not collapse the remaining setup work
into "externally verified" language.

Recorded approval posture:

> Founder confirms the Phase 4 stack direction: Supabase, Next.js/Vercel,
> Flutter, Lava.top web purchases with mobile read-only balance, and Photoroom
> behind an adapter. Implementation may continue through Sprint 0 provisioning
> gates. Feature work starts only after runtime evidence closes the remaining
> Sprint 0 blockers listed in this report and the Phase 5 entrance checklist.
