# AGENTS.md — Capsule Zero Onboarding

> Universal onboarding document for any AI agent (Claude Code, Codex, Gemini CLI, Cursor, etc.)

## What Is Capsule Zero?

**Capsule Zero** is a premium fashion-tech platform — "the Aesop of wardrobe apps". It helps affluent users (25–40 yo) build maximally productive capsule wardrobes using a proprietary color and wardrobe methodology. Core metric: **Outfit Productivity Ratio** (outfits / items).

**Tech stack:** Next.js 14+ App Router, React, TypeScript, Tailwind CSS v4
**Languages:** EN (primary), ES-AR, RU — i18n from Day 1
**Target:** Buenos Aires-based startup, global premium segment

## Current Phase & Status

| Phase | Status |
|---|---|
| 0. Founder Vision | COMPLETE — `.specify/memory/constitution.md` |
| 1. Market Research | COMPLETE — `docs_capsule_zero/marketing/go-to-market.md` |
| 2. Product Definition | COMPLETE — `.specify/specs/001-capsule-zero-mvp/spec.md`, `docs_capsule_zero/project/methodology/`, `docs_capsule_zero/ux/emotion-map.md`, `docs_capsule_zero/ux/ux-validation.md` |
| 3. UX/UI Design | COMPLETE — 16 logical screens across 12 HTML files + `html-prototypes/design-system.html`, `html-prototypes/color-system.html` — all in `html-prototypes/` |
| **4. Technical Architecture** | **IN PROGRESS** — see section below |
| 5. Development Sprint | Upcoming |
| 6. QA & Soft Launch | Upcoming |
| 7. Commercial Launch | Upcoming |

## Where to Find Specifications

```
.specify/
  memory/
    constitution.md      ← Project principles, methodology, design rules (READ FIRST)
    design-system.md     ← Glass tokens, colors, typography, components
    market-context.md    ← Competitors, persona, market size, pricing
  specs/
    001-capsule-zero-mvp/
      spec.md            ← Full MVP spec: 25 user stories, flows, requirements
      prototype-map.md   ← Maps HTML files → spec sections → screens
```

## HTML Prototypes

Located in `html-prototypes/`. These are **pixel-perfect hi-fi prototypes** (pure HTML+CSS, no frameworks) representing the approved Phase 3 design. The folder also contains the design system and color palette references used for development.

**Current source of truth:** the HTML prototypes in `html-prototypes/` are the most up-to-date product reference for product behavior, layout, and scope. If an older doc conflicts with an approved HTML prototype, follow the prototype and then align the docs.

| File | Screen | User Stories |
|---|---|---|
| `html-prototypes/index.html` | Landing + Auth popup | US-001, US-002, US-003 |
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
| `html-prototypes/design-system.html` | Design System (tokens, components, patterns) | — |
| `html-prototypes/color-system.html` | Color Palette (51 colors, capsule palette) | — |

**To view:** `python3 -m http.server 3100` from `html-prototypes/`, then `http://localhost:3100/<file>.html`

## Key Principles to ALWAYS Respect

### 1. Glassmorphism UI Language (NON-NEGOTIABLE)
The interface uses frosted glass surfaces. Two variants: main panels (blur 40px) and nav/bottom sheets (blur 44px).
- **Never** use opaque solid backgrounds for containers. **Always** use glass.
- → Exact token values: `docs_capsule_zero/project/frontend/styling.md`

### 2. Achromatic Interface
- UI colors: black / white / grey only
- Color enters ONLY through user's garment photos and color dots
- Error color: `#FFD600` (yellow), NOT red

### 3. Capsule Methodology (Color Rules)
- Palette is immutable once created
- Colors must be compatible either by temperature or by saturation
- Achromats always compatible
- Incompatible items blocked with explanation

### 4. "Direct, Not Dictate"
- System suggests, explains, offers alternatives
- Never force user decisions
- Blocks come with explanations and alternative paths

### 5. Premium Quality Bar
- "Screenshot test": every screen must be worth screenshotting
- Interface must stand next to Aesop / ZARA / COS
- Screens match designs to 2px precision
- Lighthouse: Performance 90+, Accessibility 95+

### 6. Three Upload Methods
Photo upload, marketplace link import, semantic search from shared DB. All three are critical — they solve the #1 competitor pain point (upload friction).

## Source Documentation

