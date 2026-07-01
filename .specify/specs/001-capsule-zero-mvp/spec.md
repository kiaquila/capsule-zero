# Feature Specification: Capsule Zero MVP v0.1

**Feature Branch**: `001-capsule-zero-mvp`
**Created**: 2026-03-17
**Status**: Ready for Development
**Source Documents**: FVD v1.2, User Stories v1.4, Styling Guide v1.3, Emotion Map v1.0, UX Validation v1.0

## Overview

25 user stories (24 MUST-HAVE + 1 NICE-TO-HAVE). Persona: Intentional Curator, 25–40, upper-middle income.

**Happy path:** Landing → Registration → Dashboard (empty) → Journey 1/3 → Journey 2/3 → Journey 3/3 → Capsule Result → Dashboard (filled)

**Key decisions (v1.1):**

- Outfits are view-only (no drag-and-drop)
- Gap analysis is text-based (category + color)
- Capsule color palette is immutable (change = new capsule)
- Item addition/replacement validated against palette compatibility
- 1 free capsule per user (additional in v0.2)
- Killer features: marketplace link import + semantic search from shared DB
- Stage 1 implementation is mock-first for external services; Google OAuth and Apple Sign-In are deferred to MVP Stage 2

## User Scenarios & Testing

### US-001 — Landing Page (Priority: P1)

As a new user, I want to see a premium landing page with B&W editorial hero so I immediately understand the product positioning and want to register.

**Emotional target:** ATTRACTION — "This is not another clothes app — this is something else"

**Prototype:** `html-prototypes/index.html`

**Acceptance Scenarios:**

1. **Given** a new visitor, **When** the page loads, **Then** full-screen B&W photo with manifesto headline is centered, registration button in top-right corner
2. **Given** any visitor, **When** they view the page, **Then** language switcher (EN/RU in MVP v1) is visible next to registration
3. **Given** any device, **When** page loads on 4G, **Then** load time < 2 seconds
4. **Given** iPhone 14+, iPad, or desktop 1280px+, **Then** layout is responsive and adaptive
5. **Given** the page, **When** user evaluates it, **Then** it passes the "screenshot test"

---

### US-002 — Registration (Priority: P1)

As a new user, I want to register via email and password so I can quickly create an account in MVP Stage 1.

Google OAuth and Apple Sign-In are MVP Stage 2 scope.

**Emotional target:** TRUST — "Fast, beautiful, they respect my time"

**Prototype:** `html-prototypes/auth.html`, `html-prototypes/index.html` (popup)

**Acceptance Scenarios:**

1. **Given** the Stage 1 auth form, **When** displayed, **Then** it uses glassmorphic styling with email+password registration and no active Google/Apple buttons
2. **Given** form fields, **When** user types, **Then** real-time inline validation occurs
3. **Given** optional location field (country/city), **When** skipped, **Then** registration is not blocked
4. **Given** successful registration, **When** complete, **Then** redirect to Dashboard
5. **Given** any error, **When** displayed, **Then** errors are inline (no alert popups)
6. **Given** iPhone 14+, iPad, desktop 1280px+, **Then** form is adaptive

---

### US-003 — Authorization (Priority: P1)

As an existing user, I want to log in using email and password in MVP Stage 1 to continue working with my capsule.

Google OAuth and Apple Sign-In login are MVP Stage 2 scope.

**Prototype:** `html-prototypes/auth.html`, `html-prototypes/index.html` (popup)

**Acceptance Scenarios:**

1. **Given** the auth form, **When** displayed, **Then** login form with switcher to registration is shown
2. **Given** a user who forgot password, **When** they click "Forgot password", **Then** email recovery flow starts
3. **Given** a valid session, **When** user returns, **Then** session is preserved between visits
4. **Given** successful login, **When** complete, **Then** auto-redirect to Dashboard

---

### US-004 — Dashboard / Personal Cabinet (Priority: P1)

As an authorized user, I want to see a dashboard with my active capsule, summary stats, and quick-access sections so I can have a full overview of my wardrobe.

**Emotional target:** TRUST → CREATIVITY — "Everything is clear — here is my HQ"

**Prototype:** `html-prototypes/dashboard.html`

**Dashboard content:** active capsule hero card, OPR widget, summary stats, shopping list panel, recently added panel, quick-access sections, bottom navigation

**Acceptance Scenarios:**

