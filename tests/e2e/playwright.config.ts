import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";
import {
  ORIGIN_GUARD_CANARY_ORIGIN,
  ORIGIN_GUARD_PORT,
} from "./fixtures/origin-guard";

const isCI = Boolean(process.env.CI);
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// An external target (e.g. the docker stack at https://capsulezero.local) is
// already running — no dev server to spawn, and Node's TLS probe would reject
// the mkcert certificate anyway (Node ignores the system trust store).
const isExternalTarget = !baseURL.includes("localhost");

// The origin guard (spec 037) rebuilds the /app as the production standalone
// server to catch a callback-redirect regression the localhost `next dev` suite
// physically cannot — see fixtures/origin-guard.ts. It costs a full standalone
// build per run, so it is opt-in: CI sets E2E_ORIGIN_GUARD=1 (required `test`
// job), and it never touches the localhost suite. It is meaningless against an
// external target (nothing to build/serve), so it only runs for a local base.
const runOriginGuard =
  process.env.E2E_ORIGIN_GUARD === "1" && !isExternalTarget;
const ORIGIN_GUARD_SPEC = /\.standalone\.spec\.ts$/;
const originGuardBaseURL = `http://127.0.0.1:${ORIGIN_GUARD_PORT}`;

// Visual baseline (spec 039 T004): opt-in via E2E_VISUAL=1, excluded from the
// CI `test` job. Playwright snapshots are platform-specific (macOS local vs
// ubuntu CI), so the no-diff evidence for behavior-preserving CSS refactors is
// a SAME-MACHINE before/after run — generate baselines with
// `--update-snapshots`, re-run plain after the refactor. CI drift protection
// is the stylelint token guardrail, not these screenshots.
const VISUAL_SPEC = /\.visual\.spec\.ts$/;
const runVisual = process.env.E2E_VISUAL === "1";

// Build an isolated standalone bundle (NEXT_DIST_DIR keeps it off the dev
// server's `.next`) with NEXT_PUBLIC_APP_URL baked to the canary, then serve it
// via `node server.js` bound to HOSTNAME=0.0.0.0 — the exact prod shape.
const originGuardWebServer = {
  command: [
    `NEXT_DIST_DIR=.next-origin-guard NEXT_PUBLIC_APP_URL=${ORIGIN_GUARD_CANARY_ORIGIN} npm --prefix ../../app run build`,
    `HOSTNAME=0.0.0.0 PORT=${ORIGIN_GUARD_PORT} NODE_ENV=production CAPSULE_PROVIDER_MODE=mock node ../../app/.next-origin-guard/standalone/server.js`,
  ].join(" && "),
  url: originGuardBaseURL,
  reuseExistingServer: !isCI,
  timeout: 300_000,
  stdout: "pipe" as const,
  stderr: "pipe" as const,
};

const devWebServer = {
  command: "npm --prefix ../../app run dev",
  url: baseURL,
  reuseExistingServer: !isCI,
  timeout: 180_000,
  stdout: "pipe" as const,
  stderr: "pipe" as const,
};

const webServer: PlaywrightTestConfig["webServer"] = isExternalTarget
  ? undefined
  : runOriginGuard
    ? [devWebServer, originGuardWebServer]
    : devWebServer;

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
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
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
      // The standalone origin guard and the visual baseline own their own
      // opt-in projects.
      testIgnore: [ORIGIN_GUARD_SPEC, VISUAL_SPEC],
    },
    {
      name: "webkit-iphone",
      use: { ...devices["iPhone 14"] },
      testIgnore: [ORIGIN_GUARD_SPEC, VISUAL_SPEC],
    },
    ...(runOriginGuard
      ? [
          {
            name: "origin-guard",
            testMatch: ORIGIN_GUARD_SPEC,
            // Request-level assertions against the standalone prod server; a
            // single browser engine is enough (no rendering involved).
            use: { ...devices["Desktop Chrome"], baseURL: originGuardBaseURL },
          },
        ]
      : []),
    ...(runVisual
      ? [
          {
            name: "visual-desktop",
            testMatch: VISUAL_SPEC,
            use: { ...devices["Desktop Chrome"] },
          },
          {
            // Mobile-first product: chromium mobile emulation at the iPhone 14
            // spec viewport. Chromium (not webkit) on purpose — one engine,
            // least snapshot flake; webkit coverage stays in the functional
            // suite.
            name: "visual-mobile",
            testMatch: VISUAL_SPEC,
            use: {
              ...devices["Desktop Chrome"],
              viewport: { width: 375, height: 812 },
              deviceScaleFactor: 2,
              isMobile: true,
              hasTouch: true,
            },
          },
        ]
      : []),
  ],
  webServer,
});
