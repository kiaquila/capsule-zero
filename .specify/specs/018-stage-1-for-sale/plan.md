# Implementation Plan: Stage 1 For Sale

**Branch**: `codex/stage-1-for-sale` | **Date**: 2026-06-12 | **Spec**: `.specify/specs/018-stage-1-for-sale/spec.md`

## Summary

Add the mock-first For Sale screen by building an authenticated localized App Router route, deriving a user-scoped for-sale snapshot from existing provider fixtures, adding deterministic sale fixture coverage, and rendering a premium glass For Sale grid with filters, sort controls, shared wardrobe item cards, grid favorite flow, local capsule/return flows in the unified detail panel, and a full local detail edit panel aligned with existing wardrobe screens.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: next-intl, existing mock provider registry, existing category and wardrobe types
**Storage**: Mock session cookie only; client-local sale/edit/status preview state with browser object URLs for photo preview
**Testing**: `npm run preflight`, app lint/typecheck/build, local Browser smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: No external provider calls; For Sale data resolves from deterministic fixtures
**Constraints**: Achromatic glass UI, mobile-first 375px support, EN/RU only for MVP v1, PR only after user approval
**Scale/Scope**: For Sale route, data helper, editable client shell, messages, CSS, fixture, feature memory, future-route cleanup

## Constitution Check

