# Spec 037 — Plan & Verification

## Approach

One vertical slice on branch `feat/037-google-oauth-signin`, TDD-first
(spec ≥ 025: failing tests are committed before the product code that makes
them pass). The Kratos native-flow mechanics (`session_token_exchange_code`
in the API flow response, `browser_location_change_required` +
`redirect_browser_to` on the OIDC submit, `/sessions/token-exchange`
response shape) follow the Ory docs for native-app social sign-in and are
pinned by the fake-Kratos unit tests; a full-stack probe against real Google
runs on the prod host after the operator installs the client credentials
(the consent dance cannot run in CI).

Order: spec + failing tests → Kratos/nginx/compose infra → Go client +
handlers → OpenAPI contract + generated client → web providers/actions/UI →
docs → verification (below) → draft PR for founder review.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Failing tests committed before implementation (TDD) | Commit history: `test(037)` commit precedes `feat(037)` commits on the PR branch |
| 2 | Go unit tests cover OIDC start (flow init with exchange code + redirect URL extraction), token exchange (happy + wrong code), handler guards (disabled → 404, malformed body, provider availability endpoint) | `go test ./...` green on PR head; test names in `internal/kratos/kratos_oidc_test.go` + `internal/auth/auth_google_test.go` |
| 3 | Provider-agnostic e2e: Google button visible on /auth, click-through lands on /dashboard, session survives reload (mock loop) | Playwright `specs/auth/google-sign-in.spec.ts` green in the required `test` check |
| 4 | Negative e2e: callback without `code` creates no session and shows the localized error on /auth | Same spec file, negative case, green in `test` |
| 5 | Edge exposes only the exact callback path | `nginx -t`-clean config diff (host + container mirror); config review: `location =` above `^~ /self-service/ { return 404; }` |
| 6 | Compose config stays valid with OIDC disabled (default) and enabled | `docker compose config` output recorded in tasks.md for both env shapes |
| 7 | Contract: three new endpoints in openapi.yaml + regenerated client | `npm run check:api-contract` green (also runs in `baseline-checks`) |
| 8 | Google-disabled degradation: no button, `POST /api/auth/google/start` → 404 (negative 3) | Go handler test + e2e default-mock run with availability forced off is covered by unit test; api provider returns `false` on 404 |
| 9 | Full-stack Google dance on prod after credential install | Post-merge operator smoke per runbook `google-oauth-setup.md` (consent screen → dashboard); recorded in tasks.md after rollout |
| 10 | Callback redirects target the configured public origin, not the standalone bind (`0.0.0.0`) — post-merge fix 2026-07-07 | **Automated CI regression guard** (delivered 2026-07-07): the `origin-guard` Playwright project (`tests/e2e/specs/auth/google-callback-origin.standalone.spec.ts`, gated by `E2E_ORIGIN_GUARD=1` in `.github/workflows/test.yml`) rebuilds `/app` as the production standalone server (`node server.js`, `HOSTNAME=0.0.0.0`) with `NEXT_PUBLIC_APP_URL` baked to a canary origin, then asserts the callback `location` origin === the canary. Red/green proven by reverting the route to `request.nextUrl.origin`: fresh standalone build → `Received: http://0.0.0.0:3100` (fail); `appOrigin()` → canary (pass). The localhost `next dev` suite still cannot discriminate (there `appOrigin() === request.nextUrl.origin`, `NEXT_PUBLIC_APP_URL` pinned to the bind), which is exactly why this dedicated standalone project exists. Original manual evidence retained below: prod curl before (`0.0.0.0:3000`) in tasks.md; post-deploy prod smoke after (runbook row 3) |

## Risks

- **Kratos env-JSON for providers list.** `SELFSERVICE_METHODS_OIDC_CONFIG_PROVIDERS`
  is passed as a JSON string env var (koanf parses JSON values). Verified via
  `docker compose config` + local stack boot; if a Kratos version quirk
  rejects it, fallback is a second config file mounted only in prod.
- **Exchange-endpoint availability.** `/sessions/token-exchange` must not be
  blocked internally — it is called by the Go API over the internal network,
  not through the edge (edge keeps `/sessions/` 404 for browsers).
