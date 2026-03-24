# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Capsule Zero** — premium fashion-tech platform, "the Aesop of wardrobe apps". A system for creating maximally productive capsule wardrobes using proprietary color methodology.

- **Audience:** 25–40, upper-middle income, "new money mindset meets old money taste"
- **Languages:** EN (primary), ES-AR, RU — i18n from Day 1
- **Core metric:** Outfit Productivity Ratio (outfits / items)

## Current Phase

**Phase 4 — Technical Architecture (IN PROGRESS).** Phase 3 (UX/UI Design) is complete. All 16 MVP logical screens have approved hi-fi prototypes, implemented across 12 HTML files (some files contain multiple screens as tabs/modals).

**Phase 4 status:**
- ✅ Frontend: Next.js 14+ App Router, React, TypeScript, Tailwind v4 initialized (`/app`)
- ❌ Backend stack not decided (Supabase vs custom)
- ❌ Auth provider not decided (Supabase Auth / Clerk)
- ❌ File storage not decided (Supabase Storage / Cloudflare R2)
- ❌ ADRs not written (`docs_capsule_zero/adr/` is empty)
- ❌ CI/CD not configured
- ❌ API spec not written

**See AGENTS.md → "Phase 4" section** for full task list and deliverables.

## Spec-Driven Development (.specify)

This project uses spec-kit for structured development. **Always read the relevant .specify files before implementing.**

```
.specify/
  memory/
    constitution.md      ← Project principles, methodology, design rules (READ FIRST)
    design-system.md     ← Glass tokens, colors, typography, component patterns
    market-context.md    ← Competitors, persona, market size, pricing
  specs/
    001-capsule-zero-mvp/
      spec.md            ← Full MVP spec: 25 user stories, acceptance criteria, requirements
      prototype-map.md   ← Maps HTML prototypes → spec sections → screens
```

**AGENTS.md** (project root) — universal onboarding for any AI agent.

## Tech Stack

- **Frontend:** Next.js 14+ App Router (`/app` directory)
- **Language:** React, TypeScript
- **Styling:** Tailwind CSS v4 with custom @theme tokens
- **Tokens:** `app/src/styles/tokens.css` (from design system)

## Build & Dev Commands

```bash
cd app
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
```

## Design Principles (NON-NEGOTIABLE)

- **Glassmorphism UI** — frosted glass surfaces, backdrop blur, translucent layers. See `.specify/memory/design-system.md` for exact tokens.
- **Achromatic interface** — black / white / grey; color comes ONLY from user's items
- **8px grid** for all spacing
- **"Screenshot test"** — every screen must be worth screenshotting
- **"Direct, not dictate"** — system guides, never imposes
- **Emotional arc:** Attraction → Trust → Creativity → Satisfaction

## HTML Prototypes

Pixel-perfect Phase 3 prototypes in `html-prototypes/` (pure HTML+CSS). This folder contains:
- **All 16 approved MVP screens** — source of truth for approved behavior, layout, and scope
- **Design system** (`html-prototypes/design-system.html`) — all design tokens, glass panel variants, typography, component patterns, spacing grid
- **Color palette** (`html-prototypes/color-system.html`) — the full 51-color capsule palette with HEX values and compatibility groups

| File | Screen | User Stories |
|---|---|---|
| `html-prototypes/index.html` | Landing + Auth popup | US-001, US-002/003 |
| `html-prototypes/auth.html` | Standalone Auth | US-002, US-003 |
| `html-prototypes/dashboard.html` | Dashboard | US-004, US-005 |
| `html-prototypes/guided-journey.html` | Guided Journey (3 steps) | US-008–012, US-017 |
| `html-prototypes/capsule-result.html` | Capsule Result | US-013–016 |
| `html-prototypes/my-items.html` | My Items | US-006, US-007 |
| `html-prototypes/uncapsulated.html` | Uncapsulated | US-020 |
| `html-prototypes/favorites.html` | Favorites | US-019 |
| `html-prototypes/for-sale.html` | For Sale | US-021 |
| `html-prototypes/for-repair.html` | For Repair | US-024 |
| `html-prototypes/profile.html` | Profile | US-005, US-018 |
| `html-prototypes/design-system.html` | Design System (tokens, components) | — |
| `html-prototypes/color-system.html` | Color Palette (51 colors, capsule palette) | — |

**To view:** `python3 -m http.server 3100` from `html-prototypes/`.

## Product Documentation

- `.specify/specs/001-capsule-zero-mvp/spec.md` — 25 user stories + flows
- `docs_capsule_zero/project/methodology/` — Methodology, categories, colors, outfit generation, gap analysis
- `docs_capsule_zero/glossary.md` — Domain terminology (RU/ES-AR equivalents)
- `docs_capsule_zero/i18n/ui-texts.md` — i18n content (EN, ES-AR, RU)
- `docs_capsule_zero/ux/emotion-map.md` — Emotional targets per screen
- `docs_capsule_zero/ux/ux-validation.md` — Competitor UX analysis, 6 critical insights
- `docs_capsule_zero/marketing/go-to-market.md` — TAM/SAM/SOM, competitors, pricing
- `docs_capsule_zero/launch/launch-plan.md` — Full launch plan, phases 0-7

## Feature & Screen Specs

**Reading route for implementing a feature:**
1. HTML prototype (`html-prototypes/`) — current source of truth for approved behavior, layout, and scope
2. `docs_capsule_zero/features/f-XXX-name.md` — requirements, acceptance criteria, edge cases
3. `docs_capsule_zero/screens/screen-name.md` — layout, component details, states
4. `.specify/specs/001-capsule-zero-mvp/spec.md` — user stories and acceptance criteria
5. `.specify/specs/001-capsule-zero-mvp/prototype-map.md` — cross-cutting stories and backend-only stories

**Feature files** (`docs_capsule_zero/features/`):
`f-001-landing`, `f-002-auth`, `f-003-dashboard`, `f-004-profile`, `f-005-my-items`,
`f-006-guided-journey`, `f-007-marketplace-import`, `f-008-semantic-search`,
`f-009-capsule-result`, `f-010-capsule-management`, `f-011-photo-upload`,
`f-012-i18n`, `f-013-favorites`, `f-014-wardrobe-management`, `f-015-opr`

**Screen files** (`docs_capsule_zero/screens/`):
`screen-landing`, `screen-auth`, `screen-dashboard`, `screen-guided-journey`,
`screen-capsule-result`, `screen-my-items`, `screen-uncapsulated`,
`screen-favorites`, `screen-for-sale`, `screen-for-repair`, `screen-profile`

## Quality Gates

- Screens = designs to 2px precision (reference: HTML prototypes)
- Lighthouse: Performance 90+, Accessibility 95+
- Page load < 2 sec on 4G
- Upload + bg removal < 5 sec
- Adaptive: iPhone 14+ (375px), iPad (768px), Desktop 1280px+
- Zero console errors, zero FOUC
- Every screen: min 3 states (default, loading, empty/error)
