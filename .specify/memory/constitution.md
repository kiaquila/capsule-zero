# Capsule Zero Constitution

## I. Product Vision & Positioning

**Capsule Zero** is a premium fashion-tech platform — "the Aesop of wardrobe apps". It transforms closet chaos into a curated system where every piece works harder.

**Core proposition:** Create maximally productive wardrobes from minimum items, maximum outfits with the WOW effect. The product turns a closet into a thoughtful system where every item is in its place and works for the user.

**Emotional positioning:** "Finally, a beautiful tool that will help me organize my wardrobe."

**Pain:** Too many items, too few outfits. Cognitive load every morning.

**Value:** Fewer items — more style. Optimal number of favorite items → maximum outfits per person.

**Business model (v0.1): UNDER REVIEW — amended 2026-07-16 by [`PRODUCT-PLAN.md`](../../PRODUCT-PLAN.md) D2.** Coins are **cancelled** as the monetization hypothesis; the model and its unit economics are reworked from scratch in plan Stage 4. Until Stage 4 decides, no feature, spec, schema, or API may be designed around coins, and the "1 free capsule, more for coins" limit is not implemented. The free tier keeping full core value (wardrobe, outfits, OPR) is unchanged. B2B brand commission in Product v2.0 is unaffected by this review.

*Superseded text (kept for context until Stage 4 rewrites this section):* "Freemium + coins. No subscription. Free tier includes all basic features + 1 capsule. Revenue streams: (1) coins — each additional capsule (2+) costs coins, editorial photo enhancement costs coins; (2) brand commission from a separate brand platform in Product v2.0. Coins are architecturally planned from Day 1."

**Psychotype:** "New money mindset meets old money taste" — affluent but rational. Not luxury for show, but comfort and aesthetics. Slow fashion, sustainability as natural outcome.

## II. Capsule Zero Proprietary Methodology

Capsule Zero proprietary color circle methodology.

### Color Architecture

- **Temperature axis:** Warm / Cool / Neutral
- **Group taxonomy:** 4 chromatic groups — Brights (vivid), Pastels (light), Desaturated (muted), Darks (deep). Full table and compatibility matrix: `docs_capsule_zero/project/methodology/colors.md`.
- **Achromatic axis:** Yes / No (3 universal connectors — Black, Gray, White)

### Immutable Palette Rules

- Capsule color palette is **locked at creation**. Changing palette = new capsule.
- Compatible colors can be added via item addition/replacement.
- Incompatible items are **blocked** with recommendation to create a separate capsule.
- Achromatics (Black, Gray, White — 3 colors, IDs A1–A3) are **universal connectors** — always compatible with every color in the system. → Full color table: `docs_capsule_zero/project/methodology/colors.md`

### Compatibility Rules

| Combination                                           | Verdict                                |
| ----------------------------------------------------- | -------------------------------------- |
| Achromat + Achromat                                   | ALWAYS compatible                      |
| Achromat + Any color                                  | ALWAYS compatible                      |
| Same chromatic group                                  | Compatible                             |
| Desaturated + Dark                                    | Compatible                             |
| Brights + Pastels / Brights + Darks / Pastels + Darks | BLOCKED — separate capsule recommended |
| Temperature difference                                | Metadata only — not a hard filter      |

### Outfit Productivity Ratio (OPR)

**Formula:** number of generated outfits / number of items in capsule.
A good capsule of 30 items yields 80–150+ unique outfits. OPR is the hero metric displayed on capsule cards in the dashboard. Updated on every capsule change. Shows delta: "+0.3 from last change".

### Item Categories

Only **basic cuts** — simple, non-designer, guaranteeing universal combinability. Three wardrobe types: Women's (F), Men's (M), Mixed. TypeScript enum: `FEMALE | MALE | MIXED`. Min 8 categories to create a capsule. No upper limit. Category system with 7 groups: Tops, Dresses & Skirts, Bottoms, Outerwear, Shoes, Bags, Accessories.

