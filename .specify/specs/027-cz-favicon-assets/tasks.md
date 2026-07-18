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
- [x] T039 Open the PR (`feat/favicon-cz-gold`) with the SENAR Done Gate after founder confirmation — PR #87, opened 2026-07-17.
- [x] T040 Sync PR #87 with `origin/main` after PR #86 merged, then rerun the repository baseline, API-contract checks, lint, typecheck, production build, Docker runner build, Go vet/tests, and the full Playwright suite (51 passed, 8 expected skips, 0 failed).
- [x] T041 Inspect Codex review on head `be94867`: the ICO fallback had been emitted as indexed 8-bit DIB frames with binary transparency, dropping edge antialiasing at 16x16.
- [x] T042 Regenerate `favicon.ico` from high-quality 16/32/48 RGBA rasters and force `TrueColorAlpha` ICO encoding; `file` now reports 32 bits/pixel and per-frame alpha extraction reports 62/111/137 unique levels.
- [x] T043 Rerun SC-001…SC-008 and the focused ICO format/alpha checks on the corrected asset before pushing a fresh review head.

## Phase 6: Dark-Plate Iteration (2026-07-17, `feat/favicon-cz-plate`)

- [x] T044 Founder ran the transparent all-gold V5 in production and reported the mark vanishing on light-theme Chrome tabs, fully erased under the tab hover highlight (screenshot, 2026-07-17). Diagnosis: gold `#EFBF04` on the light strip/hover surfaces measures ≈ 1.3–1.7:1; the SVG's `prefers-color-scheme` step follows the OS scheme, not the tab surface, and both gold steps are light — no fill change can fix a transparent mark on a light tab.
- [x] T045 Produce a three-candidate fix gallery on simulated Chrome tab strips (light/dark × rest/hover/active, 16px + zoom): F1 dark rounded-square plate + gold CZ + hairline, F2 dark capsule-pill plate, F3 gold CTA-gradient plate + black CZ. Founder selected **F1**.
- [x] T046 Rebuild `app/src/app/icon.svg` as the approved F1: byte-identical V5 letter paths wrapped in `translate(256,262) scale(0.82) translate(-256,-262)` over plate `rect rx=118` `#0A0A0A` with hairline `rgba(255,255,255,.22)` (stroke-width 16). Flat fills; the `<style>`/`prefers-color-scheme` block is removed (plate makes the mark scheme-independent).
- [x] T047 Rebuild `app/src/app/favicon.ico`: sharp/librsvg raster of the SVG (1024 master, lanczos3 downscale to 16/32/48), packed with ImageMagick forcing `TrueColorAlpha` per the T042 precedent.
- [x] T048 Fidelity proof vs the approved source: same-pipeline 512px rasters of the shipped SVG vs the F1 gallery source differ by `magick compare -metric AE` = **0** (first naive compare of a 1024→512 downscale vs a direct 512 render showed a false 8.8% — pipelines must match).
- [x] T049 Rerun SC-001…SC-009 evidence: `xmllint` valid; positive/negative `rg` checks pass (no yellow, no achromatic C ink, no `prefers-color-scheme`, no `#FFDD00`, no `<style>`); `magick identify` 16/32/48; `file` 32 bits/pixel; per-frame alpha levels 15/26/49; corner pixels `srgba(0,0,0,0)` on all frames; file-set check passes; 15-chip context montage legible including light-hover.

## Process Memory _(mandatory - required by SENAR; written before declaring work complete)_

### Dead Ends

