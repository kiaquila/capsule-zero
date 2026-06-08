# 012 — Palette Alignment

## Goal

Align Capsule Zero color documentation, prototypes, and Stage 1 mock methodology behavior with the current `kiaquila/pallete-maker` source of truth.

## Scope

### In

- Use the current `pallete-maker/src/scripts/harmony.mjs` palette values and harmony rules as the reference.
- Update Capsule Zero methodology docs and product memory that still describe the old temperature/saturation compatibility model.
- Update approved HTML prototypes that expose palette picker behavior or hard-coded wardrobe palette dots.
- Update Stage 1 mock fixtures and palette validation so product code follows the same group-based rule.

### Out

- No real Supabase/provider integration.
- No UI redesign beyond text, palette values, and compatibility behavior alignment.
- No migration of user-owned persisted color data because Stage 1 remains mock-first.

## Acceptance Scenarios

1. **Given** Capsule Zero methodology docs, **When** color compatibility is described, **Then** it matches `pallete-maker`: achromatics always pass, chromatics pass by same group or the `desaturated ↔ dark` cross-pair, and temperature is display metadata only.
2. **Given** the documented 51-color palette, **When** compared with `pallete-maker`, **Then** the names and HEX values match the current palette, including true white `#FFFFFF` and the aligned pastel sequence.
3. **Given** the Guided Journey prototype, **When** a user selects colors, **Then** incompatible colors are blocked by the group-based rule and the 15 total / 12 chromatic caps are enforced.
4. **Given** Stage 1 mock palette validation, **When** a palette mixes incompatible groups, **Then** it is blocked with an explanation; when it mixes `desaturated ↔ dark`, it remains valid.

## Negative Scenarios

- Bright + Pastel must remain blocked even when both colors are warm.
- The 13th chromatic color must be blocked even when all selected chromatics are from the compatible `desaturated ↔ dark` pair.

## Requirements

- **FR-001**: Palette docs MUST match the current `pallete-maker` 51-color catalog.
- **FR-002**: Compatibility docs MUST remove temperature/saturation matching as a hard compatibility rule.
- **FR-003**: Prototypes MUST not show or execute the old 63-color temperature/shade picker model.
- **FR-004**: Mock methodology validation MUST enforce the same group-based compatibility and caps as `pallete-maker`.
- **FR-005**: PR evidence MUST include local verification and GitHub check results for the current PR head.
