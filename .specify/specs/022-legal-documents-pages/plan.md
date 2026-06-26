# Implementation Plan: Legal Documents Pages

**Branch**: `codex/legal-documents-layout` | **Date**: 2026-06-24 | **Spec**: `.specify/specs/022-legal-documents-pages/spec.md`
**Input**: Feature specification from `.specify/specs/022-legal-documents-pages/spec.md`

## Summary

Add embedded Terms of Use and Privacy Policy pages to the localized Next.js app, backed by structured legal content and a shared legal renderer. Apply the requested redesign by removing separate intro/highlight blocks and combining the title, metadata, and contents list into one native glass block.

## Technical Context

**Language/Version**: TypeScript, React, Next.js App Router
**Primary Dependencies**: Next.js App Router, next-intl, existing Capsule Zero global CSS tokens
**Storage**: None changed
**Testing**: ESLint, TypeScript, Next build, browser DOM/layout spot checks, GitHub guard
**Target Platform**: Localized responsive web app
**Project Type**: Next.js web application
**Performance Goals**: Static legal pages with no runtime provider calls
**Constraints**: Glassmorphism UI, achromatic interface, EN/RU route scope only for MVP v1, structured reusable content over copied markup
**Scale/Scope**: Two localized routes, one shared renderer, one structured legal content module, and legal CSS

## Constitution Check

- Glassmorphism UI: PASS; legal pages use the existing `dashboard-glass` surface language and translucent controls.
- Achromatic interface: PASS; no new color accents were introduced.
- Direct, Not Dictate: PASS; legal copy frames AI/methodology recommendations as suggestions and preserves user responsibility.
- Premium quality bar: PASS; layout is native to the site and avoids separate static-document presentation.
- Three upload methods: N/A; no upload flow changed.
- Engineering reuse: PASS; both legal documents use the same renderer and structured content model.

## Verification _(mandatory — required by SENAR)_

| Acceptance criterion | Evidence |
| --- | --- |
| US1-AC1 Terms renders inside app layout | Artifact A: Playwright/Chrome DOM check for `/en/terms-of-use` returned `title: "Terms of Use"`, `indexCount: 1`, `articleCount: 1`, and `tocLinks: 22`. |
| US1-AC2 Terms title/meta/contents share one block | Artifact A: `/en/terms-of-use` returned `heroCount: 0`, `highlightsCount: 0`, `indexCount: 1`, `hasLastUpdated: true`, and `hasStatus: true`. |
| US1-AC3 Terms covers commercial/legal edge cases | Artifact B: source-title extraction from `app/src/lib/legal-content.ts` returned 22 Terms sections, including content, AI output, marketplace services, coins, payments, refunds, app-store terms, IP, acceptable use, suspension, disclaimers, liability, governing law, changes, and contact. |
| US2-AC1 Privacy renders inside app layout | Artifact A: Playwright/Chrome DOM check for `/en/privacy-policy` returned `title: "Privacy Policy"`, `indexCount: 1`, `articleCount: 1`, and `tocLinks: 20`. |
| US2-AC2 Privacy title/meta/contents share one block | Artifact A: `/en/privacy-policy` returned `heroCount: 0`, `highlightsCount: 0`, `indexCount: 1`, `hasLastUpdated: true`, and `hasStatus: true`. |
| US2-AC3 Privacy covers data-handling edge cases | Artifact B: source-title extraction from `app/src/lib/legal-content.ts` returned 20 Privacy sections, including controller/contact, personal data, sensitive data/photos, purposes/legal bases, AI processing, subprocessors, international transfers, cookies, retention, security, rights, breach notice, regional notices, children, links, changes, and contact. |
| Negative scenario 1 removed blocks stay absent | Artifact A: both legal routes returned `heroCount: 0` and `highlightsCount: 0`. |
| Negative scenario 2 no page-level horizontal overflow | Artifact A: both legal routes returned `scrollWidth: 1280`, `clientWidth: 1280`, and `noHorizontalOverflow: true`. |
| Negative scenario 3 localized static route generation remains valid | Artifact D: `npm run build` generated `/en/privacy-policy`, `/ru/privacy-policy`, `/en/terms-of-use`, and `/ru/terms-of-use` as SSG routes. |
| FR-001 through FR-008 implementation coverage | Artifacts B and C: source commands show localized legal routes, structured document data, shared renderer classes, and nav-glass token usage. |
| SC-001 local checks | Artifact D: `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/check-feature-memory.mjs origin/main HEAD`, and `git diff --check origin/main HEAD` all exited 0. |
| SC-005 GitHub guard | Artifact D: local feature-memory guard printed `Feature-memory gate passed via .specify/specs/022-legal-documents-pages/{spec,plan,tasks}.md`; the PR guard check repeats this script on GitHub for the pushed head. |

### Evidence Artifacts

**Artifact A — Browser DOM/layout check**

Command: Node REPL with Playwright and system Chrome against `npm run dev -- --hostname 127.0.0.1 --port 3002`.

```json
[
  {
    "path": "/en/terms-of-use",
    "title": "Terms of Use",
    "heroCount": 0,
    "highlightsCount": 0,
    "indexCount": 1,
    "articleCount": 1,
    "tocLinks": 22,
    "hasLastUpdated": true,
    "hasStatus": true,
    "scrollWidth": 1280,
    "clientWidth": 1280,
    "noHorizontalOverflow": true,
    "legalSwitcherBackground": "rgba(255, 255, 255, 0.13)",
    "legalSwitcherBorderColor": "rgba(255, 255, 255, 0.2)"
  },
  {
    "path": "/en/privacy-policy",
    "title": "Privacy Policy",
    "heroCount": 0,
    "highlightsCount": 0,
    "indexCount": 1,
    "articleCount": 1,
    "tocLinks": 20,
    "hasLastUpdated": true,
    "hasStatus": true,
    "scrollWidth": 1280,
    "clientWidth": 1280,
    "noHorizontalOverflow": true,
    "legalSwitcherBackground": "rgba(255, 255, 255, 0.13)",
    "legalSwitcherBorderColor": "rgba(255, 255, 255, 0.2)"
  }
]
```

