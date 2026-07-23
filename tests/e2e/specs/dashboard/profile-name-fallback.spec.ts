import path from "node:path";

import { createJiti } from "jiti";

import { expect, test } from "../../fixtures/base";

type DashboardSnapshotBuilder = (options: {
  registry: {
    profiles: {
      getProfile(userId: string): Promise<{
        displayName: string;
        email: string;
        city?: string;
        coinBalance: number;
      }>;
    };
    wardrobe: {
      listItems(userId: string): Promise<[]>;
    };
    capsules: {
      getCurrentCapsule(userId: string): Promise<null>;
    };
  };
  session: { userId: string; email: string; name?: string };
  locale: "en" | "ru";
}) => Promise<{
  profile: {
    displayName: string;
    email: string;
    initials: string;
  };
}>;

const appRoot = path.resolve(process.cwd(), "../../app");
const appModuleLoader = createJiti(import.meta.url, {
  alias: {
    "@": path.resolve(appRoot, "src"),
    "next/headers": path.resolve(
      process.cwd(),
      "support/empty-next-headers.ts",
    ),
    "server-only": path.resolve(appRoot, "node_modules/server-only/empty.js"),
  },
});

test.describe("Dashboard — credentials-only profile name", () => {
  test("derives a nonempty name from email when the API returns no name", async () => {
    const dashboardData = (await appModuleLoader.import(
      "../../../../app/src/components/dashboard/dashboard-data",
    )) as { buildDashboardSnapshot: DashboardSnapshotBuilder };
    const snapshot = await dashboardData.buildDashboardSnapshot({
      registry: {
        profiles: {
          async getProfile() {
            return {
              displayName: "",
              email: "new.user@example.com",
              coinBalance: 0,
            };
          },
        },
        wardrobe: {
          async listItems() {
            return [];
          },
        },
        capsules: {
          async getCurrentCapsule() {
            return null;
          },
        },
      },
      session: {
        userId: "credentials-user",
        email: "new.user@example.com",
      },
      locale: "en",
    });

    expect(snapshot.profile.displayName).toBe("new.user");
    expect(snapshot.profile.initials).toBe("NU");
  });
});
