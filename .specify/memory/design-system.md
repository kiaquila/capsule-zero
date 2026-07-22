# Capsule Zero Design System

> Source: Styling Guide v1.3, `html-prototypes/design-system.html` prototype, MEMORY.md glass tokens

## 1. Color System

### Interface Palette (Achromatic)
The interface is strictly achromatic. Color enters ONLY through the user's garment items.

### Wardrobe Color System
3 Achromatics (Black `#1C1C1C`, Gray `#8C8C8C`, White `#FFFFFF`) + 48 chromatic colors in 4 groups (Brights, Pastels, Desaturated, Darks). Achromatics are universal connectors — compatible with all 51 colors. → Full table: `docs_capsule_zero/project/methodology/colors.md`

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
- Grayscale photographic wallpaper — delivered as pre-encoded, content-hashed AVIF/WebP
  (`wall.<hash>.avif` / `.webp`, grayscale baked in) over a dark `var(--color-black)` fallback,
  preloaded high-priority and `immutable`-cached at the edge (spec 045; retired the 1.9 MB colour
  `wall.png`)
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
| Error/Warning | `#FF5449` | Signal red (Q4, 2026-07-16 — §9.11); text on scrim chips uses `--color-error-text` `#FF7A70`; yellow `#FFD600` retired |
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
- **Border radius — the real token scale** (`app/src/styles/tokens.css`; the previously documented "12px buttons / 24px panels" never existed as tokens):
  `--radius-xs` 6px (checkboxes, micro-thumbs, segmented/stepper controls) · `--radius-sm` 8px (chips, selects, small cards) · `--radius-md` 14px (inputs, menus, filter panels) · `--radius-lg` 20px (glass panels, modals, toasts) · `--radius-pill` 50px (all action buttons, toggles, badges, meter bars) · `--radius-circle` 50% (color dots, icon buttons, avatars). Per-component assignments ratified in §9.5.
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

All active v0.1 UI text exists in EN and RU, with ES-AR retained as v0.2 reference copy. See Styling Guide v1.3 Section 7 for exact copy per screen per language, covering:
- Guided Journey Steps 1-3
- Capsule Result screen
- All CTA buttons and error messages

## 7. Validation Rules Summary

| Rule | Value/Threshold | Behavior |
|---|---|---|
| Palette: min achromats | 0 | No blocking |
| Palette: max colors | 15 total / 12 chromatic | Naturally constrained by combinability rules |
| Categories: min selected | 8 | Blocks progress |
| Categories: max slots | No limit | Soft size label |
| Items per category | Min 0, default 1, no cap | Stepper |
| Total items in capsule | Min 7 / max 40 (limit 50) | Min blocks creation; 40–50 shows warning + suggest new capsule |
| Custom category | Basicity algorithm | Rejection with explanation |
| Item color vs palette | Same group or Desaturated↔Dark compatibility | Block with recommendation |
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
| Outfit Productivity Ratio | Wearable outfits / items that build them (core + accessory; structural layers → separate Layering Coverage). Model: `docs_capsule_zero/project/methodology/outfit-generation.md` §3 (2026-07-21). |
| Palette lock | After confirmation, palette cannot be changed (v0.1 constraint). |
| Saturation | Descriptive property behind the Bright / Pastel / Desaturated / Dark groups; not a separate compatibility filter. |
| Shopping list | Prioritized purchase list based on gap analysis. |

## 9. Canonical Decisions (spec 039, ratified 2026-07-10)

> Ratified by `ui-ux-designer` (T005, Phase 2 of `.specify/specs/039-design-system-consistency/`).
> Grounded in the measured usage contexts of `app/src/app/globals.css` (6534 lines) on branch
> `refactor/039-design-system-consistency` — every mapping row below was checked against the
> actual selector(s) that use the value, not against abstract taste. Implementation is T006/T007
> (frontend); token edits land in `app/src/styles/tokens.css` only after this section is merged.
> Deltas ≤ ~0.02 alpha are treated as imperceptible on glass; larger deltas are **flagged** and
> gated on `design-review` before/after screenshots (Lane B contract).

### 9.0 Token architecture note

`tokens.css` today is entirely *semantic/component* tokens (`--glass-*`, `--btn-*`, `--card-*` …)
with no primitive layer. §9 adds a small **primitive white-alpha ramp** (`--color-white-aNN`) for
generic hairlines/fills/highlights that belong to no single component, plus a few semantic tokens
where a real recurring component role exists (text levels, scrims, dot rings, error tints).
Rules: new *colour* tokens go in the `--color-*` namespace (Tailwind v4 `@theme`; never `--text-*`
— that namespace is font sizes); shadows in `--shadow-*`; component-state additions may extend an
existing component family (e.g. `--btn-*`). Where a mapping reuses an existing semantic token
cross-component, the row says so ("alias-debt") — re-layering semantics over primitives is
post-039 refactor debt, not license to invent new one-offs.

### 9.1 New tokens minted (25)

**White primitives — `--color-white-aNN` ramp (7):**

