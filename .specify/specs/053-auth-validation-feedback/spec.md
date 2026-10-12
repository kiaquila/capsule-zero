# 053 — Auth validation feedback

## Goal

Explain password-policy failures in EN/RU and protect valid short personal names across active contracts.

## Scope

In scope: existing registration/recovery/password-change paths and auth forms, shared schemas/actions and error-code map, Go auth and Kratos adapter, optional registration name contract, identity schema and existing API contract gate, profile regressions and affected documentation.
Out of scope: username policy changes, additional Telegram feedback, production account creation, password-policy weakening, frozen Supabase provider, monetization and import surfaces.

## Acceptance Criteria

- AC-001: A password containing `_` is accepted when otherwise valid. The reported identifier-matching password remains rejected for similarity, with a specific localized explanation; minimum length and other password-policy rejections receive stable safe codes.
- AC-002: Registration visibly explains the eight-character minimum, allowed symbols (including `_`) and email-similarity rule before submission. Invalid email, short password and mismatch retain localized field errors; unknown/duplicate-account failures remain generic and never echo upstream text.
- AC-003: Personal first/last names and optional registration names accept one or two Unicode characters, including `Ян`. Explicit empty/whitespace names are rejected; omitted registration name remains valid. Existing name length limits, username rules and EN/RU scope remain intact.
- AC-004: API/OpenAPI/identity schema agree on optional registration name (1–80 Unicode characters after trimming, nonblank) and password error codes; shared client/server form schemas and localization maps have regression coverage.

## Negative Scenarios

Identifier-matching password, short password, mismatched confirmation, invalid email, duplicate identity and unknown upstream errors, explicit empty/whitespace/null registration name, blank profile names and over-limit names must not be accepted or expose sensitive values.

## Investigation

On fresh origin/main `2a1862d`, no three-character minimum exists for personal names. The only such rule in active profile code is the separate Latin username (3–30). First/last names already use trim + min(1). Preserve that rule and add regression coverage rather than relax username policy.

Isolated in-memory `oryd/kratos:v26.2.0`, using committed config: screenshot-shaped identifier/password rejected with HTTP 400 and UI message ID 4000031 (identifier similarity); an unrelated underscore password with name `Ян` returned HTTP 200. No production account or credential was used. The screenshot itself establishes the identifier match; historical production logs are unavailable, so the reproduced cause is distinguished from a forensic claim about the historical request.

Review verification: `ErrPasswordRejected` wraps `ErrFlowRejected`; settings-policy errors already enter the localized change-password branch. The extended real-adapter handler table verifies this without altering password policy or fabricating a behavior change.
