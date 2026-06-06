# AGENTS.md — Capsule Zero Onboarding

> Universal onboarding document for any AI agent (Claude Code, Codex, Gemini CLI, Cursor, etc.)

## What Is Capsule Zero?

**Capsule Zero** is a premium fashion-tech platform — "the Aesop of wardrobe apps". It helps affluent users (25–40 yo) build maximally productive capsule wardrobes using a proprietary color and wardrobe methodology. Core metric: **Outfit Productivity Ratio** (outfits / items).

**Tech stack:** Next.js 14+ App Router, React, TypeScript, Tailwind CSS v4, Flutter mobile app (iOS + Android), Supabase backend
**Languages:** EN (primary), ES-AR, RU — i18n from Day 1
**Target:** Buenos Aires-based startup, global premium segment

## Current Phase & Status

| Phase                         | Status                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Founder Vision             | COMPLETE — `.specify/memory/constitution.md`                                                                                                                                       |
| 1. Market Research            | COMPLETE — `docs_capsule_zero/marketing/go-to-market.md`                                                                                                                           |
| 2. Product Definition         | COMPLETE — `.specify/specs/001-capsule-zero-mvp/spec.md`, `docs_capsule_zero/project/methodology/`, `docs_capsule_zero/ux/emotion-map.md`, `docs_capsule_zero/ux/ux-validation.md` |
| 3. UX/UI Design               | COMPLETE — 16 logical screens across 12 HTML files + `html-prototypes/design-system.html`, `html-prototypes/color-system.html` — all in `html-prototypes/`                         |
| **4. Technical Architecture** | **DECISIONS DOCUMENTED** — mock-first Stage 1 posture accepted; integration gates pending before real provider flows                                                               |
| 5. Development Sprint         | Upcoming                                                                                                                                                                           |
| 6. QA & Soft Launch           | Upcoming                                                                                                                                                                           |
| 7. Commercial Launch          | Upcoming                                                                                                                                                                           |

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

| File                                  | Screen                                       | User Stories           |
| ------------------------------------- | -------------------------------------------- | ---------------------- |
| `html-prototypes/index.html`          | Landing + Auth popup                         | US-001, US-002, US-003 |
| `html-prototypes/auth.html`           | Standalone Auth                              | US-002, US-003         |
| `html-prototypes/dashboard.html`      | Dashboard                                    | US-004, US-005         |
| `html-prototypes/guided-journey.html` | Guided Journey (3 steps)                     | US-008–012, US-017     |
| `html-prototypes/capsule-result.html` | Capsule Result                               | US-013–016             |
| `html-prototypes/my-items.html`       | My Items                                     | US-006, US-007         |
| `html-prototypes/uncapsulated.html`   | Uncapsulated                                 | US-020                 |
| `html-prototypes/favorites.html`      | Favorites                                    | US-019                 |
| `html-prototypes/for-sale.html`       | For Sale                                     | US-021                 |
| `html-prototypes/for-repair.html`     | For Repair                                   | US-024                 |
| `html-prototypes/profile.html`        | Profile                                      | US-005, US-018         |
| `html-prototypes/design-system.html`  | Design System (tokens, components, patterns) | —                      |
| `html-prototypes/color-system.html`   | Color Palette (51 colors, capsule palette)   | —                      |

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

