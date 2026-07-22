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

## Required-Gate Follow-up (2026-07-22)

### Goal

Keep the newly required `osv-scan` merge gate green by removing the two High
npm advisories that appeared after the last successful `main` scan, while
recording the five-check merge contract consistently across repository docs.

### Scope

In scope:

- Override `sharp` to `0.35.0` and `fast-uri` to `3.1.4`, the first fixed
  versions reported by OSV.
- Regenerate only the affected dependency closure in `app/package-lock.json`.
- Require `osv-scan` alongside `baseline-checks`, `guard`, `AI Review`, and
  `test` in the active `main` ruleset and canonical workflow documentation.

Out of scope:

- Application source, UI, or product-behavior changes.
- Suppressing advisories or weakening the scanner to make the gate pass.
- Merging the PR without human approval.

## User Scenarios & Testing

### User Story 1 - Security Scan Passes (Priority: P1)

As a maintainer, I want the OSV scan to pass on the current app lockfile so dependency security status is not blocked by a known fixed dev dependency.

**Why this priority**: The failing scheduled scan is the current blocker and has a small fixed version available.

**Independent Test**: Run dependency verification against the app lockfile and confirm no vulnerability remains.

**Acceptance Scenarios**:

1. **Given** `app/package-lock.json` contains the nested `brace-expansion` entry used by `@typescript-eslint/typescript-estree`, **When** dependency checks run, **Then** the resolved version is `5.0.6`.
2. **Given** the app dependency tree is installed from the lockfile, **When** lint runs, **Then** no dependency-resolution regression is introduced.

### User Story 2 - Required Security Gate Stays Actionable (Priority: P1)

As a maintainer, I want the required OSV gate to block vulnerable dependency
states and return to green after a focused upgrade so branch protection remains
both strict and usable.

**Independent Test**: Run the CI-pinned OSV scanner against the repository and
confirm GitHub reports `osv-scan` success on the current PR head.

**Acceptance Scenarios**:

1. **Given** the lockfile resolves `sharp@0.34.5` and `fast-uri@3.1.3`, **When**
   OSV scans the repository, **Then** it reports GHSA-f88m-g3jw-g9cj and
   GHSA-v2hh-gcrm-f6hx and blocks merge.
2. **Given** the focused overrides and regenerated lockfile, **When** the same
   scan runs, **Then** neither advisory is present and `osv-scan` passes.
3. **Given** a PR targets `main`, **When** its `osv-scan` result fails, is
   missing, or is pending, **Then** the active ruleset keeps the PR blocked.

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
- **FR-004**: `app/package.json` MUST override `sharp` to `0.35.0` and
  `fast-uri` to `3.1.4`.
- **FR-005**: Dependency churn MUST stay within the `sharp` dependency closure
  plus `fast-uri`.
- **FR-006**: The active `main` ruleset MUST require `osv-scan` from the GitHub
  Actions integration.
- **FR-007**: Canonical delivery docs and the PR checklist MUST list
  `osv-scan` with the other required checks.

### Key Entities

- **App lockfile**: `app/package-lock.json`, the authoritative dependency resolution file for the Next.js app.

## Success Criteria

### Measurable Outcomes

- **SC-001**: GitHub OSV scan passes for the PR head.
- **SC-002**: `npm ci --ignore-scripts` succeeds in `app`.
- **SC-003**: `npm run lint` succeeds in `app`.
- **SC-004**: GitHub `osv-scan` passes on the current PR head with no known
  vulnerabilities reported.
- **SC-005**: App typecheck, lint, build, and image-encode smoke verification
  pass after the dependency upgrade.
- **SC-006**: GitHub reports the PR as mergeable with every required check
  green, no unresolved review threads, and no merge conflict.
