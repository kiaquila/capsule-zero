# Frontend Quality Audit — Capsule Zero web (`/app`)

> Date: 2026-07-01 · Branch audited: `origin/main` (`b15d4b0`) · Scope: `app/src/**` (+ light Go pass)
> Method: three parallel read-only Opus reviewers (architecture / code-review / adversarial critic), findings consolidated and de-duplicated here.
> Trigger: a shipped UX bug — a duplicate/overriding CSS rule made auth error messages render in the neutral colour, so "wrong password" looked like nothing happened. The founder correctly asked whether this is a symptom of deeper quality gaps. **It is.**

## TL;DR

The auth-error bug was not a fluke. Two **systemic** weaknesses produce a whole class of "the code runs but the user sees nothing / the wrong thing / a fake success":

1. **A 6,392-line unscoped `globals.css` where ~42% of selectors (196 of 463) are declared more than once.** In a single flat cascade, the later duplicate silently wins. The auth bug is one instance; there are more.
2. **UI flows wired to _look_ complete while doing nothing real** — because the mock provider never fails and never persists, these gaps are invisible until the real backend is wired.

The strongest part of the codebase is the **provider port/adapter layer** (`app/src/lib/providers/`) and **type safety** (zero `any`, zero non-null assertions). The weakest are **CSS architecture**, **error/loading state coverage**, and **honesty of "done-looking" flows**.

**Crucially, there is no lint gate on CSS at all** — adding one (`stylelint`) would have blocked the original bug at commit time and catches most of the CSS findings below automatically.

### Phase context (read before triaging)

`/app` is the current frontend; several "fake" findings below (capsule creation, wardrobe mutations) are **expected** at this phase because their backends are not built yet — the Go API is being wired one bounded context at a time (auth/profile first, in the open PR). These are **not "broken code to fix now"** so much as **silent fakes that must be made honest** (a visible "preview / coming soon" affordance) or tracked as Known Issues so they are never mistaken for done. That distinction is called out per finding.

---

## Root causes

- **RC-1 — CSS monolith, no layering, no scoping, no lint.** One 6,392-line file, flat cascade, 196 duplicated selectors. Cascade order is load-bearing and silent. There is no `@layer`, no CSS Modules, no stylelint. This is the direct soil of the auth bug and will keep producing overrides.
- **RC-2 — "Make it look done" pattern + no error discipline.** Core flows present spinners and success transitions for operations that never happen; provider errors have nowhere to surface (no error/loading boundaries). The mock provider hides both because it never fails and never persists.

---

## Findings (consolidated, severity-ranked)

Severity: **C** critical · **P1** high · **P2** medium · **P3** low. "Auto-catch" = the linter/tool that would flag it.

### C1 — Capsule creation is a `setTimeout` fake, not a real operation
- **Where:** `components/guided-journey/GuidedJourneyShell.tsx:361-370` — `createCapsule()` runs `window.setTimeout(… , 700)` then navigates; the user's assembled state is never sent anywhere. `capsule-result/page.tsx` → `capsule-result-data.ts:96` reads the pre-seeded `MOCK_CAPSULE` fixture, so the result is identical regardless of input.
- **Why it matters:** This is the product's central promise ("first capsule in 10 minutes"). It shows a spinner + success for something that didn't happen — the exact "runs but wrong" class, at maximum blast radius.
- **Phase caveat:** The capsule backend is a later stateful slice, so a placeholder is expected — but a **silent** placeholder violates the constitution's honesty/trust arc. **Action:** wire to `providers.capsules.createCapsule()` when that slice lands; until then add a visible "preview only" state and record it as a Known Issue. **Auto-catch:** an e2e that creates a capsule and asserts the result reflects the input.

### P1 — Second live duplicate-selector override (same bug class as the trigger)
- **Where:** `globals.css:528` vs `:5966` — `.dashboard-more-item-active` declared twice (`background .10` then `.14`); line 528 is dead. (The `.auth-server-message` original is already fixed in the open PR.)
- **Action:** delete the stale declaration. **Auto-catch:** stylelint `no-duplicate-selectors` (identical single-class → caught by default).

### P1 — No `error.tsx` / `loading.tsx` / `not-found.tsx` anywhere
- **Where:** none exist under `app/src/app/`; every page calls `await buildXSnapshot(...)` with no `try/catch` (data builders have zero `try/catch`).
- **Why it matters:** any provider throw → raw Next 500 with no UI. Violates the constitution red line "error surfaces to user" and the "min 3 states per screen" quality gate. Invisible today only because the mock never throws — it detonates the moment the real API is wired.
- **Action:** add root `app/[locale]/error.tsx` + `loading.tsx` (+ `global-error.tsx`); wrap section builders so a partial failure renders a per-panel error/empty state. Establish now so every later `/app` slice inherits it. **Auto-catch:** not statically catchable; convention + review.

