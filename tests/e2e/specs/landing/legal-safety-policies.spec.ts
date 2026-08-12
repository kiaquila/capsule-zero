import { expect, test } from "../../fixtures/base";
import { LOCALES } from "../../fixtures/locales";
import { LegalPage, type LegalSlug } from "../../pages/LegalPage";

const policyDocuments: ReadonlyArray<{
  slug: LegalSlug;
  title: string;
  requiredCopy: readonly string[];
}> = [
  {
    slug: "community-guidelines",
    title: "Community Guidelines",
    requiredCopy: [
      "AI-generated or manipulated content",
      "Child safety",
      "Intellectual property, counterfeit items, and other rights",
      "Spam, manipulation, and deceptive commercial behavior",
    ],
  },
  {
    slug: "copyright-policy",
    title: "Copyright & Intellectual Property Policy",
    requiredCopy: [
      "10 to 14 business days",
      "repeat-infringer policy",
      "standard technical measures",
      "misrepresentation",
    ],
  },
  {
    slug: "enforcement-policy",
    title: "Enforcement & Appeals Policy",
    requiredCopy: [
      "automated tools, manual review, and hybrid review",
      "limit distribution",
      "statement of reasons",
      "abuse of reports or appeals",
    ],
  },
];

test.describe("Landing — community safety policy routes", () => {
  test("all safety policies render in each active locale", async ({ page }) => {
    for (const locale of LOCALES) {
      for (const policy of policyDocuments) {
        const legal = new LegalPage(page, policy.slug, locale);
        await legal.goto();

        await expect(legal.root).toBeVisible();
        await expect(legal.heading).toHaveText(policy.title);
        for (const copy of policy.requiredCopy) {
          await expect(legal.root).toContainText(copy);
        }

        // Negative scenario: publishing policies must not activate the gated
        // shared-import surface or transfer ownership of user content.
        await expect(legal.root).not.toContainText(
          "shared user-import pool is currently available",
        );
        await expect(legal.root).not.toContainText(
          "Capsule Zero owns Your Content",
        );
      }
    }
  });
});
