# Spec 051 — Community Safety Policies

## Goal

Publish the smallest coherent legal-policy foundation needed for the Capsule Zero MVP.
The Terms of Use incorporate dedicated Community Guidelines, Copyright & Intellectual
Property Policy, and Enforcement & Appeals Policy. The stack must protect Capsule Zero
and its users without implying that the gated shared-import surface, a marketplace, or
affiliate monetization is already available.

The operating model is intentionally suitable for a one-person team: one monitored
contact address, `ks@ks-design.art`, handles every public support, privacy, legal, and
IP request. Capsule Zero does not claim to have a Data Protection Officer, completed
DMCA-agent registration, or completed external legal review.

## Scope

### In

- Complete English and Russian Community Guidelines, Copyright & IP Policy, and
  Enforcement & Appeals Policy using the existing legal-document renderer.
- Current English and Russian Terms at the canonical `/terms-of-use` route, effective
  immediately on September 3, 2026 and incorporating the three policy documents.
- Permanent access to the previously effective July 24, 2026 English Terms at
  `/terms-of-use/2026-07-24`.
- A September 3, 2026 Privacy Policy revision that uses the same public contact.
- Complete locale-specific EN and RU Privacy Policy content at the canonical route.
- One public contact source for support, privacy, legal, copyright, notices, and
  appeals: `ks@ks-design.art`.
- Community rules covering IP and counterfeit material; sexual and intimate content;
  child safety; private information; hate, harassment, self-harm, violence and violent
  actors; regulated or dangerous goods; scams and harmful misinformation;
  impersonation; spam and manipulation; commercial disclosures; and platform security.
- Copyright/IP notice and counter-notice requirements, conditional restoration,
  repeat-infringer rules, and matching or standard technical measures where applicable.
- Enforcement disclosures for automated, manual, and hybrid review; removal and
  distribution limits; account restrictions; reasons; appeals; and abusive reports.
- Discoverable legal navigation and landing-footer links in EN and RU.
- An explicit statement that the policies are a foundation only: the shared-import
  surface remains disabled until its compliance-scheme spec and external legal review
  are complete.

### Out

- Activating marketplace-link import, the shared user-import pool, public user uploads,
  affiliate links, payments, or any related schema, API, or storage surface.
- A separate mailbox, alias, or operational queue for each legal topic.
- Designating the founder or Capsule Zero as a Data Protection Officer.
- A future-dated Terms release, countdown, authenticated notice banner, client timer,
  server-time probe, or reacceptance flow for this already-published revision.
- Claiming completed external legal review, U.S. Copyright Office DMCA-agent
  registration, or EU/UK representative appointment.
- Building reporting, moderation, hash matching, CDN purge, provenance, or appeal tools.
  Those operational controls are reconsidered with the gated shared-import feature.
- Russian translation of the archived July 24 Terms; that historical version was
  English-only and remains available as an immutable English record.

## Acceptance Criteria

- **AC-001**: Each new policy route renders a complete locale-specific EN or RU
  document with unique metadata, H1, table of contents, status labels, and related links.
- **AC-002**: Current Terms incorporate all three policies and include user ownership,
  rights warranties, intermediary status, reporting, third-party links, user-content
  disclaimer, retention, enforcement, indemnity, liability, consumer-rights, and
  survival protections.
- **AC-003**: Community Guidelines cover every prohibited-content and prohibited-
  behavior category listed in Scope, including AI-generated or manipulated content.
- **AC-004**: Copyright/IP Policy states complete notice and counter-notice elements,
  expeditious removal, conditional restoration, repeat-infringer consequences, and
  false-report consequences without claiming completed DMCA registration.
- **AC-005**: Enforcement Policy describes automated, manual, and hybrid detection,
  proportionate actions, notice and appeal where appropriate, and abuse controls.
- **AC-006**: The shared legal footer and legal-page navigation expose all policy routes
  in the active locale without dead links and remain usable at mobile width.
- **AC-007**: No policy represents the shared-import pool, affiliate program,
  marketplace, or payments as available; no implementation contract for those features
  is added.
- **AC-008**: Every current public legal document displays only `ks@ks-design.art` for
  support, privacy, legal, IP, copyright, report, notice, counter-notice, and appeal
  contact purposes. No legacy Capsule Zero mailbox remains.
- **AC-009**: No current public legal document calls Capsule Zero or the founder a Data
  Protection Officer; Privacy identifies a controller/contact instead.
- **AC-010**: Canonical EN and RU Terms display the current incorporated policy stack,
  with September 3, 2026 as both effective and last-updated date.
- **AC-011**: `/terms-of-use/2026-07-24` permanently renders only the previous July 24,
  2026 English contract content that was actually visible when published, while a
  separate localized archive notice
  points current correspondence to `ks@ks-design.art`; signup and footer links target
  the current canonical Terms.
- **AC-012**: The current EN and RU Privacy Policy displays September 3, 2026 as both
  effective and last-updated date, with locale-specific substantive content.
- **AC-013**: App lint, CSS lint, TypeScript checks, production build, focused
  Playwright coverage, repository baseline, feature-memory guard, and required GitHub
  checks pass at the final PR head.

## Negative Scenarios

- A policy must not say that Capsule Zero owns user content merely because it is
  uploaded or shared.
- A policy must not promise universal content review or imply that the gated
  shared-import surface is active.
- A counter-notice must not trigger restoration when the reporting party timely shows
  an applicable court or Copyright Claims Board action.
- Consumer rights and liabilities that cannot lawfully be excluded must remain carved
  out from disclaimers, indemnity, governing-law, and liability limitations.
- A request concerning one legal topic must not be routed to an unmonitored specialist
  mailbox or to a person described as a DPO.

## TDD Posture

The original policy routes and policy-content assertions were committed red before
implementation. Review follow-ups likewise introduced red-first coverage for localized
navigation, production contacts, visible incorporation, Terms versioning, complete RU
documents, and authenticated-notice behavior.

The solo-founder simplification is covered by commit `b45e2e6`: before implementation,
five focused Chromium scenarios failed because the canonical Terms still served the
July contract, the archive route did not exist, current documents exposed legacy
mailboxes and DPO wording, dates were stale, and canonical RU Terms remained English.
The implementation removes the now-obsolete scheduled-notice tests and application
surface rather than preserving machinery for a rollout date that no longer exists.
Commit `ea26e19` adds the red-first regression for Codex's immutable-archive finding:
the archive still showed an August administrative rewrite and did not preserve the
published July domain and contact constants before the fix.
Commit `b01a176` adds red-first coverage for the final review: before implementation,
the archive exposed intro copy absent from the July renderer and Privacy still claimed
that EU/UK representatives had already been appointed.
Commit `0c099f5` adds the red-first RU Privacy contract: the Russian route still rendered
the English title and body before the locale-specific document was wired.
Commit `38fe42d` adds a compile-red contract requiring RU Privacy dates to come from the
dedicated Privacy revision rather than the independently versioned safety-policy dates.
