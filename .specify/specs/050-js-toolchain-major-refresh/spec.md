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

## Negative Scenarios

- Installation or pre-commit execution on a Node version below a dependency's declared
  engine is not treated as supported merely because npm emits only a warning.
- A major tool update that drops rules, hides type errors, or requires product-code
  changes is not merged as an unreviewed lockfile-only bump.
- The frozen Supabase provider graph remains outside this toolchain refresh.

TDD posture: this is development-tooling and CI support work without product behavior
changes, so the support-change waiver applies. The pre-upgrade engine mismatch and each
tool's real lint/typecheck/build/test invocation are the regression and passing evidence.
