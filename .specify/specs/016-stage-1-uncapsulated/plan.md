# Implementation Plan: Stage 1 Uncapsulated

**Branch**: `codex/stage-1-uncapsulated` | **Date**: 2026-06-11 | **Spec**: `.specify/specs/016-stage-1-uncapsulated/spec.md`

## Summary

Add the mock-first Uncapsulated wardrobe decision screen by building an authenticated localized App Router route, deriving a user-scoped uncapsulated snapshot from existing provider fixtures, and rendering a premium glass grid with local-only category filter, editable item detail, photo preview, save, delete, add-to-capsule, sale, and repair preview interactions.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: next-intl, existing mock provider registry, existing category and wardrobe types
**Storage**: Mock session cookie only; client-local wardrobe edit/decision preview state with browser object URLs for photo preview
**Testing**: `npm run preflight`, app lint/typecheck/build, local Browser smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: No external provider calls; uncapsulated data resolves from deterministic fixtures
**Constraints**: Achromatic glass UI, mobile-first 375px support, EN/RU only for MVP v1, PR only after user approval
**Scale/Scope**: Uncapsulated route, data helper, editable client shell, messages, CSS, feature memory, future-route cleanup

## Constitution Check

- Glassmorphism is preserved with existing wallpaper and frosted surfaces.
- The interface remains achromatic except garment/fallback swatches and color dots.
- Capsule methodology is respected by showing only items outside capsules and by making add-to-capsule an explicit local decision.
- "Direct, not dictate" is preserved by explaining local decisions and empty/no-capsule states.
- Premium quality is addressed by following the approved Uncapsulated prototype and verifying desktop/mobile.
- Three upload methods are not reimplemented here; this screen consumes existing wardrobe fixtures and supports only a local detail-card photo preview, leaving persisted upload/import/search flows to their own slices.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | `curl -s -L -o /dev/null -w 'url=%{url_effective} code=%{http_code} redirects=%{num_redirects}' --max-time 15 http://localhost:3000/en/uncapsulated` returned effective URL `http://localhost:3000/en/auth`, `code=200`, `redirects=1` without a mock session. |
| SC-002 / FR-002 | Browser smoke: after mock login on `/en/auth`, clicking the dashboard sidebar link `Uncapsulated 1` navigated to `http://localhost:3000/en/uncapsulated`; `uncapsulated` was removed from `app/src/app/[locale]/[future]/page.tsx` future redirects. |
| SC-003 / FR-003-FR-006 | Browser DOM check on `/en/uncapsulated`: title `Uncapsulated`, subtitle `1 item outside capsules`, one card `Camel wool blazer`, filter `Blazer 1`, no active capsule item cards, no repair item card, `imgCount=0` with fallback visuals. Data audit: `buildUncapsulatedSnapshot()` uses `registry.wardrobe.listItems(session.userId)` through `buildMyItemsSnapshot()` and filters to `status === "uncapsulated"` with no capsule membership. |
| SC-004 / FR-007 | Browser smoke: clicking category chip `Blazer 1` kept exactly one visible card, `Camel wool blazer`, without navigation or page reload. |
| SC-005 / FR-008-FR-011 | Browser smoke: detail drawer opened as `Edit item` with editable fields `Name`, `Category`, `Colors`, `Brand`, `Material`, `Price`, Save/Delete buttons, and file input `accept="image/jpeg,image/png,image/webp"`; empty name Save showed `Name is required.`; category changed to `Coat`, Add Color increased detail color inputs to `2`, Save changed the card to `Edited Blazer` and filter chip to `Coat1`; Delete removed the card, changed `My Items3` / `Uncapsulated0`, and showed `Edited Blazer deleted from My Items.` Browser smoke also reloaded fixtures and verified Add to Capsule modal/removal, Sale -> `For Sale1`, and Repair -> `For Repair2`. Photo picker cannot be programmatically populated by the in-app Browser runtime; code audit covers `handlePhotoUpload()` validation/object URL creation in `app/src/components/uncapsulated/UncapsulatedShell.tsx:334` and preview/file input rendering in `app/src/components/uncapsulated/UncapsulatedShell.tsx:616`. Provider-write guard found no real-provider/network writes. |
| SC-006 / FR-011 | Browser smoke on `/ru/uncapsulated`: `lang=ru`, title `Вне капсулы`, subtitle `1 вещь вне капсул`, Russian navigation labels, only EN/RU language controls, no Spanish / ES-AR active copy. |
| SC-007 / FR-013 | Browser viewport check at 375x812: `scrollWidth=375`, `bodyScrollWidth=375`, desktop sidebar hidden, mobile bottom nav displayed, two-column grid (`168.5px 168.5px`); editable detail drawer opened at `panelWidth=375`, actions `Save/Delete/Add to Capsule/Move to Sale/Move to Repair`, and `hasOverflow=false`. Desktop Browser console error log returned `[]`. |
| SC-008 | `npm run preflight` passes. |
| SC-009 | `git diff --check` passes. |
| SC-010 | `npm run check:feature-memory -- --worktree` passes. |

Negative scenario evidence:

- Unauthenticated redirect: `curl -s -L ... http://localhost:3000/en/uncapsulated` ended at `/en/auth` with one redirect.
- Provider-write guard: `rg -n "supabase|storage|photoroom|lava|fetch\\(|use server" 'app/src/app/[locale]/uncapsulated' app/src/components/uncapsulated` returned no matches.
- Locale guard: Browser EN/RU checks found only EN/RU language controls and no ES-AR / Spanish active copy.
- Scope guard: Browser DOM showed one uncapsulated card, `Camel wool blazer`; active capsule items and the existing repair item did not appear.

## Project Structure

```text
app/src/app/[locale]/uncapsulated/page.tsx
app/src/components/uncapsulated/UncapsulatedShell.tsx
app/src/components/uncapsulated/uncapsulated-data.ts
app/src/app/[locale]/[future]/page.tsx
app/src/app/globals.css
app/src/messages/en.json
app/src/messages/ru.json
.specify/specs/016-stage-1-uncapsulated/
```

**Structure Decision**: Keep provider/session access in the server route and deterministic uncapsulated derivation in a colocated data helper. Keep filters, detail panel, and local decision previews in a client component because the Uncapsulated screen is an interactive decision queue.

## Complexity Tracking

No constitution violations.
