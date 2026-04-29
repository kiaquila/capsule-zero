# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Capsule Zero** — premium fashion-tech platform, "the Aesop of wardrobe apps". A system for creating maximally productive capsule wardrobes using proprietary color methodology.

- **Audience:** 25–40, upper-middle income, "new money mindset meets old money taste"
- **Languages:** EN (primary), ES-AR, RU — i18n from Day 1
- **Core metric:** Outfit Productivity Ratio (outfits / items)

## Current Phase

**Phase 4 — Technical Architecture (DECISIONS DOCUMENTED).** Phase 3 (UX/UI Design) is complete. All 16 MVP logical screens have approved hi-fi prototypes, implemented across 12 HTML files (some files contain multiple screens as tabs/modals). Phase 5 feature work requires Sprint 0 entrance-gate completion first.

**Phase 4 status:**
- ✅ Web: Next.js 14+ App Router, React, TypeScript, Tailwind v4 initialized (`/app`)
- ✅ Mobile decision: Flutter + Dart for iOS and Android
- ✅ Backend stack decided: Supabase
- ✅ Auth provider decided: Supabase Auth
- ✅ File storage decided: Supabase Storage
- ✅ Payments decided: Lava.top web purchases + Postgres coin ledger; mobile read-only balance for v0.1
- ✅ Phase 4 stack ADRs written under `docs_capsule_zero/adr/`
- ✅ CI/CD baseline configured via GitHub Actions (`baseline-checks`, `guard`, `AI Review`)
- ✅ API spec written
- ⚠️ Remaining Sprint 0 gate: founder approval, OpenAPI/generated clients, Supabase migrations/RLS/storage tests, Flutter scaffold, Lava.top web setup, Photoroom spike, linting + local hooks

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

- **Web:** Next.js 14+ App Router (`/app` directory)
- **Mobile:** Flutter + Dart for iOS and Android
- **Backend:** Supabase Auth, PostgreSQL/RLS, Storage, Edge Functions/RPC
- **Payments:** Lava.top web purchases, fulfilled by webhooks into coin ledger; mobile read-only balance in v0.1
- **Languages:** TypeScript/React for web, Dart for Flutter
- **Styling:** Tailwind CSS v4 with custom @theme tokens
- **Tokens:** `app/src/styles/tokens.css` (from design system)

## Build & Dev Commands

```bash
cd app
npm run dev          # Development server
npm run typecheck    # TypeScript validation
npm run build        # Production build
npm run ci:check     # CI baseline checks
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
- `docs_capsule_zero/project/devops/ai-pr-workflow.md` — PR loop and merge gates
- `docs_capsule_zero/project/devops/ai-orchestration-protocol.md` — cloud-native agent routing and policy contract
- `docs_capsule_zero/project/devops/ai-runner.md` — cloud AI integrations and `AI Review` gate contract
- `docs_capsule_zero/project/architecture/phase-4-council.md` — architecture decision register
- `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` — required Sprint 0 gate before feature work
- `docs_capsule_zero/adr/` — ADRs for stack, auth, storage, and API contract
- `docs_capsule_zero/project/mobile/mobile-docs.md` — Flutter app architecture and mobile constraints

## Repository Delivery Protocol

- Product code lands through pull requests only.
- Required GitHub checks are `baseline-checks`, `guard`, and `AI Review`.
- Claude is the default implementation agent, selected through `AI_IMPLEMENTATION_AGENT`.
- Review selection is separate and controlled through `AI_REVIEW_AGENT`.
- Canonical execution uses the selected vendor's native remote surface:
  - `@claude ...` for Claude implementation
  - Codex app or Codex web task for Codex-owned implementation PRs
  - `@claude review once` on a top-level PR comment
  - `@codex review` on a top-level PR comment
- Only trusted repository actors may trigger repository AI workflows.
- `AI Review` is a repository-owned fail-closed gate that normalizes native review output to Capsule Zero policy.
- Native review normalization rules live in `docs_capsule_zero/project/devops/review-contract.md`.
- Follow `docs_capsule_zero/project/devops/ai-pr-workflow.md` and `docs_capsule_zero/project/devops/ai-orchestration-protocol.md` for workflow behavior; this file is Claude's repository context, not the orchestration source of truth.

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
- Mobile-first web: iPhone 14+ (375px), iPad (768px), Desktop 1280px+
- Flutter smoke tests: iOS and Android small/standard phone sizes
- Zero console errors, zero FOUC
- Every screen: min 3 states (default, loading, empty/error)
