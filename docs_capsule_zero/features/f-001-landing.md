# Feature: Landing Page

> Source: US-001 (spec.md). Prototype: `html-prototypes/index.html`

## Overview
- **Purpose:** Premium first impression that communicates brand positioning and drives registration
- **User:** New visitor (unauthenticated)
- **Entry point:** `/` (root URL)
- **Emotional target:** ATTRACTION — "This is not another clothes app — this is something else"

## User Flow
1. Visitor opens the root URL
2. Full-screen B&W editorial fashion photo loads with manifesto headline
3. Registration button visible in top-right corner
4. Language switcher (EN/RU in v0.1) visible next to registration
5. Visitor clicks Register → auth popup opens (see f-002-auth.md)

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Page loaded | Full-screen hero photo, manifesto headline, Register button, language switcher |
| Loading | Page loading | Skeleton / blank with wall.png background |
| Auth popup | Register clicked | Glassmorphic auth modal overlay (see f-002-auth.md) |

## Acceptance Criteria
1. Full-screen B&W photo with manifesto headline centered, registration button in top-right
2. Language switcher (EN/RU in v0.1) visible next to registration
3. Page load < 2 seconds on 4G
4. Responsive: iPhone 14+ (375px), iPad (768px), Desktop 1280px+
5. Passes the "screenshot test" — premium editorial quality

## Key Components
- **HeroSection** — full-viewport B&W photo with gradient overlay + manifesto text
- **RegisterButton** — glass button, top-right positioning
- **LanguageSwitcher** — EN/RU toggle in v0.1, glass dropdown. ES-AR is deferred to v0.2.

## Edge Cases
- Slow connection → hero image has low-res placeholder, progressive load
- Already authenticated → redirect to Dashboard
- Unsupported language → default to EN

## Related Features
- f-002-auth.md — Auth popup triggered from this page
- f-012-i18n.md — Language switching
