# Tasks: Stage 1 Dashboard

**Input**: `.specify/specs/011-stage-1-dashboard/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, CI state, and `origin/main` before branch creation.
- [x] T003 Create branch `codex/stage-1-dashboard` from current `origin/main`.
- [x] T004 Fetch current Next.js and next-intl documentation through Context7.
- [x] T005 Read approved dashboard prototype, feature docs, screen docs, current dashboard placeholder, i18n messages, and mock provider fixtures.

## Phase 2: Feature Memory

- [x] T006 Create SENAR spec, plan, and tasks files for `011-stage-1-dashboard`.

## Phase 3: Dashboard Data and Routing

- [x] T007 Build a dashboard view model from mock profile, current capsule, wardrobe items, and gap analysis.
- [x] T008 Update `/[locale]/dashboard` route to require mock session and pass dashboard data into the UI.

## Phase 4: Dashboard UI

- [x] T009 Replace placeholder dashboard shell with filled dashboard layout from `html-prototypes/dashboard.html`.
- [x] T010 Add desktop sidebar, topbar, language switcher, sign-out, capsule hero, OPR widget, stats, shopping preview, recently added, quick access cards, bottom nav, and more sheet.
- [x] T011 Add EN/RU dashboard message coverage.
- [x] T012 Add responsive dashboard CSS with glass surfaces and no active ES-AR controls.

## Phase 5: Verification

- [x] T013 Run `npm run check:feature-memory -- --worktree`.
- [x] T014 Run `npm --prefix app run lint`.
- [x] T015 Run `npm --prefix app run typecheck`.
- [x] T016 Run `npm --prefix app run build`.
- [x] T017 Run `npm run preflight`.
- [x] T018 Run `git diff --check`.
- [x] T019 Start local dev server.
- [x] T020 Browser smoke-check unauthenticated redirect, mock login dashboard, RU dashboard, mobile viewport, and EN/RU-only language controls.

## Process Memory

### Dead Ends

- Port `3000` was occupied by an older Next dev server for the same `app/` directory. Starting on `3001` was rejected by Next because another dev server for the project was already running; stopping the stale PID allowed a fresh local server on `3000`.
- The first mobile Browser check showed stale Turbopack dev CSS that omitted newly added dashboard media rules, while the production build CSS contained them. Clearing `app/.next/dev` and restarting the dev server fixed local review CSS.

### Decisions

- Use `011-stage-1-dashboard` because `010-stage-1-landing-auth` is merged and its only known issue is the intentionally minimal dashboard target.
- Start from `origin/main` instead of local `main` because local `main` is stale and diverged.
- Keep dashboard data deterministic and fixture-backed through the existing mock provider registry; real provider integration remains a separate gate.
- Keep dashboard wardrobe/capsule data scoped to the signed-in mock session user. Arbitrary mock-session emails now render the empty dashboard state instead of borrowing the founder fixture wardrobe.
- Keep requested dashboard icon swaps scoped to new explicit icon names so existing non-menu icon usage remains unchanged.
- Let the mobile More button sit above the open sheet/overlay only while expanded so a second tap can close the menu.
- Keep all bottom-nav items visible while the mobile More sheet is open, and raise the sheet above the bottom nav so its Settings item remains clickable.
- Use the prototype pin SVG for the active capsule eyebrow, while leaving the separate capsule navigation icons unchanged.
- Make the mobile bottom nav nearly opaque but lighter than the More sheet so scrolled content cannot show through it.
- Disable primary Add Item / Create Capsule controls until the Guided Journey route lands, so dashboard CTAs do not route users into a 404.
- Disable active-capsule Open Capsule / Outfits controls until the Capsule Result route lands; keep the Shopping List action live because it targets the current dashboard section.

### Known Issues

- Destination screens linked from dashboard are still future slices unless already implemented; primary journey and capsule hero CTAs are disabled rather than linked until their routes exist.

### Verification Evidence

- `npm --prefix app run lint` passed.
- `npm --prefix app run typecheck` passed.
- `npm --prefix app run build` passed.
- `npm run check:feature-memory -- --worktree` passed.
- `npm run check:repo` passed.
- `npm run check:api-contract` passed and verified generated clients for 43 operations.
- `npm run preflight` passed.
- `git diff --check` passed.
- Fresh local dev server started at `http://127.0.0.1:3000`.
- Browser check confirmed unauthenticated `/en/dashboard` redirects to `/en/auth`.
- Browser check confirmed mock login with `founder@example.com` redirects to `/en/dashboard`.
- Browser DOM check confirmed EN dashboard renders active capsule, OPR, shopping list preview, recent items, quick-access cards, desktop sidebar, 10 glass dashboard surfaces, and no Spanish/ES-AR controls.
- Browser DOM check confirmed `/ru/dashboard` renders with `<html lang="ru">`, Russian dashboard/navigation labels, EN/RU-only language options, and no Spanish/ES-AR controls.
- Mobile Browser check at `375x812` confirmed no horizontal overflow, sidebar hidden, bottom nav visible, content bottom padding preserved, and More sheet opens with 7 items.
- Desktop Browser check at `1280x900` confirmed sidebar visible, bottom nav hidden, no horizontal overflow, dashboard content present, and no console errors.
- `npm run preflight` passed again after the icon and mobile menu adjustments.
- Fresh local dev server restarted at `http://127.0.0.1:3000` after clearing `app/.next/dev` for an up-to-date Turbopack bundle.
- Browser DOM audit confirmed My Items, Outfits, Capsules, and For Repair use the prototype SVGs in desktop sidebar and mobile bottom/more navigation.
- Browser DOM audit confirmed sidebar logout uses the dedicated exit icon.
- Mobile Browser check at `375x812` confirmed bottom nav and More sheet backgrounds compute to `rgba(255, 255, 255, 0.38)`.
- Mobile Browser check confirmed tapping More opens the sheet, raises bottom nav above overlay/sheet, then a second tap closes the sheet and hides the overlay.
- Mobile Browser check confirmed the open More sheet background computes to `rgba(14, 14, 14, 0.96)`, all bottom-nav items remain visible, the sheet bottom sits above the bottom-nav top, Settings remains clickable, and the More trigger still closes the sheet on the second tap.
- Browser DOM audit confirmed the active capsule pin icon uses the prototype `0 -1 14 15` SVG with rect, ellipse, and polygon shapes.
- Mobile Browser check confirmed bottom nav background computes to `rgba(36, 36, 36, 0.98)`, More sheet remains darker at `rgba(14, 14, 14, 0.96)`, Settings stays above the nav, and the second More tap still closes the sheet.
- AI Review follow-up removed demo-fixture fallback from dashboard data loading so wardrobe/capsule data remains scoped to `session.userId`.
- AI Review follow-up converted `/guided-journey` primary dashboard CTAs into disabled controls while the route is not implemented.
- `npm run preflight` passed after the AI Review fixes.
- `git diff --check` passed after the AI Review fixes.
- Mobile Browser DOM check confirmed no `/guided-journey` anchors are exposed, the primary Add Item control is a disabled button, the More sheet opens and closes on repeated taps, bottom nav background remains `rgba(36, 36, 36, 0.98)`, More sheet remains `rgba(14, 14, 14, 0.96)`, and Settings stays above the bottom nav.
- Second AI Review follow-up converted active-capsule Open Capsule / Outfits CTAs into disabled controls while `/capsule-result` is not implemented.
- `npm run preflight` and `git diff --check` passed after the second AI Review fix.
- Mobile Browser DOM check confirmed Open Capsule / Outfits render as disabled buttons without `href`, no primary `/capsule-result` or `/guided-journey` CTA links remain, and Shopping List still links to `/en/dashboard#shopping-list`.
- Third AI Review follow-up changed recent-item labels to derive from each item's `updatedAt` calendar date instead of the item's list position.
- Browser DOM check on 2026-06-08 confirmed the seeded 2026-06-01 recent items render as `1 week ago` instead of position-based `Today`, `2 days ago`, or `4 days ago`.
