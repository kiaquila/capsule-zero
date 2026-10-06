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
| Dependency security | `sharp` 0.35.5 and `source-map-js` 1.2.2 replace vulnerable releases; exact dev-only `braces` 3.0.3 has a short-lived OSV exception through 2026-11-06 because no patched release exists; local OSV scan and required GitHub `osv-scan` cover the final head. |
| Repository regression checks | Repository baseline, API contract/client generation, app lint, CSS lint, app/e2e TypeScript, e2e lint, production build, feature-memory guard, and `git diff --check` passed locally; pending required GitHub checks. |
| Frozen provider boundary | Codex P1 follow-up restored `@supabase/supabase-js` and its complete lockfile graph to the `origin/main` versions. |
| Native package targeting | Codex P2 follow-up restored the `glibc`/`musl` selectors for every affected Next/SWC Linux package. |
| Native AI review | Pending Codex review on the final PR head. |
| Merge readiness | Pending GitHub mergeability and unresolved-thread audit. |
| PR #146 Node type compatibility | Node 22 runtime/workflow evidence; targeted `@types/node` manifest/lock assertions; clean npm 10.9.8 install, installed-version assertion, typecheck, and production build. |
| PR #146 advisory refresh | GitHub advisories GHSA-wq5f-xc86-pv6w and GHSA-68fv-2mgg-jv7q identify fixed releases; GHSA-vfj7-8cjw-p6xm has no patched npm release and is reachable only through dev-only stylelint/micromatch on repository-controlled globs. |

## Reuse Check

Checked the existing package manifests, npm lockfiles, OSV configuration, required
GitHub workflows, and feature-memory gate. This change reuses those contracts and adds
no new application module, component, service, adapter, schema, or helper.
