# Feature: Semantic Search from Shared Database

> Source: US-012 (spec.md). Prototype: `html-prototypes/guided-journey.html` (tab "Search Catalog")

## Overview
- **Purpose:** Find items from shared database by text description — populate capsule without photos
- **User:** User adding items during Journey Step 3
- **Entry point:** "Search Catalog" tab in Journey Step 3
- **Emotional target:** CREATIVITY — "I can find anything I want — and it's all matched to my palette"

## User Flow
1. User types free-text description (e.g., "chocolate loafers")
2. Semantic search returns matching results from shared database
3. Results displayed as cards with photos
4. User selects item → added to capsule with "From catalog" label
5. Later, user can replace catalog item with their own

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Empty search | Text input with placeholder |
| Searching | Query submitted | Loading indicator |
| Results | Matches found | Grid of item cards with photos |
| No results | No matches | "No items found" + suggestion to try different terms |
| Selected | Item chosen | Item added to capsule with "From catalog" badge |

## Acceptance Criteria
1. Free text search (e.g., "chocolate loafers") → semantic results from shared DB
2. Results displayed as cards with photos
3. Selected item added to capsule with "From catalog" label
4. User can later replace catalog item with their own item

## Key Components
- **CatalogSearch** — text input with debounced search
- **CatalogResultGrid** — grid of matching item cards
- **CatalogItemCard** — photo + name + color dots + "From catalog" badge

## Edge Cases
- No results → suggest broadening search terms
- Shared DB empty → inform user, suggest photo upload or link import
- Item color incompatible with palette → block with recommendation

## Related Features
- f-006-guided-journey.md — Parent flow (Step 3)
- f-015-opr.md — US-025: items from shared DB feed back into it
