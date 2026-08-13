import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "../../fixtures/base";

const repoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

test("protected layout and page share one request-scoped session lookup", () => {
  const sessionSource = readFileSync(
    resolve(repoRoot, "app/src/features/auth/session.ts"),
    "utf8",
  );

  expect(sessionSource).toContain('import { cache } from "react";');
  expect(sessionSource).toContain(
    "export const readVerifiedAppSession = cache(resolveVerifiedAppSession);",
  );
  expect(sessionSource).toContain(
    "export const readMockSession = readVerifiedAppSession;",
  );
});
