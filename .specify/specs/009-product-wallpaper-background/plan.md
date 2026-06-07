# Implementation Plan: Product Wallpaper Background

**Branch**: `codex/product-wallpaper-background` | **Date**: 2026-06-07 | **Spec**: `.specify/specs/009-product-wallpaper-background/spec.md`

## Summary

Copy the visually approved wallpaper PNG into the two product asset locations that already reference `wall.png`: the Next public directory and the approved HTML prototype directory. Keep this as an asset-only integration with no layout changes and no experiment-only files.

## Technical Context

**Language/Version**: Next.js 16.2.6, static HTML prototypes
**Primary Dependencies**: Existing static asset serving through Next `public/` and Python `http.server`
**Storage**: No persistence changes
**Testing**: App lint/build, local static asset requests, Browser visual verification
**Target Platform**: Web app public assets and HTML prototypes
**Project Type**: Asset-only product integration
**Performance Goals**: No runtime logic changes; PNG asset serves as static content
**Constraints**: Do not change auth/dashboard layout; do not merge experiment branch; do not add preview files
**Scale/Scope**: Two byte-identical PNG assets plus feature memory

## Constitution Check

- Glassmorphism UI language is preserved because existing frosted surfaces and overlays remain unchanged.
- Achromatic interface is preserved because the approved wallpaper is rendered through the existing grayscale background treatment.
- Capsule methodology is not touched.
- "Direct, not dictate" is not affected because no decision logic changes.
- Premium quality is supported by using the visually approved background and verifying auth/dashboard locally.
- Three upload methods are not touched.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | `curl -fsSI http://127.0.0.1:3000/wall.png` |
| SC-002 / FR-002 | Browser visual check for `http://127.0.0.1:3101/auth.html`; `.hero-bg` resolved to `http://127.0.0.1:3101/wall.png` |
| SC-003 / FR-002 | Browser visual check for `http://127.0.0.1:3101/dashboard.html`; `.hero-bg` resolved to `http://127.0.0.1:3101/wall.png` |
| FR-003 | `shasum -a 256 app/public/wall.png html-prototypes/wall.png` matched |
| FR-004 / FR-005 | `git diff --name-status` and experiment filename search |
| SC-004 | `npm run lint` |
| SC-005 | `npm run build` |
| SC-006 | `npm run check:feature-memory -- --worktree` |

Negative scenario evidence:

- No auth/dashboard HTML layout files are modified by this PR.
- `auth-wallpaper.html`, `dashboard-wallpaper.html`, and `wallpaper-preview.html` are absent from the diff.
- Branch `codex/product-wallpaper-background` was created from current `origin/main`.

## Project Structure

```text
app/public/wall.png
html-prototypes/wall.png
.specify/specs/009-product-wallpaper-background/
  spec.md
  plan.md
  tasks.md
```

**Structure Decision**: Keep the approved image as static product assets in the existing referenced locations instead of adding new layout code or prototype variants.

## Complexity Tracking

No constitution violations.
