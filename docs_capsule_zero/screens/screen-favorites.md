# Screen: Favorites
URL: /favorites
Feature: features/f-013-favorites.md
Prototype: `html-prototypes/favorites.html`

> **Q8 implementation gate (2026-07-24):** “From Catalogs” is retained as a
> target screen concept, but shared user-imported merchant items must not be
> loaded or persisted until the compliance-scheme spec and external legal
> review have both landed. Capsule Zero-owned presets are a separate Stage-2
> source.

## Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ [← Dashboard]         Favorites (12)         [Avatar]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  My Items                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ ██████  │ │ ██████  │ │ ██████  │ │ ██████  │      │
│  │ White   │ │ Black   │ │ Navy    │ │ Beige   │      │
│  │ T-shirt │ │ Blazer  │ │ Coat    │ │ Loafers │      │
│  │ ●●      │ │ ●       │ │ ●       │ │ ●●      │      │
│  │ [♥]     │ │ [♥]     │ │ [♥]     │ │ [♥]     │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  From Catalogs                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ ██████  │ │ ██████  │ │ ██████  │                   │
│  │ COS     │ │ Zara    │ │ H&M     │                   │
│  │ Sweater │ │ Boots   │ │ Bag     │                   │
│  │ ●       │ │ ●       │ │ ●●      │                   │
│  │ [♥] catalog│ │ [♥] catalog│ │ [♥] catalog│                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [My Items] [Capsules] [♡] [Profile]                    │
└─────────────────────────────────────────────────────────┘
```

## Elements
- **Two target sections:** "My Items" and "From Catalogs"; the merchant-backed section is
  Q8-gated and must remain non-operational until both gates land
- **Item Cards:** Photo + name + color dots + filled heart (♥)
- **Heart icon:** `rgba(220,30,50,.90)` saturated red when active
- **Catalog badge:** "From catalog" label on catalog items
- **Sorting:** By date added (newest first)

## Interactivity
- Click [♥] → remove from favorites (heart reverts to outline)
- Click card → navigate to item detail
- Sorted by date added
