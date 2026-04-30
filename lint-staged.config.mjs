import { relative } from "node:path";

const repoPath = (file) => relative(process.cwd(), file).replaceAll("\\", "/");

const appFiles = (files) =>
  files
    .map(repoPath)
    .filter((file) => file.startsWith("app/") && /\.(ts|tsx)$/.test(file))
    .map((file) => file.slice("app/".length));

const formattableFiles = (files) =>
  files.filter(
    (file) =>
      !repoPath(file).startsWith("app/src/lib/api/generated/") &&
      !repoPath(file).startsWith("mobile/lib/api/generated/"),
  );

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

    return commands;
  },
};
