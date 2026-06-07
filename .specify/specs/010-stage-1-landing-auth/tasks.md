# Tasks: Stage 1 Landing and Auth

**Input**: `.specify/specs/010-stage-1-landing-auth/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status and `origin/main` before branch creation.
- [x] T003 Create branch `codex/stage-1-landing-auth` from current `origin/main`.
- [x] T004 Fetch current Next.js, next-intl, and React Hook Form documentation through Context7.
- [x] T005 Install `next-intl` in `app/`.

## Phase 2: Feature Memory and Docs Cleanup

- [x] T006 Create SENAR spec, plan, and tasks files for `010-stage-1-landing-auth`.
- [x] T007 Mark the completed payload-client follow-up in `.specify/specs/003-sprint-0-foundation/tasks.md`.
- [x] T008 Update frontend docs for the current Next.js baseline and now-installed `next-intl`.

## Phase 3: Locale Routing and Messages

- [x] T009 Add next-intl routing/request/proxy setup.
- [x] T010 Add EN and RU message files seeded from `docs_capsule_zero/i18n/ui-texts.md`; keep ES-AR deferred to MVP v2.
- [x] T011 Update root and locale layouts/routes.

## Phase 4: Landing and Auth UI

- [x] T012 Implement landing shell from `html-prototypes/index.html`.
- [x] T013 Implement language switcher and cookie banner.
- [x] T014 Implement reusable auth panel from `html-prototypes/auth.html`.
- [x] T015 Implement standalone auth page.

## Phase 5: Mock Auth Boundary

- [x] T016 Add shared auth validation schemas.
- [x] T017 Add server actions for login, registration, recovery, and sign-out.
- [x] T018 Add mock session cookie utilities.
- [x] T019 Add minimal dashboard redirect target.
- [x] T020 Update `Locale` type to `en | ru`.

## Phase 6: Verification

- [x] T021 Run `npm run check:feature-memory -- --worktree`.
- [x] T022 Run `npm run check:repo`.
- [x] T023 Run `npm run check:api-contract`.
- [x] T024 Run `npm --prefix app run lint`.
- [x] T025 Run `npm --prefix app run typecheck`.
- [x] T026 Run `npm --prefix app run build`.
- [x] T027 Run `npm run preflight`.
- [x] T028 Run final `git diff --check`.
- [x] T029 Start local dev server.
- [x] T030 Open local app in Chrome and smoke-check landing/auth/dashboard.

## Process Memory

### Dead Ends

- Initial `mkdir` failed because zsh treated `[locale]` as a glob; quoted paths fixed it.
- The first build failed because `next-intl` needed the Next plugin in `next.config.ts`; adding `createNextIntlPlugin("./src/i18n/request.ts")` fixed prerendering.
- Next 16.2.6 warned that `middleware` is deprecated; moved the next-intl routing hook to `app/src/proxy.ts`.
- React lint rejected synchronous cookie-banner state updates inside an effect; `useSyncExternalStore` now reads local storage without that lint failure.

### Decisions

- Use a new `010-stage-1-landing-auth` feature memory folder because `009` is already the merged product wallpaper background slice.
- Use `next-intl` now rather than local ad hoc dictionaries because product screens must not start with hardcoded user-facing strings.
- Keep auth backed by server actions plus a mock session cookie because Supabase credentials remain an integration gate.
- Keep `/[locale]/dashboard` as a minimal redirect target only, so auth success is not a dead route while the full dashboard feature remains a later slice.
- Remove ES-AR from active MVP v1 routing, generated clients, profile language enum, and language switchers; keep Spanish copy as MVP v2 reference material in docs only.
- Add `@swc/helpers@0.5.23` explicitly because `next-intl` installs `@swc/core@1.15.40`, whose optional peer requires helpers `>=0.5.17`; CI's `npm ci --prefix app` rejects the lockfile when only Next's pinned `0.5.15` helper is present.

### Known Issues

- The dashboard route in this slice is only the auth redirect target, not the full `f-003-dashboard` implementation.

### Verification Evidence

- `npm run check:feature-memory -- --worktree` passed.
- `npm run check:repo` passed.
- `npm run check:api-contract` passed and verified generated clients for 43 operations.
- `npm --prefix app run lint` passed.
- `npm --prefix app run typecheck` passed.
- `npm --prefix app run build` passed and generated `/en`, `/ru`, `/auth`, `/dashboard`, and `/api/health`.
- `npm run preflight` passed after the EN/RU locale-scope update, API-client regeneration, cookie-banner visibility fix, and modal blur workaround.
- `git diff --check` passed.
- Local dev server started at `http://127.0.0.1:3000`.
- Chrome smoke check passed for `/en` landing, invalid auth inline errors, valid mock login redirect to `/en/dashboard`, RU landing text, standalone `/en/auth`, cookie banner on a clean local origin, EN/RU-only language options, mobile wallpaper position, and absence of Google/Apple controls.
- Chrome computed style check confirmed auth and cookie glass surfaces use `rgba(255, 255, 255, 0.38)` with `backdrop-filter: blur(64px) saturate(1.18)`.
- `npx -y npm@10.9.2 ci --prefix app` passed after the explicit `@swc/helpers@0.5.23` dependency was added for CI lockfile parity.