| Token | Value | Rationale (one line) |
|---|---|---|
| `--color-white-a04` | `rgba(255,255,255,.04)` | Faintest hover tint / gradient start; keeps the preview-fallback gradient slope (.03→.06) alive |
| `--color-white-a06` | `rgba(255,255,255,.06)` | Hairline borders + faint row fills — the .06/.07 cluster (17 occ), one step below the .08 input fill |
| `--color-white-a16` | `rgba(255,255,255,.16)` | Mid hairline/scroll-thumb/progress-dot step — keeps the .14/.15/.16/.17 cluster (30 occ) as ONE visual family instead of splitting it across .13/.18 |
| `--color-white-a24` | `rgba(255,255,255,.24)` | Standard control border on glass — the .24/.25/.26-border cluster (13 occ) |
| `--color-white-a32` | `rgba(255,255,255,.32)` | Selected fills, drag handles, soft inset highlights (.30/.34/.35 band, 12 occ); shares value with `--toggle-on-bg` (alias candidate) |
| `--color-white-a44` | `rgba(255,255,255,.44)` | Popup/sheet inner highlight + strong hairline (.42/.45/.46 non-text band, 6 occ) + light colour-dot stroke on dark swatches (TSX) |
| `--color-white-a65` | `rgba(255,255,255,.65)` | Meter-high fill (dashboard shop-bars .62 / capsule-result shopping-bars .66 must land on the SAME token); shares value with `--nav-active-indicator` |

**Text levels (1 new + 1 retuned):**

| Token | Value | Rationale |
|---|---|---|
| `--color-text-muted` | `rgba(255,255,255,.50)` **NEW** | Fourth text level for metadata/captions/thumb glyphs (.42–.55 band, 14 occ). AA-exempt-decorative: never the sole carrier of essential information |
| `--color-text-secondary` | `.70` → **`.78`** RETUNE | The AA move (§9.7). Absorbs the dim-secondary drift band .62–.68 (18 occ) upward. Blast radius: every existing secondary-text usage brightens together — live-review after the token flip, rollback = revert one line |

**Control-state tokens (2 new + 1 retuned):**

| Token | Value | Rationale |
|---|---|---|
| `--color-border-selected` | `rgba(255,255,255,.85)` **NEW** | Selected-control border (journey type-card .82, selected colour-circle .85) — a canonical state, not a per-screen invention |
| `--btn-primary-hover-bg` | `rgba(255,255,255,.50)` **NEW** | Primary button hover surface (today only the shared landing/auth/cookie `:hover` rule has it, at raw .50); all primary buttons get this state (US3 affordance) |
| `--input-focus-border` | `.36` → **`.82`** RETUNE | Code has two focus treatments: token .36 vs `.auth-input:focus` literal .82. One focus treatment, the conspicuous one — focus-visible must clear 3:1 (US3/a11y). Blast radius: all token-driven inputs brighten on focus; flagged for live review |

**Black scrims/backdrop (3):**

| Token | Value | Rationale |
|---|---|---|
| `--color-scrim-soft` | `rgba(0,0,0,.20)` | Soft dark chip on photos/glass (fav chip .20, modal footer band .18, replaces the `inset 0 0 0 999px` spread-hack .22) |
| `--color-scrim` | `rgba(0,0,0,.35)` | Text-contrast backing: behind error text (`--color-error-text` since §9.11; measured at the then-current `#FFD600`) and behind text-dense panel areas that sample < 4.5:1 (§9.7). Measurement at ratification: yellow over scrim ≈ 4.9:1 on the brightest glass, ≥ 6:1 median |
| `--color-backdrop` | `rgba(0,0,0,.56)` | ONE modal-backdrop dim level (today three: .46/.56/.60). Also home for the `.my-items-photo-error` .58 backing (−.02) |

**Colour-dot rings (2):**

| Token | Value | Rationale |
|---|---|---|
| `--color-dot-ring-dark` | `rgba(0,0,0,.26)` | Contrast ring around colour swatches on light fills — unifies the `WardrobeItemCard.tsx` stroke `rgba(0,0,0,.28)` and the `0 0 0 1px rgba(0,0,0,.24)` ring shadow (geometry stays, colour becomes the token) |
| `--color-dot-ring-selected` | `rgba(0,0,0,.60)` | Selected-state dark ring (`.journey-color-circle-selected::after`) — the selected step of the dot-ring contract, reusable in my-items edit swatches |

**Error tints — alpha steps of `--color-error` (3):**

| Token | Value | Rationale |
|---|---|---|
| `--color-error-border` | `rgba(255,84,73,.78)` | Invalid-input border (auth + profile input-error, both already .78). Base re-seated `#FFD600→#FF5449` by §9.11 (2026-07-16); alpha step unchanged |
| `--color-error-border-soft` | `rgba(255,84,73,.44)` | Warning-panel border (picker-notice .46, for-repair delete .42; profile-warning .28 snaps UP — deliberate: warning borders were inconsistently faint, flagged). Base re-seated by §9.11 |
| `--color-error-bg` | `rgba(255,84,73,.10)` | Warning tint fill (.08/.10/.12 → one step). Base re-seated by §9.11 |

**Shadows — elevation roles (4):**

