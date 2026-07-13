#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--target") {
      args.target = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--target=")) {
      args.target = arg.slice("--target=".length);
    }
  }

  return args;
}

const args = parseArgs();
const root = resolve(args.target || process.cwd());
const missing = [];
const errors = [];

function fullPath(path) {
  return join(root, path);
}

function requirePath(path) {
  if (!existsSync(fullPath(path))) {
    missing.push(path);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(fullPath(path), "utf8"));
}

function requireFileContains(path, requiredText) {
  if (!existsSync(fullPath(path))) {
    missing.push(path);
    return;
  }

  const contents = readFileSync(fullPath(path), "utf8");
  if (!contents.includes(requiredText)) {
    errors.push(`${path} must include ${JSON.stringify(requiredText)}.`);
  }
}

[
  "AGENTS.md",
  "CLAUDE.md",
  "package.json",
  ".specify/memory/constitution.md",
  ".specify/specs/001-capsule-zero-mvp/spec.md",
  "docs_capsule_zero/project/frontend/frontend-docs.md",
  "docs_capsule_zero/project/backend/backend-docs.md",
  "docs_capsule_zero/project/devops/github-ci-and-branch-protection.md",
  "docs_capsule_zero/project/devops/github-hosted-ai-review.md",
  "docs_capsule_zero/project/devops/review-contract.md",
  "scripts/ai-review-gate.mjs",
  "scripts/check-feature-memory.mjs",
  "scripts/check-repo-baseline.mjs",
  "scripts/resolve-pr-context.mjs",
  ".github/workflows/ai-review.yml",
  ".github/workflows/ci.yml",
  ".github/workflows/osv-scan.yml",
  ".github/workflows/pr-guard.yml",
  ".github/workflows/test.yml",
  "app/package.json",
  "app/package-lock.json",
].forEach(requirePath);

requireFileContains(".github/workflows/ci.yml", "name: baseline-checks");
requireFileContains(".github/workflows/pr-guard.yml", "name: guard");
requireFileContains(".github/workflows/pr-guard.yml", "Checkout trusted gate scripts");
requireFileContains(".github/workflows/ai-review.yml", "name: AI Review");
requireFileContains(".github/workflows/ai-review.yml", "runs-on: ubuntu-latest");
requireFileContains(".github/workflows/ai-review.yml", "Checkout trusted gate scripts");
requireFileContains(".github/workflows/ai-review.yml", "AI_REVIEW_HEAD_SHA");
requireFileContains(".github/workflows/osv-scan.yml", "name: osv-scan");
requireFileContains(".github/workflows/osv-scan.yml", "google/osv-scanner-action");
requireFileContains(".github/workflows/test.yml", "name: test");

if (missing.length === 0 && existsSync(fullPath("package.json"))) {
  const packageJson = readJson("package.json");

  if (!packageJson.packageManager?.startsWith("npm@")) {
    errors.push("package.json must pin packageManager to npm@<version>.");
  }

  for (const script of ["check:feature-memory", "check:repo", "preflight"]) {
    if (!packageJson.scripts?.[script]) {
      errors.push(`package.json must define the ${script} script.`);
    }
  }
}

if (existsSync(fullPath("app/package.json"))) {
  const appPackageJson = readJson("app/package.json");

  for (const script of ["typecheck", "build"]) {
    if (!appPackageJson.scripts?.[script]) {
      errors.push(`app/package.json must define the ${script} script.`);
    }
  }
}

if (missing.length > 0) {
  console.error("Missing required baseline files:");
  for (const path of missing) {
    console.error(`- ${path}`);
  }
}

if (errors.length > 0) {
  console.error("Repository baseline validation errors:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
}

if (missing.length > 0 || errors.length > 0) {
  process.exit(1);
}

console.log("Repository baseline check passed.");
