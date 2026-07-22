# Feature Specification: Brace Expansion OSV Fix

**Feature Branch**: `codex/fix-brace-expansion-osv`  
**Created**: 2026-06-05  
**Status**: Draft  
**Input**: Fix scheduled OSV failure for `brace-expansion` in `app/package-lock.json`.

## Goal

The scheduled OSV scan no longer reports GHSA-jxxr-4gwj-5jf2 for the web app lockfile.

## Scope

In scope:

- Update the vulnerable nested `brace-expansion` dev dependency resolution in `app/package-lock.json`.
- Keep the change limited to dependency metadata; no application source code, product behavior, or runtime stack decision changes.

Out of scope:

- Changing web app dependencies beyond the vulnerable lockfile entry.
- Adding, removing, or replacing architecture decisions.
- Implementing product screens or Sprint 0 runtime provisioning.

## User Scenarios & Testing

### User Story 1 - Security Scan Passes (Priority: P1)

As a maintainer, I want the OSV scan to pass on the current app lockfile so dependency security status is not blocked by a known fixed dev dependency.

**Why this priority**: The failing scheduled scan is the current blocker and has a small fixed version available.

**Independent Test**: Run dependency verification against the app lockfile and confirm no vulnerability remains.

**Acceptance Scenarios**:

1. **Given** `app/package-lock.json` contains the nested `brace-expansion` entry used by `@typescript-eslint/typescript-estree`, **When** dependency checks run, **Then** the resolved version is `5.0.6`.
2. **Given** the app dependency tree is installed from the lockfile, **When** lint runs, **Then** no dependency-resolution regression is introduced.

### Edge Cases

- The older `brace-expansion@1.x` lockfile entries remain untouched when they are not the OSV finding being fixed.
- The lockfile format must not churn unrelated peer metadata.

## Negative Scenarios

1. **Given** an attempted fix changes app source code or unrelated package metadata, **When** the PR diff is reviewed, **Then** the change is rejected as outside this maintenance scope.

## Requirements

### Functional Requirements

- **FR-001**: The app lockfile MUST resolve the vulnerable nested `brace-expansion` entry to `5.0.6`.
- **FR-002**: The PR MUST avoid unrelated dependency churn outside the OSV fix.
- **FR-003**: The app lockfile MUST remain installable and lint-compatible.

### Key Entities

- **App lockfile**: `app/package-lock.json`, the authoritative dependency resolution file for the Next.js app.

## Success Criteria

### Measurable Outcomes

- **SC-001**: GitHub OSV scan passes for the PR head.
- **SC-002**: `npm ci --ignore-scripts` succeeds in `app`.
- **SC-003**: `npm run lint` succeeds in `app`.
