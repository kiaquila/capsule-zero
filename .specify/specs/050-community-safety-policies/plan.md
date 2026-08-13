# Plan 050 — Community Safety Policies

## Approach

Extend the existing legal-page system instead of introducing a parallel renderer. Keep
the new policy content in a dedicated module so the already-large Terms/Privacy source
does not absorb three additional responsibilities. Add three static routes, make them
discoverable from the shared legal header and landing footer, and preserve the current
glass visual language.

Treat the policies as one contract stack:

1. Terms incorporate the policies and allocate rights, responsibility, disclaimers,
   liability, indemnity, retention, and termination effects.
2. Community Guidelines define prohibited content and conduct for Capsule Zero.
3. Copyright & IP Policy defines rights-holder notice, counter-notice, repeat-infringer,
   and matching-measure processes.
4. Enforcement & Appeals explains detection methods, available actions, reasons,
   reports, appeals, and abuse controls.

The source model is Pinterest's current public policy stack, adapted rather than copied.
U.S. DMCA mechanics are checked against the U.S. Copyright Office; EU notice-and-action
and redress mechanics are checked against the official Digital Services Act sources.
All statutory language is qualified by applicability and mandatory local law.

## Source Baseline (accessed 2026-08-12)

- Pinterest Terms of Service (effective 2025-04-30):
  https://policy.pinterest.com/en-gb/terms-of-service
- Pinterest Community Guidelines (updated 2026-05):
  https://policy.pinterest.com/en/community-guidelines
- Pinterest Copyright Policy:
  https://policy.pinterest.com/en/copyright
- Pinterest Enforcement practices:
  https://policy.pinterest.com/en/enforcement
- Pinterest Commercial and Branded Content Guidelines:
  https://policy.pinterest.com/en/commercial-and-branded-content-guidelines
- U.S. Copyright Office, Section 512 and designated-agent guidance:
  https://www.copyright.gov/512/
  https://www.copyright.gov/dmca-directory/faq.html
- EU Digital Services Act, Regulation (EU) 2022/2065, especially Articles 16, 17,
  and 20:
  https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- Regulation (EU) 2024/3228 discontinuing the former European Online Dispute
  Resolution Platform and repealing Regulation (EU) No 524/2013 from 2025-07-20:
  https://eur-lex.europa.eu/eli/reg/2024/3228

## Verification

TDD RED (before implementation):
`npm --prefix tests/e2e test -- specs/landing/legal-safety-policies.spec.ts --project=chromium`
failed as intended. All six new EN/RU routes returned `404`; the Terms assertion lacked
the three incorporated policy names; and the landing footer had no safety-policy links.
The earlier symlink-based attempt was discarded because Turbopack rejected external
`node_modules` symlinks before application behavior ran.

Review follow-up RED: after Codex review identified that legal navigation on `/ru/*`
still used English labels, commit `a125571` added the locale assertion first. The focused
Chromium run failed on `/ru/community-guidelines` with received text
`TermsPrivacyCommunityCopyrightEnforcement`, then passed after the navigation began
resolving the existing EN/RU message catalog. The same review's DRY finding is handled
by one `PublicLegalFooter` shared by the landing and standalone-auth pages.

Contact-domain follow-up RED: Codex review found that public reporting addresses used
`capsulezero.com` while the repository's production and verified sender identity uses
`capsulezero.app`. DNS inspection on 2026-08-13 found MX records for both domains, so
the review's implied absence of `.com` mail routing was not independently established;
nevertheless, publishing a second domain creates avoidable identity and operations
ambiguity. Commit `a8ab2f7` therefore asserts one production-domain contract across all
five legal documents and failed against the `.com` copy before implementation. The
implementation centralizes every address in `legal/contacts.ts` and uses `.app` only.

Legal-rollout follow-up RED: Codex review found that the Terms incorporation paragraph
existed in `document.intro` but the shared renderer never displayed it, that the material
Terms update was already effective rather than announced in advance, and that the
Privacy Policy retained its old revision date after the privacy/DPO contact change.
Commit `29f85f5` added the regression first. The focused Chromium run failed exactly on
the missing incorporation paragraph, stale July 24 Privacy date, and absent signed-in
notice. It then passed 3/3 after the renderer exposed the introduction, the shared
revision source set publication to August 13 and effectiveness to September 15, and the
dashboard reused the existing notification-banner pattern for localized advance notice.

