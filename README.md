# Capsule Zero

## MVP algorithm contract — required before release (2026-10-21)

Current guest-v1 is an interim colour/category implementation. MVP is complete only after the pre-signup and account paths share the full colour + simplicity + currentness + whole-outfit cut checks, with validated counts and recommendation gains. This documentation update does not implement that engine.

Authority: [PRODUCT-PLAN D4/Q5](PRODUCT-PLAN.md); attributes: [methodology §6.1](docs_capsule_zero/project/methodology/capsule-methodology.md);
whole-look, counting, versioning and quality rules: [outfit generation §2.5](docs_capsule_zero/project/methodology/outfit-generation.md).

Guest onboarding: `/{locale}/start` (EN/RU), female/male/mixed, 32 own-image presets and browser-local progress. Landing CTA enters this flow. Delivered reference/account-save scope and algorithm version limits: [guest onboarding](docs_capsule_zero/features/guest-onboarding.md). Autonomous MVP decision policy: [PRODUCT-PLAN §0.1](PRODUCT-PLAN.md).

Platform for building capsule wardrobes and managing your closet — a proprietary
color methodology that turns closet chaos into a productive system where every
item works harder. Web app + iOS/Android mobile app.

Built openly with AI agents. The **delivery process is meant to be borrowed** —
the agentic workflow lives in [`scripts/`](scripts/). The **application code is
not** — it is proprietary and protected by copyright.

## License

Proprietary — all rights reserved. See [LICENSE](LICENSE). Process tooling under
`scripts/` may be reused; the product code may not.
