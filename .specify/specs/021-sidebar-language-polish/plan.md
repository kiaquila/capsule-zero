# Implementation Plan: Sidebar Icons and Language Menu Polish

**Branch**: `codex/sidebar-language-fixes` | **Date**: 2026-06-15 | **Spec**: `.specify/specs/021-sidebar-language-polish/spec.md`
**Input**: Feature specification from `.specify/specs/021-sidebar-language-polish/spec.md`

## Summary

Unify duplicate authenticated navigation icons by reusing the Dashboard icon definitions across wardrobe screens, and restyle the global language menu with the same light elevated glass treatment used by the auth popup and cookie banner.

## Technical Context

**Language/Version**: TypeScript, React, Next.js App Router
**Primary Dependencies**: Next.js App Router, next-intl, Tailwind CSS v4 tokens, existing Dashboard navigation components
**Storage**: None changed
**Testing**: ESLint, TypeScript, Next build, feature-memory guard, diff whitespace check, browser smoke checks
**Target Platform**: Mobile-first web plus desktop authenticated dashboard surfaces
**Project Type**: Next.js web application
**Performance Goals**: Visual-only changes with no extra runtime fetches or provider calls
**Constraints**: Glassmorphism UI, achromatic interface, EN/RU only for MVP v1, shared UI reuse over local variants
**Scale/Scope**: Seven authenticated UI files plus global CSS styling for the language menu

## Constitution Check

- Glassmorphism UI: PASS; `.language-menu` now shares the elevated glass styling used by auth/cookie surfaces.
- Achromatic interface: PASS; no colored UI accents were introduced.
- Direct, Not Dictate: N/A; this is visual navigation and menu polish.
- Premium quality bar: PASS; duplicated icons now use the same artwork and 18px rendered size.
- Three upload methods: N/A; no upload behavior changed.
- Engineering reuse: PASS; local sidebar implementations import and reuse `DashboardIcon` and `DashboardIconName` for shared navigation entries.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion | Evidence |
| --- | --- |
| US1-AC1 shared icons match Dashboard across authenticated screens | Browser verification on `http://localhost:3000/en/dashboard`, `/en/my-items`, `/en/capsule-result?tab=outfits`, `/en/capsule-result`, `/en/favorites`, `/en/for-sale`, `/en/for-repair`, and `/en/uncapsulated` compared SVG `outerHTML` for Dashboard, My Items, Outfits, Capsules, Shopping List, For Sale, and Settings against the Dashboard reference; all matched. |
| US1-AC2 Favourites keeps For Sale, Dashboard, Shopping List, and Settings dimensions stable | Browser DOM measurements showed affected shared icons rendered at 18x18 with stable sidebar alignment and no console errors. |
| US1-AC3 capsule-result active states stay stable | Source evidence: `CapsuleResultShell.tsx` keeps Outfits active only when `activeTab === "outfits"` and keeps Capsules active for capsule item/gap tabs while reusing Dashboard icons. |
| US2-AC1 language menu matches auth/cookie glass styling | Browser computed styles after opening the language dropdown showed `backgroundColor: rgba(255, 255, 255, 0.38)`, `backdropFilter: blur(64px) saturate(1.18)`, elevated shadow, and light border. |
| US2-AC2 only EN/RU options remain visible | Browser language-menu smoke check opened the existing `LanguageSwitcher` and confirmed EN/RU behavior remained unchanged; no ES-AR route, enum, or switcher control was added. |
| FR-001 through FR-006 shared navigation icon reuse | Source evidence: affected wardrobe shells import `DashboardIcon` / `DashboardIconName` from `@/components/dashboard/DashboardNavigation` and use Dashboard icon names for shared labels instead of local SVG variants. |
| FR-007 capsule-result active-state behavior | Source evidence and browser route checks covered `/en/capsule-result?tab=outfits` and `/en/capsule-result`, ensuring the icon reuse did not alter tab-specific active logic. |
| FR-008 through FR-010 visual-only language polish | Source evidence: `app/src/app/globals.css` applies the shared auth/cookie elevated glass surface to `.language-menu`; no product route, provider, or persistence code changed. |
| SC-003 local pipeline | `npm run lint` passed; `npm run typecheck` passed; `npm run build` passed; `npm run ci:check` passed; `git diff --check` passed. |
| SC-004 GitHub pipeline | PR #42 was opened, branch pushed, baseline checks ran, Codex review was triggered with `@codex review`, and guard is rerun after adding this feature memory. |

Negative scenario evidence:

- Local sidebar variants: source check confirms shared navigation labels now use `DashboardIcon` imports in the duplicated wardrobe menus.
- Capsule gaps tab: source check confirms Capsules remains the capsule-result entry for non-outfits tabs.
- Dark language menu regression: browser computed styles confirmed the menu background is light translucent glass rather than the previous dark popup style.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/021-sidebar-language-polish/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/src/app/globals.css
app/src/components/capsule-result/CapsuleResultShell.tsx
app/src/components/favorites/FavoritesShell.tsx
app/src/components/for-repair/ForRepairShell.tsx
app/src/components/for-sale/ForSaleShell.tsx
app/src/components/my-items/MyItemsShell.tsx
app/src/components/uncapsulated/UncapsulatedShell.tsx
```

**Structure Decision**: Keep the canonical icon definitions in the existing dashboard navigation component and reuse them from legacy local wardrobe sidebars until those screens can be migrated to a fully shared navigation frame.

## Complexity Tracking

No constitution violations identified before implementation.