| Token | Value | Rationale |
|---|---|---|
| `--shadow-raised` | `0 2px 8px rgba(0,0,0,.18)` | Small raised elements (palette dots, colour-dot filters) — `--shadow-glass-sm` (0 4px 16px) would double their halo |
| `--shadow-modal` | `0 20px 60px rgba(0,0,0,.32)` | Floating layer above panels: language menu (0 22px 70px .26), picker (0 22px 70px .38), uncapsulated modal (0 20px 58px .34), capsule-result empty (0 18px 60px .22), item context menu (0 14px 34px .28 — folded in, slightly larger halo, flagged) |
| `--shadow-modal-up` | `0 -18px 60px rgba(0,0,0,.32)` | Heavy bottom-sheet elevation (journey create-sheet .34/.30) — deliberately heavier than `--shadow-glass-up` |
| `--shadow-drawer` | `-18px 0 44px rgba(0,0,0,.26)` | Side drawer (my-items detail panel); recurring pattern for future detail panels |

**Dark-chrome surfaces (3) — addendum, full ratification and mapping in §9.10:**
`--color-chrome-glass` `rgba(18,18,18,.50)` · `--color-chrome` `rgba(28,28,28,.92)` · `--color-chrome-deep` `rgba(10,10,10,.97)`.

### 9.2 White alpha-ramp mapping table — all 38 off-token alphas (152 occurrences)

Every row verified against its selectors. Δ = target − current. Flags (⚑) = visible-by-design
Lane B changes requiring `design-review` before/after evidence.

