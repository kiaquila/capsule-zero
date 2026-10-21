# Plan

Use the existing API-provider Jiti test pattern and signed-session/headers support. First commit failing ownership and empty-account regressions, then remove the relabeling adapters. Update the active frontend/backend contract and agent context. CI owns full browser/build gates; production smoke verifies the actual API mode after deployment.

## Verification

| AC  | Evidence                                                                                                                                                                                            | Result                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1–2 | RED commit `3a43b94`; `E2E_BASE_URL=https://capsulezero.app npm test -- specs/wardrobe/no-demo-api.spec.ts specs/profile/real-profile-data.spec.ts --project=chromium --workers=1` (from tests/e2e) | PASS: 9/9 including empty dashboard, guessed-ID denial and upstream error; these provider-level tests make no live requests |
| 3   | Same command: exact saved item, filters and mutations across provider reconstruction; existing profile/guest projection regressions                                                                 | PASS                                                                                                                        |
| 4   | Same spec: explicit mock fixture ownership unchanged                                                                                                                                                | PASS                                                                                                                        |
| 5   | Current-head required checks/native review, merge timestamp and CD/live smoke                                                                                                                       | Pending                                                                                                                     |
| All | `npm --prefix app run lint`, `build`, `typecheck`                                                                                                                                                   | PASS; lint has existing non-blocking warnings                                                                               |

No library/platform API changes are introduced; use the installed Next.js server/client boundary documentation when checking the existing server-only provider.

Read bundled Next.js `dist/docs/01-app/02-guides/server-and-client-boundary.md`; the existing server-only boundary and authenticated no-store API fetch remain unchanged. The API registry remains above the soft file-size guideline (512 lines), but this patch deletes 99 net lines and avoids unrelated auth splitting.
