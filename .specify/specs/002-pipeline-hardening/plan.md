# Implementation Plan: Pipeline Hardening

## Approach

1. Add root npm scripts for repository baseline, feature-memory validation, app build/typecheck, optional tests, and preflight.
2. Add Node-based gate scripts that work in local worktree mode and GitHub Actions mode.
3. Fold app typecheck/build into the required `baseline-checks` job.
4. Replace inline PR Guard shell policy with trusted script execution plus bootstrap fallback.
5. Harden `AI Review` policy validation and run it from default-branch checkout.
6. Add OSV Scanner workflow and document branch-protection expectations.
7. Update Next/PostCSS dependency baseline so the scanner does not begin red, including Next.js patch refreshes when OSV publishes fixable advisories.

## Non-Goals

- Changing the current supported reviewer set beyond `claude` and `codex`.
- Changing the product UI or application behavior.
- Making `osv-scan` a required branch-protection check before real PR behavior is observed.
