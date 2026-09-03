import { expect, test } from "../../fixtures/base";
import { LegalPage } from "../../pages/LegalPage";

test.describe("Landing — Russian Terms", () => {
  test("publishes the current binding user-content protections in Russian", async ({
    page,
  }) => {
    const terms = new LegalPage(page, "terms-of-use", "ru");
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

  });
});
