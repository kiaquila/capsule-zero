# Implementation Plan: Stage 1 For Repair

**Branch**: `codex/stage-1-for-repair` | **Date**: 2026-06-14 | **Spec**: `.specify/specs/019-stage-1-for-repair/spec.md`
**Input**: Feature specification from `.specify/specs/019-stage-1-for-repair/spec.md`

## Summary

Implement the authenticated Stage 1 For Repair screen from the approved prototype by reusing existing wardrobe card/detail UI, adding repair-specific local actions, and updating shared statistic logic so repair items are excluded while under repair.

## Technical Context

**Language/Version**: TypeScript, React 19, Next.js 16.2.6 App Router
**Primary Dependencies**: Next.js App Router, next-intl, Tailwind CSS v4 tokens, mock provider registry
**Storage**: Stage 1 mock provider fixtures plus client-local preview state
**Testing**: `check:feature-memory`, ESLint, TypeScript, Next build, preflight, browser smoke checks
**Target Platform**: Mobile-first web, desktop 1280px+, tablet/mobile responsive layouts
**Project Type**: Next.js web application
**Performance Goals**: Keep route static-shell friendly and reuse existing client-side wardrobe surfaces
**Constraints**: Glassmorphism UI, achromatic interface, EN/RU only for MVP v1, provider writes remain mock/local
**Scale/Scope**: One Stage 1 screen plus shared statistic exclusion rule

## Constitution Check

- Glassmorphism UI: PASS; For Repair uses existing glass dashboard, filter, card, detail, and toast surfaces.
- Achromatic interface: PASS; no new chromatic UI except existing yellow validation/delete accent and garment color dots.
- Direct, Not Dictate: PASS; Mark as Fixed returns item to Uncapsulated instead of silently forcing it into a capsule.
- Premium quality bar: PASS; desktop and 375x812 mobile browser smoke checks completed.
- Three upload methods: N/A for this screen; local photo preview keeps the existing wardrobe edit behavior.
- Engineering reuse: PASS; new screen uses shared `WardrobeItemCard`, `WardrobeItemDetailPanel`, and `wardrobe-statistics`.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| US1-AC1 authenticated `/en/for-repair` shows only repair items | Browser MCP after mock sign-in at `http://127.0.0.1:3000/en/for-repair`: `h1="For Repair"`, `articleCount=1`, card text `Black leather loafers ... For Repair`. |
| US1-AC2 For Repair count matches grid and nav badge | Browser MCP initial state: subtitle `1 item needs attention`, nav includes `For Repair1`, grid has 1 article. |
| US2-AC1 detail save updates item locally | Browser MCP detail panel: filled `Repair notes` with `Replace heel cap and polish leather.`, clicked `Save`, observed toast `Black leather loafers saved.` |
| US2-AC2 favorite toggle updates item and Favorites count | Browser MCP: clicked `Toggle favorite for Black leather loafers`, observed `my-items-fav-active` and nav `Favorites3` from initial `Favorites2`. |
| US2-AC3 delete removes item and updates counts | Browser MCP after reload: clicked `Delete Black leather loafers`, observed `articleCount=0`, toast `Black leather loafers deleted from My Items.`, nav `My Items3`, `Uncapsulated1`, `Favorites2`, `For Repair0`. |
| US3-AC1 Mark as Fixed removes item from For Repair | Browser MCP detail panel: clicked `Mark as Fixed`, observed `articleCount=0`, empty title `Nothing needs repair`, toast `Black leather loafers marked fixed and returned to Uncapsulated.` |
| US3-AC2 fixed item returns to Uncapsulated/My Items counts without capsule membership | Browser MCP after `Mark as Fixed`: nav `My Items4`, `Uncapsulated2`, `For Repair0`; detail copy before action showed `Removed from capsules until fixed`. |
| FR-004 repair items excluded from wardrobe statistics | Browser MCP dashboard after sign-in showed `My Items3` and `For Repair1`; `npm run preflight` passed after shared statistic helper change. |
| FR-011 EN/RU only, no ES-AR controls | Browser MCP EN and RU checks: language buttons only `EnglishEN` and `РусскийRU`; RU `h1="В ремонт"` and subtitle `1 вещь требует внимания`; `leakedKeys=false`. |
| FR-012 shared item card/detail reuse | Browser MCP final cleanup: For Repair card `class="my-items-card"`, grid `class="my-items-grid"`, badges `["For Repair"]`, no visible `Needs repair`, no grid `Fixed/Delete` actions; diff review confirms `WardrobeItemCard` and `WardrobeItemDetailPanel` reuse. |

Negative scenario evidence:

- Unauthenticated redirect: `curl -I -s http://127.0.0.1:3000/en/for-repair` returned `HTTP/1.1 307 Temporary Redirect` with `location: /en/auth`.
- Unsupported photo upload rejection: source inspection at `app/src/components/for-repair/ForRepairShell.tsx:398` and `:403` verifies MIME and 10 MB guards return before `URL.createObjectURL`; Browser file upload was not available in the smoke API.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/019-stage-1-for-repair/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/src/app/[locale]/for-repair/page.tsx
app/src/components/for-repair/ForRepairShell.tsx
app/src/components/for-repair/for-repair-data.ts
app/src/components/wardrobe/wardrobe-statistics.ts
app/src/messages/en.json
app/src/messages/ru.json
app/src/app/globals.css
```

**Structure Decision**: Keep For Repair colocated beside existing Stage 1 wardrobe lifecycle screens and share the established wardrobe card/detail components.

## Complexity Tracking

No constitution violations.
