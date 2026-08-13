# Spec 050 — Community Safety Policies

## Goal

Publish a coherent user-content policy layer for Capsule Zero before any shared
user-import surface can launch. The Terms of Use must incorporate dedicated
Community Guidelines, Copyright & Intellectual Property Policy, and Enforcement &
Appeals Policy. Together they must allocate responsibility for user content, reserve
the moderation and account-enforcement rights needed to protect Capsule Zero and its
users, and expose notice, counter-notice, appeal, and repeat-infringer rules.

The policy language is adapted to Capsule Zero's wardrobe, image-upload, catalog,
semantic-search, and future shared-import context. It must not imply that the gated
shared user-import pool, affiliate monetization, or a marketplace is operating today,
and it does not replace the external legal review required by PRODUCT-PLAN D5/D6.

## Scope

### In

- Complete English and Russian documents at `/community-guidelines`,
  `/copyright-policy`, and `/enforcement-policy`, rendered by the existing
  legal-document component with localized metadata and page chrome.
- Terms of Use updates that incorporate those policies, retain user ownership,
  require rights and lawful-content warranties, describe Capsule Zero as an
  intermediary for user-submitted content, and reserve moderation, retention,
  third-party-link, disclaimer, liability, indemnity, and termination protections.
- Community rules covering IP and counterfeit material; sexual and intimate content;
  child safety; private information; hate, harassment, self-harm, violence and violent
  actors; regulated or dangerous goods; scams and harmful misinformation;
  impersonation; spam and manipulation; commercial disclosures; and platform security.
- Copyright/IP notice requirements, counter-notice requirements, a 10–14-business-day
  restoration window where the DMCA applies, a reasonably implemented repeat-infringer
  policy, and support for matching or standard technical measures where applicable.
- Enforcement disclosure for automated, manual, and hybrid review; removal and
  distribution limits; account/domain restrictions; reports; statements of reasons;
  appeals; and action against abusive reports or appeals.
- Discoverable legal navigation and landing-footer links in EN and RU.
- One canonical contact source for all public policy, privacy, support, DPO, and IP
  mailboxes on the production `capsulezero.app` domain; no policy may publish a
  `capsulezero.com` mailbox.
- A visible Terms introduction that incorporates the policy stack, a future effective
  date for this material update, and an in-product advance-notice banner for signed-in
  users throughout the notice period. The previously effective Terms remain binding
  until the new date.
- Explicit Terms versioning: the canonical consent/footer route resolves to the July 24
  governing version before September 15 and to the new version from that UTC effective
  instant; the future version remains directly reviewable during the notice period.
- A current Privacy Policy revision date for the public privacy/DPO contact change.
- Removal of the obsolete European Commission ODR-platform link from the existing
  Terms while preserving applicable local-court and alternative-redress rights.
- Source-grounded policy notes and a launch/legal-review checklist in feature memory.

### Out

- Activating marketplace-link import, the shared user-import pool, public user uploads,
  affiliate links, payments, or any new schema/API/storage surface.
- Claiming that Capsule Zero has completed U.S. Copyright Office DMCA-agent
  registration, EU/UK representative appointment, or external legal approval unless
  separately verified.
- Building the report form, moderation console, hash blacklist, CDN purge, provenance
  ledger, or appeal workflow. Those operational controls remain prerequisites for the
  future shared-import implementation.
- Translating the pre-existing July 24 Terms or Privacy Policy. This scope delivers
  complete EN/RU versions of the three newly introduced safety-policy documents;
  translation of the pre-existing core contracts remains a separate legal-review task.

## Acceptance Criteria

- **AC-001**: Each of the three new legal routes renders a complete locale-specific EN
  or RU document with a unique H1, metadata, table of contents, status labels, and links
  to the other policy documents.
- **AC-002**: Terms expressly incorporates Community, Copyright/IP, and Enforcement
  policies and contains the user responsibility, rights warranty, intermediary,
  reporting, third-party-link, user-content disclaimer, retention, enforcement,
  indemnity, liability-cap, consumer-rights, and survival protections in scope.
- **AC-003**: Community Guidelines cover every prohibited-content and prohibited-
  behavior category listed in Scope and apply to private, public, linked, metadata,
  comment, message, and AI-generated or manipulated content.
- **AC-004**: Copyright/IP Policy publishes complete notice and counter-notice elements,
  explains expeditious removal, the conditional 10–14-business-day restoration period,
  repeat-infringer strikes/termination, and good-faith/false-report consequences.
