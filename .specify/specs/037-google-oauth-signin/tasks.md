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

- **2026-07-07 (post-merge prod fix):** the callback route
  (`app/src/app/[locale]/auth/google/callback/route.ts`) now builds its
  success and failure redirect targets from `appOrigin()` (the configured
  public origin the start flow already uses), NOT `request.nextUrl.origin`.
  Under the production standalone server (`node server.js`, `HOSTNAME=0.0.0.0`,
  `next.config` `trustHostHeader:false`) `request.nextUrl.origin` resolves to
  the internal bind, so every redirect out of the callback pointed the browser
  at the unreachable `https://0.0.0.0:3000` — the whole Google loop failed at
  the last hop even though the Kratos identity + session-token exchange
  succeeded. Reusing `appOrigin()` (Engineering Reuse Rule) keeps the entire
  loop on one canonical origin and matches the security posture already
  documented in `features/auth/google.ts` (configured URL wins over any
  client-controllable Host header — confirmed: a spoofed `Host` header does
  not steer the redirect). This is application code (TDD normally applies),
  but the failing-test-first vehicle cannot discriminate the fix: the required
  `test` gate runs `next dev` on localhost and seeds
  `NEXT_PUBLIC_APP_URL=http://localhost:3000` (`.env.local.example`), so
  `appOrigin() === request.nextUrl.origin` there and a committed Playwright
  assertion stays green on both the buggy and the fixed route. The defect only
  manifests under the production standalone bind, so it is verified by
  **Supervised Verification** — the standalone `node server.js` red/green smoke
  below plus the post-deploy prod smoke — rather than a committed failing e2e.
  Follow-up (tracked separately): a standalone/docker-target e2e that asserts
  the callback redirect **host** would give CI a real regression guard.

- **2026-07-07 (deliberate, fail-loud on misconfig):** `appOrigin()` is
  awaited before the try block, so a production deploy with
  `NEXT_PUBLIC_APP_URL` unset makes a direct callback navigation return `500`
  (appOrigin throws) instead of a `googleError=1` redirect. Kept intentionally:
  it mirrors the start flow's existing contract (both require the env), the
  scenario is unreachable in a correctly configured deploy (start throws first,
  so the user never reaches the callback), and there is no clean graceful
  fallback — the only absolute origin available without the env is the very
  `request.nextUrl.origin` bind this fix removes. Failing loud on misconfig is
  preferable to silently re-emitting a broken `0.0.0.0` redirect.

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

## Verification Log (2026-07-07, post-merge callback-origin fix)

- **Prod repro (before):** `curl -sI https://capsulezero.app/en/auth/google/callback`
  → `307` `location: https://0.0.0.0:3000/en/auth?googleError=1`. Kratos logs
  for the same window show the full backend loop succeeding (OIDC start `200`,
  `A new identity has registered`, `/sessions/token-exchange` `200`) — the
  only failure was the unreachable redirect host.
- **Standalone smoke (fix, local):** `next build` (standalone) + `HOSTNAME=0.0.0.0
  PORT=<p> NEXT_PUBLIC_APP_URL=https://capsulezero.app NODE_ENV=production node
  .next/standalone/server.js`, then `curl -sI -H 'X-Forwarded-Proto: https'
  http://127.0.0.1:<p>/en/auth/google/callback` → `location:
  https://capsulezero.app/en/auth?googleError=1`. Same command against the
  pre-fix route returns `https://0.0.0.0:<p>/...` (red → green on the exact
  production runtime shape the localhost CI harness cannot reproduce).
- `npm run typecheck` (app/) — clean. `npm run lint` (app/) — 0 errors.
- `specs/auth/google-sign-in.spec.ts` still green: on localhost `appOrigin()`
  resolves to the request origin, so the mock happy loop and the no-code
  negative are behaviourally unchanged.
- **Prod smoke (after redeploy):** rerun the runbook smoke (row 3, now
  origin-aware) once the merge deploys — `location` host must be
  `capsulezero.app`, and the full consent dance must land signed-in on
  `/en/dashboard`.

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
