# Feature Spec: Stage 1 Landing and Auth

**Feature Branch**: `codex/stage-1-landing-auth`
**Created**: 2026-06-07
**Status**: Draft
**Input**: User description: "Implement the next plan step: landing + email/password auth in mock-first mode, include docs cleanup, open locally in Chrome for review before preparing the PR."

## Goal

Stage 1 visitors can experience the approved premium landing page, switch language, register or log in with email/password through deterministic mock auth, and land on a session-preserving dashboard target without activating real providers.

## Scope

In scope:

- Implement locale-aware landing route using `html-prototypes/index.html`, `app/public/wall.png`, and `docs_capsule_zero/i18n/ui-texts.md`.
- Implement standalone auth route and landing auth popup using `html-prototypes/auth.html`.
- Add minimal `next-intl` routing and messages for active MVP v1 locales `en` and `ru`.
- Keep the app dependency lockfile valid for CI clean installs after adding `next-intl`.
- Add React Hook Form + Zod realtime validation for login, registration, and recovery.
- Use mock provider auth through server actions and a mock session cookie.
- Add a minimal dashboard redirect target so successful auth does not lead to a dead route.
- Update Sprint 0/frontend docs for the completed payload-client and current dependency baseline.

Out of scope:

- Real Supabase Auth, RLS-backed sessions, Google OAuth, Apple Sign-In, or provider dashboard setup.
- Full dashboard implementation from `f-003-dashboard`.
- Production account recovery email delivery.
- Payment, upload, wardrobe, capsule, catalog, or marketplace feature work.

## User Scenarios & Testing

### User Story 1 - Premium Landing Entry (Priority: P1)

As a new visitor, I want to see the approved editorial landing page with a language switcher and auth entry point so Capsule Zero immediately feels premium and understandable.

**Why this priority**: Landing is the first user-facing Phase 5 screen and the entry point for Stage 1 auth.

**Independent Test**: Open `/en` and `/ru` locally in Chrome and verify the wallpaper, manifesto, language switcher, auth CTA, footer, and cookie banner render without layout overlap.

**Acceptance Scenarios**:

1. **Given** a visitor opens the landing route, **When** the page loads, **Then** the approved wallpaper background, manifesto headline/subtitle, language switcher, auth CTA, footer, and cookie banner are visible.
2. **Given** a visitor changes language, **When** they select EN or RU, **Then** landing/auth UI text changes through locale routing without a full browser reload.

### User Story 2 - Stage 1 Email Auth (Priority: P2)

As a visitor, I want login, registration, and password recovery to validate inline so I can start without social-provider setup.

**Why this priority**: Email/password auth is the accepted Stage 1 auth scope; OAuth is deferred.

**Independent Test**: Open `/en/auth`, submit invalid and valid forms, and verify inline errors, recovery confirmation, and successful redirect to dashboard.

**Acceptance Scenarios**:

1. **Given** the auth form is visible, **When** invalid email, weak password, or mismatched password is entered, **Then** yellow inline validation appears without alert popups.
2. **Given** valid login or registration data, **When** the user submits the form, **Then** mock auth creates a session cookie and redirects to the dashboard target.
3. **Given** the user clicks forgot password, **When** they submit a valid email, **Then** the mock recovery flow confirms email delivery inline.

### User Story 3 - Mock-First Session Boundary (Priority: P3)

As a maintainer, I want auth to use the existing provider boundary and remain blocked from real Supabase mode so Stage 1 cannot accidentally call external services.

**Why this priority**: Mock-first safety is the condition that allows product UI to move before provider registration.

**Independent Test**: Run local checks and verify `CAPSULE_PROVIDER_MODE=supabase` remains rejected by the provider registry while auth server actions default to mock mode.

**Acceptance Scenarios**:

1. **Given** Stage 1 auth runs locally, **When** the server action creates a provider registry, **Then** it uses deterministic mock auth and does not require provider credentials.
2. **Given** a dashboard route is opened after successful auth, **When** the mock session cookie exists, **Then** the dashboard target recognizes the preserved session.

### Edge Cases

- A visitor opens `/` or `/auth` without a locale prefix.
- A visitor uses unsupported locale input.
- A visitor closes the landing auth popup and reopens it.
- Cookie banner has already been accepted in browser storage.
- Optional name/country/city fields are skipped during registration.
- A visitor attempts to open deferred Spanish route `/es-AR`.

## Negative Scenarios

1. **Given** Stage 1 auth is in scope, **When** a user looks for Google OAuth or Apple Sign-In actions, **Then** no active OAuth buttons are rendered.
2. **Given** invalid auth form input, **When** the user submits, **Then** the app rejects the submission inline and does not create a mock session cookie.

## Requirements

### Functional Requirements

- **FR-001**: The app MUST route landing and auth pages through active MVP v1 locales `en` and `ru`.
- **FR-002**: The landing page MUST use the approved wallpaper background and glass/achromatic interface tokens.
- **FR-003**: The language switcher MUST expose EN and RU and preserve the current route while switching locale.
- **FR-004**: The auth UI MUST support login, registration, and password recovery with realtime inline validation.
- **FR-005**: The auth UI MUST not render active Google or Apple OAuth controls in Stage 1.
- **FR-006**: Successful login or registration MUST create a deterministic mock session and route to the dashboard target.
- **FR-007**: The dashboard target MUST avoid a dead redirect after auth and allow mock sign-out.
- **FR-008**: User-facing landing/auth text MUST come from message files seeded from `docs_capsule_zero/i18n/ui-texts.md`.
- **FR-009**: Docs cleanup MUST mark the completed payload-client follow-up and reflect the current frontend dependency baseline.
- **FR-010**: The app package lock MUST remain compatible with CI `npm ci --prefix app` after the i18n dependency is added.

### Key Entities

- **Locale**: One of `en` or `ru`, used for route prefixes and message selection. `es-AR` is deferred globally to MVP v2.
- **AuthForm**: Login, registration, or recovery form state with email/password validation.
- **MockSession**: Cookie-backed representation of the deterministic Stage 1 provider session.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en` and `/ru` render localized landing content locally; `/es-AR` is not an active MVP v1 locale.
- **SC-002**: `/en/auth` rejects invalid email/password input inline and accepts valid login/register input.
- **SC-003**: Successful mock login/register redirects to `/en/dashboard` without a 404.
- **SC-004**: `npm run preflight` passes.
- **SC-005**: Local Chrome smoke check shows no obvious desktop/mobile layout overlap before PR prep.
- **SC-006**: CI-equivalent app dependency installation succeeds with npm 10.