**Artifact B — Legal content section coverage**

Command:

```bash
node - <<'NODE'
const fs = require('fs');
const src = fs.readFileSync('app/src/lib/legal-content.ts', 'utf8');
const docs = ['terms-of-use', 'privacy-policy'];
for (const doc of docs) {
  const start = src.indexOf(`  "${doc}": {`);
  const endDoc = doc === 'terms-of-use' ? src.indexOf('  "privacy-policy": {') : src.length;
  const chunk = src.slice(start, endDoc);
  const titles = [...chunk.matchAll(/title: "([0-9]+\. [^"]+)"/g)].map((m) => m[1]);
  console.log(`${doc}: ${titles.length} sections`);
  console.log(titles.join(' | '));
}
NODE
```

Output:

```text
terms-of-use: 22 sections
1. Who We Are and How to Reach Us | 2. Eligibility and Age Requirements | 3. Accounts, Authentication, and Security | 4. The Capsule Zero Service | 5. Your Content and Your License to Us | 6. AI-Assisted Output, Methodology, and Transparency | 7. Marketplace Import and Third-Party Services | 8. Shared Catalog, Semantic Search, and Public Items | 9. Coins and Paid Digital Features | 10. Payments, Pricing, Taxes, and Invoices | 11. Refunds, Cancellations, and Right of Withdrawal | 12. Mobile Applications and App Store Terms | 13. Intellectual Property and Notice-and-Action Procedure | 14. Acceptable Use and Content Moderation | 15. Availability, Updates, and Discontinuation | 16. Suspension, Termination, and Account Deletion | 17. Disclaimers | 18. Limitation of Liability | 19. Indemnity | 20. Governing Law, Disputes, and Consumer Rights | 21. Changes to These Terms | 22. How to Contact Us
privacy-policy: 20 sections
1. Controller, Data Protection Officer, and Representatives | 2. Scope of This Policy | 3. Personal Data We Collect | 4. Sensitive Data, Wardrobe Photos, and Biometrics | 5. Sources of Personal Data | 6. Purposes, Legal Bases, and Necessity | 7. AI, Automated Processing, and Recommendations | 8. Subprocessors and How We Share Personal Data | 9. International Transfers and Safeguards | 10. Cookies, Tracking, and Online Identifiers | 11. Retention Periods | 12. Security Measures | 13. Your Privacy Rights | 14. Automated Decision-Making and Profiling | 15. Data Breach Notification | 16. Regional Notices | 17. Children and Minors | 18. Third-Party Links | 19. Changes to This Policy | 20. How to Contact Us
```

**Artifact C — Source implementation and nav-glass token usage**

Commands:

```bash
rg -n "legalDocuments|terms-of-use|privacy-policy|legal-index" app/src/app app/src/components/legal/LegalPage.tsx app/src/lib/legal-content.ts
rg -n "legal-header-links|--glass-nav-bg|--glass-nav-blur|--glass-nav-border|backdrop-filter: blur\\(var\\(--glass-nav-blur\\)\\)" app/src/app/globals.css app/src/styles/tokens.css
```

Output excerpt:

```text
app/src/app/[locale]/privacy-policy/page.tsx:12:const document = legalDocuments["privacy-policy"];
app/src/app/[locale]/terms-of-use/page.tsx:12:const document = legalDocuments["terms-of-use"];
app/src/components/legal/LegalPage.tsx:37:        <section className="legal-index dashboard-glass">
app/src/styles/tokens.css:57:  --glass-nav-bg:       rgba(255,255,255,0.13);
app/src/styles/tokens.css:58:  --glass-nav-blur:     44px;
app/src/styles/tokens.css:59:  --glass-nav-border:   rgba(255,255,255,.20);
app/src/app/globals.css:1161:  border: 1px solid var(--glass-nav-border);
app/src/app/globals.css:1163:  background: var(--glass-nav-bg);
app/src/app/globals.css:1165:  backdrop-filter: blur(var(--glass-nav-blur));
app/src/app/globals.css:1166:  -webkit-backdrop-filter: blur(var(--glass-nav-blur));
```

**Artifact D — Local checks**

Commands and relevant output:

```text
npm run lint
> app@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .

npm run typecheck
> app@0.1.0 typecheck
> tsc --noEmit

npm run build
✓ Compiled successfully
✓ Generating static pages using 9 workers (30/30)
├ ● /[locale]/privacy-policy
│ ├ /en/privacy-policy
│ └ /ru/privacy-policy
├ ● /[locale]/terms-of-use
│ ├ /en/terms-of-use
│ └ /ru/terms-of-use

node scripts/check-feature-memory.mjs origin/main HEAD
Feature-memory gate passed via .specify/specs/022-legal-documents-pages/{spec,plan,tasks}.md

git diff --check origin/main HEAD
# exited 0 with no output
```

## Project Structure

### Documentation (this feature)

```text
.specify/specs/022-legal-documents-pages/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/src/app/[locale]/privacy-policy/page.tsx
app/src/app/[locale]/terms-of-use/page.tsx
app/src/app/globals.css
app/src/components/legal/LegalPage.tsx
app/src/lib/legal-content.ts
```

**Structure Decision**: Keep legal copy as structured TypeScript data and render it through one shared component, so future translations or policy revisions can update content without duplicating page markup.

## Complexity Tracking

No constitution violations identified before implementation.
