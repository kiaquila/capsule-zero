// Focused stylelint config for the Capsule Zero web frontend.
//
// It targets the two bug classes surfaced by the 2026-07 frontend quality audit
// (docs_capsule_zero/project/frontend/frontend-quality-audit-2026-07.md):
//   1. duplicate/overriding selectors in the single global stylesheet — the
//      root cause of the shipped invisible-auth-error bug;
//   2. the error colour hardcoded past its design-system token.
//
// Rules are WARNINGS-first on purpose: the legacy `globals.css` still carries
// ~196 duplicate selectors, so making these `error` today would wall off CI.
// Regression protection comes from the `--max-warnings` baseline pinned in the
// `lint:css` script: any app CSS change triggers a lint of the whole CSS tree
// (pre-commit via lint-staged, and the required `baseline-checks` CI job), and
// warnings past the baseline fail the run. Ratchet the severity to `error` and
// drop the baseline once the CSS is split into layered per-feature files (see
// the audit report).
const config = {
  rules: {
    // Catches the exact class of the shipped bug. `disallowInList` is what
    // flags a selector reused across *different* grouped selector lists
    // (e.g. `.auth-server-message` in two separate rules).
    "no-duplicate-selectors": [
      true,
      { disallowInList: true, severity: "warning" },
    ],
    "declaration-block-no-duplicate-properties": [
      true,
      { severity: "warning" },
    ],
    // The solid error colour must come from the token, never a raw hex literal.
    // (rgba(255,214,0,a) error tints still need dedicated alpha tokens — tracked
    // as a follow-up in the audit report — so they are not enforced here yet.)
    "declaration-property-value-disallowed-list": [
      { "/^(color|background|border)/": [/#ffd600/i] },
      {
        message:
          "Use var(--color-error) instead of the raw #FFD600 error colour (design-system token).",
        severity: "warning",
      },
    ],
  },
  ignoreFiles: ["src/styles/tokens.css", ".next/**", "node_modules/**"],
};

export default config;
