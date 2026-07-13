# Feature Spec: Pipeline Hardening

## Goal

Bring Capsule Zero CI and pull-request gates closer to the Unicorn Hub reference while preserving the PR-only delivery model.

## Scope

- Make `baseline-checks` the required job that proves repository baseline, app typecheck, app build, and optional tests.
- Enforce complete feature memory for product code changes under `app/`.
- Run required gate scripts from trusted default-branch code when available.
- Add OSV dependency scanning as a pull-request security signal.
- Update vulnerable app dependencies needed for the new security scan to start from a clean baseline.
- Keep the app Next.js baseline on a patched release when OSV identifies fixable advisories.

## Acceptance Criteria

- `npm run preflight` succeeds locally.
- `guard` passes for infrastructure-only changes and blocks `app/` product changes without `.specify/specs/<feature-id>/{spec,plan,tasks}.md`.
- `osv-scan` is present and configured for pull requests, `main`, weekly schedule, and manual dispatch.
- `osv-scan` reports no known Next.js vulnerabilities for the committed app lockfile.
