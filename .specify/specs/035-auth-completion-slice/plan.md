# Spec 035 — Plan & Verification

## Approach

One vertical slice on branch `feat/035-auth-completion`, TDD-first (this spec
is ≥ 025: failing tests are committed before the product code that makes them
pass). Kratos flow mechanics (exact `continue_with` payload shapes, email
link format of the `code`-method templates) are pinned against the live local
docker stack (Kratos v1.1.0 + MailHog) during verification, and the client is
written defensively against both documented shapes.

Order: spec + failing tests → Kratos config → Go client/handlers → contract →
web providers/actions/UI → docs → full verification (below) → local docker
stack for founder UI review → PR only after founder approval.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Failing tests committed before implementation (TDD) | Commit history: test commit precedes implementation commits on the PR branch |
| 2 | Go unit tests cover recovery start (code method + flowId), recovery complete (happy + wrong code), verification start/complete (happy + wrong code), password change (happy + wrong current password + unauthenticated) | `go test ./...` in `api/` green on PR head; test names in `internal/kratos` + `internal/auth` |
| 3 | Provider-agnostic e2e: recovery via UI (mock code `123456`) lands on dashboard with a fresh session | Playwright `specs/auth/recovery.spec.ts` green in the required `test` check |
| 4 | Provider-agnostic e2e: sign-up shows the verify-email banner; completing the code hides it | Playwright `specs/auth/verification.spec.ts` green in the required `test` check |
| 5 | Provider-agnostic e2e: profile password change succeeds and rejects a wrong current password | Playwright `specs/auth/password-change.spec.ts` green in the required `test` check |
| 6 | Full-stack recovery works against Kratos + MailHog (real email, real code) | Manual/local run of the MailHog-gated spec (`E2E_MAILHOG_URL`) against `docker-compose.dev.yml`; output recorded in tasks.md Process Memory |
| 7 | Full-stack verification: sign-up sends a code email; completing it flips `user.emailVerified` in whoami | Same local stack run; MailHog message + whoami diff recorded in Process Memory |
| 8 | Wrong/expired recovery code never issues a session (negative 1) | Go handler test + full-stack probe (`curl` recorded in Process Memory) |
| 9 | Unknown email on recovery/verification start returns the same shape as a known email (negative 3) | Go handler test + `curl` probe against the local stack |
| 10 | Config is valid: `kratos.yml` schema-checked by container boot; compose renders | `docker compose --env-file deploy/compose.env.example config` + local stack boot healthy |
| 11 | Contract in sync: openapi.yaml ↔ api-spec.md ↔ Go routes ↔ generated client | `node scripts/check-api-contract.mjs` green (part of `baseline-checks`) |
| 12 | Web quality gates | `npm run typecheck` + `npm run lint` clean |
| 13 | SMTP port doc fix (465 → 2465, Hetzner outbound block) | Diff of `deploy/compose.env.example` + runbook; live host already on 2465 (AUTH 235 recorded 2026-07-03) |
| 14 | Edge stays closed except what the slice needs | `infra/nginx*` diff: `/self-service/*` still 404 (Go API drives all flows server-side); nginx `-t` |