| Document | Content |
|---|---|
| `.specify/specs/001-capsule-zero-mvp/spec.md` | 25 user stories (24 MUST + 1 NICE), user flow, screen inventory |
| `docs_capsule_zero/project/methodology/capsule-methodology.md` | Capsule methodology, compatibility rules, palette logic, limits |
| `docs_capsule_zero/project/methodology/colors.md` | 51-color system, HEX values, compatibility matrix |
| `docs_capsule_zero/project/methodology/categories.md` | Garment categories and classification |
| `docs_capsule_zero/project/methodology/outfit-generation.md` | 7-layer outfit structure, OPR formula, combination algorithm |
| `docs_capsule_zero/project/methodology/gap-analysis.md` | Gap detection rules, shopping list format, validation constraints |
| `docs_capsule_zero/project/frontend/styling.md` | Glass tokens, colors, typography, component patterns (source of truth for visual tokens and component styling) |
| `docs_capsule_zero/glossary.md` | Domain terminology with RU/ES-AR equivalents |
| `docs_capsule_zero/i18n/ui-texts.md` | i18n content (EN, ES-AR, RU) — all 16 screens |
| `docs_capsule_zero/ux/emotion-map.md` | Emotional targets per screen, UX principles |
| `docs_capsule_zero/ux/ux-validation.md` | Competitor analysis, UX benchmarks, 6 critical insights |
| `docs_capsule_zero/features/f-XXX-name.md` | Per-feature requirements, acceptance criteria, edge cases (15 files) |
| `docs_capsule_zero/screens/screen-name.md` | Per-screen layout, component details, states (11 files) |
| `docs_capsule_zero/marketing/go-to-market.md` | TAM/SAM/SOM, competitor matrix, persona, pricing |
| `docs_capsule_zero/launch/launch-plan.md` | Full launch plan, phases 0-7, quality gates |
| `.specify/specs/001-capsule-zero-mvp/prototype-map.md` | Prototype-to-story map, cross-cutting stories, backend-only stories |

### Reading Route — Implementing a Feature

When assigned to implement a specific feature, read in this order:
1. HTML prototype (`html-prototypes/`) — current source of truth for approved behavior, layout, and scope
2. `docs_capsule_zero/features/f-XXX-name.md` — requirements, acceptance criteria, edge cases
3. `docs_capsule_zero/screens/screen-name.md` — layout, component details, states
4. `.specify/specs/001-capsule-zero-mvp/spec.md` — user stories and acceptance criteria
5. `.specify/specs/001-capsule-zero-mvp/prototype-map.md` — cross-cutting stories and backend-only stories

**Feature → Screen mapping:**
| Feature | Screen file | HTML prototype |
|---|---|---|
| f-001-landing | screen-landing | html-prototypes/index.html |
| f-002-auth | screen-auth | html-prototypes/auth.html, html-prototypes/index.html (popup) |
| f-003-dashboard | screen-dashboard | html-prototypes/dashboard.html |
| f-004-profile | screen-profile | html-prototypes/profile.html |
| f-005-my-items | screen-my-items | html-prototypes/my-items.html |
| f-006-guided-journey | screen-guided-journey | html-prototypes/guided-journey.html |
| f-007-marketplace-import | screen-guided-journey (tab) | html-prototypes/guided-journey.html |
| f-008-semantic-search | screen-guided-journey (tab) | html-prototypes/guided-journey.html |
| f-009-capsule-result | screen-capsule-result | html-prototypes/capsule-result.html |
| f-010-capsule-management | screen-capsule-result | html-prototypes/capsule-result.html |
| f-011-photo-upload | screen-guided-journey, my-items | html-prototypes/guided-journey.html |
| f-012-i18n | all screens | all HTML files |
| f-013-favorites | screen-favorites | html-prototypes/favorites.html |
| f-014-wardrobe-management | screen-my-items, uncapsulated, for-sale, for-repair | html-prototypes/my-items.html + others |
| f-015-opr | screen-dashboard, capsule-result | html-prototypes/dashboard.html |

## App Directory

`/app` contains a Next.js 14+ project initialized with Tailwind. Structure:
- `app/src/` — source code
- `app/src/styles/tokens.css` — Tailwind v4 @theme tokens (from design system)
- `app/public/` — static assets

## Delivery Workflow

- Product code lands through pull requests only.
- Required GitHub checks are `baseline-checks`, `guard`, and `AI Review`.
- Durable workflow docs live under `docs_capsule_zero/project/devops/`.
- The canonical orchestration contract is documented in `docs_capsule_zero/project/devops/ai-orchestration-protocol.md`.
- Cloud AI integration and review-gate requirements are documented in `docs_capsule_zero/project/devops/ai-runner.md`.
- Agent selection is policy-driven through repository variables:
  - `AI_IMPLEMENTATION_AGENT`
  - `AI_REVIEW_AGENT`
- Canonical execution uses the selected vendor's native remote surface:
  - `@claude ...` for Claude implementation
  - Codex app or Codex web task for Codex-owned implementation PRs
  - `@claude review once` on a top-level PR comment
  - `@codex review` on a top-level PR comment
