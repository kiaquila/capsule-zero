import { expect, test } from "../../fixtures/base";
import { LegalPage } from "../../pages/LegalPage";
import { getApplicableTermsDocument } from "../../../../app/src/lib/legal/terms-versions";

test.describe("Landing — Russian future Terms", () => {
  test("publishes the new binding user-content protections in Russian", async ({
    page,
  }) => {
    const terms = new LegalPage(page, "terms-of-use/2026-09-15", "ru");
    await terms.goto();

    await expect(terms.heading).toHaveText("Условия использования");
    for (const copy of [
      "Вы сохраняете все права собственности",
      "нейтрального посредника",
      "Правила сообщества",
      "Политика в области авторских и иных интеллектуальных прав",
      "не гарантирует принадлежность прав, законность, точность",
      "100 долларов США",
      "возместить Capsule Zero",
    ]) {
      await expect(terms.article).toContainText(copy);
    }

    await expect(terms.article).not.toContainText(
      "You retain all ownership and intellectual property rights",
    );

    const applicableAtCutoff = getApplicableTermsDocument(
      "ru",
      new Date("2026-09-15T00:00:00.000Z"),
    );
    expect(applicableAtCutoff.title).toBe("Условия использования");
    expect(JSON.stringify(applicableAtCutoff)).toContain(
      "Вы сохраняете все права собственности",
    );
  });
});
