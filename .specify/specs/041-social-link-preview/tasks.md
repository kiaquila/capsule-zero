# Tasks: Social Link Preview

**Input**: `.specify/specs/041-social-link-preview/spec.md`, `plan.md`

## Phase 1: Research and Capture

- [x] T001 Reproduce the missing Telegram preview through the existing Telethon session.
- [x] T002 Confirm the full HTTPS URL produces a Telegram webpage card.
- [x] T003 Check the current Next.js metadata and confirm `og:image` is absent.
- [x] T004 Review current Next.js 16 metadata guidance through Context7.
- [x] T005 Capture a clean 1200x630 screenshot of production `/en` with Playwright.

## Phase 2: Test First

- [x] T006 Add spec 041 feature memory before product-root changes.
- [x] T007 Add a Playwright scenario for Open Graph, Twitter Card, and the static image response.
- [x] T008 Run the focused scenario and record the expected missing `og:image` failure.
- [ ] T009 Commit the failing test before implementation.

## Phase 3: Implementation

- [ ] T010 Add the screenshot under `app/public/social/`.
- [ ] T011 Consolidate layout metadata into a shared Next.js metadata module.
- [ ] T012 Add Open Graph and Twitter large-image metadata.
- [ ] T013 Update frontend documentation with the social-preview contract.
- [ ] T014 Run the focused scenario until green.

## Phase 4: Verification and Delivery

- [ ] T015 Inspect PNG dimensions and size.
- [ ] T016 Run feature-memory, lint, typecheck, build, and e2e verification.
- [ ] T017 Update Verification evidence and Process Memory before declaring completion.
- [ ] T018 Commit the implementation with Codex co-author attribution.
- [ ] T019 Push the branch and open a ready-for-review PR.
- [ ] T020 Comment `@codex review` from the owner account.
- [ ] T021 Monitor required checks and review evidence on the final head SHA.

## Process Memory _(mandatory - required by SENAR; written before declaring work complete)_

### Dead Ends

- The bundled in-app browser runtime failed twice with `Cannot redefine property: process`; the project Playwright installation captured the same production page without introducing another browser dependency.
- A bare `capsulezero.app` URL was clickable in Telegram but produced `MessageMediaEmpty`; only the explicit HTTPS target produced a webpage preview, so metadata work alone does not remove the need to edit the post URL later.

### Decisions

- **Use the production English landing page as the artwork.** Reason: the user requested a homepage screenshot, and `/en` is the primary locale and approved visual reference.
- **Capture at 1200x630 with the cookie decision pre-seeded.** Reason: this is the standard large-card ratio and removes a temporary consent overlay without altering the page.
- **Share one metadata module across both root layouts.** Reason: the existing layouts contain duplicated metadata and the Engineering Reuse Rule rejects adding another drifting copy.
- **Serve one PNG to both Open Graph and Twitter.** Reason: a single canonical asset keeps visual identity and refresh behavior aligned across crawlers.

### Known Issues

- Telegram may cache the pre-image card after deployment; the follow-up post edit may need a unique HTTPS query parameter to force a fresh crawl.
- The screenshot is intentionally coupled to the current landing hero and should be recaptured after a material hero redesign.
