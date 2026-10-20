# Feature: User Profile & Avatar

> Source: US-005 (spec.md). Prototype: `html-prototypes/profile.html`

## Overview
- **Purpose:** Profile personalization and preferences; advanced security/account sections shown in prototype are post-v0.1
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
7. Advanced security/settings sections shown in the prototype are design-only post-v0.1 and not required for v0.1 delivery

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

## Personal-name validation (spec 053)

First name and surname accept 1–40 Unicode characters after trimming, including `Ян` and a one-character name; the joined display name is limited to 80 characters. Empty/whitespace values are rejected. The separate Latin username remains 3–30 letters, digits or underscores; its localized error explicitly says "username"/"nickname" to avoid implying a minimum for personal names. The shared schema validates both the form and server action; Go accepts a nonblank display name of 1–80 Unicode characters.

## Honest personal data and sessions (spec 056)

A profile with no saved values leaves phone, date of birth, country, city and sizes empty. There are no sample defaults. Existing user-bound preferences are preserved, even when equal to former sample values; no value-based cleanup is permitted. The existing cookie stores fields outside the profile API and is scoped to its user ID. Country/city also persist through the profile API; blank strings clear them, while omitted fields preserve them and JSON null is rejected. API errors leave cookie preferences untouched and show the existing save error.

The current auth integration verifies the signed-in user but has no session inventory or reliable device/location/activity metadata. The account section shows localized session-details-unavailable copy, with no device entries or inferred current badge. Real session inventory is a separate auth capability.