### Auto-tagging

Every item must have: name, category, color palette (color dots). Auto-tagging is AI-generated on addition, user-editable. Extended fields (brand, material/composition, source URL) parsed automatically on import. Basis for capsule assembly, compatibility validation, gap analysis, and recommendations.

## III. Design Principles

### Visual Identity

- **Achromatic interface** — black / white / grey, plus **one signal accent**: the gold family
  (`#EFBF04 → #FFDD00`), reserved exclusively for the primary CTA and the logo accent. All other
  color comes ONLY from the user's own items.
  > **Amended 2026-07-16 — Q4 closed (PRODUCT-PLAN D3, spec 043).** The founder ratified the gold-CTA
  > exception and resolved the CTA/error semantic collision by separating the roles: gold means "act";
  > errors move to signal red `#FF5449` (see § Error color below). Gold is never used for statuses,
  > errors, focus rings, or decoration; errors are never gold or yellow. The achromatic base and
  > "color from the user's items" stay binding for everything else.
- **Glassmorphism UI language** — frosted glass surfaces, backdrop blur, translucent layers, subtle borders on glass elements.
  - Glass panels: `rgba(255,255,255,0.22)` + `backdrop-filter: blur(40px)` (main panels) / `blur(44px)` (nav, bottom sheets)
  - Border: `1px solid rgba(255,255,255,.58)` + highlight `inset 0 1px 0 rgba(255,255,255,.72)`
  - Shadow: `0 8px 32px rgba(0,0,0,.22)`
- **Background:** `wall.png` grayscale + gradient overlay
- **8px grid** for all spacing
- **Typography:** Helvetica Neue / Arial, thin wide headings, grotesque body
- **Error color:** `#FF5449` (signal red; text runs on scrim chips use the lightened step `#FF7A70`) — decided 2026-07-16 with Q4. The former yellow `#FFD600` is retired so the error role cannot collide with the gold CTA accent.
- **Favorite active:** `rgba(220,30,50,.90)` — saturated opaque red

### Editorial Aesthetics

- References: Zara.com, COS, Massimo Dutti — editorial minimalism, typography as hero
- B&W editorial wallpaper and generous negative space on the landing hero
- A concise product-value headline, supporting copy, and one gold primary CTA; the retired
  poster/manifesto direction is historical, not a current landing requirement (specs 043/044)
- Interface must be worthy of standing next to Aesop / ZARA / COS
- Photo enhancement target standard: ZARA / Farfetch / COS editorial photography
- ~~Monetization reference: Canva credit model — users buy coin packs for premium features (not subscription)~~ — WITHDRAWN 2026-07-16 with the coins cancellation (§I, PRODUCT-PLAN D2). No monetization reference stands until plan Stage 4.

### Red Lines — Do Not Ship If:

- Interface feels cheap or dated (fails "Aesop test")
- Any critical bug is present or error surfaces to user
- Interface is confusing — maximum simplicity is non-negotiable
- Service is unavailable or unreliable

### Animation Principles

- Transitions — instant. Completion — quiet and elegant (checkmark, soft glow).
- Zero "dead zones" — every user action gets visual feedback.
- Soft animation, highlight, quiet checkmark.
- Decorative motion MUST stop when the user requests reduced motion.

### Tone of Voice

Restrained, confident. Like a smart stylist: suggests, explains, does not impose. Blocks — with explanation and alternative.

## IV. UX Philosophy

### "Direct, Not Dictate"

The platform guides the user through methodology without imposing. It suggests, explains, and offers alternatives. The user chooses color, the platform highlights compatible items.

### Guided 3-Step Journey

1. **Choose wardrobe type** (women's / men's / mixed)
2. **Select categories** (checklist, min 8)
3. **Choose colors + add items** (palette selection, three upload methods: photo, marketplace links, semantic search)

