# Launch Plan — Capsule Zero v0.1

> **Monetization freeze (2026-07-16):** Every coin, balance, Lava.top, billing, payment-product,
> pricing, or purchase-flow statement below is superseded historical context under `PRODUCT-PLAN.md`
> D2. Do not implement, provision, expose, test as a release gate, or use it for a new contract or
> code generation. Stage 4 will delete or replace the retained legacy after choosing a model.

> Original source: Capsule Zero Launch Plan RU.pdf (February 2026). Updated in June 2026 for the production-stack pivot (Go modular monolith + nginx + Ory Kratos + PostgreSQL + Redis + object storage + Cloudflare + Resend) and React Native mobile apps; storage aligned to Hetzner Object Storage on 2026-07-10; current path to first commercial sales is 13-14 weeks.

## Overview

| Parameter              | Value                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| **Timeline**           | 13-14 weeks (about 3 months)                                                |
| **Priority**           | Premium quality > speed                                                     |
| **Release philosophy** | Minimum features, maximum quality — production-grade from Day 1             |
| **Team**               | AI-native + founder as creative director                                    |
| **Tagline**            | "A capsule wardrobe that feels like a personal stylist — not a spreadsheet" |

## v0.1 Scope

### What's IN v0.1

- Landing page with premium brand identity (hero, value proposition, CTA)
- Multilingual support (EN and RU active; ES-AR retained as reference and deferred to v0.2)
- Mobile-first web design
- React Native iOS and Android apps
- User profile / personal cabinet
- Onboarding — guided capsule creation (3-step journey: wardrobe type → categories → colors + items)
- Item upload (originals only in v0.1; self-hosted background removal in Stage 2)
- Visual wardrobe grid — clean gallery of all items
- Capsule result with outfits, gap analysis, and shopping list

### What's NOT in v0.1

- AI/ML outfit recommendations (not planned — outfit generation is algorithmic, rule-based)
- Coin purchases and image enhancement (v0.2 backlog — Lava.top is stubbed in v0.1)
- Self-hosted image processing (Stage 2)
- Google OAuth and Apple Sign-In (Stage 2)
- Social features, sharing, community
- E-commerce integrations and affiliate links
- Separate brand platform
- Outfit constructor / builder
- Outfit saving and browsing
- Advanced wardrobe analytics and insights
- Full offline mobile mode
- Native watch/tablet-specific experiences

## Master Plan — Phase Overview

| Phase | Name                             | Timeline         | Goal                                                                       | Key Artifact                                   |
| ----- | -------------------------------- | ---------------- | -------------------------------------------------------------------------- | ---------------------------------------------- |
| 0     | Founder Vision Extraction        | W1 (3 days)      | Extract and structure vision: user flow, aesthetics, values                | Founder Vision Document (FVD)                  |
| 1     | Market Research & Positioning    | W1 (4 days)      | Niche, competitive positioning, TAM/SAM/SOM in USD                         | Market Research Brief (PDF A4)                 |
| 2     | Product Definition & UX Research | W2 (5 days)      | v0.1 scope, personas, user stories, UX validation, styling expertise       | PRD + Styling Guide                            |
| 3     | UX/UI Design                     | W3-4 (10 days)   | UI kit, hi-fi prototypes, micro-interactions, brand system                 | Design Package + UI Kit                        |
| 4     | Technical Architecture           | W4-5 (5 days)    | Tech stack, architecture, repository, CI/CD                                | ADR + Boilerplate                              |
| 5     | Development Sprint               | W5-11 (30 days)  | Sprint 0 readiness, then v0.1 web, Go backend, and React Native core flows | Product on staging/TestFlight/internal testing |
| 6     | QA & Soft Launch                 | W11-13 (10 days) | Bug fix, polishing, beta test, premium audit across web and mobile         | Release candidate + QA report                  |
| 7     | Commercial Launch                | W13-14 (5 days)  | Go-live, marketing, first paying users                                     | Live product + assets                          |

> Total timeline: 13-14 weeks after the React Native mobile scope addition and Sprint 0 readiness gate. Phases 0-1 overlap in Week 1. Phase 4 starts in parallel with Phase 3. Buffer +1 week for UX/UI polishing and mobile release readiness.

## Phases 0–3 — COMPLETE ✅

