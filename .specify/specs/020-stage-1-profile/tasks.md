# Tasks: Stage 1 Profile

**Input**: `.specify/specs/020-stage-1-profile/spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Refresh GitHub state with `git fetch --all --prune`.
- [x] T002 Confirm open PR status, latest merged PR, current CI state, and local `main` divergence.
- [x] T003 Create branch `codex/stage-1-profile` from current `origin/main`.
- [x] T004 Fetch current Next.js and next-intl App Router documentation through Context7.
- [x] T005 Read Profile prototype, profile/i18n docs, MVP spec US-005 and US-018, and neighboring dashboard/wardrobe implementations.

## Phase 2: Feature Memory

- [x] T006 Create SENAR spec, plan, and tasks files for `020-stage-1-profile`.

## Phase 3: Route and Data

- [x] T007 Add Profile snapshot builder from mock provider fixtures and local mock preference overrides.
- [x] T008 Add feature-scoped Profile save action with Zod validation and mock persistence.
- [x] T009 Add authenticated `/{locale}/profile` route.
- [x] T010 Remove `profile` from future dashboard redirect routes.

## Phase 4: Profile UI

- [x] T011 Implement Profile shell with sidebar/topbar, language switcher, sign-out, bottom nav, and More sheet.
- [x] T012 Implement avatar preview, remove-photo, file-type and file-size validation.
- [x] T013 Implement personal information form with RHF/Zod, save feedback, and local profile updates.
- [x] T014 Implement notifications, preferred login method, 2FA, password, sessions, logout, and delete-account prototype sections.
- [x] T015 Add EN/RU Profile messages with no ES-AR active controls.
- [x] T016 Add scoped responsive CSS preserving glass tokens and achromatic UI.

## Phase 5: Verification

- [x] T017 Run React TSX best-practices checklist.
- [x] T018 Run JSON parse check for EN/RU messages.
- [x] T019 Run `npm run check:feature-memory -- --worktree`.
- [x] T020 Run `npm --prefix app run lint`.
- [x] T021 Run `npm --prefix app run typecheck`.
- [x] T022 Run `npm --prefix app run build`.
- [x] T023 Run `npm run preflight`.
- [x] T024 Start or reuse local dev server.
- [x] T025 Browser smoke-check unauthenticated redirect, EN/RU Profile, every prototype section, avatar preview/remove/validation, save, SMS warning, toggles, logout, no ES-AR controls, and mobile viewport.
- [x] T026 Apply review fixes: remove Replace, rename Remove photo, add username with server uniqueness stub, remove Profile language field, compact spacing, move logout/delete controls.
- [x] T027 Browser smoke-check review fixes: username taken/free flow, top language cookie flow, account row, delete outside form, compact dimensions.
- [x] T028 Apply Codex review fixes: enforce SMS phone prerequisite in the server action and render avatar previews in the sidebar avatar.
- [x] T029 Apply Codex review follow-ups: preserve persisted first/last-name boundaries and keep the external delete action above the fixed mobile bottom nav.
- [x] T030 Disable native Profile form validation so RHF/Zod inline validation handles invalid email/name/username inputs.

## Process Memory

### Dead Ends

- Browser file chooser upload is not exposed by the in-app Browser API, so avatar picker file selection was verified through source/CSS evidence rather than driving a real OS file dialog.

### Decisions

- Use `020-stage-1-profile` because `019-stage-1-for-repair` is merged and `profile` remains the only future-dashboard redirect destination.
- Start from `origin/main` instead of local `main` because local `main` is stale/diverged.
- Implement all prototype sections even though older MVP docs mark advanced settings as post-MVP, because the current user explicitly requested everything visible in the prototype.
- Keep real security/session/delete/password actions mock/design-only in Stage 1; they do not call external providers or destructively modify data.
- Keep language persistence owned by next-intl `NEXT_LOCALE` via the top-right switcher; do not persist language through the Profile form payload.
- Add username now as a Stage 1 mock preference with a server-side uniqueness stub; provider-backed uniqueness remains a follow-up PR.
- Mirror client-only prerequisites in server actions when the value affects persisted mock preferences; stale clients and direct server-action requests must not bypass Stage 1 negative scenarios.
- Treat persisted split form fields as canonical after save; display-name parsing is only a fallback for provider/session names.
- Keep native browser validation disabled on rich RHF/Zod forms where the design requires consistent inline yellow validation.

### Known Issues

- None.
