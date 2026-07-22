# Feature: Dashboard / Personal Cabinet

> Source: US-004 (spec.md). Prototype: `html-prototypes/dashboard.html`

## Overview
- **Purpose:** Central hub — active capsule, key wardrobe stats, and quick navigation
- **User:** Authenticated user
- **Entry point:** `/dashboard` (post-login redirect)
- **Emotional target:** TRUST → CREATIVITY — "Everything is clear — here is my HQ"

## Dashboard Areas

| Area | Description | Shows |
|---|---|---|
| Active capsule hero | Current capsule summary | Palette, item/outfit/category counts, OPR, secondary Layering Coverage |
| Summary stats | Global wardrobe metrics | Total items, total outfits, uncapsulated count |
| Shopping list preview | Priority recommendations | Top shopping opportunities with role-specific impact |
| Recently added | Latest wardrobe additions | Item name, category, color |
| Quick-access cards | Secondary wardrobe states | Favorites, For Sale, For Repair, Uncapsulated |
| Navigation | Primary app navigation | Dashboard, My Items, Capsules, Favorites, More |

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Empty | New user, no data | Empty dashboard shell with CTA to start |
| Filled | Has capsule + items | Active capsule, stats, previews, quick access |
| Loading | Data fetching | Skeleton cards for each section |

## Acceptance Criteria
1. Active capsule hero card shows palette, counts, OPR, and a separately labelled Layering Coverage percentage (or `N/A`)
2. Capsule actions provide direct access to Open Capsule / Outfits / Shopping List
3. Dashboard shows summary stats, shopping list preview, recently added, and quick-access cards
4. Bottom navigation and More sheet expose the rest of the wardrobe sections
5. Navigation is intuitive across all devices

## Key Components
- **CapsuleHero** — active capsule card showing palette, counts, and OPR
- **StatsRow** — summary metric cards
- **PreviewPanel** — shopping list and recently added panels
- **QuickAccessCard** — compact cards for secondary wardrobe states
- **NavigationShell** — bottom nav + More sheet

## Edge Cases
- Zero items → all counts show 0, empty state prominent
- One capsule with items → full dashboard with all sections
- Items in multiple states → correct counts per section

## Related Features
- f-005-my-items.md — My Items section
- f-006-guided-journey.md — CTA destination for new users
- f-013-favorites.md — Favorites section
- f-014-wardrobe-management.md — Uncapsulated, For Sale, For Repair
- f-015-opr.md — OPR display on capsule card
