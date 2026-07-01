import { relative } from "node:path";

const repoPath = (file) => relative(process.cwd(), file).replaceAll("\\", "/");

const appFiles = (files) =>
  files
    .map(repoPath)
    .filter((file) => file.startsWith("app/") && /\.(ts|tsx)$/.test(file))
    .map((file) => file.slice("app/".length));

const formattableFiles = (files) =>
  files.filter(
    (file) => !repoPath(file).startsWith("app/src/lib/api/generated/"),
  );

const appCssChanged = (files) =>
  files.map(repoPath).some((file) => file.startsWith("app/") && file.endsWith(".css"));

const shellQuote = (file) => `'${file.replaceAll("'", "'\\''")}'`;

export default {
  "*.{js,mjs,cjs,ts,tsx,json,md,css,yml,yaml}": (files) => {
    const commands = [];
    const prettierFiles = formattableFiles(files);
    const relativeFiles = appFiles(files);

    if (prettierFiles.length > 0) {
      commands.push(
        `prettier --write ${prettierFiles.map(shellQuote).join(" ")}`,
      );
    }

    if (relativeFiles.length > 0) {
      commands.push(
        `npm --prefix app run lint -- --fix ${relativeFiles.map(shellQuote).join(" ")}`,
      );
    }

    // Surface CSS problems (duplicate selectors, hardcoded error colour) when a
    // stylesheet changes. Warnings-first, so it reports without blocking the
    // commit; see the frontend audit report for the ratchet-to-error plan.
    if (appCssChanged(files)) {
      commands.push("npm --prefix app run lint:css");
    }

    return commands;
  },
};
