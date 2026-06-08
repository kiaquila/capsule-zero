# Implementation Plan: Stage 1 Guided Journey

**Branch**: `codex/stage-1-guided-journey` | **Date**: 2026-06-08 | **Spec**: `.specify/specs/013-stage-1-guided-journey/spec.md`

## Summary

Add the first mock-first Guided Journey route after dashboard by building a localized App Router page that checks the existing mock session, passes deterministic setup data to an interactive client component, and keeps all item/palette/capsule actions local until real provider and Capsule Result slices land.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: next-intl, existing mock provider registry, existing categories and color methodology types
**Storage**: Client-local journey state only; no Supabase persistence
**Testing**: `npm run preflight`, app lint/typecheck/build, local Browser smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: No external provider calls; route data resolves from deterministic fixtures
**Constraints**: Achromatic glass UI, mobile-first 375px support, EN/RU only for MVP v1, PR only after user approval
**Scale/Scope**: One route, one client shell, journey data helpers, messages, CSS, feature memory, dashboard CTA unlock

## Constitution Check

- Glassmorphism is preserved with existing wallpaper and frosted surfaces.
- The interface remains achromatic except garment/color swatches.
- Capsule color methodology follows the canonical group matrix from `docs_capsule_zero/project/methodology/colors.md`.
- "Direct, not dictate" is preserved by explaining blocked colors/items and offering alternatives.
- Premium quality is addressed by matching the approved prototype structure and verifying desktop/mobile.
- Three upload methods are represented in Step 3 without real provider calls.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | In-app Browser smoke: unauthenticated `http://localhost:3000/en/guided-journey` redirected to `http://localhost:3000/en/auth` before mock login. |
| SC-002 / FR-002-FR-003 | In-app Browser smoke: mock login with `founder@example.com`, dashboard Add Item href `/en/guided-journey`, direct route rendered three wardrobe type cards. |
| SC-003 / FR-004-FR-006 | In-app Browser smoke: Step 2 showed 30 filtered women's categories; Continue disabled at `0/8`, enabled after selecting 8 categories. |
| SC-004 / FR-007-FR-008 | In-app Browser smoke: Step 3 rendered Upload Photos / Paste Links / Search Catalog; `https://example.com/product/mock-blazer` produced one added marketplace card; catalog click produced a second local card. |
| SC-005 / FR-009-FR-010 | In-app Browser DOM assertions: 51 palette colors; selecting Scarlet set `aria-pressed=true`, blocked Blush with `aria-disabled=true`, kept Vermillion and Black available, no horizontal overflow. |
| SC-006 / FR-011 | In-app Browser post-restart check: `/ru/guided-journey` rendered `Выберите тип гардероба`, `<html lang="ru">`, language options EN/RU only, no ES-AR text. |
| SC-007 / FR-012 | In-app Browser desktop and 375x812 viewport checks: no horizontal overflow, three type cards visible, console errors list empty. |
| SC-008 | `npm run preflight` passed on 2026-06-08 after the final patch. |
| SC-009 | `git diff --check` passed on 2026-06-08 after the final patch. |
| SC-010 | `npm run check:feature-memory -- --worktree` passed through `npm run preflight` on 2026-06-08. |
| FR-013 | `app/src/components/guided-journey/GuidedJourneyShell.tsx` keeps item creation in client-local state and mock creation handoff redirects to `/capsule-result`; no provider writes were added. |
| Codex review P2 follow-up | PR #32 Codex review findings for non-Latin custom category IDs and same-host marketplace links were addressed in `GuidedJourneyShell.tsx`; `npm run preflight` passed after the patch. |
| Codex review P2 compatibility follow-up | PR #32 Codex review findings for marketplace mock-color validation and palette revalidation against added items were addressed in `GuidedJourneyShell.tsx`; `npm run preflight` and in-app Browser smoke checks passed after the patch. |
| Codex review P2 asset follow-up | PR #32 Codex review finding for missing catalog fixture images was addressed in `guided-journey-data.ts` by omitting unavailable `/fixtures/` URLs so added catalog cards use the icon fallback; `npm run preflight` and in-app Browser catalog fallback smoke passed after the patch. |

Negative scenario evidence:

- Unauthenticated route access redirects to localized auth.
- Language controls expose EN/RU only.
- Incompatible palette and item colors are blocked with explanation.
- Added item colors are rechecked when selecting later palette colors.
- Missing catalog fixture images fall back to the existing item icon.
- No real Supabase, OAuth, Lava.top, marketplace, semantic search, storage, or image-processing calls are introduced.

## Project Structure

```text
app/src/app/[locale]/guided-journey/page.tsx
app/src/components/guided-journey/GuidedJourneyShell.tsx
app/src/components/guided-journey/guided-journey-data.ts
app/src/app/globals.css
app/src/messages/en.json
app/src/messages/ru.json
.specify/specs/013-stage-1-guided-journey/
```

**Structure Decision**: Keep provider/session access in the server route and deterministic setup derivation in a colocated data helper. Keep the Journey UI as a focused client component because step navigation, tabs, file previews, palette toggles, and local validation are inherently interactive.

## Complexity Tracking

No constitution violations.