| Phase                 | Artifact                                               | Where                                                                                                  |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 0: Founder Vision     | Vision, principles, red lines, references              | `.specify/memory/constitution.md`                                                                      |
| 1: Market Research    | ICP, competitors, TAM/SAM/SOM, pricing                 | `docs_capsule_zero/marketing/go-to-market.md`                                                          |
| 2: Product Definition | 25 user stories, UX validation, emotion map            | `docs_capsule_zero/ux/`, `.specify/specs/001-capsule-zero-mvp/spec.md`                                 |
| 3: UX/UI Design       | Hi-fi prototypes, design system, color palette, tokens | `html-prototypes/` (screens + `design-system.html` + `color-system.html`), `app/src/styles/tokens.css` |

## Phase 4 — Technical Architecture

**Goal:** Tech stack, repository, CI/CD, development environment.
**Timeline:** Weeks 4-5, parallel with Phase 3 (5 days)
**AI roles:** Tech Architect AI (lead), Programmer AI (setup), DevOps Consultant, Mobile Architect AI

| Task              | Days | Description                                                                                                                                                                          | Result         |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| Stack selection   | D1-2 | Web (Next.js/React), mobile (React Native), Go backend, plain Postgres in v0.1 (pgvector deferred), Hetzner Object Storage, Cloudflare front-door/CDN deferred to Stage 2, Lava.top payments (stubbed in v0.1). | ADR            |
| Repository        | D2-3 | Mono/multi-repo. Linting, formatting, commit hooks, folder structure.                                                                                                                | Clean repo     |
| CI/CD             | D3-4 | Auto-tests, build, deploy. Staging. Preview deployments.                                                                                                                             | CI/CD pipeline |
| API design        | D4-5 | Shared web/mobile backend contract, REST/RPC endpoints, schemas, authentication, Lava.top webhook contract.                                                                          | API spec       |
| Dev documentation | D5   | Env variables, local DB, seed data, tests.                                                                                                                                           | Setup guide    |

## Phase 5 — Development Sprint

**Goal:** Convert architecture into implementation-ready contracts, then implement v0.1 features to production quality across web and mobile.
**Timeline:** Weeks 5-11 (30 working days)
**AI roles:** Programmer AI (lead), Mobile Engineer AI, Tech Architect (review), QA AI, UX/UI Designer, AI Stylist-Consultant

| Sprint                            | Days            | Focus                                                                                                                                                                             | Result                                                                               |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0: Readiness Gate                 | D1-5 (W5)       | OpenAPI contract, Go monolith migrations + tests, React Native scaffold, docker-compose runtime on the server, Cloudflare anti-DDoS (deferred to Stage 2, 2026-07-02), Resend setup, lint/hooks, founder approval. | Phase 5 entrance checklist complete (`.specify/specs/024-production-stack-runtime/`) |
| 1: Foundation                     | D6-10 (W6)      | Landing pixel-perfect, navigation, mobile-first layout system, shared tokens, Go API auth + profile slice.                                                                        | Landing + backend foundation on staging                                              |
| 2: Shared Contract + Mobile Shell | D11-15 (W7)     | Auth, profile, generated clients from OpenAPI, React Native routing, deep links, shared domain models.                                                                            | Web auth + React Native shell                                                        |
| 3: Onboarding                     | D16-20 (W8)     | Guided journey (wardrobe type, categories, colors + items), profile, transitions across web and mobile.                                                                           | Onboarding on staging/internal mobile build                                          |
| 4: Core Wardrobe                  | D21-25 (W9-10)  | Photo upload, background removal, auto-categorization, grid, filtering, mobile camera/gallery flow.                                                                               | Upload + grid across clients                                                         |
| 5: Capsule + Web Payments         | D26-30 (W10-11) | Capsule result, dashboard, shopping list, favorites, wardrobe states, Lava.top stub (live in v0.2), mobile balance display, all animations.                                       | Full v0.1 on staging/TestFlight/internal testing                                     |

### Quality Gate: Implementation Completeness

- Screens = designs to 2px precision
- Animations per spec (timing, easing)
- Empty/loading/error states implemented
- Mobile-first web: iPhone 14+ 375px, iPad/tablet, desktop 1280px+
- React Native: iOS and Android smoke-tested on small and standard phone sizes
- Page load < 2 sec on 4G
- Upload + background removal < 5 sec
- Guided journey content verified against approved prototype
- Shared web/mobile API contract verified by tests or generated types
- Lava.top web purchase/webhook flow tested in sandbox or controlled test mode before launch
- Mobile purchase CTAs absent in iOS/Android builds; mobile only displays coin balance/status
- Zero console errors, zero FOUC

