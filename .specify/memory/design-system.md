# Capsule Zero Design System

> Source: Styling Guide v1.3, `html-prototypes/design-system.html` prototype, MEMORY.md glass tokens

## 1. Color System

### Interface Palette (Achromatic)
The interface is strictly achromatic. Color enters ONLY through the user's garment items.

### Wardrobe Color System
3 Achromatics (Black `#1C1C1C`, Gray `#8C8C8C`, White `#F0F0F0`) + 48 chromatic colors in 4 groups (Brights, Pastels, Desaturated, Darks). Achromatics are universal connectors — compatible with all 51 colors. → Full table: `docs_capsule_zero/project/methodology/colors.md`

### Glass Surface Tokens
| Element | Background | Blur | Border | Shadow |
|---|---|---|---|---|
| Main panels | `rgba(255,255,255,0.22)` | `blur(40px)` | `1px solid rgba(255,255,255,.58)` | `0 8px 32px rgba(0,0,0,.22)` |
| Nav | `rgba(255,255,255,0.13)` | `blur(44px)` | — | — |
| Bottom sheets | `rgba(255,255,255,0.22)` | `blur(44px)` | `1px solid rgba(255,255,255,.58)` | — |
| Language menu | `rgba(255,255,255,0.28)` | `blur(32px)` | — | — |
| Cookie banner | `rgba(255,255,255,0.22)` | `blur(32px)` | — | — |
| Inner highlight | — | — | `inset 0 1px 0 rgba(255,255,255,.72)` | — |

### Background
- `wall.png` — grayscale photographic wallpaper
- Gradient overlay: `rgba(0,0,0,.58)` → `rgba(0,0,0,.40)` → `rgba(0,0,0,.68)`

### Text on Glass (White)
| Token | Value | Usage |
|---|---|---|
| `--gt-p` | `rgba(255,255,255,.95)` | Primary text |
| `--gt-s` | `rgba(255,255,255,.70)` | Secondary text |
| `--gt-ph` | `rgba(255,255,255,.38)` | Placeholder |

### Functional Colors
| Purpose | Value | Notes |
|---|---|---|
| Error/Warning | `#FFD600` | Yellow, not red |
| Favorite active | `rgba(220,30,50,.90)` | Saturated opaque red |
| Favorite border | `rgba(255,60,80,.70)` | — |

### Button Tokens
| Type | Background | Notes |
|---|---|---|
| Primary | `rgba(255,255,255,.36)` | Glass button |
| Social | `rgba(255,255,255,.28)` | OAuth buttons |
| Apple icon | `fill="rgba(0,0,0,.82)"` | Always black (does not inherit text color) |

## 2. Typography

- **Font family:** Helvetica Neue / Arial (system fallback)
- **Headings:** Thin, wide, letter-spacing
- **Body:** Grotesque (sans-serif)
- **Grid:** 8px base

## 3. Glassmorphism Component Patterns

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

### Navigation
- Bottom navigation for mobile (tested and validated)
- 8px grid alignment
- Glass surface consistency across all containers

## 4. Spacing & Grid

- **Base unit:** 8px
- **Common spacings:** 8, 16, 24, 32, 40, 48px
- **Border radius:** 12px (buttons, inputs), 24px (panels/cards)
- **Responsive breakpoints:**
  - Mobile: 375px+ (iPhone 14+)
  - Tablet: 768px+ (iPad)
  - Desktop: 1280px+

## 5. Animation & Interaction Principles

### Transitions
- **Page transitions:** Instant (no slide/fade between pages)
- **Element transitions:** 200-300ms ease-out
- **Completion feedback:** Quiet checkmark, soft glow

### Micro-interactions
- Every user action receives visual response
- Zero "dead zones"
- Parsing animation (marketplace import): cards appear one after another
- Loading states: skeleton screens, not spinners

### Validation
- Inline validation in real-time
- Errors: inline, no alert-okon (popups)
- Color compatibility warnings: block with explanation + alternative suggestion

## 6. i18n Content Reference

All active MVP v1 UI text exists in EN and RU, with ES-AR retained as MVP v2 reference copy. See Styling Guide v1.3 Section 7 for exact copy per screen per language, covering:
- Guided Journey Steps 1-3
- Capsule Result screen
- All CTA buttons and error messages

## 7. Validation Rules Summary

| Rule | Value/Threshold | Behavior |
|---|---|---|
| Palette: min achromats | 0 | No blocking |
| Palette: max colors | No hard cap | Naturally constrained by combinability rules |
| Categories: min selected | 8 | Blocks progress |
| Categories: max slots | No limit | Soft size label |
| Items per category | Min 0, default 1, no cap | Stepper |
| Total items in capsule | Min 7 / max 40 (limit 50) | Min blocks creation; 40–50 shows warning + suggest new capsule |
| Custom category | Basicity algorithm | Rejection with explanation |
| Item color vs palette | Temperature-or-saturation compatibility | Block with recommendation |
| Photo upload: format | JPEG, PNG, WebP | Error for others |
| Photo upload: size | Max 10 MB | Error with compress suggestion |
| Import links | Best-effort generic product URL parsing | Error for unsupported or non-product pages |

## 8. Glossary

| Term | Definition |
|---|---|
| Achromatic color | Color without hue: Black, Gray, White (3 colors, IDs A1–A3). Always compatible with all 51 colors. |
| Auto-tagging | AI classification of items: name, category, color dots, basicity score. |
| Basic capsule | Capsule of basic items — simple cuts, solid colors, maximum combinability. |
| Basicity | How "basic" an item is: simple silhouette, solid color potential, high combinability score. |
| Color dots | 1–3 circles — dominant colors of an item, extracted from photo. |
| Color temperature | Warm (yellow/orange undertone) vs Cool (blue/pink) vs Neutral. |
| Gap analysis | Detection of missing items to increase outfit potential. |
| Guided Journey | 3-step capsule creation flow: type > categories > colors+items. |
| Outfit Productivity Ratio | Outfits / items count. |
| Palette lock | After confirmation, palette cannot be changed (v0.1 constraint). |
| Saturation | Color brightness: muted (dusty), bright (vivid), deep (dark saturated). |
| Shopping list | Prioritized purchase list based on gap analysis. |