1. **Given** the dashboard, **When** loaded, **Then** active capsule hero card with palette, item/outfit/category counts, and OPR is displayed
2. **Given** the active capsule, **When** the user clicks Open Capsule / Outfits / Shopping List, **Then** they navigate to the corresponding capsule view
3. **Given** the dashboard, **When** viewed, **Then** summary stats, shopping list preview, recently added items, and quick-access sections are displayed
4. **Given** quick-access sections or bottom navigation, **When** clicked, **Then** they navigate to the corresponding screen
5. **Given** any device, **When** viewed, **Then** navigation is intuitive across all devices

---

### US-005 — User Avatar (Priority: P1)

As a user, I want to upload my avatar to personalize my profile.

**Prototype:** `html-prototypes/profile.html`

**Acceptance Scenarios:**

1. **Given** registration, **When** account created, **Then** default avatar assigned
2. **Given** profile settings, **When** user uploads JPEG/PNG, **Then** image auto-crops to circle
3. **Given** an uploaded avatar, **When** user wants to change, **Then** replace or delete (revert to default) options available
4. **Given** an avatar, **When** displayed, **Then** it appears in navigation and profile

---

### US-006 — My Items (Grid View) (Priority: P1)

As a user, I want to see all my clothing items in a grid with names, photos, and color dots.

**Emotional target:** SATISFACTION — "Each item is in its place — and I can manage it"

**Prototype:** `html-prototypes/my-items.html`

**Acceptance Scenarios:**

1. **Given** items exist, **When** grid loads, **Then** cards show: name in header + photo + color dots
2. **Given** a card, **When** viewed, **Then** capsule membership indicator is visible
3. **Given** a card, **When** clicked, **Then** navigates to detail card
4. **Given** filters, **When** applied, **Then** grid filters by category and color

---

### US-007 — My Items (Edit) (Priority: P1)

As a user, I want to edit item information (name, category, color, photo) to correct auto-tagging or update data.

**Prototype:** `html-prototypes/my-items.html` (detail view)

**Acceptance Scenarios:**

1. **Given** a card, **When** Edit button clicked, **Then** editable fields: name, photo, category, color dots, brand, material/composition, price
2. **Given** editing, **When** saved, **Then** saves without page reload
3. **Given** required fields, **When** missing, **Then** name + category + color dots are highlighted as required

---

### US-008 — Guided Journey Step 1/3 (Priority: P1)

As a new user, I want to choose wardrobe type (women's/men's/mixed) to get relevant categories.

**Emotional target:** CREATIVITY — "One simple choice = one decision. I'm already in the process."

**Prototype:** `html-prototypes/guided-journey.html`

**Acceptance Scenarios:**

1. **Given** Step 1, **When** displayed, **Then** three large visual cards (Women's/Men's/Mixed)
2. **Given** a selection, **When** made, **Then** choice is locked, proceed to Step 2
3. **Given** Step 2, **When** user wants to change, **Then** ability to go back to Step 1
4. **Given** the step, **When** viewed, **Then** progress indicator shows 1/3

---

### US-009 — Guided Journey Step 2/3 (Priority: P1)

As a user, I want to select garment categories from a checklist to define my capsule composition.

**Emotional target:** CREATIVITY — "I'm choosing my ideal wardrobe — every category is intentional"

**Prototype:** `html-prototypes/guided-journey.html`

**Acceptance Scenarios:**

1. **Given** Step 2, **When** displayed, **Then** textual category checklist (no visuals) with quantity steppers
2. **Given** wardrobe type, **When** selected in Step 1, **Then** categories filtered by gender
3. **Given** selections, **When** fewer than 8, **Then** min 8 categories validated before proceeding
4. **Given** the checklist, **When** user wants custom category, **Then** "Add your own category" button available (system validates basicity)
5. **Given** the step, **When** viewed, **Then** progress shows 2/3, capsule size label displayed

---

### US-010 — Guided Journey Step 3/3 (Priority: P1)

As a user, I want to choose color palette and add items (photos, links, or search) to get a personalized result.

**Emotional target:** CREATIVITY — "Colors come together into a system — I see my style!"

**Prototype:** `html-prototypes/guided-journey.html`

**Acceptance Scenarios:**

