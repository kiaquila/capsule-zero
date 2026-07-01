# Feature Spec: Product Wallpaper Background

**Feature Branch**: `codex/product-wallpaper-background`
**Created**: 2026-06-07
**Status**: Draft
**Input**: User description: "Integrate the visually approved wallpaper background into the product through a clean PR, without merging the old experiment branch or carrying experiment-only files."

## Goal

Capsule Zero product surfaces can resolve the approved wallpaper background through the existing `wall.png` references in the Next app and approved HTML prototypes.

## Scope

In scope:

- Add the approved PNG asset to `app/public/wall.png` for the Next app.
- Add the same approved PNG asset to `html-prototypes/wall.png` for approved prototype review.
- Preserve the existing auth and dashboard layout/CSS behavior.
- Keep the PR free of experiment-only preview files.

Out of scope:

- Changing auth or dashboard layout, spacing, glass tokens, overlays, or interaction behavior.
- Merging or copying from `codex/wallpaper-bg-experiment`.
- Adding `auth-wallpaper.html`, `dashboard-wallpaper.html`, or `wallpaper-preview.html`.
- Reworking broader product screens or documentation beyond required feature memory.

## User Scenarios & Testing

### User Story 1 - Next asset resolves (Priority: P1)

As a web implementer, I want `/wall.png` to resolve from the Next public directory so product code that references the wallpaper can render without missing-asset failures.

**Independent Test**: Start the Next dev server and request `http://127.0.0.1:3000/wall.png`.

**Acceptance Scenarios**:

1. **Given** the Next app is running, **When** `/wall.png` is requested, **Then** the response is HTTP 200 with PNG content.

### User Story 2 - Prototype wallpaper resolves (Priority: P1)

As a product reviewer, I want the approved auth and dashboard prototypes to load the wallpaper through their existing `wall.png` background references.

**Independent Test**: Serve `html-prototypes/` locally and open `auth.html` and `dashboard.html`.

**Acceptance Scenarios**:

1. **Given** `html-prototypes/auth.html` is opened locally, **When** the page renders, **Then** `.hero-bg` resolves to `wall.png`.
2. **Given** `html-prototypes/dashboard.html` is opened locally, **When** the page renders, **Then** `.hero-bg` resolves to `wall.png`.

### User Story 3 - Clean product integration (Priority: P2)

As a reviewer, I want this PR to contain only the approved asset integration so the old experiment does not enter the product history.

**Independent Test**: Inspect the git diff and search for experiment-only files.

**Acceptance Scenarios**:

1. **Given** the PR diff is inspected, **When** changed files are listed, **Then** only the two `wall.png` assets and this feature memory are present.
2. **Given** experiment-only filenames are searched, **When** the repository diff is inspected, **Then** `auth-wallpaper.html`, `dashboard-wallpaper.html`, and `wallpaper-preview.html` are absent.

## Negative Scenarios

1. **Given** the approved asset is integrated, **When** the PR is reviewed, **Then** no layout changes are present in auth or dashboard files.
2. **Given** the old wallpaper experiment exists as historical context, **When** this branch is created, **Then** it starts from current `origin/main`, not from `codex/wallpaper-bg-experiment`.

## Requirements

### Functional Requirements

- **FR-001**: The Next app MUST include the approved wallpaper at `app/public/wall.png`.
- **FR-002**: The HTML prototypes MUST include the approved wallpaper at `html-prototypes/wall.png`.
- **FR-003**: Both `wall.png` copies MUST be byte-identical.
- **FR-004**: The PR MUST NOT modify auth/dashboard layout files.
- **FR-005**: The PR MUST NOT include experiment-only wallpaper preview files.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `curl -fsSI http://127.0.0.1:3000/wall.png` returns HTTP 200.
- **SC-002**: Browser verification confirms `auth.html` resolves `.hero-bg` to `wall.png`.
- **SC-003**: Browser verification confirms `dashboard.html` resolves `.hero-bg` to `wall.png`.
- **SC-004**: `npm run lint` passes.
- **SC-005**: `npm run build` passes.
- **SC-006**: `npm run check:feature-memory -- --worktree` passes for this product-path change.
