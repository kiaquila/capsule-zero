# Feature: Registration & Authorization

> Source: US-002, US-003 (spec.md). Prototype: `html-prototypes/auth.html`; live landing popup:
> reusable `AuthPanel` from `LandingPage` (spec 044). `html-prototypes/index.html` is historical.

## Overview

- **Purpose:** Account creation and login with minimal friction
- **User:** New or returning visitor
- **Entry point:** gold hero CTA (temporary sign-up mode) or ghost Log In on landing; `/auth`
  standalone page
- **Emotional target:** TRUST — "Fast, beautiful, they respect my time"
- **Stage 1 scope:** Email/password registration, login, recovery, and session persistence
- **v0.1 addition (spec 037):** Google sign-in — native-flow OIDC via Kratos, button hidden unless the deployment enables the provider
- **Stage 2 scope:** Apple Sign-In; account linking for duplicate emails

## User Flow — Registration

1. User selects the hero CTA (temporary route from landing) or opens the direct auth URL
2. Glassmorphic auth form displayed — Google button first (when enabled), then email+password+confirm fields
3. Credentials only (spec 048): name/country/city are not asked at sign-up — they are edited later on the profile screen and stay optional
4. Real-time inline validation as user types
5. On success → redirect to Dashboard

## User Flow — Login

1. User clicks Login or switches from registration form
2. Same glassmorphic form with login fields
3. "Forgot password" link → email recovery flow
4. On success → auto-redirect to Dashboard
5. Session preserved between visits

## Interface States

| State                 | Description               | What user sees                                     |
| --------------------- | ------------------------- | -------------------------------------------------- |
| Register              | Default registration form | Email, password, confirm-password fields (spec 048) |
| Login                 | Login form                | Email, password fields + "Forgot password"         |
| Validating            | Real-time field check     | Inline validation messages (not popups)            |
| Submitting            | Form submitted            | Disabled button + loading indicator                |
| Error                 | Validation/server error   | Inline error messages (signal red #FF5449 — Q4, 2026-07-16) |
| Success               | Auth complete             | Redirect to Dashboard                              |
| Recovery              | Forgot password           | Email input for password reset                     |
| Social Auth           | Google sign-in (spec 037) | "Continue with Google" leads the form above an "or" divider (spec 048); failed callback lands on /auth with a localized error. Apple stays Stage 2 |

## Acceptance Criteria

1. Stage 1 glassmorphic styling with email+password auth only
2. Real-time inline validation (no alert popups)
3. Optional location field — registration not blocked if skipped
4. Successful registration → redirect to Dashboard
5. Login form with switcher to registration
6. "Forgot password" → email recovery flow
7. Session preserved between visits
8. Adaptive: iPhone 14+, iPad, Desktop 1280px+
9. Google sign-in active when the deployment enables it (spec 037); Apple Sign-In stays Stage 2

## Key Components

- **AuthForm** — glassmorphic container, switches between register/login modes
- **InlineValidation** — real-time field validation, error display
- **Google button** — design-system social surface (rgba(255,255,255,.28)), monochrome G glyph (achromatic rule), inside AuthPanel sign-in/sign-up modes (spec 037); Apple button stays Stage 2

## Edge Cases

- Duplicate email → inline error: "Account already exists"
- OAuth failure → Stage 2 only; fallback message, retry option
- Weak password → inline strength indicator
- Network timeout → retry with message
- Already logged in → redirect to Dashboard

## Related Features

- f-001-landing.md — Auth popup triggered from landing
- f-003-dashboard.md — Redirect destination after auth
- f-004-profile.md — Profile management post-auth
