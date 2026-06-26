# Sprint 0 Runtime Provisioning

## Purpose

This runbook turns the Sprint 0 foundation into a runnable local/staging setup
when a feature reaches an integration gate. It is not required before
mock-first Stage 1 product implementation.

It does not store secrets in git. Use the committed `.env.example` files as
templates and keep real credentials in local env files, Vercel env vars,
Supabase dashboard settings, or the relevant provider dashboard.

## Preconditions

- GitHub `main` is current and required checks are green.
- Install runtime tools: Node/npm, Supabase CLI, Docker, and Flutter.
- Copy env templates:

```bash
cp app/.env.local.example app/.env.local
cp mobile/.env.example mobile/.env.local
```

- For Docker Compose staging or production web deploys, use
  `docs_capsule_zero/project/devops/docker-compose-deploy.md`.

- For mock-first Stage 1, placeholders or local mock values are acceptable.
  Fill real values only when running the relevant integration gate.
- Run:

```bash
npm run check:runtime-tooling
npm run check:runtime-env -- --env app/.env.local --env mobile/.env.local --allow-placeholders
```

When an integration gate opens and real values are present, rerun the runtime
env check without `--allow-placeholders`.

## Mock-First Stage 1

Stage 1 development can proceed without real Supabase cloud, Google, Apple,
Lava.top, Photoroom, remove.bg, or production Vercel credentials.

Use this posture until a feature explicitly needs real provider evidence:

- auth: email/password only; mock auth adapter is acceptable until Supabase
  staging is needed for persistence or RLS validation;
- database/search: use migrations, seed fixtures, and deterministic repository
  fixtures;
- storage: use local/mock storage responses for uploads, signed URL states, and
  failures;
- billing: use mock coin packs, invoice IDs, webhook replay, and ledger effects;
- image processing: use mock processed images plus timeout/failure states;
- social auth: defer Google OAuth and Apple Sign-In to MVP Stage 2.

Production credentials are never placed in local env files or shared with
agents. Test/staging credentials may be shared only when the owner explicitly
permits the integration work.

## Supabase Local Validation

The repo now has `supabase/config.toml`, migrations, storage policies, and RLS
contract tests. Use local validation before touching a linked cloud project.

```bash
supabase start
npm run check:supabase-local
```

Expected result:

- migrations `0001_initial_schema.sql` and `0002_storage_policies.sql` apply cleanly;
- `supabase/tests/rls_contract.sql` passes;
- local Studio is available at `http://127.0.0.1:54323`;
- local API is available at `http://127.0.0.1:54321`.

If local OAuth testing is needed, configure provider callback URLs with the
local Supabase Auth callback:

```text
http://localhost:54321/auth/v1/callback
```

## Supabase Cloud Provisioning

After local validation passes:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase test db --linked
```

Do not run `supabase db reset --linked` against a shared/staging project unless
the founder explicitly approves destructive reset for that project.

Dashboard checks:

- Storage buckets exist: `avatars`, `item-originals`, `item-processed`,
  `marketplace-imports`, `catalog-public`.
- Auth Site URL is the production/staging web URL.
- Auth additional redirect URLs include exact web callback URLs, local callback
  URLs, Vercel preview URLs, and the mobile deep-link callback.
- Data API access works through anon/authenticated keys while RLS still blocks
  cross-user reads/writes.

## Google And Apple OAuth

Google OAuth and Apple Sign-In are MVP Stage 2. Run this section only when the
social-auth integration gate opens.

Provider dashboard callback URL must point to Supabase Auth:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Local OAuth callback URL, when testing through the Supabase CLI:

```text
http://localhost:54321/auth/v1/callback
```

Supabase redirect allow-list should include:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/mobile-callback
https://<staging-or-production-domain>/auth/callback
https://<staging-or-production-domain>/auth/mobile-callback
capsulezero://auth/callback
```

Use exact production URLs. Use preview wildcards only for Vercel preview
deployments, and keep those narrower than a global `**` whenever possible.

## Lava.top Setup

Run this section only when the payment integration gate opens. Stage 1 uses
mock coin packs, invoice creation, webhook replay, and ledger effects.

Create the web-only coin products in Lava.top and map their provider IDs:

| Coin pack | Env variable               |
| --------- | -------------------------- |
| 5 coins   | `LAVA_COINS_5_PRODUCT_ID`  |
| 15 coins  | `LAVA_COINS_15_PRODUCT_ID` |
| 30 coins  | `LAVA_COINS_30_PRODUCT_ID` |

Create two separate secret values:

- `LAVA_API_KEY`: outbound API key used by Capsule Zero server code.
- `LAVA_WEBHOOK_API_KEY`: inbound webhook key shared with Lava.top and checked
  from the `X-Api-Key` header.

Webhook URL:

```text
https://<staging-or-production-domain>/api/webhooks/lava
```

Configure Lava.top webhook event type `Payment result` for one-time product
purchases. The handler must accept `payment.success`, record the raw event in
`lava_events`, and credit `coin_ledger` idempotently. Mobile remains read-only:
no Lava.top CTA, external payment link, or in-app purchase prompt in v0.1.

## Photoroom Spike

Run this section only when the image-processing integration gate opens. Stage 1
uses mock processed-image success, timeout, and failure states.

Run the spike on at least 10 representative real wardrobe images:

```bash
PHOTOROOM_API_KEY=... npm run spike:photoroom -- \
  --image ./samples/wardrobe/coat.jpg \
  --image ./samples/wardrobe/shoes.webp \
  --markdown .runtime/photoroom/results.md
```

The runner calls the Photoroom Remove Background endpoint, writes processed
images under `.runtime/photoroom/`, and records P50/P95/P99 latency plus a
manual quality checklist. The Sprint 0 gate passes only when P99 is at or below
5000 ms and founder review approves visual quality on representative garments.

If the gate fails, document one of these decisions:

- keep Photoroom and add async polling/retry before broad testing;
- switch the adapter to remove.bg for v0.1;
- rerun with controlled image size/capture guidance if the sample set was not
  representative.

## Evidence Template

Post this as a GitHub issue comment, PR comment, or committed measurement note
once real credentials and dashboards are configured for the relevant
integration gate.

```markdown
Sprint 0 runtime provisioning evidence

Date:
Operator:
Branch/commit:

Supabase

- Project ref:
- `supabase db push`: pass/fail
- `supabase test db --linked`: pass/fail
- Storage buckets verified: pass/fail
- RLS spot check: pass/fail

OAuth

- Google provider enabled: pass/fail
- Apple provider enabled: pass/fail
- Web callback verified: pass/fail
- Mobile callback/deep link verified: pass/fail

Lava.top

- Coin products mapped: pass/fail
- Webhook URL configured: pass/fail
- `X-Api-Key` webhook auth verified: pass/fail
- Idempotent webhook replay verified: pass/fail

Photoroom

- Sample count:
- P50:
- P95:
- P99:
- Quality review outcome:
- Decision:

Remaining blockers:
```

## References

- Supabase CLI config and local testing: https://supabase.com/docs/guides/local-development/cli/config
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Lava.top API and webhook auth: https://developers.lava.top/en
- Photoroom Remove Background API: https://docs.photoroom.com/api-reference-openapi
