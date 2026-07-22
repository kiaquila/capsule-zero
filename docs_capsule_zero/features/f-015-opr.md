# Feature: OPR, Cost per Wear & Shared Item Database

> Source: US-022, US-023, US-025 (spec.md)

## Outfit Productivity Ratio (US-023) — P1

### Overview
- **Purpose:** Hero metric showing capsule efficiency — outfits per item
- **Formula:** OPR = wearable outfits / wardrobe pieces that build them (**core + accessory items**).
  Structural layers (cardigan/blazer/coat) are tracked as a separate **Layering Coverage** score, not
  in the denominator. Full counting model (base looks + bounded accessory variations):
  `docs_capsule_zero/project/methodology/outfit-generation.md` §3 (ratified 2026-07-21, PRODUCT-PLAN §4 Q1).

### Display
- **Dashboard:** shown on capsule card in format "X.X" (e.g., 4.2)
- **Capsule Result:** hero metric at top
- **Delta:** "+0.3 from last change" shown after every modification

### Acceptance Criteria
1. OPR shown on dashboard capsule card in format "X.X"
2. Recalculated on every capsule change (add/remove/replace)
3. Delta shown: "+0.3 from last change"

### Benchmarks
- "80–150+ outfits from 30 items" is a **floor for core base looks**; the accessorised hero total is
  higher (bounded — at most a small constant factor above core) and is fixed by algorithm-v0 validation,
  not asserted as a benchmark here
- No "good/bad" evaluation — just a number
- Higher is better (more outfit combinations per item)

## Cost per Wear (US-022) — P2 (NICE-TO-HAVE)

### Overview
- **Purpose:** Track purchase effectiveness — price / number of wears
- **Priority:** P2 — nice-to-have for v0.1

### User Flow
1. User enters purchase price in item edit form
2. System tracks wear count (mechanism TBD in v0.1)
3. Cost per wear = price / wears
4. Displayed on item card

### Acceptance Criteria
1. Price field available in item editing
2. Cost per wear calculated: price / wears
3. Shown on item card

## Public Imported Items / Shared Database (US-025) — P1

### Overview
- **Purpose:** Marketplace imports feed the shared database for semantic search enrichment
- **Architecture:** Single record with publicity flag — no duplication

### User Flow
1. User imports item via marketplace link
2. Item stored in shared DB with owner flag (private)
3. After user confirms auto-tagging → internal moderation triggered
4. On moderation pass → item gets "public" flag → available in semantic search
5. Personal photos never become public (v0.1)

### Acceptance Criteria
1. Marketplace import stored in shared DB with private flag
2. After auto-tagging confirmed → moderation triggered
3. On approval → "public" flag, available in semantic search
4. Single record with publicity flag (no duplication)
5. Personal photos do NOT become public in v0.1

## Key Components
- **OPRDisplay** — formatted number + delta indicator
- **CostPerWear** — price / wears calculation display (P2)
- **ModerationQueue** — internal moderation for shared DB items

## Related Features
- f-009-capsule-result.md — OPR displayed on result screen
- f-003-dashboard.md — OPR on capsule card
- f-010-capsule-management.md — OPR recalculated on changes
- f-007-marketplace-import.md — Items feed shared database
- f-008-semantic-search.md — Shared DB powers catalog search