## Phase 6 — QA, Polishing & Soft Launch

**Goal:** Release candidate. Beta test. Polish to premium standard.
**Timeline:** Weeks 11-13 (10 days)
**AI roles:** QA AI (lead), Programmer AI, UX/UI Designer (audit), Marketing Promotion AI

| Task               | Days  | Description                                                                            | Result            |
| ------------------ | ----- | -------------------------------------------------------------------------------------- | ----------------- |
| QA testing         | D1-3  | Functional, cross-browser, web/mobile cross-device, edge cases.                        | Bug report        |
| Visual audit       | D3-4  | Pixel check: alignment, spacing, colors, animations.                                   | Audit report      |
| Performance        | D4-5  | Lighthouse 90+ perf, 95+ a11y, mobile app startup smoke. Lazy loading, code splitting. | Perf report       |
| Bug fix & polish   | D5-7  | Critical/major bugs, visual fixes, animation polishing.                                | Release candidate |
| Beta (soft launch) | D7-9  | 10-20 target audience users. First impression, WTP, 3-5 interviews.                    | Beta feedback     |
| Final preparation  | D9-10 | Critical feedback, final QA, DNS, SSL, analytics.                                      | Production-ready  |

### Quality Gate: Release Readiness

- Zero critical/major bugs
- Lighthouse: Performance 90+, Accessibility 95+
- Beta users: first impression 4.5+/5
- 60%+ beta users complete full flow
- Founder — written approval
- Legal requirements met (privacy, terms)
- Analytics and error tracking working
- Internal mobile builds install and complete auth/onboarding/upload smoke flow
- Mobile builds contain no purchase CTAs or external payment links unless later policy approval exists

## Phase 7 — Commercial Launch

**Goal:** Public launch, marketing, first paying users.
**Timeline:** Weeks 13-14 (5 days)
**AI roles:** Marketing Promotion AI (lead), Product AI, UX/UI Designer

| Task              | Days | Description                                                                                                  | Result                |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------ | --------------------- |
| Marketing assets  | D1-2 | Product Hunt, social media, email waitlist, press kit.                                                       | Marketing package     |
| Production deploy | D1   | Deploy web/backend, Lava.top web payment verification, mobile release channel readiness, monitoring 2 hours. | Live product          |
| Launch day        | D2-3 | Product Hunt, social media, email, outreach to 50+ early adopters.                                           | Launch campaign       |
| First 48 hours    | D3-4 | Monitoring: registrations, conversion, errors. Response within 2 hours.                                      | Metrics dashboard     |
| Retrospective     | D4-5 | Analyze 1 week of data: activation, retention, revenue, NPS. Priorities for v0.2.                            | Report + roadmap v0.2 |

### First Sales Targets (1-2 weeks)

- 100+ registered users
- 20+ completed full wardrobe upload
- 5-10 paying users via coin purchases
- NPS 50+ from early adopters
- Product Hunt Top 10 of the day (stretch goal)

## AI Team Operating Model

### Roles & Responsibilities

| Role                    | Responsibility                                                                                                                  | Phases               | Key Outputs                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------- |
| Marketing Researcher AI | Market analysis, competitors, segments, TAM/SAM/SOM, positioning                                                                | Phase 1              | Brief, positioning                |
| Product AI              | Strategy, requirements, user stories, prioritization, PRD. Vision extraction.                                                   | Phases 0, 2, 7       | FVD, PRD, messaging               |
| AI Stylist-Consultant   | Styling expertise: capsule logic, palettes, categorization, fashion-decision validation. Personal shopper level luxury segment. | Phases 0, 1, 2, 3, 5 | Styling guide, palette validation |
| UX/UI Researcher        | UX validation, competitor benchmarks, emotion map, first-impression audits, beta testing.                                       | Phases 0-3, 6        | UX insights, emotion map          |
| UX/UI Designer          | Design system, hi-fi screens, components, micro-interactions, visual QA.                                                        | Phases 3, 5-6        | Design package, audit             |
| Tech Architect AI       | Stack, architecture, API, code review.                                                                                          | Phases 4-5           | ADR, API spec                     |
| Programmer AI           | Web frontend + backend, components, API, optimization.                                                                          | Phases 5-6           | Codebase, staging                 |
| Mobile Engineer AI      | React Native app, iOS/Android builds, mobile auth/deep links, app-store readiness.                                              | Phases 4-6           | Mobile app builds                 |
| QA AI                   | Tests, cross-browser, regression, bug reports.                                                                                  | Phases 5-6           | Reports, release sign-off         |
| DevOps Consultant       | CI/CD, hosting, production, monitoring.                                                                                         | Phases 4, 6-7        | Pipeline, production              |
| Marketing Promotion AI  | Launch, copywriting, social media, Product Hunt, press kit.                                                                     | Phases 6-7           | Launch assets                     |

