# Plan

Use the existing API-provider Jiti test pattern and signed-session/headers support. First commit failing ownership and empty-account regressions, then remove the relabeling adapters. Update the active frontend/backend contract and agent context. CI owns full browser/build gates; production smoke verifies the actual API mode after deployment.

## Verification

| AC | Evidence | Result |
| --- | --- | --- |
| 1–2 | `specs/wardrobe/no-demo-api.spec.ts`: empty dashboard, guessed-ID denial, upstream error | Pending RED → GREEN |
| 3 | Same spec: exact saved item, filters and persistent mutations across provider reconstruction; existing guest suites | Pending |
| 4 | Same spec: explicit mock fixture ownership unchanged | Pending |
| 5 | Current-head required checks/native review, merge timestamp and CD/live smoke | Pending |

No library/platform API changes are introduced; use the installed Next.js server/client boundary documentation when checking the existing server-only provider.
