# Google Sign-In — Operator Setup (spec 037)

Google sign-in ships **disabled by default**: without the env vars below the
stack deploys with the button hidden, `/api/auth/google/*` answering 404, and
Kratos-side OIDC off. Enabling it is a pure host-env operation — no repo
change, no redeploy ordering hazard.

## 1. Google Cloud Console (founder / operator)

1. <https://console.cloud.google.com/> → create (or pick) a project, e.g.
   `capsule-zero-prod`.
2. **APIs & Services → OAuth consent screen** (a.k.a. Google Auth Platform →
   Branding):
   - User type: **External**.
   - App name `Capsule Zero`, support email, developer contact.
   - Authorized domain: `capsulezero.app`.
   - Links: `https://capsulezero.app/en/privacy-policy` and
     `https://capsulezero.app/en/terms-of-use`.
   - Scopes: only `openid`, `email`, `profile` (non-sensitive — **no Google
     verification review needed**). Skip the logo at first: uploading one
     triggers a manual brand review.
   - Publishing status: **In production** (Testing caps sign-ins to allow-listed
     accounts and expires consent after 7 days).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**, name e.g. `capsule-zero-web`.
   - Authorized redirect URI (exactly):
     `https://capsulezero.app/self-service/methods/oidc/callback/google`
   - No JavaScript origins needed (the flow is redirect-based).
4. Copy the **Client ID** (`…apps.googleusercontent.com`) and **Client
   secret**. The secret is installed only on the prod host (next section) —
   never in the repo, never pasted to an agent.

## 2. Prod host env (no-peek)

On the server (`ssh cz`), append to the compose env file used by the
`capsule-zero` project (same file that carries `KRATOS_DSN` etc.), pasting the
two values from step 4:

```bash
KRATOS_OIDC_ENABLED=true
KRATOS_OIDC_PROVIDERS=[{"id":"google","provider":"google","label":"Google","client_id":"<CLIENT_ID>","client_secret":"<CLIENT_SECRET>","mapper_url":"file:///etc/config/kratos/oidc.google.jsonnet","scope":["openid","email","profile"]}]
AUTH_GOOGLE_ENABLED=true
```

Single line for `KRATOS_OIDC_PROVIDERS`, no surrounding quotes. Then roll the
affected services:

```bash
docker compose up -d kratos api web
```

## 3. Smoke check (plan.md row 9)

1. `curl -s https://capsulezero.app/api/auth/providers` → `{"google":true}`.
2. `https://capsulezero.app/en/auth` shows **Continue with Google**; the full
   dance lands on the dashboard signed in.
3. **Redirect host** (regression guard, spec-037 fix 2026-07-07):
   `curl -sI https://capsulezero.app/en/auth/google/callback` → the `location`
   header host MUST be `capsulezero.app`, never `0.0.0.0:3000`. The callback
   builds its redirects from `NEXT_PUBLIC_APP_URL`/`appOrigin()`. Two failure
   modes to treat as a fail: a `0.0.0.0` host means the callback regressed to a
   request-origin redirect (the exact leak that broke the first rollout); a
   `500` on this curl means the web container is missing `NEXT_PUBLIC_APP_URL`
   (`appOrigin()` throws by design rather than emit a bad origin).
4. Negative: `https://capsulezero.app/self-service/anything` still 404s;
   `https://capsulezero.app/en/auth/google/callback` (no code) lands on
   `/auth?googleError=1` with the localized message and no session.

Record the outcome in `.specify/specs/037-google-oauth-signin/tasks.md`.

## How it works (one paragraph)

The web button calls `POST /api/auth/google/start`; the Go API creates a
Kratos **API login flow** with `return_session_token_exchange_code=true`,
submits `method=oidc`, and returns Google's consent URL plus an exchange code
(parked in a short-lived httpOnly cookie). Google redirects to the single
exposed Kratos path `/self-service/methods/oidc/callback/google`; Kratos
completes OIDC (registering the identity on first sign-in via the
`oidc.google.jsonnet` mapper) and redirects to the app callback with a
`return_to` code. The callback route hands both codes to
`POST /api/auth/google/complete`, which exchanges them at Kratos
`/sessions/token-exchange` (internal network) for the same session token
every other auth flow uses. Design rationale and rejected alternatives:
`.specify/specs/037-google-oauth-signin/tasks.md` (Process Memory) and
ADR-002.

## Known limitations (v0.1)

- **No account linking:** a Google sign-in whose email already has a password
  identity is rejected; the user is pointed back to password login.
- **Verify-email banner still appears** for Google sign-ups (OSS Kratos v1.3
  cannot mark the address verified from the mapper).
- **Rotation:** to rotate the client secret, create a new secret in the same
  OAuth client, update `KRATOS_OIDC_PROVIDERS`, `docker compose up -d kratos`.
- **Kill switch:** set `KRATOS_OIDC_ENABLED=false` + `AUTH_GOOGLE_ENABLED=false`
  and roll `kratos api web` — the button disappears, endpoints 404.
