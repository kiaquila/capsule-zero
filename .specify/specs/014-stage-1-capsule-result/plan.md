# Implementation Plan: Stage 1 Capsule Result

**Branch**: `codex/stage-1-capsule-result` | **Date**: 2026-06-09 | **Spec**: `.specify/specs/014-stage-1-capsule-result/spec.md`

## Summary

Add the mock-first Capsule Result screen after Guided Journey by building authenticated localized App Router routes, deriving a user-scoped result snapshot from existing provider fixtures, and rendering a premium glass result shell with local-only management interactions.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: next-intl, existing mock provider registry, existing category and color methodology types
**Storage**: Mock session cookie only; client-local result preview state
**Testing**: `npm run preflight`, app lint/typecheck/build, local Browser smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: No external provider calls; result data resolves from deterministic fixtures
**Constraints**: Achromatic glass UI, mobile-first 375px support, EN/RU only for MVP v1, PR only after user approval
**Scale/Scope**: Result routes, data helper, client shell, messages, CSS, feature memory, dashboard/journey link unlocks

## Constitution Check

- Glassmorphism is preserved with existing wallpaper and frosted surfaces.
- The interface remains achromatic except garment/fallback swatches and palette dots.
- Capsule methodology keeps the immutable palette and validates add/replace candidates against group compatibility.
- "Direct, not dictate" is preserved by explaining blocked candidate choices and offering local alternatives.
- Premium quality is addressed by following the approved result prototype and verifying desktop/mobile.
- Three upload methods are not reimplemented here; shopping rows hand off to the existing Guided Journey search route.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | `curl -I http://127.0.0.1:3000/en/capsule-result` returned `307 Temporary Redirect` with `location: /en/auth` when no mock session cookie was present. |
| SC-002 / FR-002 | Browser smoke: signed in through `/en/auth`, clicked Dashboard `Open capsule` to `/en/capsule-result`, and completed Guided Journey `Mixed -> 8 categories -> Create Capsule`, which navigated to `/en/capsule-result`. |
| SC-003 / FR-003-FR-004 | Browser DOM on `/en/capsule-result` rendered `Your capsule is ready`, `Buenos Aires core capsule`, palette, OPR `9.0`, `2` items, `18` outfits, and `7` categories from mock fixtures. |
| SC-004 / FR-005-FR-008 | Browser tab smoke switched Items, Outfits, What's Missing, and Shopping List without page reload; each tab rendered its expected result content. Follow-up Browser check verified the Outfits view toggle uses prototype SVG icons, line view renders all outfit layers in a flex row, and square view renders a 2x2 collage card. |
| SC-005 / FR-009-FR-010 | Browser interaction smoke toggled favorite `aria-pressed`, added compatible `Camel wool blazer`, removed it through confirmation, recalculated `3 items / 27 outfits` then returned to `2 items / 18 outfits`, and showed `Blush silk scarf` as palette-blocked with visible reason. |
| SC-006 / FR-011 | Browser DOM on `/ru/capsule-result` rendered Russian labels with `<html lang="ru">`; EN/RU language controls were present and no ES-AR/Spanish control text was present. |
| SC-007 / FR-012 | Browser desktop check showed `scrollWidth === clientWidth === 1280`; temporary 375x812 viewport check showed `scrollWidth === clientWidth === 375` with no page-level horizontal overflow. |
| SC-008 | Root `npm run preflight` passed on 2026-06-09, including feature-memory, repo baseline, API contract/client check, app lint, app typecheck, app build, and app test-if-present. |
| SC-009 | `git diff --check` passed on 2026-06-09. |
| SC-010 | `npm run check:feature-memory -- --worktree` passed through `npm run preflight`. |
| FR-013 | `curl -I` with mock session cookie returned `200 OK` for `/en/capsule/mock-active` and `404 Not Found` for `/en/capsule/not-real`. |

Negative scenario evidence:

- Unauthenticated redirect: `curl -I http://127.0.0.1:3000/en/capsule-result` returned `307` to `/en/auth`.
- Provider-write guard: result routes only read `readMockSession` and provider registry data; add/remove/replace/favorite live in client state inside `CapsuleResultShell` and no mutation provider methods are called.
- Locale guard: Browser RU/EN checks showed only EN and RU controls; no ES-AR/Spanish text was present.
- Scope guard: `capsule-result-data.ts` resolves the current capsule through `registry.capsules.getCurrentCapsule(session.userId)`.
- Image fallback: Browser DOM inside `.capsule-result-shell` had `imgCount: 0`, `fallbackCount: 2`, and no `/fixtures/` image URLs; after temporary local debug images were removed, `rg` found no `debug-garments` references under `app/src` or `app/public`.

## Project Structure

```text
app/src/app/[locale]/capsule-result/page.tsx
app/src/app/[locale]/capsule/[id]/page.tsx
app/src/components/capsule-result/CapsuleResultShell.tsx
app/src/components/capsule-result/capsule-result-data.ts
app/src/app/globals.css
app/src/messages/en.json
app/src/messages/ru.json
.specify/specs/014-stage-1-capsule-result/
```

**Structure Decision**: Keep provider/session access in server routes and deterministic result derivation in a colocated data helper. Keep tabs and local management preview in a client component because the result screen needs tab switching, local add/remove/replace/favorite state, and modal-style pickers.

## Complexity Tracking

No constitution violations.
