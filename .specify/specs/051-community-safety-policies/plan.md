# Plan 051 — Community Safety Policies

## Approach

Extend the existing legal-page model and shared renderer. The Terms, Community
Guidelines, Copyright & IP Policy, and Enforcement & Appeals Policy operate as one
contract stack, but each policy retains a separate auditable content module. Shared
navigation, revisions, and contacts prevent policy drift.

The September 3, 2026 founder decision removes launch ceremony that no longer serves
the MVP: the current revision is effective now, so there is no future Terms preview,
advance-notice banner, client expiry timer, protected-route wrapper, or server-time
probe. The July 24 Terms remain available at a permanent dated archive route.

The public contact model is similarly collapsed to one founder-monitored address,
`ks@ks-design.art`. This address is a routing endpoint, not a claim that Capsule Zero
has appointed a DPO or separate legal organization.

## Founder Decision — 2026-09-03

1. Use `ks@ks-design.art` for every current legal, privacy, support, copyright,
   counter-notice, report, and appeal request.
2. Do not create role mailboxes for the MVP and do not describe the founder as a DPO.
3. Publish the current legal stack immediately with September 3, 2026 revision dates.
4. Preserve the July 24 Terms exactly as published at
   `/terms-of-use/2026-07-24`; show the current correspondence address outside the
   archived contract, and do not keep a scheduled switchover, notification banner,
   timer, or authenticated-layout complexity.
5. Keep the shared-import/public third-party-content surface disabled. Its future
   compliance-scheme spec and external legal review remain release gates for that
   feature, not for the current MVP.

## Source Baseline

The policy foundation was adapted from authoritative/current public material already
recorded in this feature work:

- Pinterest policy stack: Terms, Community Guidelines, Copyright Policy, Enforcement,
  and Commercial/Branded Content Guidelines (accessed 2026-08-12).
- U.S. Copyright Office Section 512 and designated-agent guidance:
  https://www.copyright.gov/512/
- EU Digital Services Act, including Articles 16, 17, and 20:
  https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- Regulation (EU) 2024/3228 discontinuing the former ODR platform:
  https://eur-lex.europa.eu/eli/reg/2024/3228

The documents qualify jurisdiction-specific mechanisms by applicability and preserve
mandatory consumer rights. They are still subject to external counsel before any
shared third-party-content feature launches.

## Verification

| Contract | Evidence |
|---|---|
| Red-first solo-founder contract | Commit `b45e2e6`; the focused Chromium run failed 5/5 before implementation for the intended route, content, contact, date, and localization gaps. |
| Immutable archive regression | Commit `ea26e19`; the archive scenario failed red because the page reported an August rewrite instead of the July 24 publication snapshot. |
| One monitored legal contact, no DPO claim | `legal-contact-domain.spec.ts` passed in Chromium and mobile WebKit; a source audit found no legacy address or DPO designation in `app/src`. |
| Current EN/RU Terms and permanent July archive | Focused Chromium legal suite passed 13/13; the full suite exercised the same routes in mobile WebKit. |
| Policy completeness and gated-feature negatives | Full Playwright run passed 94 tests with 8 intentional full-stack skips across Chromium and mobile WebKit. |
| Static quality | App lint passed with 95 existing soft warnings; CSS lint passed with 99 existing soft warnings; app and e2e TypeScript checks passed; e2e lint passed with 3 intentional skip warnings. |
| Production compilation | Next.js webpack production build passed and generated all 41 static pages, including canonical EN/RU Terms and the dated archive. |
| Repository/process gates | Feature-memory, repository-baseline, and API-contract/client-generation checks passed. `git diff --check` passed. |
| Backend regression | `go vet ./... && go test ./...` passed for the API module. |
| Dependency security | The first final-head OSV run exposed fixed-version updates for dev-only `browserslist` and `fast-uri`; exact overrides now select 4.28.8 and 3.1.6. npm 10 clean-install validation and `npm audit` pass with zero vulnerabilities; the required GitHub `osv-scan` is green. |
| Merge readiness | Pending required GitHub checks and Codex AI Review on the final PR head. |

## Reuse Check

Checked `app/src/lib/legal-content.ts`, `app/src/components/legal/LegalPage.tsx`, the
existing legal routes, message catalogs, `PublicLegalFooter`, and shared policy modules.
The implementation reuses those units. `legal/contacts.ts` remains the one contact
source and `legal/revisions.ts` remains the one revision source.

The dated July Terms module is retained because an archived contract must stay
auditable and must not be synthesized from current clauses at runtime. The dedicated
RU current Terms module is retained because the binding translation is too large for
the general UI message catalog. The scheduled-boundary modules and notice components
are deleted because their responsibilities no longer exist after immediate publication.
