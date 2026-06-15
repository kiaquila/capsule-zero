# Implementation Plan: Stage 1 Profile

**Branch**: `codex/stage-1-profile` | **Date**: 2026-06-14 | **Spec**: `.specify/specs/020-stage-1-profile/spec.md`
**Input**: Feature specification from `.specify/specs/020-stage-1-profile/spec.md`

## Summary

Implement the authenticated Stage 1 Profile screen from the approved prototype, including full profile/settings surface, local mock interactivity, EN/RU language controls, and PR review readiness.

## Technical Context

**Language/Version**: TypeScript, React 19.2.3, Next.js 16.2.6 App Router
**Primary Dependencies**: Next.js App Router, next-intl, React Hook Form, Zod, Tailwind CSS v4 tokens, mock provider registry
**Storage**: Stage 1 mock provider fixtures plus small mock profile preference cookie and client-local avatar preview
**Testing**: `check:feature-memory`, JSON parse, ESLint, TypeScript, Next build, preflight, browser smoke checks
**Target Platform**: Mobile-first web, desktop 1280px+, tablet/mobile responsive layouts
**Project Type**: Next.js web application
**Performance Goals**: Keep route server-rendered for initial data, push profile form interactivity into a client shell
**Constraints**: Glassmorphism UI, achromatic interface, EN/RU only for MVP v1, provider-backed real writes remain integration-gated
**Scale/Scope**: One Stage 1 screen plus profile-specific mock actions and messages

## Constitution Check

