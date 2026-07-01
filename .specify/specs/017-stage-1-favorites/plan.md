# Implementation Plan: Stage 1 Favorites

**Branch**: `codex/stage-1-favorites` | **Date**: 2026-06-12 | **Spec**: `.specify/specs/017-stage-1-favorites/spec.md`

## Summary

Add the mock-first Favorites screen by building an authenticated localized App Router route, deriving a user-scoped favorite snapshot from existing provider fixtures, and rendering a premium glass Favorites grid with My Items / From Catalogs tabs, category/color filters, sort controls, active favorite controls, and a full local detail edit panel aligned with the existing wardrobe screens.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: next-intl, existing mock provider registry, existing category and wardrobe types
**Storage**: Mock session cookie only; client-local favorites/edit/status preview state with browser object URLs for photo preview
**Testing**: `npm run preflight`, app lint/typecheck/build, local Browser smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: No external provider calls; Favorites data resolves from deterministic fixtures
**Constraints**: Achromatic glass UI, mobile-first 375px support, EN/RU only for MVP v1, PR only after user approval
**Scale/Scope**: Favorites route, data helper, editable client shell, messages, CSS, feature memory, future-route cleanup

## Constitution Check

- Glassmorphism is preserved with existing wallpaper and frosted surfaces.
- The interface remains achromatic except garment/fallback swatches and color dots; active favorite controls use the shared My Items display treatment.
- Capsule methodology is respected by showing capsule membership context and by keeping add-to-capsule, deletion, and sale/repair transitions explicit local previews.
- "Direct, not dictate" is preserved by making Favorite removal and status transitions reversible by reload in Stage 1 and explained through notices.
- Premium quality is addressed by following the approved Favorites prototype and reusing the accepted wardrobe detail-card behavior.
- Three upload methods are not reimplemented here; this screen consumes existing wardrobe fixtures and supports only a local detail-card photo preview, leaving persisted upload/import/search flows to their own slices.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | `curl -s -L -o /dev/null -w 'url=%{url_effective} code=%{http_code} redirects=%{num_redirects}' --max-time 15 http://127.0.0.1:3000/en/favorites` returned effective URL `http://127.0.0.1:3000/en/auth`, `code=200`, `redirects=1` without a mock session. |
| SC-002 / FR-002 | Browser smoke: after mock login on `/en/auth`, the dashboard sidebar exposed `Favorites 2`; clicking it navigated to `http://127.0.0.1:3000/en/favorites`; `favorites` was removed from `app/src/app/[locale]/[future]/page.tsx` future redirects. |
| SC-003 / FR-003-FR-007 | Browser DOM check on `/en/favorites`: `lang=en`, title `My Favorites`, subtitle `2 items saved`, tabs `My Items1` and `From Catalogs1`, shared My Items-style favorite control count `1` in each active tab, My Items card `Soft white cotton shirt`, and From Catalogs card `Camel wool blazer` with badges `Catalog` / `Uncapsulated`. |
| SC-004 / FR-008 | Browser smoke: clicking the `From Catalogs 1` tab selected that tab without navigation, clicking category chip `Blazer 1` kept exactly one visible card, `Camel wool blazer`, and the follow-up parity check verified the shared color filter row plus sort dropdown (`Name`, `Category`, `Recent`, `Price`) without page reload. |
| SC-005 / FR-011 | Browser smoke: clicking `Remove Camel wool blazer from favorites` removed the card locally, changed subtitle to `1 item saved`, changed the selected tab to `From Catalogs0`, showed empty title `No favorites match`, updated sidebar badge to `Favorites1`, and showed toast `Camel wool blazer removed from favorites.` |
| SC-006 / FR-009-FR-011 | Browser smoke: detail drawer opened for `Soft white cotton shirt` with editable `Name`, `Category`, `Colors`, `Brand`, `Material`, `Price`, source, favorite section, capsule context, Save, Remove Favorite, Add to Capsule, Delete Item, Move to Sale, and Move to Repair. Keyboard-clearing `Name` then Save produced `Name is required.` and `aria-invalid=true`; Add Color produced `2` color inputs; saving `Favorite shirt edited` and `COS edited` updated the card and toast. Code audit covers photo preview support in `app/src/components/favorites/FavoritesShell.tsx`: `handlePhotoUpload`, file input `accept="image/jpeg,image/png,image/webp"`, and client-local `setItems` / `setNavigation` state mutations. Browser smoke also verified Add to Capsule -> card badge `Active` and sidebar `Uncapsulated0`; Delete Item -> item removed locally and sidebar `Favorites1`; Move to Sale -> card badge `For Sale`, sidebar `For Sale1`; and Move to Repair -> card badge `For Repair2`. |
| SC-007 / FR-012 | Browser smoke on `/ru/favorites`: `lang=ru`, title `Мое избранное`, subtitle `2 сохраненные вещи`, tabs `Мои вещи1` / `Из каталогов1`, Russian navigation labels, and no Spanish / ES-AR active copy. |
| SC-008 / FR-013 | Browser viewport check at 375x812: `scrollWidth=375`, `bodyScrollWidth=375`, desktop sidebar hidden, mobile bottom nav displayed, two-column grid (`168.5px 168.5px`), `hasHorizontalOverflow=false`; detail drawer opened at `panelWidth=375`, action buttons remained visible/clickable (`Save`, `Remove Favorite`, `Add to Capsule`, `Delete Item`, `Move to Sale`, `Move to Repair`), and console error log returned `[]`. |
| Follow-up UI parity | Browser smoke after the filter/action follow-up: Favorites and Uncapsulated expose the My Items-style color filter row and sort dropdown (`Name`, `Category`, `Recent`, `Price`) in EN/RU; Favorites and Uncapsulated use the My Items circular favorite control (`.my-items-fav`, 50% radius); Uncapsulated favorite toggle keeps the card visible and updates sidebar `Favorites2 -> Favorites1`; Favorites detail exposes `Add to Capsule` and yellow `Remove Favorite` / `Delete Item`; `Add to Capsule` updates catalog favorite badge to `Active` and shows `Camel wool blazer added to Buenos Aires core capsule.`; `Delete Item` removes the catalog favorite locally and updates subtitle/sidebar; My Items detail exposes a yellow `Delete` button and local delete closes the drawer with toast. Mobile smoke at 375px returned `docScrollWidth=375`, `bodyScrollWidth=375`, sort width inside the filter panel, no tab overflow, and six Favorites drawer action buttons fitting within the 375px panel. |
| SC-009 | `npm run preflight` passes. |
| SC-010 | `git diff --check` passes. |
| SC-011 | `npm run check:feature-memory -- --worktree` passes. |

