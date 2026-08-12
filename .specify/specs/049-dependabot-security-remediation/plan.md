# Plan 049 — Dependabot Security Remediation

## Approach

Inventory tracked manifests from the current `origin/main`, configure each supported
ecosystem at its actual directory, and keep update policy explicit per ecosystem. Apply
only compatible patched versions for packages named by the required OSV run. Preserve
existing direct dependency ranges and update only the existing security overrides and
the corresponding lockfile records.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Dependabot covers every active ecosystem and directory | Ruby YAML parse and semantic assertions for npm (`/`, `/app`, `/tests/e2e`), gomod (`/api`), Docker (`/api`, `/app`), Docker Compose (`/`), and GitHub Actions (`/`) |
| 2 | Minor/patch updates are grouped and majors remain separate | Semantic assertion that every group contains exactly `minor` and `patch`; no `major` group rule exists |
| 3 | GitHub Actions cooldown uses only `default-days` | Semantic assertion that only the GitHub Actions entry has `cooldown: { default-days: 7 }` |
| 4 | GitHub dependency security features are enabled | GitHub API checks for the vulnerability-alerts and automated-security-fixes endpoints; dependency graph SBOM retrieval |
| 5 | Vulnerability remediation is complete without suppression | `go run github.com/google/osv-scanner/v2/cmd/osv-scanner@v2.3.5 --recursive .` returns `No issues found`; `npm audit --json` returns zero vulnerabilities in `/`, `/app`, and `/tests/e2e` |
| 6 | Dependency metadata remains installable and the application is unchanged behaviorally | Clean `npm ci` in `/`, `/app`, and `/tests/e2e`; `npm run preflight` |
| 7 | Current PR head is merge-ready | PR #97 required checks `baseline-checks`, `guard`, `AI Review`, `test`, and `osv-scan` are green; no unresolved blocking review thread; merge state clean |
