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
| 5   | Unsupported major updates are not forced         | `npm view` peer metadata, clean-install result, and manifest/lockfile diff against `origin/main`                                               |
| 6   | TypeScript 7/6 boundary is explicit              | `tsc --version`; `tsc6 --version`; `require("typescript").version`; `npm run lint`; `npm run typecheck`; `npm run build`                       |
| 7   | Node ambient types match the runtime line        | Production Dockerfile and required workflows use Node 22; installed `@types/node` reports 22.20.1; app typecheck and production build pass     |

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
  config, but three plugins in `eslint-config-next` 16.3's resolved graph declare peers
  only through ESLint 9: `eslint-plugin-jsx-a11y@6.10.2`,
  `eslint-plugin-import@2.32.0`, and `eslint-plugin-react@7.37.5`. The generated update
  failed clean `npm ci` with `ERESOLVE`; app manifest and lockfile are therefore kept
  identical to `origin/main`. Resume only after the complete resolved Next lint graph
  declares ESLint 10 compatibility and the existing 93-warning lint baseline passes.
- PR #110 uses TypeScript's documented side-by-side migration layout:
  `@typescript/native` supplies the TypeScript 7 CLI, while the `typescript` package
  name resolves `@typescript/typescript6` for API consumers. `typescript-eslint` 8.67
  declares TypeScript `<6.1.0`, and Next.js 16.3 defaults to CLI-mode configuration
  loading. Explicitly disabling `experimental.useTypeScriptCli` keeps Next.js on the
  TypeScript 6 API; the repository's `typecheck` script still resolves the native
  TypeScript 7 `tsc` binary. Clean install, lint, TypeScript 7 typecheck, and the
  production webpack build all pass with this boundary; the full CI-mode preflight
  completed with 78 browser scenarios passed and 8 intentionally skipped.
- PR #111 generated `@types/node` 26.2.0, which compiles but is newer than the Node 22
  production image and required workflow runtime. The final update therefore advances
  the app from 20.19.33 to the current Node 22 type line, 22.20.1. Resume the Node 26
  type major only when the production image and CI runtime move to Node 26; clean app
  install, TypeScript 7 typecheck, and production build pass on the aligned line, and
  the full CI-mode preflight completes with 78 browser scenarios passed and 8 skipped.
