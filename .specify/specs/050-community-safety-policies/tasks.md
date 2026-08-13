# Tasks 050 — Community Safety Policies

## Tasks

- [x] T001 Create a clean worktree and `codex/community-safety-policies` branch from
      fresh `origin/main` without touching the user's existing checkout changes.
- [x] T002 Recheck the current Pinterest policy stack, U.S. Copyright Office Section
      512 guidance, and official EU DSA notice/action sources.
- [x] T003 Write route/navigation/required-copy Playwright coverage and capture the red
      result before implementation.
- [x] T004 Add Community Guidelines, Copyright & IP Policy, and Enforcement & Appeals
      content using the existing legal-document model.
- [x] T005 Add localized static routes and discoverable legal/landing navigation.
- [x] T006 Update Terms to incorporate the policies and complete the protective clauses.
- [x] T007 Run the policy completeness and gated-feature negative audits.
- [x] T008 Run focused e2e, lint, CSS lint, typechecks, build, repo baseline, and
      feature-memory verification; record evidence in `plan.md`.
- [x] T009 Fill Process Memory, publish the branch, and open a ready-for-review PR with
      the SENAR Done Gate and external-legal-review warning.
- [x] T010 Address Codex review by extracting the duplicated landing/auth policy footer
      and localizing legal-header labels through the active EN/RU message catalog.
- [x] T011 Address Codex review by centralizing public legal contacts on the production
      `.app` domain with a red-first regression covering all five legal documents.
- [x] T012 Renumber this feature memory from 049 to 050 after fresh `origin/main`
      introduced the already-merged spec 049 dependency-remediation slice.
- [x] T013 Add a red-first legal-rollout regression, render the incorporated policy
      introduction, announce the material Terms revision before its effective date,
      and date the Privacy Policy contact revision.
- [x] T014 Add a red-first Terms-version regression; keep the governing July 24 Terms
      accessible to signup and footer users, expose the September 15 preview, and use
      one effective-instant boundary for canonical switchover and notice retirement.
- [x] T015 Add a red-first full-RU-policy regression; publish substantive Russian
      Community, Copyright/IP, and Enforcement documents with localized shared chrome,
      and fix the CI module-loader boundary exposed by the same test commit.
- [x] T016 Replace the cross-workspace TypeScript boundary with one Node-20-safe ESM
      module and derive RU policy display dates from the shared ISO revision values.
- [x] T017 Add a red-first authenticated-route notice regression; use server time for
      the cutoff and mount one shared notice wrapper across every verified-session route.
- [x] T018 Add a red-first control-overlap regression; move verified-session routes
      under one protected route-group layout and reserve non-overlapping notice space.
- [x] T019 Add a red-first document-height regression; contain full-height dashboard,
      guided-journey, and capsule-result shells inside the protected viewport.
- [x] T020 Add a red-first persistent-layout expiry regression; pass the authoritative
      server/effective instants to a client timer that retires the notice without reload.
- [x] T021 Add a red-first suspended-tab expiry regression; split the Terms browser
      scenarios below five cases per file and revalidate server time when the tab resumes.
- [x] T022 Add a red-first Russian future-Terms regression; publish all 22 sections in
      Russian and select the localized preview and post-cutoff contract by locale.
- [x] T023 Repair the Node 20 CI collection boundary by exposing locale plus version
      selection from the existing ESM module and consuming that boundary in the test.
- [x] T024 Add a red-first reconnect regression and revalidate the authoritative Terms
      cutoff when an authenticated browser regains connectivity after a failed probe.
- [x] T025 Add a red-first protected-session deduplication regression and share the
      verified session lookup across the protected layout and page within one request.

## Process Memory

### Dead Ends

- A focused local Playwright run with five workers exposed a Next.js 16 development-
  cache race that appended duplicate bytes to `.next/dev/prerender-manifest.json` and
  produced unrelated 500 responses. Moving the disposable cache aside and rerunning
  serially made the same Chromium and WebKit/iPhone matrix pass. The production webpack
  build also generated all routes successfully.
- After the protected-route refactor, Turbopack reused a disposable `.next/dev` CSS
  artifact that still contained the removed fixed-position rule. Moving only the
  generated `app/.next` cache aside and rebuilding made the same Chromium/WebKit
  geometry regression pass; the webpack production build also used the new layout.
- The final CI-shaped preflight had one unrelated Chromium timeout waiting for the
  existing profile password form. Playwright's configured retry passed the same
  scenario; all policy scenarios passed without a retry and the suite exited zero.
- GitHub Actions on head `e30e4ee` failed before browser execution because the new RU
  Terms test imported the server TypeScript adapter directly; Node 20 exposed it to
  Playwright as CommonJS and could not provide the named export. The application route
  itself was not the failing surface.

### Decisions

- The policies form separate public documents instead of growing the Terms-only
  acceptable-use section. This makes incorporated rules and enforcement procedures
  discoverable and independently updateable while retaining one shared renderer.
- Policy publication does not satisfy PRODUCT-PLAN D5/D6's external legal-review gate
  and does not activate the shared user-import surface.
