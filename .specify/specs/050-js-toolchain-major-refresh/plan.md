# Implementation Plan: JavaScript Toolchain Major Refresh

## Approach

Process PRs #108-#114 strictly in order. Rebase one PR at a time on the latest merged
`origin/main`, confirm its upstream compatibility contract through Context7, make the
smallest required configuration/doc adjustment, run the full local verification chain,
and request a fresh native Codex review before the guarded merge.

## Verification

| #   | Acceptance criterion                             | Evidence                                                                                                                                       |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Node runtime satisfies lint-staged 17            | Root `engines.node` is `>=22.22.1`; `.github/workflows/ci.yml` and `test.yml` select Node 22; Context7 reports the upstream `>=22.22.1` engine |
| 2   | Existing staged-file contract remains executable | `npm run precommit` with the feature-memory changes staged; existing `lint-staged.config.mjs` and `.husky/pre-commit` are reused               |
| 3   | Repository installs and verifies cleanly         | `npm ci --ignore-scripts`; `npm --prefix app ci --ignore-scripts`; `npm --prefix tests/e2e ci --ignore-scripts`; `CI=1 npm run preflight`      |
| 4   | Current PR head is merge-ready                   | Head SHA equals GitHub PR head; `gh pr checks <PR> --required`; merge state `MERGEABLE/CLEAN`; unresolved review-thread count is zero          |
| 5   | Unsupported major updates are not forced        | `npm view` peer metadata, clean-install result, and manifest/lockfile diff against `origin/main`                                               |

## Compatibility Notes

- Context7's lint-staged documentation records Node.js `>=22.22.1` for v17 and confirms
  the existing package.json object configuration remains supported.
- The repository already builds its production web image from Node 22. This change
  aligns developer tooling and the two Node-based required workflows with that major
  runtime line; it does not alter the production image contract.
- PR #108 local evidence: all three clean installs passed; `npm run precommit` executed
  the existing staged-file configuration successfully; `CI=1 npm run preflight` passed
  repository/API checks, both lint/typecheck paths, the production build, and 78 browser
  scenarios with 8 intentional skips.
- PR #109 disposition: ESLint 10 itself supports the repository's Node 22 line and flat
  config, but the latest `eslint-plugin-jsx-a11y` (6.10.2), required directly and by
  `eslint-config-next` 16.3, declares peers only through ESLint 9. The generated update
  failed clean `npm ci` with `ERESOLVE`; app manifest and lockfile are therefore kept
  identical to `origin/main`. Resume after that plugin or a supported Next lint stack
  declares ESLint 10 compatibility and the existing 93-warning lint baseline passes.
