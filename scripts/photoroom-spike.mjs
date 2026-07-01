#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const defaultEndpoint = "https://sdk.photoroom.com/v1/segment";

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    images: [],
    outputDir: ".runtime/photoroom",
    markdown: ".runtime/photoroom/results.md",
    format: "png",
    size: "full",
    endpoint: process.env.PHOTOROOM_API_URL || defaultEndpoint,
  };

  const requireValue = (flag, value) => {
    if (value === undefined) {
      throw new Error(`${flag} requires a value.`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--image") {
      args.images.push(requireValue(arg, argv[index + 1]));
      index += 1;
    } else if (arg.startsWith("--image=")) {
      args.images.push(arg.slice("--image=".length));
    } else if (arg === "--output-dir") {
      args.outputDir = requireValue(arg, argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--output-dir=")) {
      args.outputDir = arg.slice("--output-dir=".length);
    } else if (arg === "--markdown") {
      args.markdown = requireValue(arg, argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--markdown=")) {
      args.markdown = arg.slice("--markdown=".length);
    } else if (arg === "--format") {
      args.format = requireValue(arg, argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--format=")) {
      args.format = arg.slice("--format=".length);
    } else if (arg === "--size") {
      args.size = requireValue(arg, argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--size=")) {
      args.size = arg.slice("--size=".length);
    } else if (arg === "--endpoint") {
      args.endpoint = requireValue(arg, argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--endpoint=")) {
      args.endpoint = arg.slice("--endpoint=".length);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      args.images.push(arg);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  PHOTOROOM_API_KEY=... node scripts/photoroom-spike.mjs --image ./samples/coat.jpg --image ./samples/shoes.webp

Options:
  --format png|jpg|webp       Output format. Default: png
  --size preview|medium|hd|full
                              Photoroom output size. Default: full
  --output-dir path           Directory for processed images. Default: .runtime/photoroom
  --markdown path             Markdown summary path. Default: .runtime/photoroom/results.md
`);
}

function mimeType(path) {
  const extension = extname(path).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  if (extension === ".heic") {
    return "image/heic";
  }

  return "image/png";
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(
    0,
    Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function outputName(imagePath, format) {
  const name = basename(imagePath).replace(/[^a-z0-9._-]/gi, "_");
  return `${name.replace(/\.[^.]+$/, "")}.photoroom.${format}`;
}

async function processImage({
  imagePath,
  outputDir,
  endpoint,
  apiKey,
  format,
  size,
}) {
  const absolutePath = resolve(imagePath);
  const bytes = await readFile(absolutePath);
  const body = new FormData();
  const startedAt = performance.now();

  body.append(
    "image_file",
    new Blob([bytes], { type: mimeType(imagePath) }),
    basename(imagePath),
  );
  body.append("format", format);
  body.append("size", size);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body,
  });

  const durationMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    const errorText = await response.text();
    return {
      imagePath,
      ok: false,
      durationMs,
      outputPath: "",
      error: `${response.status} ${response.statusText}: ${errorText.slice(0, 300)}`,
    };
  }

  const result = Buffer.from(await response.arrayBuffer());
  const outputPath = join(outputDir, outputName(imagePath, format));
  await writeFile(outputPath, result);

  return {
    imagePath,
    ok: true,
    durationMs,
    outputPath,
    error: "",
  };
}

function renderMarkdown({ args, results }) {
  const successfulDurations = results
    .filter((result) => result.ok)
    .map((result) => result.durationMs);
  const failedCount = results.filter((result) => !result.ok).length;
  const p50 = percentile(successfulDurations, 50);
  const p95 = percentile(successfulDurations, 95);
  const p99 = percentile(successfulDurations, 99);
  const latencyPass = successfulDurations.length > 0 && p99 <= 5000;
  const date = new Date().toISOString();
  const rows = results
    .map((result) =>
      [
        basename(result.imagePath),
        result.ok ? "ok" : "failed",
        result.durationMs,
        result.outputPath || "-",
        result.error.replace(/\|/g, "\\|") || "-",
      ].join(" | "),
    )
    .join("\n");

  return `# Photoroom Background Removal Spike

Date: ${date}
Endpoint: \`${args.endpoint}\`
Format: \`${args.format}\`
Size: \`${args.size}\`
Gate: P99 <= 5000 ms on representative wardrobe images, with founder-approved visual quality.

## Summary

| Metric | Value |
|---|---:|
| Samples | ${results.length} |
| Successful | ${successfulDurations.length} |
| Failed | ${failedCount} |
| P50 duration | ${p50} ms |
| P95 duration | ${p95} ms |
| P99 duration | ${p99} ms |
| Latency gate | ${latencyPass ? "PASS" : "FAIL"} |

## Samples

image | status | duration_ms | output | error
--- | --- | ---: | --- | ---
${rows}

## Quality Review

- [ ] Subject edges preserve garment shape.
- [ ] Fabric texture and garment color remain credible.
- [ ] Hair/fur/fringe/transparent elements, if present, are acceptable.
- [ ] Output works on Capsule Zero achromatic/glass UI backgrounds.
- [ ] Founder signs off on representative quality.

## Decision

- [ ] Keep Photoroom as primary provider for v0.1.
- [ ] Switch adapter to remove.bg for v0.1.
- [ ] Keep Photoroom primary, but add async polling/retry fallback before broad testing.
`;
}

async function main() {
  const args = parseArgs();
  const apiKey = process.env.PHOTOROOM_API_KEY;

  if (!apiKey) {
    throw new Error("PHOTOROOM_API_KEY is required.");
  }

  if (args.images.length === 0) {
    throw new Error("Provide at least one --image path.");
  }

  await mkdir(args.outputDir, { recursive: true });
  await mkdir(dirname(resolve(args.markdown)), { recursive: true });

  const results = [];

  for (const imagePath of args.images) {
    console.log(`Processing ${imagePath}...`);
    results.push(
      await processImage({
        imagePath,
        outputDir: args.outputDir,
        endpoint: args.endpoint,
        apiKey,
        format: args.format,
        size: args.size,
      }),
    );
  }

  await writeFile(args.markdown, renderMarkdown({ args, results }));
  console.log(`Wrote ${args.markdown}`);

  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
