# Tasks: Remove Stale Flutter Mobile Shell

## Setup

- [x] Refresh git state from GitHub with `git fetch --all --prune`.
- [x] Inspect PR #61 metadata, required checks, and review threads.
- [x] Confirm the active PR branch is checked out in `worktrees/mobile-flutter-cleanup`.

## Implementation

- [x] Remove the stale Flutter/Dart mobile shell from `mobile/`.
- [x] Replace `mobile/README.md` with a React Native placeholder and cleanup warning.
- [x] Remove Dart and mobile output targets from `scripts/generate-api-clients.mjs`.
- [x] Remove stale Flutter/mobile runtime checks from local tooling.
- [x] Correct `docs_capsule_zero/project/mobile/mobile-docs.md` to acknowledge the removed Sprint 0 shell.
- [x] Add this feature memory package after `guard` and Codex Review identified the missing SENAR artifacts.

## Verification

- [x] Run the local commands listed in `plan.md`.
- [x] Confirm `guard` passes locally through `node scripts/check-feature-memory.mjs origin/main HEAD`.
- [ ] Push the branch and confirm required GitHub checks are green on the new head SHA.
- [ ] Update PR #61 body with the SENAR Done Gate.

## Process Memory

### Dead Ends

- Treating this PR as "no product behavior change, no feature memory needed" was rejected by both `guard` and Codex Review because `mobile/` is a product root.
- Changing `scripts/check-feature-memory.mjs` to exempt deletion-only mobile diffs was rejected; that would weaken the product-root policy for a one-off cleanup.
- Rewriting grandfathered Sprint 0 specs was rejected because those files accurately record historical work and should not be edited to hide a stale scaffold.

### Decisions

- Add a dedicated `030-remove-stale-flutter-mobile-shell` feature-memory package because this PR changes product-root files under `mobile/`.
- Keep `mobile/README.md` as the sole tracked mobile file until the future React Native scaffold defines real source paths and generated-client placement.
- Keep web and legacy `app/` TypeScript client generation intact while deleting only stale mobile targets and Dart generation.
- Use command-backed verification instead of TDD because the change removes a retired scaffold and leaves no executable mobile app behavior to test.

### Known Issues

- The React Native scaffold is still future work and must arrive in its own later spec.
- GitHub AI Review must be refreshed after the feature-memory commit because the existing review was attached to commit `c7dc302091`.
- PR #61 may have a small mechanical overlap with a separate generator/docs cleanup PR if that PR merges first.