Terms-versioning follow-up RED: the next Codex review found that the future Terms had
replaced the still-governing July 24 contract at the canonical/signup URL and that the
advance notice had no expiry. Commit `d9afc4e` added route, consent-link, version-resolver,
and notice-window assertions first; the focused run failed before collecting tests
because the required version APIs did not exist. The implementation preserves the
current substantive contract in a dedicated version module, keeps its corrected
administrative contacts/domain and obsolete-ODR statement current, exposes the future
version at `/terms-of-use/2026-09-15`, and uses one UTC resolver for both the canonical
route switchover and the notice cutoff.

Full-RU-policy follow-up RED: review of head `124b890` found that the three new `/ru/*`
policy routes still exposed authoritative English bodies. Commit `ec004d7` first made
the policy matrix require distinct Russian H1s and substantive safety, IP, enforcement,
and appeal language; Chromium received `Community Guidelines` instead of `Правила
сообщества`. The same red commit reproduced CI's inability to import the Terms boundary
helper through the app alias. The implementation adds complete responsibility-specific
RU documents, locale-aware metadata/document selection, localized shared legal chrome,
and a shared Terms-version boundary.

Node-20/revision follow-up: CI on head `f1a73d3` rejected the cross-workspace `.ts`
helper import with `SyntaxError: Unexpected token 'export'`, while Codex review found
that the Russian documents duplicated their displayed revision dates. The boundary is
now a real ESM `.mjs` module with a colocated `.d.mts` type contract, so Next.js and the
Node 20 Playwright loader execute the same implementation. Russian display dates are
formatted from the shared ISO publication/effective values instead of being copied into
each policy. Node 20 collected the Terms test and the focused Chromium policy matrix
passed 7/7; the webpack production build completed without import warnings.

Authenticated-notice follow-up RED: review of head `6d9a5ae` found that only the
dashboard mounted the advance notice and that its cutoff used the browser clock.
Commit `ebb25f8` first set the browser clock beyond effectiveness and required the
notice on direct dashboard, wardrobe, profile, and capsule-result entries; the notice
was absent on the first assertion. A shared server component now resolves visibility
from server time after authentication and wraps every route that reads the verified
session. The Node 20 EN/RU policy matrix passed 16/16 across Chromium and mobile WebKit.