- Glassmorphism UI: PASS; Profile uses existing dashboard glass shell plus profile cards on glass surfaces.
- Achromatic interface: PASS; validation/warnings use yellow, and no active colored UI accents were introduced.
- Direct, Not Dictate: PASS; destructive delete remains clearly mock/design-only and non-destructive.
- Premium quality bar: PASS; desktop, RU, mobile viewport, and More-sheet browser smoke checks passed.
- Three upload methods: N/A for this screen; avatar upload is profile-specific and local/mock.
- Engineering reuse: PASS; reused dashboard navigation, language switcher patterns, auth actions, provider contracts, RHF/Zod.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1-AC1 authenticated `/en/profile` renders Profile  | Browser smoke at `http://127.0.0.1:3000/en/profile`: `title: "Profile & Settings"`, `cards: 5`, `url: ".../en/profile"`. `npm --prefix app run build` route table includes `ƒ /[locale]/profile`.                                                                                                                                                                                                                                        |
| US1-AC2 every prototype section is visible           | Browser DOM snapshot sections: `Personal Information`, `Notifications`, `Login & Security`, `Account Management`; snapshot also includes profile header, active sessions, logout, and delete-account controls.                                                                                                                                                                                                                           |
| US2-AC1 default initials displayed without avatar    | Browser DOM snapshot: profile summary `button "Change photo"` contains default initials `CZ`; Remove button is disabled without an avatar preview.                                                                                                                                                                                                                                                                                       |
| US2-AC2 supported avatar preview appears circular    | Source evidence: `ProfileShell.tsx` creates a preview via `URL.createObjectURL`, restricts the picker to `image/jpeg,image/png`, and renders the same `avatarPreview` in the profile header and sidebar avatar; `globals.css` uses circular avatars with cropped image `object-fit: cover`.                                                                                                                                              |
| US2-AC3 remove avatar reverts to initials            | Browser/source evidence: profile avatar actions expose only `Remove photo` with no `Replace`; source clears `avatarPreview` and render falls back to initials when preview is empty.                                                                                                                                                                                                                                                     |
| US2-AC4 valid profile basics save locally            | Browser smoke: after saving Anna/Kozlova/`+54 11 5555 0100` and reloading, state remained `profileName: "Anna Kozlova"`, `phone: "+54 11 5555 0100"`, `warning: null`.                                                                                                                                                                                                                                                                   |
| US2-AC5 username uniqueness stub works               | Browser smoke saved `taken`: field error `This username is already taken.` and header stayed `@founder`; saved `kristina_style`: header/sidebar became `@kristina_style`.                                                                                                                                                                                                                                                                |
| US3-AC1 EN/RU language switch works                  | Browser smoke clicked the top-right language switcher and reached `http://127.0.0.1:3000/ru/profile`; H1 rendered `Профиль и настройки`. `curl -I` on `/ru/profile` showed `set-cookie: NEXT_LOCALE=ru`.                                                                                                                                                                                                                                 |
| US3-AC2 only EN/RU language options are exposed      | Browser smoke top language options were `EnglishEN` and `РусскийRU`; Profile form `languageFieldCount: 0`, so there is no duplicate language field.                                                                                                                                                                                                                                                                                      |
| US3-AC3 Preferred Login Method removed               | Product cleanup removed the Preferred Login Method block and its mock backend payload field because alternate login methods are out of Stage 1 scope. Source evidence: `ProfileShell`, `profile-data`, `features/profile/schemas.ts`, `actions.ts`, and `mock-profile-preferences.ts` no longer reference `preferredLoginMethod` or SMS-login warnings.                                                                                  |
| US3-AC4 logout clears session and returns to landing | Browser smoke clicked Profile account logout: result `url: "http://127.0.0.1:3000/ru"`, landing H1 visible, `hasProfileForm: false`; then mock login restored `/en/profile` for local review. AI Review follow-up keeps logout available in the shared mobile/tablet More sheet while the duplicate Profile `user_id` row logout remains removed.                                                                                             |
| FR-003 profile removed from future redirect route    | Source evidence: `app/src/app/[locale]/[future]/page.tsx:4` has `FUTURE_DASHBOARD_ROUTES = new Set<string>([])`, so `profile` no longer redirects through the future route.                                                                                                                                                                                                                                                              |
| FR-014 no ES-AR active controls                      | Browser smoke on RU Profile returned `bodyHasSpanishLocaleControls: false`; active language combobox exposes only `en` and `ru`.                                                                                                                                                                                                                                                                                                         |
| Fix pass: compact layout and account actions         | Browser smoke: `firstInputHeight: 37.5`, `cardPaddingTop: 20px`, `contentGap: 12px`; account head contained User ID + Log Out, and Delete Account was outside `.profile-content` with grey text. Codex review follow-up added mobile bottom-nav clearance to the external delete zone.                                                                                                                                                   |
| FR-019 shared authenticated navigation               | Source evidence: `DashboardNavigationFrame` owns sidebar, profile avatar row, desktop nav groups, mobile bottom nav, More sheet, settings, and logout; both `DashboardShell` and `ProfileShell` render through that component instead of duplicating nav models. Browser smoke verified Profile and Dashboard render the shared nav links/badges with no console errors, and mobile 390x844 More sheet opens from the shared bottom nav. |
| FR-020 dashboard reads saved profile preferences     | Browser smoke saved Profile values `Maya Rivera`, `maya.rivera@example.com`, and `Montevideo`, then opened `/en/dashboard`; Dashboard rendered `Welcome, Maya Rivera` and sidebar meta `maya.rivera@example.com` with no console errors. Source evidence: `buildDashboardSnapshot` reads `readMockProfilePreferences` before falling back to session/provider data.                                                                      |
| Local review polish: stable sidebar + language menu  | Source evidence: authenticated sidebar rows now fix height, line-height, icon boxes, and badges through `dashboard-nav-item`; the legacy `capsule-result` sidebar mirrors those dimensions; logout SVG paths match Favorites; `LanguageSwitcher` now uses the same inline elevated blur style as Auth/Cookie plus an opaque dark glass fallback for dashboard backgrounds.                                                               |
| PR security pipeline stays green                     | GitHub OSV initially flagged dev-only transitive lint dependencies `@babel/core@7.29.0` and `js-yaml@4.1.1`; `app/package.json` now pins fixed override versions `@babel/core@7.29.6` and `js-yaml@4.2.0`, and `npm --prefix app ls @babel/core js-yaml --depth=8` confirms both fixed versions are used.                                                                                                         |

Negative scenario evidence:

