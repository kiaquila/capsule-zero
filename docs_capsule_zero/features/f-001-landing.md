# Feature: Landing Page

> Source: US-001 (spec.md) + PRODUCT-PLAN Этап 1 (hero, 2026-07-16/17).
> Prototype: `html-prototypes/landing-v2/v1c-final.html` (утверждён фаундером, спека 043).
> Live implementation: спека 044 (`app/src/components/landing/LandingPage.tsx`).

## Overview
- **Purpose:** Premium first impression that communicates the core value (photos → capsule → more outfits) and drives the visitor into the product with one gold CTA
- **User:** New visitor (unauthenticated)
- **Entry point:** `/` (root URL)
- **Emotional target:** ATTRACTION — "This is not another clothes app — this is something else"

## User Flow
1. Visitor opens the root URL
2. First screen = exactly one viewport: gold logo, language switcher + ghost Log In (top-right), centered hero (H1 two lines, subtitle, gold CTA «Попробовать бесплатно» / "Try for free"), scroll cue
3. CTA click → auth popup in **sign-up** mode — *interim route* (founder decision 2026-07-17) until the guest tool ships (PRODUCT-PLAN Q1/Q2/Q3/Q6); then the CTA re-targets to guest onboarding
4. Ghost Log In click → auth popup in sign-in mode (see f-002-auth.md)
5. Scroll → "How it works" stub (content post-MVP), footer (Terms · Privacy · Cookie settings · ©)

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Page loaded | One-viewport hero over wall.png B&W wallpaper, gold CTA, ghost login, language switcher |
| Loading | Page loading | wall.png background + gradient overlay |
| Auth popup (sign-up) | Hero CTA clicked | Glassmorphic auth popup, registration form first |
| Auth popup (sign-in) | Log In clicked | Same popup, sign-in form first |
| Below the fold | Scrolled | "How it works" slides stub (3 dashed cards), footer |

## Acceptance Criteria
1. Hero per `design-system.md` §9.11(d): H1 Helvetica 200 uppercase `clamp(32px, 5.4vw, 60px)` two words per line on desktop, sub 18px/400, CTA pill 56px on `--btn-cta-*`, gold logo 13px/600, ghost login 34px
2. First screen is exactly one viewport — the slides stub never intersects it (e2e negative, `hero.spec.ts`)
3. CTA opens the auth popup in sign-up mode; sign-in form absent (e2e negative)
4. Language switcher (EN/RU in v0.1) visible next to Log In
5. Page load < 2 seconds on 4G; passes the "screenshot test"
6. Responsive: iPhone 14+ (375px), iPad (768px), Desktop 1280px+
7. Decorative scroll-cue does not animate when `prefers-reduced-motion: reduce`

## Key Components
- **LandingPage** — fold (header + hero) + slides stub + footer; reuses `AuthPanel` (popup, `initialMode`), `LanguageSwitcher`, `CookieBanner`
- **Hero CTA** — the single gold signal accent (constitution §III v1.5); never used for statuses/errors
- **Ghost Log In** — transparent 34px pill (`--color-white-a24` border, `--btn-ghost-bg` hover)

## Edge Cases
- Already authenticated → redirect to Dashboard
- Unsupported language → default to EN
- Guest tool not shipped yet → CTA interim route to sign-up popup (recorded in spec 044; re-target in the guest-onboarding slice)

## Related Features
- f-002-auth.md — Auth popup triggered from this page
- f-012-i18n.md — Language switching
