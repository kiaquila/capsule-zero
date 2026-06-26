# Tasks: Legal Documents Pages

**Input**: `.specify/specs/022-legal-documents-pages/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm GitHub default branch is `main` and local `main` was stale versus `origin/main`.
- [x] T003 Create clean worktree branch `codex/legal-documents-layout` from fresh `origin/main`.
- [x] T004 Inspect existing legal-page implementation and requested screenshot revision.

## Phase 2: Implementation

- [x] T005 Add localized Terms of Use route.
- [x] T006 Add localized Privacy Policy route.
- [x] T007 Add structured legal content for Terms and Privacy documents.
- [x] T008 Add shared `LegalPage` renderer for section, list, and table blocks.
- [x] T009 Add Capsule Zero legal page styling in global CSS.
- [x] T010 Remove rendered intro/summary and highlight card blocks from Terms and Privacy.
- [x] T011 Combine title, inline Last updated / Status metadata, and numbered contents in one glass block.
- [x] T012 Keep article content in a separate aligned glass block below the index block.

## Phase 3: Verification

- [x] T013 Run `npm ci` in the clean PR worktree.
- [x] T014 Run `npm run lint`.
- [x] T015 Run `npm run typecheck`.
- [x] T016 Run `npm run build`.
- [x] T017 Browser-check Terms DOM for removed hero/highlight nodes and no horizontal overflow.
- [x] T018 Browser-check Privacy DOM for removed hero/highlight nodes and no horizontal overflow.
- [x] T019 Open PR #43.
- [x] T020 Inspect failed GitHub guard log and identify missing feature-memory requirement.
- [x] T021 Add this SENAR feature memory package.
- [x] T022 Address Codex review feedback by replacing the legal document switcher hard-coded glass values with nav glass tokens.
- [x] T023 Address Codex review feedback by replacing summary-like `plan.md` verification rows with concrete command, DOM JSON, source, build, and guard evidence artifacts.

## Process Memory

### Dead Ends

- Port 3000 was occupied by an existing SSH-backed process and served stale output, so visual verification used a fresh local Next.js dev server on port 3001.
- The current repository worktree contained many unrelated modified and untracked files, so the PR was created from a separate clean worktree instead of staging from the dirty tree.
- The initial PR guard failed because product `app/` paths changed without a matching `.specify/specs/<feature-id>/spec.md`, `plan.md`, and `tasks.md` package.
- AI Review later timed out waiting for review output on head `7b78644`, so the PR needed a fresh `@codex review` trigger after the feedback fix.
- AI Review then blocked on summary-like SENAR verification rows in `plan.md`; replacing those rows with concrete artifacts was required before retriggering review.

### Decisions

- Use a structured `legal-content.ts` module rather than static markdown or duplicated page markup.
- Keep `summary`, `intro`, and `highlights` in the legal document data model for metadata and future editorial flexibility, but omit the intro and highlights from the current rendered layout per the user's redesign request.
- Create the PR from fresh `origin/main` to avoid carrying unrelated local work from `codex/sidebar-language-fixes`.
- Open the PR as draft because it is intended for another agent/legal-review pass before merge readiness.
- Reuse `--glass-nav-bg`, `--glass-nav-blur`, and `--glass-nav-border` for the legal document switcher so it follows the established nav glass surface instead of creating a local variant.
- Keep SENAR evidence inside the feature plan as command-backed artifacts so reviewers can validate acceptance criteria without relying on prose summaries.

### Known Issues

- Legal entity name, registered address, dedicated contact, and final governing-law details remain launch placeholders and need counsel/founder confirmation before production publication.
- RU legal-copy translation is not included in this PR; EN copy is rendered under active localized routes until policy translation is explicitly scoped.
