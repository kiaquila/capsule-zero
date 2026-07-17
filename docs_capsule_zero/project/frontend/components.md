# Components Guide

## Purpose

This guide defines frontend component conventions for implementing the approved Capsule Zero prototypes in React while preserving the premium glassmorphism system.

## Source Of Truth

Use these references in order:

1. `html-prototypes/` for approved screen behavior, layout, and scope
2. `html-prototypes/design-system.html` for component visuals
3. `docs_capsule_zero/project/frontend/styling.md` for exact glass tokens
4. `app/src/styles/tokens.css` for Tailwind v4 theme tokens
5. Feature and screen docs under `docs_capsule_zero/features/` and `docs_capsule_zero/screens/`

## Component Organization

Recommended structure:

```text
app/src/
  components/
    ui/
      Button.tsx
      GlassPanel.tsx
      GlassInput.tsx
      IconButton.tsx
      BottomNav.tsx
      Sheet.tsx
    features/
      auth/
      dashboard/
      journey/
      items/
      capsule/
      profile/
  lib/
    supabase/
    api/
    i18n/
    methodology/
  store/
```

## Glass Components

All containers that visually behave as panels, sheets, nav, menus, cards, or modals must use glass surfaces. Do not replace them with opaque solid backgrounds.

| Component | Variant | Notes |
|---|---|---|
| `GlassPanel` | main | Main content panels, blur 40px/44px depending prototype |
| `GlassSheet` | sheet | Bottom sheets and modal sheets |
| `GlassNav` | nav | Header, bottom nav, floating navigation |
| `GlassInput` | input | Text fields, URL textareas, search fields |
| `GlassButton` | primary/social/ghost | CTA, OAuth, secondary actions |

## Achromatic UI Rule

Interface colors are black, white, and grey only. Color appears only through:

- garment photos
- color dots from the 51-color wardrobe system
- favorite heart active state
- error/warning signal red `#FF5449` (`--color-error`; text on scrim chips `--color-error-text` `#FF7A70`) — Q4, 2026-07-16
- the gold accent family `#EFBF04→#FFDD00` (`--color-gold-*`, `--btn-cta-*`) — primary CTA and logo accent only, never statuses

Do not introduce decorative purple/blue gradients, beige themes, colored cards, or opaque accent panels.

## Server And Client Components

Default to Server Components for route-level composition and initial data reads.

Use Client Components for:

- tabs and segmented controls
- forms and inline validation
- drag-and-drop uploads
- image preview/cropping interactions
- Journey local state
- filters and sort controls
- optimistic item/favorite/status mutations

Push `use client` as low as possible. Route pages should stay server-rendered unless the entire screen is inherently interactive.

## Forms

- Use React Hook Form + Zod.
- Validate in real time where prototypes require it.
- Errors are inline, never alert popups.
- Error color is `#FF5449` (signal red, `--color-error`; on-scrim text `--color-error-text`) — decided 2026-07-16 (Q4); never gold or yellow.
- Required item fields: name, category, at least one color dot.

## Controls

- Use icon buttons for compact tool actions when an icon exists.
- Use segmented controls for modes and tabs.
- Use checkboxes/toggles for binary settings such as background removal.
- Use steppers or number inputs for category quantities.
- Use menus for language and item actions.
- Add tooltips for unfamiliar icons.

## Layout Rules

- Mobile-first at 375px. Treat phone layouts as the primary design target, not a responsive afterthought.
- Tablet target: 768px.
- Desktop target: 1280px+.
- Use 8px spacing grid.
- Text must not overflow buttons, cards, or nav items.
- Do not nest cards inside cards.
- Do not style full page sections as floating cards.
- Repeated item cards may use cards; page structure should use full-width bands or unframed constrained layouts.

## Domain Components

| Component | Notes |
|---|---|
| `ColorDot` | Renders one color from `color_catalog`; not an interface accent |
| `ColorDotStrip` | Used on item cards, capsule cards, palette preview |
| `PaletteSelector` | Enforces achromats-first display and compatibility disabled state |
| `CategoryStepper` | Used in Journey Step 2 |
| `ItemCard` | Photo, name, color dots, capsule membership, status/favorite controls |
| `ItemDetail` | View/edit state for name, category, colors, brand, material, price |
| `UploadTabs` | Photo upload, marketplace links, catalog search |
| `OPRDisplay` | Formatted `outfits / items` with delta |
| `ShoppingListRow` | Category, color, priority, impact |
| `BottomNav` | Primary mobile navigation |

## Accessibility

- All interactive elements need accessible names.
- Icon-only actions need `aria-label`.
- Modals and sheets must trap focus.
- Form errors must be announced through accessible descriptions.
- Color dots need text labels in accessible names, not color-only meaning.
- Navigation must be keyboard usable.

## Motion

- Use subtle 200-300ms ease-out transitions.
- Use skeleton loading states instead of spinners where content shape is known.
- Parsing/import cards may appear progressively one by one.
- Page transitions should remain instant unless the prototype explicitly defines motion.

## Review Checklist

Before marking a component ready:

- Matches prototype layout and behavior.
- Uses glass tokens from `styling.md`.
- Uses achromatic UI only.
- Is responsive at 375px, 768px, 1280px.
- Has loading, empty, error, and success states where relevant.
- Routes user-facing text through i18n.
- Has accessible labels and keyboard behavior.
- Does not bypass domain validation in the UI.
