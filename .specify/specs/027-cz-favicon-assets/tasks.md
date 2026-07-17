# Tasks: Cz Favicon Assets

**Input**: `.specify/specs/027-cz-favicon-assets/spec.md`, `plan.md`

## Phase 1: Asset Delivery

- [x] T001 Replace `app/src/app/favicon.ico` with a transparent multi-size Cz wordmark favicon.
- [x] T002 Add `app/src/app/icon.png` as a transparent 512x512 Cz wordmark icon.
- [x] T003 Confirm Next.js App Router file conventions need no runtime code change for these files.
- [x] T018 Replace the non-adaptive `app/src/app/icon.png` with `app/src/app/icon.svg`.
- [x] T019 Add a `prefers-color-scheme: dark` SVG override so the Cz mark switches from `#1C1C1C` to `#EDEDED`.
- [x] T020 Confirm current Next.js metadata file convention docs support `icon.svg` under `app/`.

## Phase 2: Feature Memory

- [x] T004 Inspect the failed `guard` check and confirm it requires a complete feature-memory folder for `app/` product-root changes.
- [x] T005 Add `.specify/specs/027-cz-favicon-assets/spec.md`.
- [x] T006 Add `.specify/specs/027-cz-favicon-assets/plan.md`.
- [x] T007 Add `.specify/specs/027-cz-favicon-assets/tasks.md`.
- [x] T008 Record the static-asset TDD waiver in the spec and plan.
- [x] T021 Update `.specify/specs/027-cz-favicon-assets/{spec,plan,tasks}.md` for the theme-adaptive SVG follow-up.

## Phase 3: Verification

- [x] T009 Record prior `sips -g hasAlpha -g pixelWidth -g pixelHeight app/src/app/icon.png` evidence for the original PNG package before the SVG follow-up superseded it.
- [x] T010 Run `magick identify app/src/app/favicon.ico` to confirm the unchanged ICO fallback keeps 16x16, 32x32, and 48x48 entries.
- [x] T011 Run `git diff --name-status origin/main...HEAD -- app/src/app`.
- [x] T012 Run `git diff --check origin/main...HEAD`.
- [x] T013 Run `node scripts/check-feature-memory.mjs origin/main HEAD`.
- [x] T022 Run `xmllint --noout app/src/app/icon.svg`.
- [x] T023 Run `rg -n "prefers-color-scheme: dark|#1C1C1C|#EDEDED" app/src/app/icon.svg`.
- [x] T024 Run `test -f app/src/app/favicon.ico && test -f app/src/app/icon.svg && test ! -e app/src/app/icon.png`.
- [x] T014 Push the feature-memory update to `feat/favicon-theme-adaptive-svg`.
- [x] T015 Update PR #59 body so the SENAR Done Gate references this feature-memory package.
- [x] T016 Trigger or await a fresh review after the final pushed head SHA is available.
- [x] T017 Recheck PR #59 checks until `guard`, `baseline-checks`, `test`, and `osv-scan` are green.

## Phase 4: "C." Iteration (2026-07-17, `feat/favicon-cz-monogram`, shipped as PR #85)

- [x] T025 Build and docker-preview the first candidate — a "CZ" monogram vectorized from the founder's PNG (colour-separated masks → potrace). Founder reviewed it live and rejected it.
- [x] T026 Produce a six-variant typographic gallery (light/dark chrome, 96/48/32/16 + tab mocks) in brand typography and palette; founder selected V3 — the editorial "C." mark.
- [x] T027 Vectorize "C.": extract the C outline from Helvetica Neue Medium (face 10 of `HelveticaNeue.ttc`) via fontTools `SVGPathPen` — exact glyph vector, no raster tracing; gold period `r=48` baseline-set per the approved gallery geometry (browser `dominant-baseline: central` math: baseline = 256 + 0.4×(975−217)/2 ≈ 407.6).
- [x] T028 Colour onto ratified tokens with preserved inversion: C `#1C1C1C`→`#EDEDED`, dot `#EFBF04`→`#FFDD00` (gold-500 → gold-450, design-system §9.11).
- [x] T029 Rebuild `app/src/app/favicon.ico` (16/32/48, transparent, light-theme fills) from the flat-fill SVG variant — not the CSS-styled SVG, because ImageMagick's internal MSVG renderer ignores class-based CSS fills.
- [x] T030 Local docker preview and founder visual approval on light + dark chrome — approved 2026-07-17.
- [x] T031 Open PR #85 (`feat/favicon-cz-monogram`) with the SENAR Done Gate; merged to `main` as `d7f1f29`.

## Phase 5: "CZ" Gold Iteration (2026-07-17, `feat/favicon-cz-gold`)

