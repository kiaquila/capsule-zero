# Feature Specification: Stage 1 Profile

**Feature Branch**: `codex/stage-1-profile`
**Created**: 2026-06-14
**Status**: Draft for Implementation
**Input**: User description: "Execute Stage 1 Profile. No shortcuts: everything in the prototype must be implemented. Prepare for local review before PR creation."

## Goal _(mandatory)_

Authenticated users can view and manage their profile, preferences, account settings, security mock controls, sessions, and language from the approved Stage 1 Profile prototype.

## Scope _(mandatory)_

In scope:

- `/{locale}/profile` authenticated route.
- Profile header with avatar initials/photo preview, local remove-photo control, username display, and avatar validation.
- Personal information form with first name, last name, username, email, phone, date of birth, country, city, shoe size, top size, bottom size, and Save.
- Notifications, login method, two-factor, password, account ID, active sessions, logout, and delete-account prototype surfaces.
- Locale switching through the top-right `LanguageSwitcher`; next-intl stores the selected locale in `NEXT_LOCALE`.
- EN/RU messages only; ES-AR remains inactive for MVP v1.
- Local/mock persistence for profile form fields that are not yet provider-backed.

Out of scope:

- Real Supabase profile persistence beyond the Stage 1 mock provider boundary.
- Real SMS, 2FA, password change, session revocation, delete-account, notification delivery, or avatar storage provider integrations.
- ES-AR routing, controls, generated clients, or profile language enum changes.
- Real username uniqueness lookup; Stage 1 uses a server-side validation stub until the follow-up backend PR.
- Mobile native profile implementation.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Review Profile and Account Context (Priority: P1)

An authenticated user opens Profile and sees the full approved profile/settings surface.

**Why this priority**: Profile is the remaining Stage 1 screen and the entry point for user trust, avatar, language, and account settings.

**Independent Test**: Log in with the mock session and open `/en/profile`; the page shows the profile header, personal information, notifications, login/security, account management, sessions, logout, and delete-account sections.

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** the user visits `/en/profile`, **Then** the Profile screen renders instead of redirecting to dashboard.
2. **Given** the Profile screen, **When** it renders, **Then** every prototype section is visible with profile context and navigation.

---

### User Story 2 - Maintain Profile Basics and Avatar (Priority: P1)

The user can edit profile basics, preview an avatar, remove an avatar, and save the local Stage 1 profile state.

**Why this priority**: US-005 requires default avatar assignment, avatar upload/replace/delete, and profile display.

**Independent Test**: Upload a supported local image, remove it, edit profile basics including username, save, and observe updated header/nav initials plus username feedback.

**Acceptance Scenarios**:

1. **Given** the profile header, **When** no custom avatar is present, **Then** initials are displayed as the default avatar.
2. **Given** a JPEG/PNG avatar file, **When** the user chooses it, **Then** a circular cropped preview appears in the profile header and sidebar avatar.
3. **Given** a custom avatar preview, **When** the user removes it, **Then** the avatar reverts to initials.
4. **Given** valid profile basics, **When** the user saves, **Then** the screen updates locally and shows success feedback.
5. **Given** a username already reserved by the Stage 1 server stub, **When** the user saves, **Then** the username field shows a uniqueness validation error.

---

### User Story 3 - Manage Language and Mock Account Controls (Priority: P1)

The user can switch EN/RU, adjust prototype toggles/radios, validate login method prerequisites, and use logout without ES-AR exposure.

**Why this priority**: US-018 requires profile language switching and persistence, and the prototype includes account/security controls that must not be inert.

**Independent Test**: Switch EN/RU from Profile, toggle notification/2FA controls, select SMS with an empty phone to see inline warning, and log out.

**Acceptance Scenarios**:

