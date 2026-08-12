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

## Verification

TDD RED (before implementation):
`npm --prefix tests/e2e test -- specs/landing/legal-safety-policies.spec.ts --project=chromium`
failed as intended. All six new EN/RU routes returned `404`; the Terms assertion lacked
the three incorporated policy names; and the landing footer had no safety-policy links.
The earlier symlink-based attempt was discarded because Turbopack rejected external
`node_modules` symlinks before application behavior ran.

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | New EN/RU routes render with legal-page structure | Pending focused Playwright and production-build route output |
| 2 | Terms incorporates the policy stack and protective clauses | Pending focused Playwright copy assertions and source audit |
| 3 | Community content/risk matrix is complete | Pending policy matrix audit against Spec 049 AC-003 |
| 4 | Copyright notice, counter-notice, restoration, and repeat-infringer rules are complete | Pending focused Playwright copy assertions and source audit |
| 5 | Automated/manual/hybrid enforcement and appeals are disclosed | Pending focused Playwright copy assertions and source audit |
| 6 | Landing/legal navigation is discoverable and mobile-usable | Pending focused Chromium + WebKit/iPhone Playwright run |
| 7 | Shared-import and legal-registration gates remain honest | Pending negative copy scan |
| 8 | Repository and app gates pass | Pending `git diff --check`, feature memory, repo baseline, lint, CSS lint, typechecks, build |
| 9 | Current PR head is merge-ready | Pending required GitHub checks and review |

## Reuse Check

Checked `app/src/lib/legal-content.ts`, `app/src/components/legal/LegalPage.tsx`, and the
existing legal routes. The renderer, data model, and route shape are reused. A separate
policy-content module is required because Terms/Privacy already occupy more than 900
lines and the three new documents have distinct policy ownership; duplicating the
renderer or app layout would not fit the established responsibility.
