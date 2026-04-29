#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SPECS_DIR = ".specify/specs";
const PRODUCT_PATHS = ["app/"];
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
  const output = inspectWorktree
    ? git(["ls-files", "--modified", "--others", "--exclude-standard"])
    : git(["diff", "--name-only", baseRef, headRef]);

  return output.split("\n").filter(Boolean);
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
  console.log("No app product paths changed; feature-memory gate passes.");
  process.exit(0);
}

const featureIds = new Set();
const specsPattern = new RegExp(`^${SPECS_DIR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/([^/]+)\\/`);

for (const file of files) {
  const match = file.match(specsPattern);
  if (match) {
    featureIds.add(match[1]);
  }
}

for (const featureId of featureIds) {
  const requiredFiles = REQUIRED_FEATURE_FILES.map(
    (name) => `${SPECS_DIR}/${featureId}/${name}`,
  );

  if (requiredFiles.every((file) => hasFileAtRef(headRef, file))) {
    console.log(
      `Feature-memory gate passed via ${SPECS_DIR}/${featureId}/{spec,plan,tasks}.md`,
    );
    process.exit(0);
  }
}

console.error("App product paths changed without a complete feature-memory update.");
console.error(`Product changes: ${productChanges.join(", ")}`);
console.error(
  `Touch one ${SPECS_DIR}/<feature-id>/ folder with spec.md, plan.md, and tasks.md in the same PR.`,
);
process.exit(1);
