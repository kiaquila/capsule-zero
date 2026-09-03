import { expect, test } from "../../fixtures/base";
import { LOCALES, type Locale } from "../../fixtures/locales";
import { LegalPage, type LegalSlug } from "../../pages/LegalPage";

interface PolicyExpectation {
  forbiddenCopy: readonly string[];
  slug: LegalSlug;
  title: string;
  requiredCopy: readonly string[];
}

const policyDocuments = {
  en: [
    {
      forbiddenCopy: ["Capsule Zero owns Your Content"],
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
      forbiddenCopy: ["Capsule Zero owns Your Content"],
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
      forbiddenCopy: ["Capsule Zero owns Your Content"],
      slug: "enforcement-policy",
      title: "Enforcement & Appeals Policy",
      requiredCopy: [
        "automated tools, manual review, and hybrid review",
        "limit distribution",
        "statement of reasons",
        "abuse of reports or appeals",
      ],
    },
  ],
  ru: [
    {
      forbiddenCopy: [
        "Capsule Zero owns Your Content",
        "Community Guidelines",
      ],
      slug: "community-guidelines",
      title: "Правила сообщества",
      requiredCopy: [
        "Материалы, созданные или изменённые с помощью ИИ",
        "Безопасность детей",
        "Интеллектуальная собственность, контрафактные товары и иные права",
        "Спам, манипуляции и вводящее в заблуждение коммерческое поведение",
      ],
    },
    {
      forbiddenCopy: [
        "Capsule Zero owns Your Content",
        "Community Guidelines",
      ],
      slug: "copyright-policy",
      title: "Политика в области авторских и иных интеллектуальных прав",
      requiredCopy: [
        "10–14 рабочих дней",
        "политики в отношении повторных нарушителей",
        "стандартным техническим мерам",
        "существенное искажение",
      ],
    },
    {
      forbiddenCopy: [
        "Capsule Zero owns Your Content",
        "Community Guidelines",
      ],
      slug: "enforcement-policy",
      title: "Политика модерации и обжалования",
      requiredCopy: [
        "автоматизированной проверки, ручной проверки и их сочетания",
        "ограничить распространение",
        "изложение причин",
        "злоупотребления жалобами или апелляциями",
      ],
    },
  ],
} as const satisfies Record<Locale, readonly PolicyExpectation[]>;

test.describe("Landing — community safety policy routes", () => {
  test("all safety policies render in each active locale", async ({ page }) => {
    for (const locale of LOCALES) {
      for (const policy of policyDocuments[locale]) {
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
        for (const copy of policy.forbiddenCopy) {
          await expect(legal.root).not.toContainText(copy);
        }
      }
    }
  });
});
