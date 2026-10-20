# Spec 056 — Honest profile data and sessions

## Goal

Remove fabricated session entries and personal profile defaults without deleting genuine saved values.

## Scope

Reuse the profile snapshot, form, cookie preferences, API provider, Go profile handler/repository and OpenAPI contract. AuthPort exposes current-session verification but no device/session inventory; show a localized unavailable state with no inferred device, location, activity or current badge. Keep existing user-bound cookie storage for fields not yet supported by the profile API. No historical data migration by value matching.

## Acceptance Criteria

- AC-001: New profiles leave DOB, phone, country, city and all sizes empty; unrelated saves never introduce sample values.
- AC-002: Account sessions display an honest unavailable state, without fabricated entries or current badge, in EN and RU.
- AC-003: Explicitly saved values survive reload, including values identical to the removed defaults; other users cannot read those cookie preferences.
- AC-004: Clearing optional fields survives save/reload. PATCH country/city accepts trimmed empty strings to clear; omission preserves values and null remains invalid.
- AC-005: Provider failures do not persist cookie changes or report a successful save.

## Negative Scenarios

Unknown session inventory must never become invented devices. Empty saves must not persist defaults. Cross-user cookies must be ignored. Null, invalid locale, oversized fields and invalid avatar URLs remain rejected.
