# Feature: User Profile & Avatar

> Source: US-005 (spec.md). Prototype: `html-prototypes/profile.html`

## Overview
- **Purpose:** MVP profile personalization and preferences; advanced security/account sections shown in prototype are post-MVP
- **User:** Authenticated user
- **Entry point:** `/profile` (from navigation/dashboard)

## User Flow — Avatar
1. On registration → default avatar assigned automatically
2. User navigates to Profile settings
3. Uploads JPEG or PNG image
4. Image auto-crops to circle
5. Avatar appears in navigation and profile

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | No custom avatar | Default avatar placeholder |
| Uploaded | Custom avatar set | Circular cropped photo |
| Uploading | Image processing | Loading indicator on avatar area |
| Edit mode | Changing avatar | Replace/delete options |

## Acceptance Criteria
1. Default avatar assigned on registration
2. Profile settings allow JPEG/PNG upload
3. Image auto-crops to circle
4. Replace or delete (revert to default) options available
5. Avatar appears in navigation and profile
6. Language preference saved in profile (see f-012-i18n.md)
7. Advanced security/settings sections shown in the prototype are design-only post-MVP and not required for MVP delivery

## Key Components
- **AvatarUpload** — circular crop zone with upload/replace/delete actions
- **ProfileForm** — name, email, language, and location fields
- **AccountActions** — logout and basic account actions
- **ProfileNav** — avatar display in navigation bar

## Edge Cases
- Oversized image → compress before upload or reject with suggestion
- Non-image file → error message
- Slow upload → progress indicator

## Related Features
- f-002-auth.md — Account creation
- f-012-i18n.md — Language preference in profile