| Alpha × count | Context (verified selectors) | Target token | Δ | Note |
|---|---|---|---|---|
| .03 ×1 | `.capsule-result-item-preview` gradient start | `--color-white-a04` | +.01 | pairs with a06 end stop; gradient slope preserved |
| .04 ×2 | `.journey-category-row:hover`, `.capsule-result-shopping-priority-low` bg | `--color-white-a04` | 0 | exact |
| .06 ×12 | row/nav hovers, hairline borders, thumb fills (dashboard, journey, capsule-result, legal) | `--color-white-a06` | 0 | exact; ramp mode |
| .07 ×5 | `.profile-session` / `.dashboard-recent-item` border-bottom; `.my-items-no-capsules`, `.uncapsulated-detail-field`, `.for-sale-toggle-row` bg | `--color-white-a06` | −.01 | imperceptible |
| .09 ×1 | `.my-items-field textarea` bg | `--input-bg` (.08) | −.01 | semantic match — a textarea IS an input |
| .11 ×1 | `.my-items-add-card` bg | `--card-bg` (.10) | −.01 | semantic match — the add tile is a card |
| .14 ×12 | tab underline borders, `.journey-progress-line`, legal borders, `.dashboard-more-item-active`, gap/outfit borders | `--color-white-a16` | +.02 | cluster kept together (splitting .14→.13 / .16→.18 would tear one visual family apart) |
| .15 ×1 | `.profile-session-icon` border | `--color-white-a16` | +.01 | |
| .16 ×16 | scrollbar thumbs, progress dots, search/added-card borders, priority-high bg, OPR divider | `--color-white-a16` | 0 | exact; cluster mode |
| .17 ×1 | `.my-items-add-card:hover` bg | `--card-hover-bg` (.18) | +.01 | completes the add-card → card-token pair |
| .24 ×10 | control borders: icon-button, add-card, gap-title, shopping-color, dialog buttons, edit-color, journey-size em, preview-fallback + one inset highlight | `--color-white-a24` | 0 | exact |
| .25 ×1 | `.capsule-result-item-colors span` border (dot ring on glass) | `--color-white-a24` | −.01 | |
| .26 ×2 (borders) | `.my-items-fav`, `.journey-selected-dot` borders | `--color-white-a24` | −.02 | |
| .26 ×5 (CTA bg) | `.profile-save-button`, `.dashboard-primary-action`, `.journey-primary-button`, `.capsule-result-primary-action`, `.my-items-save-button` | `--btn-primary-bg` (.36) | **+.10 ⚑** | DELIBERATE: one primary-button surface. `.36` is the doc-canonical primary (§1, constitution §III); the in-app .26 drift also caused weak CTA affordance (a .26 button on a .22 panel is a +.04 whisper). The one large intentional normalization in this table |
| .30 ×5 | `.journey-type-card-selected` bg, `.dashboard-section-card:hover`, `.dashboard-more-handle`, `.auth-divider::after`, `.capsule-result-shopping-priority-high` border | `--color-white-a32` | +.02 | |
| .34 ×6 | inset highlights (filter-panel, my-items-empty, for-sale-info), borders (item-menu, add-card:hover, journey-create top) | `--color-white-a32` | −.02 | |
| .35 ×1 | `.dashboard-shop-bar-medium` fill | `--color-white-a32` | −.03 ⚑ | .01 over the rule — accepted so the meter family stays on one primitive step |
| .42 ×4 (insets) | `inset 0 1px 0` highlights: language-menu ×2, picker, journey-create | `--color-white-a44` | +.02 | popup highlight step (vs main `--glass-highlight` .72) |
| .42 ×1 (text) | `.capsule-result-outfit-view-button` label | `--color-text-muted` (.50) | +.08 ⚑ | AA-up: faint label brightens |
| .45 ×2 (glyphs) | `.journey-search-thumb`, `.journey-added-thumb` glyph colour | `--color-text-muted` | +.05 ⚑ | |
| .45 ×1 (border) | `.journey-color-item:hover .journey-color-circle` border | `--color-white-a44` | −.01 | |
| .46 ×5 (text) | add-card small, outfit-head span, gap-row em, shopping-priority-low, picker-head p | `--color-text-muted` | +.04 ⚑ | AA-up |
| .46 ×1 (border) | `.my-items-color-filter-active` border | `--color-white-a44` | −.02 | |
| .50 ×2 (text) | `.auth-terms-note`, `.dashboard-recent-thumb` | `--color-text-muted` | 0 | exact |
| .50 ×1 (hover bg) | shared `.landing-auth-button:hover, .auth-primary:hover, .cookie-action-primary:hover` | `--btn-primary-hover-bg` | 0 | becomes the canonical primary hover state |
| .50 ×1 (border) | `.journey-upload-zone:hover` border | `--toggle-on-border` (.48) | −.02 | alias-debt: cross-semantic reuse, re-layer post-039 |
| .50 ×1 (data-URI) | `.profile-select` SVG chevron stroke | **documented exception** | — | CSS vars cannot be referenced inside a `url()` data-URI; stylelint exception, reviewed |
| .54 ×1 | `.legal-section li::marker` | `--color-text-muted` | −.04 ⚑ | |
| .55 ×3 | `.profile-session em`, `.capsule-result-user-meta span`, `.capsule-result-outfit-layer p` | `--color-text-muted` | −.05 ⚑ | metadata level, unified |
| .62 ×6 (text) | eyebrow, session-icon, delete-armed, outfit-layer-more, gap-row p, empty p | `--color-text-secondary` (.78) | **+.16 ⚑** | the AA brightening of drifted-dim secondary text — intentional, per §9.7 |
| .62 ×1 (knob) | `.for-sale-toggle > span` | `--toggle-knob` (.60) | −.02 | semantic match |
| .62 ×1 (meter) | `.dashboard-shop-bar-high` fill | `--color-white-a65` | +.03 ⚑ | meter-high must equal shopping-bar-high |
| .64 ×4 | `.capsule-result-back`, palette span, opr small, countline | `--color-text-secondary` | +.14 ⚑ | AA-up |
| .66 ×2 (text) | gap-title strong, dialog p | `--color-text-secondary` | +.12 ⚑ | AA-up |
| .66 ×1 (meter) | `.capsule-result-shopping-bar-high` fill | `--color-white-a65` | −.01 | |
| .68 ×2 (text) | shopping-priority-medium, picker-reason | `--color-text-secondary` | +.10 ⚑ | AA-up |
| .68 ×1 (border) | `.capsule-result-picker-card-disabled` border-top | `--color-white-a65` | −.03 ⚑ | divider, not text |
| .75 ×1 | `.capsule-result-add-card` colour | `--color-text-secondary` | +.03 | |
| .76 ×1 | `.legal-table-wrap td` | `--color-text-secondary` | +.02 | |
| .78 ×3 | `.landing-manifesto p` (→ renamed `.landing-hero-subtitle`, spec 044), `.legal-article li`, `.capsule-result-opr strong` | `--color-text-secondary` | 0 | exact after the .78 retune — the hero subtitle already sits at the new secondary value |
| .82 ×2 (text) | `.capsule-result-icon-button`, `.capsule-result-item-menu button` glyph colour | `--color-text-secondary` | −.04 ⚑ | interactive glyphs join the text ramp |
| .82 ×1 (focus) | `.auth-input:focus` border | `--input-focus-border` (retuned .82) | 0 | the literal that revealed the two-focus-treatments drift |
| .82 ×1 (selected) | `.journey-type-card-selected` border | `--color-border-selected` (.85) | +.03 ⚑ | |
| .85 ×1 | `.journey-color-item-selected .journey-color-circle` border | `--color-border-selected` | 0 | exact |
| .86 ×3 | `.capsule-result-outfit-layer-thumb`, `.my-items-fav`, dialog-action button colour | `--color-text-primary` (.95) | +.09 ⚑ | interactive glyphs/labels are primary text |
| .88 ×4 | `.language-trigger`, footer link hover, preview-fallback, picker-notice colour | `--color-text-primary` | +.07 ⚑ | |
| .90 ×3 | shopping-row, shopping-priority-high, picker-card colour | `--color-text-primary` | +.05 ⚑ | |
| .92 ×1 | outfit-view-button-active colour | `--color-text-primary` | +.03 | |
| .94 ×4 | outfit-head h3, gap-title h3, shopping-body strong, picker colour | `--color-text-primary` | +.01 | |
| .96 ×3 | capsule-result logo, hero h2, for-sale-toggle-on knob (→ `--toggle-knob-on` .95) | `--color-text-primary` / `--toggle-knob-on` | −.01 | knob occurrence takes the semantic toggle token |
| .98 ×1 | icon-button-active colour | `--color-text-primary` | −.03 ⚑ | |

Row sum: 152 occurrences — matches the branch measurement exactly.
Post-039 the text ramp is **four levels**: `.95` primary · `.78` secondary · `.50` muted · `.38` placeholder.

### 9.3 Button radius — ONE canonical token

**Verdict: `--radius-pill` is the canonical radius for the action-button family** (primary /
secondary / ghost / save / delete CTAs).

