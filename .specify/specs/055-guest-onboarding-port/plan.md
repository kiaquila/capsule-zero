# Implementation plan

Reuse check: inspected `GuidedJourneyShell`, `WardrobeItemCard`, `AuthPanel`, `categories.ts`, `color-compatibility.ts`, `outfit-productivity.ts` and `outfit-variation-selection.ts`. The authenticated journey/item card do not implement the approved reference guest grid/composition; port the dedicated guest components. Reuse AuthPanel, locale routing, canonical color compatibility, existing tokens and category membership. Source CSS geometry remains the reference; isolate styles to guest surface.

## Verification

| Criterion | Evidence | Result |
| --- | --- | --- |
| AC1, AC3–AC5 | `E2E_BASE_URL=http://localhost:3103 npm --prefix tests/e2e test -- specs/guest specs/landing/hero.spec.ts`; committed POM scenarios cover EN/RU, Mixed 32, women 19/men 13, count/result/reload/restart, signup and photo sheet | Chromium passed; final Chromium/WebKit run and linked PR `test` check verify final head |
| AC2 | `evidence/asset-hashes.json`: SHA-256 of all 32 copied assets matches source `8328dca`; `evidence/visual-comparison.json`, same-browser screenshots at 1440×1000 and 390×844; independent live visual review | Result and auth: zero differing pixels; remaining ≤0.14% and visually imperceptible. `evidence/mixed-step-{1440,390}.png` records new card |
| AC3–AC4 negative | `specs/guest/storage.spec.ts` rejects malformed/wrong-type/unknown/duplicate selections and resets fresh state; `onboarding.spec.ts` tests empty and incompatible-color selection | Browser checks plus linked PR `test` |
| AC6 | Diff of PRODUCT-PLAN §0.1/§0.2/Q5, AGENTS, CLAUDE, constitution, ADR-004 and active delivery docs; `git diff --name-only origin/main -- .github/workflows scripts` | No workflow/gate/script weakening; routine decisions delegated, legal/security/spend boundaries retained |
| All | `npm run check:repo`, `npm run check:api-contract`, `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run lint:e2e`, `npm run typecheck:e2e`, `npm run build` | Passed locally; warnings within existing CSS budget. Required GitHub checks must be green before authorized merge |

TDD: failing-test commit `333dcaf` precedes implementation; `/en/start` returned 404 and Mixed timed out in the red run. CI verifies the final application and contracts. Full-stack-only browser tests need the existing live test runtime and remain explicitly skipped in local mock mode.

The linked PR's current-head checks are the final merge evidence; screenshots and hashes above are committed raw artifacts. Application authentication/provider/deployment guards remain in force.