- The discontinued European Commission ODR platform is removed as a live consumer-
  redress link; the Terms preserve mandatory local court and available ADR rights.
- The landing and standalone-auth entry points now share one legal-footer component;
  policy labels, destinations, order, and test IDs therefore cannot drift between them.
- The legal header reuses the existing `landing` message catalog, and generic legal-page
  controls use the `legalPage` namespace. Each of the three new policies has a full
  Russian document module selected by locale; keeping large legal versions outside the
  general UI catalog makes revisions auditable and prevents partial-string fallback.
- All public legal/reporting mailboxes use the canonical production domain and one source
  of truth. Both domains currently publish MX records, but domain-level routing does not
  prove recipient-level delivery, so the actual aliases still require an operator smoke.
- Feature memory moved to spec 050 because spec 049 landed independently on `main` while
  this PR was under review; keeping both at 049 would violate the spec sequence.
- The updated Terms are published August 13, 2026 and take effect September 15, 2026.
  The July 24 Terms remain effective during the notice period, while every signed-in
  dashboard exposes a localized, non-dismissed notice linked to the updated Terms.
- Privacy contact changes are recorded as an August 13 Privacy Policy revision. Shared
  dates live in `legal/revisions.ts` so the Terms and incorporated policy stack cannot
  advertise conflicting effective dates.
- Terms consent is version-aware. Before `2026-09-15T00:00:00Z`, the canonical route
  serves the July 24 substantive contract with August 13 administrative corrections;
  from that instant it serves the September 15 version. The preview stays available at
  its versioned URL during the notice window, and the same boundary hides the notice.
- Playwright under Node 20 treated a direct cross-workspace `.ts` import as CommonJS,
  even though Node 22 collected it locally. Terms switchover logic therefore lives in
  an actual `.mjs` module with a `.d.mts` declaration: Node 20 can execute it directly,
  while Next.js and TypeScript consume the same named exports without a wrapper.
- Policy revision dates have one ISO source. The Russian policy modules format that
  source for display instead of duplicating date literals that could drift on the next
  revision.
- Advance-notice visibility is resolved in a server-only wrapper after each route has
  entered the shared protected-route layout. The client banner receives only the
  resulting boolean, so a stale device clock cannot disagree with the server's
  canonical Terms switchover.
- All ten verified-session pages live in one URL-transparent `(authenticated)` route
  group. Its layout owns authentication and the cross-cutting notice once; normal-flow
  reserved space keeps the non-dismissible legal notice from covering page controls.
- The protected layout, not each legacy full-height page, owns the viewport boundary.
  Its direct dashboard, journey, and capsule children may shrink below their historical
  `100vh`/`100svh` sizes, keeping scrolling inside the product shell and preventing a
  second document scrollbar while the advance notice is visible.
- Initial notice visibility remains server-only, but the persistent client layout also
  receives the server render instant and canonical effective instant. A monotonic timer
  chunks delays at the browser maximum so the banner retires at the same boundary
  without depending on another server render or trusting the device wall clock.
- Because monotonic time may pause during device sleep, `visibilitychange` and
  `pageshow` trigger a no-store same-origin `HEAD` to the current authenticated route.
  Its server `Date` expires or re-arms the existing timer; a failed probe leaves the
  monotonic fallback active rather than trusting the device wall clock.
- The September 15 Terms are immutable locale-specific contract versions. The preview
  and canonical route ask the same small version adapter for the active locale, including
  metadata, so the RU route cannot silently fall back to the authoritative English body
  after the cutoff.
- Cross-workspace Playwright tests import only the Node-safe `.mjs` Terms boundary, not
  the server TypeScript adapter. That boundary now returns both normalized locale and
  applicable version, while the adapter consumes the same selection for route content.
- A failed resume probe keeps the monotonic timer as a safe fallback, but the browser's
  `online` event immediately retries the same no-store authenticated HEAD request. This
  closes the offline-to-online gap without consulting the device wall clock.
- `readVerifiedAppSession` is one module-scoped React `cache` export. React invalidates
  that cache between Server Component requests, so a protected layout and its page share
  one live `/api/auth/whoami` result without sharing session data between users. Calls
  outside a Server Component request remain uncached, preserving the existing action
  and test behavior.

### Known Issues

- External counsel must validate governing-law, consumer, DSA applicability,
  indemnity, and DMCA eligibility/agent-registration posture before the shared-import
  feature launches.
- Before policy publication, an operator must verify inbound delivery and monitored
  ownership for `support@`, `legal@`, `privacy@`, `dpo@`, and `ip@capsulezero.app`;
  the repository and DNS MX record alone cannot prove recipient-level delivery.
- External counsel should confirm whether explicit reacceptance is required in any
  launch jurisdiction before the September 15 effective instant. Versioned routes and
  automated notice retirement preserve which document applies on either side of it.
- A qualified Russian legal linguist should review the RU safety-policy and future-Terms
  translations together with counsel before publication; the tests establish
  completeness and route selection, not jurisdiction-specific equivalence of legal effect.
