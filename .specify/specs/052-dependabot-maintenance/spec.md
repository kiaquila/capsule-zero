# Spec 052 — Dependabot Maintenance

## Goal

Keep automated dependency updates mergeable without weakening repository security,
quality, review, or documentation gates.

## Scope

### In

- Validate Dependabot updates against the repository's required checks.
- Refresh transitive lockfile entries when an update exposes a fixed vulnerability.
- Record verification evidence for each dependency-only PR handled under this spec.

### Out

- Product behavior, UI, API, schema, infrastructure, or architecture changes.
- New Supabase integration or expansion of the frozen legacy provider.
- Advisory suppression, branch-protection bypasses, or fabricated review evidence.

## Acceptance Criteria

- **AC-001**: Package manifests and lockfiles remain internally consistent and install
  with the repository-pinned npm version.
- **AC-002**: Repository lint, type, build, test, guard, security, and AI Review gates
  pass for the final PR head where they apply.
- **AC-003**: Fixed transitive dependency releases replace vulnerable versions instead
  of suppressing their advisories.
- **AC-004**: Dependency-only changes do not alter application behavior or extend the
  frozen Supabase provider.

## Negative Scenarios

- A dependency PR must not merge while a required check is failing or a blocking
  review thread is unresolved.
- A security finding must not be hidden through an OSV ignore entry.
- A no-fix advisory may use only an exact package/version exception with documented
  reachability, a short review date, and fresh evidence that no patched release exists.

## TDD Posture

Waiver: dependency manifests, generated lockfiles, and process memory are maintenance
artifacts and introduce no application behavior, so the failing-test-first loop does
not apply. Existing repository checks provide regression coverage.

## Sequence Coverage

- PR #145: grouped npm minor/patch maintenance plus fixed transitive security releases.
- PR #146: app development types remain on `@types/node` 22.20.1 because production
  and required CI still execute Node 22; Node 26 declarations remain deferred. Current
  fixable app advisories move to patched releases, while the no-fix dev-only `braces`
  advisory receives an exact, expiring exception.
- PR #147: app ESLint remains on 9.39.4 because the resolved Next lint plugin graph
  still rejects ESLint 10.11.0 during clean npm 10 resolution.
