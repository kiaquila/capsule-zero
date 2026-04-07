# Feature: Photo Upload

> Source: US-017 (spec.md). Prototype: `html-prototypes/guided-journey.html` Step 3

## Overview
- **Purpose:** Upload photos of real wardrobe items with optional background removal and auto-tagging
- **User:** User adding items during Journey Step 3 or from My Items
- **Entry point:** "Upload Photos" tab in Journey Step 3, or Add Item from My Items

## User Flow
1. User sees drag-and-drop zone or file picker button
2. Selects file (JPEG, PNG, WebP accepted)
3. Optional background removal (checkbox, off by default)
4. System processes: auto-tagging generates name, category, color dots
5. Preview shown with all auto-tagged fields (editable)
6. User confirms → item saved

## Interface States

| State | Description | What user sees |
|-------|------------|----------------|
| Default | Upload zone | Drag-and-drop area + file picker button |
| Uploading | File selected | Progress indicator |
| Processing | AI analysis | Loading animation (< 5 sec target) |
| Preview | Auto-tagged | Photo + editable fields (name, category, color dots) |
| Editing | User correcting | Modified fields highlighted |
| Saved | Confirmed | Item added to wardrobe/capsule |
| Error | Invalid file | Error message (wrong format or too large) |

## Acceptance Criteria
1. Drag-and-drop or file picker available
2. Accepts JPEG, PNG, WebP
3. Optional background removal (checkbox, off by default)
4. Auto-tagging: name, category, color dots (all editable)
5. Preview before saving
6. Upload + processing < 5 seconds

## Validation Rules
- File format: JPEG, PNG, WebP only → error for other formats
- File size: max 10 MB → error with suggestion to compress
- At least name + category + 1 color dot required before save

## Key Components
- **DropZone** — drag-and-drop area with file picker fallback
- **UploadProgress** — progress bar during upload
- **BgRemovalToggle** — checkbox for optional background removal
- **AutoTagPreview** — photo + editable name/category/color dot fields
- **ColorDotEditor** — 1-3 color dots with edit capability

## Edge Cases
- Large file (>10MB) → error with compress suggestion
- Unsupported format (GIF, TIFF) → error listing supported formats
- Very dark/light photo → auto-tagging may struggle, easy manual correction
- Multiple uploads → process sequentially with queue indicator
- Personal photos → never become public in shared DB (v0.1)

## Related Features
- f-006-guided-journey.md — Parent flow (Step 3)
- f-005-my-items.md — Items appear in grid after upload
- f-007-marketplace-import.md — Alternative item addition method
