import path from "node:path";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";
import { expect, test } from "../../fixtures/base";
import { ProfilePage } from "../../pages/ProfilePage";
import type { Locale } from "../../fixtures/locales";

const appRoot = path.resolve(process.cwd(), "../../app");
const loader = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  alias: {
    "@": path.join(appRoot, "src"),
    "server-only": path.join(appRoot, "node_modules/server-only/empty.js"),
    "next/headers": path.resolve("support/empty-next-headers.ts"),
  },
});
type Inventory = {
  sessions: {
    id: string;
    current: boolean;
    authenticatedAt?: string;
    expiresAt: string;
  }[];
  sessionsStatus: "available" | "unavailable";
  sessionsRevocable?: boolean;
};
async function render(account: Inventory, locale: Locale) {
  const { createElement } = (await loader.import(
    path.join(appRoot, "node_modules/react/index.js"),
  )) as { createElement: (...args: unknown[]) => unknown };
  const { renderToStaticMarkup } = (await loader.import(
    path.join(appRoot, "node_modules/react-dom/server.node.js"),
  )) as { renderToStaticMarkup: (element: unknown) => string };
  const { NextIntlClientProvider } = (await loader.import(
    path.join(
      appRoot,
      "node_modules/next-intl/dist/esm/production/index.react-client.js",
    ),
  )) as { NextIntlClientProvider: unknown };
  const { ProfileSessions } = (await loader.import(
    path.join(appRoot, "src/components/profile/ProfileSessions.tsx"),
  )) as { ProfileSessions: unknown };
  const messages = JSON.parse(
    readFileSync(path.join(appRoot, `src/messages/${locale}.json`), "utf8"),
  );
  return renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      { locale, messages, timeZone: "UTC" },
      createElement(ProfileSessions, {
        account: {
          ...account,
          sessions: account.sessions.map((session) => ({
            ...session,
            authenticatedAtLabel: session.authenticatedAt,
            expiresAtLabel: session.expiresAt,
          })),
        },
      }),
    ),
  );
}
for (const locale of ["en", "ru"] as const) {
  test(`${locale}: real session rows preserve timestamps and mark only current`, async ({
    page,
  }) => {
    const account: Inventory = {
      sessionsStatus: "available",
      sessionsRevocable: true,
      sessions: [
        {
          id: "current",
          current: true,
          authenticatedAt: "2026-10-21T10:00:00Z",
          expiresAt: "2026-11-21T10:00:00Z",
        },
        { id: "other", current: false, expiresAt: "2026-11-20T10:00:00Z" },
      ],
    };
    await page.setContent(await render(account, locale));
    const profile = new ProfilePage(page, locale);
    await expect(profile.sessionRows).toHaveCount(2);
    await expect(profile.revokeSession).toHaveCount(1);
    await expect(profile.revokeOthers).toHaveCount(1);
    await expect(profile.revokeSession).toHaveAttribute("type", "button");
    await expect(profile.revokeOthers).toHaveAttribute("type", "button");
    await expect(profile.currentSessionBadge).toHaveCount(1);
    await expect(profile.sessionsUnavailable).toHaveCount(0);
    await expect(profile.sessionsEmpty).toHaveCount(0);
    await expect(profile.sessionDates).toHaveCount(3);
    await expect(profile.sessionDates.first()).toHaveAttribute(
      "datetime",
      account.sessions[0]!.authenticatedAt!,
    );
  });
}

test("loaded-empty and unavailable never fabricate rows or current badges", async ({
  page,
}) => {
  const profile = new ProfilePage(page);
  for (const sessionsStatus of ["available", "unavailable"] as const) {
    await page.setContent(await render({ sessions: [], sessionsStatus }, "en"));
    await expect(profile.sessionRows).toHaveCount(0);
    await expect(profile.revokeSession).toHaveCount(0);
    await expect(profile.revokeOthers).toHaveCount(0);
    await expect(profile.currentSessionBadge).toHaveCount(0);
    await expect(
      sessionsStatus === "available"
        ? profile.sessionsEmpty
        : profile.sessionsUnavailable,
    ).toBeVisible();
  }
});
