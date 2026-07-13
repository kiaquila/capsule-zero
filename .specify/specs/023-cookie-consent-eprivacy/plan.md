# Implementation Plan: Cookie Consent ePrivacy Flow

**Branch**: `claude/cookie-consent-eprivacy` | **Date**: 2026-06-26 | **Spec**: `.specify/specs/023-cookie-consent-eprivacy/spec.md`
**Input**: Feature specification from `.specify/specs/023-cookie-consent-eprivacy/spec.md`

## Summary

Replace the single-action landing cookie banner with a structured consent flow that supports equal Accept all / Reject all / Customize choices, category-level preferences, Global Privacy Control messaging, a typed hook for future non-essential integrations, and a footer settings entry point.

## Technical Context

**Language/Version**: TypeScript, React, Next.js App Router
**Primary Dependencies**: Next.js App Router, next-intl, React `useSyncExternalStore`, existing Capsule Zero global CSS tokens
**Storage**: Browser localStorage only
**Testing**: ESLint, TypeScript, Next build, feature-memory guard, diff whitespace check, source inspection
**Target Platform**: Localized mobile-first web landing page
**Project Type**: Next.js web application
**Performance Goals**: Client-only consent state with no runtime provider calls and no analytics / marketing SDK payloads
**Constraints**: Glassmorphism UI, achromatic interface, EN/RU only for MVP v1, non-essential consent defaults off, future integrations must use the shared hook
**Scale/Scope**: Landing cookie banner, landing footer entry point, consent utility module, global CSS, EN/RU messages

## Constitution Check

- Glassmorphism UI: PASS; the banner keeps the existing glass surface and elevated blur treatment.
- Achromatic interface: PASS; controls remain black / white / grey without red error states or colored marketing UI.
- Direct, Not Dictate: PASS; the user can accept, reject, customize, and later revisit preferences.
- Premium quality bar: PASS; the panel uses stable button, toggle, and glass styling consistent with auth and language popups.
- Three upload methods: N/A; no upload behavior changed.
- Engineering reuse: PASS; all future consent consumers are directed through one shared hook instead of parsing localStorage directly.

## Verification _(mandatory - required by SENAR)_

| Acceptance criterion | Evidence |
| --- | --- |
| US1-AC1 summary banner exposes three direct actions | Source evidence: `app/src/components/landing/CookieBanner.tsx` renders `cookieAccept`, `cookieReject`, and `cookieCustomize` in `Summary`, and EN/RU strings exist in `app/src/messages/{en,ru}.json`. |
| US1-AC2 Accept all persists every category true | Source evidence: `app/src/lib/cookie-consent.ts` `acceptAll()` writes `necessary`, `preferences`, `analytics`, and `marketing` as true with `decidedAt`. |
| US1-AC3 Reject all persists only necessary true | Source evidence: `app/src/lib/cookie-consent.ts` `rejectAll()` writes `necessary: true` and all non-essential categories false with `decidedAt`. |
| US2-AC1 customize panel locks necessary and toggles non-essential categories | Source evidence: `CookieBanner.tsx` renders the Necessary row as a locked `role="switch"` span with `aria-checked="true"` and maps `listNonNecessaryCategories()` to toggle buttons. |
| US2-AC2 saved subset survives reload through structured storage | Source evidence: `savePreferences()` writes a structured object to `COOKIE_CONSENT_STORAGE_KEY`; `readState()` parses and validates that object through `isPreferences()`. |
| US2-AC3 footer Cookie settings reopens current preferences | Source evidence: `LandingPage.tsx` calls `openCookieSettings`; `CookieBanner.tsx` listens for `COOKIE_CONSENT_OPEN_EVENT`, copies current preferences into draft state, and opens the customize panel. |
| US3-AC1 GPC note appears when detected | Source evidence: `detectGpc()` reads `navigator.globalPrivacyControl`; `CookieBanner.tsx` renders `cookieGpcNote` in both summary and customize states when `gpc` is true. |
| US3-AC2 GPC starts analytics and marketing off | Source evidence: `defaultPreferences(gpc)` always returns Analytics and Marketing false, and no default path grants non-essential consent. |
| US3-AC3 future integrations can check consent without parsing storage | Source evidence: `useCookieConsent()` returns `hasConsent(category)` and the current validated `preferences`. |
| Negative scenario 1 no implicit non-essential consent | Source evidence: `emptyPreferences()` and `defaultPreferences()` set Preferences, Analytics, and Marketing false. |
| Negative scenario 2 malformed / legacy storage is safe | Source evidence: `readState()` catches JSON errors and invalid shapes, and also discards parseable consent objects with an empty or invalid `decidedAt`, returning undecided safe defaults. |
| Negative scenario 3 ES-AR remains deferred | Source evidence: PR diff touches only `en.json` and `ru.json` message files for cookie copy; no ES-AR active routing or switcher changes are present. |
| Negative scenario 4 merged legal CSS is not duplicated | Source evidence: after merging current `origin/main`, the duplicate raw-value legal CSS block was removed and `git diff origin/main...HEAD -- app/src/app/globals.css` no longer adds `.legal-*` blocks. |
| SC-001 local checks | Commands passed on 2026-06-26: `npm --prefix app run lint`; `npm --prefix app run typecheck`; `npm --prefix app run build`. Build output generated 30/30 static pages and kept `/en`, `/ru`, `/en/privacy-policy`, `/ru/privacy-policy`, `/en/terms-of-use`, and `/ru/terms-of-use`. |
| SC-002 feature-memory guard | Commands passed on 2026-06-26: `node scripts/check-feature-memory.mjs --worktree`; `node scripts/check-feature-memory.mjs origin/main HEAD`, both output `Feature-memory gate passed via .specify/specs/023-cookie-consent-eprivacy/{spec,plan,tasks}.md`. |
| SC-003 / SC-004 source safety checks | Commands passed on 2026-06-26: `git diff --check origin/main...HEAD` exited 0; `git diff origin/main...HEAD -- app/src/app/globals.css | rg -n "^\\+\\.legal|^\\+  \\.legal|blur\\(24px\\)"` returned no added legal CSS duplicates; source evidence above covers ES-AR and malformed-storage safety, including the Codex P2 case for empty `decidedAt`. |
| SC-005 GitHub pipeline | Pending after push: `baseline-checks`, `guard`, and `osv-scan` on PR #44 head. |

## Project Structure

### Documentation (this feature)

```text
.specify/specs/023-cookie-consent-eprivacy/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/src/app/globals.css
app/src/components/landing/CookieBanner.tsx
app/src/components/landing/LandingPage.tsx
app/src/lib/cookie-consent.ts
app/src/messages/en.json
app/src/messages/ru.json
```

**Structure Decision**: Keep consent persistence and subscription logic in one `cookie-consent.ts` module, while `CookieBanner` owns only UI state and event-driven reopening.

## Complexity Tracking

No constitution violations identified before implementation.