Grounded in the inventory (all button rules in `globals.css`):
- Already pill (10): `.dashboard-primary-action` (42px), `.journey-primary-button` (42px), `.journey-ghost-button`, `.dashboard-ghost-action`, `.profile-save-button` (36px), `.profile-delete-button`, `.my-items-save-button`, `.my-items-secondary-button`, plus the two `999px` literals (`.capsule-result-primary-action` 42px, `.capsule-result-dialog-actions button`).
- Drifted to `--radius-sm` 8px (5, all entry surfaces, 44px tall): `.landing-auth-button`, `.auth-primary`, `.auth-social`, `.cookie-action`, `.cookie-action-primary`. **These migrate to pill** (component-level change; 44px → 22px effective rounding). This is the square-vs-rounded drift resolved: the product surface where users live is pill; the entry surfaces follow it. ⚑ Largest visible Lane B change — before/after via `design-review`; rollback = re-pin the five rules to `--radius-sm`.
- **Not CTAs, not pill:** compact inline controls `.journey-qty-button` (stepper) and `.capsule-result-outfit-view-button` (view segment) keep their 6px look → tokenize as `--radius-xs` (no visual change). Icon buttons stay `--radius-circle`.

**Off-scale radius literals — all 13 mapped, zero exceptions:**

| Literal × count | Element (verified geometry) | Target | Visual result |
|---|---|---|---|
| `999px` ×4 | CTA/badges ≤ 42px tall | `--radius-pill` | pixel-identical (CSS corner clamping) |
| `11px` ×2 | `.profile-toggle`, `.cookie-toggle` — 40×22px tracks | `--radius-pill` | pixel-identical (clamps to 11px = half height) |
| `2px` ×3 | `.dashboard-shop-bar` (3×30), `.capsule-result-shopping-bar` (3×38), `.dashboard-more-handle` (36×4) | `--radius-pill` | pixel-identical (both 2px and 50px clamp to ≤ 2px on a 3–4px side) |
| `4px` ×1 | `.journey-category-check` — 18×18 checkbox | `--radius-xs` (6px) | +2px softer ⚑ (Lane B micro-delta) |
| `5px` ×1 | moodboard layer thumb | `--radius-xs` | +1px, imperceptible |
| `10px` ×1 | `.dashboard-section-icon` — 34×34 | `--radius-sm` (8px) | −2px sharper ⚑ |
| `18px` ×1 | `.profile-toast` | `--radius-lg` (20px) | +2px ⚑ |

### 9.4 Shadow / overlay / dot-ring mapping

**16 raw black shadow geometries → 4 new + 2 existing tokens** (see §9.1 for values):

| Raw geometry × count | Target |
|---|---|
| `0 22px 70px .26` ×2 · `0 22px 70px .38` · `0 20px 58px .34` · `0 18px 60px .22` · `0 14px 34px .28` | `--shadow-modal` (item-menu fold-in flagged ⚑) |
| `0 -18px 60px .34/.30` ×2 | `--shadow-modal-up` |
| `-18px 0 44px .26` | `--shadow-drawer` |
| `0 8px 36px .16` ×2 (dashboard-glass, journey-glass) | `--shadow-glass` (existing; near-duplicate consolidated) |
| `0 8px 26px .14` (my-items-add-card) | `--shadow-glass-sm` (existing) |
| `0 2px 8px .18` ×2 | `--shadow-raised` (exact) |
| `0 0 0 1px rgba(0,0,0,.24)` (edit-color swatch ring) | geometry stays; colour → `var(--color-dot-ring-dark)` |
| `inset 0 0 0 999px rgba(0,0,0,.22)` (preview-fallback spread-hack) | replace hack with a `--color-scrim-soft` background layer (component-level refactor, ≈ −.02) |

**6 non-token black overlays:**

