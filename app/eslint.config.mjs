import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
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
