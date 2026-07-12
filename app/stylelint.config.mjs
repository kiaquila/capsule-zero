// Focused stylelint config for the Capsule Zero web frontend.
//
// Two generations of guardrails live here:
//
// 1. 2026-07 frontend quality audit (docs_capsule_zero/project/frontend/
//    frontend-quality-audit-2026-07.md): duplicate/overriding selectors — the
//    root cause of the shipped invisible-auth-error bug — and duplicate
//    properties. Still WARNINGS: the legacy `globals.css` carries ~196
//    duplicate selectors until the spec-039 US4 split; the ratchet completes
//    there (flip to `error`, drop the `--max-warnings` baseline).
//
// 2. Spec 039 token-adherence guardrails (.specify/specs/
//    039-design-system-consistency/): raw colour literals (`rgba(`, hex) and
//    off-scale `border-radius` values are forbidden outside
//    `src/styles/tokens.css` — the single allowed home for raw values.
//    ERRORS since the US1 cleanup completed (T010) — any new raw colour or
//    off-scale radius fails the run outright, no budget involved. The two
//    documented in-file disables (§9.8 data-URI, T013 focus retune) are the
//    only pass-throughs. Off-grid spacing is NOT linted here by design: a stylelint
//    rule instance has a single severity, so bundling spacing into the colour
//    rule would block the error flip — the spacing rule lands with its own
//    remediation in a follow-up spec.
//
// Regression protection while rules are warnings comes from the
// `--max-warnings` baseline pinned in the `lint:css` script (pre-commit via
// lint-staged, and the required `baseline-checks` CI job): warnings past the
// baseline fail the run. Every cleanup batch must ratchet the number DOWN.
//
// Genuine one-off values require a documented, reviewed
// `stylelint-disable-next-line` with a reason — never a silent literal.

// The token radius scale (src/styles/tokens.css): xs 6 / sm 8 / md 14 / lg 20
// / pill 50px / circle 50%. Allowed: radius tokens, 0, inherit, and
// shorthands composed of those (e.g. `var(--radius-sm) var(--radius-sm) 0 0`).
const RADIUS_TOKEN = String.raw`var\(--radius-(?:xs|sm|md|lg|pill|circle)\)`;
const RADIUS_VALUE = `(?:${RADIUS_TOKEN}|0|inherit)`;
const RADIUS_ALLOWED = new RegExp(`^${RADIUS_VALUE}(?:\\s+${RADIUS_VALUE})*$`);

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
    // Raw colour literals bypass the design tokens (spec 039 US1). This
    // subsumes the earlier #FFD600-specific rule: any raw hex — including the
    // error colour — must come from a token (var(--color-error) for #FFD600).
    "declaration-property-value-disallowed-list": [
      {
        // Every CSS colour-function family, not just rgba(): a raw
        // `rgb(255 255 255 / .7)` or `hsl(…)` would otherwise bypass the
        // guardrail (Codex P2 on PR #78). `var(--color-*)` is safe — the
        // pattern requires the function's opening paren. CSS function names
        // are ASCII case-insensitive, so the guard must be too.
        "/.*/": [
          /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\(/i,
          /#[0-9a-fA-F]{3,8}\b/,
        ],
      },
      {
        message:
          "Raw colour literals live only in src/styles/tokens.css — use the design token (var(--color-*), var(--glass-*), var(--btn-*), …; var(--color-error) for #FFD600).",
        severity: "error",
      },
    ],
    // Radii must come from the token scale (spec 039 US1, drift #3 — the
    // mechanism behind the square-vs-rounded button drift).
    "declaration-property-value-allowed-list": [
      { "/^border(-[a-z]+)*-radius$|^border-radius$/": [RADIUS_ALLOWED] },
      {
        message:
          "border-radius must come from the token scale: var(--radius-xs|sm|md|lg|pill|circle), 0 or inherit (src/styles/tokens.css).",
        severity: "error",
      },
    ],
  },
  ignoreFiles: ["src/styles/tokens.css", ".next/**", "node_modules/**"],
};

export default config;
