# Feature Spec: Stage 1 Guided Journey

**Feature Branch**: `codex/stage-1-guided-journey`
**Created**: 2026-06-08
**Status**: Local review
**Input**: User description: "Implement the next plan step: Stage 1 Guided Journey, prepare it locally for review, and wait for approval before creating a PR."

## Goal

Authenticated Stage 1 users can enter a localized mock-first guided journey from the dashboard, choose wardrobe type, categories, items, and a compatible capsule palette without any real provider calls.

## Scope

In scope:

- Add `/{locale}/guided-journey` based on `html-prototypes/guided-journey.html`.
- Require the existing mock auth session and redirect unauthenticated users to `/{locale}/auth`.
- Implement Step 1 wardrobe type selection, Step 2 category checklist with quantity steppers and custom category validation, and Step 3 item tabs plus palette picker.
- Use deterministic mock fixtures and local-only client state for photo upload previews, marketplace link candidates, catalog search results, and capsule creation feedback.
- Apply the current group-based palette compatibility rule: achromats always pass, same group passes, and Desaturated/Dark cross-pair passes.
- Expose EN/RU copy only, with no active ES-AR controls.
- Unlock dashboard Add Item / Create First Capsule CTAs now that the guided journey route exists.
- Verify locally before PR creation and stop for user review.

Out of scope:

- Real Supabase persistence, RLS validation, or saved capsule writes.
- Real photo upload, storage, background removal, marketplace parsing, semantic search, or catalog persistence.
- Capsule Result screen implementation; the existing safe future route remains the handoff after mock creation.
- Mobile Flutter implementation.
- PR creation before user approval.

## User Scenarios & Testing

### User Story 1 - Three-Step Capsule Setup (Priority: P1)

As an authenticated user, I want to move through the guided journey so I can define the capsule I want to create.

**Why this priority**: Guided Journey is the core product path after dashboard and unlocks the dashboard's primary creation CTA.

**Independent Test**: Sign in through `/en/auth`, open `/en/guided-journey`, select wardrobe type, select at least eight categories, and reach Step 3.

**Acceptance Scenarios**:

1. **Given** a mock session exists, **When** `/en/guided-journey` loads, **Then** Step 1 displays Women's, Men's, and Mixed wardrobe type cards.
2. **Given** a wardrobe type is selected, **When** the journey advances, **Then** Step 2 shows filtered categories with checkboxes and quantity steppers.
3. **Given** fewer than eight categories are selected, **When** the user tries to continue, **Then** the journey blocks Step 3 and explains the minimum.
4. **Given** at least eight categories are selected, **When** the user continues, **Then** Step 3 renders item tabs and palette controls.

### User Story 2 - Mock Item Acquisition Methods (Priority: P2)

As a Stage 1 reviewer, I want all three item acquisition methods visible and locally interactive so the upload-friction promise can be reviewed without credentials.

**Why this priority**: Three upload methods are a core differentiator and must be present from the first Journey slice.

**Independent Test**: On Step 3, switch between Upload Photos, Paste Links, and Search Catalog, then add at least one local/mock item from each available method.

**Acceptance Scenarios**:

1. **Given** Step 3 is visible, **When** the Upload Photos tab is active, **Then** a local file picker/drop zone accepts JPEG, PNG, and WebP previews only.
2. **Given** a marketplace URL is submitted, **When** it is a supported mock URL, **Then** a parsed local item candidate appears in the added items list.
3. **Given** a catalog result is selected, **When** its color is compatible with the current palette, **Then** it is added as a catalog item.
4. **Given** a catalog result is incompatible with the selected palette, **When** the user selects it, **Then** the item is blocked with an explanation.

### User Story 3 - Group-Based Palette Guardrails (Priority: P3)

As a user, I want unavailable colors to be blocked with a clear explanation so I understand the capsule methodology without feeling forced.

**Why this priority**: The palette method is proprietary product logic and was just aligned to the canonical `pallete-maker` rules.

**Independent Test**: Select a Bright color, verify Pastels and Darks are unavailable while Brights and Achromats remain selectable; then create a Desaturated/Dark compatible selection.

**Acceptance Scenarios**:

1. **Given** no chromatic color is selected, **When** the palette renders, **Then** all colors are available.
2. **Given** a Bright color is selected, **When** palette availability updates, **Then** Brights and Achromats remain available and incompatible groups are disabled.
3. **Given** a Desaturated color is selected, **When** palette availability updates, **Then** Desaturated, Darks, and Achromats remain available.
4. **Given** the user has selected 15 total colors or 12 chromatic colors, **When** they try to add more, **Then** the picker blocks the addition with an explanation.

