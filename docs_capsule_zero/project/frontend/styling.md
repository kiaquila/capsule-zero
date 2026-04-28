# Frontend Styling — Capsule Zero

> Source: design-system.md, `html-prototypes/design-system.html` prototype, tokens.css. Glassmorphism UI with achromatic interface.

## Design Philosophy

- **Glassmorphism** — frosted glass surfaces, backdrop blur, translucent layers
- **Achromatic interface** — black / white / grey only; color comes ONLY from user's wardrobe items
- **8px grid** for all spacing
- **"Screenshot test"** — every screen must be worth screenshotting
- **Premium positioning** — "the Aesop of wardrobe apps"

## Color System

### Interface Palette (Achromatic Only)
The interface is strictly achromatic. Color enters ONLY through the user's garment items and color dots.

### Background
- `wall.png` — grayscale photographic wallpaper (full viewport)
- Gradient overlay: `rgba(0,0,0,.58)` → `rgba(0,0,0,.40)` → `rgba(0,0,0,.68)`

### Text on Glass (White RGBA)

| Token | Value | Usage |
|-------|-------|-------|
| `--gt-p` | `rgba(255,255,255,.95)` | Primary text |
| `--gt-s` | `rgba(255,255,255,.70)` | Secondary text |
| `--gt-ph` | `rgba(255,255,255,.38)` | Placeholder |

### Functional Colors

| Purpose | Value | Notes |
|---------|-------|-------|
| Error / Warning | `#FFD600` | Yellow, not red |
| Favorite active | `rgba(220,30,50,.90)` | Saturated opaque red |
| Favorite border | `rgba(255,60,80,.70)` | Heart icon border |

### Button Tokens

| Type | Background | Notes |
|------|-----------|-------|
| Primary | `rgba(255,255,255,.36)` | Glass button |
| Social | `rgba(255,255,255,.28)` | OAuth buttons |
| Apple icon | `fill="rgba(0,0,0,.82)"` | Always black |

## Glass Surface Tokens

| Element | Background | Blur | Border | Shadow |
|---------|-----------|------|--------|--------|
| Main panels | `rgba(255,255,255,0.22)` | `blur(40px)` | `1px solid rgba(255,255,255,.58)` | `0 8px 32px rgba(0,0,0,.22)` |
| Nav | `rgba(255,255,255,0.13)` | `blur(44px)` | — | — |
| Bottom sheets | `rgba(255,255,255,0.22)` | `blur(44px)` | `1px solid rgba(255,255,255,.58)` | — |
| Language menu | `rgba(255,255,255,0.28)` | `blur(32px)` | — | — |
| Cookie banner | `rgba(255,255,255,0.22)` | `blur(32px)` | — | — |
| Inner highlight | — | — | `inset 0 1px 0 rgba(255,255,255,.72)` | — |

## Component CSS Patterns

### Glass Panel (Primary Container)
```css
background: rgba(255, 255, 255, 0.22);
backdrop-filter: blur(44px);
-webkit-backdrop-filter: blur(44px);
border: 1px solid rgba(255, 255, 255, 0.58);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.22),
  inset 0 1px 0 rgba(255, 255, 255, 0.72);
border-radius: 24px;
```

### Glass Button (Primary)
```css
background: rgba(255, 255, 255, 0.36);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.4);
border-radius: 12px;
```

### Glass Input
```css
background: rgba(255, 255, 255, 0.12);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 12px;
color: rgba(255, 255, 255, 0.95);
```

## Typography

- **Font family:** Helvetica Neue / Arial (system fallback)
- **Headings:** Thin weight, wide, letter-spacing
- **Body:** Grotesque (sans-serif)
- **Grid:** 8px base

## Spacing & Grid

- **Base unit:** 8px
- **Common spacings:** 8, 16, 24, 32, 40, 48px
- **Border radius:** 12px (buttons, inputs), 24px (panels/cards)

### Responsive Breakpoints
- Mobile: 375px+ (iPhone 14+)
- Tablet: 768px+ (iPad)
- Desktop: 1280px+

## Animation & Interaction

### Transitions
- Page transitions: Instant (no slide/fade between pages)
- Element transitions: 200-300ms ease-out
- Completion feedback: Quiet checkmark, soft glow

### Micro-interactions
- Every user action receives visual response
- Zero "dead zones"
- Parsing animation (marketplace import): cards appear one after another
- Loading states: skeleton screens, not spinners

### Validation
- Inline validation in real-time
- Errors: inline, no alert popups
- Color compatibility warnings: block with explanation + alternative suggestion

## Wardrobe Methodology Colors

These are NOT interface colors — they are the wardrobe color system used in capsule building.

3 achromatics (Black, Gray, White) + 48 chromatic colors in 4 groups (Brights, Pastels, Desaturated, Darks). → Full table with HEX, IDs, and roles: `project/methodology/colors.md`

## Navigation

- Bottom navigation for mobile (tested and validated)
- 8px grid alignment
- Glass surface consistency across all containers

## Tailwind Integration

Design tokens are defined in `app/src/styles/tokens.css` as CSS custom properties, consumed by Tailwind v4's `@theme` directive. See `app/tailwind.config.ts` for theme extension mapping.
