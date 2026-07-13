# Tasks — 012 Palette Alignment

- [x] T001 Refresh `pallete-maker` source and confirm current harmony tests pass.
- [x] T002 Update Capsule Zero palette/methodology/product docs.
- [x] T003 Update HTML prototypes to the current 51-color palette and group compatibility.
- [x] T004 Update Stage 1 mock fixture colors and mock validation behavior.
- [x] T005 Run local verification.
- [x] T006 Commit, push, open PR, trigger a review request, and monitor checks.

## Process Memory

### Dead Ends

- Review correctly found that the API contract still capped palette validation at 8 colors. Fixed by updating `docs_capsule_zero/adr/openapi.yaml` to 15 and regenerating TypeScript/Dart clients.
- The only sequencing wrinkle is that the PR checks URL cannot be recorded until after the first PR creation creates a PR number.

### Decisions

- Use `pallete-maker/src/scripts/harmony.mjs` rather than older `pallete-maker` specs because the live code and tests are the current source of truth.
- Keep temperature as metadata for Warm/Cool/Universal display only, not as a compatibility filter.
- Keep human garment labels like "Camel coat" and "Ivory silk blouse" where they describe item copy, while mapping their color dots to closest PM catalog colors (`Sand`, `White`, `Off-White`).
- Add `group` to `ColorPoint` and keep `shade` as a compatibility-safe alias to the PM group family for existing TypeScript surfaces.
- Use PR #31 checks page as SENAR linked-check evidence because it resolves to the current PR head after the final evidence push.
- Keep `/api/palette/validate` aligned with the picker cap: 15 total color IDs in OpenAPI and generated clients.

### Known Issues

- App has no configured unit-test runner yet; validation relies on `npm run preflight` plus a direct palette comparison script for this PR.