- Glassmorphism is preserved with existing wallpaper and frosted surfaces.
- The interface remains achromatic except garment/fallback swatches and color dots.
- Capsule methodology is respected by keeping `for_sale` items outside capsule membership and returning them only to `uncapsulated` local preview state.
- "Direct, not dictate" is preserved by explaining capsule/return actions through notices and by making local changes reset on reload in Stage 1.
- Premium quality is addressed by following the approved For Sale prototype and reusing accepted wardrobe card/detail behavior.
- Three upload methods are not reimplemented here; this screen consumes existing wardrobe fixtures and supports only a local detail-card photo preview.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | `curl -s -I -L -o /dev/null -w 'url=%{url_effective} code=%{http_code} redirects=%{num_redirects}\n' http://127.0.0.1:3000/en/for-sale` returned `url=http://127.0.0.1:3000/en/auth code=200 redirects=1` without browser session cookies. |
| SC-002 / FR-002 | Browser: signed in as `founder@example.com`, landed on `/en/dashboard`, found one sidebar `For Sale 1` link in `Dashboard navigation`, clicked it, and reached `http://127.0.0.1:3000/en/for-sale`. |
| SC-003 / FR-003-FR-006 | Browser DOM at `/en/for-sale`: `<html lang="en">`, `h1=For Sale`, count `1 item listed`, for-sale status note with circular `i` info icon, `All` / `Skirt 1` / `All colors` filters, sort options, and `Charcoal silk slip skirt` rendered through the shared `.my-items-card` / `.my-items-card-main` contract with `Skirt`, `Toteme`, `Private`, `For Sale`, and the grid favorite heart. Legacy `.for-sale-card` and `.for-sale-card-actions` counts were `0`, and no Return/Sold grid buttons were present. |
| SC-004 / FR-007 | Browser: clicked `Skirt 1`, clicked `Filter by Gray`, selected sort `price`; URL stayed `/en/for-sale`, one card remained visible, active filter classes were present, and `select.value` became `price`. |
| SC-005 / FR-008-FR-012 | Browser: detail panel opened with editable fields, source/status/capsule context, `Change photo` control, and file input `accept=image/jpeg,image/png,image/webp`; empty-name Save showed validation; valid Save updated card/detail; catalog toggle changed `aria-pressed=false -> true` and badge `Private -> Catalog visible`; To My Items produced empty state with `For Sale 0` and `Uncapsulated 2`; Add to Capsule closed the panel, removed the card from For Sale, updated For Sale count to `0`, and showed `Charcoal silk slip skirt added to Buenos Aires core capsule.`; Delete produced empty state with `For Sale 0` and `My Items 4`. Follow-up browser regression check verified the shared `.my-items-detail-panel` action order: For Sale `Save`, `Add to Capsule`, `To My Items`, `Delete`; My Items `Save`, `Move to Sale`, `Move to Repair`, `Delete`; Favorites/Uncapsulated `Save`, `Add to Capsule`, `Move to Sale`, `Move to Repair`, `Delete`. For Sale footer buttons were `42px` tall and their SVG icons computed to `18px x 18px`. No item detail panel contained an Add/Remove Favorite action, and Favorites kept the favorite heart in the grid. `rg -n "supabase|storage|photoroom|lava|fetch\(|use server" 'app/src/app/[locale]/for-sale' app/src/components/for-sale` returned no provider/write calls. |
| SC-006 / FR-013 | Browser at `/ru/for-sale`: URL retained `/ru/for-sale`, `<html lang="ru">`, title `На продажу`, Russian info text, EN/RU language controls, and no visible `Español` or `ES-AR`. |
| SC-007 / FR-014 | Browser viewport `375x812`: bottom nav displayed `flex`, sidebar displayed `none`, `documentElement.scrollWidth=375`, `body.scrollWidth=375`, no horizontal overflow, shared For Sale card fit within `169px`, no legacy `.for-sale-card-actions` existed, the `i` info icon remained visible, More sheet opened with active `For Sale 1`, and Uncapsulated mobile card icon actions kept accessible names `Add to Capsule`, `Move to Sale`, `Move to Repair`. Desktop reset check: width `1280`, one card, no horizontal overflow. |
| SC-008 | `npm run preflight` passed after shared-card/detail and documentation patches: feature-memory gate, repo baseline, API contract/client check, lint, typecheck, production build, and app tests. |
| PR review P2 | Codex review flagged that the new `for_sale` fixture was still counted in dashboard wardrobe statistics. `buildDashboardSnapshot` now filters `for_sale` items out of `stats.totalItems`, `navigation.myItems`, and `recentItems` while keeping the separate For Sale quick-access count. Browser DOM on `/en/dashboard` after the fix showed `Total Items=4`, `My Items4`, `For Sale1`, and recent names did not include `Charcoal silk slip skirt`. Follow-up P2 findings required For Sale to use the same non-sale My Items badge and derive initial catalog visibility from `isPublic` instead of `fromCatalog`; the shared statistic helper and `MyItemsEntry.isPublic` now cover those contracts. A later P2 pass required local sale transitions to keep that badge consistent: browser DOM confirmed To My Items -> `My Items5` / `Uncapsulated2` / `For Sale0`, Delete -> `My Items4` / `For Sale0`, and Add to Capsule -> `My Items5` / `For Sale0`. The latest P2 pass required the shared My Items snapshot and inheriting Favorites/Uncapsulated screens to exclude sale fixtures too; `buildMyItemsSnapshot`, `MyItemsShell`, and Favorites status helpers now use the shared non-sale statistic helper. Browser DOM then confirmed `/en/my-items` renders `4 items in wardrobe`, 4 cards, no `Charcoal silk slip skirt`, and `/en/uncapsulated`, `/en/favorites`, `/en/for-sale` all start with `My Items4` / `For Sale1`. A follow-up P2 required Uncapsulated Move to Sale to decrement My Items locally; local status-change/removal helpers now handle For Sale, Favorites, and Uncapsulated transitions consistently. Browser DOM confirmed Move to Sale -> `My Items3` / `Uncapsulated0` / `For Sale2`, and the For Sale return/delete/add transitions stayed correct after the helper refactor. |
| Negative scenarios | Browser/CLI: unauthenticated redirect verified; local-only state reset on reload after Add to Capsule/To My Items/Delete; fresh console cutoff after HMR reload and the shared-card/detail regression pass produced `0` fresh warn/error logs; EN/RU only verified; provider-call grep returned no matches; no duplicated For Sale grid action strip, detail favorite action, or Mark as Sold detail action remained. Photo file selection was not automated because the in-app browser runtime does not expose a safe `setInputFiles` API; DOM contract and client-side validation code were verified instead. |

## Project Structure

```text
app/src/app/[locale]/for-sale/page.tsx
app/src/components/for-sale/ForSaleShell.tsx
app/src/components/for-sale/for-sale-data.ts
app/src/components/wardrobe/WardrobeItemCard.tsx
app/src/components/wardrobe/WardrobeItemDetailPanel.tsx
app/src/app/[locale]/[future]/page.tsx
app/src/lib/providers/mock/fixtures.ts
app/src/app/globals.css
app/src/messages/en.json
app/src/messages/ru.json
.specify/specs/018-stage-1-for-sale/
```

**Structure Decision**: Keep provider/session access in the server route and deterministic For Sale derivation in a colocated data helper. Keep filters and local capsule/return previews in a client component because the For Sale screen is interactive. Shared wardrobe grid cards and item detail panel structure live in `app/src/components/wardrobe/` so My Items, Uncapsulated, Favorites, and For Sale reuse one component contract.

## Complexity Tracking

No constitution violations identified at plan time.
