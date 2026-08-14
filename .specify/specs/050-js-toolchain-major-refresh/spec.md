# Feature Specification: JavaScript Toolchain Major Refresh

## Goal

Upgrade the repository's JavaScript development toolchain through the separately opened
major-version dependency pull requests without accepting an incompatible runtime,
silently weakening lint/type checks, or changing product behavior.

## Scope

### In

- `lint-staged` 17 and the Node.js runtime floor it requires.
- The separately reviewed ESLint, TypeScript, and Node type-definition major updates in
  the web and e2e workspaces.
- CI/runtime metadata, lockfiles, and durable documentation required to keep each tool's
  supported environment explicit.
- Clean-install, lint, typecheck, build, e2e, and staged-file compatibility evidence for
  every merged major update.

### Out

- Product behavior, UI, API, schema, and infrastructure topology changes.
- Advancing the frozen Supabase provider or its dependency graph.
- Combining independent major upgrades before each preceding PR is merged and becomes
  the next PR's verified base.

## Acceptance Scenarios

1. The root runtime contract and both required Node-based GitHub workflows use a Node 22
   line compatible with `lint-staged` 17's `>=22.22.1` engine requirement.
2. The existing package.json/glob configuration and Husky pre-commit entrypoint execute
   successfully with lint-staged 17.
3. Each JavaScript workspace installs cleanly and the full repository preflight passes.
4. Each PR receives a native Codex review for its final head, has zero unresolved review
   threads, and passes all five required GitHub checks.
5. If an upstream peer dependency still excludes the proposed major, the generated
   version change is removed and the PR records the exact blocker and a testable resume
   condition instead of forcing an unsupported install.
6. The app's TypeScript 7 compiler CLI runs the standalone typecheck while tools that
   still require the compiler API resolve the official TypeScript 6 compatibility
   package, and the unchanged production application still builds successfully.
7. Node.js ambient types do not advertise APIs newer than the Node 22 runtime used by
   production images and required CI workflows.
8. The e2e ESLint 10 runtime, core recommended config, TypeScript adapter, and Playwright
   plugin resolve a mutually supported graph under the repository Node floor.

## Negative Scenarios

- Installation or pre-commit execution on a Node version below a dependency's declared
  engine is not treated as supported merely because npm emits only a warning.
- A major tool update that drops rules, hides type errors, or requires product-code
  changes is not merged as an unreviewed lockfile-only bump.
- TypeScript 7 is not exposed to an API consumer: it intentionally has no compiler API,
  so ESLint and Next.js must not load it through `require("typescript")`.
- A green typecheck with `@types/node` newer than the deployed runtime is not accepted:
  it could compile calls that fail only after deployment.
- A lockfile that installs only on the maintainer platform is not accepted; the Node 22
  CI npm client must validate all cross-platform optional dependency records.
- ESLint 10 is not paired with the previous major of `@eslint/js`, because the e2e flat
  config imports that package as the source of its core recommended rules.
- The frozen Supabase provider graph remains outside this toolchain refresh.

TDD posture: this is development-tooling and CI support work without product behavior
changes, so the support-change waiver applies. The pre-upgrade engine mismatch and each
tool's real lint/typecheck/build/test invocation are the regression and passing evidence.