| Raw × context | Target | Δ |
|---|---|---|
| `.18` uncapsulated-modal footer band | `--color-scrim-soft` | +.02 |
| `.20` my-items-fav chip | `--color-scrim-soft` | 0 |
| `.28` journey-added-card ✕ chip | `--color-scrim` | +.07 ⚑ (heavier chip — improves a remove-control's affordance on photos) |
| `.46` capsule-result dialog backdrop | `--color-backdrop` | +.10 ⚑ (one backdrop level, deliberate) |
| `.56` my-items detail backdrop | `--color-backdrop` | 0 |
| `.60` uncapsulated backdrop | `--color-backdrop` | −.04 ⚑ |

Plus: `.my-items-photo-error` bg `.58` → `--color-backdrop` (−.02); `journey-color-circle-selected::after`
border `rgba(0,0,0,.6)` → `--color-dot-ring-selected` (exact). The two exact overlay literals
(`.40`, `.58`) are Lane A → `--color-overlay-mid` / `--color-overlay-start`.

### 9.5 Component radius assignments (normative)

Buttons `--radius-pill` · icon buttons & colour dots `--radius-circle` · inputs/selects/menus
`--radius-md` (selects currently `--radius-sm` — acceptable, review in T013) · chips & small cards
`--radius-sm` · checkboxes, steppers, segments, micro-thumbs `--radius-xs` · glass panels, modals,
sheets, toasts `--radius-lg` · toggles, badges, meter bars `--radius-pill`.

### 9.6 Typography — minimum readable weight (checkable rule)

Measured reality: weight 200 appears at 28–64px (display numerals, hero manifesto), weight 300 at
24–32px (working-UI titles) **and once at 17px** (`.landing-manifesto p` — since spec 044 the live
landing subtitle is `.landing-hero-subtitle` at 16–18px/**400**, so this 17px/300 case is resolved).

**The rule (checkable per element: computed font-size × computed font-weight):**

| Computed size | Minimum weight | Covers today |
|---|---|---|
| `< 20px` | **≥ 400** | all body, labels, buttons, captions, dense UI — no exceptions. Flips `.landing-manifesto p` (17px/300 → 400) ⚑ — done as `.landing-hero-subtitle` 16–18px/400 in spec 044; thin *headings* stay editorial, thin *body* does not |
| `20–27px` | **≥ 300** | working-UI titles: greeting/topbar/section titles at 24–25px/300 all remain |
| `≥ 28px` | **≥ 200** | display numerals & hero only: OPR 52/64px, stats 30px, journey-size 28px, manifesto h1 42px |

`.text-editorial` (300) may only be applied to text ≥ 20px. The global `h2 { font-weight: 300 }`
rule must be audited in T013 — any h2 rendering below 20px gets an explicit ≥ 400.
Enforcement: Playwright computed-style assertions on the primary screens (stylelint cannot pair
size×weight) + `design-review` live pass.

### 9.7 WCAG-AA approach — secondary text, placeholder, and the error accent over wallpaper/glass

**Honest physical constraint (measured, not vibes):** over the brightest unshaded wall patches
seen through a `.22` white glass panel, even *solid white* text tops out near ≈ 2.6:1 — no alpha
raise alone can reach 4.5:1 there. Therefore the mechanism is **hybrid: raise alphas where that
suffices + a local dark scrim where it cannot**, never removing the wallpaper, glass, thin display
headings, or the error accent (constitution §III; `#FFD600` at measurement time, `#FF5449`/`#FF7A70` since §9.11).

1. **Token retune:** `--color-text-secondary` `.70` → **`.78`**, and the drifted `.62–.68` text
   band snaps up into it (§9.2). Over the median overlay-weighted backdrop this puts secondary
   body text at ≈ 4.2–4.5:1 and comfortably over 3:1 for large text.
2. **Local scrim (`--color-scrim`, black `.35`):** applied *inside* panels behind text-dense areas
   whose sampled contrast is < 4.5:1 (legal pages, auth form over bright wall regions) and as a
   rounded backing chip behind **every error/warning text run** (the selectors using
   `color: var(--color-error)`, now `--color-error-text` — §9.11). This generalizes an existing
   in-code pattern — `.my-items-photo-error` already backs the error text with a dark layer.
   Measured at ratification (then-current yellow): yellow on scrim over the brightest glass
   ≈ 4.9:1, median ≥ 6:1; white `.78` on scrim ≈ 4.5:1 worst-case. The error base was unchanged
   at ratification; Q4 later re-seated it to `#FF5449` with the dedicated on-scrim text step
   `#FF7A70` ≈ 5.1:1 (§9.11) — the scrim-chip contract itself is unchanged and stays mandatory.
3. **Focus visibility:** `--input-focus-border` `.36` → `.82` (≥ 3:1 non-text contrast for the
   focus indicator, one treatment app-wide).
4. **Placeholder (`.38`) is kept as-is** — WCAG-exempt as incidental/decorative text. Usability
   guardrails instead of contrast: every input keeps a visible label (placeholders are never the
   only label), and placeholder text never carries requirements/format rules that aren't repeated
   in the label or helper text.
5. **Muted (`.50`) is declared decorative-metadata** — never the sole carrier of essential
   information (checkable in review); essential captions use secondary.

**Targets (T012 axe + same-machine screenshot sampling at the brightest panel region on landing,
dashboard, capsule-result/Outfits):** 4.5:1 normal text · 3:1 large text (≥ 24px at weight 300,
display numerals) · 3:1 UI components and focus indicators.
**Token values that change:** `--color-text-secondary` → `.78`; `--input-focus-border` → `.82`;
new `--color-text-muted` and `--color-scrim` per §9.1. Everything else reconciles at the
component level (scrim application), not by re-tinting identity tokens.

### 9.8 Documented exceptions (complete list)

1. `.profile-select` chevron stroke `rgba(255,255,255,0.5)` inside an SVG **data-URI** — CSS
   custom properties cannot be referenced there. Stylelint exception; if the select is ever
   componentized, switch to an inline-SVG mask and delete the exception.

No other exceptions. All 38 alphas, all 13 off-scale radii, all 16 shadow geometries, all 6
overlays, all 8 error tints and all 15 dark-grey chrome values (§9.10) have a token target
above.

### 9.9 Fix-level map (change-at-the-right-level)

| Decision | Level |
|---|---|
| Alpha-ramp mapping, text-level retunes, new primitives/scrims/error/shadow tokens | **token** |
| Primary-button surface (.26 → `--btn-primary-bg`) + hover state + pill radius on the 5 entry-surface buttons | **component** (button family) |
| Error-text scrim chips, panel scrim application, spread-hack replacement | **component** |
| Manifesto body 17px → weight 400; h2 audit | **screen** (landing / per-screen audit) |
| Meter family (`a16`/`a32`/`a65` fills) | **component** (meter) |
| Backdrop unification | **component** (modal/sheet family) |
| Dark-chrome family (§9.10): 3 tokens; edit-chip + bottom-nav unifications | **token** (chrome ramp) + **component** (chip/nav/sheet families) |

Sequencing per the `design-system` skill: screen/component rows first, token retunes
(`--color-text-secondary`, `--input-focus-border`) last, each with a live `design-review` pass and
a one-line rollback (revert the token line).

### 9.10 Addendum — dark-chrome surface family (ratified 2026-07-10, same session)

The colour audit's white/black/yellow/hex classes missed a **dark-grey rgba family**: 15 values
across 13 declaration sites in `globals.css`, all read in context before this ruling.

**(a) Is dark-chrome legitimate under "never opaque containers"? — YES, ratified.** These are
not opaque containers: 13 of the 15 values sit under `backdrop-filter: blur(16–64px)` — they are
**dark glass**, the low-luminance counterpart of `--glass-*`; the two blur-less values are ≤26px
circular chips over user photography. The family exists precisely where light glass fails: over
user photos of unknown brightness (menus, drawers, edit chips — where a white surface would also
contaminate colour perception of the garment) and as fixed mobile chrome over arbitrary scrolled
content. Same rationale as the §9.1 scrims, one step heavier. **Usage constraints (normative):**
dark-chrome is permitted only for (1) floating layers — menus, dialogs, pickers, toasts; (2)
fixed mobile chrome — bottom navs, sheets, drawers and their anchored footers; (3) small controls
over user photography. Surfaces larger than ~40px must keep backdrop blur. Primary content
panels stay **light** glass — dark-chrome is never a substitute for `--glass-*` on content.
Achromatic greys only (constitution §III).

**(b) Tokens minted (3, `--color-*` namespace; counted in the §9.1 total of 25):**

| Token | Value | Role |
|---|---|---|
| `--color-chrome-glass` | `rgba(18,18,18,.50)` | Translucent dark glass — chips/underlays that must show content through (blur required) |
| `--color-chrome` | `rgba(28,28,28,.92)` | Standard floating chrome — menus, dialogs, pickers, toasts, mobile bottom navs (the family mode: 28/.92 is the item-menu value) |
| `--color-chrome-deep` | `rgba(10,10,10,.97)` | Deepest anchored chrome — drawer base/footers, bottom sheet, edit chips |

**Mapping — all 15 values (Δ grey / Δ alpha; ⚑ = design-review-gated):**

| Value (line, selector) | Target | Δ | Note |
|---|---|---|---|
| `rgba(82,82,82,.92)` — L108 `.profile-avatar-edit` (26px chip on avatar) | `--color-chrome-deep` | grey −72, α +.05 **⚑⚑** | Largest deliberate unification: the only mid-grey in the system, reads muddy next to the near-black chrome everywhere else; unifies with the parallel `.my-items-edit-color` chip (same role: circular edit control over user imagery). Rollback = re-pin the two literals |
| `rgba(60,60,60,.95)` — L114 `.profile-avatar-edit:hover` | `--color-chrome` | grey −32, α −.03 **⚑⚑** | Hover state inverts: with a deep base, hover lightens (deep → chrome) instead of darkening |
| `rgba(36,36,36,.98)` — L3566 `.dashboard-bottom-nav` (mobile) | `--color-chrome` | grey −8, α −.06 ⚑ | Both mobile bottom-navs unify on one value (today they disagree: .98 vs .94 — intra-family drift); heavy blur(64) keeps depth |
| `rgba(14,14,14,.96)` — L3641 `.dashboard-more-sheet` (mobile) | `--color-chrome-deep` | grey −4, α +.01 | Imperceptible; sheet remains darker than nav — today's visual ordering preserved |
| `rgba(18,18,18,.48)` — L4487 `.capsule-result-icon-button` | `--color-chrome-glass` | α +.02 | Exact base grey; the token's namesake |
| `rgba(28,28,28,.92)` — L4514 `.capsule-result-item-menu` | `--color-chrome` | 0 | Exact — family mode |
| `rgba(28,28,28,.9)` — L5004 `.capsule-result-dialog`, `.capsule-result-picker` | `--color-chrome` | α +.02 | |
| `rgba(36,36,36,.94)` — L5184 `.capsule-result-bottom-nav` (mobile) | `--color-chrome` | grey −8, α −.02 ⚑ | Pairs with the dashboard nav row above |
| `rgba(24,24,24,.98)` — L5721 `.my-items-detail-panel` gradient start | `--color-chrome` | grey +4, α −.06 ⚑ | Gradient becomes `chrome → chrome-deep` — slope (depth cue) preserved with zero extra tokens |
| `rgba(8,8,8,.98)` — L5721 gradient end | `--color-chrome-deep` | grey +2, α −.01 | |
| `rgba(10,10,10,.98)` — L5722 drawer solid fallback | `--color-chrome-deep` | α −.01 | |
| `rgba(12,12,12,.92)` — L5928 `.my-items-edit-color button` (18px chip) | `--color-chrome-deep` | grey −2, α +.05 ⚑ | Mild; chip slightly more solid over a colour swatch |
| `rgba(10,10,10,.98)` — L5998 `.my-items-detail-actions` (sticky footer) | `--color-chrome-deep` | α −.01 | |
| `rgba(22,22,22,.94)` — L6040 `.my-items-toast` | `--color-chrome` | grey +6, α −.02 | Imperceptible at near-opaque alpha |
| `rgba(18,18,18,.54)` — L6150 `.uncapsulated-capsule-modal` dark underlay (beneath its white-glass gradient) | `--color-chrome-glass` | α −.04 ⚑ | Modal underlay marginally more translucent; blur(44) unchanged |

Zero exceptions; §9.8's completeness statement updated accordingly. Fix levels in §9.9.
Note for T007: at these near-opaque alphas (.90–.98) a base-grey delta of ±8 is below the
perceptibility of the alpha deltas already accepted in §9.2 — the review-critical rows are the
two `.profile-avatar-edit` unifications and the two bottom-nav rows.

### 9.11 Addendum — gold CTA accent + error re-base (Q4 closed, ratified by founder 2026-07-16)

PRODUCT-PLAN D3/Q4 resolution, landing-hero iteration (spec 043). The two collisions recorded in
D3 are resolved by **separating the roles**: gold = "act", signal red = "something is wrong".
Approved live on the final hero prototype `html-prototypes/landing-v2/v1c-final.html` (error shade
picked from four live candidates E1–E4 rendered on the same page; E4 chosen).

**(a) Achromatic principle amended (constitution §III, v1.5):** achromatic base + **one signal
accent** — the gold family — reserved exclusively for the **primary CTA** and the **logo accent**.
Never for statuses, errors, focus rings, or decoration. Color from the user's items stays the only
other color source.

**(b) Tokens minted / re-seated (`app/src/styles/tokens.css`):**

| Token | Value | Role |
|---|---|---|
| `--color-gold-500` | `#EFBF04` | Gold base — gradient start, logo accent, eyebrow-grade accents |
| `--color-gold-450` | `#FFDD00` | Gradient end |
| `--btn-cta-bg` | `linear-gradient(to right, #EFBF04 0%, #FFDD00 100%)` | Primary CTA fill (Nouva-measured, D3); literal hexes = gold-500→gold-450 — Tailwind v4 `@theme` does not resolve `var()` references without inline mode |
| `--btn-cta-text` | `#0A0A0A` | CTA label — near-black (= `--color-black`) on gold ≈ 12:1 |
| `--btn-cta-border` | `rgba(255,255,255,.20)` | CTA hairline (D3 measurement) |
| `--btn-cta-shadow` | `0 8px 28px rgba(239,191,4,.28)` | Gold glow — alpha step of gold-500 |
| `--color-error` | `#FFD600` → **`#FF5449`** | Error base re-seated: borders, fills, icons |
| `--color-error-text` | **`#FF7A70`** (new) | Error **text on scrim chips** — ≈ 5.1:1 on `--color-scrim` over dark glass; the base red is ≈ 4.1–4.7:1 there (borderline), hence the dedicated text step. The 10 `color: var(--color-error)` runs in `globals.css` moved to this token; `border-color` stays on the base |
| `--color-error-border/-soft/-bg` | `rgba(255,84,73, .78/.44/.10)` | §9.1 alpha steps unchanged, base re-seated |
| `--btn-danger-*` | re-seated onto `255,84,73` | Near-duplicate removal: the old `rgba(255,80,60,*)` danger family differed from the new error base by a sub-perceptual delta — one red family now |

**(c) §9.7 scrim policy unchanged and mandatory:** every error/warning text run keeps the
`--color-scrim` backing chip and uses `--color-error-text`; non-text error surfaces use the base
and alpha steps. Yellow (`#FFD600`, `rgba(255,214,0,*)`) is retired from the palette — the e2e
guard `tests/e2e/specs/landing/design-tokens.spec.ts` fails any regression re-introducing it into
the error family.

**(d) Landing hero component spec (approved copy + geometry)** — reference prototype
`v1c-final.html`: gold logo 13px/600/no-tracking top-left; centered hero; H1 Helvetica 200
uppercase `clamp(32px, 5.4vw, 60px)`, forced to two words per line on desktop; sub 18px/400 at
secondary `.78`; CTA pill 56px on `--btn-cta-*`, label «Попробовать бесплатно» / "Try for free",
no arrow, no micro-line under the button; ghost login 34px top-right; first screen = exactly one
viewport (the "How it works" slides stub sits strictly below the fold); the decorative scroll cue
must stop animating under `prefers-reduced-motion: reduce`. RU copy: «Создай свою /
гардеробную капсулу» + «Загрузи несколько фото любимых вещей — и узнай, что добавить, чтобы
образов на каждый день стало больше». **Implemented live in `/app` by spec 044 (2026-07-17)** —
`LandingPage.tsx` + `LandingSlidesStub.tsx` + `landing-*` rules consuming the `--btn-cta-*`/gold
tokens (the gold/CTA family stays in `@theme static` — `--color-gold-450` has no `var()` consumer
and a plain `@theme` would tree-shake it, breaking the `design-tokens.spec.ts` guard); the gold
logo (`--color-gold-500`) applies to every screen sharing `.landing-logo` (§9.11(a), auth/legal
included), while the v1c header rhythm is scoped to `.landing-fold .landing-header` so auth/legal
keep the shared base; RU hero copy stays «ты» (founder decision, spec 044); interim CTA route =
auth popup in sign-up mode until the guest tool ships (PRODUCT-PLAN Этап 1 п.5). §9.5/§9.6/§9.7
rules apply to it unchanged.
