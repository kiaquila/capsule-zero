# Implementation Plan: Stage 1 My Items

**Branch**: `codex/stage-1-my-items` | **Date**: 2026-06-09 | **Spec**: `.specify/specs/015-stage-1-my-items/spec.md`

## Summary

Add the mock-first My Items wardrobe management screen by building an authenticated localized App Router route, deriving a user-scoped wardrobe snapshot from existing provider fixtures, and rendering a premium glass grid with local-only filter, sort, detail, edit, favorite, and status-preview interactions.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: next-intl, existing mock provider registry, existing category and wardrobe types
**Storage**: Mock session cookie only; client-local wardrobe preview state
**Testing**: `npm run preflight`, app lint/typecheck/build, local Browser smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: No external provider calls; wardrobe data resolves from deterministic fixtures
**Constraints**: Achromatic glass UI, mobile-first 375px support, EN/RU only for MVP v1, PR only after user approval
**Scale/Scope**: My Items route, data helper, client shell, messages, CSS, feature memory, future-route cleanup

## Constitution Check

- Glassmorphism is preserved with existing wallpaper and frosted surfaces.
- The interface remains achromatic except garment/fallback swatches and color dots.
- Capsule methodology is respected by showing capsule membership and clearing local membership when sale/repair status removes an item from composition.
- "Direct, not dictate" is preserved by explaining validation and status transitions.
- Premium quality is addressed by following the approved My Items prototype and verifying desktop/mobile.
- Three upload methods are not reimplemented here; the add item card is a local wardrobe preview and real upload/import/search flows remain their own slices.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | `curl -I http://127.0.0.1:3000/en/my-items` without the mock session cookie returned `307` with `location: /en/auth`. Route reads `readMockSession()` and redirects before creating the provider registry. |
| SC-002 / FR-002 | Browser smoke: from `/en/dashboard`, clicking the sidebar My Items link navigated to `http://127.0.0.1:3000/en/my-items` and rendered title `My Items`. `my-items` was removed from `app/src/app/[locale]/[future]/page.tsx` future redirects. |
| SC-003 / FR-003-FR-005 | Browser DOM check on `/en/my-items`: `lang=en`, title `My Items`, subtitle `4 items in wardrobe`, four fixture cards (`Black leather loafers`, `Camel wool blazer`, `Ink navy straight trousers`, `Soft white cotton shirt`), `imgCount=0`, fallback visual count `4`, no Spanish text. Data audit: `registry.wardrobe.listItems(session.userId)` scopes the snapshot by mock session user. |
| SC-004 / FR-006-FR-007 | Browser smoke: Blazer category chip showed only `Camel wool blazer`; Navy color filter showed only `Ink navy straight trousers`; price sort ordered `Camel wool blazer`, `Black leather loafers`, `Ink navy straight trousers`, `Soft white cotton shirt` without page reload. |
| SC-005 / FR-008-FR-011 | Browser smoke: detail drawer opened for `Camel wool blazer`; favorite `aria-pressed` changed `false -> true`; blank name save showed `Name is required.` and `aria-invalid=true`; edit saved `Camel wool blazer edited`; add saved `Ivory test shell`; moving it to repair showed `Ivory test shell moved to For Repair.` and updated `For Repair2`. Code audit found no `fetch(` or `use server` in My Items client interactions; mutations are React state only. |
| SC-006 / FR-012 | Browser smoke on `/ru/my-items`: `lang=ru`, title `Мои вещи`, subtitle `4 вещи в гардеробе`, Russian navigation labels, no Spanish / ES-AR language control. |
| SC-007 / FR-013 | Browser viewport check at 375x812: `scrollWidth=375`, no horizontal overflow, desktop sidebar hidden, mobile bottom nav displayed, two-column card grid (`168.5px 168.5px`), More sheet opens with Settings visible. Desktop smoke also showed no horizontal overflow. |
| SC-008 | `npm run preflight` passes. |
| SC-009 | `git diff --check` passes. |
| SC-010 | `npm run check:feature-memory -- --worktree` passes. |

Negative scenario evidence:

- Unauthenticated redirect: `curl -I http://127.0.0.1:3000/en/my-items` returned `307` and `location: /en/auth`.
- Provider-write guard: `rg -n "supabase|storage|photoroom|lava|fetch\\(|use server" 'app/src/app/[locale]/my-items' app/src/components/my-items` found no real-provider or network writes in My Items files.
- Locale guard: Browser EN/RU checks found only EN/RU language controls and no ES-AR / Spanish active copy.
- Scope guard: `app/src/components/my-items/my-items-data.ts` calls `registry.wardrobe.listItems(session.userId)` and does not borrow another user id.
- Image fallback: Browser DOM check found `imgCount=0` and four designed fallback visuals because `/fixtures/...` and `mock://` URLs are filtered before render.

Review follow-up evidence, 2026-06-09:

- Toast auto-dismiss: desktop and mobile Browser checks confirmed save toast appears and is removed after ~3.6 seconds.
- Edit drawer opacity: computed panel background is `rgba(10, 10, 10, 0.98)` with a near-opaque achromatic gradient.
- Edit color controls: computed swatch is contained inside a 44px circle, and the remove control is not rendered for a single color.
- Mobile Save: 375x812 Browser check confirmed the Save button is visible, not overlapped at its center point, updates the item name, and leaves no horizontal overflow.

## Project Structure

```text
app/src/app/[locale]/my-items/page.tsx
app/src/components/my-items/MyItemsShell.tsx
app/src/components/my-items/my-items-data.ts
app/src/app/[locale]/[future]/page.tsx
app/src/app/globals.css
app/src/messages/en.json
app/src/messages/ru.json
.specify/specs/015-stage-1-my-items/
```

**Structure Decision**: Keep provider/session access in the server route and deterministic wardrobe derivation in a colocated data helper. Keep filters, sort, detail panel, edits, and local status previews in a client component because the My Items screen is an interactive management surface.

## Complexity Tracking

No constitution violations.