### P1 — Error colour `#FFD600` hardcoded past the token (13+ sites)
- **Where:** `--color-error` (`tokens.css:31`) is used only 4× via token; the literal `#ffd600` / `rgba(255,214,0,…)` is hardcoded 13× (`globals.css:230, 402, 404, 4931, 4980, 5666, 5712, 5716, 5961-5963, 1009, …`). Separately, ~372 raw `rgba(255,255,255,…)` literals bypass the glass/text tokens.
- **Why it matters:** the single most safety-critical colour (constitution: error = `#FFD600`, never red) is not centralized → a token change silently misses call sites; brand/glass discipline erodes.
- **Action:** replace literals with `var(--color-error)` (add alpha tokens for border/background variants); sweep rgba-white toward tokens. **Auto-catch:** stylelint `declaration-strict-value` (a.k.a. `scale-unlimited/declaration-strict-value`) for `color`/`background`/`border-color` → tokens-only.

### P1 — Wardrobe mutations are local-state fakes (not persisted)
- **Where:** `components/my-items/MyItemsShell.tsx:75, 614` — favourite/status toggles mutate `useState` only; `providers.wardrobe.setFavorite` / `updateItemStatus` (fully implemented in both adapters) are never called. Changes vanish on reload.
- **Phase caveat:** wardrobe backend is a later slice. **Action:** wire via per-feature server actions when that slice lands; until then track as a Known Issue so it isn't mistaken for working. **Auto-catch:** e2e that toggles a favourite and reloads.

