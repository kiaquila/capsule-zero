#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultEnvFiles = [".env.local", "app/.env.local"];

const groups = {
  web: [
    { name: "NEXT_PUBLIC_APP_URL", kind: "url" },
    { name: "NEXT_PUBLIC_SUPABASE_URL", kind: "url" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", kind: "secret" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", kind: "secret", serverOnly: true },
    { name: "SESSION_SIGNING_SECRET", kind: "secret", serverOnly: true },
  ],
  billing: [
    { name: "LAVA_API_URL", kind: "url" },
    { name: "LAVA_API_KEY", kind: "secret", serverOnly: true },
    {
      name: "LAVA_WEBHOOK_API_KEY",
      kind: "secret",
      serverOnly: true,
      maxLength: 80,
    },
    { name: "LAVA_COINS_5_PRODUCT_ID", kind: "id", serverOnly: true },
    { name: "LAVA_COINS_15_PRODUCT_ID", kind: "id", serverOnly: true },
    { name: "LAVA_COINS_30_PRODUCT_ID", kind: "id", serverOnly: true },
  ],
  image: [
    { name: "PHOTOROOM_API_KEY", kind: "secret", serverOnly: true },
    {
      name: "PHOTOROOM_API_URL",
      kind: "url",
      optional: true,
      defaultValue: "https://sdk.photoroom.com/v1/segment",
    },
    {
      name: "REMOVE_BG_API_KEY",
      kind: "secret",
      serverOnly: true,
      optional: true,
    },
    { name: "EMBEDDING_PROVIDER", kind: "id", optional: true },
  ],
};

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    envFiles: [],
    surfaces: [],
    allowPlaceholders: false,
  };

  const requireValue = (flag, value) => {
    if (value === undefined) {
      throw new Error(`${flag} requires a value.`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--env") {
      args.envFiles.push(requireValue(arg, argv[index + 1]));
      index += 1;
    } else if (arg.startsWith("--env=")) {
      args.envFiles.push(arg.slice("--env=".length));
    } else if (arg === "--surface") {
      args.surfaces.push(...requireValue(arg, argv[index + 1]).split(","));
      index += 1;
    } else if (arg.startsWith("--surface=")) {
      args.surfaces.push(...arg.slice("--surface=".length).split(","));
    } else if (arg === "--allow-placeholders") {
      args.allowPlaceholders = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/check-runtime-env.mjs [--env path] [--surface web,billing] [--allow-placeholders]

Examples:
  node scripts/check-runtime-env.mjs --env app/.env.local
  node scripts/check-runtime-env.mjs --env app/.env.local.example --allow-placeholders
`);
}

function parseEnv(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalized.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    let value = normalized.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function readEnvFiles(paths) {
  const env = {};
  const loaded = [];

  for (const path of paths) {
    const absolutePath = resolve(path);

    if (!existsSync(absolutePath)) {
      continue;
    }

    Object.assign(env, parseEnv(readFileSync(absolutePath, "utf8")));
    loaded.push(path);
  }

  return { env, loaded };
}

function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();

  return (
    !normalized ||
    normalized.includes("replace-with") ||
    normalized.includes("changeme") ||
    /(^|[^a-z0-9])todo([^a-z0-9]|$)/.test(normalized) ||
    /^your[-_]/.test(normalized) ||
    /^x+$/.test(normalized)
  );
}

function validateValue(rule, value, allowPlaceholders) {
  if (allowPlaceholders && isPlaceholder(value)) {
    return [];
  }

  const errors = [];

  if (isPlaceholder(value)) {
    errors.push(`${rule.name} still contains a placeholder value.`);
  }

  if (rule.kind === "url") {
    try {
      new URL(value);
    } catch {
      errors.push(`${rule.name} must be a valid absolute URL.`);
    }
  }

  if (rule.kind === "scheme" && !/^[a-z][a-z0-9+.-]*$/i.test(value)) {
    errors.push(`${rule.name} must be a URI scheme such as capsulezero.`);
  }

  if (rule.kind === "secret" && value.length < 12) {
    errors.push(`${rule.name} looks too short for a real secret.`);
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    errors.push(`${rule.name} must be ${rule.maxLength} characters or less.`);
  }

  return errors;
}

function resolveRuleValue(rule, env) {
  const value = env[rule.name] || (rule.fallback ? env[rule.fallback] : "");

  if (!value && rule.defaultValue) {
    return rule.defaultValue;
  }

  return value;
}

function main() {
  const args = parseArgs();
  const envFiles = args.envFiles.length > 0 ? args.envFiles : defaultEnvFiles;
  const selectedSurfaces =
    args.surfaces.length > 0 ? args.surfaces : Object.keys(groups);
  const unknownSurfaces = selectedSurfaces.filter(
    (surface) => !groups[surface],
  );

  if (unknownSurfaces.length > 0) {
    throw new Error(
      `Unknown runtime surface(s): ${unknownSurfaces.join(", ")}`,
    );
  }

  const { env: fileEnv, loaded } = readEnvFiles(envFiles);
  const env = { ...fileEnv, ...process.env };
  const errors = [];
  const warnings = [];
  const checked = [];

  for (const surface of selectedSurfaces) {
    for (const rule of groups[surface]) {
      const value = resolveRuleValue(rule, env);
      const label = rule.fallback
        ? `${rule.name} (or ${rule.fallback})`
        : rule.name;

      if (!value) {
        if (!rule.optional) {
          errors.push(`${label} is required for ${surface}.`);
        }
        continue;
      }

      const valueErrors = validateValue(rule, value, args.allowPlaceholders);
      checked.push({
        surface,
        name: label,
        serverOnly: rule.serverOnly,
        ok: valueErrors.length === 0,
      });
      errors.push(...valueErrors);
    }
  }

  if (loaded.length === 0 && args.envFiles.length === 0) {
    warnings.push(
      `No default env file found (${defaultEnvFiles.join(", ")}); checked process.env only.`,
    );
  }

  console.log("Runtime env check");
  console.log(
    `Loaded env files: ${loaded.length > 0 ? loaded.join(", ") : "none"}`,
  );
  console.log(`Surfaces: ${selectedSurfaces.join(", ")}`);

  for (const item of checked) {
    const suffix = item.serverOnly ? " [server-only]" : "";
    const status = item.ok ? "ok" : "fail";
    console.log(`[${status}] ${item.surface}: ${item.name}${suffix}`);
  }

  for (const warning of warnings) {
    console.warn(`[warn] ${warning}`);
  }

  if (errors.length > 0) {
    console.error("Runtime env validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Runtime env check passed.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
