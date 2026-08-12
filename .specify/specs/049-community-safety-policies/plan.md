# Plan 049 — Community Safety Policies

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
still used English labels, commit `dea4a5e` added the locale assertion first. The focused
Chromium run failed on `/ru/community-guidelines` with received text
`TermsPrivacyCommunityCopyrightEnforcement`, then passed after the navigation began
resolving the existing EN/RU message catalog. The same review's DRY finding is handled
by one `PublicLegalFooter` shared by the landing and standalone-auth pages.

| #   | Acceptance criterion                                                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | New EN/RU routes render with legal-page structure                                      | Combined focused Chromium + WebKit/iPhone suite: 6/6 passed with CI's two-worker posture; production build emitted all six static policy routes                                                                                                                                                                                                                          |
| 2   | Terms incorporates the policy stack and protective clauses                             | Focused Terms assertions passed; source audit confirmed responsibility, rights warranty, intermediary, report, third-party, disclaimer, retention, enforcement, indemnity, liability-cap, consumer, and survival clauses                                                                                                                                                 |
| 3   | Community content/risk matrix is complete                                              | `rg` matrix audit covered IP/counterfeit, intimate/child/privacy, hate/harassment/self-harm, dangerous/regulated/violent, scams/misinformation/impersonation, spam/commercial, security, reporting, and enforcement sections                                                                                                                                             |
| 4   | Copyright notice, counter-notice, restoration, and repeat-infringer rules are complete | Focused assertions passed for `10 to 14 business days`, `repeat-infringer policy`, `standard technical measures`, and `misrepresentation`; source audit covered all notice/counter-notice elements                                                                                                                                                                       |
| 5   | Automated/manual/hybrid enforcement and appeals are disclosed                          | Focused assertions passed for review modes, distribution limits, statements of reasons, and report/appeal abuse; source audit covered action and redress paths                                                                                                                                                                                                           |
| 6   | Shared footer/legal navigation is discoverable, localized, and mobile-usable           | `PublicLegalFooter` is the sole landing/auth footer implementation; focused Chromium navigation/localization suite passed 5/5, and the RU-label plus footer-navigation follow-up passed 4/4 across Chromium + WebKit/iPhone, including three destinations with no dead anchor                                                                                            |
| 7   | Shared-import and legal-registration gates remain honest                               | Negative Playwright assertions and copy scan found no ownership transfer or current-feature claim; Copyright Policy expressly disclaims completed agent registration/legal review                                                                                                                                                                                        |
| 8   | Repository and app gates pass                                                          | `git diff --check`, feature memory, repo baseline, API contract, app/e2e lint, CSS lint, both typechecks, app unit hook, Go vet/tests, and production build passed; full CI-shaped browser suite: 84 passed / 8 environment-dependent skipped; lint gates retained the repository's warning-only baseline |
| 9   | Current PR head is merge-ready                                                         | PR #98 is open and ready for review; required GitHub checks and human review remain pending                                                                                                                                                                                                                                                                              |

## Reuse Check

Checked `app/src/lib/legal-content.ts`, `app/src/components/legal/LegalPage.tsx`, the
existing legal routes, and both prior landing/auth footer implementations. The renderer,
data model, route shape, message catalog, and one new `PublicLegalFooter` abstraction are
reused. A separate policy-content module is required because Terms/Privacy already occupy
more than 900 lines and the three new documents have distinct policy ownership;
duplicating the renderer or app layout would not fit the established responsibility.

The existing `legal-content.ts` remains above the TypeScript module-size soft trigger;
this change limits its growth to the Terms clauses that must live in the binding core
contract and puts all three new policy documents in responsibility-specific modules.