### P1 — `Button.tsx` is a dead, competing design system
- **Where:** `components/ui/Button.tsx` — zero importers; sole consumer of `framer-motion` (a shipped dependency) and of the neumorphism tokens (`--color-neu-bg`, `--shadow-neu-*`). Real buttons use raw global classes (`.auth-primary`, `.dashboard-primary-action`).
- **Why it matters:** a second, unused design language (neumorphism) next to the real one (glassmorphism); drags in `framer-motion` for nothing; misleads contributors (DRY rule #7).
- **Action:** delete `Button.tsx` + drop `framer-motion` + neu tokens — dead code with zero importers. `/app` is the canonical frontend (no `/app`→`/web` rename; AGENTS.md frontend/provider decision, 2026-06-30): if a shared button abstraction is ever needed, grow one canonical `Button` inside `/app` matching the established CSS glass-button convention. **Auto-catch:** `knip` (dead export/file); `depcheck` (unused dependency).

### P2 — ~7,000 lines of near-duplicated wardrobe-shell scaffolding
- **Where:** `FavoritesShell` (1,550), `ForSaleShell` (1,446), `ForRepairShell` (1,361), `UncapsulatedShell` (1,468), `MyItemsShell` (1,380) each re-implement the same page scaffold (header, filter/sort toolbar, colour-dot filter, item grid, detail-panel wiring, delete confirm, toast). Leaf components (`WardrobeItemCard`, `WardrobeItemDetailPanel`) are correctly shared; the surrounding shell was copy-pasted (~900 duplicated lines per pair). Violates DRY rule #7, which explicitly names "repeated wardrobe actions".
- **Action:** extract a `WardrobeListShell` parameterised by status filter, empty-state copy, available actions, delete policy. Sizable — its own follow-up. **Auto-catch:** `jscpd` (copy-paste detector) with a per-PR threshold.

### P2 — Colour-compatibility rule triplicated **and already divergent**
- **Where:** the methodology's pairwise compatibility is implemented three times — `mock/index.ts:611-621`, `capsule-result-data.ts:428-429`, `guided-journey-data.ts:138-139` — and they are **not equivalent**: `mock.validatePalette` tests each colour only against `chromatic[0]` (anchor), while `isItemCompatibleWithPalette` tests against every palette colour (pairwise). Different verdicts for 3+ colour palettes.
- **Why it matters:** the compatibility engine is core methodology and a stated differentiator; three copies guarantee drift and already have. Matches the unresolved `colors.md` vs prototype discrepancy already in project memory.
- **Action:** extract one `palette-compatibility.ts`; decide pairwise-vs-anchor semantics once; all three import it. **Auto-catch:** `jscpd`; ideally a shared-module lint boundary.

### P2 — Auth accessibility gaps
- **Where:** `AuthPanel.tsx` `AuthField` (382-408) — inputs have `id={name}` but **no `<label htmlFor>`** and **no `aria-label`** (placeholder-only labelling, a WCAG failure); the error `<p>` is not linked via `aria-describedby`. Only 1 `aria-describedby` exists in the whole tree.
- **Note:** the error/success **severity** half of this (`role="alert"` for errors, distinct styling) is already fixed in the open PR; the label/`aria-describedby` gap remains.
- **Action:** add visually-hidden `<label>` or `aria-label`; give the error `<p>` an `id` + wire `aria-describedby`. **Auto-catch:** `eslint-plugin-jsx-a11y` (`label-has-associated-control`, `control-has-associated-label`) — **not enabled** (`eslint-config-next` does not turn these on).

### P2 — Stringly-typed error decoding
- **Where:** `features/auth/actions.ts:107` — `message.split(":").at(-1)?.trim()` strips a `CODE: message` prefix; providers throw `Error("NOT_FOUND: …")` etc. No typed error contract.
- **Why it matters:** couples UI formatting to an implicit string format (a message containing a colon mis-splits), can leak internal tails, and the UI can't branch on error kind or localise it (i18n of errors impossible).
- **Action:** introduce a typed `ProviderError { code; message }` (class or discriminated union in `contracts.ts`); UI maps `code` → localised copy via next-intl. **Auto-catch:** review/test.

### P2 — Dead CSS rules (verified unreferenced)
- **Where:** `.profile-warning*` block (`globals.css:397, 411, 494, 499`), `.dashboard-primary-action-disabled` (`:1884`), `.dashboard-ghost-action-disabled` (`:2009`), `.cookie-link-row` (`:1151`), `.capsule-result-gap-icon-structural` (`:4649`), `.uncapsulated-detail-colors` (`:5943`).
- **Action:** delete. **Auto-catch:** PurgeCSS (report mode) or a CSS-class-to-TSX cross-reference script in CI (stylelint alone can't prove a class is unused against JSX).

### P3 — Smaller items
- **Naming lie:** `readMockSession` / `persistMockSession` / `clearMockSession` (`features/auth/session.ts:125-127`) are pure aliases of the **production** `*AppSession` functions; all 11 route pages import `readMockSession`. Rename to `*AppSession` at call sites.
- **Dead Zustand store:** `store/journeyStore.ts` is defined but imported nowhere (the Journey uses local `useState`). Adopt or delete. **Auto-catch:** `knip`.
- **Two token stores:** `tokens.css` and `tokens.json` can drift — pick one source and generate the other, or delete the orphan. (Open question: is `tokens.json` consumed by a build step?)
- **Scattered same-class redeclarations** that aren't live conflicts today but are trace-hostile: `.journey-field-note` (`:2700`/`:2707`), `.language-menu` (`:825`/`:903`), `.my-items-toast` (`:5887`/`:5897`), `.profile-session` (`:583`/`:587`). **Auto-catch:** stylelint `no-duplicate-selectors` (with `disallowInList: true`, see tooling note).
- **Upload cap disagreement:** mock `8 MB` (`mock/index.ts:47`) vs supabase `10 MB` (`supabase/index.ts:237`) vs spec `10 MB`. Single-source in `contracts.ts`.
- **`dangerouslySetInnerHTML`** for the journey step title (`GuidedJourneyShell.tsx:434`, fed by `t.raw(...)`). Translator-controlled today (constrained enum), not exploitable, but prefer `next-intl` `t.rich`.

---

## What's genuinely healthy (keep as the template for future `/app` slices)

- **Type safety:** zero `any`, zero `!.` non-null assertions, zero stray `console.*` (one intentional `console.warn` in the legacy provider). Excellent.
- **Provider port/adapter layer:** clean capability-segregated contracts (`contracts.ts`), a uniform `guard*Port(port, authorize)` decorator centralising authorization (supabase adapter). This is the strongest layer — make it the pattern for the Go-backed `api` provider. (One leak: the **mock** adapter does authorization ad-hoc inline rather than via the guard wrapper, so the two adapters enforce it differently — align them.)
- **Accessibility done right elsewhere:** `CookieBanner` / `LanguageSwitcher` use proper `role`/`aria-*`, toasts use `role="status"`. Use these as the a11y template for fixing `AuthPanel`.
- **Guided-journey link import** has correct inline error handling — the pattern the rest of the app should follow.

---

## Tooling proposal — the missing controls

Current state: ESLint (`eslint-config-next` flat config) + `tsc` + `next build`, run via `ci:check`, with husky + lint-staged (prettier on `*.css`, eslint `--fix` on `app/**/*.{ts,tsx}`). **No CSS lint, no a11y lint, no dead-code or copy-paste detection.** CSS is only *formatted* by prettier, never *linted* — which is exactly why the duplicate selector shipped.

Ranked by ROI against the findings above:

1. **stylelint** + `stylelint-config-standard`, wired into `lint-staged` for `*.css` and into `ci:check`. Rules that matter here:
   - `no-duplicate-selectors` **with `[true, { disallowInList: true }]`** — **empirically verified to flag the original bug** (`globals.css:1069 .auth-server-message` "first used at line 1044") plus ~20 other duplicated selectors on main. (Note: the *default* option only catches identical full rules; `disallowInList` is what catches the list-differing auth case. Expect it to be noisy against the current file — introduce as `warning` first, or baseline existing hits, then ratchet to `error`.)
   - `no-descending-specificity`, `declaration-block-no-duplicate-properties`.
   - **`scale-unlimited/declaration-strict-value`** for `color`/`background-color`/`border-color` → tokens only (catches the 13 hardcoded `#FFD600`).
2. **`eslint-plugin-jsx-a11y`** (`label-has-associated-control`, `control-has-associated-label`, …) — catches the auth label gaps; not on by default in `eslint-config-next`.
3. **PurgeCSS (report mode)** or a small CSS-class-to-TSX cross-reference script in CI — catches the dead-CSS list.
4. **knip** — dead TS exports/files (`Button.tsx`, `journeyStore.ts`); **depcheck** — unused deps (`framer-motion`).
5. **jscpd** with a per-PR duplication threshold — stops the wardrobe-shell duplication (and the triplicated compatibility rule) from regrowing after refactor.

**A regression test for the original bug** (auth error is visible / `role="alert"`) and **one for capsule persistence** (C1) are the two highest-value e2e additions — TDD is mandatory for specs ≥ 025, so these become the guard.

---

## Recommended remediation sequencing

1. **Tooling first (this PR or its immediate sibling):** add stylelint (warnings-first) + jsx-a11y + knip/jscpd. This freezes the bug classes from growing while the backlog is worked.
2. **Quick wins (small, safe):** delete the second live dup (`.dashboard-more-item-active`), the dead CSS rules, `Button.tsx` + `framer-motion`, the dead Zustand store; rename `*MockSession` → `*AppSession`; single-source the upload cap.
3. **State-coverage boundaries:** `error.tsx` / `loading.tsx` at `[locale]/`; typed `ProviderError`; finish the `AuthPanel` a11y (labels).
4. **Honesty pass (needs founder input):** make C1 (capsule creation) and the wardrobe mutations either real (when their slices land) or visibly "preview only"; record as Known Issues meanwhile.
5. **Bigger refactors (own PRs):** `WardrobeListShell` extraction; CSS `@layer` + per-feature split; one `palette-compatibility.ts`.

---

## Applied in this PR

Tooling (the "auto-catch" controls), all **warnings-first** so CI stays green against the existing debt, plus the safest quick-wins:

- **stylelint** added (`app/stylelint.config.mjs`, `lint:css` script with a `--max-warnings 102` regression baseline; wired into `ci:check`, the pre-commit `lint-staged` — a changed app CSS file triggers a whole-tree lint — plus the repo-root `lint:css` projection, the `preflight` chain, and the required `baseline-checks` CI job). Focused rules: `no-duplicate-selectors` (`disallowInList` — verified to flag the original `.auth-server-message` bug), `declaration-block-no-duplicate-properties`, and a disallowed-list rule forcing the error colour through `var(--color-error)` (the narrowed stand-in for the proposed `declaration-strict-value`; full tokens-only enforcement waits for the alpha-token follow-up). 102 warnings surfaced (0 errors) for triage; the baseline makes any *new* warning fail the run (probe: 104 found → exit 2).
- **eslint-plugin-jsx-a11y** label rules turned on (warn) — surfaces the placeholder-only inputs (14 warnings).
- **Deleted** the dead `Button.tsx` competing design system and removed the now-unused `framer-motion` dependency.
- **Fixed** the second live duplicate-override (`.dashboard-more-item-active`) and replaced the 5 solid hardcoded `#FFD600` literals with `var(--color-error)`.
- Verified: `npm run ci:check` (lint + lint:css + typecheck + build) green.

Deliberately deferred (own PRs / need input): the `error.tsx`/`loading.tsx` boundaries, the `WardrobeListShell` extraction, the CSS `@layer`/split, the `palette-compatibility.ts` unification, the auth a11y label fix (the auth form is being edited in the open auth-slice PR — avoid double-editing), the rgba error-tint alpha tokens, and the "honesty pass" on the fake flows (C1 + wardrobe mutations) which needs a founder decision.

## Open questions for the founder

- Is the Guided Journey `setTimeout` an intentional placeholder pending the capsule backend slice, or an oversight? Either way it needs a visible "preview only" affordance so it isn't a silent lie.
- Is `tokens.json` consumed by a build step (Style Dictionary?) or orphaned?
- Strategic (out of pure FE scope): `CLAUDE.md`/`AGENTS.md` declare Supabase "retired/frozen", yet it is currently the **only** production provider path (mock throws in prod). The open auth-slice PR introduces the `api` provider, which begins resolving this — worth confirming the sequencing so the "frozen" provider isn't the sole thing between the app and a prod failure during the transition.