| Document                                                               | Content                                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `.specify/specs/001-capsule-zero-mvp/spec.md`                          | 25 user stories (24 MUST + 1 NICE), user flow, screen inventory                                                |
| `docs_capsule_zero/project/methodology/capsule-methodology.md`         | Capsule methodology, compatibility rules, palette logic, limits                                                |
| `docs_capsule_zero/project/methodology/colors.md`                      | 51-color system, HEX values, compatibility matrix                                                              |
| `docs_capsule_zero/project/methodology/categories.md`                  | Garment categories and classification                                                                          |
| `docs_capsule_zero/project/methodology/outfit-generation.md`           | 7-layer outfit structure, OPR formula, combination algorithm                                                   |
| `docs_capsule_zero/project/methodology/gap-analysis.md`                | Gap detection rules, shopping list format, validation constraints                                              |
| `docs_capsule_zero/project/frontend/styling.md`                        | Glass tokens, colors, typography, component patterns (source of truth for visual tokens and component styling) |
| `docs_capsule_zero/project/frontend/frontend-docs.md`                  | Web frontend architecture, libraries, state management, env vars                                               |
| `docs_capsule_zero/project/frontend/components.md`                     | Component conventions, glass patterns, mobile-first rules                                                      |
| `docs_capsule_zero/project/backend/backend-docs.md`                    | Backend stack, API structure, DB schema, env vars                                                              |
| `docs_capsule_zero/project/mobile/mobile-docs.md`                      | Flutter app architecture, mobile auth/deep links, mobile payment constraints                                   |
| `docs_capsule_zero/project/architecture/phase-4-council.md`            | Architecture council decision register and validation notes                                                    |
| `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` | Stage 1 mock-first entrance gate and provider integration gates                                                |
| `docs_capsule_zero/adr/`                                               | ADRs for stack, auth, storage, and API contract                                                                |
| `docs_capsule_zero/glossary.md`                                        | Domain terminology with RU/ES-AR equivalents                                                                   |
| `docs_capsule_zero/i18n/ui-texts.md`                                   | i18n content (EN, ES-AR, RU) — all 16 screens                                                                  |
| `docs_capsule_zero/ux/emotion-map.md`                                  | Emotional targets per screen, UX principles                                                                    |
| `docs_capsule_zero/ux/ux-validation.md`                                | Competitor analysis, UX benchmarks, 6 critical insights                                                        |
| `docs_capsule_zero/features/f-XXX-name.md`                             | Per-feature requirements, acceptance criteria, edge cases (15 files)                                           |
| `docs_capsule_zero/screens/screen-name.md`                             | Per-screen layout, component details, states (11 files)                                                        |
| `docs_capsule_zero/marketing/go-to-market.md`                          | TAM/SAM/SOM, competitor matrix, persona, pricing                                                               |
| `docs_capsule_zero/launch/launch-plan.md`                              | Full launch plan, phases 0-7, quality gates                                                                    |
| `.specify/specs/001-capsule-zero-mvp/prototype-map.md`                 | Prototype-to-story map, cross-cutting stories, backend-only stories                                            |

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
- Only trusted repository actors may trigger AI workflows.
- Trusted actors are `OWNER`, `MEMBER`, and `COLLABORATOR`.
- Native review normalization is documented in `docs_capsule_zero/project/devops/review-contract.md`.
- Local PowerShell and worktree orchestration scripts are no longer part of the repository.

## SENAR Completion Contract

Capsule Zero adds a lightweight supervised-verification layer (SENAR) on top of the spec-first PR workflow. Full mapping: `docs_capsule_zero/project/devops/senar-mapping.md`.

A task is **not complete** until the current PR head SHA has:

- Feature memory that names goal and scope (`## Goal`, `## Scope` in `spec.md`).
- Evidence for every acceptance criterion in the `## Verification` table of `plan.md` (command, test, screenshot, diff, or linked check — **not** an AI-written summary).
- At least one negative scenario covered, or an explicit one-line waiver in `spec.md`.
- `## Process Memory` (Dead Ends / Decisions / Known Issues) updated in `tasks.md` _before_ declaring the work complete.
- The SENAR Done Gate checklist filled in the PR description.
- The standard merge-ready conditions: green `baseline-checks` / `guard` / `AI Review`, no blocking review findings, no merge conflicts.

**Scope of application:** SENAR fields are required for every spec authored after the SENAR layer shipped (i.e. starting with `005-…`). Specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are grandfathered and keep their original shape; do not retrofit them.

## Review guidelines

- Codex review uses native GitHub PR review output plus `P0-P3` inline severity badges.
- Claude review uses a top-level `claude[bot]` comment with marker lines, not a formal GitHub PR review.
- When a Claude review request includes `AI_REVIEW_AGENT`, `AI_REVIEW_SHA`, and `AI_REVIEW_OUTCOME`, preserve those lines exactly at the start of the final top-level Claude comment.
- `AI_REVIEW_OUTCOME=pass` means no material findings.
- `AI_REVIEW_OUTCOME=advisory` means advisory-only findings that should not block merge.
- `AI_REVIEW_OUTCOME=block` means at least one finding should block merge.
- Treat low-severity-only findings as advisory and non-blocking.

---

## Phase 4 — Technical Architecture (DECISIONS DOCUMENTED)

Architecture decisions have been made through an Architectura-style council and documented in the repository. Phase 5 starts with mock-first Stage 1 implementation: product work can proceed behind provider adapters and fixtures, while real provider registration remains an integration gate before provider-backed QA, staging, or launch.

### What's already done

