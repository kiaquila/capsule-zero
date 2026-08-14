import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // TypeScript 7 has no compiler API. Keep Next.js on the aliased TypeScript 6
    // API while the standalone `typecheck` command uses the native TS 7 CLI.
    useTypeScriptCli: false,
  },
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  // Default `.next`. Overridable so the e2e origin-guard (tests/e2e, spec 037)
  // can produce an isolated standalone build with a canary NEXT_PUBLIC_APP_URL
  // without clobbering the `.next` the dev server uses for the browser suite.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default withNextIntl(nextConfig);
