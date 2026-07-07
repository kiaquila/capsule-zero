# Spec 037 — Tasks & Process Memory

## Tasks

1. Failing tests (Go + Playwright) — committed first (TDD).
2. Infra: Kratos oidc method (disabled default) + google jsonnet mapper +
   registration `after.oidc` session hook; compose env passthrough + Kratos
   4433 on host loopback; edge callback carve-out (host nginx + container
   mirror); deploy env templates.
3. Go: kratos client `OIDCStart`/`OIDCExchange`; auth handlers
   `Providers`/`GoogleStart`/`GoogleComplete`; config `AUTH_GOOGLE_ENABLED`;
   routes (start/complete in the strict auth bucket, providers in the
   session bucket).
4. Contract: openapi.yaml + regenerated web client.
5. Web: optional AuthPort methods; api + mock providers; server action +
   callback route handler; AuthPanel Google button + error state; i18n EN/RU.
6. Docs: constitution §V, AGENTS.md, ADR-002, backend/frontend docs,
   ui-texts, f-002-auth, screen-auth, google-oauth-setup runbook.
7. Verification per plan.md; draft PR with SENAR gate.

## Process Memory

### Decisions

- **2026-07-06 (assessment, recorded before implementation):** web Google
  sign-in uses the Kratos **native-app OIDC flow with session-token
  exchange**, not the browser flow. Reason: the stack's sessions are token
  based (signed app cookie holding a Kratos session token; Go API validates
  via `X-Session-Token` whoami) and the edge keeps Kratos public closed.
  The browser flow would mint an `ory_kratos_session` cookie nothing
  consumes and would require exposing the full login/registration browser
  surface at the edge.
- **2026-07-06:** the `AuthPort` Google methods are **optional** members so
  the frozen Supabase provider (AGENTS §8) is not edited; UI hides the
  button when the provider lacks them or reports disabled.
- **2026-07-06:** provider credentials enter only via env
  (`SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS` JSON) on the host env file;
  repo carries no client id/secret. Everything defaults to **off** so a
  merge without operator prep deploys with Google cleanly hidden.
- **2026-07-06:** achromatic-interface rule wins over Google brand colors:
  monochrome white "G" glyph on the design-system social button surface.

- **2026-07-07:** `OIDCExchange` deliberately keeps mapping every 4xx from
  `/sessions/token-exchange` (400/403/404/410) to `ErrInvalidCredentials` →
  user-facing 401 `GOOGLE_SIGN_IN_FAILED`. Splitting 400 out as an internal
  error risks turning benign malformed/expired-code retries into 5xx alarms;
  any 4xx means "no session" and the generic sign-in error is the right UX
  (code review, 2026-07-07).

### Dead Ends

- **Kratos browser OIDC flow** (standard docs path) — rejected for this
  stack; see the first decision. Not attempted in code.

## Verification Log (2026-07-06, pre-PR)

- `go test ./...` (api/) — all packages ok; new tests in
  `internal/kratos/kratos_oidc_test.go` (start happy/missing-exchange-code/
  rejected-submit, exchange happy/403/404/410) and
  `internal/auth/auth_google_test.go` (providers probe, start happy/disabled
  404/missing returnTo, complete invalid-codes 401 GOOGLE_SIGN_IN_FAILED /
  disabled 404 / missing codes 400). `gofmt -l` clean, `go vet ./...` clean.
- `npm run typecheck` (app/) — clean; `npm run lint` — 0 errors, 92
  pre-existing soft-gate warnings (re-run 2026-07-07 after the AuthPanel
  fix: the pre-PR log had claimed 0 errors from a stale local run while CI
  correctly failed `react-hooks/set-state-in-effect` in `AuthPanel.tsx`;
  fixed by deriving availability instead of syncing prop → state, which also
  restored the landing-popup self-resolve branch the `= false` default had
  made unreachable).
- `node scripts/check-api-contract.mjs` — 55 route-methods verified, 15 Go
  route registrations covered; `generate-api-clients.mjs --check` verified.
- `docker compose --env-file deploy/compose.dev.env config` — valid with the
  default (OIDC off, providers `[]`) and with the enabled trio exported
  (provider JSON interpolates intact).
- `nginx -t` (nginx:1.27-alpine, shared nginx.conf + conf.d.dev mounted) —
  syntax ok after mirroring the Google-callback carve-out into the dev vhost
  (Codex P3, 2026-07-07).
- Playwright `specs/auth/google-sign-in.spec.ts` — 4 passed (chromium +
  webkit-iphone; happy loop + no-code negative). First webkit run caught the
  cookie banner overlapping the button on mobile — fixed by dismissing the
  banner in the spec, mirroring the other auth specs.

### Known Issues

- **No account linking (v0.1):** Google sign-in with an email that already
  has a password identity is rejected by Kratos (duplicate identifier); the
  user is told to sign in with the password. Settings-flow linking is a
  follow-up slice.
- **Google emails still get the verify-email banner:** OSS Kratos v1.3
  mappers cannot mark `verifiable_addresses` verified, so a Google sign-up
  receives the standard non-blocking verification code email despite
  `email_verified=true` from Google. Acceptable for v0.1; candidates:
  admin-API patch after exchange, or a Kratos upgrade if the option lands.
  The mock provider sets `emailVerified=true`, so provider-agnostic e2e does
  not reproduce the banner — prod-shape divergence is covered only by the
  operator smoke (architect review, 2026-07-07).
- **Feature flags can drift (Go vs Kratos):** `AUTH_GOOGLE_ENABLED` and
  `KRATOS_OIDC_ENABLED`/`KRATOS_OIDC_PROVIDERS` are independent; with Go on
  and Kratos off the button renders but `google/start` → 502. No config
  guard binds them — the enable runbook (google-oauth-setup.md) installs the
  trio together and the operator smoke exercises the full loop (architect
  review, 2026-07-07).
- **`return_to` code appears in nginx access logs:** the callback lands as
  `GET /<locale>/auth/google/callback?code=…` through the generic web
  location, so the one-time return_to code is written to the access log.
  Unexploitable alone (pairing init code lives in an httpOnly cookie, both
  single-use), so v0.1 accepts it; follow-up: a log-format carve-out for the
  callback path (security review, 2026-07-07).
- **Consent dance not covered in CI:** unit tests pin the Kratos payload
  shapes; the real Google round-trip is a post-rollout operator smoke
  (plan.md row 9).
- **Password change for Google-only identities:** an identity created via
  Google has no password credential; "change password" re-authenticates with
  the current password first, so such users cannot set one until account
  linking / a "set password" path ships (critic review, 2026-07-07). Profile
  view/edit are unaffected (they bypass Kratos settings).
- **`/auth?flow=` param ambiguity:** a Kratos-side OIDC failure that
  redirects to the login ui_url can land on `/auth?flow=<login-flow-id>`,
  which the page treats as a recovery deep link (spec-035 behavior) and opens
  the code-entry step. Cosmetic dead end (any submit fails cleanly); the
  primary failure path targets `/auth?googleError=1` instead. Follow-up:
  distinguish flow types on the /auth route.
