# Implementation Plan: Stage 1 Landing and Auth

**Branch**: `codex/stage-1-landing-auth` | **Date**: 2026-06-07 | **Spec**: `.specify/specs/010-stage-1-landing-auth/spec.md`

## Summary

Implement the first user-facing Stage 1 slice by converting the approved landing/auth HTML prototypes into locale-aware Next.js routes, backed by mock provider auth and a preserved mock session cookie. Include cleanup for completed Sprint 0 docs and the current frontend dependency baseline.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: `next-intl`, React Hook Form, Zod, existing provider registry
**Storage**: Mock session cookie only; no Supabase persistence
**Testing**: `npm run preflight`, app lint/typecheck/build, local Chrome smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: Landing remains static/lightweight; no external provider calls
**Constraints**: Achromatic glass UI, mobile-first 375px support, no active OAuth in Stage 1
**Scale/Scope**: Landing, auth, minimal dashboard redirect target, i18n setup

## Constitution Check

- Glassmorphism is preserved with existing glass tokens and wallpaper-backed surfaces.
- The UI remains achromatic; color appears only in yellow validation errors.
- Capsule methodology is not changed.
- "Direct, not dictate" is preserved by inline validation and recovery feedback.
- Premium quality is addressed by matching the approved prototypes and verifying in Chrome.
- Three upload methods are not touched.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001-FR-003 / FR-008 | Local Chrome smoke check for `/en` and `/ru`; `npm --prefix app run build` |
| SC-002 / FR-004-FR-006 | Local Chrome auth form check; `npm --prefix app run typecheck`; `npm --prefix app run lint` |
| SC-003 / FR-006-FR-007 | Local Chrome valid mock auth redirect check |
| SC-004 | `npm run preflight` |
| FR-009 | Diff in `.specify/specs/003-sprint-0-foundation/tasks.md` and `docs_capsule_zero/project/frontend/frontend-docs.md` |
| Repo baseline | `npm run check:repo` |
| API contract unchanged | `npm run check:api-contract` |
| Feature memory | `npm run check:feature-memory -- --worktree` |
| Whitespace safety | `git diff --check` |

Negative scenario evidence:

- Local Chrome check confirms no active Google/Apple OAuth controls render on landing or standalone auth.
- Invalid email/weak password/mismatched password submissions stay inline and do not redirect.

## Project Structure

```text
app/src/app/
  page.tsx
  layout.tsx
  [locale]/
    layout.tsx
    page.tsx
    auth/page.tsx
    dashboard/page.tsx
app/src/components/
  auth/
  dashboard/
  landing/
app/src/features/auth/
app/src/i18n/
app/src/messages/
.specify/specs/010-stage-1-landing-auth/
```

**Structure Decision**: Keep product routes under the App Router locale segment and keep reusable auth/session code under `app/src/features/auth/` so later dashboard/profile slices can consume the same mock-first session boundary.

## Complexity Tracking

No constitution violations.
