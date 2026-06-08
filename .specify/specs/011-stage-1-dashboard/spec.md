# Feature Spec: Stage 1 Dashboard

**Feature Branch**: `codex/stage-1-dashboard`
**Created**: 2026-06-08
**Status**: Draft
**Input**: User description: "Implement the next plan step: Stage 1 Dashboard, prepare it locally for review, and wait for approval before creating a PR."

## Goal

Authenticated Stage 1 users can land on a full premium dashboard after mock email/password auth, see their active capsule, OPR, wardrobe stats, shopping opportunities, recent items, and wardrobe section entry points without calling real providers.

## Scope

In scope:

- Replace the minimal dashboard redirect target with a localized dashboard route based on `html-prototypes/dashboard.html`.
- Use deterministic mock provider fixtures for profile, current capsule, wardrobe items, and gap analysis.
- Display filled dashboard state with active capsule hero, palette, OPR, summary stats, shopping list preview, recently added items, and quick-access cards.
- Keep dashboard navigation visible across desktop and mobile, including EN/RU language switching and mock sign-out.
- Keep the implementation under Stage 1 mock-first boundaries with no Supabase, Lava.top, OAuth, marketplace, or image-processing calls.
- Verify locally before PR creation and stop for user review.

Out of scope:

- Real Supabase persistence or RLS-backed sessions.
- Full implementation of destination screens for My Items, Capsules, Favorites, Shopping List, For Sale, For Repair, Profile, or Guided Journey.
- Empty-state onboarding flow beyond safe links to future routes.
- Real outfit generation, paid coin flows, marketplace parsing, semantic search, or photo upload.
- PR creation before user approval.

## User Scenarios & Testing

### User Story 1 - Filled Dashboard Overview (Priority: P1)

As an authenticated user, I want a dashboard showing my current capsule and wardrobe metrics so I immediately understand my wardrobe status after login.

**Why this priority**: Dashboard is the post-auth command center and the next user-facing screen after Stage 1 landing/auth.

**Independent Test**: Sign in through `/en/auth`, land on `/en/dashboard`, and verify the active capsule hero, OPR, palette, stats, shopping list preview, recently added items, and quick-access cards render from mock fixtures.

**Acceptance Scenarios**:

1. **Given** a mock session exists, **When** `/en/dashboard` loads, **Then** the active capsule hero displays capsule name, palette colors, item/outfit/category counts, and OPR.
2. **Given** wardrobe fixtures exist, **When** dashboard renders, **Then** total items, total outfits, uncapsulated count, favorites, for-sale, and for-repair counts are visible.
3. **Given** the active capsule has gap analysis, **When** dashboard renders, **Then** a shopping list preview displays prioritized opportunities with outfit-impact style metadata.

### User Story 2 - Localized Dashboard Shell (Priority: P2)

As an MVP v1 user, I want the dashboard in English or Russian so the post-auth experience matches my selected locale.

**Why this priority**: EN/RU i18n is active from MVP v1 and Stage 1 cannot regress the landing/auth locale scope.

**Independent Test**: Open `/en/dashboard` and `/ru/dashboard` with a mock session and verify visible dashboard copy is localized; language switching preserves the dashboard route.

**Acceptance Scenarios**:

1. **Given** a user is on `/en/dashboard`, **When** they switch to RU, **Then** the URL changes to `/ru/dashboard` and dashboard labels render in Russian.
2. **Given** a user is on `/ru/dashboard`, **When** the page loads, **Then** `<html lang="ru">` remains set by the locale layout.

### User Story 3 - Mock-First Safety (Priority: P3)

As a maintainer, I want dashboard data to come from the existing mock provider boundary so Stage 1 product work cannot accidentally require external credentials.

**Why this priority**: Provider integration remains gated separately; dashboard must continue the accepted mock-first posture.

**Independent Test**: Run local checks and verify dashboard server code creates the provider registry in mock mode and redirects unauthenticated users to localized auth.

**Acceptance Scenarios**:

1. **Given** no mock session exists, **When** `/en/dashboard` loads, **Then** the route redirects to `/en/auth`.
2. **Given** a mock session exists, **When** dashboard data is loaded, **Then** it comes from the mock provider registry and not from Supabase or real provider clients.
3. **Given** the user clicks sign out, **When** the mock session is cleared, **Then** the user returns to the localized landing page.

## Edge Cases

- A user opens `/dashboard` without a locale prefix.
- A user opens `/en/dashboard` without a mock session.
- The active capsule is unavailable in a future fixture state.
- A mock session belongs to a user with no seeded wardrobe or capsule data.
- The dashboard is viewed at 375px, 768px, and desktop widths.
- Long email, capsule, item, or category text must not overflow its glass container.
- The user attempts to expose deferred ES-AR through the language switcher.

## Negative Scenarios

1. **Given** Stage 1 dashboard is mock-first, **When** `CAPSULE_PROVIDER_MODE=supabase` is used, **Then** provider registry rejection remains unchanged and dashboard does not bypass the integration gate.
2. **Given** ES-AR is deferred to MVP v2, **When** dashboard language controls render, **Then** only EN and RU are available.
3. **Given** a mock session has no seeded wardrobe fixtures, **When** dashboard data loads, **Then** it renders user-scoped empty data instead of borrowing another fixture user's capsule or wardrobe.

## Requirements

### Functional Requirements

- **FR-001**: Dashboard MUST require a mock session and redirect unauthenticated users to `/{locale}/auth`.
- **FR-002**: Dashboard MUST load profile, active capsule, wardrobe items, and shopping preview data through the mock provider boundary.
- **FR-003**: Dashboard MUST render active capsule hero with palette dots, item count, outfit count, category count, and OPR.
- **FR-004**: Dashboard MUST render summary stats, shopping list preview, recently added items, quick-access cards, and app navigation.
- **FR-005**: Dashboard MUST provide localized EN/RU labels through next-intl message files.
- **FR-006**: Dashboard MUST not expose ES-AR in active routing or language controls.
- **FR-007**: Dashboard MUST preserve achromatic glass UI styling and approved wallpaper treatment.
- **FR-008**: Dashboard MUST include mock sign-out that clears the session and returns to localized landing.
- **FR-009**: Dashboard MUST remain responsive at mobile, tablet, and desktop breakpoints without overlapping text or controls.
- **FR-010**: Dashboard MUST not route primary CTAs to unimplemented pages; future-slice actions must be guarded until their routes exist.

### Key Entities

- **MockSession**: Cookie-backed Stage 1 session used to authorize dashboard access.
- **DashboardSnapshot**: Derived view model containing profile, capsule, OPR, stats, shopping preview, recent items, quick access, and navigation counts.
- **ActiveCapsule**: Current capsule fixture with immutable palette, category count, item count, outfit count, and OPR.
- **WardrobeEntry**: Mock wardrobe item used for counts and recent-items previews.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en/dashboard` redirects to `/en/auth` when no mock session exists.
- **SC-002**: Valid mock login redirects to `/en/dashboard` and renders full dashboard content.
- **SC-003**: `/ru/dashboard` renders localized dashboard labels and retains `<html lang="ru">`.
- **SC-004**: Dashboard viewport checks at desktop and mobile show no obvious layout overlap.
- **SC-005**: `npm run preflight` passes.
- **SC-006**: `git diff --check` passes.
- **SC-007**: `npm run check:feature-memory -- --worktree` passes.
- **SC-008**: Primary dashboard CTAs do not expose `/guided-journey` links until the route is implemented.
