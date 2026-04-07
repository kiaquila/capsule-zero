# Feature: Marketplace Link Import

> Source: US-011 (spec.md). Prototype: `html-prototypes/guided-journey.html` (tab "Paste Links")

## Overview
- **Purpose:** Paste marketplace URLs → system parses item data automatically (killer feature)
- **User:** User adding items during Journey Step 3 or from My Items
- **Entry point:** "Paste Links" tab in Journey Step 3
- **Emotional target:** CREATIVITY — "I pasted links — and items are already here. Magic!"

## User Flow
1. User pastes one or multiple marketplace URLs
2. System parses each URL: name, category, colors, all photos, brand, material/composition, source URL
3. For each parsed item: minimalist interface to choose one photo from several
4. Auto-tagging displayed — user can correct before saving
5. Save → items added to wardrobe / capsule

## Parsing Strategy (v0.1)
Best-effort generic parsing for product URLs, with optional retailer-specific adapters for higher accuracy.

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Empty input | Text area with placeholder "Paste product URLs..." |
| Parsing | URLs submitted | Loading state with progress indicator, cards appear one-by-one |
| Parsed | Items extracted | Item cards with photo selector + auto-tagged fields |
| Editing | User correcting | Editable fields: name, category, color dots |
| Error | URL not recognized | Error state: "URL not recognized" per failed link |
| Saved | Items confirmed | Items added to capsule/wardrobe |

## Acceptance Criteria
1. One or multiple URLs accepted
2. System parses: name, category, colors, all photos, brand, material/composition, source URL
3. Minimalist interface — choose one photo from several
4. Auto-tagging editable before saving
5. Loading state with parsing progress shown
6. Error state for unrecognized links
7. Generic product URLs are accepted; unsupported or non-product pages return a clear parsing error

## Key Components
- **LinkInput** — textarea for pasting URLs (multi-line support)
- **ParseProgress** — animated progress per URL
- **ParsedItemCard** — photo carousel + auto-tagged fields (editable)
- **PhotoSelector** — horizontal gallery to pick one from multiple parsed photos

## Edge Cases
- Unsupported or non-product page → clear error per URL
- URL leads to unavailable product → error with explanation
- Multiple URLs (batch) → parse sequentially, show progress
- Duplicate URL → warn user, skip duplicate
- Very slow connection → timeout with retry option

## Related Features
- f-006-guided-journey.md — Parent flow (Step 3)
- f-005-my-items.md — Items appear in My Items grid after save
- f-015-opr.md — Imported items contribute to capsule's OPR
