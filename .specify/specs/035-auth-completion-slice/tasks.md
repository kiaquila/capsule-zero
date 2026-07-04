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

### Decisions — review round 2 (founder UI feedback, 2026-07-03)

- **NotificationBanner is the standard inline-notification surface.** The
  verify-email banner is its first consumer
  (`app/src/components/common/NotificationBanner.tsx`): glass card, info
  glyph top-right, rendered inside the page's content column so margins align
  with sibling cards. Future in-app notifications compose it — no one-off
  banner markup.
- **Banner copy explains the why**: verification protects account access
  (password recovery goes through the address).
- **Every user-facing auth error is localized.** The Go API returns machine
  codes (`INVALID_CODE`, `INVALID_CURRENT_PASSWORD`, plus the existing
  `UNAUTHENTICATED` / `RATE_LIMITED` / `VALIDATION_ERROR` / `INTERNAL_ERROR`);
  providers throw `CODE: message`; actions surface the code; the UI maps it to
  `auth.errors.*` (EN/RU) with a localized generic default. Raw Kratos/provider
  English never reaches the user. Trade-off recorded: server-side field
  feedback (e.g. Kratos password-policy text) collapses into the generic
  localized message — client-side Zod covers the common cases precisely.
- **Emailed verification link verifies silently.** The v1.3 code email links
  to Kratos's public `GET /self-service/verification?code&flow`, which
  consumes the code and redirects to `/verify-email` — that route is now a
  silent redirect to the dashboard (the earlier code-entry page with
  success/error states is deleted; founder feedback #4/#7). To make the link
  work in production the edge exposes exactly that one path (GET-only,
  auth-rate-limited) on all three nginx configs, and prod compose publishes
  Kratos 4433 on loopback for the host edge. Everything else under
  `/self-service/` stays 404.
- **Forgot-password prefills the sign-in email**; the recovery-step links
  ("Resend code" / "Back to log in") are stacked rows. Resend root cause
  analysis: the backend resend worked all along (two flows, two emails —
  verified by probe); the UI failure mode was the inline link row plus
  unlocalized/ambiguous error display, both fixed; dev also shares one Go
  rate-limit bucket for all browsers (no X-Real-IP forwarding on the dev
  vhost `location /`), so heavy manual testing can hit 429 — now at least
  surfaced as a localized RATE_LIMITED message.
- **Emailed link → app route via custom courier template, edge stays closed.**
  Discovered live: Kratos v1.3's own emailed link (`GET
  /self-service/verification?code&flow`) does NOT consume the code — it stows
  it in the flow and redirects to the UI expecting an auto-submitting SPA, so
  briefly exposing that GET at the edge (tried first) left the address
  unverified. Final design: a custom `verification_code.valid` courier
  template (infra/kratos/templates/) rewrites the link path to
  `/en/verify-email?code&flow` (origin comes from SERVE_PUBLIC_BASE_URL,
  correct per env), and the silent route completes the flow server-side via
  the Go API — the after-registration verification flow is `type: api`, so
  the JSON submit needs no CSRF. The edge exposure + prod loopback publish of
  4433 were rolled back the same day: `/self-service/*` stays fully 404.
- **Auth rate limit is env-tunable for the dev stack.**
  `API_AUTH_RATE_PER_MINUTE` / `API_AUTH_RATE_BURST` (default 10/10 —
  production unchanged); the dev override sets 120/60 because every browser
  behind the local edge shares one client address, so manual testing plus the
  serial e2e suites exhausted the strict bucket mid-run (observed as e2e
  timeouts and the founder's "resend didn't work").
- **e2e are named by interface location** (founder feedback #6):
  `sign-in`, `sign-out`, `registration`, `forgot-password`,
  `verify-email-banner`, `profile-change-password` (+ `-fullstack` variants
  that own credential truth: resend rotation, old-password-dies, emailed-link
  verification). Shared fixtures: `fixtures/accounts.ts`, `fixtures/mailhog.ts`.

### Decisions — Codex review fixes (PR #68, 2026-07-04)

- **P2: retired Supabase provider no longer fakes a recovery flow.** Its
  `requestPasswordRecovery` previously sent a Supabase reset email and
  returned a synthetic `flowId`, routing the UI into a code-entry step that
  could never complete. It now fails loudly like the other spec-035 stubs —
  the auth domain has moved to the Go API (AGENTS §8).
- **P2: verification links are locale-aware.** The courier template reads the
  `locale` identity trait (default `en`) and builds `/{locale}/verify-email`;
  verified live: EN sign-up → `/en/…`, RU sign-up → `/ru/…`.
- **P3: password change handles Enter inside the nested profile form.** The
  password block remains a `<div>` because it lives inside the profile form,
  but Enter from its password inputs now prevents the outer profile submit and
  runs the password-change handler. Enter on the action buttons keeps native
  button behavior.
- **P2: recovery completion distinguishes password-policy rejection from an
  invalid code.** Kratos settings-flow password rejections now return the
  `ErrPasswordRejected` sentinel (still wrapping `ErrFlowRejected` for
  compatibility). The auth handler maps that case to `VALIDATION_ERROR`; only
  recovery-code rejections map to `INVALID_CODE`.

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

### Verification evidence — review round 2 (local stack, 2026-07-03)

- `go vet ./... && go test ./...` — 6/6 ok (machine error codes, config knob).
- `npm run typecheck` + `npm run lint` — clean (0 errors).
- Mock-provider suite (stack stopped to free :3000): **13 passed / 8
  MailHog-gated skips** across chromium + webkit-iphone — sign-in, sign-out
  (desktop sidebar + mobile More sheet), registration, forgot-password
  (prefill + wrong code), verify-email banner, profile change password.
- Full-stack suite (Kratos v1.3.1 + MailHog, serial): **4/4 green in 31s** —
  forgot-password (resend invalidates the first code, resent code rotates the
  password, old password dies), verify-email banner (wrong code rejected,
  real code clears, survives reload), emailed link verifies with zero extra
  screens, profile change password (old dead / new works).
- Kratos boots healthy with the courier template config; compose renders for
  both env files; docker nginx healthy on the rolled-back vhost.

### Verification evidence — Codex review fixes (local, 2026-07-04)

- `git diff --check` — clean.
- `npm run typecheck` — green.
- `npm run typecheck:e2e` — green.
- `npm run lint` — 0 errors; module-size/a11y warnings remain warnings-only
  and pre-existing soft gates.
- `npm run lint:e2e` — 0 errors; three existing MailHog-gated skip warnings.
- `npm --prefix tests/e2e run test -- specs/auth/profile-change-password.spec.ts`
  — 2 passed (chromium + webkit-iphone), including the Enter submit path.
- `go test ./...` in `api/` — green after the recovery password-policy
  regression tests.

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
