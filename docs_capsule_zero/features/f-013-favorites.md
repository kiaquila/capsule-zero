# Feature: Favorites

> Source: US-019 (spec.md). Prototype: `html-prototypes/favorites.html`

## Overview
- **Purpose:** Save items to favorites for quick access — both own items and catalog items
- **User:** Authenticated user
- **Entry point:** `/favorites` (from Dashboard), heart icon on any item card
- **Emotional target:** "My favorites — and inspiration from catalogs"

## User Flow
1. User clicks heart icon on any item card (own or from catalog)
2. Item added to Favorites
3. Favorites section shows two sub-sections: "My" and "From Catalogs"
4. Items sorted by date added

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Favorites loaded | Two sub-sections with item cards |
| Empty | No favorites | Empty state with suggestion to browse items |
| Adding | Heart clicked | Heart icon animates to filled red |
| Removing | Heart un-clicked | Heart icon animates to outline |

## Acceptance Criteria
1. Heart icon on any item card → adds to favorites (own or catalog)
2. Two sub-sections: "My" and "From Catalogs"
3. Sorted by date added
4. Heart icon: `rgba(220,30,50,.90)` saturated red when active

## Key Components
- **FavoriteButton** — heart icon with toggle animation
- **FavoritesList** — two-section layout (My / From Catalogs)
- **FavoriteCard** — item card with unfavorite action

## Edge Cases
- Favorite a catalog item → stays in "From Catalogs" section
- Delete own item → removed from favorites automatically
- Catalog item removed from shared DB → show placeholder or remove

## Related Features
- f-003-dashboard.md — Favorites section on dashboard
- f-005-my-items.md — Heart icon on item cards
- f-008-semantic-search.md — Catalog items can be favorited
