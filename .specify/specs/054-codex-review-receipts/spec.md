# Spec 054 — Native Codex Review Receipts

## Goal

Restore required AI Review validation for authentic native receipts without weakening
reviewer identity, current-head binding, branch rules or workflow permissions.

## Scope

In scope: the existing summary parser, its regression coverage, an owner-labeled
reviewed-SHA recovery path, the canonical review contract/runbook, and direct
installation of the unchanged Go test toolchain after the ECR-quota blocker.
Out of scope: product behavior, review generation, dependency versions, branch-rule
changes, admin overrides, deployment changes and personal maintenance scheduling.

## Acceptance Criteria

- **AC-001**: Accept the exact native v1 receipt prefix before an anchored clean
  `Codex Review:` summary from the trusted bot.
- **AC-002**: Preserve trusted-author, current-head and short-SHA uniqueness checks;
  reject unknown prefixes, anchorless receipts, stale heads and running summaries.
- **AC-003**: Gate recovery requires the owner, a numeric PR, matching full PR-event
  and live PR SHAs, an open same-repository non-draft PR, and the latest native
  full-SHA structured state: completed with both finding flags explicitly false.
- **AC-004**: Normal PR events keep default-branch gate code; recovery keeps the same
  read-only permissions, GitHub-hosted execution and required merge checks.

- **AC-005**: Required API vet/tests run with the exact `api/go.mod` Go version
  directly when setup-go succeeds, retaining a real same-version ECR fallback
  if setup fails. Toolchain switching is disabled and vet failure fails either path.

## Negative Scenarios

Forged authors, stale/malformed SHAs, unknown markers, forked or closed/draft PRs,
non-owner dispatches, missing trusted requests, pre-request receipts and unfinished
reviews must not authorize recovery or satisfy the parser.

## TDD Posture

Infrastructure-only waiver: no application behavior changes. Regression tests execute
the parser and actual workflow authorization script instead of application TDD commits.
