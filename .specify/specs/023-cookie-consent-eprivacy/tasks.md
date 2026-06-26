# Tasks: Cookie Consent ePrivacy Flow

**Input**: `.specify/specs/023-cookie-consent-eprivacy/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Inspect PR #44 metadata, comments, checks, and current head branch from GitHub.
- [x] T003 Confirm the primary repository worktree was not on PR #44 and create a separate clean worktree at `/Users/kristina.kurashova/projects/capsule-zero-pr44`.
- [x] T004 Check PR review threads and confirm no unresolved review comments existed before this iteration.
- [x] T005 Inspect failing GitHub check logs for `guard` and `AI Review`.

## Phase 2: Implementation

- [x] T006 Merge current `origin/main` into `claude/cookie-consent-eprivacy` so PR #44 is no longer behind main.
- [x] T007 Remove the duplicate legal CSS block introduced by the merge and keep the `origin/main` legal styles that use nav glass tokens.
- [x] T008 Add SENAR feature memory under `.specify/specs/023-cookie-consent-eprivacy/`.
- [x] T009 Capture cookie consent goal, scope, acceptance criteria, negative scenarios, and success criteria in `spec.md`.
- [x] T010 Map acceptance criteria to command-backed or source-backed evidence in `plan.md`.
- [x] T011 Record process memory in this `tasks.md` before declaring the work ready.

## Phase 3: Verification

- [x] T012 Install app dependencies in the clean PR worktree with `npm ci --prefix app`.
- [x] T013 Run `npm --prefix app run lint`.
- [x] T014 Run `npm --prefix app run typecheck`.
- [x] T015 Run `npm --prefix app run build`.
- [x] T016 Run `node scripts/check-feature-memory.mjs origin/main HEAD`.
- [x] T017 Run `git diff --check origin/main...HEAD`.
- [ ] T018 Commit and push the PR branch.
- [ ] T019 Trigger Codex review with a top-level `@codex review` PR comment from the authenticated `kiaquila` GitHub account.
- [ ] T020 Recheck GitHub PR #44 checks and review output after the pushed iteration.

## Process Memory

### Dead Ends

- The starting local checkout was `codex/sidebar-language-fixes` with many unrelated modified and untracked files, so working there would have risked mixing PR #44 with another branch's work.
- The first CI inspection command used `python`, but only `python3` is available in this shell.
- PR #44's `guard` failure was not a runtime failure; it was the repository feature-memory gate requiring `spec.md`, `plan.md`, and `tasks.md` for product `app/` changes.
- The previous `AI Review` run timed out waiting for Codex review output at head `28ee9a7`, so the updated head needs a fresh `@codex review` trigger.
- Merging `origin/main` brought in legal page styles and created a duplicate legacy legal CSS block; removing the duplicate was necessary before verification.

### Decisions

- Use a separate worktree at `/Users/kristina.kurashova/projects/capsule-zero-pr44` to avoid touching unrelated local changes.
- Merge `origin/main` instead of rebasing so the PR branch can be pushed without force-updating the existing branch.
- Name the feature-memory folder `023-cookie-consent-eprivacy` because `022-legal-documents-pages` already exists on current `origin/main`.
- Keep the cookie consent feature memory focused on the actual PR behavior and record the legal CSS duplication only as merge cleanup.
- Treat source inspection as acceptable evidence for storage-shape, malformed-storage, GPC, and ES-AR safety because those acceptance criteria map directly to deterministic code paths.

### Known Issues

- Real analytics, performance, or marketing SDK initialization remains out of scope; future integrations must gate on `useCookieConsent().hasConsent(category)`.
- Cookie preferences are localStorage-only and are not mirrored to a logged-in user profile or backend account yet.
- The PR does not add a standalone Cookie Policy route; policy text linkage remains a future legal/content scope item.
