# Prototype Map — Capsule Zero MVP v0.1

> Maps each HTML prototype to its corresponding spec sections, user stories, and screens.
>
> Landing authority was updated on 2026-07-17 by specs 043/044. The original
> `html-prototypes/index.html` remains historical and is not the active landing contract.
>
> **Q8 implementation gate (2026-07-24):** the link-import, shared-catalog search, and public
> imported-item prototype states remain design references for retained US-011/US-012/US-025, not
> implementation authority. They stay disabled until the compliance-scheme spec and external legal
> review are both complete. The accepted OpenAPI/generated client intentionally omit that surface.

## Screen Inventory

| #   | Screen                       | HTML Prototype                                                     | User Stories                   | States                                    | Emotional Phase    |
| --- | ---------------------------- | ------------------------------------------------------------------ | ------------------------------ | ----------------------------------------- | ------------------ |
| 1   | Landing Page                 | `html-prototypes/landing-v2/v1c-final.html`                        | US-001                         | Hero, Auth sign-up/sign-in, Below fold    | ATTRACTION         |
| 2   | Registration / Login         | `html-prototypes/auth.html` + live `LandingPage`/`AuthPanel` popup | US-002, US-003                 | Default, Loading, Error, Success          | TRUST              |
| 3   | Dashboard (Personal Cabinet) | `html-prototypes/dashboard.html`                                   | US-004, US-023                 | Active capsule, Summary, Quick access     | TRUST → CREATIVITY |
| 4   | My Items (Grid)              | `html-prototypes/my-items.html`                                    | US-006, US-007                 | Empty, Filled, Filter active              | SATISFACTION       |
| 5   | Item Detail Card             | `html-prototypes/my-items.html` (modal/detail)                     | US-007                         | View, Edit                                | SATISFACTION       |
| 6   | Guided Journey Step 1/3      | `html-prototypes/guided-journey.html`                              | US-008                         | Default, Selected                         | CREATIVITY         |
| 7   | Guided Journey Step 2/3      | `html-prototypes/guided-journey.html`                              | US-009                         | Default, Validation error                 | CREATIVITY         |
| 8   | Guided Journey Step 3/3      | `html-prototypes/guided-journey.html`                              | US-010, US-011, US-012, US-017 | Default, Upload; Parsing/Search gated by Q8 | CREATIVITY         |
| 9   | Import by Links              | `html-prototypes/guided-journey.html` (tab "Paste Links")          | US-011                         | Design-only until both Q8 gates close      | CREATIVITY         |
| 10  | Search from Catalog          | `html-prototypes/guided-journey.html` (tab "Search Catalog")       | US-012                         | Own-preset design; shared corpus Q8-gated  | CREATIVITY         |
| 11  | Capsule Result               | `html-prototypes/capsule-result.html`                              | US-013, US-014, US-015, US-016 | Default, Editing                          | SATISFACTION       |
| 12  | Uncapsulated                 | `html-prototypes/uncapsulated.html`                                | US-020                         | Empty, Filled                             | —                  |
| 13  | Favorites                    | `html-prototypes/favorites.html`                                   | US-019                         | Empty, Filled (My / From catalogs)        | —                  |
| 14  | Shopping List                | `html-prototypes/capsule-result.html` (tab)                        | US-013                         | Empty, Filled                             | SATISFACTION       |
| 15  | For Sale                     | `html-prototypes/for-sale.html`                                    | US-021                         | Empty, Filled                             | —                  |
| 16  | For Repair                   | `html-prototypes/for-repair.html`                                  | US-024                         | Empty, Filled                             | —                  |
| —   | Profile                      | `html-prototypes/profile.html`                                     | US-005, US-018                 | View, Edit                                | TRUST              |
| —   | Design System                | `html-prototypes/design-system.html`                               | —                              | —                                         | —                  |

## Prototype Details

### `html-prototypes/landing-v2/v1c-final.html` — Landing Page

- **Spec sections:** US-001 (Landing), US-002/US-003 (Auth popup)
- **Content:** One-viewport B&W wallpaper hero with gold logo, two-line product-value headline,
  supporting copy, one gold CTA, secondary ghost Log In, EN/RU switcher, scroll cue, and footer
- **Key interactions:** hero CTA temporarily opens the live `AuthPanel` in sign-up mode (spec 044)
  until guest onboarding ships; ghost Log In opens the same panel in sign-in mode
- **Historical artifact:** `html-prototypes/index.html` documents the retired poster/manifesto
  direction and is not an implementation source

### `html-prototypes/auth.html` — Standalone Authentication

