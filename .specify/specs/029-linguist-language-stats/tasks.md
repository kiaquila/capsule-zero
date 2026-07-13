# Tasks: Linguist Language Stats Hygiene

## Setup

- [x] Refresh git state from GitHub.
- [x] Create a dedicated worktree from `origin/main`.
- [x] Inspect the Unicorn Hub Linguist pattern and Capsule Zero's counted scaffolding/generated paths.

## Implementation

- [x] Add root `.gitattributes` Linguist hygiene block.
- [x] Add feature memory for spec 029.

## Verification

- [x] Run `git check-attr` for scaffolding, prototypes, generated clients, tests, and hand-written product code.
- [x] Confirm the diff is metadata/feature-memory only.

## Process Memory

### Dead Ends

- A broad `tests/**` override was rejected because the founder explicitly wants test code to remain counted in the Languages widget.
- Hiding legacy Supabase/infra SQL and shell paths was rejected for this change. Those files are scheduled for deletion or migration cleanup; masking them in Linguist would blur the difference between generated/scaffolding code and historical implementation code.

### Decisions

- Use `linguist-vendored` for root `scripts/*.mjs` and Spec Kit shell helpers because they are repository process scaffolding rather than product implementation.
- Use `linguist-documentation` for `html-prototypes/**` because the approved prototypes are design/source-of-truth documentation, not runtime application code.
- Use `linguist-generated` for OpenAPI clients under `app`, `web`, and `mobile` because they are machine-generated from the API contract and duplicated across consumers.
- Leave `tests/**`, provider adapters, app routes, Go API code, and React Native source counted.

### Known Issues

- GitHub's Languages widget updates only after `.gitattributes` is committed to the default branch and GitHub recalculates repository language statistics.
- Local verification passed: vendored for `scripts/check-repo-baseline.mjs` and `.specify/scripts/bash/common.sh`; documentation for `html-prototypes/index.html`; generated for the `app`, `web`, and `mobile` OpenAPI clients; all queried attributes unspecified for representative `tests/**` files and hand-written product files.
