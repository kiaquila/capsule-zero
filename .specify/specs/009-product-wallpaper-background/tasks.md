# Tasks: Product Wallpaper Background

**Input**: `.specify/specs/009-product-wallpaper-background/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm `origin/main` and current open PR/check status before creating this branch.
- [x] T003 Create `codex/product-wallpaper-background` from current `origin/main`.

## Phase 2: Asset Integration

- [x] T004 Copy the approved source PNG into `app/public/wall.png`.
- [x] T005 Copy the same approved source PNG into `html-prototypes/wall.png`.
- [x] T006 Confirm both PNG copies are byte-identical.
- [x] T007 Confirm no experiment-only wallpaper preview files are present.

## Phase 3: Local Verification

- [x] T008 Run `npm run lint`.
- [x] T009 Run `npm run build`.
- [x] T010 Verify Next serves `/wall.png` locally.
- [x] T011 Verify `html-prototypes/auth.html` resolves `.hero-bg` to `wall.png` locally.
- [x] T012 Verify `html-prototypes/dashboard.html` resolves `.hero-bg` to `wall.png` locally.
- [x] T013 Run `npm run check:feature-memory -- --worktree`.

## Process Memory

### Dead Ends

- Direct shell reads from the Downloads source file were blocked by macOS file access (`Operation not permitted`). Finder duplication succeeded, after which the asset could be renamed and copied inside the workspace.
- Port `3100` was already occupied by an older Python static server that did not serve the current `html-prototypes/wall.png`; verification used a fresh current-directory server on `3101`.

### Decisions

- Created a clean branch from `origin/main` instead of using `codex/wallpaper-bg-experiment`.
- Kept product integration to static assets only because auth/dashboard already reference `wall.png`.
- Added feature memory after PR Guard identified `app/public/wall.png` as a product-path change requiring `.specify/specs/<feature-id>/` evidence.

### Known Issues

- None.

### Verification Evidence

- `npm run lint` passed.
- `npm run build` passed.
- `curl -fsSI http://127.0.0.1:3000/wall.png` returned HTTP 200.
- `curl -fsSI http://127.0.0.1:3101/auth.html` returned HTTP 200.
- `curl -fsSI http://127.0.0.1:3101/dashboard.html` returned HTTP 200.
- Browser verification showed auth `.hero-bg` resolving to `http://127.0.0.1:3101/wall.png`.
- Browser verification showed dashboard `.hero-bg` resolving to `http://127.0.0.1:3101/wall.png`.
- `shasum -a 256 app/public/wall.png html-prototypes/wall.png` matched: `8ab8dd3cdf640344bf7d99c88aa0625803775e7783ed799cb8c1f053bb820c0b`.
- `npm run check:feature-memory -- --worktree` passed after adding this feature memory.
