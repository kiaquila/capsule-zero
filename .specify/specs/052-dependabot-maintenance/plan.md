# Plan 052 — Dependabot Maintenance

## Approach

Process Dependabot PRs one at a time. Preserve each intended direct version update,
regenerate only affected lockfiles with npm 10.9.2, and apply the smallest transitive
security correction needed for the required OSV gate. Request native Codex review on
the exact final head and merge only after every required gate and review thread is
green.

## Verification

| Contract | Evidence |
|---|---|
| Manifest and lockfile consistency | `npm@10.9.2 ci --ignore-scripts` passed in the root, `/app`, and `/tests/e2e` workspaces. |
| Dependency security | npm 10.9.2 audit passed with zero vulnerabilities in `/app` and `/tests/e2e`; pending required `osv-scan` on the final PR head. |
| Repository regression checks | Repository baseline, API contract/client generation, app lint, CSS lint, app/e2e TypeScript, e2e lint, production build, feature-memory guard, and `git diff --check` passed locally; pending required GitHub checks. |
| Native AI review | Pending Codex review on the final PR head. |
| Merge readiness | Pending GitHub mergeability and unresolved-thread audit. |

## Reuse Check

Checked the existing package manifests, npm lockfiles, OSV configuration, required
GitHub workflows, and feature-memory gate. This change reuses those contracts and adds
no new application module, component, service, adapter, schema, or helper.