1. **Given** the top-right language control, **When** the user selects RU or EN, **Then** the route and UI switch to that locale and next-intl stores `NEXT_LOCALE`.
2. **Given** language options, **When** the menu is open, **Then** only EN and RU are available and no duplicate language field is shown inside the Profile form.
3. **Given** SMS login is selected without a phone number, **When** validation runs, **Then** an inline yellow warning explains that a phone number is required.
4. **Given** logout is clicked, **When** the action completes, **Then** the mock session clears and the user returns to localized landing.

### Edge Cases

- Unsupported avatar file types are rejected with inline yellow validation.
- Avatar files over 10 MB are rejected before preview creation.
- Empty first or last name prevents save and shows inline validation.
- Empty email or invalid email prevents save and shows inline validation.
- Invalid usernames are rejected on the client; reserved/taken usernames are rejected by the Stage 1 server stub.
- Delete Account remains a design-only destructive mock state and does not delete data.

## Negative Scenarios _(mandatory — required by SENAR; waive explicitly if none apply)_

1. **Given** no authenticated mock session, **When** `/en/profile` is requested, **Then** the route redirects to `/en/auth` instead of exposing profile data.
2. **Given** an unsupported avatar file type, **When** a user attempts to preview it, **Then** no avatar is set and an inline validation error is shown.
3. **Given** SMS login method is selected with an empty phone field, **When** the user saves or changes the login method, **Then** the warning is shown and no silent SMS setting is accepted.
4. **Given** a username marked as unavailable by the server stub, **When** the user saves, **Then** the response is mapped to the username field and the header remains unchanged.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST expose `/{locale}/profile` for authenticated users.
- **FR-002**: System MUST redirect unauthenticated users to localized auth.
- **FR-003**: System MUST remove `profile` from future dashboard redirect routes.
- **FR-004**: System MUST render every major section from `html-prototypes/profile.html`.
- **FR-005**: System MUST show default initials when no custom avatar preview exists.
- **FR-006**: Users MUST be able to choose JPEG or PNG avatar previews, see the current preview in profile and navigation avatars, and remove them locally.
- **FR-007**: System MUST reject unsupported avatar file types and files over 10 MB with inline yellow validation.
- **FR-008**: Users MUST be able to edit and save personal information fields locally.
- **FR-009**: System MUST validate required name/email/username fields before save.
- **FR-010**: Users MUST be able to toggle notification and 2FA controls locally.
- **FR-011**: Users MUST be able to select preferred login method and see prerequisite warnings; SMS must require a phone number on both client and server action paths.
- **FR-012**: System MUST render active sessions and current-session label from the prototype.
- **FR-013**: Users MUST be able to log out through the Profile screen.
- **FR-014**: System MUST provide EN and RU messages with no active ES-AR controls.
- **FR-015**: System MUST keep all profile/account containers on glass surfaces and avoid opaque UI panels.
- **FR-016**: System MUST display username, not email, in the Profile header.
- **FR-017**: System MUST keep Profile language selection out of the form and use the top-right language switcher/cookie flow.
- **FR-018**: System MUST keep Delete Account outside the form, small, and grey.

### Key Entities

- **Profile Snapshot**: Server-built Stage 1 view model containing profile, session, preferences, navigation counts, active sessions, and select options.
- **Avatar Preview**: Client-local image object URL rendered as a circular crop in the profile header and sidebar avatar until removed or the page reloads.
- **Mock Profile Preferences**: Client/server Stage 1 fields for notification, security, size, and contact controls that do not yet map to a real provider schema.
- **Username Validation Stub**: Server-side Stage 1 placeholder that rejects reserved/taken usernames until a follow-up provider-backed uniqueness PR.
- **Active Session**: Static Stage 1 session display matching the prototype's current device list.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Profile page renders successfully in EN and RU for authenticated mock users.
- **SC-002**: Profile shows zero ES-AR active route or switcher controls.
- **SC-003**: Avatar preview, remove, validation, save, login method warning, toggles, logout, and mobile More sheet are manually verifiable in a browser.
- **SC-004**: Local checks pass: JSON parse, feature memory, lint, typecheck, build, and preflight.
