# Implementation plan

Reuse check: inspected `GuidedJourneyShell`, `WardrobeItemCard`, `AuthPanel`, `categories.ts`, `color-compatibility.ts`, `outfit-productivity.ts` and `outfit-variation-selection.ts`. The authenticated journey/item card do not implement the approved reference guest grid/composition; port the dedicated guest components. Reuse AuthPanel, locale routing, canonical color compatibility, existing tokens and category membership. Source CSS geometry remains the reference; isolate styles to guest surface.

## Verification

| Criterion        | Evidence                                                                                       | Result  |
| ---------------- | ---------------------------------------------------------------------------------------------- | ------- |
| AC1–AC5          | Playwright guest scenarios + updated landing hero scenario, desktop Chromium and iPhone WebKit | Pending |
| AC2              | Reference source commit pinned above; asset hashes; same-browser screenshots                   | Pending |
| AC3–AC4 negative | Mixed union, switching/reset, invalid storage and empty selection e2e                          | Pending |
| AC6              | Active-doc decision inventory and reviewed diff; protected workflows unchanged                 | Pending |
| All              | lint, CSS lint, typecheck, build, e2e lint/typecheck; GitHub five required checks              | Pending |

TDD: commit failing acceptance tests before product implementation.