1. **Given** Step 3, **When** displayed, **Then** achromatic colors appear first in the palette, followed by all other colors in one continuous grid
2. **Given** any compatible palette color, **When** selected, **Then** it becomes part of the capsule palette up to 15 total colors / 12 chromatic colors
3. **Given** colors already selected, **When** another color is outside the compatible group set, **Then** it becomes unavailable for selection
4. **Given** items section, **When** displayed, **Then** three upload methods available: Upload Photos / Paste Links / Search Catalog
5. **Given** all selections, **When** "Create capsule" clicked, **Then** capsule is generated, redirect to Result

---

### US-011 — Marketplace Link Import (Priority: P1)

As a user, I want to paste marketplace URLs so the system parses them and adds items to my wardrobe.

**Emotional target:** CREATIVITY — "I pasted links — and items are already here. Magic!"

**Prototype:** `html-prototypes/guided-journey.html` (tab "Paste Links")

**Acceptance Scenarios:**

1. **Given** the input, **When** one or multiple URLs pasted, **Then** system parses: name, category, colors, all photos, brand, material/composition, source URL
2. **Given** parsed items, **When** displayed, **Then** minimalist interface for each item — choose one photo from several
3. **Given** auto-tagging, **When** complete, **Then** user can correct before saving
4. **Given** parsing, **When** in progress, **Then** loading state with progress of parsing shown
5. **Given** unrecognized URL, **When** submitted, **Then** error state for unrecognized links
6. **Given** a product URL, **When** submitted, **Then** the system attempts best-effort parsing of item data from the page

---

### US-012 — Semantic Search from Shared Database (Priority: P1)

As a user, I want to find similar items from the shared database by description to add them to my capsule.

**Emotional target:** CREATIVITY — "I can find anything I want — and it's all matched to my palette"

**Prototype:** `html-prototypes/guided-journey.html` (tab "Search Catalog")

**Acceptance Scenarios:**

1. **Given** search input, **When** free text entered (e.g., "chocolate loafers"), **Then** semantic search returns results from shared DB
2. **Given** results, **When** displayed, **Then** cards with photos shown
3. **Given** a result, **When** selected, **Then** item added to capsule with "from catalog" label
4. **Given** added item, **When** user later acquires own, **Then** can replace with their own item

---

### US-013 — Capsule Result (Priority: P1)

As a user, I want to see my completed capsule with outfits, gap analysis, and shopping list.

**Emotional target:** SATISFACTION — "Here it is — my system. And it's beautiful."

**Prototype:** `html-prototypes/capsule-result.html`

**Acceptance Scenarios:**

1. **Given** the result, **When** loaded, **Then** visual grid of items with color dots displayed
2. **Given** outfits tab, **When** viewed, **Then** static outfit combinations shown (view-only)
3. **Given** gap analysis tab, **When** viewed, **Then** text-based list: category + color of missing items
4. **Given** shopping list tab, **When** viewed, **Then** text list: category + color + priority + impact (+N outfits)
5. **Given** data, **When** generated, **Then** all based on categories, palette, and item auto-tagging

---

### US-014 — Remove from Capsule (Priority: P1)

As a user, I want to remove an item from a capsule to adjust its composition.

**Acceptance Scenarios:**

1. **Given** an item in capsule, **When** remove button clicked, **Then** confirmation dialog shown
2. **Given** confirmation, **When** confirmed, **Then** item moves to Uncapsulated
3. **Given** removal, **When** complete, **Then** outfits and gap analysis recomputed

---

### US-015 — Replace Item in Capsule (Priority: P1)

As a user, I want to replace an item to improve combinability.

**Acceptance Scenarios:**

1. **Given** an item, **When** "Replace" action triggered, **Then** selection from My Items, shared DB, or upload
2. **Given** a replacement, **When** selected, **Then** color compatibility validated against capsule palette
3. **Given** incompatible replacement, **When** attempted, **Then** blocked with recommendation for separate capsule
4. **Given** replacement, **When** complete, **Then** replaced item goes to Uncapsulated, outfits recomputed

---

### US-016 — Add Item to Capsule (Priority: P1)

As a user, I want to add a new item to an existing capsule to expand outfit count.

**Acceptance Scenarios:**

1. **Given** capsule view, **When** "Add item" clicked, **Then** selection from My Items, shared DB, or upload
2. **Given** new item color, **When** validated, **Then** must be compatible with capsule palette
3. **Given** incompatible item, **When** attempted, **Then** blocked with recommendation
4. **Given** addition, **When** complete, **Then** outfits recomputed

---

