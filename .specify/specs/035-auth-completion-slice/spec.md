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
  - Verify-email banner for signed-in users with an unverified address:
    code entry + resend (dashboard surface).
  - `/[locale]/verify-email` page: landing for emailed verification links
    (`?flow=…&code=…` auto-submit; code-entry fallback), success/error states.
  - Profile: the mock "Change password" button becomes a real form
    (current + new password) against `POST /api/auth/password`.
  - Provider contracts + `api` and `mock` providers + server actions extended
    accordingly (mock uses the deterministic code `123456` so provider-agnostic
    e2e runs in CI without email).
- Contract: `openapi.yaml`, `api-spec.md`, generated client, contract guard.
- Docs actualized in the same change (ADR-002, AGENTS.md Sprint-0 row,
  backend docs, `deploy/compose.env.example` **SMTP port fix 465 → 2465** —
  Hetzner blocks outbound 25/465 platform-wide; verified live 2026-07-03).

**Out:**

- Social auth (Google/Apple) — Stage 2 (ADR-002).
- Verification-gated login (drop of the auto-login `session` hook) — declined
  for v0.1 (founder decision 2026-07-03); the known account-enumeration
  residual via registration response shape (spec 024 Known Issues) stays
  accepted.
- Custom Kratos courier email templates / branded emails — follow-up; default
  code emails ship first (see Process Memory for the link-in-email decision).
- Session management UI (list/revoke other sessions), 2FA — later slices.
- Rate-limit changes beyond routing the new endpoints through the existing
  auth bucket (edge `limit_req` + Go limiter).

## Negative scenarios (SENAR)

1. Recovery completion with a wrong/expired code → `400 VALIDATION_ERROR`,
   no session issued, password unchanged.
2. Password change with a wrong current password → `400 VALIDATION_ERROR`
   (generic message; no oracle beyond what login already exposes), password
   unchanged.
3. Recovery/verification start for an unknown email → same success shape as
   for a known email (no account enumeration).
4. Verification completion with a wrong code → `400 VALIDATION_ERROR`,
   address stays unverified, banner persists.
