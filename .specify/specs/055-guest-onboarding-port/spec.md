# 055 — Guest onboarding reference port and autonomous delivery

## Goal

Port the guest onboarding from alexey-golubtsov/krist-capsule at `8328dca30e2ee6aa69d699aff8f67bc6701abab3` into Capsule Zero, preserving its UI and behavior, adding Mixed wardrobe and allowing evidence-based autonomous MVP decisions.

## Scope

In: localized `/start`, landing CTA, all 32 own-image assets, selection/count/results/recommendations/local persistence/photo-interest sheet/existing signup panel; Mixed = union of women and men presets, as existing `categories.ts` permits. Update canonical plan and active agent/delivery docs.
Out: subsequent onboarding refinements (separate PR after user feedback), account import/save backend, real photo processing, payment integration, shared merchant-image pool, stack replacement, changing required checks.

## Acceptance Criteria

- AC1: EN/RU landing primary CTA opens `/start` without registration; header login stays intact.
- AC2: Reference women/men flows retain their catalog, visual composition, counts, recommendations and result/signup sheet. All 32 images load locally.
- AC3: First step also offers Mixed; mixed catalog includes both sets, including dresses/skirts and chinos; switching wardrobe clears selections from the previous type.
- AC4: Selection/count/result persist on reload; restart/fresh reset; malformed stored data cannot crash or inject unknown selections. No result CTA exists without a wearable outfit; when roles are complete but colors conflict, explain a neutral replacement instead of interpolating an empty role list.
- AC5: Photo tiles keep the reference interest-only sheet; it never uploads or charges; the reference interest confirmation remains a local concept, not a server notification feature. Signup reuses real provider auth; browser progress is not misrepresented as an implemented account-save backend in delivery docs.
- AC6: PRODUCT-PLAN and active agent/governance docs delegate reversible product/architecture/implementation decisions based on evidence, reuse and fastest maintainable MVP path. No routine founder gate, no bypass of CI or review, no implicit contracts/payments/security waivers.

## Negative Scenarios

Empty/incompatible selection cannot open results; wrong-type or unknown stored IDs are discarded; switching wardrobe cannot leak prior selections. Production mock-provider guard and shared-merchant implementation gate remain intact.

## Authorized Reference Exceptions

The user requested exact reference UI before a separate refinement PR. For this port the reference result shows up to three recommendations and all outfits before signup, signup is the existing modal, photo tiles are an interest-only paid concept with no checkout. This supersedes historical Stage-1 UI sequencing for this slice. The catalog studio surface and 24px reference chrome radius are preserved via explicit tokens. No automatic account-save backend is claimed complete.

Native review P2 in PR #164 identified a reference defect: a complete-role, incompatible selection displayed an empty “Add …” hint. A minimal EN/RU replacement hint fixes that broken blocked state; no layout, counting or wider UX refinement is added. Regression test commit `16afdc2` precedes the fix.
