# Plan — 012 Palette Alignment

## Approach

Use `kiaquila/pallete-maker` `main` as the external source of truth for the palette catalog and harmony behavior. First update durable product memory and methodology docs, then update the HTML prototypes, then update the mock provider boundary so app behavior and docs no longer diverge.

## Verification

| Acceptance Criterion | Evidence |
|---|---|
| AC-001 docs describe group-based compatibility | Diff updates `.specify/memory`, `docs_capsule_zero/project/methodology`, feature docs, glossary, UX docs, and architecture docs away from the old temperature/saturation compatibility model. |
| AC-002 documented 51-color palette matches `pallete-maker` | `node --input-type=module` comparison against `/tmp/pallete-maker/src/scripts/harmony.mjs`: `colors.md: 51 colors, 0 mismatches`; `color-system.html: 51 colors, 0 mismatches`; `guided-journey.html: 51 colors, 0 mismatches`. |
| AC-003 Guided Journey prototype blocks by PM rule and caps | Diff replaces the 63-color picker data and runtime compatibility function in `html-prototypes/guided-journey.html`; `rg` for old palette HEX/copy/rule terms only returns this spec folder. |
| AC-004 mock validation enforces same rule | `npm run preflight` exited 0, covering feature memory, repo baseline, API contract/client check, lint, typecheck, build, and optional tests. |
| AC-005 API validation cap matches PM-sized palette | `npm run generate:api` after `docs_capsule_zero/adr/openapi.yaml` update; `rg` confirms `maxItems: 15` / `"maxItems": 15` in YAML, TypeScript generated client, and Dart generated client. |
| AC-006 PR head passes required GitHub checks | PR checks page for the current head: https://github.com/kiaquila/capsule-zero/pull/31/checks. Final monitoring command: `gh pr checks 31 --watch --interval 10`. |

## Risks

- Historical MVP spec `001` is grandfathered, but leaving its old compatibility language would keep confusing future agents, so this PR updates the relevant color-rule lines without retrofitting the whole spec shape.
- Some wardrobe item names such as camel/ivory are kept as human-friendly garment labels while their color dots are mapped to the closest 51-color catalog entries.

## Done When

- Local preflight passes.
- PR is opened from `codex/palette-alignment`.
- Top-level `@codex review` comment is posted by the authenticated GitHub user.
- Required GitHub checks are green or any failure is diagnosed and fixed.