| #   | Acceptance criterion                                                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | New EN/RU routes render complete localized policy documents                            | Review-follow-up Chromium matrix passed all six routes with distinct EN/RU H1s and substantive required copy; production build emitted all six static policy routes with locale-specific metadata                                                                                                                                                                      |
| 2   | Terms incorporates the policy stack and protective clauses                             | Focused Terms assertions passed; source audit confirmed responsibility, rights warranty, intermediary, report, third-party, disclaimer, retention, enforcement, indemnity, liability-cap, consumer, and survival clauses                                                                                                                                                 |
| 3   | Community content/risk matrix is complete                                              | `rg` matrix audit covered IP/counterfeit, intimate/child/privacy, hate/harassment/self-harm, dangerous/regulated/violent, scams/misinformation/impersonation, spam/commercial, security, reporting, and enforcement sections                                                                                                                                             |
| 4   | Copyright notice, counter-notice, restoration, and repeat-infringer rules are complete | Focused assertions passed for `10 to 14 business days`, `repeat-infringer policy`, `standard technical measures`, and `misrepresentation`; source audit covered all notice/counter-notice elements                                                                                                                                                                       |
| 5   | Automated/manual/hybrid enforcement and appeals are disclosed                          | Focused assertions passed for review modes, distribution limits, statements of reasons, and report/appeal abuse; source audit covered action and redress paths                                                                                                                                                                                                           |
| 6   | Shared footer/legal navigation is discoverable, localized, and mobile-usable           | `PublicLegalFooter` is the sole landing/auth footer implementation; focused Chromium navigation/localization suite passed 5/5, and the RU-label plus footer-navigation follow-up passed 4/4 across Chromium + WebKit/iPhone, including three destinations with no dead anchor                                                                                            |
| 7   | Shared-import and legal-registration gates remain honest                               | Negative Playwright assertions and copy scan found no ownership transfer or current-feature claim; Copyright Policy expressly disclaims completed agent registration/legal review                                                                                                                                                                                        |
| 8   | Repository and app gates pass                                                          | Final `CI=1 npm run preflight` passed on the localized head: feature memory, repo baseline, API contract, app/e2e lint, CSS lint, both typechecks, production build (41 routes), and browser suite (96 passed, 8 environment-dependent skipped); warning-only lint baselines remained non-blocking. The Node 20 compatibility follow-up also passed app/e2e typechecks, a warning-free production build, test collection, and the focused policy matrix (7/7) |
| 9   | Public legal contacts use one production-domain source                                 | Focused Chromium contact-domain scenario passed across Terms, Privacy, Community, Copyright/IP, and Enforcement after first failing on `.com`; source scan finds no public legal address outside `legal/contacts.ts`                                                                                                                                                     |
| 10  | Incorporated policy terms are visible to users                                        | Review-follow-up Chromium assertion first failed because `document.intro` was not rendered, then passed after `LegalPage` exposed the introduction inside the legal article                                                                                                                                                                                              |
| 11  | Material Terms update receives advance notice                                         | Terms display publication date August 13, 2026 and future effective date September 15, 2026; signed-in flows passed for the localized notice and Terms link on direct dashboard, wardrobe, profile, and capsule-result entries even when the browser clock is beyond effectiveness; one server-time wrapper covers all ten routes that read the verified session; copy preserves the July 24 version until effectiveness |
| 12  | Privacy contact revision is dated                                                     | Focused Chromium assertion first received July 24, then passed with August 13, 2026 as both last-updated and effective dates                                                                                                                                                                                                                                             |
| 13  | Governing and future Terms remain separately accessible                               | Focused Chromium flow passed for July 24 effectiveness at the canonical route, September 15 effectiveness at the versioned preview, signup consent targeting the canonical applicable route, and the dashboard notice targeting the preview                                                                                                                            |
| 14  | Canonical Terms and notice switch at effectiveness                                     | Deterministic boundary assertions pass immediately before and at `2026-09-15T00:00:00Z`: the resolver changes from `2026-07-24` to `2026-09-15` and the advance-notice predicate changes from true to false                                                                                                                                                                |
| 15  | New policy bodies and shared legal chrome are localized                                | Focused Chromium first failed on the English RU H1, then passed with Russian required-copy checks for AI content, child safety, IP/counterfeit, spam, notice/counter-notice, repeat infringement, technical measures, review modes, distribution limits, reasons, and report/appeal abuse; shared meta, contents, introduction, related-document, and home labels resolve through the active message catalog; RU revision labels derive from the shared ISO revision values |
| 16  | Current PR head is merge-ready                                                         | PR #98 is open and ready for review; required GitHub checks and human review remain pending                                                                                                                                                                                                                                                                              |

## Reuse Check

Checked `app/src/lib/legal-content.ts`, `app/src/components/legal/LegalPage.tsx`, the
existing legal routes, and both prior landing/auth footer implementations. The renderer,
data model, route shape, message catalog, and one new `PublicLegalFooter` abstraction are
reused. The duplicated legal contact literals were replaced with one `legal/contacts.ts`
source because neither prior content module can safely own values consumed by the other.
A new `TermsUpdateNotice` composes the existing `NotificationBanner` and dashboard ghost
action rather than creating a second alert or CTA pattern. One server-only
`AuthenticatedTermsNotice` owns authoritative visibility for all verified-session
routes rather than duplicating browser-clock checks across feature shells. One `legal/revisions.ts`
source prevents effective dates from drifting between Terms and incorporated policies.
A dedicated July 24 Terms module is required to preserve the contract that governs the
notice period; it is 437 lines because a legal version must remain immutable and
auditable rather than being synthesized from the future contract at runtime. Shared
version selection stays in the small `terms-versions.ts` adapter.
A separate policy-content module is required because Terms/Privacy already occupy more
than 900 lines and the three new documents have distinct policy ownership; duplicating
the renderer or app layout would not fit the established responsibility.

Each Russian document mirrors one responsibility-specific English module rather than
placing hundreds of legal strings in the general UI message catalog; one small
`policy-documents.ts` adapter selects the correct immutable document for each locale.

The existing `legal-content.ts` remains above the TypeScript module-size soft trigger;
this change limits its growth to the Terms clauses that must live in the binding core
contract and puts all three new policy documents in responsibility-specific modules.
