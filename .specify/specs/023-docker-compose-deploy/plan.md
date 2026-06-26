# Implementation Plan: Docker Compose Stage And Production Deploy

**Branch**: `codex/docker-compose-prod-stage` | **Date**: 2026-06-26 | **Spec**: `.specify/specs/023-docker-compose-deploy/spec.md`

## Summary

Package the web app as a production Next.js standalone Docker image and add a Docker Compose runtime that can be used on staging or production VMs with env-file differences only. Keep the deployment web-only and explicitly preserve provider integration gates.

## Technical Context

**Language/Version**: TypeScript, React 19.2, Next.js 16.2.6 App Router, Node 22 Docker base image
**Primary Dependencies**: Next.js standalone output, Docker, Docker Compose
**Storage**: No containerized data storage; provider storage remains Supabase integration-gate work
**Testing**: Repo checks, Next build, Docker build, Compose config, Compose smoke-test, `/api/health`
**Target Platform**: Linux VM with Docker Engine and Docker Compose
**Project Type**: Next.js web application container
**Performance Goals**: Build a small standalone runtime image instead of copying full source and dev dependencies into the final image
**Constraints**: No production secrets in git, mock-first Stage 1 provider posture, one image across stage/prod
**Scale/Scope**: Web container packaging, Compose service, env examples, docs, CI build check

## Constitution Check

- Glassmorphism/Achromatic UI: N/A; no user-facing UI changes.
- Capsule methodology: N/A; no domain methodology changes.
- Direct, Not Dictate: PASS; docs state exactly what this deployment does and where provider gates remain.
- Premium quality bar: PASS; `/api/health` healthcheck, restart policy, and CI Docker build reduce deployment ambiguity.
- Three upload methods: N/A; no upload flow changed.
- Engineering reuse: PASS; existing `/api/health` and runtime env validation are reused instead of adding new deploy checks.

## Verification

| Acceptance criterion | Evidence |
| --- | --- |
| SC-001 feature memory guard | `npm run check:feature-memory -- --worktree` exited 0 and printed `Feature-memory gate passed via .specify/specs/023-docker-compose-deploy/{spec,plan,tasks}.md`. |
| SC-002 repo/app checks | `npm run check:repo`, `npm run check:api-contract`, `npm run lint`, `npm run typecheck`, and `npm run build` exited 0. Build output included `/api/health`, localized `/en`/`/ru` routes, legal SSG routes, and dynamic wardrobe routes. |
| SC-003 env templates validate | `npm run check:runtime-env -- --env deploy/stage.env.example --allow-placeholders` and `npm run check:runtime-env -- --env deploy/prod.env.example --allow-placeholders` exited 0. |
| SC-004 Docker image builds | `docker build --target runner -t capsule-zero-web:local ./app` exited 0 and exported `docker.io/library/capsule-zero-web:local`. |
| SC-005 Compose config renders | `CAPSULE_RUNTIME_ENV_FILE=./deploy/stage.env.example docker compose --env-file deploy/compose.env.example config` exited 0 and rendered the `web` service with `image: capsule-zero-web:local`, `target: runner`, `restart: unless-stopped`, `127.0.0.1:3000`, and `/api/health` healthcheck. |
| SC-006 Compose starts service | `cp deploy/stage.env.example deploy/runtime.env && CAPSULE_HOST_PORT=3010 docker compose --env-file deploy/compose.env.example up -d --build web` exited 0; `docker compose ps` showed `capsule-zero-docker-deploy-web-1` as `Up ... (healthy)` with `127.0.0.1:3010->3000/tcp`. |
| SC-007 `/api/health` returns 200 | `curl -sS -i http://127.0.0.1:3010/api/health` returned `HTTP/1.1 200 OK` with JSON `{"ok":true,"apiVersion":"0.1.0","providerMode":"mock",...}`. |
| SC-008 runtime env is ignored | `git check-ignore -v deploy/runtime.env` returned `.gitignore:7:deploy/*.env deploy/runtime.env`. |
| Negative scenario 2 provider gate remains explicit | Source audit: `app/src/lib/providers/registry.ts` still throws for `CAPSULE_PROVIDER_MODE=supabase`, and deploy docs state `mock` is the only runnable mode on current `main`. |
| FR-001 through FR-010 implementation coverage | Source audit: `app/Dockerfile`, `app/next.config.ts`, `docker-compose.yml`, `deploy/*.env.example`, `.gitignore`, `docs_capsule_zero/project/devops/docker-compose-deploy.md`, and `.github/workflows/ci.yml`. |

## SENAR Done Gate

- [x] Feature memory names goal and scope in `spec.md`.
- [x] Verification table names evidence for every acceptance criterion.
- [x] At least one negative scenario is covered.
- [x] `tasks.md` process memory is updated before completion.
- [ ] PR description includes the SENAR Done Gate checklist.