### Emotional Arc

**Attraction → Trust → Creativity → Satisfaction**

| Phase        | Screens                              | User's Inner Voice                                         |
| ------------ | ------------------------------------ | ---------------------------------------------------------- |
| ATTRACTION   | Landing page                         | "This is not another clothes app — this is something else" |
| TRUST        | Registration, Dashboard              | "Fast, beautiful, they respect my time"                    |
| CREATIVITY   | Journey 1-3, Import, Search          | "I'm building my style system!"                            |
| SATISFACTION | Result, Dashboard (filled), My Items | "My wardrobe finally works"                                |

### Cross-cutting Emotional Principles

- **Silence over noise.** Every screen must "breathe". Empty space is not emptiness but confidence.
- **Instant feedback.** Every user action gets visual response.
- **Screenshot test.** Main quality criterion: "Will the user screenshot this and send to a friend?" If not — back to revision.
- **Emotion = function.** Beauty of interface is not decoration but an instrument. Premium design reduces anxiety, increases trust, motivates return.

## V. Technology Decisions

- **Web frontend:** Next.js 14+ App Router, React, TypeScript
- **Mobile:** React Native (iOS + Android) sharing the same Go API contract
- **Styling:** Tailwind CSS v4 with custom @theme tokens
- **Backend:** Go modular monolith (single binary, bounded contexts inside the same process) served behind nginx
- **API gateway:** nginx 1.27 with Let's Encrypt TLS (certbot on host), `limit_req_zone` rate-limit, `auth_request` into Kratos
- **Auth:** Ory Kratos (email/password and Google sign-in in v0.1 — spec 037, native-flow OIDC; Apple Sign-In in Stage 2)
- **Database:** PostgreSQL 16 with Postgres FTS in v0.1; pgvector and PgBouncer are deferred by ADR-007 until the semantic-search and connection-pressure triggers fire
- **Cache / queue:** Redis 7 (cache, sessions, Redis-based job queue)
- **File storage:** Hetzner Object Storage (S3-compatible; no built-in CDN in v0.1, CDN/front-door deferred to Stage 2)
- **Email:** Resend for transactional email (verification, password reset, security alerts)
- **Image processing:** Self-hosted Capsule Zero model behind a worker (deferred to Stage 2)
- **DNS / front-door:** Spaceship registrar; Cloudflare proxy for DDoS protection and CDN is deferred to Stage 2 (founder decision 2026-07-02) — v0.1 pre-launch runs direct DNS to the host nginx edge
- **Observability:** syslog file logs + tracing in v0.1; Grafana, Sentry, and Prometheus are deferred
- **Hosting:** Single Hetzner Cloud server running docker-compose (migrated from DigitalOcean 2026-07-02); every service declared as a separate `services:` entry
- **Languages:** EN (primary) and RU in v0.1 — i18n from Day 1, switching without reload. ES-AR is retained as reference copy and deferred globally to v0.2.
- **Responsive:** iPhone 14+ (375px), iPad (768px), Desktop 1280px+
- **Performance targets:** Page load < 2 sec on 4G, Upload + bg removal < 5 sec (gated by self-hosted image model Stage 2 delivery)
- **Supported upload formats:** JPEG, PNG, WebP (max 10 MB)
- **Supported import sources:** Best-effort generic product URL parsing, with retailer-specific adapters added where needed for higher accuracy

## VI. Code Quality Standards

### Quality Gates

- Every screen: minimum 3 states (default, loading, empty/error)
- Typography hierarchy: clear and uniform
- Contrast: WCAG AA while preserving aesthetics
- Micro-interactions: specified for all elements
- Screens = designs to 2px precision
- Animations per specification (timing, easing)
- Empty/loading/error states implemented
- Adaptive: iPhone 14+, iPad, Desktop 1280px+
- Zero console errors, zero FOUC
- Lighthouse: Performance 90+, Accessibility 95+

