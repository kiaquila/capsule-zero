# Spec 049 — Dependabot Security Remediation

## Goal

Enable GitHub dependency monitoring and automated security updates for every active
dependency ecosystem in the repository, while clearing the current required OSV gate
with the smallest compatible npm transitive-dependency updates.

## Scope

### In

- A `.github/dependabot.yml` entry for every active npm, Go Modules, Docker, Docker
  Compose, and GitHub Actions manifest location.
- Ecosystem-local grouping for minor and patch version updates, with major updates left
  as individual pull requests except PostgreSQL majors, which are ignored until a
  dedicated production-data migration spec ships.
- A GitHub Actions cooldown containing only `default-days`.
- Repository settings for Dependency Graph, Dependabot Alerts, and Dependabot Security
  Updates.
- Patch-level remediation of the npm packages reported by OSV in `app/package-lock.json`
  and `tests/e2e/package-lock.json`, including the matching existing app overrides.

### Out

- Major dependency upgrades, framework migrations, or application behavior changes.
- Suppression or dismissal of actionable vulnerability findings.
- Updates to the frozen Supabase compose stack.

## Acceptance Scenarios

1. Dependabot scans all active manifest directories and groups only minor and patch
   version updates within each ecosystem.
2. Major version updates do not match a group and therefore remain separate pull
   requests, except `postgres` majors in the Docker Compose ecosystem, which are
   ignored until the PostgreSQL 16 production data has a tested migration procedure.
3. The repository Dependency Graph is available, Dependabot Alerts are enabled, and
   Dependabot Security Updates are enabled.
4. OSV Scanner v2.3.5 reports no vulnerabilities for the repository after the narrow
   npm remediation.
5. Clean npm installs, repository validation, app validation, and end-to-end tests pass.

## Negative Scenarios

- `docker-compose.legacy-supabase.yml` is excluded so version updates cannot extend the
  retired Supabase stack.
- PostgreSQL minor and patch updates remain enabled; only semver-major updates are
  ignored, so routine v0.1 security and maintenance updates are not suppressed.
- No vulnerability is hidden through an OSV ignore entry or an audit suppression.
- No dependency outside the OSV-reported transitive set is upgraded as part of the
  remediation.

TDD posture: this change updates repository automation and dependency metadata without
changing application behavior. The infrastructure/support-change waiver applies; the
failing required OSV run is the security regression signal, and the same scanner version
plus the full project verification chain provides the passing evidence.
