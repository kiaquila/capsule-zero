import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// An external target (e.g. the docker stack at https://capsulezero.local) is
// already running — no dev server to spawn, and Node's TLS probe would reject
// the mkcert certificate anyway (Node ignores the system trust store).
const isExternalTarget = !baseURL.includes("localhost");

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: "test-results",
  use: {
    baseURL,
    ignoreHTTPSErrors: isExternalTarget,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit-iphone",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: isExternalTarget
    ? undefined
    : {
        command: "npm --prefix ../../app run dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