- Unauthenticated redirect: `curl -I -s http://127.0.0.1:3000/en/profile` returned `HTTP/1.1 307 Temporary Redirect` with `location: /en/auth`.
- Unsupported avatar rejection: source evidence `ProfileShell.tsx:332-338` rejects unsupported MIME types and files over 10 MB before preview creation; `globals.css:239-242` renders inline yellow field errors.
- Preferred Login Method removal: source evidence confirms the profile UI, shared schema, server action, and mock profile preference payload no longer expose or persist the old `preferredLoginMethod` field.
- Saved name boundaries: source evidence `buildProfileSnapshot` uses persisted `firstName` and `lastName` directly and only falls back to `splitDisplayName` when no saved boundary exists.
- Inline form validation path: source evidence Profile form sets `noValidate`, so invalid email/name/username values reach RHF/Zod yellow inline errors instead of browser-native tooltips.
- Username uniqueness: browser smoke saved `taken` and received the server-stub field error `This username is already taken.`

Validation suite:

- `node -e "JSON.parse(...en.json); JSON.parse(...ru.json)"` passed.
- `npm run check:feature-memory -- --worktree` passed.
- `npm --prefix app run lint` passed.
- `npm --prefix app run typecheck` passed.
- `npm --prefix app run build` passed.
- `npm run preflight` passed.
- Browser smoke passed desktop EN, RU locale switch, toggles, logout, re-login, mobile 390x844 bottom nav and More-sheet; browser console error log was `[]`.
- Shared navigation refactor smoke passed Profile and Dashboard desktop DOM checks, mobile 390x844 More-sheet open state, and mobile delete-zone clearance above the fixed bottom nav; browser console error log was `[]`.
- Fix smoke passed `Remove photo`/no `Replace`, username header, no Profile form language field, `NEXT_LOCALE` cookie evidence, username taken/free save, compact dimensions, inline logout, and grey delete outside the form.
- Codex review follow-up source check covered sidebar avatar rendering from the active preview/provider URL and the later Preferred Login Method removal from the Stage 1 profile contract.
- Codex review follow-up source check covered preserved first/last-name boundaries and mobile delete-zone clearance above the fixed bottom navigation.
- Codex review follow-up source check covered disabling native validation on the Profile form so Zod-backed inline errors remain authoritative.
- Codex review follow-up source check covered extracting shared Dashboard/Profile navigation into `DashboardNavigationFrame`.
- Codex review follow-up browser/source check covered Dashboard reading saved mock profile preferences after leaving Profile.
- Follow-up source check covered extracting shared Profile form validation to `features/profile/schemas.ts`, reused by `ProfileShell` and `saveProfileAction`; `npm --prefix app run typecheck` passed after the refactor.
- PR security follow-up covered fixed dev-only dependency overrides for OSV: `npm --prefix app install --package-lock-only` completed with `found 0 vulnerabilities`, and `npm --prefix app ls @babel/core js-yaml --depth=8` resolved `@babel/core@7.29.6 overridden` and `js-yaml@4.2.0 overridden`.
- AI Review follow-up browser check at 390x844 covered adding a shared More-sheet logout action for mobile/tablet authenticated navigation without restoring the removed Profile `user_id` row duplicate: `Log Out` count was `1`, sheet was open, min-height was `90px`, and the logout SVG path matched the unified icon.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/020-stage-1-profile/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/src/app/[locale]/profile/page.tsx
app/src/components/profile/ProfileShell.tsx
app/src/components/profile/profile-data.ts
app/src/components/dashboard/DashboardNavigation.tsx
app/src/components/dashboard/dashboard-data.ts
app/src/features/profile/actions.ts
app/src/features/profile/schemas.ts
app/src/features/profile/mock-profile-preferences.ts
app/src/messages/en.json
app/src/messages/ru.json
app/src/app/[locale]/[future]/page.tsx
app/src/app/globals.css
```

**Structure Decision**: Keep Profile colocated under `components/profile` with a server snapshot builder and feature-scoped server actions. This keeps route composition server-side while allowing the full prototype form to run as a client shell.

## Follow-up Plan

- Next PR: add localized Privacy Policy and Terms of Use pages for every active user language (EN/RU), then wire the existing auth/landing legal links to those routes.

## Complexity Tracking

No constitution violations identified before implementation.