| Item                        | Status                                       | Location                                                               |
| --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| Frontend framework          | ✅ Next.js 14+ App Router, React, TypeScript | `/app`                                                                 |
| Styling                     | ✅ Tailwind CSS v4 with custom @theme tokens | `app/src/styles/tokens.css`                                            |
| Design tokens               | ✅ Glass tokens, colors, typography          | `docs_capsule_zero/project/frontend/styling.md`                        |
| Folder structure            | ✅ Basic boilerplate (`/app/src/`)           | `/app/src/`                                                            |
| Architecture council        | ✅ Decisions + validation                    | `docs_capsule_zero/project/architecture/phase-4-council.md`            |
| Phase 5 entrance checklist  | ✅ Required Sprint 0 gate documented         | `docs_capsule_zero/project/architecture/phase-5-entrance-checklist.md` |
| ADR-001: Stack Overview     | ✅ Accepted                                  | `docs_capsule_zero/adr/adr-001-stack.md`                               |
| ADR-002: Auth               | ✅ Accepted                                  | `docs_capsule_zero/adr/adr-002-auth.md`                                |
| ADR-003: Storage            | ✅ Accepted                                  | `docs_capsule_zero/adr/adr-003-storage.md`                             |
| ADR-006: Mock-first Stage 1 | ✅ Accepted                                  | `docs_capsule_zero/adr/adr-006-mock-first-mvp-stage-one.md`            |
| API spec                    | ✅ MVP planning contract                     | `docs_capsule_zero/adr/api-spec.md`                                    |
| Backend docs                | ✅ Stack, API structure, DB schema           | `docs_capsule_zero/project/backend/backend-docs.md`                    |
| Frontend docs               | ✅ Libraries, state management, env vars     | `docs_capsule_zero/project/frontend/frontend-docs.md`                  |
| Components guide            | ✅ Component conventions, glass patterns     | `docs_capsule_zero/project/frontend/components.md`                     |
| Mobile docs                 | ✅ Flutter stack, deep links, mobile QA      | `docs_capsule_zero/project/mobile/mobile-docs.md`                      |

### Accepted Phase 4 decisions

| Decision               | Accepted option                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Backend / BaaS**     | Supabase                                                                                           |
| **Database**           | Supabase PostgreSQL with RLS, pgvector, and Postgres full-text search                              |
| **Auth**               | Supabase Auth with Email in Stage 1; Google OAuth and Apple Sign-In deferred to MVP Stage 2        |
| **File Storage**       | Supabase Storage                                                                                   |
| **Background Removal** | Mocked in Stage 1; Photoroom API behind an adapter, with remove.bg fallback if SLA/quality fails   |
| **Hosting**            | Vercel frontend + Supabase backend services                                                        |
| **State Management**   | Zustand for local Journey/UI state; TanStack Query for interactive server-state                    |
| **API Client**         | Server Components/Actions + typed fetch/TanStack Query; Route Handlers for explicit API boundaries |
| **Forms**              | React Hook Form + Zod                                                                              |
| **i18n**               | next-intl                                                                                          |
| **Payments**           | Mocked in Stage 1; Lava.top web purchases + Postgres coin ledger; mobile read-only balance in v0.1 |
| **Mobile App**         | Flutter + Dart for iOS and Android                                                                 |

### Required Sprint 0 follow-ups before Phase 5 Stage 1 feature work

- Founder approval on the accepted stack.
- Configure linting and local commit hooks before first Phase 5 product-code PR.
- Keep external service calls behind mockable provider/domain adapters.
- Create migration-backed Supabase schema, storage buckets, RLS policies, and seed data.
- Scaffold Flutter app and shared web/mobile domain contract.
- Generate TypeScript and Dart API clients from `docs_capsule_zero/adr/openapi.yaml`.

### Provider integration gates before real-provider QA/staging/launch

- Create Supabase local/staging project credentials when persistence/RLS validation needs real Supabase.
- Configure Google and Apple OAuth providers only for MVP Stage 2 social auth.
- Configure Lava.top products/API key/webhook before real web purchases are tested.
- Run a real-image Photoroom latency/quality test against the < 5 sec background removal gate before enabling real image processing.
- Production credentials must be stored only in production deployment/provider dashboards and must not be shared with agents.

### Phase 4 quality gate (from launch-plan.md)

- All stack decisions documented as ADRs: ✅ done
- CI/CD pipeline set up (auto-build, preview deployments): ✅ baseline GitHub checks documented and configured
- Local dev setup documented (env vars, seed data): ✅ documented in backend/frontend docs
- Repository has linting + commit hooks configured: pending Sprint 0 follow-up
- Founder approval on stack/mock-first Stage 1 posture: recorded in ADR-006; final launch sign-off remains pending

### Key constraints for architecture decisions

- **No subscription model** — coins only (Lava.top one-time purchases)
- **3 upload methods:** photo upload · marketplace link import · semantic search (shared DB)
- **Background removal < 5 sec** per quality gate
- **Multilingual from Day 1:** EN, ES-AR, RU — use `next-intl` or `react-i18next`
- **i18n strings:** `docs_capsule_zero/i18n/ui-texts.md`
- **Mobile-first:** phone UX first on web and Flutter; iPhone 14+ (375px), Android small/standard, iPad/tablet (768px), Desktop 1280px+
- **Native mobile MVP:** Flutter app for iOS and Android uses the same Supabase backend and documented API contract
- **Mobile payments:** Lava.top is canonical for web purchases; iOS/Android v0.1 must not expose purchase CTAs or external payment links, only balance/status