### US-017 — Photo Upload (Priority: P1)

As a user, I want to upload photos of my items to populate my wardrobe with real items.

**Prototype:** `html-prototypes/guided-journey.html` Step 3

**Acceptance Scenarios:**

1. **Given** upload UI, **When** displayed, **Then** drag-and-drop or file picker button available
2. **Given** file selection, **When** file chosen, **Then** accepts JPEG, PNG, WebP
3. **Given** upload, **When** processed, **Then** optional background removal (checkbox, off by default)
4. **Given** processed image, **When** complete, **Then** auto-tagging: name, category, color dots (editable)
5. **Given** preview, **When** shown, **Then** result preview before saving
6. **Given** processing, **When** timed, **Then** upload + processing < 5 seconds

---

### US-018 — Multilingual (Priority: P1)

As a user, I want to switch the interface language (EN/RU in MVP v1; ES-AR in MVP v2) to use the platform comfortably.

**Acceptance Scenarios:**

1. **Given** language switcher, **When** available, **Then** shown on landing page and in profile
2. **Given** language switch, **When** triggered, **Then** all UI elements translated
3. **Given** AI stylist content, **When** generated, **Then** also translated
4. **Given** language switch, **When** performed, **Then** no page reload required
5. **Given** language preference, **When** set, **Then** saved in user profile

---

### US-019 — Favorites (Priority: P1)

As a user, I want to add items to favorites to quickly return to them.

**Emotional target:** "My favorites — and inspiration from catalogs"

**Prototype:** `html-prototypes/favorites.html`

**Acceptance Scenarios:**

1. **Given** any item card, **When** heart icon clicked, **Then** item added to favorites (own or from catalog)
2. **Given** favorites section, **When** viewed, **Then** split into two sub-sections: "My" and "From Catalogs"
3. **Given** favorites list, **When** displayed, **Then** sorted by date added

---

### US-020 — Uncapsulated (Priority: P1)

As a user, I want to see items not in any capsule to decide their fate.

**Emotional target:** "These items await their destiny — and that's normal"

**Prototype:** `html-prototypes/uncapsulated.html`

**Acceptance Scenarios:**

1. **Given** uncapsulated section, **When** viewed, **Then** shows items not in any capsule
2. **Given** each item, **When** actions available, **Then** can add to capsule, move to "For Sale", or "For Repair"
3. **Given** filters, **When** applied, **Then** filter by category

---

### US-021 — For Sale (Priority: P1)

As a user, I want to mark items for sale so they don't count in wardrobe statistics.

**Prototype:** `html-prototypes/for-sale.html`

**Acceptance Scenarios:**

1. **Given** an item, **When** "For Sale" action triggered, **Then** item moves to For Sale section
2. **Given** a for-sale item, **When** viewed, **Then** not counted in capsules or statistics
3. **Given** a for-sale item, **When** user changes mind, **Then** can return to My Items

---

### US-022 — Cost per Wear (Priority: P2 — NICE-TO-HAVE)

As a user, I want to track cost per wear to evaluate purchase effectiveness.

**Acceptance Scenarios:**

1. **Given** item editing, **When** price field shown, **Then** user can enter purchase price
2. **Given** a price, **When** wear count tracked, **Then** cost per wear = price / wears calculated
3. **Given** cost per wear, **When** displayed, **Then** shown on item card

---

### US-023 — Outfit Productivity Ratio (Priority: P1)

As a user, I want to see the OPR of my capsule to understand wardrobe efficiency.

**Acceptance Scenarios:**

1. **Given** dashboard, **When** capsule card displayed, **Then** OPR shown in format "X.X" (e.g., 4.2)
2. **Given** capsule change, **When** items added/removed/replaced, **Then** OPR recalculated
3. **Given** OPR change, **When** displayed, **Then** delta shown: "+0.3 from last change"

---

### US-024 — For Repair (Priority: P1)

As a user, I want to mark items for repair so they're excluded from capsules until fixed.

**Prototype:** `html-prototypes/for-repair.html`

**Acceptance Scenarios:**

1. **Given** an item, **When** "For Repair" action triggered, **Then** item moves to For Repair section
2. **Given** a for-repair item, **When** viewed, **Then** not counted in capsules or statistics
3. **Given** a for-repair item, **When** fixed, **Then** can return to My Items or Uncapsulated
4. **Given** an item was in capsule, **When** moved to repair, **Then** removed from capsule, outfits recomputed

