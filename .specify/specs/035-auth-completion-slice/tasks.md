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
- **2026-07-03: Kratos v1.1.0 → v1.3.1 (required, discovered live).** On
  v1.1.0 a *valid* recovery code submitted to a native (API) flow answers
  `422 browser_location_change_required` with no session token and no cookie —
  the native code-recovery hand-off simply does not exist in v1.1, so the Go
  API could never set the new password. v1.3 ships the hand-off behind
  `feature_flags.use_continue_with_transitions: true` (`continue_with:
  set_ory_session_token`), which the client consumes. Alternatives rejected:
  emulating a browser flow server-side (CSRF-cookie state would have to
  round-trip through the client — fragile, security-review magnet) and
  admin-API password writes (cannot bind them to code possession). Migration
  note: the first prod deploy of this slice re-runs `kratos-migrate` against
  the live identity DB (v1.1 → v1.3 SQL migrations, forward-only) — verified
  locally against a v1.1-provisioned volume; registration/login/whoami/logout
  regression-checked by probes and e2e after the bump.
- **2026-07-03: wrong one-time codes come back as HTTP 200.** Kratos v1.x
  answers an invalid recovery/verification code with `200` and the rejection
  in `ui.messages` (flow stays open) — not `400`. The client treats a 200
  without a session/`passed_challenge` as `ErrFlowRejected` when an error
  message is present; covered by unit tests reproducing the live shape.

### Dead Ends

- (from spec 024, inherited) Shipping recovery via the `link` method with no
  flow-aware completion UI — emails landed users on pages that could not
  finish the flow; the flows were disabled instead. This slice is the
  promised completion.
- **Nested `<form>` for the profile password form.** The change-password block
  lives inside the profile screen's main `<form>`; browsers strip nested form
  elements, so the inner submit posted the outer profile form and the password
  action never ran (caught by the failing e2e). Fixed by rendering the block
  as a `<div>` with an explicit `handleSubmit` button.
- **Reading the verify-email state from the mock provider's live session.**
  `createProviderRegistry()` builds a fresh mock registry per request, so the
  sign-up's in-memory session is gone by the next render and the banner never
  showed (caught by the failing e2e). Fixed by carrying
  `emailVerified`/`verificationFlowId` in the signed session cookie (kept
  current by the sign-up/verification actions) with the live whoami value
  winning where the provider reports one (api mode).

- **Persisted verification flow lost behind `readVerifiedAppSession`.** In api
  mode that helper replaces the cookie payload with a fresh whoami mapping,
  and whoami never carries the after-sign-up `verificationFlowId` — the banner
  got an empty flow and fell into its resend path (caught by the full-stack
  verification e2e). Fixed by merging: live whoami stays authoritative for
  `emailVerified`, the cookie keeps the flow id.

### Verification evidence (local stack, 2026-07-03)

- `go vet ./... && go test ./...` — 6/6 packages ok (includes the live-shape
  200-rejection tests).
- `npm run typecheck` + `npm run lint` — clean (module-size warnings only,
  pre-existing + AuthPanel justified in the PR).
- `node scripts/check-api-contract.mjs` — 52 route-methods, 12 Go routes ok.
- Mock-provider auth e2e: 10 passed / 2 MailHog-gated skips (chromium +
  webkit-iphone) — run **before** the docker stack occupied :3000 (see Known
  Issues).
- Full stack (postgres + Kratos v1.3.1 + Go API + web + MailHog at
  `https://capsulezero.local`): `recovery-fullstack` and
  `verification-fullstack` Playwright specs green (registration → code email →
  wrong-code rejection → completion → dashboard; recovered password signs in,
  old one rejected).
- Direct probes through the compose network: unknown-email recovery has the
  identical response shape; wrong codes → `400 VALIDATION_ERROR` with no
  session; wrong current password → `400`; happy password change → old
  password rejected with `401` on login.

### Known Issues / Follow-ups

- While the local docker stack is up it publishes the web app on
  `127.0.0.1:3000`, so a plain `npx playwright test` (mock-provider suite)
  silently reuses the api-mode stack and the deterministic mock codes fail.
  Stop the stack (or run the mock suite first) — tracked as a tests/README
  follow-up note.

- Default Kratos courier templates ship first (plain-text code emails).
  Branded/custom templates (and a guaranteed in-email deep link to the app's
  completion page) are a follow-up; the code always works cross-device.
- Coins/billing untouched; session management UI untouched.