### Red Lines (never ship if violated)

- Cheap design — interface must be worthy next to Aesop / ZARA / COS
- Bad stylist recommendations — better fewer, but more accurate
- Complex interface — maximum simplicity and intuitiveness
- Critical bugs or surfacing errors
- Service unavailability

### Premium Test

"Will the target user screenshot this screen and send to a friend?" If not — back to revision.

## VII. Engineering Process Principles

These principles govern _how_ product work is implemented and merged. They sit alongside (not above) the product principles in sections I–VI. Their full operational mapping lives in `docs_capsule_zero/project/devops/senar-mapping.md`.

### Supervised Verification

Every product-code PR must name its goal, scope (in/out), acceptance criteria, **at least one negative scenario** (or an explicit waiver), and verification evidence before merge. Evidence means a command, test, screenshot, diff, or linked check tied to a specific acceptance criterion. **An AI-written summary of work done does not substitute for evidence.** The `## Verification` table in `plan.md` is where this binding lives; the SENAR Done Gate in the PR template is where the merge owner confirms it.

### Process Memory

Each feature folder must record what was tried and rejected, what decisions were made and why, and what limitations or follow-ups are accepted. This lives per-feature in `.specify/specs/<feature-id>/tasks.md` under `## Process Memory` (Dead Ends / Decisions / Known Issues). Process memory is written _before_ declaring work complete, not after. Future agents inherit it on read.

### Test-First Verification

Every spec ≥ 025 must follow test-driven development **for application code**. The acceptance criterion from `spec.md` is expressed as an automated test first (Playwright e2e for web, Detox for mobile, `go test` for the Go API). The failing test is committed before the product code that makes it pass. The required GitHub check `test` enforces that the resulting suite is green on the PR head SHA; the SENAR Done Gate row in the PR template binds the TDD evidence to the merge decision. Selectors and assertions follow the conventions in `tests/README.md`. Specs `001` through `024` are grandfathered.

**Scope of the failing-test-first loop.** TDD governs user-visible product behavior — web UI, the React Native app, and Go API behaviors. It does **not** apply to infrastructure and delivery wiring (CI/CD workflows, Dockerfiles, `docker-compose` files, nginx and other service config, deploy and provisioning scripts), to documentation, or to other non-product support changes. Those are still subject to Supervised Verification, but the evidence is appropriate to the layer — config validation (`docker compose config`, `nginx -t`), a smoke or health check against the deployed surface, or a linked successful run — recorded in the `## Verification` table rather than a committed failing test. A spec whose changes are entirely infra/docs/support carries a one-line waiver in `spec.md` and the `test` check does not gate it.

These principles apply to every spec authored after the SENAR layer shipped. Specs `001-capsule-zero-mvp`, `002-pipeline-hardening`, and `003-sprint-0-foundation` are grandfathered and keep their original shape.

**Version**: 1.5 | **Ratified**: 2026-03-17 | **Last Amended**: 2026-07-16

> **v1.5 (2026-07-16)** — Q4 closed (spec 043, landing-hero iteration): §III achromatic principle
> amended to "achromatic base + one gold signal accent (primary CTA / logo accent only)"; §III error
> color re-seated `#FFD600` → `#FF5449` signal red (`#FF7A70` for text on scrim chips) — the CTA/error
> semantic collision recorded in PRODUCT-PLAN D3 is resolved by role separation. Everything else unchanged.

> **v1.4 (2026-07-16)** — product rebuild ([`PRODUCT-PLAN.md`](../../PRODUCT-PLAN.md), canonical for product decisions until MVP):
> §I business model moved to UNDER REVIEW (coins cancelled, model reworked in plan Stage 4); the Canva
> credit-model reference in §III withdrawn; §III achromatic principle flagged with a pending amendment (plan Q4).
> Product principles I–VI are otherwise unchanged, and §VII engineering process is untouched.
