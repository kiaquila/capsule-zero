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

## Process Memory

### Dead Ends

- A focused local Playwright run with five workers exposed a Next.js 16 development-
  cache race that appended duplicate bytes to `.next/dev/prerender-manifest.json` and
  produced unrelated 500 responses. Moving the disposable cache aside and rerunning
  serially made the same Chromium and WebKit/iPhone matrix pass. The production webpack
  build also generated all routes successfully.
- The final CI-shaped preflight had one unrelated Chromium timeout waiting for the
  existing profile password form. Playwright's configured retry passed the same
  scenario; all policy scenarios passed without a retry and the suite exited zero.

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
- The legal header reuses the existing `landing` message catalog. The authoritative
  policy body remains English on both locale routes until a separately reviewed legal
  translation exists, as declared in Scope.
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

### Known Issues

- External counsel must validate governing-law, consumer, DSA applicability,
  indemnity, and DMCA eligibility/agent-registration posture before the shared-import
  feature launches.
- Before policy publication, an operator must verify inbound delivery and monitored
  ownership for `support@`, `legal@`, `privacy@`, `dpo@`, and `ip@capsulezero.app`;
  the repository and DNS MX record alone cannot prove recipient-level delivery.
- Keep the signed-in Terms notice visible through September 15, 2026. Any later removal
  or replacement must preserve evidence of the notice period and the applicable Terms
  version; external counsel should confirm whether explicit reacceptance is required in
  any launch jurisdiction before the effective date.
