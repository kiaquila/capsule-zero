# Feature: Registration & Authorization

> Source: US-002, US-003 (spec.md). Prototype: `html-prototypes/auth.html`, `html-prototypes/index.html` (popup)

## Overview

- **Purpose:** Account creation and login with minimal friction
- **User:** New or returning visitor
- **Entry point:** Register button on landing, `/auth` standalone page
- **Emotional target:** TRUST — "Fast, beautiful, they respect my time"
- **Stage 1 scope:** Email/password registration, login, recovery, and session persistence
- **Stage 2 scope:** Google OAuth and Apple Sign-In

## User Flow — Registration

1. User clicks Register (from landing or direct URL)
2. Glassmorphic auth form displayed with email+password fields
3. Optional location field (country/city) — skippable, does not block registration
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
| Register              | Default registration form | Email, password, name fields                       |
| Login                 | Login form                | Email, password fields + "Forgot password"         |
| Validating            | Real-time field check     | Inline validation messages (not popups)            |
| Submitting            | Form submitted            | Disabled button + loading indicator                |
| Error                 | Validation/server error   | Inline error messages (yellow #FFD600)             |
| Success               | Auth complete             | Redirect to Dashboard                              |
| Recovery              | Forgot password           | Email input for password reset                     |
| Social Auth (Stage 2) | Deferred OAuth variant    | Google and Apple buttons plus OAuth callback state |

## Acceptance Criteria

1. Stage 1 glassmorphic styling with email+password auth only
2. Real-time inline validation (no alert popups)
3. Optional location field — registration not blocked if skipped
4. Successful registration → redirect to Dashboard
5. Login form with switcher to registration
6. "Forgot password" → email recovery flow
7. Session preserved between visits
8. Adaptive: iPhone 14+, iPad, Desktop 1280px+
9. Google OAuth and Apple Sign-In are not active in Stage 1

## Key Components

- **AuthForm** — glassmorphic container, switches between register/login modes
- **InlineValidation** — real-time field validation, error display
- **SocialAuthButtons** — Stage 2 component for Google + Apple OAuth buttons (glass style)

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
