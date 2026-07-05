# Spec 035 — Auth Completion Slice: Password Recovery, Email Verification, Password Change

## Goal

Close the deliberately deferred gap from spec 024 Phase 2 (PR #57): password
recovery, email verification, and password change ship as **working
end-to-end flows** on the existing `/app` UI against the Go API + Kratos —
no dormant plumbing and no dead-end email links remain in production.

## Scope

**In:**

- Re-enable the Kratos `recovery` and `verification` self-service flows using
  the **`code` method** (`infra/kratos/kratos.yml` + compose env). Registration
  keeps the `session` hook (founder decision 2026-07-03: auto-login stays;
  verification is non-blocking).
- Go API (auth bounded context):
  - `POST /api/auth/recovery` — reactivated; switches the Kratos client from
    the `link` to the `code` method and now returns the recovery `flowId`
    (codes are flow-bound in Kratos).
  - `POST /api/auth/recovery/complete` — `{flowId, code, newPassword}`;
    exchanges the code for a fresh Kratos session (`continue_with`), sets the
    new password via the settings flow, and returns the standard auth response
    (auto-login after reset).
  - `POST /api/auth/verification` — `{email}`; starts/resends a verification
    code email; account-enumeration safe.
  - `POST /api/auth/verification/complete` — `{flowId, code}` → `{ok:true}`.
  - `POST /api/auth/password` — session required; `{currentPassword,
    newPassword}`; re-authenticates with the current password (fresh privileged
    session — sidesteps `privileged_session_max_age`), then sets the new
    password via the settings flow.
  - `whoami`/auth responses expose `user.emailVerified`; registration response
    exposes the after-sign-up `verificationFlowId` from `continue_with`.
- Web `/app` (reusing existing styles/classes/i18n — founder decision):
  - AuthPanel: "Forgot password?" affordance restored; recovery mode (email →
    code + new password completion step) → auto-login → dashboard.
    A custom Kratos courier template sends the recovery code without a
    Kratos `/self-service/recovery` link, so the edge can keep
    `/self-service/*` closed without emailing dead-end URLs. If Kratos accepts
    the code but rejects the new password policy, the API returns an opaque
    continuation id so the UI can retry the password without consuming or
    resubmitting the already-used code.
  - Verify-email banner for signed-in users with an unverified address:
    code entry + resend, built on the shared `NotificationBanner` component
    (the standard inline-notification surface introduced by this slice),
    aligned with the dashboard content cards, info glyph top-right, and copy
    that explains why verification matters (account access recovery).
  - `/[locale]/verify-email`: silent landing for emailed verification links.
    A custom Kratos courier template links straight here with `code+flow`;
    the route completes the verification server-side and forwards to the
    dashboard — no code entry, no extra screens (founder feedback, review
    round 2). The edge keeps `/self-service/*` fully 404.
  - Profile: the mock "Change password" button becomes a real form
    (current + new password) against `POST /api/auth/password`; click and
    Enter from the password inputs both run the password-change action, not
    the outer profile-save action.
  - Provider contracts + `api` and `mock` providers + server actions extended
    accordingly (mock uses the deterministic code `123456` so provider-agnostic
    e2e runs in CI without email).
- Contract: `openapi.yaml`, `api-spec.md`, generated client, contract guard;
  machine error codes `INVALID_CODE` / `INVALID_CURRENT_PASSWORD` so the web
  UI localizes every user-facing auth error (EN/RU) instead of echoing
  provider English.
- Docs actualized in the same change (ADR-002, AGENTS.md Sprint-0 row,
  backend docs, `deploy/compose.env.example` **SMTP port fix 465 → 2465** —
  Hetzner blocks outbound 25/465 platform-wide; verified live 2026-07-03).

**Out:**

- Social auth (Google/Apple) — Stage 2 (ADR-002).
- Verification-gated login (drop of the auto-login `session` hook) — declined
  for v0.1 (founder decision 2026-07-03); the known account-enumeration
  residual via registration response shape (spec 024 Known Issues) stays
  accepted.
- Branded Kratos courier email design — follow-up; a minimal code-only
  recovery template and a verification link-rewrite template ship in this
  slice.
- Session management UI (list/revoke other sessions), 2FA — later slices.
- Rate-limit changes beyond routing the new endpoints through the existing
  auth bucket (edge `limit_req` + Go limiter).

## Negative scenarios (SENAR)

1. Recovery completion with a wrong/expired code → `400 INVALID_CODE`,
   no session issued, password unchanged, localized message in the UI.
2. Recovery completion with a valid code but Kratos password-policy
   rejection → `400 VALIDATION_ERROR`, no session issued, password unchanged,
   and the UI must not tell the user the code is invalid.
3. Password change with a wrong current password → `400
   INVALID_CURRENT_PASSWORD` (no oracle beyond what login already exposes),
   password unchanged, localized message in the UI.
4. Recovery/verification start for an unknown email → same success shape as
   for a known email (no account enumeration).
5. Verification completion with a wrong code → `400 INVALID_CODE`,
   address stays unverified, banner persists with a localized error.