- `/gemini review` on a top-level PR comment when Gemini is the selected temporary review backend during Codex quota exhaustion
- Only trusted repository actors may trigger AI workflows.
- Trusted actors are `OWNER`, `MEMBER`, and `COLLABORATOR`.
- Native review normalization is documented in `docs_capsule_zero/project/devops/review-contract.md`.
- Temporary Gemini operating rules are documented in `docs_capsule_zero/project/devops/gemini-github-setup.md`.
- Local PowerShell and worktree orchestration scripts are no longer part of the repository.

## Review guidelines

- Codex review uses native GitHub PR review output plus `P0-P3` inline severity badges.
- Claude review uses a top-level `claude[bot]` comment with marker lines, not a formal GitHub PR review.
- Gemini review uses native GitHub PR review output from `gemini-code-assist[bot]` plus inline severity markers such as `Critical`, `High`, `Medium`, and `Low`.
- When a Claude review request includes `AI_REVIEW_AGENT`, `AI_REVIEW_SHA`, and `AI_REVIEW_OUTCOME`, preserve those lines exactly at the start of the final top-level Claude comment.
- `AI_REVIEW_OUTCOME=pass` means no material findings.
- `AI_REVIEW_OUTCOME=advisory` means advisory-only findings that should not block merge.
- `AI_REVIEW_OUTCOME=block` means at least one finding should block merge.
- Treat low-severity-only findings as advisory and non-blocking.

---

## Phase 4 — Technical Architecture (IN PROGRESS)

**Your task as the assigned agent:** Make all remaining architecture decisions, document them as ADRs, and produce the artifacts listed below so Phase 5 (Development Sprint) can begin.

### What's already done
| Item | Status | Location |
|---|---|---|
| Frontend framework | ✅ Next.js 14+ App Router, React, TypeScript | `/app` |
| Styling | ✅ Tailwind CSS v4 with custom @theme tokens | `app/src/styles/tokens.css` |
| Design tokens | ✅ Glass tokens, colors, typography | `docs_capsule_zero/project/frontend/styling.md` |
| Folder structure | ✅ Basic boilerplate (`/app/src/`) | `/app/src/` |

### What's NOT done — decisions needed
| Decision | Options | Notes |
|---|---|---|
| **Backend / BaaS** | Supabase (recommended for solo/AI team) · Node.js/NestJS · Python/FastAPI | Supabase gives Auth + DB + Storage + API in one |
| **Database** | Supabase PostgreSQL · standalone PostgreSQL · PlanetScale | Must support: users, items, capsules, palettes, shared item DB |
| **Auth** | Supabase Auth · Clerk · NextAuth.js | Google + Apple OAuth required (see US-002, US-003) |
| **File Storage** | Supabase Storage · Cloudflare R2 · AWS S3 | Stores original + bg-removed item photos |
| **Background Removal** | remove.bg API · rembg (self-hosted) · Photoroom | < 5 sec SLA per spec |
| **Hosting** | Vercel (frontend) + Supabase (backend) · Railway · Render | Vercel recommended for Next.js |
| **State Management** | Zustand · TanStack Query · React Context | Already have `journeyStore.ts` with Zustand |
| **API Client** | TanStack Query · SWR · fetch | |
| **Forms** | React Hook Form + Zod · | |

### Phase 4 deliverables (artifacts to produce)
| Artifact | Where to create | Template |
|---|---|---|
| ADR-001: Stack Overview | `docs_capsule_zero/adr/adr-001-stack.md` | Decision · Context · Consequences |
| ADR-002: Auth | `docs_capsule_zero/adr/adr-002-auth.md` | |
| ADR-003: Storage | `docs_capsule_zero/adr/adr-003-storage.md` | |
| Backend docs | `docs_capsule_zero/project/backend/backend-docs.md` | Stack, API structure, DB schema |
| Frontend docs | `docs_capsule_zero/project/frontend/frontend-docs.md` | Libraries, state management, env vars |
| Components guide | `docs_capsule_zero/project/frontend/components.md` | Component conventions, glass patterns |
| API spec | `docs_capsule_zero/adr/api-spec.md` | REST endpoints, auth, schemas |

### Phase 4 quality gate (from launch-plan.md)
- All stack decisions documented as ADRs
- Repository has linting + commit hooks configured
- CI/CD pipeline set up (auto-build, preview deployments)
- Local dev setup documented (env vars, seed data)
- Founder approval on stack

### Key constraints for architecture decisions
- **No subscription model** — coins only (Stripe one-time purchases)
- **3 upload methods:** photo upload · marketplace link import · semantic search (shared DB)
- **Background removal < 5 sec** per quality gate
- **Multilingual from Day 1:** EN, ES-AR, RU — use `next-intl` or `react-i18next`
- **i18n strings:** `docs_capsule_zero/i18n/ui-texts.md`
- **Mobile-first:** iPhone 14+ (375px), iPad (768px), Desktop 1280px+
