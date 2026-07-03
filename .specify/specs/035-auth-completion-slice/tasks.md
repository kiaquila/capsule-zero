# Spec 035 — Tasks & Process Memory

## Tasks

1. Failing tests (Go + Playwright) — committed first (TDD).
2. Kratos config: enable recovery + verification (`code`), compose env UI URLs.
3. Go: kratos client (recovery code + complete, verification, settings
   password, re-auth), auth handlers, routes under the auth limiter.
4. Contract: openapi.yaml, api-spec.md, generated client, guard.
5. Web: contracts + api/mock providers, server actions, AuthPanel recovery
   mode + completion, verify-email banner + page, profile password form,
   i18n EN/RU.
6. Docs: ADR-002, AGENTS.md, backend-docs, compose.env.example (SMTP 2465).
7. Verification per plan.md; local docker stack for founder UI review.

## Process Memory

### Decisions

- **2026-07-03 (founder):** auto-login on sign-up stays (`session` hook);
  email verification is non-blocking (banner + code). The registration
  response-shape enumeration residual from spec 024 remains accepted for v0.1.
- **2026-07-03 (founder):** recovery/verification UX is **code entry**, with
  the emailed link as a secondary path where the template provides one. New UI
  reuses existing styles/classes/components — no parallel styling.
- **2026-07-03:** recovery switches from the `link` to the `code` method.
  Kratos recovery codes are bound to their flow, so `POST /api/auth/recovery`
  now returns the `flowId` and the completion call submits `{flowId, code}`.
  The PR-#57-era `link`-method plumbing is replaced, not extended (the
  link-method emails could not be completed by the API-flow UI — the original
  reason the flows were disabled).
- **2026-07-03:** password change re-authenticates with the current password
  (fresh login → fresh privileged session) instead of handling Kratos
  `session_refresh_required` on an aged session. Simpler, and requiring the
  current password is the intended UX anyway.
- **2026-07-03 (infra, discovered live):** Hetzner Cloud blocks outbound TCP
  25 and 465 platform-wide; Resend SMTP runs on **port 2465** (implicit TLS).
  Prod host `.env` was fixed live (AUTH `235` verified from the host);
  `deploy/compose.env.example` is fixed in this slice.

### Dead Ends

- (from spec 024, inherited) Shipping recovery via the `link` method with no
  flow-aware completion UI — emails landed users on pages that could not
  finish the flow; the flows were disabled instead. This slice is the
  promised completion.

### Known Issues / Follow-ups

- Default Kratos courier templates ship first (plain-text code emails).
  Branded/custom templates (and a guaranteed in-email deep link to the app's
  completion page) are a follow-up; the code always works cross-device.
- Coins/billing untouched; session management UI untouched.
