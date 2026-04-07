# Screen: Favorites
URL: /favorites
Feature: features/f-013-favorites.md
Prototype: `html-prototypes/favorites.html`

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
- **Two sections:** "My Items" and "From Catalogs"
- **Item Cards:** Photo + name + color dots + filled heart (♥)
- **Heart icon:** `rgba(220,30,50,.90)` saturated red when active
- **Catalog badge:** "From catalog" label on catalog items
- **Sorting:** By date added (newest first)

## Interactivity
- Click [♥] → remove from favorites (heart reverts to outline)
- Click card → navigate to item detail
- Sorted by date added
