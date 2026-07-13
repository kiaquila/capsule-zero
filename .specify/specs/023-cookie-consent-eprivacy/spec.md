# Feature Specification: Cookie Consent ePrivacy Flow

**Feature Branch**: `claude/cookie-consent-eprivacy`
**Created**: 2026-06-26
**Status**: Ready for PR Verification
**Input**: User description: "Make the landing cookie consent flow ePrivacy / GDPR / CNIL compliant, with refusal as easy as acceptance, category preferences, GPC support, and a reopenable settings entry point."

## Goal _(mandatory)_

Capsule Zero visitors can make, persist, revisit, and withdraw cookie consent choices through a premium glassmorphism banner that gives Accept all, Reject all, and Customize actions equal prominence and prevents non-essential cookie categories from being treated as accepted until the user explicitly chooses them.

## Scope _(mandatory)_

In scope:

- Replace the previous single-action cookie banner with a three-action summary: Accept all, Reject all, and Customize.
- Add a cookie preferences panel with Strictly necessary, Preferences, Analytics, and Marketing categories.
- Keep Strictly necessary locked on and default all non-essential categories off.
- Persist structured consent preferences in localStorage under a typed Capsule Zero key.
- Expose a `useCookieConsent()` hook so future analytics or marketing integrations can check category consent before initialization.
- Honor `navigator.globalPrivacyControl === true` by keeping Analytics and Marketing off by default and surfacing a user-visible GPC note.
- Add a landing footer "Cookie settings" control that reopens the customize panel after the initial choice.
- Add EN and RU UI strings only, keeping ES-AR deferred to MVP v2.

Out of scope:

- Adding real analytics, performance, advertising, or marketing SDKs.
- Persisting consent preferences to the backend or user profile.
- Creating a standalone Cookie Policy route.
- Changing active locale routing beyond the existing EN/RU scope.
- Changing legal document content or legal route placement from the already merged legal pages work.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Choose Consent From the Summary Banner (Priority: P1)

A first-time visitor can accept all cookies, reject all non-essential cookies, or open detailed preferences from the same cookie banner without one choice being visually buried.

**Why this priority**: Refusal must be as easy as acceptance for ePrivacy / GDPR / CNIL-aligned consent, and the first consent surface is the highest-risk compliance point.

**Independent Test**: Open `/en`, clear `capsule_zero_cookie_consent` from localStorage, and confirm the banner renders Accept all, Reject all, and Customize buttons with persisted structured choices after either direct action.

**Acceptance Scenarios**:

1. **Given** no consent object exists, **When** the landing page loads, **Then** the cookie banner appears with Accept all, Reject all, and Customize visible.
2. **Given** the visitor clicks Accept all, **When** the choice is saved, **Then** necessary, preferences, analytics, and marketing are true and `decidedAt` is populated.
3. **Given** the visitor clicks Reject all, **When** the choice is saved, **Then** necessary remains true while preferences, analytics, and marketing are false.

---

### User Story 2 - Customize and Reopen Cookie Preferences (Priority: P1)

A visitor can inspect each cookie category, save only selected non-essential categories, and later reopen settings from the landing footer.

**Why this priority**: Consent is not durable unless users can understand categories and change choices after the banner disappears.

**Independent Test**: Click Customize, toggle Preferences / Analytics / Marketing, save preferences, reload, then click footer Cookie settings and verify the panel reopens with the saved values.

**Acceptance Scenarios**:

1. **Given** the customize panel is open, **When** categories render, **Then** Strictly necessary is locked on and all non-essential categories are individually toggleable.
2. **Given** the visitor saves a subset of categories, **When** the page reloads, **Then** the structured localStorage object preserves the selected booleans and the banner stays dismissed.
3. **Given** the visitor has already decided, **When** they click Cookie settings in the footer, **Then** the customize panel reopens with the current preferences.

---

### User Story 3 - Respect Global Privacy Control (Priority: P2)

A visitor with Global Privacy Control enabled sees the consent UI acknowledge that signal and keep analytics and marketing off unless the user changes preferences.