- The original PR body treated the change as asset-only with no spec. That documented the practical scope correctly, but the repository `guard` workflow still requires complete feature memory whenever a product root under `app/` changes.
- Considered leaving this as a PR-body-only SENAR waiver. Rejected because the machine gate only accepts a changed `.specify/specs/<feature-id>/{spec,plan,tasks}.md` package.
- The first favicon asset PR shipped a transparent PNG app icon, but review on PR #59 confirmed the follow-up must also update feature memory because replacing that product-root asset with SVG still changes `app/`.
- **(V5) Re-deriving the mark from memory diverged from the selection.** The first V5 attempt guessed Helvetica Neue **Medium** and a hand-picked letter gap; it rendered visibly thinner than the gallery and the founder caught it immediately. Lesson: for an approved visual, recover the *exact* source (here, from the session transcript), do not reconstruct from description. The gallery's stated "Weight 500" applied to V1/V6 — V5's own `<text>` was `font-weight="700"`.
- **(V5) The local gallery server was dead.** `curl` to `127.0.0.1:8788` returned nothing and the browser tab showed an error page on re-fetch; a live-DOM scrape was not possible. The transcript-persisted `gallery.html` was the reliable source.
- **(PR #87 review) ImageMagick's default ICO writer silently chose indexed 8-bit DIB frames.** The files were transparent and had the right dimensions, so the original metadata check passed, but their alpha channel had only two levels. At 16x16 that threshold discarded edge coverage and made the already-dense monogram jagged. The corrected pipeline forces `TrueColorAlpha` and verifies alpha cardinality after ICO round-trip.
- **(Plate) Fill-level fixes for the light-tab wash-out are dead ends.** A dark outline around the glyphs turns to mush at 16px; darkening the gold breaks the ratified gold-500/450 family; and any `prefers-color-scheme` variant tracks the OS scheme, not the actual tab surface (Chrome's theme can differ from the OS). Only carrying the mark's own background (a plate) removes the dependency.
- **(Plate) Pixel-fidelity comparisons must use one render pipeline.** Comparing a 1024→512 lanczos downscale against a direct 512 rasterization reported a false 8.8% AE diff on geometrically identical SVGs; re-rendering both directly at 512 through the same sharp/librsvg call gave the true AE = 0.
- **(Plate) XML comments cannot contain `--`.** Writing the CSS token names `--btn-cta-text`/`--btn-cta-border` verbatim inside the SVG's XML comment made the document unparseable for librsvg (double-hyphen is invalid in XML comments); the comment names the tokens without the leading dashes.

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
- **ICO uses light-theme gold-500 fills**. Reason: ICO cannot theme-adapt; light chrome is the majority default, and dark-chrome clients that honor SVG favicons get `icon.svg` (gold-450) anyway. *(Superseded by the plate iteration: the plated mark is theme-independent, so the ICO and SVG now render identically everywhere.)*
- **Dark plate over fill tweaks (founder selection F1, 2026-07-17).** The light-tab wash-out is a surface problem, not a color problem: the V5 mark was designed on the dark landing hero, and the plate ships that surface with the mark. F1 chosen over F2 (capsule pill — letters lose height at 16px) and F3 (gold CTA-gradient plate — reads as a button, not a logo, and shouts in a full tab strip). Plate values reuse the CTA surface tokens: `#0A0A0A` (= `--btn-cta-text`) and hairline `rgba(255,255,255,.22)` (= `--btn-cta-border`); letters stay gold-500 like the landing logo.
- **The `prefers-color-scheme` gold step is retired with the plate.** It tracked the OS scheme rather than the tab surface (the original failure mode) and is moot once the mark carries its own background; keeping it would leave a stale rule that signals drift from the approved F1. SC-002 now guards its absence.
- **Letter scale 0.82 inside the plate.** Gives the mark ≈ 9% margin per side at every raster size — the approved gallery geometry; the 16px density remains within the V5 known-issue envelope (verified by the SC-009 montage).
- **ICO bit depth and alpha cardinality are acceptance evidence, not an implementation detail.** Every frame is 32-bit RGBA, and the post-encoding alpha channel must contain more than two distinct levels; size-only inspection cannot detect the 1-bit-mask regression caught in PR #87 review.

### Known Issues

- **Two-letter density at 16px.** "CZ" is wider and shorter than the single "C.", and the plate margin scales the letters a further 0.82, so at the 16px browser-tab size the letters are small — legible on every surface in the SC-009 montage, but dense. Inherent to the founder-selected F1 composition; larger sizes (32/48/SVG) are crisp.
- **Gold-on-white contrast.** *(Resolved 2026-07-17 by the plate iteration.)* The V5-era acceptance of low gold-on-light contrast is what erased the mark on light-theme tab hover in production; the dark plate removes the mark's dependency on the tab surface entirely.
- The local `main` in some worktrees was stale versus `origin/main`; this iteration branched a fresh worktree from `origin/main` and uses it plus the PR head for all checks.