### Tool Mapping

| Tool                    | Roles                                                                                                  | Best For                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Claude.ai (Opus/Sonnet) | Product AI, Marketing, UX/UI Researcher, UX/UI Designer (specs), Tech Architect, AI Stylist-Consultant | Strategy, research, specifications, styling expertise |
| Claude Code             | Programmer AI, QA AI, DevOps                                                                           | Code, testing, CI/CD, deploy, optimization            |
| External APIs           | Hetzner Object Storage, Resend, Cloudflare (Stage 2), Lava.top (stubbed in v0.1)                        | Specialized services                                  |

### Artifact Handoff Protocol

Principle: structured documents, not conversations. Every artifact is self-contained.

- Phase 0 → FVD (3 pp.) → Phases 1, 2, 3
- Phase 1 → Brief (1 pp. positioning) → Phase 2
- Phase 2 → PRD (5 pp.) + Styling Guide (2-3 pp.) → Phases 3, 4, 5
- Phase 3 → Design Package → Phase 5
- Phase 4 → ADR + API → Phase 5
- Phases 5-7 → from accumulated artifacts

### Founder Role Across All Phases

The founder operates as creative director and final decision-maker. Taste, intuition, and founder vision override AI recommendations in case of conflict.

- Phase 0: Primary information source (3 structured sessions)
- Phase 1: Validates research based on personal market intuition
- Phase 2: Approves PRD and feature prioritization
- Phase 3: Creative director — reviews each design stage, final approval
- Phase 4: Approves stack with scalability in mind
- Phase 5: Weekly demo, decisions on trade-offs
- Phase 6: Final quality control, recruits beta testers, approves launch
- Phase 7: Public face of launch, outreach, community

## Quality Gates — Summary

| Phase           | Gate                        | Criteria                                                                                                                                                 | Approvers                    |
| --------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 3 (Design)      | Premium design              | 3+ states per screen. Consistent typography. Palette confirmed by AI stylist. "Aesop/Notion" test. Founder approved.                                     | Designer + Stylist + Founder |
| 5 (Development) | Implementation completeness | Screens = design to 2px. Animations per spec. < 2 sec load. Mobile-first web + React Native phone smoke tests. Guided journey content correct. 0 errors. | QA + Designer                |
| 6 (QA)          | Release candidate           | 0 critical/major. Lighthouse 90+/95+. Beta 4.5+/5. 60%+ completion. Founder approved. Legal.                                                             | QA + Founder                 |
| 7 (Launch)      | Go-Live                     | Lava.top web purchases tested. Mobile purchase CTAs absent unless later policy approval exists. Analytics working. Monitoring 2 hours. Legal pages.      | DevOps + Founder             |

> **The premium test across all phases:** "Will the target user screenshot this screen and send it to a friend?" If the answer is not a confident "yes" — back to revision.

## Context Management Strategy

AI context windows are finite. The plan is designed to work within them through compact, self-contained artifacts.

### Persistent Documents (all phases)

- Founder Vision Document (FVD) — max 3 pp., always in context
- PRD (compact) — max 5 pp., during product/design/dev work
- Styling Guide — 2-3 pp., during design and development
- Design tokens — 1 pp., during development

### Phase-to-Phase Documents

- Market Brief — consumed by Phase 2, then only positioning summary retained
- Full design screens — reference during development, archive after Phase 6
- API spec — used in Phase 5, archived after

### Documents to Delete

- Raw session transcripts (replaced by FVD)
- Competitor screenshots (replaced by brief)
- Wireframes (replaced by hi-fi)
- Sprint notes
- Individual bug reports (after fix)
- Configuration logs

> **Rule:** If an artifact is fully included in a downstream document, the original can be deleted. Structured output always replaces raw input.
