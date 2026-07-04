# Spec 035 — Plan & Verification

## Approach

One vertical slice on branch `feat/035-auth-completion`, TDD-first (this spec
is ≥ 025: failing tests are committed before the product code that makes them
pass). Kratos flow mechanics (exact `continue_with` payload shapes, email
link format of the `code`-method templates) are pinned against the live local
docker stack (Kratos v1.3.1 + MailHog) during verification, and the client is
written defensively against both documented shapes.

Order: spec + failing tests → Kratos config → Go client/handlers → contract →
web providers/actions/UI → docs → full verification (below) → local docker
stack for founder UI review → PR only after founder approval.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Failing tests committed before implementation (TDD) | Commit history: test commit precedes implementation commits on the PR branch |
| 2 | Go unit tests cover recovery start (code method + flowId), recovery complete (happy + wrong code + password-policy rejection), verification start/complete (happy + wrong code), password change (happy + wrong current password + unauthenticated) | `go test ./...` in `api/` green on PR head; test names in `internal/kratos` + `internal/auth` |
| 3 | Provider-agnostic e2e: forgot-password via UI (mock code `123456`, sign-in email prefilled) lands on dashboard | Playwright `specs/auth/forgot-password.spec.ts` green in the required `test` check |
| 4 | Provider-agnostic e2e: sign-up shows the verify-email banner; completing the code hides it | Playwright `specs/auth/verify-email-banner.spec.ts` green in the required `test` check |
| 5 | Provider-agnostic e2e: profile password change succeeds via click or Enter and rejects a wrong current password | Playwright `specs/auth/profile-change-password.spec.ts` green in the required `test` check; local review-fix run covers Enter |
| 5a | Provider-agnostic e2e: sign-in (session survives reload) and sign-out (dashboard locked behind /auth) | Playwright `specs/auth/sign-in.spec.ts` + `sign-out.spec.ts` green in the required `test` check |
| 6 | Full-stack forgot-password: resend invalidates the first code, the resent code rotates the password, old password dies | `specs/auth/forgot-password-fullstack.spec.ts` green against the docker stack; output in tasks.md |
| 7 | Full-stack verification: banner code entry AND the emailed link (no extra screens) both verify; state survives reload | `specs/auth/verify-email-fullstack.spec.ts` green against the docker stack |
| 7a | Full-stack profile password change: old password stops working, new one signs in | `specs/auth/profile-change-password-fullstack.spec.ts` green against the docker stack |
| 7b | Every user-facing auth error renders localized (EN/RU) via the machine-code map | Code review of `error-codes.ts` + `auth.errors.*` keys; wrong-code/wrong-password full-stack negatives show mapped text |
| 8 | Wrong/expired recovery code never issues a session (negative 1) | Go handler test + full-stack probe (`curl` recorded in Process Memory) |
| 9 | Unknown email on recovery/verification start returns the same shape as a known email (negative 3) | Go handler test + `curl` probe against the local stack |
| 10 | Config is valid: `kratos.yml` schema-checked by container boot; compose renders | `docker compose --env-file deploy/compose.env.example config` + local stack boot healthy |
| 11 | Contract in sync: openapi.yaml ↔ api-spec.md ↔ Go routes ↔ generated client | `node scripts/check-api-contract.mjs` green (part of `baseline-checks`) |
| 12 | Web quality gates | `npm run typecheck` + `npm run lint` clean |
| 13 | SMTP port doc fix (465 → 2465, Hetzner outbound block) | Diff of `deploy/compose.env.example` + runbook; live host already on 2465 (AUTH 235 recorded 2026-07-03) |
| 14 | Edge stays fully closed: `/self-service/*` and `/sessions/*` 404; emailed recovery/verification links land on app routes (custom courier templates) | `infra/nginx*` diff; kratos boots with the template config; full-stack link-click e2e green |