- **AC-005**: Enforcement Policy describes automated, manual, and hybrid detection and
  proportionate actions, notice and appeal where appropriate, report-abuse controls,
  and the distinction between illegal-content action and policy action.
- **AC-006**: A shared public legal footer and the legal-document navigation make all
  policies discoverable without dead anchors, use the active locale for navigation
  labels, and remain usable at mobile width.
- **AC-007**: No policy represents the gated shared-import pool, affiliate program,
  marketplace, or payment flow as currently available, and no page claims completed
  external legal review or DMCA-agent registration.
- **AC-008**: The app lint, CSS lint, TypeScript checks, production build, focused
  Playwright suite, repository baseline, and feature-memory guard pass.
- **AC-009**: Terms, Privacy, Community, Copyright/IP, and Enforcement publish only
  `@capsulezero.app` contact points from one shared source and contain no
  `@capsulezero.com` address.
- **AC-010**: The Terms incorporation paragraph is visible in the rendered legal
  article rather than existing only in the document data model.
- **AC-011**: The material Terms update is published on August 13, 2026, takes effect
  on September 15, 2026, preserves the July 24, 2026 Terms until then, and gives
  signed-in users localized in-product advance notice with a link to the updated Terms.
- **AC-012**: The Privacy Policy identifies August 13, 2026 as its last-updated and
  effective date after the public privacy/DPO contact revision.
- **AC-013**: Before September 15, `/terms-of-use` displays the July 24 governing Terms
  (with August 13 administrative contact/domain/obsolete-ODR corrections), while
  `/terms-of-use/2026-09-15` exposes the complete future policy stack and the signup
  consent link continues to target the applicable canonical route.
- **AC-014**: At `2026-09-15T00:00:00Z`, the canonical Terms resolver switches to the
  new version and the signed-in advance-notice component stops rendering, including
  when a user keeps the persistent protected layout open across that instant without
  reloading or navigating away, or resumes a suspended tab after the instant.
- **AC-015**: The advance notice is mounted once by the protected-route layout and
  occupies reserved document flow space, so it cannot cover authenticated navigation,
  language, or primary-action controls at desktop or mobile widths. Dashboard,
  guided-journey, and capsule-result shells fit the remaining viewport instead of
  creating a second document scrollbar around their existing internal scrollers.

## Negative Scenarios

- A policy must not say that Capsule Zero owns user content merely because it is
  uploaded or shared.
- A policy must not promise that all content is reviewed before or after publication,
  or restrict human review to complaints only.
- A counter-notice must not trigger restoration when the reporting party timely shows
  that it has filed the applicable court or Copyright Claims Board action.
- Consumer rights and liabilities that cannot lawfully be excluded must remain carved
  out from disclaimers, indemnity, governing-law, and liability limitations.
- The policy routes must not activate or create implementation contracts for the gated
  shared-import feature.

## TDD Posture

The new route, navigation, and required-copy assertions are committed and run red before
implementation. The follow-up RU legal-navigation and production-contact-domain
regression assertions are likewise committed red before their implementations. The
review-driven legal-rollout regressions are also committed red before implementation:
they cover the invisible incorporation paragraph, stale Privacy revision date, missing
signed-in Terms notice, unavailable governing version, and unbounded notice lifetime.
The latest review-follow-up regression requires substantive RU text in all three new
policies and first failed when `/ru/community-guidelines` still rendered the English
H1. The same red commit reproduced the CI-only ESM/CommonJS loader failure in the Terms
boundary test before the helper exposed a compatible module entry point.
The final review-follow-up regression first failed because the fixed advance notice
ended at vertical position 268 while the dashboard actions began at position 30. The
implementation then moved the notice into one protected-route layout and reserved
layout space above every authenticated page.
The subsequent full-height-shell regression first measured a document height of 914px
inside a 720px viewport on `/en/guided-journey`. The protected layout now owns the
viewport height and lets dashboard, journey, and capsule shells shrink into its
remaining flex space; the same bound passes in Chromium and mobile WebKit.
The persistent-layout expiry regression then kept an authenticated dashboard mounted,
advanced its controlled clock by 60 days, and first observed that the notice remained
visible. The server now passes both its render instant and the authoritative effective
instant to a client expiry timer, so the notice retires without a reload in both
browser engines while initial visibility remains a server decision.
The suspend/resume follow-up regression then supplied an after-cutoff server `Date`
when the visible tab resumed and first observed that the notice remained visible. The
client now revalidates against that authoritative response on `visibilitychange` and
`pageshow`; both notice spec files were also split to stay below five cases each.
Policy drafting and feature-memory changes are documentation work, but the public
Next.js route behavior follows the application-code TDD contract.
