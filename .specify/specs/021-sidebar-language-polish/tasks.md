# Tasks: Sidebar Icons and Language Menu Polish

**Input**: `.specify/specs/021-sidebar-language-polish/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Compare local `main` with `origin/main` and create branch `codex/sidebar-language-fixes` from current `origin/main`.
- [x] T003 Inspect Dashboard navigation icon definitions and duplicate wardrobe sidebar/menu implementations.
- [x] T004 Inspect existing auth, cookie, and language menu CSS surfaces.

## Phase 2: Implementation

- [x] T005 Export and reuse Dashboard icon types for duplicate wardrobe menus.
- [x] T006 Replace local shared navigation icon variants in capsule-result, favorites, for-sale, for-repair, my-items, and uncapsulated shells with Dashboard icon names.
- [x] T007 Keep capsule-result active-state behavior stable for outfits, capsule items, and gaps tabs.
- [x] T008 Restyle `.language-menu` with the elevated light glass surface used by auth and cookie popups.
- [x] T009 Preserve EN/RU-only language switcher behavior and avoid ES-AR exposure.

## Phase 3: Verification

- [x] T010 Run `npm run lint`.
- [x] T011 Run `npm run typecheck`.
- [x] T012 Run `npm run build`.
- [x] T013 Run `npm run ci:check`.
- [x] T014 Run `git diff --check`.
- [x] T015 Browser-check shared navigation SVG markup and icon dimensions across Dashboard, My Items, capsule-result, Favourites, For Sale, For Repair, and Uncapsulated routes.
- [x] T016 Browser-check language menu computed style and console cleanliness.
- [x] T017 Open PR #42.
- [x] T018 Request review.
- [x] T019 Add this SENAR feature memory after guard identified the missing spec/plan/tasks update.

## Process Memory

### Dead Ends

- A stale local Next.js dev server initially served old CSS chunks on port 3000; restarting the dev server was required before the language menu style verification reflected the current files.
- Starting a second Next.js dev server on another port was blocked because the same app directory already had an active dev instance.

### Decisions

- Treat Dashboard navigation as the canonical icon source for shared authenticated labels because it already matched the requested reference state.
- Keep local wardrobe sidebar components in place for this PR and only replace their shared icon source, limiting the blast radius to the requested visual consistency fix.
- Keep capsule-result tab active-state logic unchanged except for making the icon source shared.
- Style `.language-menu` through global CSS so every current `LanguageSwitcher` instance receives the same auth/cookie-like glass treatment.
- Add a dedicated `021-sidebar-language-polish` feature memory package because product app files changed after the SENAR guard layer shipped.

### Known Issues

- Several wardrobe screens still maintain local sidebar/menu models. They now share Dashboard icons, but a future cleanup can migrate them to the fully shared authenticated navigation frame.