Negative scenario evidence:

- Unauthenticated redirect: `curl -s -L ... http://127.0.0.1:3000/en/favorites` ended at `/en/auth` with one redirect.
- Provider-write guard: `rg -n "supabase|storage|photoroom|lava|fetch\\(|use server" 'app/src/app/[locale]/favorites' app/src/components/favorites || true` returned no matches, including for local add-to-capsule and delete flows.
- Locale guard: Browser EN/RU checks found only EN/RU language controls and no ES-AR / Spanish active copy.
- Local-state reset: after removing the catalog favorite locally, reloading `/en/favorites` restored deterministic fixture state with `From Catalogs1`.

## Project Structure

```text
app/src/app/[locale]/favorites/page.tsx
app/src/components/favorites/FavoritesShell.tsx
app/src/components/favorites/favorites-data.ts
app/src/app/[locale]/[future]/page.tsx
app/src/lib/providers/mock/fixtures.ts
app/src/app/globals.css
app/src/messages/en.json
app/src/messages/ru.json
.specify/specs/017-stage-1-favorites/
```

**Structure Decision**: Keep provider/session access in the server route and deterministic Favorites derivation in a colocated data helper. Keep tabs, filters, detail panel, and local favorite/status previews in a client component because the Favorites screen is interactive.

## Complexity Tracking

No constitution violations.
