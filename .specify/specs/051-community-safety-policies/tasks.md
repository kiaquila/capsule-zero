# Tasks 051 — Community Safety Policies

## Tasks

- [x] T001 Recheck the policy source baseline and write the initial red-first route and
      required-copy coverage.
- [x] T002 Add EN/RU Community, Copyright/IP, and Enforcement documents through the
      existing legal renderer and shared navigation.
- [x] T003 Incorporate the policy stack into Terms and add user-content protections.
- [x] T004 Add red-first follow-ups for localization, contact consistency, Terms
      versioning, RU completeness, and review findings.
- [x] T005 Keep the shared-import surface disabled and record its separate compliance
      and external-review gates.
- [x] T006 Add the solo-founder red-first contract in commit `b45e2e6`.
- [x] T007 Replace all current legal/support contacts with `ks@ks-design.art` and remove
      DPO designation language.
- [x] T008 Publish the September 3 revision immediately at canonical EN/RU Terms and
      Privacy routes.
- [x] T009 Preserve the previous Terms at `/terms-of-use/2026-07-24`.
- [x] T010 Remove the obsolete scheduled Terms boundary, advance-notice UI, protected-
      route wrapper, session deduplication, timer/probe styles, messages, and tests.
- [x] T011 Run focused and full local verification and record final evidence in
      `plan.md`.
- [x] T012 Push the implementation head, update the PR description, and request Codex review from
      the founder account.
- [x] T013 Preserve the superseded Terms as an exact immutable snapshot and render the
      current founder contact separately in the archive route.
- [x] T014 Suppress intro text that the July renderer never published and remove the
      stale Privacy claim that EU/UK representatives are already appointed.
- [x] T015 Publish the complete current Privacy Policy in Russian and add all new legal
      navigation labels to the canonical UI-copy document.

## Process Memory

### Dead Ends

- A future-dated September Terms rollout accumulated a version resolver, preview route,
  authenticated route group, notification banner, timers, tab-resume/network probes,
  and session deduplication. Once the founder chose immediate publication, keeping that
  machinery increased MVP risk without protecting a remaining product requirement.
- Separate `support@`, `legal@`, `privacy@`, `dpo@`, and `ip@` addresses created an
  operational verification burden for a one-person team. MX records do not prove that
  individual recipients are configured or monitored.
- Prior local focused runs exposed disposable Next development-cache races. Generated
  `.next` state may be removed and rebuilt; production compilation is the authoritative
  route-generation check.
- The local npm 11 lockfile writer removed optional bundled entries still validated by
  CI's npm 10, causing `npm ci` to report two missing `@emnapi` packages. Regenerating
  the lock with npm 10 preserved the fixed overrides and restored clean-install parity.

### Decisions

- The September 3, 2026 founder decision makes `ks@ks-design.art` the single monitored
  public address for every current legal/support topic.
- Capsule Zero identifies a privacy controller/contact but does not claim a DPO
  appointment. A future statutory need can be addressed when scale, processing, or
  jurisdiction makes it applicable.
- Capsule Zero does not claim an EU/UK representative appointment; if one becomes
  legally required, it must be appointed and published before the relevant activity.
- The policy stack is current immediately. Canonical EN/RU Terms carry the September 3
  revision; the previously effective English Terms have the permanent dated archive.
- The app no longer carries future-boundary or notice lifecycle code. Authenticated
  product routes return to their original route shape and session behavior.
- Public policy documents provide legal rules and reporting instructions, but do not
  activate public third-party content. The shared-import feature still requires its own
  compliance-scheme spec and external legal review before implementation/launch.
- Community, Copyright/IP, and Enforcement remain separate documents so users can find
  the rules and Capsule Zero can revise each responsibility without duplicating its
  renderer or navigation.
- Legal contacts and revision dates remain centralized sources of truth.
- The required OSV gate disclosed new advisories in two dev-only transitive packages.
  The refreshed `main` supplies the final tested overrides at fixed `browserslist
  4.28.7` and `fast-uri 3.1.6`; no advisory suppression was added.

### Known Issues

- External counsel must validate governing-law, consumer, DSA applicability,
  indemnity, translation, and DMCA posture before the shared-import/public third-party-
  content surface launches.
- U.S. DMCA designated-agent registration, EU/UK representative appointments, and
  operational moderation/reporting tooling are not claimed or implemented.
- The archived July 24 Terms are English-only; the current binding Terms and all new
  safety policies are available in EN and RU.
- Historical addresses remain inside that immutable archive because they were part of
  the published contract. A separate localized notice routes all current correspondence
  to `ks@ks-design.art`; current legal documents contain no retired mailbox.
- The founder must keep `ks@ks-design.art` monitored while it is the published contact.
