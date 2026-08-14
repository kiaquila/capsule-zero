# Tasks: JavaScript Toolchain Major Refresh

- [x] Rebase PR #108 on the latest `origin/main` and regenerate its root lockfile without
      losing the already merged minor/patch dependency refresh.
- [x] Verify lint-staged 17's runtime and configuration contract through Context7.
- [x] Raise the root Node engine and both required Node-based workflows to the supported
      Node 22 line.
- [x] Pass clean installs, staged-file verification, and the full CI-mode preflight.
- [x] Trigger and clear PR #108's head-bound native Codex review and required GitHub
      checks; merge after the two-minute stability window.
- [x] Rebase PR #109, reproduce its clean-install peer conflict, verify current upstream
      compatibility metadata, and remove the unsupported ESLint 10 update.
- [x] Trigger and clear PR #109's head-bound native Codex review and required checks;
      merge after the two-minute stability window.
- [x] Rebase PR #110 and reproduce the direct TypeScript 7 incompatibility with
      `typescript-eslint` before selecting the upstream side-by-side migration layout.
- [x] Keep the TypeScript 7 CLI and TypeScript 6 API consumer paths explicit, and pass
      clean install, lint, TypeScript 7 typecheck, and the production app build.
- [x] Trigger and clear PR #110's head-bound native Codex review and required checks;
      merge after the two-minute stability window.
- [x] Rebase PR #111, reject ambient Node 26 APIs against the Node 22 production
      runtime, and update the app to the latest Node 22 type line instead.
- [x] Pass clean app install, TypeScript 7 typecheck, and the production build with
      `@types/node` 22.20.1.
- [x] Regenerate and clean-install the app lockfile with CI-aligned npm 10.9.4 after
      npm 11 omitted Linux-only optional dependency records on macOS.
- [x] Trigger and clear PR #111's head-bound native Codex review and required checks;
      address and resolve its portable-lock thread, then merge after the stability window.
- [x] Rebase PR #112 and verify the e2e TypeScript and Playwright lint plugins declare
      ESLint 10 support.
- [x] Upgrade the imported `@eslint/js` config to 10.0.1, align the e2e Node floor, and
      pass npm 10 clean install, dependency-tree, lint, and typecheck verification.
- [ ] Trigger and clear PR #112's head-bound native Codex review and required checks.

## Process Memory

### Dead Ends

- Rebasing the generated PR directly produced expected conflicts in `package.json` and
  `package-lock.json` because PR #107 had updated adjacent root dependencies. Resolving
  from `origin/main` and regenerating only lint-staged preserved the merged graph.
- npm can install lint-staged 17 under an unsupported Node version with only an engine
  warning. A green install alone therefore is not compatibility evidence.
- PR #109's generated ESLint 10 lockfile cannot install cleanly: npm reports `ERESOLVE`.
  Inspection of the complete resolved Next lint graph found three packages whose current
  peer ranges end at ESLint 9: `eslint-plugin-jsx-a11y@6.10.2`,
  `eslint-plugin-import@2.32.0`, and `eslint-plugin-react@7.37.5`. Peer-ignore flags
  would conceal, not resolve, those unsupported plugin/runtime boundaries.
- PR #110's direct TypeScript 7 package passes the Next.js CLI-mode build but crashes
  the lint path because TypeScript 7 deliberately ships no compiler API and
  `typescript-eslint` must load `typescript`. The documented side-by-side aliases fix
  lint, but Next.js 16.3's default CLI-mode config discovery then sees no `tsc` binary
  on the aliased TypeScript 6 wrapper and ignores `tsconfig.json`, breaking every `@/*`
  webpack alias. Setting Next.js to its supported API mode makes it load the TypeScript
  6 API package and preserves the existing path mappings.
- PR #111's generated Node 26 type update also passes the current compiler and build,
  but that is insufficient evidence: ambient declarations can expose Node 26-only APIs
  while every deployed and required workflow runtime remains Node 22.
- The local npm 11.6.2 client produced a lockfile that clean-installed on macOS but
  omitted root `@emnapi/core` and `@emnapi/runtime` records required by Linux npm 10.
  The first PR #111 baseline run caught the mismatch immediately; regenerating with
  npm 10.9.4 restored both portable optional-dependency records.
- Treating the generated PR #112 as an isolated `eslint` package replacement leaves the
  imported `@eslint/js` recommended config on major 9. It runs, but does not represent a
  complete ESLint 10 core-config migration.

### Decisions

- Spec 049 was checked first and explicitly excludes major upgrades, so this separate
  reusable feature-memory unit owns PRs #108-#114.
- Use Node 22 in CI and declare `>=22.22.1` at the root instead of weakening or ignoring
  lint-staged 17's engine contract. The production web image already uses Node 22.
- Keep the existing `.husky/pre-commit` and `lint-staged.config.mjs`; upstream v17 still
  supports the current object/glob command configuration.
- PR #108's final local preflight completed with 78 passed and 8 intentionally skipped
  browser scenarios; no retry or toolchain-related failure remained.
- Defer app ESLint 10 and keep ESLint 9.39.4 unchanged in PR #109. Context7 confirms
  ESLint 10 removes deprecated plugin context APIs, so forcing a plugin whose peer range
  excludes v10 is not an acceptable merge-ready state.
- Follow TypeScript's official side-by-side migration layout for PR #110. The app's
  `tsc` command is TypeScript 7.0.2, `tsc6` and `require("typescript")` remain on the
  compatible TypeScript 6 line, and Next.js is pinned to its compiler-API mode until
  its CLI-mode package discovery recognizes the side-by-side wrapper.
- Keep `@types/node` aligned to the deployed runtime major. PR #111 advances 20.19.33 to
  22.20.1 rather than accepting 26.2.0; Node 26 types resume with a deliberate runtime
  upgrade, not as an isolated declaration-only change.
- Accept ESLint 10 in the e2e workspace only: its smaller plugin graph declares support.
  Move `@eslint/js` with it and reuse the repository Node `>=22.22.1` floor rather than
  retaining the e2e workspace's broader, now-inaccurate `>=20` promise.

### Known Issues

- PRs #113-#114 remain isolated major upgrades and need their own compatibility evidence
  before their checkboxes can be completed here.
- App ESLint 10 remains deferred until every plugin in the resolved Next lint graph
  declares support; Dependabot may reopen the update when upstream metadata changes.
