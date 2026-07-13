# Tasks: Remove Stale Flutter Mobile Shell

## Setup

- [x] Refresh git state from GitHub with `git fetch --all --prune`.
- [x] Inspect PR #61 metadata, required checks, and review threads.
- [x] Confirm the active PR branch is checked out in `worktrees/mobile-flutter-cleanup`.

## Implementation

- [x] Remove the stale Flutter/Dart mobile shell from `mobile/`.
- [x] Replace `mobile/README.md` with a React Native placeholder and cleanup warning.
- [x] Remove Dart and mobile output targets from `scripts/generate-api-clients.mjs`.
- [x] Remove stale Flutter/mobile runtime checks and retired mobile env validation from local tooling.
- [x] Correct `docs_capsule_zero/project/mobile/mobile-docs.md` to acknowledge the removed Sprint 0 shell.
- [x] Defer the documented mobile generated-client artifact in `docs_capsule_zero/adr/api-spec.md` and the Phase 5 entrance checklist until the React Native scaffold defines its path.
- [x] Add this feature memory package after `guard` and Review identified the missing SENAR artifacts.
- [x] Restore the `plan.md` verification table after PR #60 merge/review exposed unescaped grep alternation pipes.

## Verification

- [x] Run the local commands listed in `plan.md`.
- [x] Confirm `guard` passes locally through `node scripts/check-feature-memory.mjs origin/main HEAD`.
- [ ] Push the branch and confirm required GitHub checks are green on the new head SHA.
- [ ] Update PR #61 body with the SENAR Done Gate.

## Process Memory

### Dead Ends

- Treating this PR as "no product behavior change, no feature memory needed" was rejected by both `guard` and Review because `mobile/` is a product root.
- Changing `scripts/check-feature-memory.mjs` to exempt deletion-only mobile diffs was rejected; that would weaken the product-root policy for a one-off cleanup.
- Rewriting grandfathered Sprint 0 specs was rejected because those files accurately record historical work and should not be edited to hide a stale scaffold.

### Decisions

- Add a dedicated `030-remove-stale-flutter-mobile-shell` feature-memory package because this PR changes product-root files under `mobile/`.
- Keep `mobile/README.md` as the sole tracked mobile file until the future React Native scaffold defines real source paths and generated-client placement.
- Keep web and legacy `app/` TypeScript client generation intact while deleting only stale mobile targets and Dart generation.
- Remove the `mobile` runtime-env surface with the deleted mobile env file so default env validation no longer requires retired mobile Supabase variables.
- Defer the physical mobile generated-client artifact in API/architecture docs instead of keeping a dead `mobile/lib/api/generated/` target without a scaffold.
- Use command-backed verification instead of TDD because the change removes a retired scaffold and leaves no executable mobile app behavior to test.
- Keep grep alternation commands in fenced blocks, not table cells, so SENAR verification tables remain two-column Markdown.

### Known Issues

- The React Native scaffold is still future work and must arrive in its own later spec.
- The future React Native scaffold must define its own env surface; this cleanup intentionally does not preserve legacy mobile Supabase env validation.
- The future React Native scaffold must also restore mobile TypeScript client generation when it defines the source layout.
- GitHub review must be refreshed after each fix commit because review findings attach to a specific PR head SHA.
- PR #61 may have a small mechanical overlap with a separate generator/docs cleanup PR if that PR merges first.
