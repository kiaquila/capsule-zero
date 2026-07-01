#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SPECS_DIR = ".specify/specs";
const PRODUCT_PATHS = ["app/", "api/", "worker/", "web/", "mobile/"];
const PRODUCT_PATH_LABEL = PRODUCT_PATHS.map((path) => `\`${path}\``).join(
  ", ",
);
const REQUIRED_FEATURE_FILES = ["spec.md", "plan.md", "tasks.md"];

function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--worktree") {
      args.worktree = true;
    } else if (arg === "--target") {
      args.target = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--target=")) {
      args.target = arg.slice("--target=".length);
    } else if (arg.startsWith("--")) {
      args[arg.slice(2)] = true;
    } else {
      args._.push(arg);
    }
  }

  return args;
}

const args = parseArgs();
const repoRoot = resolve(args.target || process.cwd());
const inspectWorktree = Boolean(args.worktree);
const [baseRef = "origin/main", headRef = "HEAD"] = args._;

function git(commandArgs, options = {}) {
  return execFileSync("git", commandArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", options.quiet ? "ignore" : "pipe"],
  }).trim();
}

function changedFiles() {
  if (!inspectWorktree) {
    return git(["diff", "--name-only", "--merge-base", baseRef, headRef])
      .split("\n")
      .filter(Boolean);
  }

  const changed = new Set();
  const cachedOutput = git(["diff", "--name-only", "--cached"], {
    quiet: true,
  });
  const worktreeOutput = git([
    "ls-files",
    "--modified",
    "--others",
    "--exclude-standard",
  ]);

  for (const file of `${cachedOutput}\n${worktreeOutput}`.split("\n")) {
    if (file) {
      changed.add(file);
    }
  }

  return [...changed];
}

function pathMatches(file, patterns) {
  return patterns.some((pattern) =>
    pattern.endsWith("/") ? file.startsWith(pattern) : file === pattern,
  );
}

function hasFileAtRef(ref, file) {
  if (inspectWorktree || ref === "WORKTREE") {
    return existsSync(join(repoRoot, file));
  }

  try {
    execFileSync("git", ["cat-file", "-e", `${ref}:${file}`], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

const files = changedFiles();
const productChanges = files.filter((file) => pathMatches(file, PRODUCT_PATHS));

if (productChanges.length === 0) {
  console.log("No product roots changed; feature-memory gate passes.");
  process.exit(0);
}

const featureIds = new Set();
const specsPattern = new RegExp(
  `^${SPECS_DIR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/([^/]+)\\/`,
);

for (const file of files) {
  const match = file.match(specsPattern);
  if (match) {
    featureIds.add(match[1]);
  }
}

const changedFileSet = new Set(files);

for (const featureId of featureIds) {
  const requiredFiles = REQUIRED_FEATURE_FILES.map(
    (name) => `${SPECS_DIR}/${featureId}/${name}`,
  );

  const allInDiff = requiredFiles.every((file) => changedFileSet.has(file));
  const allAtHead = requiredFiles.every((file) => hasFileAtRef(headRef, file));

  if (allInDiff && allAtHead) {
    console.log(
      `Feature-memory gate passed via ${SPECS_DIR}/${featureId}/{spec,plan,tasks}.md`,
    );
    process.exit(0);
  }
}

console.error(
  "Product roots changed without a complete feature-memory update.",
);
console.error(`Product changes: ${productChanges.join(", ")}`);
console.error(
  `Touch one ${SPECS_DIR}/<feature-id>/ folder with spec.md, plan.md, and tasks.md in the same PR. Product roots: ${PRODUCT_PATH_LABEL}.`,
);
process.exit(1);