- **Spec sections:** US-002 (Registration), US-003 (Authorization)
- **Content:** Stage 1 white glass form, email+password fields, inline validation, language switcher; Google + Apple OAuth are Stage 2
- **Key interactions:** Real-time field validation, instant redirect to Dashboard on success

### `html-prototypes/dashboard.html` — Dashboard / Personal Cabinet

- **Spec sections:** US-004 (Dashboard), US-023 (OPR)
- **Content:** Active capsule hero card, OPR widget, summary stats, shopping list preview, recently added items, quick-access cards, bottom navigation and More sheet
- **Navigation model:** direct tabs for Dashboard / My Items / Capsules / Favorites, with Outfits, Uncapsulated, Shopping List, For Sale, For Repair in the extended navigation

### `html-prototypes/guided-journey.html` — Guided Journey (3 Steps)

- **Spec sections:** US-008 (Step 1), US-009 (Step 2), US-010 (Step 3), US-011 (Import), US-012 (Search), US-017 (Photo upload)
- **Step 1:** Three large cards (Women's/Men's/Mixed), progress 1/3
- **Step 2:** Textual category checklist, quantity steppers, "Add your own category" CTA, progress 2/3
- **Step 3:** Add Items first, then Color Palette. Achromats appear first, followed by all other
  colors in one grid. Users can select any number of compatible colors; incompatible colors are
  blocked. The prototype's link-import and shared-search tabs are not active implementation
  contracts before both Q8 gates close; P2 may implement the separate own-imagery preset picker.

### `html-prototypes/capsule-result.html` — Capsule Result

- **Spec sections:** US-013 (Result), US-014 (Remove from capsule), US-015 (Replace item), US-016 (Add item)
- **Content:** Item grid with color dots, outfit combinations (static), gap analysis (text: category + color), shopping list (category + color + priority + impact), OPR prominently displayed
- **Key interactions:** Remove/Replace/Add item actions, all trigger recomputation of outfits and gap analysis

### `html-prototypes/my-items.html` — My Items

- **Spec sections:** US-006 (Grid view), US-007 (Edit), US-019 (Favorites), US-021 (For Sale), US-024 (For Repair)
- **Content:** Card grid (photo + name + color dots), capsule membership indicator, filter by category/color, click → detail card
- **Detail card:** Large photo, all fields (name, category, color dots, brand, material/composition, price), Edit/Favorite/Move to Sale/Move to Repair actions

### `html-prototypes/uncapsulated.html` — Uncapsulated Items

- **Spec sections:** US-020
- **Content:** Same grid as My Items, but only items not in any capsule. CTAs: add to capsule / move to sale / move to repair. Filter by category.

### `html-prototypes/favorites.html` — Favorites

- **Spec sections:** US-019
- **Content:** Two sub-sections: "My" and "From Catalogs". Card grid. Sorted by date added.

### `html-prototypes/for-sale.html` — For Sale

- **Spec sections:** US-021
- **Content:** Items marked for sale. Not counted in capsules or statistics. Can be returned to My Items.

### `html-prototypes/for-repair.html` — For Repair

- **Spec sections:** US-024
- **Content:** Items marked for repair. Not counted in capsules or statistics. Can be returned to My Items or Uncapsulated. If was in capsule — removed, outfits recomputed.

### `html-prototypes/profile.html` — Profile / Settings

- **Spec sections:** US-005 (Avatar), US-018 (Multilingual)
- **Content:** Prototype includes an expanded settings surface. For MVP, only avatar, profile basics, language, and logout are in scope; advanced security/settings remain design-only post-MVP

### `html-prototypes/design-system.html` — Design System Reference

- **Purpose:** Complete visual reference for all tokens, components, and patterns. Developer handoff document.
- **Content:** Color tokens, typography scale, glass panel variants, button states, input states, card patterns, navigation, icons, spacing grid.

## Cross-cutting User Stories (No Dedicated Screen)

| US     | Feature               | Where Implemented                                                                        |
| ------ | --------------------- | ---------------------------------------------------------------------------------------- |
| US-017 | Photo Upload          | `html-prototypes/guided-journey.html` Step 3, `html-prototypes/my-items.html` (Add item) |
| US-018 | Multilingual          | All screens (language switcher on landing + profile)                                     |
| US-022 | Cost per Wear         | `html-prototypes/my-items.html` (detail card, NICE-TO-HAVE)                              |
| US-023 | OPR Display           | `html-prototypes/dashboard.html` (capsule card)                                          |
| US-025 | Public Imported Items | Design-only backend story; blocked by Q8 compliance spec + external legal review         |

## Viewing Prototypes

```bash
cd html-prototypes
python3 -m http.server 3100
# Then open http://localhost:3100/<filename>.html
```