---

### US-025 — Public Imported Items (Priority: P1)

As a system, I want imported marketplace items to populate the shared database for semantic search enrichment.

**Acceptance Scenarios:**

1. **Given** a marketplace import, **When** saved, **Then** item stored in shared DB with owner flag (private)
2. **Given** user validation, **When** auto-tagging confirmed, **Then** internal moderation triggered
3. **Given** moderation pass, **When** approved, **Then** item gets "public" flag, available in semantic search
4. **Given** architecture, **When** designed, **Then** single record with publicity flag (no duplication)
5. **Given** personal photos, **When** uploaded, **Then** do NOT become public in v0.1

---

### Edge Cases

- Fully achromatic capsule → Valid. No accent colors needed.
- Incompatible item color → NOT added. Block with recommendation for separate capsule.
- Custom category rejected → Error with explanation + suggestion of similar basic category.
- Item with multiple colors → Primary color (largest area) used for validation. All dots preserved.
- Empty capsule (categories set, no items) → Valid "plan" state. Gap analysis = all gaps.
- Incorrect import auto-tagging → User can edit all fields.
- User wants to change palette → Not possible in v0.1. Create new capsule (v0.2).

## Requirements

### Functional Requirements

- **FR-001**: System MUST support registration via email+password in MVP Stage 1; Google OAuth and Apple Sign-In are deferred to MVP Stage 2
- **FR-002**: System MUST validate fields inline in real-time during auth
- **FR-003**: System MUST persist user sessions between visits
- **FR-004**: System MUST display a dashboard with active capsule hero, OPR widget, summary stats, shopping list preview, recently added items, and quick-access wardrobe sections
- **FR-005**: System MUST implement 3-step Guided Journey (type → categories → colors+items)
- **FR-006**: System MUST enforce min 8 categories for capsule creation
- **FR-007**: System MUST validate item colors against capsule palette using same-group or Desaturated↔Dark compatibility, with achromatics always compatible
- **FR-008**: System MUST block incompatible items with explanation and alternative
- **FR-009**: System MUST lock capsule palette after creation (immutable in v0.1)
- **FR-010**: System MUST generate outfit combinations algorithmically from capsule items
- **FR-011**: System MUST calculate and display OPR (outfits / items)
- **FR-012**: System MUST perform gap analysis and generate prioritized shopping list
- **FR-013**: System MUST parse marketplace URLs using a best-effort generic parser, with retailer-specific adapters where needed for higher accuracy
- **FR-014**: System MUST provide semantic search from shared item database
- **FR-015**: System MUST support photo upload with optional background removal
- **FR-016**: System MUST auto-tag items (name, category, color dots) on upload/import
- **FR-017**: System MUST support i18n (EN and RU in MVP v1, ES-AR deferred to MVP v2) with runtime switching
- **FR-018**: System MUST be responsive (375px, 768px, 1280px+)
- **FR-019**: System MUST implement favorites with "My" and "From Catalogs" sub-sections
- **FR-020**: System MUST track items across sections (My Items, Uncapsulated, For Sale, For Repair)

### Key Entities

- **User**: Profile, avatar, language preference, coin balance
- **Capsule**: Name, wardrobe type, color palette (locked), categories, items, OPR
- **Item**: Name, photo(s), category, color dots (1-3), brand, material, price, source URL, capsule membership, basicity score
- **Outfit**: Generated combination of items following layer rules and color harmony
- **Palette**: User-selected achromatic and chromatic colors, ordered with achromats first in UI, governed by same-group or Desaturated↔Dark compatibility rules
- **Shopping List Item**: Category, recommended color, priority, impact (+N outfits)

## Success Criteria

- **SC-001**: First capsule result (with outfits + gap analysis) within 10 minutes of registration
- **SC-002**: Page load < 2 seconds on 4G
- **SC-003**: Photo upload + background removal < 5 seconds
- **SC-004**: Every screen passes the "screenshot test" — premium editorial quality
- **SC-005**: Lighthouse Performance 90+, Accessibility 95+
- **SC-006**: Zero console errors, zero FOUC
- **SC-007**: All 16 screens adaptive (iPhone 14+, iPad, Desktop 1280px+)
- **SC-008**: Language switching without page reload
- **SC-009**: Beta users: first impression 4.5+/5, 60%+ complete full flow
- **SC-010**: NPS 50+ from early adopters