## Edge Cases

- A user opens `/en/guided-journey` without a mock session.
- A user switches between EN and RU on the journey route.
- A user selects categories, goes back to Step 1, and changes wardrobe type.
- A custom category is too decorative or non-basic.
- RU users add multiple valid Cyrillic custom categories in one journey.
- A user uploads an unsupported file type or file over the local mock limit.
- A marketplace URL is malformed, duplicated, intentionally unparseable, or shares a host with another distinct URL.
- A catalog item color conflicts with the currently selected palette.
- The journey is viewed at 375px, tablet, and desktop widths.

## Negative Scenarios

1. **Given** no mock session exists, **When** `/en/guided-journey` is requested, **Then** the route redirects to `/en/auth`.
2. **Given** ES-AR is deferred to MVP v2, **When** journey language controls render, **Then** only EN and RU are available.
3. **Given** a user selects an incompatible palette color or item color, **When** the action is attempted, **Then** the system blocks it with a methodology explanation instead of silently accepting it.
4. **Given** Stage 1 is mock-first, **When** the journey adds items or creates the capsule preview, **Then** it does not call real Supabase, storage, Photoroom, marketplace, semantic search, or Lava.top providers.
5. **Given** active EN/RU support, **When** a user adds valid Cyrillic custom categories or multiple distinct marketplace URLs from one host, **Then** the journey preserves each distinct local entry instead of collapsing it into a false duplicate.

## Requirements

### Functional Requirements

- **FR-001**: Guided Journey MUST require a mock session and redirect unauthenticated users to `/{locale}/auth`.
- **FR-002**: Guided Journey MUST be reachable from dashboard primary creation CTAs without a 404.
- **FR-003**: Step 1 MUST present Women's, Men's, and Mixed wardrobe type cards and advance after selection.
- **FR-004**: Step 2 MUST render categories filtered by wardrobe type with checkboxes and quantity steppers.
- **FR-005**: Step 2 MUST block Step 3 until at least eight categories are selected.
- **FR-006**: Step 2 MUST support custom category entry and reject non-basic categories with an explanation and suggestion.
- **FR-007**: Step 3 MUST expose Upload Photos, Paste Links, and Search Catalog tabs.
- **FR-008**: Step 3 MUST keep item acquisition local/mock-only and display added item previews.
- **FR-009**: Step 3 MUST render achromatic colors first, followed by all chromatic colors in one continuous picker.
- **FR-010**: Palette selection MUST enforce the current group compatibility matrix, max 15 total colors, and max 12 chromatic colors.
- **FR-011**: Journey copy MUST be localized through next-intl EN/RU messages and MUST not expose ES-AR.
- **FR-012**: Journey UI MUST preserve achromatic glass styling and responsive mobile-first behavior.
- **FR-013**: Mock creation MUST produce a local success/redirect handoff without writing real provider state.

### Key Entities

- **JourneySnapshot**: Serializable server-built setup data containing profile, category options, catalog results, and palette colors.
- **JourneyDraft**: Client-side state for selected wardrobe type, categories, added items, selected colors, validation notes, and mock creation state.
- **PaletteColorOption**: A 51-color-system entry with group, hue, temperature, and achromatic metadata.
- **AddedJourneyItem**: Local/mock item preview sourced from photo upload, marketplace link, or catalog selection.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `/en/guided-journey` redirects to `/en/auth` without a mock session.
- **SC-002**: Valid mock login can reach `/en/guided-journey` from dashboard Add Item or direct route.
- **SC-003**: Step 2 blocks continuation with fewer than eight selected categories and allows Step 3 at eight or more.
- **SC-004**: Upload Photos, Paste Links, and Search Catalog tabs render and can add local/mock item previews.
- **SC-005**: Palette compatibility blocks an incompatible Bright/Pastel or Bright/Dark mix and explains the rule.
- **SC-006**: `/ru/guided-journey` renders Russian journey labels and retains `<html lang="ru">`.
- **SC-007**: Desktop and mobile viewport checks show no obvious overlap or horizontal overflow.
- **SC-008**: `npm run preflight` passes.
- **SC-009**: `git diff --check` passes.
- **SC-010**: `npm run check:feature-memory -- --worktree` passes.
