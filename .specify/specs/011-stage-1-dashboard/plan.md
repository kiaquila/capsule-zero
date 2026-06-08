# Implementation Plan: Stage 1 Dashboard

**Branch**: `codex/stage-1-dashboard` | **Date**: 2026-06-08 | **Spec**: `.specify/specs/011-stage-1-dashboard/spec.md`

## Summary

Replace the placeholder post-auth dashboard with a localized mock-first dashboard derived from the approved HTML prototype. Keep data loading in the server route through the existing provider registry, pass a stable dashboard view model into the UI, and stop at local verification until the user approves PR creation.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.2.6 App Router
**Primary Dependencies**: next-intl, existing provider registry and mock fixtures
**Storage**: Mock session cookie only; no Supabase persistence
**Testing**: `npm run preflight`, app lint/typecheck/build, local Browser smoke check
**Target Platform**: Web app under `app/src/`
**Project Type**: Next.js web application
**Performance Goals**: Dashboard loads from deterministic in-process fixtures; no external provider calls
**Constraints**: Achromatic glass UI, mobile-first 375px support, EN/RU only for MVP v1, PR only after user approval
**Scale/Scope**: Dashboard route, UI components, messages, CSS, feature memory

## Constitution Check

- Glassmorphism is preserved with existing glass tokens, nav blur, and wallpaper-backed surfaces.
- The interface remains achromatic; color appears only through palette dots sourced from wardrobe/capsule colors.
- Capsule methodology is not changed; OPR is displayed from current fixture counts.
- "Direct, not dictate" is preserved through clear navigation and non-blocking previews.
- Premium quality is addressed by matching the approved dashboard prototype and verifying locally.
- Three upload methods are not implemented in this slice and remain untouched.

## Verification

| Acceptance criterion | Evidence |
| -------------------- | -------- |
| SC-001 / FR-001 | Browser or curl check for unauthenticated `/en/dashboard` redirect |
| SC-002 / FR-002-FR-004 / FR-007-FR-008 | Local Browser login and dashboard smoke check |
| SC-003 / FR-005-FR-006 | Local Browser RU dashboard check and `<html lang>` inspection |
| SC-004 / FR-009 | Local Browser viewport checks for desktop and mobile |
| SC-005 | `npm run preflight` |
| SC-006 | `git diff --check` |
| SC-007 | `npm run check:feature-memory -- --worktree` |
| SC-008 / FR-010 | DOM or code audit confirms primary dashboard CTAs are guarded and no `/guided-journey` or `/capsule-result` primary CTA links are exposed |
| Provider gate safety | Existing provider registry still rejects `CAPSULE_PROVIDER_MODE=supabase` |

Negative scenario evidence:

- Dashboard language controls expose EN/RU only.
- Unauthenticated dashboard access redirects to localized auth.
- Arbitrary mock-session users keep user-scoped empty wardrobe/capsule data instead of falling back to founder fixtures.
- No real Supabase, OAuth, Lava.top, marketplace, semantic search, or image-processing calls are introduced.

## Project Structure

```text
app/src/app/[locale]/dashboard/page.tsx
app/src/components/dashboard/DashboardShell.tsx
app/src/components/dashboard/dashboard-data.ts
app/src/messages/en.json
app/src/messages/ru.json
app/src/app/globals.css
.specify/specs/011-stage-1-dashboard/
```

**Structure Decision**: Keep dashboard data derivation near the dashboard component, but keep provider access in the server route. This lets later dashboard/profile slices replace the mock snapshot source without coupling UI components to provider APIs.

## Complexity Tracking

No constitution violations.
