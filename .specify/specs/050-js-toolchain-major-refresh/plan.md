# Implementation Plan: JavaScript Toolchain Major Refresh

## Approach

Process PRs #108-#114 and their later Dependabot replacements strictly in order. Rebase
one PR at a time on the latest merged `origin/main`, confirm its upstream compatibility
contract through Context7, make the smallest required configuration/doc adjustment, run
the full local verification chain, and request a fresh native Codex review before the
guarded merge.

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
| 8   | E2e ESLint 10 graph is internally compatible     | npm peer/engine metadata; npm 10.9.4 clean install; `npm ls`; e2e lint and typecheck; unchanged three-warning Playwright baseline              |
| 9   | E2e TypeScript 7/6 boundary remains supported    | failed direct-install CI evidence; npm 10.9.4 clean install; CLI/API versions; e2e lint, TypeScript 7 typecheck, and full preflight            |
| 10  | E2e Node ambient types match runtime             | Node engine, required workflow, and production image stay on Node 22; installed declarations report 22.20.1; e2e lint/typecheck and preflight  |
| 11  | PR #125 leaves the unsupported app ESLint major deferred | current upstream peer metadata; app npm 10 clean install, lint, typecheck, and build                                                  |
| 12  | PR #126 leaves the unsupported app Node type major deferred | Node 22 runtime/workflow evidence; app npm 10 clean install, typecheck, build, and full preflight                                 |

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
  The final cross-platform lockfile is generated and clean-installed with npm 10.9.4,
  matching the Node 22 CI client, so Linux optional dependencies remain represented.
- PR #112 can take ESLint 10 independently from the blocked app graph:
  `typescript-eslint` 8.67 explicitly peers with ESLint 10 and
  `eslint-plugin-playwright` 2.11 accepts ESLint `>=8.40.0`. The final graph also moves
  the imported `@eslint/js` recommended config to 10.0.1 and aligns the e2e engine with
  the repository `>=22.22.1` floor. npm 10.9.4 clean install, `npm ls`, lint, and
  typecheck pass with the existing three intentional skipped-test warnings unchanged;
  `CI=1 npm run preflight` completes with 78 browser scenarios passed and 8 skipped.
- PR #113 cannot expose TypeScript 7 as the `typescript` API package because
  `typescript-eslint` 8.67 declares `<6.1.0`, which made the generated branch fail
  clean CI installation. The same official side-by-side layout already proven in the
  app keeps TypeScript 7.0.2 as the `tsc` CLI and the TypeScript 6 compatibility package
  under the `typescript` name. TypeScript 7 also removes `baseUrl`; replacing it with
  the equivalent relative `@/*` path preserves app-source resolution. npm 10.9.4 clean
  install, the CLI/API version boundary, e2e lint, and TypeScript 7 typecheck all pass;
  `CI=1 npm run preflight` completes with 78 browser scenarios passed and 8 skipped.
- PR #114's generated Node 26 declarations compile but are newer than every executable
  Node contract in scope. The e2e package requires Node `>=22.22.1`, both required
  workflows select Node 22, and the production image is Node 22. The final update moves
  e2e declarations from 20.19.43 to the same 22.20.1 line already verified for the app;
  npm 10.9.4 clean install, e2e lint, and TypeScript 7 typecheck pass;
  `CI=1 npm run preflight` completes with 78 browser scenarios passed and 8 skipped.

### V11 — App ESLint 10 deferral

```sh
npm view eslint-plugin-jsx-a11y@latest peerDependencies --json
npx --yes --package=npm@10.9.8 npm ci --ignore-scripts --prefix app
npx --yes --package=npm@10.9.8 npm run lint --prefix app
npx --yes --package=npm@10.9.8 npm run typecheck --prefix app
npx --yes --package=npm@10.9.8 npm run build --prefix app
CI=1 npm run preflight
```

At review time, `eslint-plugin-jsx-a11y@6.10.2` remains the latest release and declares
an ESLint peer range only through `^9`. The resolved `eslint-config-next` graph requires
that plugin, so PR #125 restores the app manifest and lockfile to the already verified
ESLint 9.39.4 graph. This is a deferral, not a peer-ignore workaround; resume only when
the complete resolved Next lint graph declares ESLint 10 compatibility.

### V12 — App Node 26 declaration deferral

```sh
rg -n 'node-version: 22|FROM node:22' .github/workflows api/Dockerfile app/Dockerfile
npx --yes --package=npm@10.9.8 npm ci --ignore-scripts --prefix app
npx --yes --package=npm@10.9.8 npm run typecheck --prefix app
npx --yes --package=npm@10.9.8 npm run build --prefix app
PORT=3001 E2E_BASE_URL=http://localhost:3001 CI=1 npm run preflight
```

PR #126 restores `@types/node` to 22.20.1. Node 26 declarations can make code compile
against APIs absent from the Node 22 production image and required workflows, so the
type major remains deferred until those executable runtime contracts move together.