- [x] T032 Founder ran the shipped "C." mark in production and judged gallery variant **V5 — the gold "CZ" monogram** the better mark; asked to adopt it with the light/dark inversion preserved.
- [x] T033 Recover the **exact** V5 source rather than re-derive it. First re-derivation guessed Helvetica Neue Medium and visibly differed from the gallery; the founder flagged the mismatch and pointed to the still-open gallery. The dead local preview server (`127.0.0.1:8788`) could not be re-fetched, so the original `gallery.html` was recovered from the session transcript. V5 spec: Helvetica Neue **Bold (700)**, `font-size 300`, `letter-spacing -6`, `text-anchor middle`, `dominant-baseline central`, `class="gold"` → `#EFBF04` light / `#FFDD00` dark.
- [x] T034 Vectorize "CZ": extract C and Z outlines from Helvetica Neue **Bold** (face 1 of `HelveticaNeue.ttc`) via fontTools `SVGPathPen`; reproduce the browser's text layout exactly — advance-based centering (`text-anchor middle`) with `letter-spacing -6`, and the same `dominant-baseline central` baseline math the "C." mark used (baseline = 256 + 0.3×(975−217)/2 ≈ 369.7 at scale 0.3). Bake to two `<path>` elements so the mark is font-independent (FR-001).
- [x] T035 Colour both paths onto the ratified gold tokens with the two-step inversion: `.cz-mark { fill: #EFBF04 }` → `#FFDD00` under `@media (prefers-color-scheme: dark)`. No achromatic ink remains (all-gold V5).
- [x] T036 Rebuild `app/src/app/favicon.ico` (16/32/48, transparent, light-theme gold-500) from the flat-fill SVG variant — MSVG ignores class-based CSS fills, same precedent as T029.
- [x] T037 Rerun SC-001…SC-008 evidence: `xmllint` valid; `rg` finds both gold steps + adaptive rule and none of `FFD600|FDC104|#1C1C1C|#EDEDED`; `magick identify` shows 16/32/48; file-set check passes; pixel-fidelity vs the gallery `<text>` = AE 2999/262144 ≈ 1.1% (1px edge AA only).
- [x] T038 Founder confirmation on the built mark — reviewed the light/dark gallery render (`V5-bold-final.png`) and the pixel-fidelity proof vs the gallery `<text>` (`fidelity.png`), and authorized opening the PR directly (chose "open PR now" over a separate docker preview), 2026-07-17.
- [x] T039 Open the PR (`feat/favicon-cz-gold`) with the SENAR Done Gate after founder confirmation — PR number recorded below once created.

## Process Memory _(mandatory - required by SENAR; written before declaring work complete)_

### Dead Ends

- The original PR body treated the change as asset-only with no spec. That documented the practical scope correctly, but the repository `guard` workflow still requires complete feature memory whenever a product root under `app/` changes.
- Considered leaving this as a PR-body-only SENAR waiver. Rejected because the machine gate only accepts a changed `.specify/specs/<feature-id>/{spec,plan,tasks}.md` package.
- The first favicon asset PR shipped a transparent PNG app icon, but review on PR #59 confirmed the follow-up must also update feature memory because replacing that product-root asset with SVG still changes `app/`.
- **(V5) Re-deriving the mark from memory diverged from the selection.** The first V5 attempt guessed Helvetica Neue **Medium** and a hand-picked letter gap; it rendered visibly thinner than the gallery and the founder caught it immediately. Lesson: for an approved visual, recover the *exact* source (here, from the session transcript), do not reconstruct from description. The gallery's stated "Weight 500" applied to V1/V6 — V5's own `<text>` was `font-weight="700"`.
- **(V5) The local gallery server was dead.** `curl` to `127.0.0.1:8788` returned nothing and the browser tab showed an error page on re-fetch; a live-DOM scrape was not possible. The transcript-persisted `gallery.html` was the reliable source.

### Decisions

- **Feature folder is `027-cz-favicon-assets`**. Reason: `origin/main` currently has specs through `025`, and the parallel `feat/026-dev-cd-pipeline` branch already owns `026-dev-cd-pipeline`.
- **No app code change**. Reason: Next.js already discovers `favicon.ico` and `icon.svg` by file convention.
- **TDD waiver is explicit**. Reason: the repository requires TDD for product behavior in specs >= 025; this PR changes static binary assets only, so executable behavior tests would be noise.
- **Verification uses image metadata + pixel-fidelity commands**. Reason: binary assets cannot be reviewed with meaningful line diffs.
- **Each favicon iteration stays in feature folder `027-cz-favicon-assets`**. Reason: same favicon asset surface, not a new product feature.
- **"CZ" gold (V5) selected over the shipped "C." (founder decision, 2026-07-17).** After living with the "C." mark in production the founder preferred V5 — the gold "CZ" monogram that echoes the header wordmark one-to-one. This supersedes the earlier "C." selection for the favicon; the "C." mark is retired.
- **CZ outlines come from the font, not tracing** — fontTools `SVGPathPen` on `HelveticaNeue.ttc` face 1 (Bold) yields exact Bold glyph vectors; baked to `<path>` so the mark renders identically on devices without Helvetica Neue (FR-001), byte-light (~1.5 KB SVG).
- **Bold (700), not Medium.** V5's gallery `<text>` was weight 700; Bold is also the closer echo of the header logo (`.landing-logo` is weight 600) and survives 16px better than Medium.
- **All-gold is within the palette.** Constitution §III v1.5 reserves gold for "the primary CTA and the logo accent"; the favicon is the logo surface and this mark mirrors the already-ratified all-gold `.landing-logo` wordmark. The two-step gold inversion (`#EFBF04`→`#FFDD00`) is the only adaptation an all-gold mark can carry, and it matches the landing logo's own gold family.
- **ICO uses light-theme gold-500 fills**. Reason: ICO cannot theme-adapt; light chrome is the majority default, and dark-chrome clients that honor SVG favicons get `icon.svg` (gold-450) anyway.

### Known Issues

- **Two-letter density at 16px.** "CZ" is wider and shorter than the single "C.", so at the 16px browser-tab size the two letters compress into a tight gold cluster — legible but denser than the single-letter mark. This is inherent to the founder-selected monogram and matches how V5 rendered at 16px in the gallery. Larger sizes (32/48/SVG) are crisp.
- **Gold-on-white contrast.** On a pure-white tab, gold-500 is lower contrast than the old achromatic C. The SVG steps to the brighter gold-450 on dark chrome; the ICO fallback bakes gold-500. Accepted with the V5 selection as a deliberate brand choice (the mark equals the header logo).
- The local `main` in some worktrees was stale versus `origin/main`; this iteration branched a fresh worktree from `origin/main` and uses it plus the PR head for all checks.
