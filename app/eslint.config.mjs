import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // eslint-config-next already registers the jsx-a11y plugin but leaves the
    // label-association rules off. Turn them on (warnings-first) so
    // placeholder-only inputs like the auth form get flagged. Ratchet to error
    // once the flagged cases are cleaned up (see the frontend audit report).
    rules: {
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/control-has-associated-label": "warn",
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    // Module-size discipline — soft gate (warnings, not CI failures; `eslint .`
    // runs without --max-warnings, so these never fail the `lint` check).
    // Canonical rule: AGENTS.md §7 "Engineering Reuse Rule (DRY/SOLID)".
    // Machine-authored clients are exempt.
    ignores: ["src/lib/api/generated/**"],
    rules: {
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 15],
    },
  },
];

export default eslintConfig;