**Why this priority**: GPC handling reduces privacy risk in jurisdictions and browser environments where the signal is expected to be honored.

**Independent Test**: Define `navigator.globalPrivacyControl` as true before loading `/en`, then confirm the GPC note appears and analytics / marketing start false in the draft preferences.

**Acceptance Scenarios**:

1. **Given** `navigator.globalPrivacyControl === true`, **When** the banner renders, **Then** a GPC note is visible in the summary and customize views.
2. **Given** GPC is active, **When** the visitor opens Customize before saving, **Then** Analytics and Marketing are off by default.
3. **Given** future code uses `useCookieConsent().hasConsent("analytics")`, **When** analytics consent is false, **Then** the hook reports false without requiring callers to parse localStorage directly.

## Negative Scenarios _(mandatory - required by SENAR; waive explicitly if none apply)_

1. **Given** no explicit non-essential consent has been saved, **When** app code reads cookie consent state, **Then** Preferences, Analytics, and Marketing must not default to true.
2. **Given** localStorage contains the legacy boolean-string format, malformed JSON, or a parseable object with an empty or invalid `decidedAt`, **When** the hook reads consent state, **Then** the app must treat consent as undecided and return safe defaults instead of crashing or granting non-essential consent.
3. **Given** ES-AR is deferred to MVP v2, **When** cookie UI strings are updated, **Then** no ES-AR active route, switcher option, enum, or message surface is introduced.
4. **Given** legal page styles are already present on `origin/main`, **When** this PR is merged with current main, **Then** global CSS must not duplicate legal document style blocks or regress nav glass token usage.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The landing cookie banner MUST expose Accept all, Reject all, and Customize as direct actions.
- **FR-002**: The Accept all action MUST persist all four categories as true, with Strictly necessary always true.
- **FR-003**: The Reject all action MUST persist only Strictly necessary as true and all non-essential categories as false.
- **FR-004**: The Customize panel MUST render Strictly necessary, Preferences, Analytics, and Marketing categories with descriptions.
- **FR-005**: Strictly necessary MUST be locked on and unavailable for user disablement.
- **FR-006**: Preferences, Analytics, and Marketing MUST default false before explicit opt-in.
- **FR-007**: Consent MUST be stored as a structured object containing `necessary`, `preferences`, `analytics`, `marketing`, and `decidedAt`.
- **FR-008**: The consent reader MUST tolerate missing, malformed, or legacy localStorage values without granting non-essential consent.
- **FR-009**: Global Privacy Control detection MUST show a GPC notice and keep Analytics / Marketing off by default.
- **FR-010**: `useCookieConsent()` MUST expose `decided`, `gpc`, `preferences`, and `hasConsent(category)` as the single frontend read path for future integrations.
- **FR-011**: The landing footer MUST provide a Cookie settings control that reopens the preferences panel.
- **FR-012**: Cookie consent copy MUST be available in EN and RU only for MVP v1.
- **FR-013**: Styling MUST remain achromatic, glass-based, and consistent with the existing auth / language popup surfaces.

### Key Entities

- **Cookie Consent Preferences**: The persisted localStorage object with category booleans and an ISO `decidedAt` timestamp.
- **Cookie Category**: One of Strictly necessary, Preferences, Analytics, or Marketing.
- **Consent Hook**: `useCookieConsent()`, the frontend subscription and category-check API.
- **Cookie Settings Event**: A browser event that lets the landing footer reopen the preferences panel without prop drilling.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Local lint, typecheck, and build pass after the PR is updated onto current `origin/main`.
- **SC-002**: Feature-memory guard passes with `.specify/specs/023-cookie-consent-eprivacy/{spec,plan,tasks}.md` in the PR diff.
- **SC-003**: Static inspection confirms no active ES-AR strings or routes are introduced by this cookie consent work.
- **SC-004**: Source inspection confirms malformed / legacy consent storage cannot grant non-essential categories.
- **SC-005**: GitHub `baseline-checks`, `guard`, and `osv-scan` are green before merge readiness.
